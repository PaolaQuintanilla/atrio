# Atria — Global Real‑Estate & Vehicle Marketplace

> A production‑grade, fully type‑safe marketplace where anyone, anywhere, can list or
> browse **houses, apartments, land, and vehicles** for **rent or sale** — in their own
> language, with **verified ownership documents** for trust.

Atria is a full‑stack web application built as a single **TypeScript monorepo**. It pairs a
modern Next.js front end with an end‑to‑end type‑safe API and a relational data model designed
around _dynamic categories_ — the same engine serves a beachfront house, a plot of land, or a
used car without any code changes per category.

The product was designed for the Latin‑American market (with first‑class support for Bolivia's
**Derechos Reales** property‑registry documents) but is internationalized from day one and ready
for any country or language.

---

## ✨ What this project demonstrates

A compact but realistic system that touches most of the things a senior full‑stack role cares about:

- **End‑to‑end type safety** — types flow from the database (Prisma) through the API (oRPC) into
  React components, with **zero hand‑written API types or client/server drift**.
- **Domain modeling** — a flexible *Entity‑Attribute* design (`Category → AttributeDefinition →
  Listing.attributes` as JSONB) so non‑developers can add new listing types and fields.
- **Security & trust** — role‑based access (Buyer / Seller / Admin), private legal documents served
  only through short‑lived signed URLs, an admin verification workflow, and a full audit trail.
- **Internationalization** — 5 languages (Spanish, English, Portuguese, Mandarin, Russian) with
  locale‑aware routing, and a content model ready for any additional locale.
- **Real product surface** — search with dynamic filters, image galleries, in‑app buyer↔seller
  messaging, favorites, Stripe payments for featured listings, and an admin dashboard.
- **Monorepo engineering** — Bun workspaces + Turborepo, shared packages, strict TypeScript, and a
  clean separation between UI, API, auth, and data layers.

---

## 🧩 Key features

| Area | Highlights |
| ---- | ---------- |
| **Listings** | Dynamic, category‑driven create/edit forms · multi‑image galleries · rent vs. sale · geo + price |
| **Search** | Filter by category, type, price range, location, verified‑only · JSONB attribute filters · pagination |
| **Trust & verification** | Sellers upload legal/ownership docs → admin reviews → **"Verified" badge** + audit log |
| **Roles** | Buyer · Seller · Admin, with self‑service upgrade from buyer to seller |
| **Messaging** | Per‑listing buyer↔seller conversations with live polling |
| **Payments** | Stripe Checkout for featured listings + webhook fulfillment |
| **i18n** | 5 languages, switchable per user, default Spanish |
| **Design** | Responsive (mobile‑first), light/dark, custom Teal + Coral brand system |

---

## 🛠️ Tech stack & the reasoning behind it

I chose a single‑language (TypeScript) stack to maximize type safety and developer velocity, and
picked each tool deliberately:

| Technology | Why it was chosen |
| ---------- | ----------------- |
| **Bun + Turborepo** | One fast runtime/package‑manager and a task graph that caches builds — keeps a multi‑package monorepo quick to install and run. |
| **Next.js 15 (App Router)** | Server Components for fast, SEO‑friendly, data‑driven pages; one framework for UI, routing, and backend route handlers. |
| **TypeScript (strict)** | A marketplace has lots of states (roles, statuses, currencies, dynamic attributes); the compiler catches whole classes of bugs before runtime. |
| **oRPC** | End‑to‑end type‑safe RPC (a tRPC‑style DX) **with OpenAPI output** — the same router can later power a mobile app or third‑party API without a rewrite. |
| **Prisma + PostgreSQL** | Type‑safe queries and migrations; Postgres gives JSONB (for dynamic attributes), strong indexing, and full‑text/geo capability for search. |
| **Better Auth** | Modern, framework‑agnostic auth with a Prisma adapter and clean role handling — sessions, OAuth, and email/password without boilerplate. |
| **Tailwind CSS v4 + shadcn/ui** | A consistent, themeable design system (the Teal/Coral brand is just CSS tokens) and accessible components without heavy UI dependencies. |
| **next-intl** | Locale‑aware routing and message catalogs so the whole UI is translatable and new languages are a config change. |
| **Stripe** | Industry‑standard, well‑documented payments with a secure webhook model. |
| **S3‑compatible storage (R2/S3)** | Direct browser uploads via presigned URLs; a **private** bucket + signed URLs keeps legal documents confidential. |

