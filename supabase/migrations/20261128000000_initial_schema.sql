-- ALS website and training platform: initial schema (KB-2026-012, milestone M1)
--
-- PROPOSAL FOR REVIEW. Not applied to any database yet.
-- Covers CLAUDE.md section 12 (M1): applications, trainees, training_sessions,
-- courses, modules, lessons, progress, products, categories, fingerling_sizes,
-- order_requests, posts, enquiries, page_content, staff roles, activity_log.
-- Also notify_requests and quote_requests (kept by decision, 28 Nov 2026).
--
-- Security model
-- * Row Level Security is on for every table. With no matching policy, access is denied.
-- * Public visitors (anon) can only READ published content. They never write
--   directly: forms post to small server routes that check Cloudflare Turnstile
--   and then insert with the service role (CLAUDE.md section 7).
-- * Staff roles: owner (everything), editor (site content, marketplace, orders,
--   enquiries, blog; can read applications), trainer (applications, sessions,
--   courses, trainees).
-- * Gender and disability answers live in their own table so RLS can limit them
--   to owner and trainer (CLAUDE.md section 9), while editors still read the
--   rest of each application. Postgres RLS works per row, not per column.
-- * Video, captions, notes and images are stored in Cloudflare R2. Tables keep
--   only object keys; the server hands out short-lived presigned URLs.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('owner', 'editor', 'trainer');

create type public.application_status as enum (
  'received', 'under_review', 'accepted_on_farm', 'accepted_online', 'waitlisted', 'not_accepted'
);

create type public.training_format as enum ('on_farm', 'online', 'either');

create type public.farming_experience as enum ('none', 'beginner', 'practising');

create type public.publish_status as enum ('draft', 'scheduled', 'published');

-- Set by ALS in the admin portal (CLAUDE.md section 4)
create type public.fingerling_availability as enum (
  'available', 'limited', 'fully_booked', 'next_cycle'
);

create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock');

create type public.order_status as enum ('new', 'contacted', 'confirmed', 'completed', 'cancelled');

create type public.fulfilment as enum ('pickup', 'delivery');

create type public.enquiry_kind as enum ('partnership', 'contact');

create type public.enquiry_status as enum ('new', 'replied', 'closed');

-- ---------------------------------------------------------------------------
-- Staff and role helpers
-- ---------------------------------------------------------------------------

create table public.staff (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        public.staff_role not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Role of the signed-in user, or null for visitors and trainees.
-- security definer so policies can call it without granting reads on staff.
create function public.current_staff_role()
returns public.staff_role
language sql stable security definer set search_path = ''
as $$
  select s.role from public.staff s where s.user_id = auth.uid() and s.active
$$;

create function public.has_role(variadic roles public.staff_role[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(public.current_staff_role() = any (roles), false)
$$;

create function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.current_staff_role() is not null
$$;

-- ---------------------------------------------------------------------------
-- Activity log: append-only record of who changed what (CLAUDE.md section 6)
-- ---------------------------------------------------------------------------

create table public.activity_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  table_name  text not null,
  row_id      text,
  changes     jsonb,
  created_at  timestamptz not null default now()
);

create function public.log_activity()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  rec jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  -- Never copy gender or disability answers into the log
  if tg_table_name = 'application_sensitive' then
    rec := jsonb_build_object('application_id', rec -> 'application_id');
  end if;
  insert into public.activity_log (actor_id, action, table_name, row_id, changes)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce(rec ->> 'id', rec ->> 'application_id', rec ->> 'key'), rec);
  return null;
end;
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Training: on-farm sessions and applications (CLAUDE.md section 5)
-- ---------------------------------------------------------------------------

create table public.training_sessions (
  id          uuid primary key default gen_random_uuid(),
  starts_on   date not null,
  ends_on     date,
  location    text not null,
  seats       integer not null check (seats > 0),
  notes       text,
  is_open     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create sequence public.application_ref_seq;

create table public.applications (
  id                    uuid primary key default gen_random_uuid(),
  ref                   text not null unique
                        default 'APL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.application_ref_seq')::text, 4, '0'),
  full_name             text not null check (length(trim(full_name)) between 2 and 120),
  phone                 text not null check (length(phone) between 7 and 20),
  email                 text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  age_range             text not null,
  region                text not null,
  town                  text not null,
  experience            public.farming_experience not null,
  preferred_format      public.training_format not null,
  preferred_session_id  uuid references public.training_sessions (id) on delete set null,
  heard_about_us        text,
  consent_given_at      timestamptz not null,
  status                public.application_status not null default 'received',
  staff_notes           text,
  reviewed_by           uuid references auth.users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index applications_status_idx on public.applications (status, created_at desc);
create index applications_session_idx on public.applications (preferred_session_id);

-- Optional, consented answers (gender, disability), kept apart so only owner
-- and trainer can read them. Editors can read applications but not this table.
create table public.application_sensitive (
  application_id  uuid primary key references public.applications (id) on delete cascade,
  gender          text,
  has_disability  boolean,
  access_needs    text,
  created_at      timestamptz not null default now()
);

-- Seats left per open session, for the public Training page and Apply form.
-- Exposes counts only, never who applied.
create function public.open_training_sessions()
returns table (id uuid, starts_on date, ends_on date, location text, seats integer, seats_taken integer)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.starts_on, s.ends_on, s.location, s.seats,
         (select count(*)::int from public.applications a
           where a.preferred_session_id = s.id and a.status <> 'not_accepted') as seats_taken
  from public.training_sessions s
  where s.is_open and s.starts_on >= current_date
  order by s.starts_on
$$;

-- ---------------------------------------------------------------------------
-- Learning portal: courses > modules > lessons, progress (CLAUDE.md section 5)
-- ---------------------------------------------------------------------------

-- Accepted online trainees. user_id is their Supabase Auth account (magic link or phone OTP).
create table public.trainees (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  application_id  uuid unique references public.applications (id) on delete set null,
  full_name       text not null,
  enrolled_at     timestamptz not null default now()
);

create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  summary      text,
  status       public.publish_status not null default 'draft',
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  title       text not null,
  position    integer not null,
  unique (course_id, position) deferrable initially deferred
);

