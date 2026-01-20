-- Combined schema generated from supabase/migrations
-- Order:
--   - 202501140001_init.sql
--   - 202501140002_rls.sql
--   - 202501150001_settings_public.sql
--   - 202501150002_roles.sql
--   - 202501150003_extended_schema.sql
--   - 202501150004_public_quote_features.sql
--   - 202501150005_public_access_and_audit.sql

-- Drop existing policies so this script can be re-run safely.
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'clients',
        'requests',
        'quotes',
        'settings',
        'profiles',
        'contacts',
        'quote_items',
        'tasks',
        'activity_log',
        'attachments',
        'proposal_templates',
        'services',
        'quote_versions',
        'quote_acceptances',
        'quote_events',
        'invoices',
        'rate_limits',
        'audit_log'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- >>> BEGIN 202501140001_init.sql
-- Initial schema for CRM

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type public.request_status as enum ('new', 'review', 'sent', 'approved', 'lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type public.quote_status as enum ('draft', 'sent', 'approved', 'lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'client_status') then
    create type public.client_status as enum ('active', 'negotiation', 'inactive');
  end if;
end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  segment text,
  status public.client_status not null default 'negotiation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  email text,
  whatsapp text not null,
  project_type text not null,
  description text not null,
  budget_estimate text,
  desired_deadline text,
  status public.request_status not null default 'new',
  source text not null default 'form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  request_id uuid references public.requests(id) on delete set null,
  title text not null,
  amount_cents integer not null default 0,
  currency text not null default 'BRL',
  deadline_text text,
  status public.quote_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  company_email text,
  company_phone text,
  company_address text,
  monthly_goal_cents integer not null default 0,
  proposal_validity_days integer not null default 14,
  proposal_language text not null default 'pt-BR',
  proposal_template text not null default 'modern',
  notify_new_requests boolean not null default true,
  notify_followup boolean not null default true,
  notify_weekly_summary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_requests_updated_at on public.requests;
create trigger set_requests_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_requests_status on public.requests(status);
create index if not exists idx_requests_created_at on public.requests(created_at desc);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_client_id on public.quotes(client_id);
create index if not exists idx_quotes_request_id on public.quotes(request_id);
-- <<< END 202501140001_init.sql

-- >>> BEGIN 202501140002_rls.sql
-- RLS policies for CRM tables

alter table public.clients enable row level security;
alter table public.requests enable row level security;
alter table public.quotes enable row level security;
alter table public.settings enable row level security;

-- Clients: only authenticated users
create policy "Clients select authenticated"
on public.clients
for select
using (auth.role() = 'authenticated');

create policy "Clients insert authenticated"
on public.clients
for insert
with check (auth.role() = 'authenticated');

create policy "Clients update authenticated"
on public.clients
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Clients delete authenticated"
on public.clients
for delete
using (auth.role() = 'authenticated');

-- Requests: public can insert new form entries, authenticated can read/update/delete/insert
create policy "Requests insert public form"
on public.requests
for insert
with check (
  auth.role() = 'anon'
  and status = 'new'
  and source = 'form'
  and client_id is null
);

create policy "Requests insert authenticated"
on public.requests
for insert
with check (auth.role() = 'authenticated');

create policy "Requests select authenticated"
on public.requests
for select
using (auth.role() = 'authenticated');

create policy "Requests update authenticated"
on public.requests
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Requests delete authenticated"
on public.requests
for delete
using (auth.role() = 'authenticated');

-- Quotes: only authenticated users
create policy "Quotes select authenticated"
on public.quotes
for select
using (auth.role() = 'authenticated');

create policy "Quotes insert authenticated"
on public.quotes
for insert
with check (auth.role() = 'authenticated');

create policy "Quotes update authenticated"
on public.quotes
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Quotes delete authenticated"
on public.quotes
for delete
using (auth.role() = 'authenticated');

-- Settings: only authenticated users
create policy "Settings select authenticated"
on public.settings
for select
using (auth.role() = 'authenticated');

create policy "Settings insert authenticated"
on public.settings
for insert
with check (auth.role() = 'authenticated');

