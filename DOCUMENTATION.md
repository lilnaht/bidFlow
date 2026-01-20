# bidFlow - Technical Documentation

This document describes the full technical setup of the bidFlow CRM site. It covers the stack, architecture, database, security (RLS), features, and operations for a single-company deployment.

## 1) Overview

bidFlow is a single-company CRM + quoting system with:
- Public marketing pages and a request form.
- Admin panel with authentication and role-based access (admin/staff).
- Supabase as database + auth + realtime.
- PDF generation for professional quotes.
- Public quote links with acceptance flow and signed attachments.

## 2) Tech Stack

- Frontend: React 18 + TypeScript + Vite
- UI: shadcn-ui + Tailwind CSS + Radix UI
- State/Data: React Query
- Backend: Supabase (Postgres + Auth + Realtime + RLS)
- PDF: @react-pdf/renderer
- Date utils: date-fns

## 3) Project Structure

- `src/components/` UI components, layouts, and PDF template
- `src/pages/` public pages and admin pages
- `src/integrations/supabase/` supabase client, queries, and types
- `src/contexts/` auth context
- `src/hooks/` reusable hooks (settings)
- `supabase/migrations/` database schema and RLS
- `supabase/functions/` Edge Functions (public form, quote events, accept/decline)
- `public/` static assets (favicon/logo)

## 4) Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 5) Supabase Schema

### Core tables
- `clients`: companies/people you sell to
- `requests`: public inbound quote requests
- `quotes`: proposals (budget)
- `quote_items`: itemized services in a quote
- `contacts`: multiple contacts per client
- `tasks`: internal follow-ups
- `settings`: company settings for branding and proposal rules
- `profiles`: user profile + role (admin/staff)
- `activity_log`: audit-like activity feed
- `attachments`: metadata for files (storage integration)

### Enums
- `request_status`: new, review, sent, approved, lost
- `quote_status`: draft, sent, approved, lost
- `client_status`: active, negotiation, inactive
- `user_role`: admin, staff
- `task_status`: todo, doing, done, blocked
- `task_priority`: low, medium, high
- `activity_entity`: client, request, quote, contact, task, attachment

### Migrations
- `supabase/migrations/202501140001_init.sql`
  - Base schema: clients, requests, quotes, settings
  - Updated_at triggers + indexes
- `supabase/migrations/202501140002_rls.sql`
  - Initial RLS policies
- `supabase/migrations/202501150001_settings_public.sql`
  - Public select for settings (used by landing)
- `supabase/migrations/202501150002_roles.sql`
  - profiles + roles
  - functions: current_user_role(), is_admin()
  - trigger to create profiles on auth.users insert
  - role-based policies for CRM tables
- `supabase/migrations/202501150003_extended_schema.sql`
  - contacts, quote_items, tasks, activity_log, attachments
  - RLS policies for new tables
- `supabase/migrations/202501150004_public_quote_features.sql`
  - public quote links, templates, services, versions, acceptances, events, invoices
  - follow-up task triggers on sent quotes
- `supabase/migrations/202501150005_public_access_and_audit.sql`
  - audit_log with old/new payloads
  - activity_log payload/actor_id
  - public quote RPCs for accept/events

### RLS Summary
- Public:
  - `requests` insert from form only (status=new, source=form, client_id null)
  - `settings` select (for branding on public site)
- Token-based:
  - public quote access via `get_public_quote(token)` RPC
  - accept/decline via `record_quote_acceptance(token, ...)` RPC
- Staff/Admin:
  - read/write for clients, requests, quotes, contacts, quote_items, tasks, activity_log, attachments
- Admin only:
  - delete for main CRM tables
  - insert/update/delete for settings
  - update role in profiles

## 6) Authentication and Roles

- Auth via Supabase email/password.
- `AuthProvider` tracks session and user.
- `RequireAuth` protects `/admin/*` routes.
- Roles are stored in `profiles.role` and enforced by RLS.
- Profiles are created automatically for new auth users via trigger.

## 7) Data Access Layer (Queries)

All data is loaded via `src/integrations/supabase/queries.ts`.

