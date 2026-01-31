-- ============================================================
-- FASE 1: Criar função usuario_eh_super_admin (pré-requisito)
-- ============================================================
CREATE OR REPLACE FUNCTION public.usuario_eh_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND p.codigo = 'super_admin'
      AND p.ativo = true
  );
END;
$$;

-- ============================================================
-- FASE 2: Policy profiles_update corrigida
-- Regra: UPDATE permitido APENAS para super_admin ou 
--        usuários com permissão 'admin.usuarios.editar'
-- ============================================================

-- Remove a policy antiga se existir
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Cria a policy corrigida (sem restrição de self-update)
CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid()) OR 
  public.usuario_tem_permissao(auth.uid(), 'admin.usuarios.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid()) OR 
  public.usuario_tem_permissao(auth.uid(), 'admin.usuarios.editar')
);