create policy "Settings update authenticated"
on public.settings
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Settings delete authenticated"
on public.settings
for delete
using (auth.role() = 'authenticated');
-- <<< END 202501140002_rls.sql

-- >>> BEGIN 202501150001_settings_public.sql
-- Allow public read of settings for site branding.
drop policy if exists "Settings select authenticated" on public.settings;
drop policy if exists "Settings select public" on public.settings;

create policy "Settings select public"
on public.settings
for select
using (true);
-- <<< END 202501150001_settings_public.sql

-- >>> BEGIN 202501150002_roles.sql
-- User roles and profiles

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'staff');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'staff',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', email)
from auth.users
on conflict (id) do nothing;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Profiles select own or admin" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;
drop policy if exists "Profiles update admin" on public.profiles;
drop policy if exists "Profiles insert own" on public.profiles;
drop policy if exists "Profiles insert admin" on public.profiles;

create policy "Profiles select own or admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "Profiles update own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy "Profiles update admin"
on public.profiles
for update
using (public.is_admin())
with check (true);

create policy "Profiles insert own"
on public.profiles
for insert
with check (id = auth.uid());

create policy "Profiles insert admin"
on public.profiles
for insert
with check (public.is_admin());

-- Role-based policies for CRM tables
drop policy if exists "Clients select authenticated" on public.clients;
drop policy if exists "Clients insert authenticated" on public.clients;
drop policy if exists "Clients update authenticated" on public.clients;
drop policy if exists "Clients delete authenticated" on public.clients;
drop policy if exists "Clients select staff" on public.clients;
drop policy if exists "Clients insert staff" on public.clients;
drop policy if exists "Clients update staff" on public.clients;
drop policy if exists "Clients delete admin" on public.clients;

create policy "Clients select staff"
on public.clients
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Clients insert staff"
on public.clients
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Clients update staff"
on public.clients
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Clients delete admin"
on public.clients
for delete
using (public.is_admin());

drop policy if exists "Requests select authenticated" on public.requests;
drop policy if exists "Requests insert authenticated" on public.requests;
drop policy if exists "Requests update authenticated" on public.requests;
drop policy if exists "Requests delete authenticated" on public.requests;
drop policy if exists "Requests select staff" on public.requests;
drop policy if exists "Requests insert staff" on public.requests;
drop policy if exists "Requests update staff" on public.requests;
drop policy if exists "Requests delete admin" on public.requests;

create policy "Requests select staff"
on public.requests
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Requests insert staff"
on public.requests
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Requests update staff"
on public.requests
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Requests delete admin"
on public.requests
for delete
using (public.is_admin());

drop policy if exists "Quotes select authenticated" on public.quotes;
drop policy if exists "Quotes insert authenticated" on public.quotes;
drop policy if exists "Quotes update authenticated" on public.quotes;
drop policy if exists "Quotes delete authenticated" on public.quotes;
drop policy if exists "Quotes select staff" on public.quotes;
drop policy if exists "Quotes insert staff" on public.quotes;
drop policy if exists "Quotes update staff" on public.quotes;
drop policy if exists "Quotes delete admin" on public.quotes;

create policy "Quotes select staff"
on public.quotes
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Quotes insert staff"
on public.quotes
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quotes update staff"
on public.quotes
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quotes delete admin"
on public.quotes
for delete
using (public.is_admin());

drop policy if exists "Settings insert authenticated" on public.settings;
drop policy if exists "Settings update authenticated" on public.settings;
drop policy if exists "Settings delete authenticated" on public.settings;
drop policy if exists "Settings insert admin" on public.settings;
drop policy if exists "Settings update admin" on public.settings;
drop policy if exists "Settings delete admin" on public.settings;

create policy "Settings insert admin"
on public.settings
for insert
with check (public.is_admin());

create policy "Settings update admin"
on public.settings
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Settings delete admin"
on public.settings
for delete
using (public.is_admin());
-- <<< END 202501150002_roles.sql

