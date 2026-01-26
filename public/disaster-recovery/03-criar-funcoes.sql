-- ============================================================
-- SCRIPT 3: CRIAR FUNÇÕES RPC
-- Execute TERCEIRO no SQL Editor do Supabase
-- ============================================================

-- DROPAR funções existentes primeiro
DROP FUNCTION IF EXISTS public.usuario_eh_admin(uuid);
DROP FUNCTION IF EXISTS public.listar_permissoes_usuario(uuid);
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, varchar);

-- Função para verificar se usuário é admin
CREATE FUNCTION public.usuario_eh_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND (p.codigo IN ('super_admin', 'admin') OR p.nome IN ('Super Administrador', 'Administrador'))
  );
END;
$$;

-- Função para listar permissões do usuário
DROP FUNCTION IF EXISTS public.listar_permissoes_usuario(uuid);
CREATE FUNCTION public.listar_permissoes_usuario(check_user_id UUID)
RETURNS TABLE(
  funcao_id UUID,
  funcao_codigo VARCHAR,
  funcao_nome VARCHAR,
  modulo VARCHAR,
  submodulo VARCHAR,
  tipo_acao VARCHAR,
  perfil_nome VARCHAR,
  rota VARCHAR,
  icone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.codigo,
    f.nome,
    f.modulo,
    f.submodulo,
    f.tipo_acao,
    p.nome as perfil_nome,
    f.rota,
    f.icone
  FROM public.usuario_perfis up
  JOIN public.perfis p ON up.perfil_id = p.id
  JOIN public.perfil_funcoes pf ON p.id = pf.perfil_id
  JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
  WHERE up.user_id = check_user_id
    AND up.ativo = true
    AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
    AND pf.concedido = true
    AND f.ativo = true
  ORDER BY f.modulo, f.submodulo, f.ordem;
END;
$$;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(_user_id UUID, _codigo_funcao VARCHAR)
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

SELECT 'Funções criadas com sucesso!' as resultado;
