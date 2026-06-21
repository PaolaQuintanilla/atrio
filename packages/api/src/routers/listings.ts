import { z } from "zod";
import { Prisma } from "@atria/db";
import { publicProcedure, authedProcedure, sellerProcedure, ORPCError, type OwnerUser } from "../orpc";
import { validateListingAttributes } from "../lib/attributes";
import { CURRENCIES, LOCALES } from "../lib/constants";

const listingInput = z.object({
  categoryId: z.string(),
  type: z.enum(["RENT", "SALE"]),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(5000),
  price: z.number().nonnegative(),
  currency: z.enum(CURRENCIES).default("USD"),
  attributes: z.record(z.string(), z.unknown()).default({}),
  country: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  address: z.string().max(240).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sourceLocale: z.enum(LOCALES).default("es"),
});

async function assertOwnerOrAdmin(
  db: typeof import("@atria/db").prisma,
  listingId: string,
  user: OwnerUser,
) {
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new ORPCError("NOT_FOUND", { message: "Listing not found." });
  if (listing.sellerId !== user.id && user.role !== "ADMIN") {
    throw new ORPCError("FORBIDDEN", { message: "You do not own this listing." });
  }
  return listing;
}

export const listingsRouter = {
  /** Public detail view; increments view count. */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const listing = await context.db.listing.findUnique({
        where: { id: input.id },
        include: {
          media: { orderBy: { order: "asc" } },
          category: { include: { attributes: { orderBy: { order: "asc" } } } },
          seller: { select: { id: true, name: true, image: true } },
        },
      });
      if (!listing) throw new ORPCError("NOT_FOUND");
      await context.db.listing.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      });
      return listing;
    }),

  /** Current seller's own listings. */
  mine: sellerProcedure.handler(async ({ context }) => {
    return context.db.listing.findMany({
      where: { sellerId: context.user.id },
      orderBy: { updatedAt: "desc" },
      include: { media: { where: { isCover: true }, take: 1 } },
    });
  }),

  create: sellerProcedure.input(listingInput).handler(async ({ input, context }) => {
    const { attributes: rawAttributes, ...rest } = input;
    const category = await context.db.category.findUnique({
      where: { id: input.categoryId },
      include: { attributes: true },
    });
    if (!category) throw new ORPCError("BAD_REQUEST", { message: "Unknown category." });

    const attributes = validateListingAttributes(
      category.attributes,
      rawAttributes,
    ) as Prisma.InputJsonValue;

    return context.db.listing.create({
      data: {
        ...rest,
        attributes,
        sellerId: context.user.id,
        status: "DRAFT",
      },
    });
  }),

  update: sellerProcedure
    .input(listingInput.partial().extend({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { id, attributes: rawAttributes, ...rest } = input;
      const existing = await assertOwnerOrAdmin(context.db, id, context.user);

      let attributes: Prisma.InputJsonValue | undefined;
      if (rawAttributes) {
        const category = await context.db.category.findUnique({
          where: { id: rest.categoryId ?? existing.categoryId },
          include: { attributes: true },
        });
        attributes = validateListingAttributes(
          category?.attributes ?? [],
          rawAttributes,
        ) as Prisma.InputJsonValue;
      }

      return context.db.listing.update({
        where: { id },
        data: { ...rest, ...(attributes !== undefined ? { attributes } : {}) },
      });
    }),

  /** Move a listing between DRAFT and ACTIVE (or archive it). */
  setStatus: sellerProcedure
    .input(z.object({ id: z.string(), status: z.enum(["DRAFT", "ACTIVE", "SOLD", "RENTED", "ARCHIVED"]) }))
    .handler(async ({ input, context }) => {
      await assertOwnerOrAdmin(context.db, input.id, context.user);
      return context.db.listing.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: sellerProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await assertOwnerOrAdmin(context.db, input.id, context.user);
      await context.db.listing.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  /** Listings the current user has favorited. */
  favorites: authedProcedure.handler(async ({ context }) => {
    const favs = await context.db.favorite.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { media: { where: { isCover: true }, take: 1 } } } },
    });
    return favs.map((f) => f.listing);
  }),
};