-- >>> BEGIN 202501150003_extended_schema.sql
-- Extended CRM schema for single-company operations

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('todo', 'doing', 'done', 'blocked');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_entity') then
    create type public.activity_entity as enum ('client', 'request', 'quote', 'contact', 'task', 'attachment');
  end if;
end $$;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  title text not null,
  description text,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_at timestamptz,
  client_id uuid references public.clients(id) on delete set null,
  request_id uuid references public.requests(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type public.activity_entity not null,
  entity_id uuid not null,
  action text not null,
  details jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type public.activity_entity not null,
  entity_id uuid not null,
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_quote_items_updated_at on public.quote_items;
create trigger set_quote_items_updated_at
before update on public.quote_items
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create index if not exists idx_contacts_client_id on public.contacts(client_id);
create index if not exists idx_contacts_primary on public.contacts(client_id, is_primary);
create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_at on public.tasks(due_at);
create index if not exists idx_activity_entity on public.activity_log(entity_type, entity_id);
create index if not exists idx_activity_created_at on public.activity_log(created_at desc);
create index if not exists idx_attachments_entity on public.attachments(entity_type, entity_id);

alter table public.contacts enable row level security;
alter table public.quote_items enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.attachments enable row level security;

drop policy if exists "Contacts select staff" on public.contacts;
drop policy if exists "Contacts insert staff" on public.contacts;
drop policy if exists "Contacts update staff" on public.contacts;
drop policy if exists "Contacts delete admin" on public.contacts;

create policy "Contacts select staff"
on public.contacts
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Contacts insert staff"
on public.contacts
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Contacts update staff"
on public.contacts
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Contacts delete admin"
on public.contacts
for delete
using (public.is_admin());

drop policy if exists "Quote items select staff" on public.quote_items;
drop policy if exists "Quote items insert staff" on public.quote_items;
drop policy if exists "Quote items update staff" on public.quote_items;
drop policy if exists "Quote items delete admin" on public.quote_items;

create policy "Quote items select staff"
on public.quote_items
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Quote items insert staff"
on public.quote_items
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quote items update staff"
on public.quote_items
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quote items delete admin"
on public.quote_items
for delete
using (public.is_admin());

drop policy if exists "Tasks select staff" on public.tasks;
drop policy if exists "Tasks insert staff" on public.tasks;
drop policy if exists "Tasks update staff" on public.tasks;
drop policy if exists "Tasks delete admin" on public.tasks;

create policy "Tasks select staff"
on public.tasks
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Tasks insert staff"
on public.tasks
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Tasks update staff"
on public.tasks
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Tasks delete admin"
on public.tasks
for delete
using (public.is_admin());

drop policy if exists "Activity select staff" on public.activity_log;
drop policy if exists "Activity insert staff" on public.activity_log;
drop policy if exists "Activity delete admin" on public.activity_log;

create policy "Activity select staff"
on public.activity_log
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Activity insert staff"
on public.activity_log
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Activity delete admin"
on public.activity_log
for delete
using (public.is_admin());

drop policy if exists "Attachments select staff" on public.attachments;
drop policy if exists "Attachments insert staff" on public.attachments;
drop policy if exists "Attachments update staff" on public.attachments;
drop policy if exists "Attachments delete admin" on public.attachments;

create policy "Attachments select staff"
on public.attachments
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Attachments insert staff"
on public.attachments
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Attachments update staff"
on public.attachments
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Attachments delete admin"
on public.attachments
for delete
using (public.is_admin());
-- <<< END 202501150003_extended_schema.sql

-- >>> BEGIN 202501150004_public_quote_features.sql
-- Public quote link, templates, services, acceptances, versions, invoices, events, discounts

do $$
begin
  if not exists (select 1 from pg_type where typname = 'discount_type') then
    create type public.discount_type as enum ('percent', 'quantity');
  end if;
  if not exists (select 1 from pg_type where typname = 'quote_event_type') then
    create type public.quote_event_type as enum ('sent', 'opened', 'clicked', 'downloaded', 'accepted', 'declined');
  end if;
  if not exists (select 1 from pg_type where typname = 'quote_acceptance_status') then
    create type public.quote_acceptance_status as enum ('accepted', 'declined');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('pending', 'paid', 'overdue');
  end if;
end $$;

-- add canceled status for tasks
do $$
begin
  if exists (select 1 from pg_type where typname = 'task_status') then
    begin
      alter type public.task_status add value if not exists 'canceled';
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

create table if not exists public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  unit text,
  service_type text,
  default_price_cents integer not null default 0,
  default_deadline_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  version integer not null,
  reason text,
  snapshot jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (quote_id, version)
);

