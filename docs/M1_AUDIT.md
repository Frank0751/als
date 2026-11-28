# M1: prototype audit and foundations (KB-2026-012)

Branch `m1-foundations`, 28 November 2026. Covers CLAUDE.md section 12, step 1: audit the prototype (section 11), set up design tokens, fonts, layout, header and footer, and propose the Supabase schema. M2 has not started.

## Changes made

### Structure and URLs
- Replaced hash routing (`/#/fingerlings`) with real App Router pages. Every public page now has its own URL, title, meta description and canonical link: `/about`, `/operations`, `/fingerlings`, `/marketplace`, `/training`, `/training/apply`, `/impact`, `/partner`, `/blog`, `/faqs`, `/contact`, `/accessibility`, `/privacy`, `/terms`, `/request-list`, `/request-list/details`, `/request-list/sent`, `/admin`.
- The request list, request details, request sent and admin pages are marked `noindex`.
- Old `#/view` links redirect to the matching page once, so any links already shared keep working.
- `src/lib/als/routes.ts` maps the prototype's `navigate("view")` calls to paths. The views did not need rewriting for this.
- The phone number used to look up a saved request no longer travels in the URL. It is kept in this browser tab's session storage.
- Added a title template ("Page | Aquatic Link Solutions") and a `metadataBase` read from `NEXT_PUBLIC_SITE_URL`, to be set once the domain is chosen.
- Added a `/blog` page that says plainly that articles are coming, until M4 builds the blog.

### Shell: header, footer, layout (`src/components/als/site-shell.tsx`, replacing `als-app.tsx`)
- **Header and navigation:**
  - The top menu follows section 3: About, Operations, Fingerlings, Marketplace, Training, Impact, Partner with Us, Blog, Contact.
  - All are real links, with `aria-current` on the current page.
  - The current page is marked by a gold underline instead of a filled block.
  - The full menu shows from 1280px. Below that, a menu button opens it, with 48px rows, "Apply to train, free" and the text size control.
- **Footer:**
  - Three short groups: The farm, Work with us, Site.
  - The postal address is corrected to "P.O. Box 434, Akosombo".
  - Adds a call link next to WhatsApp and email.
  - Removed the "Track a request", "Verify a receipt" and "My account" links (out of scope).
  - Column headings are sentence case instead of small uppercase labels.
- **Text size control** (A, A+, A++) in the footer and the mobile menu (section 9). It is remembered per browser and applied before the first paint, so the page does not jump.
- **Accessibility and layout behaviour:**
  - Focus moves to the main content after each page change, for screen reader and keyboard users.
  - The skip link is kept.
  - Tap targets are at least 44px.
  - On phones, the WhatsApp button no longer covers the last footer line.
- **Wordmark:** replaced the tiny uppercase "SOLUTIONS · ALS" tag with "Aquatic Link Solutions" set in Spectral. The mark is a placeholder until ALS sends its logo files.

### Design tokens (`src/app/globals.css`)
- Added semantic tokens for new code: `volta`, `volta-night`, `sand`, `paper`, `gold`, `gold-ink`, `gold-soft`, `ink`, `ink-muted`, `line`. The prototype's remapped teal, amber and stone scales stay until each view is rebuilt.
- Added layout utilities: `container-als` (72rem wide, 16px or 24px gutters) and `section-y` (64, 96 or 128px section spacing, per section 8).
- Contrast fixes, measured against WCAG AA:
  - **Focus ring:** gold on sand was 2.34:1, below the 3:1 minimum. Light surfaces now use a Volta Deep ring. Dark surfaces (`.surface-dark`) switch to `#E4C278`, which gives 10:1.
  - **`stone-500` text:** was 3.73:1 on sand, now `#646C64` at 4.77:1.
  - **WhatsApp buttons:** white on `#25D366` was 1.98:1. They now use `#0E7A5A`, which is 5.3:1.
  - **Gold:** documented as a fill only, never as text on light backgrounds (2.34:1). Use `gold-ink` (6.8:1) for gold-family text instead.

### Fixes from the audit that could not wait for M2
- **Fabricated reviews removed:** "Verified buyer" reviews, star ratings and the "Popular" badge are no longer shown in the marketplace. The cards drop `rounded-xl` and shadows.
- **Demo logins removed from the staff sign-in screen:** they were printed in plain text, along with the shared password.
- **Gender and disability answers restricted:** the API now sends them to the owner role only, and the screen shows them only to the owner. Before, every staff login could see them. The Apply form still makes gender required, though section 9 says it is optional; fix in M3.
- **Out-of-scope screens and APIs deleted:**
  - Views: `account-view`, `receipt-view`, `track-view`, `verify-view`.
  - API routes: `api/receipts/[code]` and `api/auth/customer`.
- **Request sent screen:**
  - Removed the receipt and tracking steps.
  - Added "Copy order" and "Call" buttons for when WhatsApp does not open (section 4).
  - Replaced the fake fallback number `+233200000000` with +233 54 649 3694.
- **Request list and details:**
  - Removed the customer-account prefill, which also fixed a side effect running inside `useMemo`.
  - Removed a dead `<span>`.
  - "Your cart is empty" now reads "Your request list is empty".

### Supabase schema (proposal, not applied)
`supabase/migrations/20261128000000_initial_schema.sql`
- **Tables:** staff, activity_log, training_sessions, applications, application_sensitive, trainees, courses, modules, lessons, lesson_progress, course_completions, fingerling_sizes, product_categories, products, order_requests, notify_requests, quote_requests, post_categories, posts, enquiries, page_content, settings.
- **Notify-me and quote requests** (kept by decision, 28 Nov):
  - A notify request points to exactly one fingerling size or product. ALS records `notified_at` once it has messaged the customer, and a phone number can hold only one open request per item.
  - A quote request gets a reference (QTE-2026-0001), an optional size, quantity, date and location, and the same status steps as order requests.
  - Both are inserted by server routes and handled by the owner and editor.
  - The quantity at which an order becomes a quote is still to confirm with ALS. It will be stored as the `quote_threshold` setting.
