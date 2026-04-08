
-- 1. Drop com CASCADE para remover políticas dependentes
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, varchar) CASCADE;

-- 2. Recriar a função com assinatura correta
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(_user_id UUID, _codigo_funcao TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tem_permissao BOOLEAN := false;
  _perfil RECORD;
BEGIN
  FOR _perfil IN 
    SELECT up.perfil_id 
    FROM usuario_perfis up
    WHERE up.user_id = _user_id 
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM perfil_funcoes pf
      JOIN funcoes_sistema fs ON fs.id = pf.funcao_id
      WHERE pf.perfil_id = _perfil.perfil_id
        AND fs.codigo = _codigo_funcao
        AND pf.concedido = true
        AND fs.ativo = true
    ) INTO _tem_permissao;
    
    IF _tem_permissao THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;

-- 3. Restaurar a política RLS que foi removida pelo CASCADE
CREATE POLICY "Admin pode ver todo histórico"
  ON public.gestores_escolares_historico
  FOR SELECT
  TO authenticated
  USING (
    usuario_tem_permissao(auth.uid(), 'educacao.gestores.visualizar'::text)
    OR usuario_eh_super_admin(auth.uid())
  );