create table public.lessons (
  id                 uuid primary key default gen_random_uuid(),
  module_id          uuid not null references public.modules (id) on delete cascade,
  title              text not null,
  summary            text not null default '',
  position           integer not null,
  -- R2 object keys
  video_key          text,
  video_bytes        bigint,
  video_low_key      text,             -- lower-quality copy for slow data
  video_low_bytes    bigint,
  captions_key       text,             -- WebVTT
  notes_key          text,             -- optional PDF
  duration_seconds   integer,
  status             public.publish_status not null default 'draft',
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (module_id, position) deferrable initially deferred,
  -- Captions are required, not optional (CLAUDE.md section 5)
  constraint published_lessons_need_video_and_captions
    check (status <> 'published' or (video_key is not null and captions_key is not null))
);

create table public.lesson_progress (
  trainee_id        uuid not null references public.trainees (user_id) on delete cascade,
  lesson_id         uuid not null references public.lessons (id) on delete cascade,
  last_position_s   integer not null default 0,
  completed_at      timestamptz,
  updated_at        timestamptz not null default now(),
  primary key (trainee_id, lesson_id)
);

-- Simple completion record ALS can verify (certificates can come later)
create table public.course_completions (
  trainee_id         uuid not null references public.trainees (user_id) on delete cascade,
  course_id          uuid not null references public.courses (id) on delete cascade,
  completed_at       timestamptz not null default now(),
  verification_code  text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  primary key (trainee_id, course_id)
);

-- Lessons unlock in order: a lesson opens once every earlier published lesson
-- in the same course is complete. The video presign route calls this before
-- signing a URL, so a locked lesson cannot be streamed by guessing its id.
create function public.lesson_unlocked(p_lesson uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  with target as (
    select l.id, m.course_id, m.position as mpos, l.position as lpos
    from public.lessons l join public.modules m on m.id = l.module_id
    where l.id = p_lesson and l.status = 'published'
  )
  select exists (select 1 from target)
     and exists (select 1 from public.trainees t where t.user_id = auth.uid())
     and not exists (
       select 1
       from target t
       join public.modules m on m.course_id = t.course_id
       join public.lessons l on l.module_id = m.id and l.status = 'published'
       left join public.lesson_progress p on p.lesson_id = l.id and p.trainee_id = auth.uid()
       where (m.position, l.position) < (t.mpos, t.lpos)
         and p.completed_at is null
     )
$$;

-- ---------------------------------------------------------------------------
-- Fingerlings and marketplace (CLAUDE.md section 4)
-- ---------------------------------------------------------------------------

create table public.fingerling_sizes (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,            -- e.g. "Size 3"
  size_description   text not null,            -- weight or length range, from ALS
  price_ghs          numeric(10, 2) check (price_ghs is null or price_ghs >= 0),
  unit               text not null default 'fingerling',
  specifications     text,
  stocking_guidance  text,
  availability       public.fingerling_availability not null default 'available',
  available_from     date,                     -- "Fully booked until" / next cycle date
  position           integer not null default 0,
  published          boolean not null default false,
  updated_at         timestamptz not null default now(),
  constraint booked_sizes_need_a_date
    check (availability not in ('fully_booked') or available_from is not null)
);

create table public.product_categories (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name      text not null,
  position  integer not null default 0
);

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id   uuid not null references public.product_categories (id) on delete restrict,
  name          text not null,
  description   text not null default '',
  price_ghs     numeric(10, 2) not null check (price_ghs >= 0),
  unit          text not null default 'each',
  stock_status  public.stock_status not null default 'in_stock',
  image_key     text,
  image_alt     text,
  published     boolean not null default false,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Alt text is required on every uploaded image (CLAUDE.md section 9)
  constraint images_need_alt_text
    check (image_key is null or length(trim(coalesce(image_alt, ''))) > 0)
);

