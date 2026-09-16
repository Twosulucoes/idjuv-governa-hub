-- ============================================================================
-- PERMISSÕES GRANULARES — role_permissions + user_permissions
-- ============================================================================
-- Contexto (por que esta migração existe):
--
-- A migração 20260213190115 montou a camada granular do RBAC: o catálogo
-- `module_permissions_catalog`, a coluna `user_modules.permissions[]` e o RPC
-- `listar_permissoes_usuario` unindo permissões diretas + permissões de módulo.
--
-- Sete dias depois, a 20260220193848 ("limpeza de tabelas legadas") dropou
-- `role_permissions` e `user_permissions`. Com isso:
--   1. `listar_permissoes_usuario` passou a referenciar uma tabela inexistente;
--   2. o RBAC colapsou no nível de módulo — quem tem o módulo `rh` passa a ter
--      `rh.*` inteiro, inclusive `rh.servidores.excluir`;
--   3. o `ROUTE_PERMISSIONS` do front (438 linhas) ficou mapeando permissões
--      finas que não têm onde ser concedidas.
--
-- Esta migração restaura o mecanismo de três fontes (o mesmo desenho do
-- idjuv-governo-flex, adaptado aos códigos `modulo.recurso.acao` deste repo):
--
--   role_permissions        → padrão por papel (admin / manager / user)
--   user_permissions        → concessão avulsa a um usuário específico
--   user_modules.permissions→ concessão dentro de um módulo (UI já existente)
--
-- A união das três é o conjunto efetivo de permissões do usuário.
--
-- ⚠️ NOTA DE SEGURANÇA (fora do escopo desta migração, mas relevante):
-- `public.has_role(app_role)` continua com o corpo permissivo definido em
-- 20260220132320 ("ACESSO TOTAL"), que retorna true para QUALQUER usuário
-- autenticado. As policies abaixo por isso usam `public.is_admin_atual()`
-- (20260824010000), que faz a checagem real em user_roles. Rever as demais
-- policies que ainda dependem de has_role() é um trabalho à parte.
-- ============================================================================


-- ============================================================================
-- SEÇÃO 1 — CATÁLOGO: completar com os códigos usados pelo front-end
-- ============================================================================
-- O catálogo original cobria 9 módulos. Os 77 códigos abaixo são os que o
-- ROUTE_PERMISSIONS (src/types/auth.ts) e os guards de rota (src/App.tsx)
-- referenciam e que não tinham entrada — ou seja, eram impossíveis de conceder.

INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
('admin','admin.auditoria','Visualizar Auditoria','Auditoria','visualizar',501),
('admin','admin.backup','Visualizar Backup','Backup','visualizar',502),
('admin','admin.dashboard','Visualizar Dashboard','Dashboard','visualizar',503),
('admin','admin.database','Visualizar Banco de Dados','Banco de Dados','visualizar',504),
('admin','admin.disaster_recovery','Visualizar Disaster Recovery','Disaster Recovery','visualizar',505),
('admin','admin.perfis','Visualizar Perfis','Perfis','visualizar',506),
('admin','admin.perfis.gerenciar','Gerenciar Perfis','Perfis','gerenciar',507),
('admin','admin.reunioes','Visualizar Reuniões','Reuniões','visualizar',508),
('admin','admin.reunioes.gerenciar','Gerenciar Reuniões','Reuniões','gerenciar',509),
('admin','admin.segad','Visualizar Calibrador SEGAD','Calibrador SEGAD','visualizar',510),
('admin','admin.usuarios','Visualizar Usuários','Usuários','visualizar',511),
('admin','admin.usuarios.criar','Criar Usuários','Usuários','criar',512),
('admin','admin.usuarios.editar','Editar Usuários','Usuários','editar',513),
('admin','admin.usuarios.excluir','Excluir Usuários','Usuários','excluir',514),
('admin','aprovacoes.aprovar','Aprovar Aprovações','Aprovações','aprovar',515),
('admin','aprovacoes.delegar','Delegar Aprovações','Aprovações','delegar',516),
('admin','aprovacoes.rejeitar','Rejeitar Aprovações','Aprovações','rejeitar',517),
('admin','aprovacoes.visualizar','Visualizar Aprovações','Aprovações','visualizar',518),
('compras','processos.almoxarifado.visualizar','Visualizar Almoxarifado (Processos)','Processos / Almoxarifado','visualizar',501),
('compras','processos.compras.visualizar','Visualizar Compras (Processos)','Processos / Compras','visualizar',502),
('compras','processos.convenios.visualizar','Visualizar Convênios (Processos)','Processos / Convênios','visualizar',503),
('compras','processos.diarias.visualizar','Visualizar Diárias (Processos)','Processos / Diárias','visualizar',504),
('compras','processos.pagamentos.visualizar','Visualizar Pagamentos (Processos)','Processos / Pagamentos','visualizar',505),
('compras','processos.patrimonio.visualizar','Visualizar Patrimônio (Processos)','Processos / Patrimônio','visualizar',506),
('compras','processos.veiculos.visualizar','Visualizar Veículos (Processos)','Processos / Veículos','visualizar',507),
('comunicacao','ascom.cms.criar','Criar CMS / Portal (ASCOM)','ASCOM / CMS / Portal','criar',501),
('comunicacao','ascom.cms.editar','Editar CMS / Portal (ASCOM)','ASCOM / CMS / Portal','editar',502),
('comunicacao','ascom.cms.visualizar','Visualizar CMS / Portal (ASCOM)','ASCOM / CMS / Portal','visualizar',503),
('comunicacao','ascom.demandas.publicar','Publicar Demandas (ASCOM)','ASCOM / Demandas','publicar',504),
('comunicacao','ascom.demandas.tratar','Tratar Demandas (ASCOM)','ASCOM / Demandas','tratar',505),
('comunicacao','comunicacao.visualizar','Visualizar Comunicação','Geral','visualizar',506),
('federacoes','federacoes.criar','Criar Federações','Geral','criar',501),
('federacoes','federacoes.gerenciar','Gerenciar Federações','Geral','gerenciar',502),
('federacoes','federacoes.relatorios','Visualizar Relatórios','Relatórios','visualizar',503),
('federacoes','federacoes.visualizar','Visualizar Federações','Geral','visualizar',504),
('financeiro','financeiro.diarias.gerenciar','Gerenciar Diárias','Diárias','gerenciar',501),
('financeiro','financeiro.diarias.visualizar','Visualizar Diárias','Diárias','visualizar',502),
('financeiro','financeiro.folha.configurar','Configurar Folha de Pagamento','Folha de Pagamento','configurar',503),
('financeiro','financeiro.pagamentos.autorizar','Autorizar Pagamentos','Pagamentos','autorizar',504),
('financeiro','orcamento.aprovar','Aprovar Orçamento','Orçamento','aprovar',505),
('financeiro','orcamento.criar','Criar Orçamento','Orçamento','criar',506),
('gestores_escolares','gestores_escolares.admin','Administrar Gestores Escolares','Geral','admin',501),
('governanca','governanca.cargos.gerenciar','Gerenciar Cargos','Cargos','gerenciar',501),
('governanca','governanca.cargos.visualizar','Visualizar Cargos','Cargos','visualizar',502),
('governanca','governanca.documentos.visualizar','Visualizar Documentos','Documentos','visualizar',503),
('governanca','governanca.estrutura.editar','Editar Estrutura','Estrutura','editar',504),
('governanca','governanca.estrutura.visualizar','Visualizar Estrutura','Estrutura','visualizar',505),
('governanca','governanca.matriz.visualizar','Visualizar Matriz RACI','Matriz RACI','visualizar',506),
('governanca','governanca.organograma.editar','Editar Organograma','Organograma','editar',507),
('governanca','governanca.organograma.visualizar','Visualizar Organograma','Organograma','visualizar',508),
('governanca','governanca.portarias.editar','Editar Portarias','Portarias','editar',509),
('governanca','governanca.portarias.visualizar','Visualizar Portarias','Portarias','visualizar',510),
('governanca','governanca.visualizar','Visualizar Governança','Geral','visualizar',511),
('integridade','integridade.gerenciar','Gerenciar Integridade','Geral','gerenciar',501),
('integridade','integridade.visualizar','Visualizar Integridade','Geral','visualizar',502),
('patrimonio','patrimonio.criar','Criar Patrimônio','Geral','criar',501),
('patrimonio','patrimonio.tramitar','Tramitar Patrimônio','Geral','tramitar',502),
('patrimonio','patrimonio.visualizar','Visualizar Patrimônio','Geral','visualizar',503),
('patrimonio','unidades.cedencias.gerenciar','Gerenciar Cedências (Unidades Locais)','Unidades Locais / Cedências','gerenciar',504),
('patrimonio','unidades.cedencias.visualizar','Visualizar Cedências (Unidades Locais)','Unidades Locais / Cedências','visualizar',505),
('patrimonio','unidades.gerenciar','Gerenciar Unidades Locais','Unidades Locais','gerenciar',506),
('patrimonio','unidades.patrimonio.gerenciar','Gerenciar Patrimônio (Unidades Locais)','Unidades Locais / Patrimônio','gerenciar',507),
('patrimonio','unidades.patrimonio.visualizar','Visualizar Patrimônio (Unidades Locais)','Unidades Locais / Patrimônio','visualizar',508),
('patrimonio','unidades.relatorios.visualizar','Visualizar Relatórios (Unidades Locais)','Unidades Locais / Relatórios','visualizar',509),
('patrimonio','unidades.visualizar','Visualizar Unidades Locais','Unidades Locais','visualizar',510),
('programas','programas.visualizar','Visualizar Programas','Geral','visualizar',501),
('rh','rh.ferias.gerenciar','Gerenciar Férias','Férias','gerenciar',501),
('rh','rh.frequencia.configurar','Configurar Frequência','Frequência','configurar',502),
('rh','rh.frequencia.lancar','Lançar Frequência','Frequência','lancar',503),
('rh','rh.licencas.gerenciar','Gerenciar Licenças','Licenças','gerenciar',504),
('rh','rh.lotacoes.gerenciar','Gerenciar Lotações','Lotações','gerenciar',505),
('rh','rh.precadastros.converter','Converter Pré-cadastros','Pré-cadastros','converter',506),
('rh','rh.precadastros.visualizar','Visualizar Pré-cadastros','Pré-cadastros','visualizar',507),
('rh','rh.viagens.gerenciar','Gerenciar Viagens','Viagens','gerenciar',508),
('transparencia','transparencia.visualizar','Visualizar Transparência','Geral','visualizar',501),
('workflow','formularios.visualizar','Visualizar Formulários','Formulários','visualizar',501),
('workflow','workflow.visualizar','Visualizar Workflow','Geral','visualizar',502)
ON CONFLICT (permission_code) DO NOTHING;

