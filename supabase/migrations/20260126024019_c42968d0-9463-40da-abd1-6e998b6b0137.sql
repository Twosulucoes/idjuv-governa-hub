-- 1. Adicionar coluna 'codigo' na tabela perfis
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- 2. Criar índice único para codigo (ignorar se já existir)
CREATE UNIQUE INDEX IF NOT EXISTS perfis_codigo_unique ON public.perfis(codigo);

-- 3. Dropar função existente e recriar
DROP FUNCTION IF EXISTS public.listar_permissoes_usuario(uuid);

-- 4. Criar função listar_permissoes_usuario
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

-- 5. Criar/atualizar função usuario_eh_admin
CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id UUID)
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