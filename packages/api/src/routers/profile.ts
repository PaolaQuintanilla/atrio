import { z } from "zod";
import { authedProcedure } from "../orpc";
import { LOCALES } from "../lib/constants";

export const profileRouter = {
  me: authedProcedure.handler(async ({ context }) => {
    const profile = await context.db.profile.findUnique({
      where: { userId: context.user.id },
    });
    return { user: context.user, profile };
  }),

  /** Promote the current BUYER account to SELLER so they can post listings. */
  becomeSeller: authedProcedure.handler(async ({ context }) => {
    if (context.user.role === "BUYER") {
      await context.db.user.update({ where: { id: context.user.id }, data: { role: "SELLER" } });
    }
    return { role: "SELLER" as const };
  }),

  update: authedProcedure
    .input(
      z.object({
        displayName: z.string().max(120).optional(),
        phone: z.string().max(40).optional(),
        avatarUrl: z.string().url().optional(),
        locale: z.enum(LOCALES).optional(),
        country: z.string().max(80).optional(),
        city: z.string().max(120).optional(),
        bio: z.string().max(1000).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      return context.db.profile.upsert({
        where: { userId: context.user.id },
        update: input,
        create: { userId: context.user.id, ...input },
      });
    }),
};
