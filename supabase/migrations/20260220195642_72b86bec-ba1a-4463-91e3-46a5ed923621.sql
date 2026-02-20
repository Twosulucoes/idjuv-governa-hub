
-- Corrigir: v_diagnostico_acessos deve ser acessível apenas por admins
-- Remover a view com security_invoker e recriar com acesso controlado por RLS

DROP VIEW IF EXISTS public.v_diagnostico_acessos;
DROP VIEW IF EXISTS public.v_modulos_tabelas;

-- View de diagnóstico — acessível somente para admins via função SECURITY DEFINER
-- Usamos função em vez de view para evitar o problema de SECURITY DEFINER view
CREATE OR REPLACE FUNCTION public.get_diagnostico_acessos()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  is_active boolean,
  roles text,
  modulos text,
  tipo_acesso text,
  situacao_descritiva text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    p.is_active,
    COALESCE(STRING_AGG(DISTINCT ur.role::text, ', '), 'nenhum') as roles,
    COALESCE(STRING_AGG(DISTINCT um.module::text, ', ' ORDER BY um.module::text), 'nenhum') as modulos,
    CASE
      WHEN bool_or(ur.role = 'admin') THEN 'SUPER_ADMIN'
      WHEN COUNT(um.module) > 0 THEN 'MODULAR'
      ELSE 'SEM_ACESSO'
    END as tipo_acesso,
    CASE
      WHEN bool_or(ur.role = 'admin') THEN '✅ Acesso total (admin)'
      WHEN COUNT(um.module) > 0 THEN '🔒 Acesso restrito por módulo'
      ELSE '❌ Bloqueado - sem módulos atribuídos'
    END as situacao_descritiva
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.user_modules um ON um.user_id = p.id
  -- Só retorna dados se o chamador for admin
  WHERE public.is_admin_user(auth.uid())
  GROUP BY p.id, p.email, p.full_name, p.is_active
  ORDER BY tipo_acesso, p.email;
$$;

-- Revogar acesso público, conceder apenas a autenticados
REVOKE ALL ON FUNCTION public.get_diagnostico_acessos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_diagnostico_acessos() TO authenticated;
