import { z } from "zod";
import type { Prisma } from "@atria/db";
import { publicProcedure } from "../orpc";

export const searchRouter = {
  listings: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        categorySlug: z.string().optional(),
        type: z.enum(["RENT", "SALE"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
        verifiedOnly: z.boolean().optional(),
        // Equality filters against dynamic attributes, e.g. { fuel: "electric" }
        attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
        sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(60).default(24),
      }),
    )
    .handler(async ({ input, context }) => {
      const where: Prisma.ListingWhereInput = {
        status: "ACTIVE",
        ...(input.type ? { type: input.type } : {}),
        ...(input.country ? { country: input.country } : {}),
        ...(input.city ? { city: input.city } : {}),
        ...(input.verifiedOnly ? { verificationStatus: "VERIFIED" } : {}),
      };

      if (input.categorySlug) {
        where.category = { slug: input.categorySlug };
      }

      if (input.minPrice != null || input.maxPrice != null) {
        where.price = {
          ...(input.minPrice != null ? { gte: input.minPrice } : {}),
          ...(input.maxPrice != null ? { lte: input.maxPrice } : {}),
        };
      }

      if (input.q) {
        where.OR = [
          { title: { contains: input.q, mode: "insensitive" } },
          { description: { contains: input.q, mode: "insensitive" } },
        ];
      }

      if (input.attributes) {
        where.AND = Object.entries(input.attributes).map(([key, value]) => ({
          attributes: { path: [key], equals: value as Prisma.InputJsonValue },
        }));
      }

      const orderBy: Prisma.ListingOrderByWithRelationInput =
        input.sort === "price_asc"
          ? { price: "asc" }
          : input.sort === "price_desc"
            ? { price: "desc" }
            : { createdAt: "desc" };

      const [total, items] = await Promise.all([
        context.db.listing.count({ where }),
        context.db.listing.findMany({
          where,
          orderBy: [{ isFeatured: "desc" }, orderBy],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: {
            media: { where: { isCover: true }, take: 1 },
            category: { select: { slug: true, name: true } },
          },
        }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        pages: Math.ceil(total / input.pageSize),
      };
    }),
};
