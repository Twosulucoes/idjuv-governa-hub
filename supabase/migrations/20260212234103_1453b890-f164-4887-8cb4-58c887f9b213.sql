
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
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = check_user_id
  LIMIT 1;

  is_admin := (user_role = 'admin');

  IF is_admin THEN
    RETURN QUERY
    SELECT 
      'admin'::text, 'admin'::text, 'Administrador'::text,
      'admin'::text, NULL::text, 'full'::text,
      'Administrador'::text, '/admin'::text, 'shield'::text;
    RETURN;
  END IF;

  -- Permissões explícitas
  RETURN QUERY
  SELECT 
    up.id::text,
    up.permission::text,
    up.permission::text,
    split_part(up.permission::text, '.', 1)::text,
    split_part(up.permission::text, '.', 2)::text,
    split_part(up.permission::text, '.', 3)::text,
    COALESCE(user_role, 'user')::text,
    NULL::text,
    NULL::text
  FROM public.user_permissions up
  WHERE up.user_id = check_user_id;

  -- Permissões derivadas dos módulos
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
      ('financeiro', 'financeiro.folha.visualizar', 'folha'),
      ('financeiro', 'financeiro.pagamentos.visualizar', 'pagamentos'),
      ('financeiro', 'orcamento.visualizar', 'orcamento'),
      ('patrimonio', 'patrimonio.bens.visualizar', 'bens'),
      ('patrimonio', 'patrimonio.movimentacoes.visualizar', 'movimentacoes'),
      ('patrimonio', 'patrimonio.inventario.visualizar', 'inventario'),
      ('compras', 'compras.solicitacoes.visualizar', 'solicitacoes'),
      ('compras', 'compras.licitacoes.visualizar', 'licitacoes'),
      ('contratos', 'contratos.visualizar', 'contratos'),
      ('comunicacao', 'ascom.demandas.visualizar', 'demandas'),
      ('governanca', 'governanca.riscos.visualizar', 'riscos'),
      ('gabinete', 'gabinete.portarias.visualizar', 'portarias'),
      ('gabinete', 'gabinete.processos.visualizar', 'processos'),
      ('workflow', 'workflow.fluxos.visualizar', 'fluxos')
  ) AS perm(mod, codigo, sub)
  WHERE um.user_id = check_user_id
    AND p.is_active = true
    AND um.module = perm.mod;
END;
$$;
