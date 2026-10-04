-- Opcional: quita el aviso del linter de Supabase sobre la función del trigger.
-- (Una función de trigger no se puede llamar por RPC, pero así queda explícito.)
revoke execute on function public.crear_perfil_coach() from public, anon, authenticated;
revoke execute on function public.guardar_programa(jsonb) from anon;
