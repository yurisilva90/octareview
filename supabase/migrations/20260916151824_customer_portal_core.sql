-- OctaReview customer portal core.
-- Reuses public.accounts as the establishment entity and extends it with
-- account-scoped users, employees, smart pages, captured contacts and events.

create extension if not exists pgcrypto with schema extensions;

create table public.account_users (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator' check (role in ('owner', 'admin', 'operator')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, user_id)
);

create table public.employees (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  job_title text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_plate_assignments (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  employee_id bigint not null references public.employees(id) on delete cascade,
  plate_id bigint not null references public.plates(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  check (unassigned_at is null or unassigned_at >= assigned_at)
);

create table public.smart_pages (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  name text not null check (length(trim(name)) between 2 and 120),
  short_description text check (short_description is null or length(short_description) <= 240),
  presentation_text text check (presentation_text is null or length(presentation_text) <= 2000),
  primary_color text not null default '#087f78' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  logo_url text,
  cover_url text,
  footer_text text check (footer_text is null or length(footer_text) <= 5000),
  capture_enabled boolean not null default false,
  capture_config jsonb not null default '{"title":"Receba novidades","description":"Cadastre-se para receber novidades e benefícios.","button_text":"Quero participar","success_message":"Cadastro realizado com sucesso.","fields":[{"key":"full_name","label":"Nome","required":true},{"key":"whatsapp","label":"WhatsApp","required":true}],"consent_required":true,"consent_text":"Ao enviar seus dados, você concorda em receber comunicações deste estabelecimento."}'::jsonb,
  draft_version integer not null default 1 check (draft_version > 0),
  published_version integer,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id)
);

create table public.page_links (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  smart_page_id bigint not null references public.smart_pages(id) on delete cascade,
  link_type text not null default 'custom' check (link_type in ('google_review','whatsapp','whatsapp_group','instagram','facebook','tiktok','telegram','telegram_group','youtube','linkedin','website','store','menu','delivery','booking','reservation','pix','payment','map','form','download','club','loyalty','benefit','coupon','catalog','quote','custom')),
  title text not null check (length(trim(title)) between 1 and 100),
  subtitle text check (subtitle is null or length(subtitle) <= 180),
  icon text,
  url text not null check (length(trim(url)) between 4 and 2048),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.captured_contacts (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  smart_page_id bigint references public.smart_pages(id) on delete set null,
  plate_id bigint references public.plates(id) on delete set null,
  employee_id bigint references public.employees(id) on delete set null,
  source text not null default 'page' check (source in ('page', 'nfc', 'qr', 'direct', 'campaign')),
  full_name text,
  last_name text,
  whatsapp text,
  phone text,
  email text,
  birth_date date,
  city text,
  neighborhood text,
  company text,
  job_title text,
  field_values jsonb not null default '{}'::jsonb,
  consent_accepted boolean not null default false,
  consent_text text,
  campaign text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.interaction_events (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  smart_page_id bigint references public.smart_pages(id) on delete set null,
  plate_id bigint references public.plates(id) on delete set null,
  employee_id bigint references public.employees(id) on delete set null,
  page_link_id bigint references public.page_links(id) on delete set null,
  captured_contact_id bigint references public.captured_contacts(id) on delete set null,
  event_type text not null check (length(event_type) between 2 and 80),
  source text not null default 'page' check (source in ('page', 'nfc', 'qr', 'direct', 'campaign')),
  session_id uuid,
  campaign text,
  device jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.plates
  add column if not exists display_name text,
  add column if not exists location_label text,
  add column if not exists destination_mode text not null default 'page'
    check (destination_mode in ('page', 'redirect'));

create index account_users_user_status_idx on public.account_users (user_id, status, account_id);
create index account_users_organization_id_idx on public.account_users (organization_id, account_id);
create index employees_account_status_idx on public.employees (account_id, status, full_name);
create index employees_organization_id_idx on public.employees (organization_id);
create index employee_plate_assignments_account_idx on public.employee_plate_assignments (account_id, assigned_at desc);
create index employee_plate_assignments_employee_idx on public.employee_plate_assignments (employee_id, assigned_at desc);
create index employee_plate_assignments_plate_idx on public.employee_plate_assignments (plate_id, assigned_at desc);
create unique index employee_plate_assignments_active_plate_uidx on public.employee_plate_assignments (plate_id) where unassigned_at is null;
create unique index employee_plate_assignments_active_employee_uidx on public.employee_plate_assignments (employee_id) where unassigned_at is null;
create index smart_pages_organization_id_idx on public.smart_pages (organization_id);
create index page_links_page_order_idx on public.page_links (smart_page_id, active, sort_order, id);
create index page_links_account_id_idx on public.page_links (account_id);
create index captured_contacts_account_captured_idx on public.captured_contacts (account_id, captured_at desc);
create index captured_contacts_plate_id_idx on public.captured_contacts (plate_id) where plate_id is not null;
create index captured_contacts_employee_id_idx on public.captured_contacts (employee_id) where employee_id is not null;
create index interaction_events_account_occurred_idx on public.interaction_events (account_id, occurred_at desc, id desc);
create index interaction_events_account_type_occurred_idx on public.interaction_events (account_id, event_type, occurred_at desc);
create index interaction_events_plate_occurred_idx on public.interaction_events (plate_id, occurred_at desc) where plate_id is not null;
create index interaction_events_employee_occurred_idx on public.interaction_events (employee_id, occurred_at desc) where employee_id is not null;
create index interaction_events_link_occurred_idx on public.interaction_events (page_link_id, occurred_at desc) where page_link_id is not null;

create or replace function private.can_access_account(check_organization_id bigint, check_account_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.organization_members membership
      where membership.organization_id = check_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and (
          membership.role in ('admin', 'commercial', 'finance', 'success', 'partner')
          or (membership.role = 'customer' and membership.account_id = check_account_id)
        )
    )
    or exists (
      select 1 from public.account_users account_user
      where account_user.organization_id = check_organization_id
        and account_user.account_id = check_account_id
        and account_user.user_id = (select auth.uid())
        and account_user.status = 'active'
    )
  );
$$;

create or replace function private.can_manage_account(check_organization_id bigint, check_account_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.organization_members membership
      where membership.organization_id = check_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role in ('admin', 'success')
    )
    or exists (
      select 1 from public.account_users account_user
      where account_user.organization_id = check_organization_id
        and account_user.account_id = check_account_id
        and account_user.user_id = (select auth.uid())
        and account_user.status = 'active'
        and account_user.role in ('owner', 'admin')
    )
  );
$$;

create or replace function private.can_operate_account(check_organization_id bigint, check_account_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.organization_members membership
      where membership.organization_id = check_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role in ('admin', 'success')
    )
    or exists (
      select 1 from public.account_users account_user
      where account_user.organization_id = check_organization_id
        and account_user.account_id = check_account_id
        and account_user.user_id = (select auth.uid())
        and account_user.status = 'active'
        and account_user.role in ('owner', 'admin', 'operator')
    )
  );
$$;

revoke all on function private.can_manage_account(bigint, bigint) from public, anon;
revoke all on function private.can_operate_account(bigint, bigint) from public, anon;
grant execute on function private.can_manage_account(bigint, bigint) to authenticated;
grant execute on function private.can_operate_account(bigint, bigint) to authenticated;

alter table public.account_users enable row level security;
alter table public.employees enable row level security;
alter table public.employee_plate_assignments enable row level security;
alter table public.smart_pages enable row level security;
alter table public.page_links enable row level security;
alter table public.captured_contacts enable row level security;
alter table public.interaction_events enable row level security;

create policy account_users_select on public.account_users for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_internal_role(organization_id, array['admin','success']::text[]))
  or (select private.can_manage_account(organization_id, account_id))
);
create policy account_users_insert on public.account_users for insert to authenticated
with check ((select private.can_manage_account(organization_id, account_id)));
create policy account_users_update on public.account_users for update to authenticated
using ((select private.can_manage_account(organization_id, account_id)))
with check ((select private.can_manage_account(organization_id, account_id)));
create policy account_users_delete on public.account_users for delete to authenticated
using ((select private.can_manage_account(organization_id, account_id)) and user_id <> (select auth.uid()));

