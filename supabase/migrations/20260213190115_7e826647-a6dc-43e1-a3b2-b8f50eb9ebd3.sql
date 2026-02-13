
-- 1. Coluna permissions no user_modules
ALTER TABLE public.user_modules ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';

-- 2. Tabela catálogo
CREATE TABLE public.module_permissions_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL,
  permission_code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  category text,
  action_type text NOT NULL DEFAULT 'visualizar',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.module_permissions_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_admin_all" ON public.module_permissions_catalog
FOR ALL TO authenticated
USING (public.has_role('admin'::public.app_role))
WITH CHECK (public.has_role('admin'::public.app_role));

CREATE POLICY "catalog_select_all" ON public.module_permissions_catalog
FOR SELECT TO authenticated USING (true);

-- 3. Popular
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order) VALUES
('rh','rh.servidores.visualizar','Visualizar Servidores','Servidores','visualizar',1),
('rh','rh.servidores.criar','Criar Servidores','Servidores','criar',2),
('rh','rh.servidores.editar','Editar Servidores','Servidores','editar',3),
('rh','rh.servidores.excluir','Excluir Servidores','Servidores','excluir',4),
('rh','rh.lotacoes.visualizar','Visualizar Lotações','Lotações','visualizar',10),
('rh','rh.lotacoes.criar','Criar Lotações','Lotações','criar',11),
('rh','rh.lotacoes.editar','Editar Lotações','Lotações','editar',12),
('rh','rh.viagens.visualizar','Visualizar Viagens','Viagens','visualizar',20),
('rh','rh.viagens.criar','Criar Viagens','Viagens','criar',21),
('rh','rh.viagens.editar','Editar Viagens','Viagens','editar',22),
('rh','rh.ferias.visualizar','Visualizar Férias','Férias','visualizar',30),
('rh','rh.ferias.criar','Criar Férias','Férias','criar',31),
('rh','rh.ferias.editar','Editar Férias','Férias','editar',32),
('rh','rh.licencas.visualizar','Visualizar Licenças','Licenças','visualizar',40),
('rh','rh.licencas.criar','Criar Licenças','Licenças','criar',41),
('rh','rh.licencas.editar','Editar Licenças','Licenças','editar',42),
('rh','rh.frequencia.visualizar','Visualizar Frequência','Frequência','visualizar',50),
('rh','rh.frequencia.criar','Registrar Frequência','Frequência','criar',51),
('rh','rh.frequencia.editar','Editar Frequência','Frequência','editar',52),
('rh','rh.designacoes.visualizar','Visualizar Designações','Designações','visualizar',60),
('rh','rh.designacoes.criar','Criar Designações','Designações','criar',61),
('rh','rh.designacoes.editar','Editar Designações','Designações','editar',62),
('rh','rh.portarias.visualizar','Visualizar Portarias','Portarias','visualizar',70),
('rh','rh.portarias.criar','Criar Portarias','Portarias','criar',71),
('rh','rh.portarias.editar','Editar Portarias','Portarias','editar',72),
('rh','rh.relatorios.visualizar','Visualizar Relatórios','Relatórios','visualizar',80),
('rh','rh.modelos.visualizar','Visualizar Modelos','Modelos','visualizar',90),
('rh','rh.modelos.criar','Criar Modelos','Modelos','criar',91),
('rh','rh.modelos.editar','Editar Modelos','Modelos','editar',92),
('rh','rh.gerenciar','Gerenciar Módulo RH','Gerenciamento','gerenciar',100),
('rh','rh.exportar','Exportar Dados','Gerenciamento','exportar',101),
('financeiro','financeiro.folha.visualizar','Visualizar Folha','Folha','visualizar',1),
('financeiro','financeiro.folha.processar','Processar Folha','Folha','processar',2),
('financeiro','financeiro.pagamentos.visualizar','Visualizar Pagamentos','Pagamentos','visualizar',10),
('financeiro','financeiro.pagamentos.criar','Criar Pagamentos','Pagamentos','criar',11),
('financeiro','financeiro.pagamentos.editar','Editar Pagamentos','Pagamentos','editar',12),
('financeiro','financeiro.relatorios','Relatórios Financeiros','Relatórios','visualizar',20),
('financeiro','orcamento.visualizar','Visualizar Orçamento','Orçamento','visualizar',30),
('financeiro','orcamento.gerenciar','Gerenciar Orçamento','Orçamento','gerenciar',31),
('patrimonio','patrimonio.bens.visualizar','Visualizar Bens','Bens','visualizar',1),
('patrimonio','patrimonio.bens.criar','Cadastrar Bens','Bens','criar',2),
('patrimonio','patrimonio.bens.editar','Editar Bens','Bens','editar',3),
('patrimonio','patrimonio.movimentacoes.visualizar','Visualizar Movimentações','Movimentações','visualizar',10),
('patrimonio','patrimonio.movimentacoes.criar','Criar Movimentações','Movimentações','criar',11),
('patrimonio','patrimonio.inventario.visualizar','Visualizar Inventário','Inventário','visualizar',20),
('patrimonio','patrimonio.inventario.criar','Criar Inventário','Inventário','criar',21),
('compras','compras.solicitacoes.visualizar','Visualizar Solicitações','Solicitações','visualizar',1),
('compras','compras.solicitacoes.criar','Criar Solicitações','Solicitações','criar',2),
('compras','compras.solicitacoes.editar','Editar Solicitações','Solicitações','editar',3),
('compras','compras.licitacoes.visualizar','Visualizar Licitações','Licitações','visualizar',10),
('compras','compras.licitacoes.criar','Criar Licitações','Licitações','criar',11),
('compras','compras.licitacoes.editar','Editar Licitações','Licitações','editar',12),
('contratos','contratos.visualizar','Visualizar Contratos','Contratos','visualizar',1),
('contratos','contratos.criar','Criar Contratos','Contratos','criar',2),
('contratos','contratos.editar','Editar Contratos','Contratos','editar',3),
('comunicacao','ascom.demandas.visualizar','Visualizar Demandas','Demandas','visualizar',1),
('comunicacao','ascom.demandas.criar','Criar Demandas','Demandas','criar',2),
('comunicacao','ascom.demandas.editar','Editar Demandas','Demandas','editar',3),
('comunicacao','ascom.demandas.excluir','Excluir Demandas','Demandas','excluir',4),
('comunicacao','ascom.gerenciar','Gerenciar ASCOM','Gerenciamento','gerenciar',10),
('governanca','governanca.riscos.visualizar','Visualizar Riscos','Riscos','visualizar',1),
('governanca','governanca.riscos.criar','Criar Riscos','Riscos','criar',2),
('governanca','governanca.riscos.editar','Editar Riscos','Riscos','editar',3),
('governanca','governanca.documentos.criar','Criar Documentos','Documentos','criar',10),
('governanca','governanca.documentos.editar','Editar Documentos','Documentos','editar',11),
('governanca','governanca.portarias.criar','Criar Portarias','Portarias','criar',20),
('governanca','governanca.relatorios.visualizar','Relatórios','Relatórios','visualizar',30),
('governanca','governanca.gerenciar','Gerenciar Governança','Gerenciamento','gerenciar',40),
('gabinete','gabinete.portarias.visualizar','Visualizar Portarias','Portarias','visualizar',1),
('gabinete','gabinete.portarias.criar','Criar Portarias','Portarias','criar',2),
('gabinete','gabinete.portarias.editar','Editar Portarias','Portarias','editar',3),
('gabinete','gabinete.processos.visualizar','Visualizar Processos','Processos','visualizar',10),
('gabinete','gabinete.processos.criar','Criar Processos','Processos','criar',11),
('gabinete','gabinete.processos.editar','Editar Processos','Processos','editar',12),
('workflow','workflow.fluxos.visualizar','Visualizar Fluxos','Fluxos','visualizar',1),
('workflow','workflow.fluxos.criar','Criar Fluxos','Fluxos','criar',2),
('workflow','workflow.fluxos.editar','Editar Fluxos','Fluxos','editar',3);

