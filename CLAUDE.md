# CLAUDE.md: Aquatic Link Solutions (ALS) Website

Build brief for Claude Code. Read this file in full before writing or changing any code. Built by KoomBei Digital for Aquatic Link Solutions. Project reference KB-2026-012.

Also read `PROJECT_STATUS.md` (timeline, payments, decisions, open items) before starting a session. Client documents are in `docs/`.

---

## 1. Who ALS is

Aquatic Link Solutions (ALS) is a tilapia aquaculture business in Akuse, Eastern Region, Ghana. Postal address: P.O. Box 434, Akosombo, Eastern Region.

- **Main business:** producing and selling high-quality tilapia fingerlings to fish farmers. Fingerlings are young fish past the fry stage, ready to stock in ponds and cages and raise to market size.
- **Grow-out:** ALS also raises tilapia from fingerling to market size in cages on the Volta River.
- **Training:** ALS trains people in fish farming, with a focus on women and persons with disabilities. Target: train over 1,000 people in 4 years.
- **Mission:** supply quality stocking materials, promote sustainable fish farming, and contribute to the growth of Ghana's aquaculture industry.
- **Market position:** demand for ALS fingerlings is already higher than supply. The website is NOT mainly a sales tool for fingerlings. ALS has been in the business for over 17 years and grows mainly by recommendation. About 70% of its clients are women.
- **Contacts:** +233 54 649 3694 (phone and WhatsApp), a Norway number +47 (confirm the full number with ALS), aquaticlinksolutions@gmail.com.

## 2. What the website is for

In order of priority:

1. **Attract international investment and partnership.** The site must read as a credible, well-run, growing aquaculture business that a foreign investor, development partner, NGO or buyer would take seriously within 30 seconds.
2. **Deliver the training programme.** Anyone can apply to train. People who cannot travel to the farm learn through structured video modules on the site. Training is free.
3. **Show the operation.** The hatchery, fingerling production and cage grow-out on the Volta River.
4. **Run a marketplace** for aquaculture equipment and accessories, ordered through WhatsApp.
5. **Rank on Google** through a blog of useful aquaculture content.

Reference for tone and ambition: malekafarms.com. We are building something more polished, faster and more accessible than that. Never name reference sites in anything client-facing.

## 3. Pages and structure

| Page | Purpose and content |
|---|---|
| Home | Who ALS is in one plain sentence, the operation in pictures, fingerlings, grow-out, training, impact, partner call to action, latest blog posts |
| About | Story, mission, how ALS started, leadership and team with photos, values, registration details |
| Our Operations | Hatchery and fingerling production, cage grow-out on the Volta River, quality and biosecurity practices, farm photo gallery |
| Fingerlings | What a fingerling is, sizes and specifications, stocking guidance for ponds and cages, availability status set by ALS, order request through WhatsApp. Honest about demand: "Orders are scheduled by production cycle" style wording, never fake scarcity |
| Marketplace | Equipment and accessories (nets, harvesting equipment, accessories) in categories, product pages with photos, description, price and stock status, "Order on WhatsApp" button |
| Training | The programme, who it is for (women and persons with disabilities first, open to everyone), on-farm and online formats, upcoming on-farm session dates (calendar set by ALS), how it works step by step, apply button, FAQs |
| Apply to Train | Application form (see section 5) |
| Learning Portal | For accepted online trainees: video modules in order, progress tracking (see section 5) |
| Impact | Who ALS serves, the 1,000-trainees-in-4-years goal shown as a TARGET with live progress from real data, jobs, community work, contribution to Ghana aquaculture |
| Partner and Invest | The investment and partnership case, partnership types (investors, development partners, NGOs, buyers, research institutions), downloadable company profile PDF, partnership enquiry form |
| Blog | Articles for SEO: fish farming guides, fingerling care, cage farming, training stories, company news. Categories and tags |
| Contact | Phone, WhatsApp, email, postal address, farm location map, contact form |
| Accessibility statement | What the site does for accessibility and how to report a problem |
| Privacy policy, Terms | Drafted for ALS to review |