create policy employees_select on public.employees for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy employees_write on public.employees for all to authenticated
using ((select private.can_operate_account(organization_id, account_id)))
with check ((select private.can_operate_account(organization_id, account_id)));

create policy employee_plate_assignments_select on public.employee_plate_assignments for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy employee_plate_assignments_write on public.employee_plate_assignments for all to authenticated
using ((select private.can_operate_account(organization_id, account_id)))
with check ((select private.can_operate_account(organization_id, account_id)));

create policy smart_pages_select on public.smart_pages for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy smart_pages_write on public.smart_pages for all to authenticated
using ((select private.can_operate_account(organization_id, account_id)))
with check ((select private.can_operate_account(organization_id, account_id)));
create policy smart_pages_public_select on public.smart_pages for select to anon
using (status = 'published' and published_at is not null);

create policy page_links_select on public.page_links for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy page_links_write on public.page_links for all to authenticated
using ((select private.can_operate_account(organization_id, account_id)))
with check ((select private.can_operate_account(organization_id, account_id)));
create policy page_links_public_select on public.page_links for select to anon
using (
  active and exists (
    select 1 from public.smart_pages page
    where page.id = smart_page_id and page.status = 'published' and page.published_at is not null
  )
);

create policy captured_contacts_select on public.captured_contacts for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy captured_contacts_delete on public.captured_contacts for delete to authenticated
using ((select private.can_manage_account(organization_id, account_id)));

