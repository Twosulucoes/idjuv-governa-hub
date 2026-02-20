
-- Força reload completo do cache PostgREST
-- Necessário após migrações que alteram tipos/colunas
SELECT pg_notify('pgrst', 'reload schema');
NOTIFY pgrst, 'reload schema';

-- Garante que as permissões do role anon e authenticated estão corretas nas tabelas principais
GRANT SELECT ON public.servidores TO anon, authenticated;
GRANT SELECT ON public.cargos TO anon, authenticated;
GRANT SELECT ON public.estrutura_organizacional TO anon, authenticated;
GRANT SELECT ON public.lotacoes TO anon, authenticated;
GRANT SELECT ON public.provimentos TO anon, authenticated;
GRANT SELECT ON public.cessoes TO anon, authenticated;
GRANT SELECT ON public.designacoes TO anon, authenticated;
GRANT SELECT ON public.documentos TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.servidores TO authenticated;
GRANT ALL ON public.cargos TO authenticated;
GRANT ALL ON public.estrutura_organizacional TO authenticated;
GRANT ALL ON public.lotacoes TO authenticated;
GRANT ALL ON public.provimentos TO authenticated;
GRANT ALL ON public.cessoes TO authenticated;
GRANT ALL ON public.designacoes TO authenticated;
GRANT ALL ON public.documentos TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