### Architecture decisions worth calling out

- **Dynamic categories over hard‑coded types.** Instead of separate tables/forms for houses, land,
  and cars, categories own `AttributeDefinition`s and each listing stores its values as validated
  JSONB. Adding "boats" tomorrow is data, not code.
- **The API lives in a package, mounted in Next.js.** Because oRPC is transport‑agnostic, the same
  router can be lifted into a standalone server (e.g. for a future React Native app) with a
  one‑line change — no business‑logic rewrite.
- **Security by construction.** Public listing payloads never expose documents; private files are
  reachable only through short‑lived signed URLs granted to the owner or an admin, and every
  verification decision is recorded for audit.
- **Server‑side data fetching with no HTTP hop.** Server Components call the oRPC router directly
  (forwarding the session), while the browser uses the typed HTTP client + TanStack Query.

---

## 🏗️ Project structure

```
apps/
  web/            Next.js 15 app — UI, i18n, components, and the
                  /rpc (oRPC), /api/auth (Better Auth) and Stripe webhook handlers
packages/
  db/             Prisma schema (18 models), client singleton, migrations, seed
  api/            oRPC routers & business logic (listings, search, verification,
                  messaging, payments, admin, …) with Zod validation
  auth/           Better Auth instance (server + client), Buyer/Seller/Admin roles
```

---

## 🚀 Getting started

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.1 and a PostgreSQL database (a native local install — no Docker required).

```bash
bun install
cp .env.example .env            # also copy to apps/web/.env (Next.js) and packages/db/.env (Prisma CLI)
#   -> set DATABASE_URL / DIRECT_URL to your Postgres, plus BETTER_AUTH_SECRET

createdb -U postgres atria      # create the database once

bun run db:generate             # generate the Prisma client
bun run db:migrate              # apply the schema
bun run db:seed                 # seed Real Estate / Vehicles categories + attributes

bun run dev                     # http://localhost:3000
```

Full setup, admin creation, storage, payments, and deployment notes live in
[`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

### Useful scripts

- `bun run dev` — run everything in watch mode (Turborepo)
- `bun run build` — production build of all packages + the app
- `bun run typecheck` — strict type‑check across every workspace
- `bun run db:studio` — browse data in Prisma Studio

---

## 📈 Status & roadmap

**Done:** monorepo + tooling, full data model, auth & roles, dynamic listings, search & filters,
image/document uploads, admin verification, messaging, Stripe featured listings, 5‑language UI.
The app builds, type‑checks across all packages, and runs end‑to‑end against PostgreSQL.

**Next ideas:** machine translation of listing content, map‑based search, saved searches with
email alerts, a React Native app reusing the oRPC contract, and local payment rails (QR /
bank transfer) for markets where Stripe isn't available.

---

## 👤 About

Built by **&lt;Your Name&gt;** as a full‑stack portfolio project demonstrating product thinking,
clean architecture, and modern TypeScript engineering end‑to‑end.

- 📫 74014.linares@gmail.com
- 🔗 &lt;LinkedIn / portfolio URL&gt; · &lt;GitHub URL&gt;

> _Open to full‑stack / frontend / backend opportunities. Happy to walk through the architecture,
> trade‑offs, and code in an interview._

<!-- Tip: add a couple of screenshots or a short demo GIF here — recruiters skim,
     and a visual of the listings grid, the dynamic listing form, and the admin
     verification queue makes the project land much faster. -->

