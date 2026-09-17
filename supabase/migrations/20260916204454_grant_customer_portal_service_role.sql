grant select on public.smart_pages, public.page_links to service_role;
grant select, insert on public.captured_contacts to service_role;
grant insert on public.interaction_events to service_role;

grant select, insert on public.organization_members to service_role;
grant select on public.accounts to service_role;
grant insert on public.account_users to service_role;

grant usage, select on all sequences in schema public to service_role;
