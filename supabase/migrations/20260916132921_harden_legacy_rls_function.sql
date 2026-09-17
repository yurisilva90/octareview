-- A função foi criada antes do schema OctaReview e não é chamada pela aplicação.
-- Impedir sua exposição como RPC evita que qualquer cliente altere a proteção RLS.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
