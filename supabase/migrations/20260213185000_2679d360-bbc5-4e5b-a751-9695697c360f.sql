
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

  -- Permissões explícitas (user_permissions)
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
  -- Managers recebem TODAS as ações (visualizar, criar, editar, excluir, gerenciar)
  -- Users recebem apenas visualizar
  IF user_role = 'manager' THEN
    RETURN QUERY
    SELECT 
      ('mod-' || um.id || '-' || perm.acao)::text,
      perm.codigo::text,
      perm.codigo::text,
      um.module::text,
      perm.sub::text,
      perm.acao::text,
      'manager'::text,
      ('/' || um.module::text)::text,
      NULL::text
    FROM public.user_modules um
    JOIN public.profiles p ON p.id = um.user_id
    CROSS JOIN LATERAL (
      VALUES
        -- RH
        ('rh', 'rh.servidores.visualizar', 'servidores', 'visualizar'),
        ('rh', 'rh.servidores.criar', 'servidores', 'criar'),
        ('rh', 'rh.servidores.editar', 'servidores', 'editar'),
        ('rh', 'rh.servidores.excluir', 'servidores', 'excluir'),
        ('rh', 'rh.lotacoes.visualizar', 'lotacoes', 'visualizar'),
        ('rh', 'rh.lotacoes.criar', 'lotacoes', 'criar'),
        ('rh', 'rh.lotacoes.editar', 'lotacoes', 'editar'),
        ('rh', 'rh.viagens.visualizar', 'viagens', 'visualizar'),
        ('rh', 'rh.viagens.criar', 'viagens', 'criar'),
        ('rh', 'rh.viagens.editar', 'viagens', 'editar'),
        ('rh', 'rh.ferias.visualizar', 'ferias', 'visualizar'),
        ('rh', 'rh.ferias.criar', 'ferias', 'criar'),
        ('rh', 'rh.ferias.editar', 'ferias', 'editar'),
        ('rh', 'rh.licencas.visualizar', 'licencas', 'visualizar'),
        ('rh', 'rh.licencas.criar', 'licencas', 'criar'),
        ('rh', 'rh.licencas.editar', 'licencas', 'editar'),
        ('rh', 'rh.frequencia.visualizar', 'frequencia', 'visualizar'),
        ('rh', 'rh.frequencia.criar', 'frequencia', 'criar'),
        ('rh', 'rh.frequencia.editar', 'frequencia', 'editar'),
        ('rh', 'rh.designacoes.visualizar', 'designacoes', 'visualizar'),
        ('rh', 'rh.designacoes.criar', 'designacoes', 'criar'),
        ('rh', 'rh.designacoes.editar', 'designacoes', 'editar'),
        ('rh', 'rh.portarias.visualizar', 'portarias', 'visualizar'),
        ('rh', 'rh.portarias.criar', 'portarias', 'criar'),
        ('rh', 'rh.portarias.editar', 'portarias', 'editar'),
        ('rh', 'rh.relatorios.visualizar', 'relatorios', 'visualizar'),
        ('rh', 'rh.modelos.visualizar', 'modelos', 'visualizar'),
        ('rh', 'rh.modelos.criar', 'modelos', 'criar'),
        ('rh', 'rh.modelos.editar', 'modelos', 'editar'),
        ('rh', 'rh.gerenciar', 'gerenciar', 'gerenciar'),
        ('rh', 'rh.exportar', 'exportar', 'exportar'),
        -- Financeiro
        ('financeiro', 'financeiro.folha.visualizar', 'folha', 'visualizar'),
        ('financeiro', 'financeiro.folha.processar', 'folha', 'processar'),
        ('financeiro', 'financeiro.pagamentos.visualizar', 'pagamentos', 'visualizar'),
        ('financeiro', 'financeiro.pagamentos.criar', 'pagamentos', 'criar'),
        ('financeiro', 'financeiro.pagamentos.editar', 'pagamentos', 'editar'),
        ('financeiro', 'financeiro.relatorios', 'relatorios', 'visualizar'),
        ('financeiro', 'orcamento.visualizar', 'orcamento', 'visualizar'),
        ('financeiro', 'orcamento.gerenciar', 'orcamento', 'gerenciar'),
        -- Patrimônio
        ('patrimonio', 'patrimonio.bens.visualizar', 'bens', 'visualizar'),
        ('patrimonio', 'patrimonio.bens.criar', 'bens', 'criar'),
        ('patrimonio', 'patrimonio.bens.editar', 'bens', 'editar'),
        ('patrimonio', 'patrimonio.movimentacoes.visualizar', 'movimentacoes', 'visualizar'),
        ('patrimonio', 'patrimonio.movimentacoes.criar', 'movimentacoes', 'criar'),
        ('patrimonio', 'patrimonio.inventario.visualizar', 'inventario', 'visualizar'),
        ('patrimonio', 'patrimonio.inventario.criar', 'inventario', 'criar'),
        -- Compras
        ('compras', 'compras.solicitacoes.visualizar', 'solicitacoes', 'visualizar'),
        ('compras', 'compras.solicitacoes.criar', 'solicitacoes', 'criar'),
        ('compras', 'compras.solicitacoes.editar', 'solicitacoes', 'editar'),
        ('compras', 'compras.licitacoes.visualizar', 'licitacoes', 'visualizar'),
        ('compras', 'compras.licitacoes.criar', 'licitacoes', 'criar'),
        ('compras', 'compras.licitacoes.editar', 'licitacoes', 'editar'),
        -- Contratos
        ('contratos', 'contratos.visualizar', 'contratos', 'visualizar'),
        ('contratos', 'contratos.criar', 'contratos', 'criar'),
        ('contratos', 'contratos.editar', 'contratos', 'editar'),
        -- Comunicação
        ('comunicacao', 'ascom.demandas.visualizar', 'demandas', 'visualizar'),
        ('comunicacao', 'ascom.demandas.criar', 'demandas', 'criar'),
        ('comunicacao', 'ascom.demandas.editar', 'demandas', 'editar'),
        ('comunicacao', 'ascom.demandas.excluir', 'demandas', 'excluir'),
        ('comunicacao', 'ascom.gerenciar', 'gerenciar', 'gerenciar'),
        -- Governança
        ('governanca', 'governanca.riscos.visualizar', 'riscos', 'visualizar'),
        ('governanca', 'governanca.riscos.criar', 'riscos', 'criar'),
        ('governanca', 'governanca.riscos.editar', 'riscos', 'editar'),
        ('governanca', 'governanca.documentos.criar', 'documentos', 'criar'),
        ('governanca', 'governanca.documentos.editar', 'documentos', 'editar'),
        ('governanca', 'governanca.portarias.criar', 'portarias', 'criar'),
        ('governanca', 'governanca.relatorios.visualizar', 'relatorios', 'visualizar'),
        ('governanca', 'governanca.gerenciar', 'gerenciar', 'gerenciar'),
        -- Gabinete
        ('gabinete', 'gabinete.portarias.visualizar', 'portarias', 'visualizar'),
        ('gabinete', 'gabinete.portarias.criar', 'portarias', 'criar'),
        ('gabinete', 'gabinete.portarias.editar', 'portarias', 'editar'),
        ('gabinete', 'gabinete.processos.visualizar', 'processos', 'visualizar'),
        ('gabinete', 'gabinete.processos.criar', 'processos', 'criar'),
        ('gabinete', 'gabinete.processos.editar', 'processos', 'editar'),
        -- Workflow
        ('workflow', 'workflow.fluxos.visualizar', 'fluxos', 'visualizar'),
        ('workflow', 'workflow.fluxos.criar', 'fluxos', 'criar'),
        ('workflow', 'workflow.fluxos.editar', 'fluxos', 'editar')
    ) AS perm(mod, codigo, sub, acao)
    WHERE um.user_id = check_user_id
      AND p.is_active = true
      AND um.module::text = perm.mod;
  ELSE
    -- Users: apenas visualizar
    RETURN QUERY
    SELECT 
      ('mod-' || um.id)::text,
      perm.codigo::text,
      perm.codigo::text,
      um.module::text,
      perm.sub::text,
      'visualizar'::text,
      COALESCE(user_role, 'user')::text,
      ('/' || um.module::text)::text,
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
      AND um.module::text = perm.mod;
  END IF;
END;
$$;