create policy interaction_events_select on public.interaction_events for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));

create policy customer_portal_settings_customer_insert on public.customer_portal_settings for insert to authenticated
with check ((select private.can_manage_account(organization_id, account_id)));
create policy customer_portal_settings_customer_update on public.customer_portal_settings for update to authenticated
using ((select private.can_manage_account(organization_id, account_id)))
with check ((select private.can_manage_account(organization_id, account_id)));

create or replace function public.activate_plate_for_account(
  requested_user_id uuid,
  requested_account_id bigint,
  requested_public_id text,
  requested_code text,
  requested_name text default null,
  requested_location text default null
)
returns public.plates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_account public.accounts;
  target_plate public.plates;
begin
  if requested_user_id is null or length(trim(requested_code)) < 4 then
    raise exception 'Invalid activation request';
  end if;

  select * into target_account
  from public.accounts
  where id = requested_account_id;
  if not found then raise exception 'Establishment not found'; end if;

  if not exists (
    select 1 from public.organization_members membership
    where membership.organization_id = target_account.organization_id
      and membership.user_id = requested_user_id
      and membership.status = 'active'
      and membership.role in ('admin', 'success')
  ) and not exists (
    select 1 from public.account_users account_user
    where account_user.organization_id = target_account.organization_id
      and account_user.account_id = requested_account_id
      and account_user.user_id = requested_user_id
      and account_user.status = 'active'
      and account_user.role in ('owner', 'admin', 'operator')
  ) then
    raise exception 'Account access denied';
  end if;

  select * into target_plate
  from public.plates
  where public_id = upper(trim(requested_public_id))
  for update;
  if not found then raise exception 'Plate not found'; end if;
  if target_plate.organization_id <> target_account.organization_id then raise exception 'Plate organization mismatch'; end if;
  if target_plate.account_id is not null then raise exception 'Plate already activated'; end if;
  if target_plate.lifecycle_status not in ('available', 'shipped') then raise exception 'Plate unavailable'; end if;
  if target_plate.activation_code_hash <> encode(extensions.digest(trim(requested_code), 'sha256'), 'hex') then
    raise exception 'Invalid activation code';
  end if;

  update public.plates
  set account_id = requested_account_id,
      lifecycle_status = 'activated',
      activated_at = now(),
      display_name = nullif(trim(requested_name), ''),
      location_label = nullif(trim(requested_location), ''),
      updated_at = now()
  where id = target_plate.id
  returning * into target_plate;

  insert into public.plate_assignments (
    organization_id, plate_id, account_id, assigned_by, reason
  ) values (
    target_plate.organization_id, target_plate.id, requested_account_id, requested_user_id, 'customer_activation'
  );

  return target_plate;
end;
$$;

revoke all on function public.activate_plate_for_account(uuid, bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function public.activate_plate_for_account(uuid, bigint, text, text, text, text) to service_role;

grant select, insert, update, delete on public.account_users to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.employee_plate_assignments to authenticated;
grant select, insert, update, delete on public.smart_pages to authenticated;
grant select, insert, update, delete on public.page_links to authenticated;
grant select, delete on public.captured_contacts to authenticated;
grant select on public.interaction_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select (public_id, slug, status, name, short_description, presentation_text, primary_color, logo_url, cover_url, footer_text, capture_enabled, capture_config, published_at)
on public.smart_pages to anon;
grant select (public_id, smart_page_id, link_type, title, subtitle, icon, url, sort_order, active)
on public.page_links to anon;

create trigger account_users_set_updated_at before update on public.account_users
for each row execute function private.set_updated_at();
create trigger employees_set_updated_at before update on public.employees
for each row execute function private.set_updated_at();
create trigger smart_pages_set_updated_at before update on public.smart_pages
for each row execute function private.set_updated_at();
create trigger page_links_set_updated_at before update on public.page_links
for each row execute function private.set_updated_at();