Navigation: About, Operations, Fingerlings, Marketplace, Training, Impact, Partner with Us, Blog, Contact. Keep the top menu short on mobile; group secondary pages in the footer.

## 4. Marketplace and fingerlings (WhatsApp ordering, no online payment)

- Customers browse, pick item, size and quantity, and add to a request list.
- One "Send order on WhatsApp" button opens WhatsApp (wa.me link) with a pre-filled message: order reference number, each item with size, quantity and unit price, total, delivery or pickup preference, preferred date, customer name and phone.
- Every request is saved to the database when the button is pressed, so ALS has a record in the admin portal even if the chat is lost.
- Show the order reference on screen before WhatsApp opens. If WhatsApp does not open (for example a laptop abroad), offer "Copy order" and a call button. The order is already saved.
- Fingerling availability is a status ALS sets in the admin portal: Available, Limited, Fully booked until [date], Taking requests for next cycle.
- No cart payment, no Paystack in this phase. Structure the code so online payment can be added later without a rebuild.

## 5. Training programme (core feature)

### Application flow
1. Visitor opens Apply to Train. Training is free; no prices anywhere in training.
2. Form fields: full name, phone (WhatsApp), email (optional), gender, age range, region and town, current fish farming experience (none, beginner, practising farmer), preferred format (on-farm, online videos, either), preferred on-farm session (from the dates ALS has opened, if on-farm), how they heard about ALS, and an optional, clearly voluntary question on disability with a short note on why ALS asks and how the answer is protected. Consent checkbox for data use.
3. On submit: confirmation screen and email or WhatsApp-ready message with an application reference.
4. ALS reviews in the admin portal. Status values: Received, Under review, Accepted (on-farm), Accepted (online), Waitlisted, Not accepted. Each change can notify the applicant by email, and the admin can open a pre-filled WhatsApp message to the applicant in one click.
5. Accepted online trainees receive a sign-in link (Supabase magic link or phone OTP) to the Learning Portal.

### On-farm session calendar
- ALS opens on-farm training dates in the admin portal (date, location, seats).
- The Training page shows upcoming dates; applicants choose a preferred date in the form. Full sessions show as full.

### Learning Portal
- Courses made of modules made of lessons. Lessons are videos with a short written summary, optional downloadable notes (PDF) and captions.
- Lessons unlock in order (systematic training). Progress is saved per trainee. Completion shown per module and course.
- Works on low-cost Android phones and slow data: show video size, offer lower quality, allow notes without video.
- Captions on every video (WebVTT). This is required, not optional, given the disability focus.
- Optional at the end of a course: a simple completion record ALS can verify. Certificates can come later.

### Admin video upload
- Admin uploads a video from the admin portal.
- **Preview before upload:** the admin sees the selected video play in the browser (local object URL) with title, module and summary BEFORE anything is uploaded. They confirm, then it uploads.
- Upload goes straight from the browser to Cloudflare R2 using a presigned URL, with a progress bar and the ability to cancel.
- After upload, the lesson is saved as Draft. Admin can preview the uploaded version on a draft preview page, then Publish.
- Admin can attach captions (.vtt) and notes (PDF), reorder lessons by drag and drop, and unpublish.
- Guidance shown in the upload screen: MP4 (H.264), 720p recommended, maximum file size set in config.

## 6. Admin portal

One portal at /admin, protected by Supabase Auth with roles (owner, editor, trainer).

- **Dashboard:** new applications, new order requests, enquiries, training progress at a glance. All numbers come from real data.
- **Applications:** list, filter (status, gender, region, format, disability flag where consented), view, change status, notes, export to Excel/CSV.
- **Training sessions:** on-farm dates, location, seats, who has chosen each date.
- **Learning content:** courses, modules, lessons, video upload with preview (section 5), captions, notes, reorder, draft and publish.
- **Trainees:** progress per trainee and per course, export.
- **Marketplace:** products, categories, photos, prices, stock status.
- **Fingerlings:** sizes, specifications, availability status and next available date.
- **Order requests:** list of WhatsApp order requests with reference numbers, status (New, Contacted, Confirmed, Completed, Cancelled).
- **Blog:** write and edit posts in a rich text editor, cover image, categories, tags, SEO title and description, draft, schedule, publish.
- **Pages content:** edit key text and images on Home, About, Operations, Impact, Partner pages without a developer.
- **Enquiries:** partnership and contact form submissions.
- **Impact reporting:** counts of applicants, accepted and completed trainees by gender, disability (consented only), region and format, with export. This is what ALS shows donors and investors.
- **Users:** add staff, set roles. Activity log of who changed what.

