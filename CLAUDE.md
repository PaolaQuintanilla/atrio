# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack & toolchain

Bun (package manager **and** TS runtime) + Turborepo monorepo. Fully TypeScript end-to-end:
Next.js 15 (App Router) · oRPC · Prisma + PostgreSQL · Better Auth · next-intl · Tailwind v4.
The database is a **native local PostgreSQL** (no Docker), default port `5432`.

## Commands

```bash
bun install                          # install (uses Bun workspaces, not pnpm)
bun run dev                          # turbo: run app + watch packages (http://localhost:3000)
bun run build                        # production build
bun run typecheck                    # tsc --noEmit across all 4 packages
bun run lint                         # eslint (web app)
bun run test                         # turbo: bun test in packages that define it

# Database (Prisma) — all proxy into packages/db via bun --filter
bun run db:generate                  # generate Prisma client (REQUIRED before typecheck/build)
bun run db:migrate                   # prisma migrate dev
bun run db:seed                      # seed categories + demo listings
bun run db:studio                    # Prisma Studio

# Per-package / single targets
bun --filter @atria/web lint
bun --filter @atria/api test         # run one package's tests
bun test packages/api/src/lib/attributes.test.ts   # run a single test file
```

After changing `schema.prisma`, run `bun run db:generate` or types won't reflect the change
(typecheck/build will fail referencing stale `@prisma/client`).

## Environment (.env) — important gotcha

There are **three** env files that must be kept in sync (same DB credentials):

- `.env` — Prisma scripts / general
- `packages/db/.env` — **Prisma CLI** reads this for `migrate`/`seed` (a mismatch here is the
  usual cause of "authentication failed" during migrate)
- `apps/web/.env` — the running Next.js app

All point at the same Postgres. `.env.example` lists every variable.

## Architecture

```
apps/web      Next.js 15 — UI, i18n, and the /rpc (oRPC), /api/auth (Better Auth), Stripe webhook handlers
packages/db   Prisma schema (18 models), client singleton, migrations, seed
packages/api  oRPC routers + business logic (the "backend")
packages/auth Better Auth instance (server + client)
```

### oRPC: two clients, one router
The router (`packages/api/src/router.ts`) is mounted in Next.js at `app/rpc/[[...rest]]/route.ts`.
Two ways to call it:
- **Server Components / actions**: `apps/web/src/lib/orpc/server.ts` uses `createRouterClient`
  — calls the router **directly, no HTTP hop**, forwarding request headers for the session.
- **Client Components**: `apps/web/src/lib/orpc/client.ts` uses an HTTP `RPCLink` + TanStack
  Query (`orpc.<router>.<proc>.queryOptions(...)`).

Because oRPC is transport-agnostic, the API can later move to a standalone server with a one-line change.

### Auth & role-gating
Procedures in `packages/api/src/orpc.ts` are the access-control layer:
`publicProcedure` → `authedProcedure` → `sellerProcedure` / `adminProcedure`. A session middleware
resolves the Better Auth session and injects `{ db, user, session }` into context; `authedProcedure`
also rejects **banned** users. `User.role` is a plain `String` ("BUYER" | "SELLER" | "ADMIN") for
Better Auth compatibility — allowed values are enforced in the API layer, not by a DB enum.

### Dynamic categories (core domain idea)
Listings are not hard-coded per type. A `Category` owns `AttributeDefinition`s (key, type, unit,
enum options, required), and each `Listing.attributes` stores values as **JSONB**, validated by
`validateListingAttributes` (`packages/api/src/lib/attributes.ts`) against the category's definitions.
Adding a listing type/field is data (seed/admin), not code. Search filters attributes via Postgres
JSON path queries (`packages/api/src/routers/search.ts`).

### i18n
next-intl with locale-prefixed routes (`apps/web/src/i18n/routing.ts`; locales: es default, en, pt,
zh, ru). UI strings live in `apps/web/messages/<locale>.json`. **User-generated content** (category
names, attribute labels) is stored as a translatable JSON map and read with the `localized(value,
locale)` helper (`apps/web/src/lib/utils.ts`) — not via message catalogs.

### Storage & verification
Images go to a **public** bucket; legal documents (Derechos Reales) go to a **private** bucket and
are only ever served through short-lived signed URLs (`packages/api/src/lib/storage.ts`). Uploading a
document moves a listing to `PENDING`; an admin approves/rejects in the verification queue, which sets
the "Verified" badge and writes a `VerificationReview` audit row.

## Conventions / gotchas

- **Internal package imports are extensionless** (`from "../orpc"`, not `"../orpc.js"`). The packages
  are consumed as TS source via Next's `transpilePackages`; `.js` specifiers break the webpack build.
- Pages under `apps/web/src/app/[locale]` are **force-dynamic** (set in the locale layout) because they
  read the session and live data — they are not statically prerendered.
- Turbo requires the root `package.json#packageManager` field (`bun@…`) to resolve workspaces.
- `Listing.attributes` writes must be cast to `Prisma.InputJsonValue`.
- This is a Windows environment; prefer the Bash tool for git/unix-style scripting.
