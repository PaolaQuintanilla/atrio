import { z } from "zod";
import { authedProcedure } from "../orpc";

export const favoritesRouter = {
  toggle: authedProcedure
    .input(z.object({ listingId: z.string() }))
    .handler(async ({ input, context }) => {
      const existing = await context.db.favorite.findUnique({
        where: { userId_listingId: { userId: context.user.id, listingId: input.listingId } },
      });
      if (existing) {
        await context.db.favorite.delete({ where: { id: existing.id } });
        return { favorited: false };
      }
      await context.db.favorite.create({
        data: { userId: context.user.id, listingId: input.listingId },
      });
      return { favorited: true };
    }),

  ids: authedProcedure.handler(async ({ context }) => {
    const favs = await context.db.favorite.findMany({
      where: { userId: context.user.id },
      select: { listingId: true },
    });
    return favs.map((f) => f.listingId);
  }),
};