Main query groups:
- Requests: `fetchRequests`, `fetchRequestById`, `createRequest`, `updateRequestStatus`
- Quotes: `fetchQuotes`, `fetchQuoteById`, `createQuote`, `updateQuoteStatus`, `updateQuoteAmount`
- Quote Items: `fetchQuoteItemsByQuote`, `createQuoteItems`
- Clients: `fetchClients`, `fetchClientById`, `createClient`, `updateClientStatus`
- Contacts: `fetchContactsByClient`, `createContact`
- Tasks: `fetchTasks`, `fetchTasksByEntity`, `createTask`, `updateTaskStatus`
- Settings: `fetchSettings`, `upsertSettings`
- Profiles: `fetchProfiles`, `updateUserRole`
- Activity: `fetchActivityLog`, `createActivityLog`
- Attachments: `fetchAttachments`, `createAttachment`

## 8) Realtime Updates

Realtime subscriptions are in `src/components/layout/AdminLayout.tsx`.
Tables subscribed:
- requests, quotes, clients, settings
- contacts, tasks, quote_items, activity_log

React Query is invalidated on changes for near real-time UI updates.

## 9) Admin Panel Features

Routes:
- `/admin` (dashboard)
- `/admin/login`
- `/admin/solicitacoes`
- `/admin/solicitacoes/:id`
- `/admin/orcamentos`
- `/admin/orcamentos/novo`
- `/admin/orcamentos/:id`
- `/admin/servicos`
- `/admin/templates`
- `/admin/faturas`
- `/admin/clientes`
- `/admin/clientes/novo`
- `/admin/clientes/:id`
- `/admin/tarefas`
- `/admin/usuarios`
- `/admin/relatorios`
- `/admin/configuracoes`

Key capabilities:
- Create and manage quotes, including itemized services and auto total
- Update request/quote/client statuses
- Manage contacts per client
- Manage tasks globally and per client/request
- Manage team roles (admin/staff)
- Settings form controls branding and proposal defaults
- Activity log on key entities
- PDF generation for professional proposals
- Kanban boards for requests and quotes
- Services catalog + proposal templates by service type
- Quote versions and acceptance history
- Invoices tracking (external payment link)

## 10) Public Site Features

- Marketing pages: home, portfolio, services, terms, privacy
- Request form writes to `requests` table
- Branding (name, email, phone, address) sourced from settings
- Logo: `public/logo2.png`
- Public proposal page: `/proposta/:token`

## 11) PDF Generation

Implemented in:
- `src/components/pdf/QuotePdf.tsx`
- `src/pages/admin/AdminQuoteDetail.tsx`
  - `src/pages/PublicQuote.tsx`

Workflow:
- Admin clicks "Baixar PDF"
- PDF is generated client-side using `@react-pdf/renderer`
- Branding comes from `settings` + `/logo2.png`
- Includes client data, items, totals, validity dates

## 12) Branding and Settings

Settings table fields (used across the site):
- company_name, company_email, company_phone, company_address
- monthly_goal_cents
- proposal_validity_days, proposal_language, proposal_template
- notify_* flags

Hook:
- `src/hooks/use-settings.ts` provides settings + fallback values
- Default company name: `bidFlow`

## 13) Running the Project

Install:
```
npm install
```

Development:
```
npm run dev
```

Build:
```
npm run build
```

Preview:
```
npm run preview
```

## 14) Operational Notes

- Run migrations with `supabase db push`
- Create an admin user and set role:
```
update public.profiles set role = 'admin' where email = 'you@example.com';
```
- Enable Realtime replication for tables you need in the Supabase dashboard
- For attachments: create a Supabase Storage bucket and store file metadata in `attachments`
- Deploy Edge Functions:
  - `submit-request` (public form validation + rate limit + captcha)
  - `quote-event` (opened/clicked/downloaded)
  - `quote-response` (accept/decline)
  - `quote-attachments` (signed URLs)

## 15) Single-Company Assumption

This schema assumes a single company (no organizations table).
If multi-company is needed later, add `organization_id` to all core tables and update RLS accordingly.
