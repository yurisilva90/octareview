-- OctaReview: base multiempresa para Comercial, Gestão e Portal do Cliente.
-- Toda tabela pública usa RLS. Segredos de integrações ficam em Edge Function
-- Secrets, nunca em tabelas expostas ou no cliente web.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  document text,
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id bigint,
  role text not null check (role in ('admin', 'commercial', 'finance', 'success', 'partner', 'customer')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  capacity integer not null default 25 check (capacity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.accounts (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  legal_name text,
  document text,
  category text,
  source text,
  city text,
  state text,
  address text,
  phone text,
  email text,
  website text,
  google_place_id text,
  google_profile_url text,
  potential text not null default 'medium' check (potential in ('high', 'medium', 'low')),
  lifecycle_status text not null default 'lead' check (lifecycle_status in ('lead', 'onboarding', 'active', 'at_risk', 'delinquent', 'inactive', 'lost')),
  pipeline_stage text not null default 'new' check (pipeline_stage in ('new', 'contact_started', 'diagnostic_presented', 'proposal_sent', 'negotiation', 'won', 'onboarding', 'active', 'renewal', 'lost')),
  follow_up_status text not null default 'none' check (follow_up_status in ('none', 'waiting', 'scheduled', 'closing', 'post_sale')),
  owner_member_id bigint references public.organization_members(id) on delete set null,
  billing_provider text,
  billing_provider_customer_id text,
  client_since date,
  closed_at timestamptz,
  lost_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_members
  add constraint organization_members_account_id_fkey
  foreign key (account_id) references public.accounts(id) on delete cascade;

create table public.contacts (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  whatsapp text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  purpose text not null default 'commercial' check (purpose in ('commercial', 'closing', 'success', 'finance', 'support')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.team_members (
  team_id bigint not null references public.teams(id) on delete cascade,
  member_id bigint not null references public.organization_members(id) on delete cascade,
  weight smallint not null default 1 check (weight between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (team_id, member_id)
);

create table public.distribution_rules (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  priority integer not null check (priority > 0),
  conditions jsonb not null default '{}'::jsonb,
  strategy text not null default 'round_robin' check (strategy in ('fixed_member', 'team_round_robin', 'weighted_round_robin', 'lowest_load', 'highest_conversion', 'manual')),
  assignee_member_id bigint references public.organization_members(id) on delete set null,
  assignee_team_id bigint references public.teams(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, priority),
  check (assignee_member_id is not null or assignee_team_id is not null or strategy = 'manual')
);

create table public.follow_ups (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  responsible_member_id bigint references public.organization_members(id) on delete set null,
  reason text not null check (reason in ('send_diagnostic', 'follow_proposal', 'partner_decision', 'send_purchase_link', 'onboarding', 'first_month_results', 'renewal', 'billing', 'other')),
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'canceled', 'overdue')),
  due_at timestamptz not null,
  completed_at timestamptz,
  outcome text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (length(body) between 1 and 10000),
  visibility text not null default 'internal' check (visibility in ('internal', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint references public.accounts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  activity_type text not null,
  title text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.tags (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  scope text not null default 'account' check (scope in ('lead', 'customer', 'account', 'billing', 'campaign')),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.account_tags (
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (account_id, tag_id)
);

create table public.diagnostics (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  mode text not null default 'live' check (mode in ('live', 'demo')),
  provider text not null default 'apify',
  actor_id text,
  input jsonb not null default '{}'::jsonb,
  report jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.account_units (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  name text not null,
  document text,
  address text,
  city text,
  state text,
  google_place_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, name)
);

create table public.products (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  product_type text not null check (product_type in ('base_plan', 'recurring_addon', 'one_time_project')),
  billing_type text not null check (billing_type in ('recurring', 'one_time', 'custom')),
  interval text check (interval in ('monthly', 'quarterly', 'semiannual', 'annual')),
  price numeric(12,2) check (price is null or price >= 0),
  description text,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.subscriptions (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'trial', 'active', 'past_due', 'paused', 'canceled', 'ended')),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  billing_interval text check (billing_interval in ('monthly', 'quarterly', 'semiannual', 'annual', 'one_time')),
  due_day smallint check (due_day between 1 and 28),
  starts_on date not null default current_date,
  current_period_start date,
  current_period_end date,
  canceled_at timestamptz,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  subscription_id bigint references public.subscriptions(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'scheduled', 'paid', 'overdue', 'canceled', 'refunded')),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  paid_at timestamptz,
  payment_method text,
  external_id text,
  payment_url text,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  invoice_id bigint not null references public.invoices(id) on delete cascade,
  status text not null check (status in ('pending', 'confirmed', 'received', 'refunded', 'chargeback', 'failed')),
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  received_at timestamptz,
  external_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.plates (
  id bigint generated always as identity primary key,
  public_id text not null unique check (public_id ~ '^[AP][0-9]{6,}$'),
  organization_id bigint not null references public.organizations(id) on delete cascade,
  plate_type text not null check (plate_type in ('main', 'employee')),
  lifecycle_status text not null default 'manufactured' check (lifecycle_status in ('manufactured', 'available', 'shipped', 'activated', 'linked', 'configured', 'in_use', 'disabled', 'lost')),
  activation_code_hash text not null,
  account_id bigint references public.accounts(id) on delete set null,
  unit_id bigint references public.account_units(id) on delete set null,
  destination_config jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plate_assignments (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  plate_id bigint not null references public.plates(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  unit_id bigint references public.account_units(id) on delete set null,
  contact_id bigint references public.contacts(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  reason text,
  check (unassigned_at is null or unassigned_at >= assigned_at)
);

create table public.customer_portal_settings (
  account_id bigint primary key references public.accounts(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  enabled_modules text[] not null default array['reputation', 'plates', 'team', 'contacts', 'reports']::text[],
  branding jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  portal_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.organization_settings (
  organization_id bigint primary key references public.organizations(id) on delete cascade,
  commercial jsonb not null default '{}'::jsonb,
  customer_portal jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('apify', 'asaas', 'google_business', 'whatsapp', 'email')),
  status text not null default 'not_configured' check (status in ('not_configured', 'connected', 'error', 'disabled')),
  config jsonb not null default '{}'::jsonb,
  secret_reference text,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table public.notifications (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  changes jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Índices de FKs, filtros operacionais e políticas RLS.
create index organization_members_user_id_idx on public.organization_members (user_id, status);
create index organization_members_account_id_idx on public.organization_members (account_id) where account_id is not null;
create index accounts_organization_status_idx on public.accounts (organization_id, lifecycle_status, updated_at desc);
create index accounts_organization_pipeline_idx on public.accounts (organization_id, pipeline_stage, created_at desc);
create index accounts_owner_member_id_idx on public.accounts (owner_member_id) where owner_member_id is not null;
create index contacts_account_id_idx on public.contacts (account_id);
create index teams_organization_id_idx on public.teams (organization_id);
create index team_members_member_id_idx on public.team_members (member_id);
create index distribution_rules_organization_active_idx on public.distribution_rules (organization_id, active, priority);
create index follow_ups_account_id_idx on public.follow_ups (account_id);
create index follow_ups_org_status_due_idx on public.follow_ups (organization_id, status, due_at);
create index follow_ups_responsible_member_id_idx on public.follow_ups (responsible_member_id) where responsible_member_id is not null;
create index notes_account_id_idx on public.notes (account_id, created_at desc);
create index activities_account_id_idx on public.activities (account_id, occurred_at desc) where account_id is not null;
create index activities_organization_id_idx on public.activities (organization_id, occurred_at desc);
create index tags_organization_id_idx on public.tags (organization_id);
create index account_tags_tag_id_idx on public.account_tags (tag_id);
create index diagnostics_account_id_idx on public.diagnostics (account_id, created_at desc);
create index diagnostics_org_status_idx on public.diagnostics (organization_id, status, created_at desc);
create index account_units_account_id_idx on public.account_units (account_id);
create index products_organization_active_idx on public.products (organization_id, active);
create index subscriptions_account_status_idx on public.subscriptions (account_id, status);
create index subscriptions_product_id_idx on public.subscriptions (product_id);
create index invoices_org_status_due_idx on public.invoices (organization_id, status, due_date);
create index invoices_account_id_idx on public.invoices (account_id, due_date desc);
create index invoices_subscription_id_idx on public.invoices (subscription_id) where subscription_id is not null;
create index payments_invoice_id_idx on public.payments (invoice_id);
create index payments_account_id_idx on public.payments (account_id, created_at desc);
create index plates_org_status_idx on public.plates (organization_id, lifecycle_status);
create index plates_account_id_idx on public.plates (account_id) where account_id is not null;
create index plates_unit_id_idx on public.plates (unit_id) where unit_id is not null;
create index plate_assignments_plate_id_idx on public.plate_assignments (plate_id, assigned_at desc);
create index plate_assignments_account_id_idx on public.plate_assignments (account_id, assigned_at desc);
create index plate_assignments_unit_id_idx on public.plate_assignments (unit_id) where unit_id is not null;
create index plate_assignments_contact_id_idx on public.plate_assignments (contact_id) where contact_id is not null;
create index customer_portal_settings_org_id_idx on public.customer_portal_settings (organization_id);
create index integrations_organization_id_idx on public.integrations (organization_id);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_org_member(check_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.organization_members membership
    where membership.organization_id = check_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create or replace function private.has_internal_role(check_organization_id bigint, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.organization_members membership
    where membership.organization_id = check_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function private.is_org_admin(check_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.has_internal_role(check_organization_id, array['admin']::text[]));
$$;

create or replace function private.can_access_account(check_organization_id bigint, check_account_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.organization_members membership
    where membership.organization_id = check_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (
        membership.role in ('admin', 'commercial', 'finance', 'success', 'partner')
        or (membership.role = 'customer' and membership.account_id = check_account_id)
      )
  );
$$;

create or replace function private.shares_organization(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = check_user_id
      and mine.status = 'active'
      and theirs.status = 'active'
  );
$$;

create or replace function private.create_organization_with_owner(organization_name text, organization_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_organization_id bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if length(trim(organization_name)) < 2 or organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid organization name or slug';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (trim(organization_name), organization_slug, current_user_id)
  returning id into new_organization_id;
  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_organization_id, current_user_id, 'admin', 'active');
  insert into public.organization_settings (organization_id) values (new_organization_id);
  return new_organization_id;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.is_org_member(bigint) to authenticated;
grant execute on function private.has_internal_role(bigint, text[]) to authenticated;
grant execute on function private.is_org_admin(bigint) to authenticated;
grant execute on function private.can_access_account(bigint, bigint) to authenticated;
grant execute on function private.shares_organization(uuid) to authenticated;
grant execute on function private.create_organization_with_owner(text, text) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','organizations','organization_members','accounts','contacts','teams','team_members',
    'distribution_rules','follow_ups','notes','activities','tags','account_tags','diagnostics',
    'account_units','products','subscriptions','invoices','payments','plates','plate_assignments',
    'customer_portal_settings','organization_settings','integrations','notifications','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.shares_organization(id)));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_select on public.organizations for select to authenticated
using ((select private.is_org_member(id)));
create policy organizations_update on public.organizations for update to authenticated
using ((select private.is_org_admin(id))) with check ((select private.is_org_admin(id)));

create policy organization_members_select on public.organization_members for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy organization_members_insert on public.organization_members for insert to authenticated
with check ((select private.is_org_admin(organization_id)));
create policy organization_members_update on public.organization_members for update to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));
create policy organization_members_delete on public.organization_members for delete to authenticated
using ((select private.is_org_admin(organization_id)) and user_id <> (select auth.uid()));

create policy accounts_select on public.accounts for select to authenticated
using ((select private.can_access_account(organization_id, id)));
create policy accounts_insert on public.accounts for insert to authenticated
with check ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])));
create policy accounts_update on public.accounts for update to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','finance','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','finance','success','partner']::text[])));
create policy accounts_delete on public.accounts for delete to authenticated
using ((select private.is_org_admin(organization_id)));

create policy contacts_select on public.contacts for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy contacts_write on public.contacts for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])));

create policy teams_select on public.teams for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy teams_write on public.teams for all to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));
create policy team_members_select on public.team_members for select to authenticated
using (exists (select 1 from public.teams team where team.id = team_id and (select private.is_org_member(team.organization_id))));
create policy team_members_write on public.team_members for all to authenticated
using (exists (select 1 from public.teams team where team.id = team_id and (select private.is_org_admin(team.organization_id))))
with check (exists (select 1 from public.teams team where team.id = team_id and (select private.is_org_admin(team.organization_id))));

create policy distribution_rules_select on public.distribution_rules for select to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])));
create policy distribution_rules_write on public.distribution_rules for all to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));

