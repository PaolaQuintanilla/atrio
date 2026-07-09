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

## Storage (AWS S3 + CloudFront)

The app uploads via S3 presigned URLs (`packages/api/src/lib/storage.ts`):

- **Public bucket** (`S3_BUCKET_PUBLIC`) — listing images and profile avatars
  (`avatars/<userId>/<file>`), served through CloudFront.
- **Private bucket** (`S3_BUCKET_PRIVATE`) — legal documents (Derechos Reales,
  títulos). Access is only ever through short-lived signed URLs granted to the
  owner and admins — never public.

Works with any S3-compatible provider (Cloudflare R2, AWS S3, MinIO); the deployed
instance uses **real AWS S3** in `sa-east-1` (São Paulo). What was provisioned:

| Resource | Name / ID | Purpose |
| --- | --- | --- |
| S3 bucket | `atria-public-<accountId>` | Listing images, avatars — Block Public Access **fully on** |
| S3 bucket | `atria-private-<accountId>` | Legal documents — Block Public Access **fully on** |
| CloudFront distribution | fronts the public bucket only | CDN + the only path that can read the public bucket |
| Origin Access Control (OAC) | `atria-public-oac` | Lets CloudFront read the public bucket via a scoped bucket policy (`AWS:SourceArn` = this distribution) — the bucket itself stays private |
| IAM user | `atria-app` | Holds the app's runtime credentials (`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`), scoped to `s3:PutObject`/`GetObject`/`DeleteObject`/`ListBucket` on just these two buckets, plus `ses:SendEmail`/`SendRawEmail` |

Both buckets have CORS enabled for `PUT`/`GET` from the app's origin (update
`AllowedOrigins` when a production domain exists — currently `localhost:3000` only).

`S3_PUBLIC_URL` in `.env` is the CloudFront domain (e.g.
`https://<distribution-id>.cloudfront.net`) — `storage.ts`'s `publicUrl()` uses it as an
override, so every upload automatically resolves through the CDN, never the raw S3 URL.

### Checking it in the AWS Console

- **S3 buckets**: Console → **S3** → find `atria-public-<accountId>` /
  `atria-private-<accountId>`. "Permissions" tab → confirm all four "Block public access"
  toggles are **On**. On the public bucket, "Permissions" → "Bucket policy" should show a
  single statement granting `s3:GetObject` to principal `cloudfront.amazonaws.com`,
  conditioned on `AWS:SourceArn` matching the CloudFront distribution's ARN — that's the
  only way objects are ever read.
- **CloudFront**: Console → **CloudFront** → **Distributions** → the one distribution
  listed. "Status" should read **Enabled / Deployed** (it starts as "In Progress" for the
  first 5–15 minutes after creation). The "Origins" tab shows the public bucket as the
  origin with "Origin access control" set to `atria-public-oac`. Open the distribution's
  domain name + an object key in a browser (e.g.
  `https://<distribution>.cloudfront.net/avatars/<userId>/<file>`) to confirm an image
  loads — the response header `x-cache` will read `Miss from cloudfront` on first load,
  `Hit from cloudfront` on repeat loads.
- **IAM**: Console → **IAM** → **Users** → `atria-app`. "Permissions" tab shows the inline
  policy scoped to the two bucket ARNs plus SES send actions. "Security credentials" tab
  lists the access key currently in `.env` (`S3_ACCESS_KEY_ID` = the key ID shown here).
- Do **not** use root account access keys for the app's runtime credentials — if you
  bootstrapped this setup while signed in as root, delete that root access key afterward
  (Console → account name, top right → **Security credentials** → "Root user access keys").

## Email (AWS SES)

Better Auth's `emailVerification.sendVerificationEmail` and
`emailAndPassword.sendResetPassword` hooks (`packages/auth/src/index.ts`) call a small SES
wrapper (`packages/auth/src/lib/email.ts`) to send the actual emails — no other provider
(Resend/SMTP) is wired up.

Required env vars: `SES_REGION`, `SES_FROM_EMAIL`, `SES_ACCESS_KEY_ID`,
`SES_SECRET_ACCESS_KEY` (the same IAM user/key as the S3 vars works fine, since `atria-app`
already has `ses:SendEmail` permission).

**SES starts in sandbox mode** for every new AWS account: you can only send *from* a
verified identity, and can only send *to* a verified identity too (recipients aren't
automatically allowed). This is enough to test with your own inbox, but real users won't
receive emails until you request production access.

### Checking it in the AWS Console

- **Verified identities**: Console → **SES** → **Verified identities**. `SES_FROM_EMAIL`
  should show status **Verified** (AWS emails a confirmation link on
  `aws ses verify-email-identity` / when you create the identity in the console — click it,
  the console won't flip to "Verified" until you do).
- **Sandbox status**: Console → **SES** → **Account dashboard**. "Sending statistics" area
  shows "Your account is in the sandbox" with a **Request production access** button —
  use it before launch.
- **Sending failures**: Console → **SES** → **Reputation** → **Suppression list**, or check
  the app's server logs for `MessageRejected: Email address is not verified` — that error
  means either the `SES_FROM_EMAIL` or the recipient isn't verified yet (expected in
  sandbox mode until both sides click their confirmation links).

## Payments (Stripe)

1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Forward webhooks in dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
3. Sellers "Feature" a listing from the dashboard → Stripe Checkout → webhook marks
   it featured for 30 days.

## Deployment

- **Web**: Vercel (project root `apps/web`, or the monorepo preset). Add env vars.
- **Database**: any managed Postgres (Neon / Supabase / Railway). Set `DATABASE_URL`
  (pooled) and `DIRECT_URL` (direct) for migrations.
- **Storage**: AWS S3 (two buckets, public behind CloudFront) or Cloudflare R2 — see
  [Storage (AWS S3 + CloudFront)](#storage-aws-s3--cloudfront) above.
- **Email**: AWS SES — request production access before real users sign up (still
  sandboxed otherwise). See [Email (AWS SES)](#email-aws-ses) above.
- When adding a production domain, update the CORS `AllowedOrigins` on both S3 buckets.
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
