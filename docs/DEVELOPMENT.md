# Atria — Development & Deployment

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.1 (`bun --version`)
- A PostgreSQL server (a local native install is used — no Docker)

## Local setup

```bash
# 1. Install dependencies
bun install

# 2. Environment
cp .env.example .env            # also copy to apps/web/.env for Next.js
#   -> set DATABASE_URL / DIRECT_URL to your local Postgres, BETTER_AUTH_SECRET, etc.

# 3. Create the database (once), using your local Postgres superuser
#    e.g. with psql:  CREATE DATABASE atria;
createdb -U postgres atria      # or run the SQL above in psql / pgAdmin

# 4. Generate client + create schema + seed categories
bun run db:generate
bun run db:migrate              # creates the initial migration
bun run db:seed                 # seeds Real Estate / Vehicles categories + attributes

# 5. Run the app
bun run dev                     # http://localhost:3000
```

> Next.js reads env from `apps/web/.env`. Keep it in sync with the root `.env`.
> Prisma's CLI reads `packages/db/.env`. All three should point at the same database.

### Database connection

This project uses your machine's **native PostgreSQL** (default port `5432`) — no
Docker. Set the connection string in the `.env` files:

```
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/atria?schema=public"
DIRECT_URL="postgresql://postgres:<password>@localhost:5432/atria?schema=public"
```

Any PostgreSQL works (local install, Neon, Supabase, Railway). Just point the URL at it.

## Useful commands

| Command | Description |
| ------- | ----------- |
| `bun run dev` | Run web app + watch packages (Turborepo) |
| `bun run build` | Production build of all packages/app |
| `bun run typecheck` | Type-check every workspace |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:migrate` | Create/apply a dev migration |
| `bun run db:seed` | Seed categories + attribute definitions |

> Bun runs the workspace tasks; Turborepo orchestrates the task graph.
> Per-package commands use Bun filters, e.g. `bun --filter @atria/db generate`.

## Creating an admin user

1. Sign up in the app (becomes `BUYER`).
2. Promote via Prisma Studio (`bun run db:studio` → `user` → set `role` = `ADMIN`),
   or SQL: `UPDATE "user" SET role='ADMIN' WHERE email='you@example.com';`
3. Visit `/admin` for the verification queue and user management.

## Storage (images & documents)

The app uploads via S3 presigned URLs:

- **Public bucket** (`S3_BUCKET_PUBLIC`) — listing images.
- **Private bucket** (`S3_BUCKET_PRIVATE`) — legal documents (Derechos Reales,
  títulos). Access is only ever through short-lived signed URLs granted to the
  owner and admins.

Works with any S3-compatible provider (Cloudflare R2, AWS S3, MinIO).

## Payments (Stripe)

1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Forward webhooks in dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
3. Sellers "Feature" a listing from the dashboard → Stripe Checkout → webhook marks
   it featured for 30 days.

## Deployment

- **Web**: Vercel (project root `apps/web`, or the monorepo preset). Add env vars.
- **Database**: any managed Postgres (Neon / Supabase / Railway). Set `DATABASE_URL`
  (pooled) and `DIRECT_URL` (direct) for migrations.
- **Storage**: Cloudflare R2 or AWS S3 with two buckets (public + private).
- Run `prisma migrate deploy` on release.

## Architecture

```
apps/web      Next.js 15 (App Router) — UI + /rpc + /api/auth + webhooks
packages/db   Prisma schema, client singleton, seed
packages/api  oRPC routers (listings, search, verification, messaging, payments…)
packages/auth Better Auth (Buyer/Seller/Admin roles)
```

The oRPC router is mounted inside Next.js. Because oRPC is transport-agnostic, it
can later be extracted to a standalone server (e.g. for a mobile app) with a
one-line change.
