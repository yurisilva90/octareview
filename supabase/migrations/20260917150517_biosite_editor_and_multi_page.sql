-- BioSite editor, media storage, multi-page accounts and plan limits.

alter table public.smart_pages
  drop constraint if exists smart_pages_account_id_key;

alter table public.smart_pages
  add column if not exists page_type text not null default 'biosite'
    check (page_type in ('biosite', 'campaign', 'menu', 'event', 'custom')),
  add column if not exists is_primary boolean not null default false,
  add column if not exists cover_type text not null default 'image'
    check (cover_type in ('image', 'video', 'animation')),
  add column if not exists background_mode text not null default 'solid'
    check (background_mode in ('solid', 'preset')),
  add column if not exists background_value text not null default '#f6f8fa'
    check (length(background_value) between 3 and 120),
  add column if not exists button_color text not null default '#0b315f'
    check (button_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists highlight_color text not null default '#0f9d8f'
    check (highlight_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists form_button_color text not null default '#0f9d8f'
    check (form_button_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists button_shape text not null default 'soft'
    check (button_shape in ('square', 'soft', 'round')),
  add column if not exists button_variant text not null default 'outline'
    check (button_variant in ('filled', 'outline')),
  add column if not exists button_border_width smallint not null default 1
    check (button_border_width between 1 and 3);

with ranked_pages as (
  select id, row_number() over (partition by account_id order by created_at, id) as position
  from public.smart_pages
)
update public.smart_pages page
set is_primary = true
from ranked_pages ranked
where page.id = ranked.id and ranked.position = 1;

create unique index if not exists smart_pages_one_primary_per_account_idx
on public.smart_pages (account_id)
where is_primary;

create index if not exists smart_pages_account_created_idx
on public.smart_pages (account_id, created_at, id);

alter table public.page_links
  add column if not exists highlighted boolean not null default false,
  add column if not exists button_color text
    check (button_color is null or button_color ~ '^#[0-9a-fA-F]{6}$');

create or replace function private.enforce_smart_page_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed_pages integer := 1;
  current_pages integer := 0;
begin
  select greatest(
    1,
    coalesce(max(
      case
        when product.features ->> 'page_limit' ~ '^[1-9][0-9]*$'
          then least((product.features ->> 'page_limit')::integer * subscription.quantity, 50)
        else 1
      end
    ), 1)
  )
  into allowed_pages
  from public.subscriptions subscription
  join public.products product on product.id = subscription.product_id
  where subscription.account_id = new.account_id
    and subscription.status in ('trial', 'active', 'past_due');

  select count(*) into current_pages
  from public.smart_pages page
  where page.account_id = new.account_id;

  if current_pages >= allowed_pages then
    raise exception 'O plano atual permite até % página(s).', allowed_pages
      using errcode = 'check_violation';
  end if;

  if current_pages = 0 then
    new.is_primary := true;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_smart_page_limit() from public, anon, authenticated;

drop trigger if exists smart_pages_enforce_plan_limit on public.smart_pages;
create trigger smart_pages_enforce_plan_limit
before insert on public.smart_pages
for each row execute function private.enforce_smart_page_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'biosite-media',
  'biosite-media',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists biosite_media_select on storage.objects;
create policy biosite_media_select on storage.objects
for select to authenticated
using (
  bucket_id = 'biosite-media'
  and name ~ '^[0-9]+/[0-9]+/(logo|cover)/[^/]+$'
  and exists (
    select 1
    from public.smart_pages page
    where page.account_id::text = (storage.foldername(name))[1]
      and page.id::text = (storage.foldername(name))[2]
      and (select private.can_access_account(page.organization_id, page.account_id))
  )
);

drop policy if exists biosite_media_insert on storage.objects;
create policy biosite_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'biosite-media'
  and name ~ '^[0-9]+/[0-9]+/(logo|cover)/[^/]+$'
  and exists (
    select 1
    from public.smart_pages page
    where page.account_id::text = (storage.foldername(name))[1]
      and page.id::text = (storage.foldername(name))[2]
      and (select private.can_operate_account(page.organization_id, page.account_id))
  )
);

drop policy if exists biosite_media_delete on storage.objects;
create policy biosite_media_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'biosite-media'
  and name ~ '^[0-9]+/[0-9]+/(logo|cover)/[^/]+$'
  and exists (
    select 1
    from public.smart_pages page
    where page.account_id::text = (storage.foldername(name))[1]
      and page.id::text = (storage.foldername(name))[2]
      and (select private.can_operate_account(page.organization_id, page.account_id))
  )
);