-- ── Capacidades de módulo (modulo.acao) ─────────────────────────────────────
-- Estes códigos gateiam sobretudo o menu lateral (src/config/menu.config.ts e
-- module-menus.config.ts). Antes funcionavam por herança de prefixo a partir do
-- módulo; sem entrada no catálogo, ficariam impossíveis de conceder e o menu
-- sumiria para quem não é super admin.
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
('admin','admin.config','Configurar Sistema','Configurações','configurar',601),
('admin','admin.configuracoes','Acessar Configurações','Configurações','visualizar',602),
('compras','compras.visualizar','Visualizar Compras','Geral','visualizar',601),
('compras','compras.criar','Criar Compras','Geral','criar',602),
('contratos','contratos.tramitar','Tramitar Contratos','Geral','tramitar',601),
('governanca','governanca.aprovar','Aprovar em Governança','Geral','aprovar',601),
('governanca','governanca.avaliar','Avaliar em Governança','Geral','avaliar',602),
('rh','rh.visualizar','Visualizar RH','Geral','visualizar',601),
('rh','rh.aprovar','Aprovar em RH','Geral','aprovar',602),
('rh','rh.tramitar','Tramitar em RH','Geral','tramitar',603),
('rh','rh.self','Autoatendimento (meus dados)','Autoatendimento','visualizar',604),
('transparencia','transparencia.responder','Responder Pedidos LAI','LAI','editar',601),
('workflow','workflow.criar','Criar no Workflow','Geral','criar',601),
('workflow','workflow.tramitar','Tramitar no Workflow','Geral','tramitar',602)
ON CONFLICT (permission_code) DO NOTHING;



