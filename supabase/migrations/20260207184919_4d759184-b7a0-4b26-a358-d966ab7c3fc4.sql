-- ============================================
-- ATUALIZAR RPCs PARA NOVA ESTRUTURA RBAC
-- ============================================
-- Usar user_roles e user_modules em vez de usuario_perfis
-- Usando CREATE OR REPLACE para não quebrar dependências

-- ============================================
-- FUNÇÃO: Verificar se usuário é super_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.usuario_eh_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica na tabela user_roles se o usuário tem role 'admin'
  -- E verifica se está ativo no profiles
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = check_user_id
      AND ur.role = 'admin'
      AND p.is_active = true
  );
END;
$$;

-- ============================================
-- FUNÇÃO: Verificar se usuário tem permissão específica
-- ============================================
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(
  _user_id uuid, 
  _codigo_funcao text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  modulo_requerido text;
BEGIN
  -- Verificar se usuário está ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;

  -- Buscar role do usuário
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1;

  -- Admin tem todas as permissões
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Extrair módulo do código da função (ex: 'admin.usuarios' -> 'admin')
  modulo_requerido := split_part(_codigo_funcao, '.', 1);

  -- Verificar se usuário tem o módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_modules um
    WHERE um.user_id = _user_id
      AND um.module::text = modulo_requerido
  );
END;
$$;

-- ============================================
-- FUNÇÃO: Listar permissões do usuário
-- ============================================
-- Primeiro dropar a função antiga (pode ter assinatura diferente)
DROP FUNCTION IF EXISTS public.listar_permissoes_usuario(uuid) CASCADE;

-- Recriar com nova lógica
CREATE FUNCTION public.listar_permissoes_usuario(check_user_id uuid)
RETURNS TABLE (
  funcao_id text,
  funcao_codigo text,
  funcao_nome text,
  modulo text,
  submodulo text,
  tipo_acao text,
  perfil_nome text,
  rota text,
  icone text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  is_admin boolean;
BEGIN
  -- Buscar role do usuário
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = check_user_id
  LIMIT 1;

  -- Verificar se é admin
  is_admin := (user_role = 'admin');

  -- Se for admin, retorna permissão 'admin' para tudo
  IF is_admin THEN
    RETURN QUERY
    SELECT 
      'admin'::text as funcao_id,
      'admin'::text as funcao_codigo,
      'Administrador'::text as funcao_nome,
      'admin'::text as modulo,
      NULL::text as submodulo,
      'full'::text as tipo_acao,
      'Administrador'::text as perfil_nome,
      '/admin'::text as rota,
      'shield'::text as icone;
    RETURN;
  END IF;

  -- Para outros usuários, retorna módulos como permissões
  RETURN QUERY
  SELECT 
    um.id::text as funcao_id,
    um.module::text as funcao_codigo,
    um.module::text as funcao_nome,
    um.module::text as modulo,
    NULL::text as submodulo,
    'visualizar'::text as tipo_acao,
    COALESCE(user_role, 'user')::text as perfil_nome,
    ('/' || um.module)::text as rota,
    NULL::text as icone
  FROM public.user_modules um
  JOIN public.profiles p ON p.id = um.user_id
  WHERE um.user_id = check_user_id
    AND p.is_active = true
  ORDER BY um.module;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.usuario_eh_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_permissoes_usuario(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_tem_permissao(uuid, text) TO authenticated;