create table if not exists public.quote_acceptances (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  status public.quote_acceptance_status not null,
  name text not null,
  comment text,
  accepted_terms boolean not null default false,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  event_type public.quote_event_type not null,
  payload jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  amount_cents integer not null default 0,
  due_at timestamptz,
  status public.invoice_status not null default 'pending',
  paid_at timestamptz,
  external_id text,
  payment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  endpoint text not null,
  created_at timestamptz not null default now()
);

alter table public.quotes
  add column if not exists public_token uuid unique,
  add column if not exists public_expires_at timestamptz,
  add column if not exists template_id uuid references public.proposal_templates(id) on delete set null,
  add column if not exists template_snapshot text,
  add column if not exists discount_type public.discount_type,
  add column if not exists discount_percent integer not null default 0,
  add column if not exists discount_quantity integer not null default 0;

alter table public.quote_items
  add column if not exists service_id uuid references public.services(id) on delete set null;

alter table public.tasks
  add column if not exists task_type text not null default 'general',
  add column if not exists auto_generated boolean not null default false;

drop trigger if exists set_proposal_templates_updated_at on public.proposal_templates;
create trigger set_proposal_templates_updated_at
before update on public.proposal_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create index if not exists idx_quote_public_token on public.quotes(public_token);
create index if not exists idx_quote_public_expires on public.quotes(public_expires_at);
create index if not exists idx_services_active on public.services(is_active);
create index if not exists idx_templates_active on public.proposal_templates(is_active);
create index if not exists idx_quote_versions_quote on public.quote_versions(quote_id, version desc);
create index if not exists idx_quote_events_quote on public.quote_events(quote_id, created_at desc);
create index if not exists idx_quote_acceptances_quote on public.quote_acceptances(quote_id, created_at desc);
create index if not exists idx_invoices_quote on public.invoices(quote_id);
create index if not exists idx_rate_limits_ip on public.rate_limits(ip, created_at desc);

alter table public.proposal_templates enable row level security;
alter table public.services enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_acceptances enable row level security;
alter table public.quote_events enable row level security;
alter table public.invoices enable row level security;
alter table public.rate_limits enable row level security;

drop policy if exists "Templates select staff" on public.proposal_templates;
drop policy if exists "Templates insert admin" on public.proposal_templates;
drop policy if exists "Templates update admin" on public.proposal_templates;
drop policy if exists "Templates delete admin" on public.proposal_templates;

create policy "Templates select staff"
on public.proposal_templates
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Templates insert admin"
on public.proposal_templates
for insert
with check (public.is_admin());

create policy "Templates update admin"
on public.proposal_templates
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Templates delete admin"
on public.proposal_templates
for delete
using (public.is_admin());

drop policy if exists "Services select staff" on public.services;
drop policy if exists "Services insert admin" on public.services;
drop policy if exists "Services update admin" on public.services;
drop policy if exists "Services delete admin" on public.services;

create policy "Services select staff"
on public.services
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Services insert admin"
on public.services
for insert
with check (public.is_admin());

create policy "Services update admin"
on public.services
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Services delete admin"
on public.services
for delete
using (public.is_admin());

drop policy if exists "Quote versions select staff" on public.quote_versions;
drop policy if exists "Quote versions insert staff" on public.quote_versions;
drop policy if exists "Quote versions delete admin" on public.quote_versions;

create policy "Quote versions select staff"
on public.quote_versions
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Quote versions insert staff"
on public.quote_versions
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quote versions delete admin"
on public.quote_versions
for delete
using (public.is_admin());

