import { z } from "zod";
import { publicProcedure, adminProcedure } from "../orpc";

const localizedLabel = z.record(z.string(), z.string());

export const categoriesRouter = {
  /** Full category tree with attribute definitions. */
  tree: publicProcedure.handler(async ({ context }) => {
    const categories = await context.db.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { attributes: { orderBy: { order: "asc" } } },
    });
    return categories;
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input, context }) => {
      return context.db.category.findUnique({
        where: { slug: input.slug },
        include: {
          attributes: { orderBy: { order: "asc" } },
          children: { orderBy: { order: "asc" } },
        },
      });
    }),

  upsert: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        slug: z.string().min(1),
        name: localizedLabel,
        icon: z.string().optional(),
        parentId: z.string().nullish(),
        order: z.number().int().default(0),
        isActive: z.boolean().default(true),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...data } = input;
      return context.db.category.upsert({
        where: id ? { id } : { slug: input.slug },
        update: data,
        create: data,
      });
    }),
};