- **Roles:**
  - The owner can do everything.
  - The editor handles site content, the marketplace, fingerlings, order requests, enquiries and the blog, and can read applications but not change their status (decided 28 Nov).
  - The trainer handles applications, sessions, courses and trainees.
- **Visitors** can only read published content. Forms go through server routes that check Turnstile and insert with the service role.
- **Gender and disability answers** sit in their own table (`application_sensitive`), readable by owner and trainer only, and are never copied into the activity log. That is what lets editors read applications without seeing them.
- **Rules enforced by the database itself:**
  - A lesson cannot be published without both a video and captions.
  - An image cannot be saved without alt text.
  - Lessons unlock in order (`lesson_unlocked`), and a trainee cannot record progress on a locked lesson.
- **Public functions:** `open_training_sessions()` returns seats left without names, and `public_impact_totals()` returns real counts for the Impact page.
- **Payment later:** online payment can be added as a separate `payments` table, with no change to `order_requests`.
- **Testing:** checked in PGlite, a Postgres engine, against stand-ins for Supabase's auth schema. 44 checks pass, covering each role's access and the data constraints. Order references can skip numbers after a failed insert, which is normal Postgres sequence behaviour.

## Audit findings left for later milestones

### M2: company pages (rebuild each view in turn)
- **Home:**
  - Leads with "How ordering works", which makes it sales-first against section 2. Lead with the investor and operation story instead, and move the ordering steps to /fingerlings.
  - Add the facts ALS has supplied: 17+ years, about 70% of clients are women.
- **Invented facts:**
  - Every page carries prices, tier prices, delivery fees, stock counts, opening hours, response times ("within one working day"), practice claims (DO/pH checks, biosecurity), delivery towns and national statistics.
  - Each must become `[TO CONFIRM: ...]` or a real figure.
  - `scripts/seed.ts` is the source of most of them.
- **Impact page:** counts applications as progress toward "1,000 trained". Show applicants, accepted and completed trainees separately.
- **Design rules broken across the views:**
  - Gradient overlays on every hero.
  - Rows of identical cards: home, about, impact, partner, policies, fingerlings.
  - Decorative icons on cards and headings.
  - `text-amber-500` numerals, which fail contrast.
  - Hard-coded `#FDFCF8`.
  - Centred long paragraphs.
  - Badge kickers above headings (training-view).
- **Photos:** the prototype images are generated pictures, not ALS photos. Replace them with real farm photos before anyone outside KoomBei sees the site.
- **Partner page:** no download for the company profile PDF, and no Turnstile on the form.
- **Contact page:** no map, the +47 number is missing, and "spam protection" is claimed when only a honeypot exists.
- **Rendering:** the catalogue is fetched in the browser, and pages wait for it. Server-render the page content when it moves to Supabase, for SEO and LCP.

### M3: training
- Remove the paid courses, fees, seats sold and bookings from the seed, training-view, cart and the admin training tab. Rebuild the admin tab as the on-farm session calendar.
- Add the "preferred on-farm session" field to the Apply form.
- Build the learning portal, video upload with preview, R2 presigned uploads and captions.

### M4: marketplace, fingerlings, blog, admin
- **Fingerlings page:**
  - Show the ALS availability status, not exact stock counts.
  - Fix the "Request for next cycle" button, which is disabled.
  - Fix "Add what's in stock", which rejects its own quantity.
- **Notify-me and quote dialogs:** kept (decided 28 Nov). Move `api/notify` and `api/quote` to the new tables. Offer notify-me on fingerling sizes too, with the "Next batch ready on [date]" wording from the user-flow doc. Remove "within one working day" from the quote dialog unless ALS commits to it.
- **Marketplace:** build product pages at `/marketplace/[slug]` with their own "Order on WhatsApp" button.
- **Admin tabs to remove or replace:**
  - Payment confirmation, proof uploads and receipts: orders tab, `api/admin/proof`, `confirm_payment`.
  - Sales reports: replace with Impact reporting.
  - Order emails tab.
  - Payment accounts and invented social links in settings.
- **Admin sections still missing:** fingerling availability editing, learning content, trainees, blog, enquiries, page content.
- **Roles:** move the staff roles from STAFF/MANAGER/OWNER to owner/editor/trainer when admin moves to Supabase Auth.

### M5: technical
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`, which hides five type errors that were already in the prototype:
  - `api/admin/orders/route.ts`: `events` and `proofs`.
  - `api/catalog/route.ts`: the `createdAt` type on reviews.
  - `dashboard-view.tsx`: the `StaffDTO` import.
  - `products-tab.tsx`: `active`.
  Remove the flag once they are fixed.
- `package.json` still carries `z-ai-web-dev-sdk` and several unused packages. The prototype is still Prisma with SQLite, and moves to Supabase and Cloudflare (OpenNext) per section 7.
- `README.md` still lists the demo staff logins and the shared password, and the repository is public.

## Decisions for Frank
1. **Applications access:** decided 28 Nov. Editors can read applications; owner and trainer change status and see gender and disability.
2. **Notify-me and quote requests:** decided 28 Nov. Keep both; tables added to the schema.
3. **Repository visibility:** make the repo private before ALS gets access. It shows the AI tool in commit names and dependencies, and the README lists demo passwords.
