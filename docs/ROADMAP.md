# Atria — Roadmap & Missing Work

Status snapshot (current): the app is **feature-complete and runs end-to-end** on Bun +
native PostgreSQL. It builds, type-checks across all 4 packages, migrates, seeds, serves all
5 locales, and the oRPC API responds over HTTP. What remains is wiring external services,
hardening, tests/CI, polish, and — most important for job-hunting — a live demo.

Legend: `[ ]` todo · effort **S**(<1h) **M**(half-day) **L**(1–2 days) · impact ⭐ (recruiter-facing).

---

## P0 — Quick wins (do first; high signal, low effort)

- [x] **Initialize git** ⭐ — done (`git init`, initial commit on `main`, 118 files, `.env` excluded).
  - [ ] **Push to GitHub** — still needed (create the remote repo + `git push`); foundation for CI/live demo.

- [x] **ESLint configuration** — done. Flat config `apps/web/eslint.config.mjs`
  (`next/core-web-vitals` + `next/typescript`); `bun run lint` passes.

- [x] **Enforce banned users in auth** — done. `banned`/`banExpires` surfaced on the session
  (`packages/auth/src/index.ts`) and rejected in `authedProcedure` (`packages/api/src/orpc.ts`).

- [x] **Server-side upload limits** — done. `UPLOAD_LIMITS` (size + MIME) enforced in
  `media.ts` and `documents.ts`; clients now send `sizeBytes`.

- [x] **Seed realistic demo listings (with images)** ⭐ — done. Demo seller + 8 listings
  (houses/apartments/land/cars) with picsum images in `packages/db/prisma/seed.ts`.

- [ ] **Add screenshots / demo GIF to README** ⭐ — **S**
  - Listings grid, dynamic listing form, admin verification queue. Recruiters skim.

---

## P1 — Production readiness (wire external services + hardening)

- [x] **Object storage (AWS S3 + CloudFront)** — done. Two S3 buckets (`sa-east-1`) behind a
  CloudFront distribution (Origin Access Control, bucket stays fully private), plus avatar
  upload wired the same way as listing images. See `docs/DEVELOPMENT.md#storage-aws-s3--cloudfront`.

- [ ] **Stripe live wiring** — **M**
  - Real test keys, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`,
    confirm a featured-listing purchase flips `isFeatured` via the webhook.
  - Already coded: `packages/api/src/lib/stripe.ts`, `routers/payments.ts`.
  - Note: Stripe has no Bolivian seller accounts → add local rails later (see P3).

- [x] **Email provider (verification + password reset)** — done, via **AWS SES**. Email
  verification on sign-up and a forgot-password flow are wired. SES is still in **sandbox
  mode** (only verified addresses can send/receive) — request production access before
  launch. See `docs/DEVELOPMENT.md#email-aws-ses`.
  - Files: `packages/auth/src/lib/email.ts`, `packages/auth/src/index.ts`,
    `apps/web/src/app/[locale]/forgot-password/`, `apps/web/src/app/[locale]/reset-password/`.

- [ ] **Rate limiting** — **M**
  - Throttle auth and messaging endpoints (Better Auth rate-limit and/or oRPC middleware).

- [ ] **Centralize env / validation** — **S/M**
  - Replace three hand-synced `.env` files with a single source + a typed `env.ts`
    (zod-validated) so a wrong/missing var fails fast with a clear message.

- [ ] **Production deploy + live demo** ⭐ — **M**
  - Vercel (root `apps/web`) + Neon/Supabase Postgres + R2. Run `prisma migrate deploy`,
    seed demo data, add the live URL to the README and your CV/LinkedIn.

---

## P2 — Engineering quality (the things interviewers probe)

- [~] **Test suite** — started. Unit tests for the dynamic-attribute validator
  (`packages/api/src/lib/attributes.test.ts`, `bun test`, 6 passing).
  - [ ] Still to add: role-middleware tests, integration tests vs a test DB, Playwright E2E.

- [x] **CI (GitHub Actions)** ⭐ — done. `.github/workflows/ci.yml` runs install →
  prisma generate → lint → typecheck → test → build on push/PR.
  - [ ] Add the build badge to the README once the GitHub repo exists (placeholder is in place).

- [ ] **Error handling & observability** — **M**
  - Friendly error boundaries, consistent oRPC error → toast mapping, and optional Sentry.

- [ ] **Migrate off deprecated `package.json#prisma`** — **S**
  - Move seed config to `prisma.config.ts` (Prisma 7 readiness).

---

## P3 — Product polish & feature depth

- [ ] **Admin UI for categories & attributes** — **M**
  - API already supports `categories.upsert`; add an admin screen so "dynamic categories"
    is fully self-service (not seed-only). Files: `apps/web/src/app/[locale]/admin/...`.

- [ ] **Map & geocoding** — **M/L**
  - `lat`/`lng` exist but no map UI. Add a map on listing detail + map-based search,
    and geocode the address on save.

- [ ] **Listing content translation** — **M**
  - Only UI chrome is translated today; listing text stays in its `sourceLocale`.
  - Optionally machine-translate (DeepL/LLM) on demand or at publish time.

- [ ] **UX states** — **M**
  - Loading skeletons, richer empty states, optimistic updates, in-app notifications,
    unread-message badges.

- [ ] **SEO** — **S/M**
  - `sitemap.xml`, `robots.txt`, per-locale canonical/alternate tags, JSON-LD for listings.

- [ ] **Saved searches + email alerts** — **L**
  - Persist a buyer's filters and notify on new matches.

- [ ] **Local payment rails (Bolivia)** — **L**
  - QR / bank-transfer for featured listings with admin confirmation, since Stripe isn't
    available to Bolivian sellers. Schema already accommodates a `Payment` record.

- [ ] **React Native app reusing the oRPC contract** — **L**
  - Demonstrates the transport-agnostic API decision; lift the router to a standalone server.

---

## Suggested order for job-hunting impact

1. **P0**: git + GitHub, ESLint, banned check, upload limits, seed demo listings, README screenshots.
2. **P1 deploy**: storage + a **live demo URL** (biggest recruiter signal).
3. **P2**: a small test suite + **CI badge** (cheap proof of rigor).
4. Then pick **P3** items that make the best demo/story (map search, admin category UI).

> Keep this file updated as items land — a visibly maintained roadmap is itself a positive signal.
