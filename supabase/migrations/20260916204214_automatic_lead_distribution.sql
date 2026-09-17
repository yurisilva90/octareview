create index if not exists distribution_rules_active_priority_idx
on public.distribution_rules (organization_id, priority)
where active;

create or replace function private.assign_new_lead_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner_member_id is not null or new.lifecycle_status <> 'lead' then
    return new;
  end if;

  select rule.assignee_member_id
  into new.owner_member_id
  from public.distribution_rules rule
  join public.organization_members member
    on member.id = rule.assignee_member_id
   and member.organization_id = rule.organization_id
   and member.status = 'active'
  where rule.organization_id = new.organization_id
    and rule.active
    and rule.strategy = 'fixed_member'
    and (rule.conditions ->> 'category' is null or lower(rule.conditions ->> 'category') = lower(coalesce(new.category, '')))
    and (rule.conditions ->> 'city' is null or lower(rule.conditions ->> 'city') = lower(coalesce(new.city, '')))
    and (rule.conditions ->> 'potential' is null or rule.conditions ->> 'potential' = new.potential)
  order by rule.priority, rule.id
  limit 1;

  return new;
end;
$$;

revoke all on function private.assign_new_lead_owner() from public, anon, authenticated;

drop trigger if exists accounts_assign_new_lead_owner on public.accounts;
create trigger accounts_assign_new_lead_owner
before insert on public.accounts
for each row execute function private.assign_new_lead_owner();