create index products_category_idx on public.products (category_id, position);

-- Order requests sent through WhatsApp. Saved the moment the customer presses
-- the button, so ALS has a record even if the chat is lost.
create sequence public.order_ref_seq;

create table public.order_requests (
  id                 uuid primary key default gen_random_uuid(),
  ref                text not null unique
                     default 'ALS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_ref_seq')::text, 5, '0'),
  customer_name      text not null,
  phone              text not null,
  fulfilment         public.fulfilment not null,
  delivery_location  text,
  preferred_date     date,
  -- Snapshot of what was requested, with the prices shown at the time:
  -- [{ "kind": "fingerling"|"product", "id", "name", "variant", "qty", "unit", "unit_price_ghs" }]
  items              jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total_ghs          numeric(12, 2) not null check (total_ghs >= 0),
  customer_note      text,
  status             public.order_status not null default 'new',
  staff_notes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (fulfilment = 'pickup' or delivery_location is not null)
  -- Online payment (Paystack) is out of scope. When it is added, a separate
  -- payments table references order_requests(id); nothing here needs to change.
);

create index order_requests_status_idx on public.order_requests (status, created_at desc);

-- "Notify me" for a sold-out fingerling size or out-of-stock product. ALS
-- messages the customer on WhatsApp when it is ready and records notified_at.
create table public.notify_requests (
  id                  uuid primary key default gen_random_uuid(),
  fingerling_size_id  uuid references public.fingerling_sizes (id) on delete cascade,
  product_id          uuid references public.products (id) on delete cascade,
  name                text not null,
  phone               text not null check (length(phone) between 7 and 20),
  notified_at         timestamptz,
  created_at          timestamptz not null default now(),
  constraint notify_one_item check (num_nonnulls(fingerling_size_id, product_id) = 1)
);

-- One open request per phone and item, so repeat taps do not pile up
create unique index notify_requests_open_size_idx
  on public.notify_requests (fingerling_size_id, phone) where notified_at is null and fingerling_size_id is not null;
create unique index notify_requests_open_product_idx
  on public.notify_requests (product_id, phone) where notified_at is null and product_id is not null;

-- Quote requests for large fingerling orders and farm-scale buyers. The
-- quantity at which an order becomes a quote is still to confirm with ALS
-- (PROJECT_STATUS open items); store it as settings key 'quote_threshold'.
create sequence public.quote_ref_seq;

create table public.quote_requests (
  id                  uuid primary key default gen_random_uuid(),
  ref                 text not null unique
                      default 'QTE-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quote_ref_seq')::text, 4, '0'),
  name                text not null,
  organisation        text,
  phone               text not null check (length(phone) between 7 and 20),
  email               text,
  fingerling_size_id  uuid references public.fingerling_sizes (id) on delete set null,
  quantity            integer check (quantity is null or quantity > 0),
  preferred_date      date,
  location            text,
  message             text not null,
  status              public.order_status not null default 'new',
  staff_notes         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index quote_requests_status_idx on public.quote_requests (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Blog (CLAUDE.md sections 6 and 10)
-- ---------------------------------------------------------------------------

create table public.post_categories (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name  text not null
);

create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  excerpt          text,
  body             jsonb not null default '{}'::jsonb,   -- rich text editor document
  cover_key        text,
  cover_alt        text,
  category_id      uuid references public.post_categories (id) on delete set null,
  tags             text[] not null default '{}',
  seo_title        text,
  seo_description  text check (seo_description is null or length(seo_description) <= 170),
  status           public.publish_status not null default 'draft',
  publish_at       timestamptz,
  author_id        uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint covers_need_alt_text
    check (cover_key is null or length(trim(coalesce(cover_alt, ''))) > 0),
  constraint scheduled_posts_need_a_time
    check (status = 'draft' or publish_at is not null)
);