create policy follow_ups_select on public.follow_ups for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy follow_ups_write on public.follow_ups for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])));

create policy notes_select on public.notes for select to authenticated
using ((select private.can_access_account(organization_id, account_id)) and (visibility = 'customer' or (select private.has_internal_role(organization_id, array['admin','commercial','finance','success','partner']::text[]))));
create policy notes_write on public.notes for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])));

create policy activities_select on public.activities for select to authenticated
using ((account_id is null and (select private.is_org_member(organization_id))) or (account_id is not null and (select private.can_access_account(organization_id, account_id))));
create policy activities_insert on public.activities for insert to authenticated
with check ((select private.has_internal_role(organization_id, array['admin','commercial','finance','success','partner']::text[])));

create policy tags_select on public.tags for select to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','finance','success','partner']::text[])));
create policy tags_write on public.tags for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success']::text[])));
create policy account_tags_select on public.account_tags for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy account_tags_write on public.account_tags for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success']::text[])));

create policy diagnostics_select on public.diagnostics for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy diagnostics_insert on public.diagnostics for insert to authenticated
with check ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])) and requested_by = (select auth.uid()));
create policy diagnostics_update on public.diagnostics for update to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])));

create policy account_units_select on public.account_units for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy account_units_write on public.account_units for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success']::text[])));

