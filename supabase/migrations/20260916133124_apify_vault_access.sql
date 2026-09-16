-- O token da Apify fica criptografado pelo Supabase Vault. A função RPC é
-- acessível somente pela credencial interna service_role usada na Edge Function.
create or replace function public.get_integration_secret(requested_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select secret.decrypted_secret
  from vault.decrypted_secrets as secret
  where secret.name = requested_name
  limit 1;
$$;

revoke all on function public.get_integration_secret(text) from public, anon, authenticated;
grant execute on function public.get_integration_secret(text) to service_role;