create index posts_published_idx on public.posts (publish_at desc) where status <> 'draft';

-- ---------------------------------------------------------------------------
-- Enquiries, editable page content, settings
-- ---------------------------------------------------------------------------

create table public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  kind          public.enquiry_kind not null,
  name          text not null,
  organisation  text,
  email         text,
  phone         text,
  country       text,
  partner_type  text,          -- investor, development partner, NGO, buyer, research
  message       text not null,
  status        public.enquiry_status not null default 'new',
  created_at    timestamptz not null default now(),
  check (email is not null or phone is not null)
);

-- Key text and images on Home, About, Operations, Impact and Partner pages,
-- editable without a developer. value holds text, or { "key": r2Key, "alt": "..." } for images.
create table public.page_content (
  page        text not null,
  key         text not null,
  value       jsonb not null,
  updated_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (page, key)
);

-- Site-wide settings: contact numbers, the WhatsApp order number, etc.
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Impact reporting (CLAUDE.md sections 3 and 6)
-- ---------------------------------------------------------------------------

-- Public totals for the Impact page: real counts only, nothing personal.
create function public.public_impact_totals()
returns table (applicants integer, accepted integer, completed integer)
language sql stable security definer set search_path = ''
as $$
  select
    (select count(*)::int from public.applications),
    (select count(*)::int from public.applications where status in ('accepted_on_farm', 'accepted_online')),
    (select count(distinct trainee_id)::int from public.course_completions)
$$;

-- Breakdown for donors and investors (staff only). Disability counts come only
-- from people who chose to answer, and only owner and trainer can call this.
create function public.impact_breakdown()
returns table (dimension text, value text, applicants bigint, accepted bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_role('owner', 'trainer') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select 'gender', s.gender, count(*), count(*) filter (where a.status in ('accepted_on_farm', 'accepted_online'))
      from public.applications a join public.application_sensitive s on s.application_id = a.id
      where s.gender is not null
      group by s.gender
    union all
    select 'region', a.region, count(*), count(*) filter (where a.status in ('accepted_on_farm', 'accepted_online'))
      from public.applications a group by a.region
    union all
    select 'format', a.preferred_format::text, count(*), count(*) filter (where a.status in ('accepted_on_farm', 'accepted_online'))
      from public.applications a group by a.preferred_format
    union all
    select 'disability', case s.has_disability when true then 'yes' else 'no' end, count(*),
           count(*) filter (where a.status in ('accepted_on_farm', 'accepted_online'))
      from public.applications a join public.application_sensitive s on s.application_id = a.id
      where s.has_disability is not null
      group by s.has_disability;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'training_sessions', 'applications', 'courses', 'lessons', 'fingerling_sizes',
    'products', 'order_requests', 'quote_requests', 'posts', 'page_content', 'settings'
  ] loop
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute function public.touch_updated_at()', t);
  end loop;

  foreach t in array array[
    'staff', 'training_sessions', 'applications', 'application_sensitive', 'trainees',
    'courses', 'modules', 'lessons', 'fingerling_sizes', 'product_categories', 'products',
    'order_requests', 'notify_requests', 'quote_requests', 'post_categories', 'posts',
    'enquiries', 'page_content', 'settings'
  ] loop
    execute format('create trigger log_activity after insert or update or delete on public.%I
                    for each row execute function public.log_activity()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'staff', 'activity_log', 'training_sessions', 'applications', 'application_sensitive',
    'trainees', 'courses', 'modules', 'lessons', 'lesson_progress', 'course_completions',
    'fingerling_sizes', 'product_categories', 'products', 'order_requests',
    'notify_requests', 'quote_requests', 'post_categories', 'posts', 'enquiries',
    'page_content', 'settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Staff: everyone signed in can read their own row; only the owner manages staff.
create policy "staff read own row" on public.staff
  for select to authenticated using (user_id = auth.uid() or public.has_role('owner'));
create policy "owner manages staff" on public.staff
  for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));

-- Activity log: owner reads. Nobody updates or deletes (no policy = denied).
create policy "owner reads activity log" on public.activity_log
  for select to authenticated using (public.has_role('owner'));

