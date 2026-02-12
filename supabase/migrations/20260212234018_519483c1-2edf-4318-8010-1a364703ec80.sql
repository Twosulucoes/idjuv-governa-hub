
CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id uuid)
RETURNS TABLE(
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
      'admin'::text,
      'admin'::text,
      'Administrador'::text,
      'admin'::text,
      NULL::text,
      'full'::text,
      'Administrador'::text,
      '/admin'::text,
      'shield'::text;
    RETURN;
  END IF;

  -- Para outros usuários, retornar permissões granulares baseadas nos módulos atribuídos
  -- Primeiro: permissões explícitas da tabela user_permissions
  RETURN QUERY
  SELECT 
    up.id::text,
    up.permission::text,
    up.permission::text,
    split_part(up.permission, '.', 1)::text,
    split_part(up.permission, '.', 2)::text,
    split_part(up.permission, '.', 3)::text,
    COALESCE(user_role, 'user')::text,
    NULL::text,
    NULL::text
  FROM public.user_permissions up
  WHERE up.user_id = check_user_id;

  -- Segundo: permissões de visualização derivadas dos módulos atribuídos
  -- Cada módulo concede automaticamente suas permissões de visualização
  RETURN QUERY
  SELECT 
    ('mod-' || um.id)::text,
    perm.codigo::text,
    perm.codigo::text,
    um.module::text,
    perm.sub::text,
    'visualizar'::text,
    COALESCE(user_role, 'user')::text,
    ('/' || um.module)::text,
    NULL::text
  FROM public.user_modules um
  JOIN public.profiles p ON p.id = um.user_id
  CROSS JOIN LATERAL (
    VALUES
      -- RH permissions
      ('rh', 'rh.servidores.visualizar', 'servidores'),
      ('rh', 'rh.lotacoes.visualizar', 'lotacoes'),
      ('rh', 'rh.viagens.visualizar', 'viagens'),
      ('rh', 'rh.ferias.visualizar', 'ferias'),
      ('rh', 'rh.licencas.visualizar', 'licencas'),
      ('rh', 'rh.frequencia.visualizar', 'frequencia'),
      ('rh', 'rh.designacoes.visualizar', 'designacoes'),
      ('rh', 'rh.portarias.visualizar', 'portarias'),
      ('rh', 'rh.relatorios.visualizar', 'relatorios'),
      ('rh', 'rh.modelos.visualizar', 'modelos'),
      -- Financeiro permissions
      ('financeiro', 'financeiro.folha.visualizar', 'folha'),
      ('financeiro', 'financeiro.pagamentos.visualizar', 'pagamentos'),
      ('financeiro', 'orcamento.visualizar', 'orcamento'),
      -- Patrimônio permissions
      ('patrimonio', 'patrimonio.bens.visualizar', 'bens'),
      ('patrimonio', 'patrimonio.movimentacoes.visualizar', 'movimentacoes'),
      ('patrimonio', 'patrimonio.inventario.visualizar', 'inventario'),
      -- Compras permissions
      ('compras', 'compras.solicitacoes.visualizar', 'solicitacoes'),
      ('compras', 'compras.licitacoes.visualizar', 'licitacoes'),
      -- Contratos permissions
      ('contratos', 'contratos.visualizar', 'contratos'),
      -- Comunicação permissions
      ('comunicacao', 'ascom.demandas.visualizar', 'demandas'),
      -- Governança permissions
      ('governanca', 'governanca.riscos.visualizar', 'riscos'),
      -- Gabinete permissions
      ('gabinete', 'gabinete.portarias.visualizar', 'portarias'),
      ('gabinete', 'gabinete.processos.visualizar', 'processos'),
      -- Workflow permissions
      ('workflow', 'workflow.fluxos.visualizar', 'fluxos')
  ) AS perm(mod, codigo, sub)
  WHERE um.user_id = check_user_id
    AND p.is_active = true
    AND um.module = perm.mod;
END;
$$;