create policy products_select on public.products for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy products_write on public.products for all to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));

create policy subscriptions_select on public.subscriptions for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy subscriptions_write on public.subscriptions for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','finance','success']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','finance','success']::text[])));
create policy invoices_select on public.invoices for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy invoices_write on public.invoices for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','finance']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','finance']::text[])));
create policy payments_select on public.payments for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy payments_write on public.payments for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','finance']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','finance']::text[])));

create policy plates_select on public.plates for select to authenticated
using (account_id is null and (select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])) or account_id is not null and (select private.can_access_account(organization_id, account_id)));
create policy plates_write on public.plates for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])));
create policy plate_assignments_select on public.plate_assignments for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy plate_assignments_write on public.plate_assignments for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])));

create policy customer_portal_settings_select on public.customer_portal_settings for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy customer_portal_settings_write on public.customer_portal_settings for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','success']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','success']::text[])));
create policy organization_settings_select on public.organization_settings for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy organization_settings_write on public.organization_settings for all to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));
create policy integrations_select on public.integrations for select to authenticated
using ((select private.is_org_admin(organization_id)));
create policy integrations_write on public.integrations for all to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));

create policy notifications_select on public.notifications for select to authenticated
using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy audit_logs_select on public.audit_logs for select to authenticated
using ((select private.is_org_admin(organization_id)));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','organizations','organization_members','accounts','contacts','teams','team_members',
    'distribution_rules','follow_ups','notes','activities','tags','account_tags','diagnostics',
    'account_units','products','subscriptions','invoices','payments','plates','plate_assignments',
    'customer_portal_settings','organization_settings','integrations','notifications'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;
grant select on public.audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','organizations','organization_members','accounts','contacts','teams','distribution_rules',
    'follow_ups','notes','account_units','products','subscriptions','invoices','plates',
    'customer_portal_settings','organization_settings','integrations'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name, table_name);
  end loop;
end $$;