-- Training sessions: public sees open, upcoming dates; trainer and owner manage.
create policy "public reads open sessions" on public.training_sessions
  for select to anon, authenticated using (is_open and starts_on >= current_date);
create policy "trainers manage sessions" on public.training_sessions
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

-- Applications: inserted by the server route only. Owner and trainer review
-- and change status; editors can read them (without gender or disability).
create policy "trainers manage applications" on public.applications
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));
create policy "editors read applications" on public.applications
  for select to authenticated using (public.has_role('editor'));
create policy "trainers manage sensitive answers" on public.application_sensitive
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

-- Trainees: a trainee reads their own record; owner and trainer manage.
create policy "trainee reads self" on public.trainees
  for select to authenticated using (user_id = auth.uid());
create policy "trainers manage trainees" on public.trainees
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

-- Courses, modules, lessons: trainees read published content; trainers manage.
create policy "trainees read published courses" on public.courses
  for select to authenticated
  using (status = 'published' and exists (select 1 from public.trainees t where t.user_id = auth.uid()));
create policy "trainers manage courses" on public.courses
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

create policy "trainees read modules of published courses" on public.modules
  for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
         and exists (select 1 from public.trainees t where t.user_id = auth.uid()));
create policy "trainers manage modules" on public.modules
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

create policy "trainees read published lessons" on public.lessons
  for select to authenticated
  using (status = 'published' and exists (select 1 from public.trainees t where t.user_id = auth.uid()));
create policy "trainers manage lessons" on public.lessons
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

-- Progress: a trainee reads and writes only their own, and only for unlocked lessons.
create policy "trainee reads own progress" on public.lesson_progress
  for select to authenticated using (trainee_id = auth.uid() or public.has_role('owner', 'trainer'));
create policy "trainee records own progress" on public.lesson_progress
  for insert to authenticated with check (trainee_id = auth.uid() and public.lesson_unlocked(lesson_id));
create policy "trainee updates own progress" on public.lesson_progress
  for update to authenticated using (trainee_id = auth.uid()) with check (trainee_id = auth.uid());

create policy "trainee reads own completions" on public.course_completions
  for select to authenticated using (trainee_id = auth.uid() or public.has_role('owner', 'trainer'));
create policy "trainers manage completions" on public.course_completions
  for all to authenticated using (public.has_role('owner', 'trainer')) with check (public.has_role('owner', 'trainer'));

-- Fingerlings, marketplace: public reads published rows; owner and editor manage.
create policy "public reads published fingerlings" on public.fingerling_sizes
  for select to anon, authenticated using (published);
create policy "editors manage fingerlings" on public.fingerling_sizes
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

create policy "public reads categories" on public.product_categories
  for select to anon, authenticated using (true);
create policy "editors manage categories" on public.product_categories
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

create policy "public reads published products" on public.products
  for select to anon, authenticated using (published);
create policy "editors manage products" on public.products
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

-- Order requests: inserted by the server route only; owner and editor handle them.
create policy "editors manage order requests" on public.order_requests
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

-- Notify-me and quote requests: inserted by server routes only; owner and editor handle them.
create policy "editors manage notify requests" on public.notify_requests
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));
create policy "editors manage quote requests" on public.quote_requests
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

-- Blog: public reads published and due posts; owner and editor write.
create policy "public reads post categories" on public.post_categories
  for select to anon, authenticated using (true);
create policy "editors manage post categories" on public.post_categories
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

create policy "public reads published posts" on public.posts
  for select to anon, authenticated using (status <> 'draft' and publish_at <= now());
create policy "editors manage posts" on public.posts
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

-- Enquiries: inserted by the server route only; owner and editor read and update.
create policy "editors manage enquiries" on public.enquiries
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

-- Page content and settings: public reads; owner and editor write.
create policy "public reads page content" on public.page_content
  for select to anon, authenticated using (true);
create policy "editors manage page content" on public.page_content
  for all to authenticated using (public.has_role('owner', 'editor')) with check (public.has_role('owner', 'editor'));

create policy "public reads settings" on public.settings
  for select to anon, authenticated using (true);
create policy "owner manages settings" on public.settings
  for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));

-- Function access: visitors may call only the two public summary functions.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.open_training_sessions() to anon, authenticated;
grant execute on function public.public_impact_totals() to anon, authenticated;
grant execute on function public.current_staff_role(), public.has_role(public.staff_role[]),
                         public.is_staff(), public.lesson_unlocked(uuid), public.impact_breakdown()
  to authenticated;
