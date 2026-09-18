-- Jornada comercial: um diagnóstico pode ser compartilhado por link opaco,
-- gerar eventos próprios e receber uma conexão oficial do Perfil da Empresa.
-- Tokens nunca são armazenados em texto puro.

create table public.diagnostic_access_links (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  diagnostic_id bigint not null references public.diagnostics(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  expires_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer not null default 0 check (open_count >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or status = 'revoked')
);

create table public.diagnostic_journey_events (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  diagnostic_id bigint references public.diagnostics(id) on delete set null,
  diagnostic_access_link_id bigint references public.diagnostic_access_links(id) on delete set null,
  event_type text not null check (event_type in (
    'diagnostic_generated', 'diagnostic_sent', 'diagnostic_opened',
    'google_connect_started', 'google_connected', 'full_diagnostic_generated',
    'full_diagnostic_opened', 'proposal_clicked'
  )),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.google_connections (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  account_id bigint not null references public.accounts(id) on delete cascade,
  connected_by uuid references auth.users(id) on delete set null,
  status text not null default 'not_configured' check (status in ('not_configured', 'pending', 'connected', 'revoked', 'error')),
  google_account_resource text,
  google_location_resource text,
  scopes text[] not null default '{}'::text[],
  token_reference text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, account_id)
);

create index diagnostic_access_links_diagnostic_idx on public.diagnostic_access_links (diagnostic_id, status);
create index diagnostic_access_links_account_idx on public.diagnostic_access_links (account_id, created_at desc);
create index diagnostic_journey_events_account_idx on public.diagnostic_journey_events (account_id, occurred_at desc);
create index diagnostic_journey_events_diagnostic_idx on public.diagnostic_journey_events (diagnostic_id, occurred_at desc);
create index google_connections_account_idx on public.google_connections (account_id, status);

alter table public.diagnostic_access_links enable row level security;
alter table public.diagnostic_journey_events enable row level security;
alter table public.google_connections enable row level security;

create policy diagnostic_access_links_select on public.diagnostic_access_links for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy diagnostic_access_links_write on public.diagnostic_access_links for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])));

create policy diagnostic_journey_events_select on public.diagnostic_journey_events for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy diagnostic_journey_events_write on public.diagnostic_journey_events for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','partner']::text[])));

create policy google_connections_select on public.google_connections for select to authenticated
using ((select private.can_access_account(organization_id, account_id)));
create policy google_connections_write on public.google_connections for all to authenticated
using ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])))
with check ((select private.has_internal_role(organization_id, array['admin','commercial','success','partner']::text[])));

grant select, insert, update, delete on public.diagnostic_access_links, public.diagnostic_journey_events, public.google_connections to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create trigger google_connections_set_updated_at before update on public.google_connections
for each row execute function private.set_updated_at();
