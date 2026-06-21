import { os, ORPCError } from "@orpc/server";
import { auth, type Role } from "@atria/auth";
import { prisma } from "@atria/db";

/** Context supplied by the transport layer (Next.js route handler). */
export type InitialContext = {
  headers: Headers;
};

/** Minimal shape for ownership checks; `role` is nullable on the auth user. */
export type OwnerUser = { id: string; role?: string | null };

const base = os.$context<InitialContext>();

/**
 * Resolves the Better Auth session (if any) and injects it plus the db client
 * into context. Runs for every procedure so handlers can read `context.user`.
 */
const withSession = base.middleware(async ({ context, next }) => {
  const result = await auth.api.getSession({ headers: context.headers });
  return next({
    context: {
      db: prisma,
      session: result?.session ?? null,
      user: result?.user ?? null,
    },
  });
});

/** Public procedure - no auth required, but session is available if present. */
export const publicProcedure = base.use(withSession);

/** Requires an authenticated user. */
export const authedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Authentication required." });
  }
  return next({ context: { user: context.user } });
});

function requireRole(...roles: Role[]) {
  return authedProcedure.use(({ context, next }) => {
    const role = context.user.role as Role;
    if (!roles.includes(role)) {
      throw new ORPCError("FORBIDDEN", { message: "Insufficient permissions." });
    }
    return next({ context: { user: context.user } });
  });
}

/** A user acting as a seller (sellers and admins qualify). */
export const sellerProcedure = requireRole("SELLER", "ADMIN");

/** Admin-only procedure. */
export const adminProcedure = requireRole("ADMIN");

export { ORPCError };