-- 4. Migrar dados - cast explícito de app_module para text
UPDATE public.user_modules um
SET permissions = sub.perms
FROM (
  SELECT um2.id, array_agg(mpc.permission_code ORDER BY mpc.sort_order) as perms
  FROM public.user_modules um2
  JOIN public.user_roles ur ON ur.user_id = um2.user_id AND ur.role = 'manager'
  JOIN public.module_permissions_catalog mpc ON mpc.module_code = um2.module::text
  GROUP BY um2.id
) sub
WHERE um.id = sub.id;

UPDATE public.user_modules um
SET permissions = sub.perms
FROM (
  SELECT um2.id, array_agg(mpc.permission_code ORDER BY mpc.sort_order) as perms
  FROM public.user_modules um2
  JOIN public.module_permissions_catalog mpc ON mpc.module_code = um2.module::text AND mpc.action_type = 'visualizar'
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = um2.user_id AND ur.role = 'manager')
    AND (um2.permissions IS NULL OR um2.permissions = '{}')
  GROUP BY um2.id
) sub
WHERE um.id = sub.id;

-- 5. Atualizar RPC com cast
CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id uuid)
RETURNS TABLE(
  funcao_id text, funcao_codigo text, funcao_nome text,
  modulo text, submodulo text, tipo_acao text,
  perfil_nome text, rota text, icone text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur WHERE ur.user_id = check_user_id LIMIT 1;

  IF user_role = 'admin' THEN
    RETURN QUERY SELECT 'admin'::text,'admin'::text,'Administrador'::text,
      'admin'::text,NULL::text,'full'::text,'Administrador'::text,'/admin'::text,'shield'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT up.id::text,up.permission::text,up.permission::text,
    split_part(up.permission::text,'.',1)::text,
    split_part(up.permission::text,'.',2)::text,
    split_part(up.permission::text,'.',3)::text,
    COALESCE(user_role,'user')::text,NULL::text,NULL::text
  FROM public.user_permissions up WHERE up.user_id = check_user_id;

  RETURN QUERY
  SELECT ('mod-'||um.id||'-'||mpc.permission_code)::text,
    mpc.permission_code::text,mpc.label::text,
    um.module::text,COALESCE(mpc.category,'')::text,mpc.action_type::text,
    COALESCE(user_role,'user')::text,('/'||um.module::text)::text,NULL::text
  FROM public.user_modules um
  JOIN public.profiles p ON p.id = um.user_id
  JOIN public.module_permissions_catalog mpc ON mpc.module_code = um.module::text
  WHERE um.user_id = check_user_id AND p.is_active = true
    AND mpc.permission_code = ANY(um.permissions);
END;
$$;
