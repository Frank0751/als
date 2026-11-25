# ALS — Aquatic Link Solutions (Online Store & Training Platform)

E-commerce platform, training-booking site and internal ALS dashboard for **Aquatic Link Solutions (ALS)** — a tilapia hatchery and cage farm in **Akuse, Eastern Region, Ghana**. ALS produces and sells quality tilapia fingerlings, runs grow-out production in cage systems on the Volta River, and promotes sustainable fish farming across Ghana's aquaculture sector.

Built per proposal **KB-2026-012** (KoomBei).

## What's inside

### Storefront (mobile-first, single-page app)
- **Home** — hero, how-it-works, featured fingerlings, marketplace preview, farm story, training teaser, verified reviews
- **Fingerlings shop** — live stock by size, quantity-tier pricing, ALS-open collection/delivery dates, quote requests for bulk orders
- **Marketplace** — nets, hapas, aerators, water-test kits, feeders and more; categories, search, price filters, product pages with verified reviews and "notify me" on restock
- **Training** — courses with booking calendar, seats left, auto-close when full
- **Cart + checkout** — farm pickup or delivery (fees by area), ALS-open dates
- **WhatsApp ordering** — one tap sends the full order (items, quantities, tier prices, total, chosen date, contact) to ALS on WhatsApp
- **Payments** — MoMo / bank / USD instructions, payment-proof upload on the order page
- **Receipts** — branded receipt with QR verification code, printable / shareable
- **Order tracking** — by order number + phone, with stage emails and optional customer accounts for reorder
- **Content pages** — Our Farm, Impact, FAQs, Contact, privacy/terms/refund policies (incl. live-fish rules)

### ALS Dashboard (role-gated: OWNER / MANAGER / STAFF, fully audited)
- Orders with stage filters and one-click status updates
- Payment confirmation → receipt issuance
- Stock & price management, collection-date calendar
- Training sessions + printable trainee lists
- Sales reports (day/week/month, by product, by payment method) with CSV export
- Content dashboard: hero copy, FAQs, policies, contact, payment accounts, delivery areas
- Staff logins, audit trail, outbound email log

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + SQLite (`db/custom.db`, recreated on demand)
- Bun as package manager / runtime

## Quick start

```bash
bun install
bun run db:push        # create SQLite schema
bun scripts/seed.ts    # seed catalogue, calendar, demo orders
bun run dev            # http://localhost:3000
```

## Demo staff logins (dashboard)

| Username | Name            | Role   | Password  |
| -------- | --------------- | ------ | --------- |
| abigail  | Abigail         | OWNER  | als2026   |
| naa      | Naa Dedei Aryee | MANAGER| als2026   |
| kojo     | Kojo Annan      | STAFF  | als2026   |

> Demo data note: payments, emails and proof uploads are simulated in-app (stored in SQLite / shown in the dashboard email log). WhatsApp checkout opens with a pre-filled order message; no live gateway is wired.

## Structure

```
prisma/schema.prisma          data model (products, orders, training, staff, audit…)
scripts/seed.ts               seed: fingerlings, equipment, courses, dates, demo orders
src/app/api/…                 storefront + admin APIs (orders, receipts, bookings, reports…)
src/components/als/…          storefront views + dashboard tabs
src/lib/als/…                 types, auth, formatting, cart/session stores
public/images/…               hero & product images
```