drop policy if exists "Quote acceptances select staff" on public.quote_acceptances;
drop policy if exists "Quote acceptances insert staff" on public.quote_acceptances;
drop policy if exists "Quote acceptances delete admin" on public.quote_acceptances;

create policy "Quote acceptances select staff"
on public.quote_acceptances
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Quote acceptances insert staff"
on public.quote_acceptances
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quote acceptances delete admin"
on public.quote_acceptances
for delete
using (public.is_admin());

drop policy if exists "Quote events select staff" on public.quote_events;
drop policy if exists "Quote events insert staff" on public.quote_events;
drop policy if exists "Quote events delete admin" on public.quote_events;

create policy "Quote events select staff"
on public.quote_events
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Quote events insert staff"
on public.quote_events
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Quote events delete admin"
on public.quote_events
for delete
using (public.is_admin());

drop policy if exists "Invoices select staff" on public.invoices;
drop policy if exists "Invoices insert staff" on public.invoices;
drop policy if exists "Invoices update staff" on public.invoices;
drop policy if exists "Invoices delete admin" on public.invoices;

create policy "Invoices select staff"
on public.invoices
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Invoices insert staff"
on public.invoices
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Invoices update staff"
on public.invoices
for update
using (public.current_user_role() in ('admin', 'staff'))
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Invoices delete admin"
on public.invoices
for delete
using (public.is_admin());

drop policy if exists "Rate limits insert staff" on public.rate_limits;
drop policy if exists "Rate limits select staff" on public.rate_limits;

create policy "Rate limits insert staff"
on public.rate_limits
for insert
with check (public.current_user_role() in ('admin', 'staff'));

create policy "Rate limits select staff"
on public.rate_limits
for select
using (public.current_user_role() in ('admin', 'staff'));

create or replace function public.ensure_quote_public_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  validity_days integer;
begin
  if new.status = 'sent' then
    if new.public_token is null then
      new.public_token = gen_random_uuid();
    end if;
    if new.public_expires_at is null then
      select proposal_validity_days into validity_days
      from public.settings
      order by created_at asc
      limit 1;
      new.public_expires_at = now() + make_interval(days => coalesce(validity_days, 14));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists set_quote_public_link on public.quotes;
create trigger set_quote_public_link
before insert or update on public.quotes
for each row execute function public.ensure_quote_public_link();

create or replace function public.handle_quote_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'sent' and old.status is distinct from new.status then
    insert into public.tasks (title, description, status, priority, due_at, quote_id, task_type, auto_generated)
    select
      format('Follow-up proposta %s', new.id),
      format('Follow-up automatico D+%s', days),
      'todo',
      'medium',
      now() + (days || ' days')::interval,
      new.id,
      'followup',
      true
    from unnest(array[2,5,10]) as days;

    insert into public.quote_events (quote_id, event_type, payload)
    values (new.id, 'sent', jsonb_build_object('status', new.status));
  end if;

  if new.status in ('approved', 'lost') and old.status is distinct from new.status then
    update public.tasks
    set status = 'canceled'
    where quote_id = new.id
      and task_type = 'followup'
      and status in ('todo', 'doing', 'blocked');
  end if;

  return new;
end;
$$;

drop trigger if exists on_quote_status_change on public.quotes;
create trigger on_quote_status_change
after update on public.quotes
for each row execute function public.handle_quote_status_change();