-- ============================================================================
-- SEÇÃO 2 — TABELA role_permissions (padrão por papel)
-- ============================================================================
-- `permission` é TEXT com FK para o catálogo (e não o enum app_permission, que
-- carrega códigos genéricos do template — users.read, content.create — sem
-- relação com os códigos modulo.recurso.acao usados neste sistema).

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role       public.app_role NOT NULL,
  permission text NOT NULL
             REFERENCES public.module_permissions_catalog(permission_code)
             ON UPDATE CASCADE ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (role, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role
  ON public.role_permissions(role);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Leitura liberada aos autenticados: o AuthContext precisa resolver as
-- permissões do próprio papel no login. Não há dado sensível aqui — é o mapa
-- "papel X concede permissão Y", não quem tem qual papel.
DROP POLICY IF EXISTS sel_role_permissions_authenticated ON public.role_permissions;
CREATE POLICY sel_role_permissions_authenticated ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS ins_role_permissions_admin ON public.role_permissions;
CREATE POLICY ins_role_permissions_admin ON public.role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS upd_role_permissions_admin ON public.role_permissions;
CREATE POLICY upd_role_permissions_admin ON public.role_permissions
  FOR UPDATE TO authenticated
  USING (public.is_admin_atual())
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS del_role_permissions_admin ON public.role_permissions;
CREATE POLICY del_role_permissions_admin ON public.role_permissions
  FOR DELETE TO authenticated
  USING (public.is_admin_atual());


-- ============================================================================
-- SEÇÃO 3 — TABELA user_permissions (concessão avulsa)
-- ============================================================================
-- Serve para dar a um usuário uma permissão que o papel dele não concede e que
-- não cabe no módulo (ex.: liberar `financeiro.pagamentos.autorizar` para um
-- servidor específico sem promovê-lo a manager).

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL
             REFERENCES public.module_permissions_catalog(permission_code)
             ON UPDATE CASCADE ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user
  ON public.user_permissions(user_id);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sel_user_permissions_own_or_admin ON public.user_permissions;
CREATE POLICY sel_user_permissions_own_or_admin ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_atual());

DROP POLICY IF EXISTS ins_user_permissions_admin ON public.user_permissions;
CREATE POLICY ins_user_permissions_admin ON public.user_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS upd_user_permissions_admin ON public.user_permissions;
CREATE POLICY upd_user_permissions_admin ON public.user_permissions
  FOR UPDATE TO authenticated
  USING (public.is_admin_atual())
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS del_user_permissions_admin ON public.user_permissions;
CREATE POLICY del_user_permissions_admin ON public.user_permissions
  FOR DELETE TO authenticated
  USING (public.is_admin_atual());


-- ============================================================================
-- SEÇÃO 4 — PADRÕES POR PAPEL
-- ============================================================================
-- admin   → tudo (na prática já tem bypass de super admin, mas o registro
--           mantém o painel de permissões coerente);
-- manager → tudo, menos as ações destrutivas (`excluir`);
-- user    → somente leitura (`visualizar`).
--
-- É este recorte que resolve o problema original: ter o módulo `rh` deixa de
-- conceder `rh.servidores.excluir` — excluir passa a exigir concessão explícita.

INSERT INTO public.role_permissions (role, permission)
SELECT 'admin'::public.app_role, permission_code
FROM public.module_permissions_catalog
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT 'manager'::public.app_role, permission_code
FROM public.module_permissions_catalog
WHERE action_type <> 'excluir'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT 'user'::public.app_role, permission_code
FROM public.module_permissions_catalog
WHERE action_type = 'visualizar'
ON CONFLICT (role, permission) DO NOTHING;


-- ============================================================================
-- SEÇÃO 5 — BACKFILL: nenhum usuário pode perder acesso nesta migração
-- ============================================================================
-- Antes daqui, ter o módulo bastava para tudo dentro dele. A partir da
-- próxima seção, o front passa a exigir o código granular. Usuários cujo
-- `user_modules.permissions` está vazio (criados pela UI depois da
-- 20260213190115, que grava só o módulo) ficariam sem nada — então recebem as
-- permissões de LEITURA do módulo. Ações de escrita/exclusão passam a ser
-- concedidas conscientemente no painel de permissões.

UPDATE public.user_modules um
SET permissions = sub.perms
FROM (
  SELECT um2.id,
         array_agg(mpc.permission_code ORDER BY mpc.sort_order) AS perms
  FROM public.user_modules um2
  JOIN public.module_permissions_catalog mpc
    ON mpc.module_code = um2.module::text
   AND mpc.action_type = 'visualizar'
  WHERE um2.permissions IS NULL OR um2.permissions = '{}'
  GROUP BY um2.id
) sub
WHERE um.id = sub.id;


