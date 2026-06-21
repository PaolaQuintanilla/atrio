import { z } from "zod";
import { adminProcedure } from "../orpc";
import { ROLES } from "@atria/auth";

export const adminRouter = {
  stats: adminProcedure.handler(async ({ context }) => {
    const [users, listings, pending, verified] = await Promise.all([
      context.db.user.count(),
      context.db.listing.count(),
      context.db.listing.count({ where: { verificationStatus: "PENDING" } }),
      context.db.listing.count({ where: { verificationStatus: "VERIFIED" } }),
    ]);
    return { users, listings, pendingVerification: pending, verified };
  }),

  listUsers: adminProcedure
    .input(z.object({ q: z.string().optional(), page: z.number().int().min(1).default(1) }).default({ page: 1 }))
    .handler(async ({ input, context }) => {
      const pageSize = 25;
      const where = input.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" as const } },
              { email: { contains: input.q, mode: "insensitive" as const } },
            ],
          }
        : {};
      const [total, items] = await Promise.all([
        context.db.user.count({ where }),
        context.db.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * pageSize,
          take: pageSize,
          select: { id: true, name: true, email: true, role: true, createdAt: true, banned: true },
        }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / pageSize) };
    }),

  setRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(ROLES) }))
    .handler(async ({ input, context }) => {
      return context.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, role: true },
      });
    }),

  setBanned: adminProcedure
    .input(z.object({ userId: z.string(), banned: z.boolean(), reason: z.string().optional() }))
    .handler(async ({ input, context }) => {
      return context.db.user.update({
        where: { id: input.userId },
        data: { banned: input.banned, banReason: input.banned ? input.reason : null },
        select: { id: true, banned: true },
      });
    }),
};