create or replace function public.create_quote_version(p_quote_id uuid, p_reason text default null, p_created_by uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  quote_payload jsonb;
  items_payload jsonb;
begin
  select coalesce(max(version), 0) + 1 into next_version
  from public.quote_versions
  where quote_id = p_quote_id;

  select to_jsonb(q.*) into quote_payload
  from public.quotes q
  where q.id = p_quote_id;

  select coalesce(jsonb_agg(to_jsonb(i.*) order by i.sort_order), '[]'::jsonb)
  into items_payload
  from public.quote_items i
  where i.quote_id = p_quote_id;

  insert into public.quote_versions (quote_id, version, reason, snapshot, created_by)
  values (
    p_quote_id,
    next_version,
    p_reason,
    jsonb_build_object('quote', quote_payload, 'items', items_payload),
    p_created_by
  );
end;
$$;

create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_row public.quotes%rowtype;
  client_row public.clients%rowtype;
  items_payload jsonb;
  settings_row public.settings%rowtype;
  attachments_payload jsonb;
begin
  select * into quote_row
  from public.quotes
  where public_token = p_token
    and (public_expires_at is null or public_expires_at > now());

  if quote_row.id is null then
    return null;
  end if;

  select * into client_row from public.clients where id = quote_row.client_id;
  select * into settings_row from public.settings order by created_at asc limit 1;

  select coalesce(jsonb_agg(to_jsonb(i.*) order by i.sort_order), '[]'::jsonb)
  into items_payload
  from public.quote_items i
  where i.quote_id = quote_row.id;

  select coalesce(jsonb_agg(to_jsonb(a.*) order by a.created_at desc), '[]'::jsonb)
  into attachments_payload
  from public.attachments a
  where a.entity_type = 'quote'
    and a.entity_id = quote_row.id;

  return jsonb_build_object(
    'quote', to_jsonb(quote_row),
    'client', to_jsonb(client_row),
    'items', items_payload,
    'settings', to_jsonb(settings_row),
    'attachments', attachments_payload
  );
end;
$$;

grant execute on function public.get_public_quote(uuid) to anon, authenticated;
-- <<< END 202501150004_public_quote_features.sql

-- >>> BEGIN 202501150005_public_access_and_audit.sql
-- Public access hardening, audit log, and public quote actions

-- Ensure public insert policy for requests (form)
drop policy if exists "Requests insert public form" on public.requests;
create policy "Requests insert public form"
on public.requests
for insert
with check (
  auth.role() = 'anon'
  and status = 'new'
  and source = 'form'
  and client_id is null
);

-- Activity log enhancements
alter table public.activity_log
  add column if not exists actor_id uuid references public.profiles(id) on delete set null,
  add column if not exists payload jsonb;

-- Attachments bucket (for storage integration)
alter table public.attachments
  add column if not exists bucket text not null default 'quote-attachments';

-- Audit log table for critical changes
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_table on public.audit_log(table_name, record_id);
create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "Audit select staff" on public.audit_log;
drop policy if exists "Audit insert authenticated" on public.audit_log;

create policy "Audit select staff"
on public.audit_log
for select
using (public.current_user_role() in ('admin', 'staff'));

create policy "Audit insert authenticated"
on public.audit_log
for insert
with check (auth.role() = 'authenticated');

create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    insert into public.audit_log (table_name, record_id, action, old_data, new_data, actor_id)
    values (tg_table_name, old.id, tg_op, to_jsonb(old), null, auth.uid());
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_log (table_name, record_id, action, old_data, new_data, actor_id)
    values (tg_table_name, new.id, tg_op, to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  else
    insert into public.audit_log (table_name, record_id, action, old_data, new_data, actor_id)
    values (tg_table_name, new.id, tg_op, null, to_jsonb(new), auth.uid());
    return new;
  end if;
end;
$$;

-- Triggers for audit (critical tables)
drop trigger if exists audit_clients_changes on public.clients;
create trigger audit_clients_changes
after insert or update or delete on public.clients
for each row execute function public.audit_changes();

drop trigger if exists audit_requests_changes on public.requests;
create trigger audit_requests_changes
after insert or update or delete on public.requests
for each row execute function public.audit_changes();

drop trigger if exists audit_quotes_changes on public.quotes;
create trigger audit_quotes_changes
after insert or update or delete on public.quotes
for each row execute function public.audit_changes();

drop trigger if exists audit_quote_items_changes on public.quote_items;
create trigger audit_quote_items_changes
after insert or update or delete on public.quote_items
for each row execute function public.audit_changes();

drop trigger if exists audit_services_changes on public.services;
create trigger audit_services_changes
after insert or update or delete on public.services
for each row execute function public.audit_changes();

drop trigger if exists audit_templates_changes on public.proposal_templates;
create trigger audit_templates_changes
after insert or update or delete on public.proposal_templates
for each row execute function public.audit_changes();

drop trigger if exists audit_invoices_changes on public.invoices;
create trigger audit_invoices_changes
after insert or update or delete on public.invoices
for each row execute function public.audit_changes();

drop trigger if exists audit_settings_changes on public.settings;
create trigger audit_settings_changes
after insert or update or delete on public.settings
for each row execute function public.audit_changes();

-- Public quote actions (token based)
create or replace function public.record_quote_event(
  p_token uuid,
  p_event_type public.quote_event_type,
  p_payload jsonb default null,
  p_ip text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  quote_row public.quotes%rowtype;
begin
  select * into quote_row
  from public.quotes
  where public_token = p_token
    and (public_expires_at is null or public_expires_at > now())
    and status in ('sent', 'approved');

  if quote_row.id is null then
    return;
  end if;

  insert into public.quote_events (quote_id, event_type, payload, ip, user_agent)
  values (quote_row.id, p_event_type, p_payload, p_ip, p_user_agent);
end;
$$;

create or replace function public.record_quote_acceptance(
  p_token uuid,
  p_status public.quote_acceptance_status,
  p_name text,
  p_comment text default null,
  p_accepted_terms boolean default false,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  quote_row public.quotes%rowtype;
  acceptance_row public.quote_acceptances%rowtype;
  next_status public.quote_status;
begin
  select * into quote_row
  from public.quotes
  where public_token = p_token
    and (public_expires_at is null or public_expires_at > now())
    and status in ('sent', 'approved');

  if quote_row.id is null then
    return null;
  end if;

  insert into public.quote_acceptances (quote_id, status, name, comment, accepted_terms, ip, user_agent)
  values (quote_row.id, p_status, p_name, p_comment, p_accepted_terms, p_ip, p_user_agent)
  returning * into acceptance_row;

  next_status := case when p_status = 'accepted' then 'approved' else 'lost' end;
  update public.quotes set status = next_status where id = quote_row.id;

  insert into public.quote_events (quote_id, event_type, payload, ip, user_agent)
  values (
    quote_row.id,
    case when p_status = 'accepted' then 'accepted' else 'declined' end,
    jsonb_build_object('name', p_name, 'comment', p_comment),
    p_ip,
    p_user_agent
  );

  return jsonb_build_object(
    'acceptance', to_jsonb(acceptance_row),
    'quote', to_jsonb(quote_row)
  );
end;
$$;

grant execute on function public.record_quote_event(uuid, public.quote_event_type, jsonb, text, text) to anon, authenticated;
grant execute on function public.record_quote_acceptance(uuid, public.quote_acceptance_status, text, text, boolean, text, text) to anon, authenticated;

-- Enforce public quote visibility rules
create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  quote_row public.quotes%rowtype;
  client_row public.clients%rowtype;
  items_payload jsonb;
  settings_row public.settings%rowtype;
  attachments_payload jsonb;
begin
  select * into quote_row
  from public.quotes
  where public_token = p_token
    and (public_expires_at is null or public_expires_at > now())
    and status in ('sent', 'approved');

  if quote_row.id is null then
    return null;
  end if;

  select * into client_row from public.clients where id = quote_row.client_id;
  select * into settings_row from public.settings order by created_at asc limit 1;

  select coalesce(jsonb_agg(to_jsonb(i.*) order by i.sort_order), '[]'::jsonb)
  into items_payload
  from public.quote_items i
  where i.quote_id = quote_row.id;

  select coalesce(jsonb_agg(to_jsonb(a.*) order by a.created_at desc), '[]'::jsonb)
  into attachments_payload
  from public.attachments a
  where a.entity_type = 'quote'
    and a.entity_id = quote_row.id;

  return jsonb_build_object(
    'quote', to_jsonb(quote_row),
    'client', to_jsonb(client_row),
    'items', items_payload,
    'settings', to_jsonb(settings_row),
    'attachments', attachments_payload
  );
end;
$$;

grant execute on function public.get_public_quote(uuid) to anon, authenticated;
-- <<< END 202501150005_public_access_and_audit.sql