## 7. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Server rendering for SEO |
| Styling | Tailwind CSS | Custom tokens from section 8 only |
| Hosting | Cloudflare (Workers via OpenNext) | Domain on Cloudflare Registrar, in ALS's own account |
| Database and auth | Supabase (Postgres, Auth, Row Level Security) | Under an ALS email. Free plan to start (it pauses after a week of inactivity; keep-alive or upgrade to Pro if needed) with nightly backup job (GitHub Action pg_dump to R2) |
| Video and file storage | Cloudflare R2 | Presigned uploads from the browser, no egress fees |
| Images | Cloudinary or Next image optimisation | WebP/AVIF, lazy loading |
| Email | Resend | Application confirmations and status changes |
| Spam protection | Cloudflare Turnstile | On every public form |
| Analytics | Cloudflare Web Analytics, plus Google Search Console | GA4 optional |
| Mailboxes | Zoho Mail | Separate from the build. Cloudflare Email Routing only forwards |

Keep heavy work off the edge request path (Workers free plan has a 10 ms CPU limit per request; paid plan is about $5/month if needed). Video uploads go browser to R2 directly. Admin data uses Supabase from the client with Row Level Security. Server routes stay small (presign URL, form submit, email send).

Do not use Vercel or Vercel integrations (Prisma Postgres etc.) for this project.

## 8. Design direction

### Non-negotiable rules
- Build a custom UI for ALS. Avoid generic AI defaults: do not use Inter, purple-to-blue gradients, nested cards inside cards, low-contrast gray text on colored backgrounds, decorative dots, excessive border radius, or a centered hero with two generic buttons. Define a clear visual direction, a custom color palette, specific font pairings, and generous whitespace. Write direct, specific copy without fake metrics or hype.
- **No small titles above big titles.** No eyebrow labels, kicker text or tiny uppercase tags sitting over headings. A section has one heading, then content.
- **No unnecessary icons.** Use an icon only where it carries meaning (WhatsApp, phone, play, download, external link, menu). No icon decorating every card or bullet.
- **Centre-align section titles** so headings line up consistently down the page. Body text stays left-aligned for readability. Do not centre long paragraphs.
- No symmetrical rows of identical three cards. Vary layouts: full-bleed photography, split image and text, editorial lists, a strong single statistic, a timeline.
- No glowing shadows, no pill-shaped badges everywhere, no gradient text.
- No em dashes anywhere in copy or code comments.
- Banned words in copy: delve, seamless, revolutionary, game-changer, cutting-edge, unlock, empower (as filler), world-class, leverage.
- The site must be user friendly, equitable, accessible, enjoyable, responsive and interactive.

### Visual direction
"Volta at work": a serious, grounded aquaculture business. Real water, real fish, real people. Photography carries the energy; the interface stays calm and confident so investors trust it.

