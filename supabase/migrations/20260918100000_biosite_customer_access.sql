create or replace function private.can_edit_biosite(check_organization_id bigint, check_account_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = check_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role in ('admin', 'success')
    )
    or exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = check_organization_id
        and membership.account_id = check_account_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role = 'customer'
    )
    or exists (
      select 1
      from public.account_users account_user
      where account_user.organization_id = check_organization_id
        and account_user.account_id = check_account_id
        and account_user.user_id = (select auth.uid())
        and account_user.status = 'active'
        and account_user.role in ('owner', 'admin', 'operator')
    )
  );
$$;

revoke all on function private.can_edit_biosite(bigint, bigint) from public, anon;
grant execute on function private.can_edit_biosite(bigint, bigint) to authenticated;

drop policy if exists smart_pages_write on public.smart_pages;
create policy smart_pages_write on public.smart_pages for all to authenticated
using ((select private.can_edit_biosite(organization_id, account_id)))
with check ((select private.can_edit_biosite(organization_id, account_id)));

drop policy if exists page_links_write on public.page_links;
create policy page_links_write on public.page_links for all to authenticated
using ((select private.can_edit_biosite(organization_id, account_id)))
with check ((select private.can_edit_biosite(organization_id, account_id)));

drop policy if exists biosite_media_insert on storage.objects;
create policy biosite_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'biosite-media'
  and name ~ '^[0-9]+/[0-9]+/(logo|cover)/[^/]+$'
  and exists (
    select 1 from public.smart_pages page
    where page.account_id::text = (storage.foldername(name))[1]
      and page.id::text = (storage.foldername(name))[2]
      and (select private.can_edit_biosite(page.organization_id, page.account_id))
  )
);

drop policy if exists biosite_media_delete on storage.objects;
create policy biosite_media_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'biosite-media'
  and name ~ '^[0-9]+/[0-9]+/(logo|cover)/[^/]+$'
  and exists (
    select 1 from public.smart_pages page
    where page.account_id::text = (storage.foldername(name))[1]
      and page.id::text = (storage.foldername(name))[2]
      and (select private.can_edit_biosite(page.organization_id, page.account_id))
  )
);