-- ============================================================================
-- SEÇÃO 6 — FUNÇÕES DE CONSULTA (união das três fontes)
-- ============================================================================
-- Nomes novos (`_code`) para não colidir com has_permission/get_user_permissions,
-- que operam sobre o enum app_permission legado e continuam existindo.

CREATE OR REPLACE FUNCTION public.get_user_permission_codes(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT permission), '{}'::text[])
  FROM (
    -- 1. concessão avulsa
    SELECT up.permission
    FROM public.user_permissions up
    WHERE up.user_id = _user_id
    UNION
    -- 2. padrão do papel, RESTRITO aos módulos que o usuário tem.
    --    Sem esse recorte, o papel `user` (que recebe todos os `visualizar`
    --    do catálogo) daria leitura de financeiro a quem só tem o módulo rh —
    --    o papel define o QUE se pode fazer, o módulo define ONDE.
    SELECT rp.permission
    FROM public.user_roles ur
    JOIN public.role_permissions rp
      ON rp.role = ur.role
    JOIN public.module_permissions_catalog mpc
      ON mpc.permission_code = rp.permission
    JOIN public.user_modules um
      ON um.user_id = ur.user_id
     AND um.module::text = mpc.module_code
    WHERE ur.user_id = _user_id
    UNION
    -- 3. concessão dentro do módulo
    SELECT unnest(um.permissions)
    FROM public.user_modules um
    WHERE um.user_id = _user_id
      AND um.permissions IS NOT NULL
  ) fontes(permission);
$$;

REVOKE ALL ON FUNCTION public.get_user_permission_codes(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_permission_codes(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_permission_code(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- super admin passa por cima
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
    OR _permission = ANY (public.get_user_permission_codes(_user_id));
$$;

REVOKE ALL ON FUNCTION public.has_permission_code(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.has_permission_code(uuid, text) TO authenticated;


-- ============================================================================
-- SEÇÃO 7 — RPC listar_permissoes_usuario
-- ============================================================================
-- A versão da 20260213190115 lia `public.user_permissions`, que a 20260220193848
-- dropou — ou seja, o RPC está quebrado em runtime desde então. Aqui ele volta
-- a funcionar e passa a incluir também o padrão do papel (role_permissions).

CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id uuid)
RETURNS TABLE(
  funcao_id text, funcao_codigo text, funcao_nome text,
  modulo text, submodulo text, tipo_acao text,
  perfil_nome text, rota text, icone text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = check_user_id
  ORDER BY (ur.role = 'admin') DESC
  LIMIT 1;

  -- Super admin: uma entrada sintética, o bypass é resolvido no front.
  IF user_role = 'admin' THEN
    RETURN QUERY SELECT
      'admin'::text, 'admin'::text, 'Administrador'::text,
      'admin'::text, NULL::text, 'full'::text,
      'Administrador'::text, '/admin'::text, 'shield'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mpc.id::text,
    mpc.permission_code::text,
    mpc.label::text,
    mpc.module_code::text,
    mpc.category::text,
    mpc.action_type::text,
    COALESCE(user_role, 'user')::text,
    NULL::text,
    NULL::text
  FROM public.module_permissions_catalog mpc
  WHERE mpc.permission_code = ANY (public.get_user_permission_codes(check_user_id))
  ORDER BY mpc.module_code, mpc.sort_order;
END;
$$;

REVOKE ALL ON FUNCTION public.listar_permissoes_usuario(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.listar_permissoes_usuario(uuid) TO authenticated;


-- ============================================================================
-- SEÇÃO 8 — COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================
COMMENT ON TABLE public.role_permissions IS
  'Permissões padrão por papel (app_role). Fonte 2 de 3 do RBAC granular; ver docs/RBAC_PERMISSOES.md.';
COMMENT ON TABLE public.user_permissions IS
  'Permissões concedidas avulsamente a um usuário. Fonte 1 de 3 do RBAC granular; ver docs/RBAC_PERMISSOES.md.';
COMMENT ON FUNCTION public.get_user_permission_codes(uuid) IS
  'União das três fontes de permissão: user_permissions (avulsa), role_permissions (via user_roles, restrita aos módulos do usuário) e user_modules.permissions.';