- **Palette** (if ALS's logo has its own colours, derive from those instead and keep the same roles):
  - Primary deep: Volta Deep `#0F3D3E` (headings, header, footer, dark sections)
  - Primary light: River Sand `#F4F0E6` (page background)
  - Accent: Fingerling Gold `#D4912A` (calls to action, key highlights only)
  - Text: `#1A1F1E` on light, `#F4F0E6` on dark. Check every pair meets WCAG AA contrast.
- **Type pairing:** Spectral (headings, 600) with Public Sans (body and interface). Tabular figures for numbers in impact and admin tables.
- **Shape:** border radius 4px or less. Hairline borders. Generous section spacing (96 to 128px desktop, 64px mobile).
- **Motion:** subtle, purposeful reveals only. Respect prefers-reduced-motion.

### Copy
- Plain, specific and factual. Short sentences mixed with longer ones.
- No invented statistics. Any number not supplied by ALS appears as `[TO CONFIRM: ...]` so it is obvious and cannot ship by accident.
- Write for two readers at once: a foreign investor and a woman farmer in the Eastern Region on a phone.

## 9. Accessibility, equity and performance

- WCAG 2.2 AA throughout. Keyboard navigation, visible focus, skip link, logical headings, alt text required on every uploaded image (admin cannot save without it).
- Captions on all training videos. Transcripts where ALS provides them.
- Text size control and reduced-motion respect. Large tap targets (minimum 44px).
- Plain language. Consider Twi later; structure strings so a second language can be added.
- Mobile first. Test on a low-cost Android phone and a throttled 3G connection. Target LCP under 2.5s on mobile.
- Sensitive data (disability, gender) is optional, consented, visible only to owner and trainer roles, and excluded from public pages except as aggregated counts.

## 10. SEO

- Semantic HTML, unique title and meta description per page and post, Open Graph images.
- JSON-LD: Organization, LocalBusiness (farm location), Product (marketplace), Course (training), Article (blog), BreadcrumbList.
- Sitemap and robots.txt generated automatically, including blog posts.
- Clean URLs: /fingerlings, /marketplace/[slug], /training, /blog/[slug].
- Google Business Profile set up for the farm location.

## 11. Working with the existing prototype

A prototype was started with another AI model and pushed to the repository. Before building on it:

1. Run this audit and act on it: "Audit this code for AI slop. Remove decorative fluff, redundant wrappers, and repetitive card grids. Replace vague placeholder/marketing copy with clear, factual microcopy. Tighten spacing and typography hierarchy, and list every change you made."
2. Check it against sections 7 to 9 of this file. Replace anything that conflicts (fonts, colours, eyebrow labels, icons, gradients, card grids, Vercel-specific code).
3. Keep what is good. Do not rewrite working, clean code for the sake of it.

## 12. Build order

Matches the milestones in `PROJECT_STATUS.md`.

1. (M1) Audit the prototype (section 11). Set up design tokens, fonts, layout, header and footer. Supabase schema and Row Level Security: applications, trainees, training_sessions, courses, modules, lessons, progress, products, categories, fingerling_sizes, order_requests, posts, enquiries, page_content, staff roles, activity_log.
2. (M2) Public pages: Home, About, Operations, Fingerlings, Impact, Partner and Invest, Contact, Accessibility, Privacy, Terms, with `[TO CONFIRM]` placeholders for unknown facts.
3. (M3) Training: Apply to Train form, session calendar, application emails, admin applications screen. Then Learning Portal and admin video upload with preview, R2 presigned uploads, captions, draft and publish.
4. (M4) Marketplace and Fingerlings with WhatsApp order requests and the admin screens. Blog with admin editor and SEO. Impact reporting and exports.
5. (M5) Accessibility, performance and SEO pass. Then run the section 11 audit again on the whole codebase and list every change.

## 13. Definition of done for each feature

- Works on a 360px-wide phone and on desktop.
- Passes keyboard-only use and an automated accessibility check (axe) with no serious issues.
- No console errors. Loading, empty and error states designed, not left blank.
- No placeholder copy left except clearly marked `[TO CONFIRM]` items.
- No em dashes.

## 14. Still to confirm with ALS

Requested from Abigail on 28 November 2026 (see `docs/messages/content_list_whatsapp.txt` and the "Content from ALS" tab in the tracker):

- Logo files and brand colours
- Photos and video of the hatchery, cages on the Volta, staff and training
- Leadership names, roles and photos
- Fingerling sizes and specifications, how ordering and delivery work
- Marketplace products, prices and photos
- Training details, on-farm session dates, and the first online course outline
- The full +47 number and who it belongs to, and which number receives WhatsApp orders
- Exact farm location for the map
- Any real figures for the Impact page
- Company profile PDF for the Partner page
- Domain name choice and the ALS email for accounts
- Admin users and roles
