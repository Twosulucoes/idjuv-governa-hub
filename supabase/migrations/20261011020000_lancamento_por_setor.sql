-- ============================================================================
-- Lançamento só por servidor do setor — fase 1 (infraestrutura; RH em modo registrar)
-- ============================================================================
-- Spec (aprovada pelo dono em 2026-10-11): docs/superpowers/specs/2026-10-11-lancamento-por-setor-design.md
-- Depende da E1 (20261011000000_rh_autoria_trilha.sql: trilha_contexto, fixar_autoria, fn_audit_trigger v2), da E2
-- (20261011000200: registrar_evento) e da E3 (20261011010000/010100).
--
-- Vale nos DOIS estados do banco: (a) construído do baseline (supabase/baseline/) e (b) produzido só pelas migrações.
-- Idempotente: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS, ON CONFLICT DO NOTHING. Os triggers são
-- ligados num laço sobre uma LISTA EXPLÍCITA de tabelas; a que não existir é pulada com NOTICE.
--
-- Regra: uma gravação (inserir, alterar, excluir) numa tabela do módulo M é aceita quando o login tem servidor
-- vinculado (profiles.servidor_id, premissa 7) e há um FUNDAMENTO vigente hoje:
--   lotacao          lotação ativa e vigente do servidor (fora lotacao_externa) ou cessão de entrada com unidade no
--                    órgão (premissa 4) numa unidade que é setor de M (setores_modulo; com inclui_subordinadas, também
--                    as unidades abaixo dela na estrutura)
--   designacao       designação aprovada, ativa, vigente e com ato (número e data) para uma unidade do setor de M
--                    (premissa 5: soma à lotação; a checagem é na função, não há CHECK nas linhas antigas)
--   comissao         membro (no período do membro) de comissão ativa, vigente e com ato do módulo M, sem objeto. A
--                    comissão com objeto (campanha, contrato, processo) vale só no objeto (premissa 6) e é checada
--                    por linha na fase 2, quando as tabelas desses módulos entrarem na regra; na fase 1 ela não é
--                    fundamento de nada
--   autoatendimento  o servidor grava o que é dele (ver fundamento_linha)
--   chefia           a chefia decide a etapa do subordinado na frequência (ver fundamento_linha)
--   sistema/anonimo  sem auth.uid(): job, Edge Function e service role (sistema); formulário público (anonimo)
--   negado_sem_servidor, negado_setor: sem fundamento
-- Não há atalho para o papel admin. Configuração de acesso (classes admin, catalogo_admin, proprio_user e
-- publico_admin do mapa: usuários, papéis, permissões, setores e a própria regra) fica fora (premissa 1): só as
-- tabelas de lançamento recebem o trigger.
--
-- Modo por módulo (regra_lancamento): desligado = nada; registrar = a trilha grava o fundamento (inclusive o negado)
-- e nada é recusado; exigir = a gravação sem fundamento é recusada com SQLSTATE RHS01. Tabela de vários módulos usa o
-- modo mais restritivo entre eles, e o setor de qualquer um deles serve. Carga: rh = registrar, os demais desligado.
--
-- Blocos:
--   1. tabelas setores_modulo, regra_lancamento (configuração, só o admin escreve), comissoes e comissoes_membros (RH,
--      rh.comissoes.gerenciar), com RLS e policies (cópia literal do supabase/baseline/rls/35_policies_geradas.sql)
--   2. permissão rh.comissoes.gerenciar (catálogo; papéis admin e manager) e carga de regra_lancamento
--   3. audit_logs.fundamento (+ índice parcial das linhas negadas)
--   4. funções: lotacao_vigente, unidade_e_superiores, lancamento_modulos_tabela, fundamento_lancamento (cache por
--      transação), fundamento_tabela (cache por tabela), fundamento_linha (autoatendimento e chefia),
--      meus_fundamentos_lancamento (RPC de consulta), saneamento_lancamento (RPC do relatório),
--      rh_exige_servidor_vinculado (lê a regra), lancamento_cache_invalidar
--   5. trilha: trilha_contexto (unidade da lotação vigente), trilha_completar_contexto, fn_audit_trigger v3 (grava o
--      fundamento), fixar_autoria (sem a checagem de vínculo, que passa ao trigger da regra), registrar_evento
--   6. exigir_setor() e o trigger zz_exigir_setor (BEFORE INSERT OR UPDATE OR DELETE) nas 79 tabelas do RH;
--      autoria e trilha nas 4 tabelas novas; invalidação do cache
--   7. privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
--
-- Códigos de erro: RHS01 = lançamento recusado pela regra de setor (modo exigir). A mensagem diz "seu login não tem
-- servidor vinculado" ou "você não está lotado nem designado no setor de <módulo>"; DETAIL traz `via=<via>`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
-- Colunas de autoria como nas tabelas do RH (E1): gravadas por zz_fixar_autoria; *_servidor_id é retrato, sem FK.

-- Setor de cada módulo: quais unidades da estrutura são o RH, o patrimônio, compras... Os dados vêm do órgão (nada
-- fixo no código); a fase 1 nasce vazia.
CREATE TABLE IF NOT EXISTS public.setores_modulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo public.app_module NOT NULL,
  unidade_id uuid NOT NULL REFERENCES public.estrutura_organizacional(id),
  inclui_subordinadas boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT setores_modulo_modulo_unidade_key UNIQUE (modulo, unidade_id)
);
CREATE INDEX IF NOT EXISTS idx_setores_modulo_unidade ON public.setores_modulo USING btree (unidade_id);
COMMENT ON TABLE public.setores_modulo IS
  'Unidades da estrutura que são o setor de cada módulo (lançamento por setor). Só o papel admin altera.';
COMMENT ON COLUMN public.setores_modulo.inclui_subordinadas IS
  'true: as unidades abaixo desta na estrutura (superior_id) também são o setor do módulo';

-- Modo da regra por módulo. id é a chave (trilha com entity_id); modulo é único (upsert com onConflict: 'modulo').
CREATE TABLE IF NOT EXISTS public.regra_lancamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo public.app_module NOT NULL,
  modo text NOT NULL DEFAULT 'desligado' CHECK (modo IN ('desligado', 'registrar', 'exigir')),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT regra_lancamento_modulo_key UNIQUE (modulo)
);
COMMENT ON TABLE public.regra_lancamento IS
  'Modo da regra de lançamento por setor de cada módulo: desligado, registrar (só anota na trilha) ou exigir (recusa, RHS01). Só o papel admin altera.';

-- Comissões: membro de comissão vigente, com ato, é fundamento no módulo dela (e só no objeto, quando houver).
CREATE TABLE IF NOT EXISTS public.comissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('inventario', 'licitacao', 'fiscalizacao_contrato', 'outra')),
  modulo public.app_module NOT NULL,
  objeto_tipo text CHECK (objeto_tipo IN ('campanha_inventario', 'contrato', 'processo_licitatorio')),
  objeto_id uuid,
  ato_tipo text NOT NULL,
  ato_numero text NOT NULL,
  ato_data date NOT NULL,
  ato_doe_numero text,
  ato_doe_data date,
  data_inicio date NOT NULL,
  data_fim date,
  motivo text NOT NULL,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada')),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT comissoes_objeto_check CHECK ((objeto_tipo IS NULL) = (objeto_id IS NULL)),
  CONSTRAINT comissoes_periodo_check CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);
CREATE INDEX IF NOT EXISTS idx_comissoes_modulo ON public.comissoes USING btree (modulo);
COMMENT ON TABLE public.comissoes IS
  'Comissões com ato, período e motivo (inventário, licitação, fiscalização de contrato...). Membro de comissão ativa e vigente é fundamento de lançamento no módulo dela; com objeto, só no objeto (fase 2).';

CREATE TABLE IF NOT EXISTS public.comissoes_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id uuid NOT NULL REFERENCES public.comissoes(id) ON DELETE CASCADE,
  servidor_id uuid NOT NULL REFERENCES public.servidores(id),
  papel text NOT NULL DEFAULT 'membro' CHECK (papel IN ('presidente', 'membro', 'secretario')),
  data_inicio date,
  data_fim date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT comissoes_membros_periodo_check CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);
CREATE INDEX IF NOT EXISTS idx_comissoes_membros_comissao ON public.comissoes_membros USING btree (comissao_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_membros_servidor ON public.comissoes_membros USING btree (servidor_id);
COMMENT ON TABLE public.comissoes_membros IS
  'Membros das comissões: papel e período (data_inicio/data_fim nulas = o período da comissão).';

ALTER TABLE public.setores_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regra_lancamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_membros ENABLE ROW LEVEL SECURITY;

-- (gerado por scripts/db/gerar-rls.mjs a partir de supabase/baseline/rls/mapa.csv; cópia literal de
-- supabase/baseline/rls/35_policies_geradas.sql)
-- comissoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.comissoes;
CREATE POLICY "rls_select" ON public.comissoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.comissoes;
CREATE POLICY "rls_insert" ON public.comissoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.comissoes;
CREATE POLICY "rls_update" ON public.comissoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.comissoes;
CREATE POLICY "rls_delete" ON public.comissoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
-- comissoes_membros  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.comissoes_membros;
CREATE POLICY "rls_select" ON public.comissoes_membros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.comissoes_membros;
CREATE POLICY "rls_insert" ON public.comissoes_membros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.comissoes_membros;
CREATE POLICY "rls_update" ON public.comissoes_membros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.comissoes_membros;
CREATE POLICY "rls_delete" ON public.comissoes_membros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
-- regra_lancamento  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.regra_lancamento;
CREATE POLICY "rls_select" ON public.regra_lancamento FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.regra_lancamento;
CREATE POLICY "rls_insert" ON public.regra_lancamento FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.regra_lancamento;
CREATE POLICY "rls_update" ON public.regra_lancamento FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.regra_lancamento;
CREATE POLICY "rls_delete" ON public.regra_lancamento FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));
-- setores_modulo  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.setores_modulo;
CREATE POLICY "rls_select" ON public.setores_modulo FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.setores_modulo;
CREATE POLICY "rls_insert" ON public.setores_modulo FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.setores_modulo;
CREATE POLICY "rls_update" ON public.setores_modulo FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.setores_modulo;
CREATE POLICY "rls_delete" ON public.setores_modulo FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- privilégios como no overlay/40 (anon sem nada; a API não usa TRUNCATE/TRIGGER/REFERENCES)
REVOKE ALL ON public.setores_modulo, public.regra_lancamento, public.comissoes, public.comissoes_membros FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.setores_modulo, public.regra_lancamento, public.comissoes,
  public.comissoes_membros FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. Permissão e carga da regra
-- ----------------------------------------------------------------------------
-- rh.comissoes.gerenciar: cadastrar comissões e membros (action_type 'gerenciar', como rh.ferias.gerenciar; nenhuma
-- carga por action_type a dá ao papel `user`). Papéis admin e manager.
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.comissoes.gerenciar', 'Gerenciar Comissões',
   'Cadastra comissões (ato, período, motivo, objeto) e seus membros; membro de comissão vigente é fundamento de lançamento no módulo da comissão',
   'Comissões', 'gerenciar', 512)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
VALUES ('admin', 'rh.comissoes.gerenciar'), ('manager', 'rh.comissoes.gerenciar')
ON CONFLICT (role, permission) DO NOTHING;

-- Um módulo por linha (todos os do enum app_module): rh em registrar (fase 1: nada é bloqueado), os demais desligados.
-- Linha que já existe não muda (a migração rodada de novo não desfaz a escolha do admin). Antes dos triggers do bloco 6:
-- a carga não vai à trilha.
INSERT INTO public.regra_lancamento (modulo, modo)
SELECT m, CASE WHEN m = 'rh' THEN 'registrar' ELSE 'desligado' END
  FROM unnest(enum_range(NULL::public.app_module)) AS m
ON CONFLICT (modulo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. audit_logs.fundamento
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS fundamento jsonb;
COMMENT ON COLUMN public.audit_logs.fundamento IS
  'Fundamento do lançamento pela regra de setor (via, permitido, modo, módulo, unidade, lotação/designação/comissão, ato); nulo com a regra desligada';
-- Relatório "quem seria bloqueado": as linhas negadas de um módulo na ordem da trilha. Parcial: só as negadas.
CREATE INDEX IF NOT EXISTS idx_audit_logs_fundamento_negado ON public.audit_logs USING btree (module_name, sequencia DESC)
  WHERE ((fundamento ->> 'permitido') = 'false');

-- ----------------------------------------------------------------------------
-- 4. Funções da regra
-- ----------------------------------------------------------------------------
-- Todas plpgsql (plano em cache: os triggers as chamam por linha), search_path fixo e sem EXECUTE para a API, exceto
-- meus_fundamentos_lancamento e saneamento_lancamento (RPCs; bloco 7).

-- Lotação vigente do servidor na data (premissa 4): lotação ATIVA cujo período cobre a data, fora `lotacao_externa`;
-- e cessão de ENTRADA ativa, com unidade no órgão (unidade_idjuv_id) e período que cobre a data. Lotação antes de cessão,
-- a mais recente primeiro. Para datas passadas vale o mesmo critério (a lotação que está ativa hoje); a lotação histórica
-- fica para a coleta offline da fase 2.
CREATE OR REPLACE FUNCTION public.lotacao_vigente(p_servidor_id uuid, p_data date DEFAULT CURRENT_DATE)
RETURNS TABLE (origem text, registro_id uuid, unidade_id uuid, tipo text, data_inicio date, data_fim date,
               ato_tipo text, ato_numero text, ato_data date, ato_doe_numero text, ato_doe_data date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date := coalesce(p_data, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT x.o, x.rid, x.uni, x.tp, x.di, x.df, x.a_tipo, x.a_num, x.a_data, x.a_doe_num, x.a_doe_data
    FROM (
      SELECT 'lotacao'::text AS o, l.id AS rid, l.unidade_id AS uni, coalesce(l.tipo_lotacao::text, 'lotacao_interna') AS tp,
             l.data_inicio AS di, l.data_fim AS df, l.ato_tipo AS a_tipo, l.ato_numero AS a_num, l.ato_data AS a_data,
             l.ato_doe_numero AS a_doe_num, l.ato_doe_data AS a_doe_data
        FROM public.lotacoes l
       WHERE l.servidor_id = p_servidor_id AND l.ativo IS TRUE
         AND l.data_inicio <= d AND (l.data_fim IS NULL OR l.data_fim >= d)
         AND l.tipo_lotacao IS DISTINCT FROM 'lotacao_externa'
         AND EXISTS (SELECT 1 FROM public.estrutura_organizacional e WHERE e.id = l.unidade_id)
      UNION ALL
      SELECT 'cessao'::text, c.id, c.unidade_idjuv_id, 'cessao_entrada', c.data_inicio, coalesce(c.data_retorno, c.data_fim),
             c.ato_tipo, c.ato_numero, c.ato_data, c.ato_doe_numero, c.ato_doe_data
        FROM public.cessoes c
       WHERE c.servidor_id = p_servidor_id AND c.tipo = 'entrada' AND c.ativa IS TRUE AND c.unidade_idjuv_id IS NOT NULL
         AND c.data_inicio <= d AND (coalesce(c.data_retorno, c.data_fim) IS NULL OR coalesce(c.data_retorno, c.data_fim) >= d)
         AND EXISTS (SELECT 1 FROM public.estrutura_organizacional e WHERE e.id = c.unidade_idjuv_id)
    ) x
   ORDER BY (x.o = 'cessao'), x.di DESC;
END;
$$;
-- A unidade precisa existir na estrutura (as FKs garantem isso; o EXISTS cobre carga feita com os triggers desligados):
-- a trilha grava essa unidade em audit_logs.org_unit_id, que tem FK, e uma unidade órfã derrubaria a gravação do usuário.
COMMENT ON FUNCTION public.lotacao_vigente(uuid, date) IS
  'Lotação ativa vigente do servidor na data (fora lotacao_externa) e cessão de entrada com unidade no órgão; lotação primeiro';

-- A unidade e as que estão acima dela (superior_id). Não usa get_hierarquia_unidade: aquela é UNION ALL sem limite, e
-- um ciclo na estrutura (A acima de B acima de A) prenderia TODA gravação das tabelas da regra; aqui a recursão para em
-- 50 níveis.
CREATE OR REPLACE FUNCTION public.unidade_e_superiores(p_unidade_id uuid)
RETURNS uuid[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v uuid[];
BEGIN
  IF p_unidade_id IS NULL THEN
    RETURN '{}'::uuid[];
  END IF;
  WITH RECURSIVE s(id, superior_id, n) AS (
    SELECT e.id, e.superior_id, 1 FROM public.estrutura_organizacional e WHERE e.id = p_unidade_id
    UNION
    SELECT e.id, e.superior_id, s.n + 1 FROM public.estrutura_organizacional e JOIN s ON e.id = s.superior_id WHERE s.n < 50
  )
  SELECT array_agg(DISTINCT s.id) INTO v FROM s;
  RETURN coalesce(v, ARRAY[p_unidade_id]);
END;
$$;

-- Módulos de cada tabela de lançamento (onde a regra roda). Fase 1: as 79 tabelas do RH (linhas com `rh` em modulos no
-- supabase/baseline/rls/mapa.csv, menos as 2 de classe trilha). O primeiro módulo é o que aparece no negado.
--   * rh + financeiro (premissa 3: o setor financeiro conta como setor da folha para pagamento): as tabelas cuja escrita
--     exige financeiro.folha.* no mapa, mais retornos_bancarios e exportacoes_folha (arquivos do pagamento), e as que o
--     mapa já põe nos dois módulos (viagens_diarias, contas_autarquia, config_autarquia, config_institucional);
--   * as outras multimódulo do mapa levam os módulos do mapa (documentos, composicao_cargos, historico_funcional,
--     nomeacoes_chefe_unidade, pre_cadastros, provimentos);
--   * as demais, só rh. Tabela fora da lista: NULL (a regra não roda e a trilha não grava fundamento).
-- Tabela nova do RH entra aqui e no laço do bloco 6 (scripts/check-autoria-rh.mjs cobra o trigger; o teste de RLS
-- cobra esta lista contra o mapa).
CREATE OR REPLACE FUNCTION public.lancamento_modulos_tabela(p_tabela text)
RETURNS text[] LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  RETURN CASE
    WHEN p_tabela IN ('consignacoes', 'dependentes_irrf', 'eventos_esocial', 'fichas_financeiras', 'folhas_pagamento',
                      'itens_ficha_financeira', 'itens_retorno_bancario', 'lancamentos_folha', 'parametros_folha',
                      'pensoes_alimenticias', 'remessas_bancarias', 'rubricas', 'tabela_inss', 'tabela_irrf',
                      'retornos_bancarios', 'exportacoes_folha', 'viagens_diarias', 'contas_autarquia', 'config_autarquia',
                      'config_institucional')
      THEN ARRAY['rh', 'financeiro']
    WHEN p_tabela = 'documentos' THEN ARRAY['rh', 'workflow', 'gabinete', 'governanca', 'admin']
    WHEN p_tabela IN ('historico_funcional', 'pre_cadastros', 'provimentos') THEN ARRAY['rh', 'gabinete']
    WHEN p_tabela = 'composicao_cargos' THEN ARRAY['rh', 'governanca']
    WHEN p_tabela = 'nomeacoes_chefe_unidade' THEN ARRAY['rh', 'patrimonio']
    WHEN p_tabela IN ('adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
                      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'comissoes', 'comissoes_membros',
                      'config_agrupamento_unidades', 'config_assinatura_frequencia', 'config_compensacao',
                      'config_fechamento_folha', 'config_fechamento_frequencia', 'config_incidencias',
                      'config_jornada_padrao', 'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas',
                      'config_situacoes_funcionais', 'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica',
                      'config_tipos_servidor', 'configuracao_jornada', 'designacoes', 'dias_nao_uteis',
                      'documentos_requerimento_servidor', 'feriados', 'ferias_servidor', 'frequencia_arquivos',
                      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'horarios_jornada',
                      'justificativas_ponto', 'lancamentos_banco_horas', 'licencas_afastamentos', 'lotacoes',
                      'memorandos_lotacao', 'ocorrencias_servidor', 'portarias_servidor', 'regimes_trabalho',
                      'registros_ponto', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
                      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tipos_abono', 'vinculos_funcionais',
                      'vinculos_servidor')
      THEN ARRAY['rh']
  END;
END;
$$;

-- Fundamento do login atual para lançar nos módulos informados, hoje. Devolve jsonb (chaves nulas omitidas):
--   permitido (boolean), via (lotacao | designacao | comissao | sistema | anonimo | negado_sem_servidor | negado_setor),
--   modo (o mais restritivo entre os módulos), modulos (os informados, sem repetição), modulo (o do setor que deu o
--   fundamento; nos negados, o primeiro), servidor_id, data, unidade_id (lotação/cessão: a unidade; designação: o
--   destino; negado_setor: a unidade da lotação vigente, se houver), setor_unidade_id (a unidade de setores_modulo que
--   casou), lotacao_id | cessao_id | designacao_id | comissao_id (+ comissao_membro_id, papel) e ato {tipo, numero,
--   data, doe_numero, doe_data}.
-- Ordem: lotação, designação, comissão; dentro de cada via, o módulo na ordem informada. Sem atalho para o papel admin.
-- Cache por transação e por conjunto de módulos (variável local lancamento.m_<md5>, como trilha.contexto da E1): a chave
-- é usuário + papel da sessão + geração; lancamento_cache_invalidar (mudança em lotações, designações, cessões,
-- comissões, membros, setores, regra, estrutura e vínculo do perfil) sobe a geração. A API não define variáveis de
-- sessão: o cliente não forja o cache.
CREATE OR REPLACE FUNCTION public.fundamento_lancamento(p_modulos text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mods text[];
  v_chave text;
  v_guc text;
  v_cache text;
  c jsonb;
  v_uid uuid;
  v_srv uuid;
  v_data date := CURRENT_DATE;
  v_modo text;
  v_unid uuid;
  f jsonb;
  r record;
BEGIN
  SELECT array_agg(u.m ORDER BY u.o) INTO v_mods
    FROM (SELECT x.m, min(x.o) AS o FROM unnest(p_modulos) WITH ORDINALITY AS x(m, o)
           WHERE x.m IS NOT NULL AND btrim(x.m) <> '' GROUP BY x.m) u;
  IF v_mods IS NULL THEN
    RETURN NULL;
  END IF;
  v_chave := coalesce(auth.uid()::text, '-') || '|' || coalesce(current_setting('role', true), 'none') || '|'
             || coalesce(current_setting('lancamento.geracao', true), '');
  v_guc := 'lancamento.m_' || md5(array_to_string(v_mods, ','));
  v_cache := current_setting(v_guc, true);
  IF v_cache IS NOT NULL AND left(v_cache, length(v_chave) + 1) = v_chave || chr(10) THEN
    RETURN substr(v_cache, length(v_chave) + 2)::jsonb;
  END IF;

  SELECT CASE max(CASE rl.modo WHEN 'exigir' THEN 2 WHEN 'registrar' THEN 1 ELSE 0 END)
           WHEN 2 THEN 'exigir' WHEN 1 THEN 'registrar' ELSE 'desligado' END
    INTO v_modo
    FROM public.regra_lancamento rl
   WHERE rl.modulo::text = ANY (v_mods);
  v_modo := coalesce(v_modo, 'desligado');

  c := public.trilha_contexto();
  v_uid := (c ->> 'user_id')::uuid;
  v_srv := (c ->> 'servidor_id')::uuid;

  IF v_uid IS NULL THEN
    f := jsonb_build_object('permitido', true, 'via', CASE WHEN c ->> 'origem' = 'anonimo' THEN 'anonimo' ELSE 'sistema' END);
  ELSIF v_srv IS NULL THEN
    f := jsonb_build_object('permitido', false, 'via', 'negado_sem_servidor', 'modulo', v_mods[1]);
  ELSE
    -- 1. lotação (ou cessão de entrada) vigente numa unidade do setor
    SELECT lv.origem, lv.registro_id, lv.unidade_id, sm.unidade_id AS setor_id, sm.modulo::text AS modulo,
           lv.ato_tipo, lv.ato_numero, lv.ato_data, lv.ato_doe_numero, lv.ato_doe_data
      INTO r
      FROM public.lotacao_vigente(v_srv, v_data) lv
      JOIN public.setores_modulo sm
        ON sm.ativo AND sm.modulo::text = ANY (v_mods)
       AND (sm.unidade_id = lv.unidade_id
            OR (sm.inclui_subordinadas AND sm.unidade_id = ANY (public.unidade_e_superiores(lv.unidade_id))))
     ORDER BY array_position(v_mods, sm.modulo::text), (lv.origem = 'cessao'), lv.data_inicio DESC
     LIMIT 1;
    IF FOUND THEN
      f := jsonb_build_object('permitido', true, 'via', 'lotacao', 'modulo', r.modulo, 'unidade_id', r.unidade_id,
                              'setor_unidade_id', r.setor_id,
                              CASE WHEN r.origem = 'cessao' THEN 'cessao_id' ELSE 'lotacao_id' END, r.registro_id,
                              'ato', nullif(jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)), '{}'::jsonb));
    ELSE
      -- 2. designação aprovada, ativa, vigente e com ato para uma unidade do setor
      SELECT d.id, d.unidade_destino_id, sm.unidade_id AS setor_id, sm.modulo::text AS modulo,
             d.ato_tipo, d.ato_numero, d.ato_data, d.ato_doe_numero, d.ato_doe_data
        INTO r
        FROM public.designacoes d
        JOIN public.setores_modulo sm
          ON sm.ativo AND sm.modulo::text = ANY (v_mods)
         AND (sm.unidade_id = d.unidade_destino_id
              OR (sm.inclui_subordinadas AND sm.unidade_id = ANY (public.unidade_e_superiores(d.unidade_destino_id))))
       WHERE d.servidor_id = v_srv AND d.status = 'aprovada' AND d.ativo IS NOT FALSE
         AND d.data_inicio <= v_data AND (d.data_fim IS NULL OR d.data_fim >= v_data)
         AND nullif(btrim(d.ato_numero), '') IS NOT NULL AND d.ato_data IS NOT NULL
       ORDER BY array_position(v_mods, sm.modulo::text), d.data_inicio DESC
       LIMIT 1;
      IF FOUND THEN
        f := jsonb_build_object('permitido', true, 'via', 'designacao', 'modulo', r.modulo, 'unidade_id', r.unidade_destino_id,
                                'setor_unidade_id', r.setor_id, 'designacao_id', r.id,
                                'ato', jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                  'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)));
      ELSE
        -- 3. comissão ativa, vigente, com ato, do módulo e sem objeto; membro no período dele
        SELECT co.id, co.modulo::text AS modulo, cm.id AS membro_id, cm.papel,
               co.ato_tipo, co.ato_numero, co.ato_data, co.ato_doe_numero, co.ato_doe_data
          INTO r
          FROM public.comissoes_membros cm
          JOIN public.comissoes co ON co.id = cm.comissao_id
         WHERE cm.servidor_id = v_srv AND co.status = 'ativa' AND co.modulo::text = ANY (v_mods)
           AND co.objeto_tipo IS NULL
           AND co.data_inicio <= v_data AND (co.data_fim IS NULL OR co.data_fim >= v_data)
           AND (cm.data_inicio IS NULL OR cm.data_inicio <= v_data) AND (cm.data_fim IS NULL OR cm.data_fim >= v_data)
           AND nullif(btrim(co.ato_numero), '') IS NOT NULL AND co.ato_data IS NOT NULL
         ORDER BY array_position(v_mods, co.modulo::text), co.data_inicio DESC
         LIMIT 1;
        IF FOUND THEN
          f := jsonb_build_object('permitido', true, 'via', 'comissao', 'modulo', r.modulo, 'comissao_id', r.id,
                                  'comissao_membro_id', r.membro_id, 'papel', r.papel,
                                  'ato', jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                    'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)));
        ELSE
          SELECT lv.unidade_id INTO v_unid FROM public.lotacao_vigente(v_srv, v_data) lv LIMIT 1;
          f := jsonb_build_object('permitido', false, 'via', 'negado_setor', 'modulo', v_mods[1], 'unidade_id', v_unid);
        END IF;
      END IF;
    END IF;
  END IF;

  f := jsonb_strip_nulls(f || jsonb_build_object('modo', v_modo, 'modulos', to_jsonb(v_mods), 'servidor_id', v_srv,
                                                 'data', v_data));
  PERFORM set_config(v_guc, v_chave || chr(10) || f::text, true);
  RETURN f;
END;
$$;
COMMENT ON FUNCTION public.fundamento_lancamento(text[]) IS
  'Fundamento do login atual para lançar nos módulos (lotação, designação, comissão, sistema, anônimo ou negado), com o modo da regra; cache por transação';

-- O fundamento da tabela (lancamento_modulos_tabela + fundamento_lancamento), com cache por tabela na transação
-- (variável local lancamento.t_<tabela>, mesma chave): os triggers chamam UMA função por linha. NULL = tabela fora da
-- regra.
CREATE OR REPLACE FUNCTION public.fundamento_tabela(p_tabela text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_chave text;
  v_guc text := 'lancamento.t_' || p_tabela;
  v_cache text := current_setting('lancamento.t_' || p_tabela, true);
  v_mods text[];
  f jsonb;
BEGIN
  v_chave := coalesce(auth.uid()::text, '-') || '|' || coalesce(current_setting('role', true), 'none') || '|'
             || coalesce(current_setting('lancamento.geracao', true), '');
  IF v_cache IS NOT NULL AND left(v_cache, length(v_chave) + 1) = v_chave || chr(10) THEN
    v_cache := substr(v_cache, length(v_chave) + 2);
    RETURN CASE WHEN v_cache = '' THEN NULL ELSE v_cache::jsonb END;
  END IF;
  v_mods := public.lancamento_modulos_tabela(p_tabela);
  IF v_mods IS NOT NULL THEN
    f := public.fundamento_lancamento(v_mods);
  END IF;
  PERFORM set_config(v_guc, v_chave || chr(10) || coalesce(f::text, ''), true);
  RETURN f;
END;
$$;

-- Fundamento que depende da LINHA (chamada só quando o fundamento de setor é negado, e só nestas tabelas). Devolve
-- {permitido: true, via, modulo: 'rh', servidor_id, data} ou NULL. Exige servidor vinculado (login sem servidor só
-- consulta). Como decidimos (premissa 2 e desenho), usando a posse que o gerador da RLS já conhece:
--   autoatendimento — INSERT do pedido do próprio servidor nas tabelas em que a RLS deixa o dono inserir
--     (;insere_proprio no mapa): solicitacoes_abono e documentos_requerimento_servidor (servidor_id = o do login),
--     solicitacoes_ajuste_ponto (;posse=usuario: servidor_id = auth.uid()) e justificativas_ponto (;pai=registros_ponto:
--     o ponto é do servidor do login). Os campos de decisão desses pedidos já são zerados por forcar_campos_iniciais.
--     E a assinatura da própria frequência: UPDATE de frequencia_fechamento do próprio servidor que só muda
--     assinado_servidor/assinado_servidor_em (validar_etapa_frequencia já garante que só o dono assina).
--   chefia — nas quatro tabelas de etapa (validar_etapa_frequencia), quem tem rh.aprovar e NÃO tem
--     rh.frequencia.lancar: a regra de etapa (trigger anterior, trg_validar_etapa_frequencia) já limitou o comando à
--     decisão da chefia (UPDATE: aprovar/rejeitar o pedido pendente, validar o fechamento); a RLS (;sem_autoaprovacao)
--     já impede a decisão sobre a própria linha. INSERT só conta em frequencia_fechamento com validado_chefia = true
--     (a validação que cria a linha); em frequencia_fechamento o UPDATE só conta se mudar apenas validado_chefia*,
--     observacoes e updated_* (a etapa não limita os outros campos do fechamento para a chefia). Quem tem
--     rh.frequencia.lancar age como RH e precisa do setor; o papel admin tem todos os códigos (has_permission_code),
--     então nunca cai na via chefia. Férias e licenças não têm etapa de chefia no banco (a escrita é do RH, com
--     rh.ferias.*/rh.licencas.*): não há via chefia nelas. A hierarquia (se o aprovador chefia de fato a unidade do
--     servidor) não é conferida no banco, como já não era na regra de etapa.
CREATE OR REPLACE FUNCTION public.fundamento_linha(p_tabela text, p_op text, p_novo jsonb, p_velho jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c jsonb := public.trilha_contexto();
  v_uid uuid := (c ->> 'user_id')::uuid;
  v_srv uuid := (c ->> 'servidor_id')::uuid;
  v_via text;
  v_mudou text[];
BEGIN
  IF v_uid IS NULL OR v_srv IS NULL THEN
    RETURN NULL;
  END IF;
  IF p_op = 'UPDATE' THEN
    SELECT array_agg(k) INTO v_mudou
      FROM jsonb_object_keys(p_novo) AS k
     WHERE (p_novo -> k) IS DISTINCT FROM (p_velho -> k)
       AND k NOT IN ('updated_at', 'updated_by', 'updated_by_servidor_id');
  END IF;

  -- autoatendimento
  IF p_op = 'INSERT' THEN
    IF (p_tabela IN ('solicitacoes_abono', 'documentos_requerimento_servidor') AND (p_novo ->> 'servidor_id')::uuid = v_srv)
       OR (p_tabela = 'solicitacoes_ajuste_ponto' AND (p_novo ->> 'servidor_id')::uuid = v_uid)
       OR (p_tabela = 'justificativas_ponto' AND EXISTS (
             SELECT 1 FROM public.registros_ponto rp
              WHERE rp.id = (p_novo ->> 'registro_ponto_id')::uuid AND rp.servidor_id = v_srv)) THEN
      v_via := 'autoatendimento';
    END IF;
  ELSIF p_op = 'UPDATE' AND p_tabela = 'frequencia_fechamento'
        AND (p_velho ->> 'servidor_id')::uuid = v_srv AND (p_novo ->> 'servidor_id')::uuid = v_srv
        AND v_mudou IS NOT NULL AND v_mudou <@ ARRAY['assinado_servidor', 'assinado_servidor_em'] THEN
    v_via := 'autoatendimento';
  END IF;

  -- chefia
  IF v_via IS NULL
     AND p_tabela IN ('solicitacoes_abono', 'frequencia_fechamento', 'justificativas_ponto', 'solicitacoes_ajuste_ponto')
     AND ((p_op = 'UPDATE' AND (p_tabela <> 'frequencia_fechamento'
                                OR (v_mudou IS NOT NULL
                                    AND v_mudou <@ ARRAY['validado_chefia', 'validado_chefia_por', 'validado_chefia_em', 'observacoes'])))
          OR (p_op = 'INSERT' AND p_tabela = 'frequencia_fechamento' AND (p_novo ->> 'validado_chefia') = 'true'))
     AND public.has_permission_code(v_uid, 'rh.aprovar')
     AND NOT public.has_permission_code(v_uid, 'rh.frequencia.lancar') THEN
    v_via := 'chefia';
  END IF;

  IF v_via IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object('permitido', true, 'via', v_via, 'modulo', 'rh', 'servidor_id', v_srv, 'data', CURRENT_DATE);
END;
$$;

-- RPC de consulta (o front mostra "somente consulta" e desabilita os botões): uma linha por módulo do enum, com o modo
-- da regra e o fundamento do login atual hoje. `permitido` é o fundamento de setor (independe do modo); `bloqueado` =
-- modo exigir sem fundamento. Autoatendimento e chefia dependem da linha e não aparecem aqui: continuam valendo
-- mesmo com bloqueado = true (a tela do próprio servidor e a de aprovação da chefia não devem ser bloqueadas por isto).
CREATE OR REPLACE FUNCTION public.meus_fundamentos_lancamento()
RETURNS TABLE (modulo text, modo text, permitido boolean, bloqueado boolean, via text, unidade_id uuid,
               unidade_nome text, lotacao_id uuid, cessao_id uuid, designacao_id uuid, comissao_id uuid, ato jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m text;
  f jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'meus_fundamentos_lancamento: usuário não autenticado ou inativo' USING ERRCODE = '42501';
  END IF;
  FOR m IN SELECT e::text FROM unnest(enum_range(NULL::public.app_module)) AS e LOOP
    f := public.fundamento_lancamento(ARRAY[m]);
    modulo := m;
    modo := f ->> 'modo';
    permitido := (f ->> 'permitido')::boolean;
    bloqueado := modo = 'exigir' AND NOT permitido;
    via := f ->> 'via';
    unidade_id := (f ->> 'unidade_id')::uuid;
    unidade_nome := (SELECT e.nome FROM public.estrutura_organizacional e WHERE e.id = unidade_id);
    lotacao_id := (f ->> 'lotacao_id')::uuid;
    cessao_id := (f ->> 'cessao_id')::uuid;
    designacao_id := (f ->> 'designacao_id')::uuid;
    comissao_id := (f ->> 'comissao_id')::uuid;
    ato := f -> 'ato';
    RETURN NEXT;
  END LOOP;
END;
$$;
COMMENT ON FUNCTION public.meus_fundamentos_lancamento() IS
  'Por módulo: modo da regra de lançamento, se o login tem fundamento de setor hoje (via, unidade, ato) e se está bloqueado (exigir sem fundamento)';

-- Relatório de saneamento (fase 1, passo 1 da transição): servidores ativos (ativo e situação fora de exonerado,
-- aposentado, falecido e inativo) com pelo menos um problema: sem login vinculado (nenhum perfil com servidor_id), sem
-- lotação vigente (lotacao_vigente vazia) ou com servidores.unidade_atual_id diferente da unidade da lotação vigente.
-- Sem CPF nem outro dado pessoal além de nome e matrícula. Admin, ou módulo rh com rh.auditoria.visualizar.
CREATE OR REPLACE FUNCTION public.saneamento_lancamento()
RETURNS TABLE (servidor_id uuid, nome text, matricula text, situacao text, tem_login boolean, login_ativo boolean,
               lotacao_unidade_id uuid, lotacao_unidade_nome text, unidade_atual_id uuid, unidade_atual_nome text,
               problemas text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_admin_user(auth.uid())
       OR (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.auditoria.visualizar'))) THEN
    RAISE EXCEPTION 'saneamento_lancamento: exige o papel admin ou o módulo rh com rh.auditoria.visualizar'
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT x.sid, x.snome, x.smat, x.ssit, x.tem, x.ativo_login, x.luni, el.nome::text, x.uatual, ea.nome::text, x.probs
    FROM (
      SELECT s.id AS sid, s.nome_completo::text AS snome, s.matricula::text AS smat, s.situacao::text AS ssit,
             p.tem, p.ativo_login, lv.unidade_id AS luni, s.unidade_atual_id AS uatual,
             array_remove(ARRAY[
               CASE WHEN NOT p.tem THEN 'sem_login' END,
               CASE WHEN lv.unidade_id IS NULL THEN 'sem_lotacao' END,
               CASE WHEN lv.unidade_id IS NOT NULL AND s.unidade_atual_id IS DISTINCT FROM lv.unidade_id
                    THEN 'lotacao_divergente' END], NULL) AS probs
        FROM public.servidores s
        CROSS JOIN LATERAL (
          SELECT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.servidor_id = s.id) AS tem,
                 EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.servidor_id = s.id AND pr.is_active) AS ativo_login) p
        LEFT JOIN LATERAL (SELECT v.unidade_id FROM public.lotacao_vigente(s.id) v LIMIT 1) lv ON true
       WHERE s.ativo IS NOT FALSE AND s.situacao::text NOT IN ('exonerado', 'aposentado', 'falecido', 'inativo')
    ) x
    LEFT JOIN public.estrutura_organizacional el ON el.id = x.luni
    LEFT JOIN public.estrutura_organizacional ea ON ea.id = x.uatual
   WHERE cardinality(x.probs) > 0
   ORDER BY x.snome;
END;
$$;
COMMENT ON FUNCTION public.saneamento_lancamento() IS
  'Servidores ativos sem login vinculado, sem lotação vigente ou com unidade_atual_id divergente da lotação (sem CPF)';

-- E1: "usuário sem servidor vinculado pode lançar no RH". Agora a resposta é a regra: true quando o RH está em modo
-- exigir. Mantida por compatibilidade (nada no banco a chama mais: a checagem passou ao trigger zz_exigir_setor).
CREATE OR REPLACE FUNCTION public.rh_exige_servidor_vinculado()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN coalesce((SELECT rl.modo = 'exigir' FROM public.regra_lancamento rl WHERE rl.modulo = 'rh'), false);
END;
$$;

-- Zera o cache da regra (sobe a geração) e o contexto da trilha (a unidade vem da lotação) na transação.
CREATE OR REPLACE FUNCTION public.lancamento_cache_invalidar()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM set_config('lancamento.geracao',
    (coalesce(nullif(current_setting('lancamento.geracao', true), ''), '0')::bigint + 1)::text, true);
  PERFORM set_config('trilha.contexto', '', true);
  RETURN NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Trilha
-- ----------------------------------------------------------------------------
-- trilha_contexto: corpo da E1 com uma mudança: a unidade gravada na trilha (unidade_id -> audit_logs.org_unit_id) é a
-- da lotação vigente do servidor do login (lotacao_vigente), não mais a unidade principal de user_org_units (que é
-- escopo de acesso, não onde a pessoa trabalha). Sem servidor ou sem lotação: nula. fn_audit_trigger ainda prefere a
-- unidade do fundamento usado (designação: a unidade de destino).
CREATE OR REPLACE FUNCTION public.trilha_contexto()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_papel_sessao text := coalesce(current_setting('role', true), 'none');
  v_chave text;
  v_cache text := current_setting('trilha.contexto', true);
  v_ctx jsonb;
  v_srv uuid;
  v_nome text;
  v_mat text;
  v_papel text;
  v_unid uuid;
  r record;
BEGIN
  v_chave := coalesce(v_uid::text, '-') || '|' || v_papel_sessao || '|'
             || md5(coalesce(current_setting('request.headers', true), ''));
  IF v_cache IS NOT NULL AND v_cache <> '' THEN
    v_ctx := v_cache::jsonb;
    IF v_ctx ->> 'k' = v_chave THEN
      RETURN v_ctx;
    END IF;
  END IF;
  IF v_uid IS NOT NULL THEN
    SELECT p.servidor_id, s.nome_completo::text, s.matricula::text INTO v_srv, v_nome, v_mat
      FROM public.profiles p LEFT JOIN public.servidores s ON s.id = p.servidor_id
     WHERE p.id = v_uid;
    SELECT ur.role::text INTO v_papel FROM public.user_roles ur
     WHERE ur.user_id = v_uid ORDER BY (ur.role = 'admin') DESC LIMIT 1;
    IF v_srv IS NOT NULL THEN
      SELECT lv.unidade_id INTO v_unid FROM public.lotacao_vigente(v_srv) lv LIMIT 1;
    END IF;
  END IF;
  SELECT * INTO r FROM public.trilha_contexto_requisicao();
  v_ctx := jsonb_build_object(
    'k', v_chave,
    'user_id', v_uid,
    'servidor_id', v_srv,
    'servidor_nome', v_nome,
    'servidor_matricula', v_mat,
    'origem', CASE
                WHEN v_uid IS NULL AND v_papel_sessao IN ('anon', 'authenticated') THEN 'anonimo'
                WHEN v_uid IS NULL THEN 'sistema'
                WHEN v_srv IS NULL THEN 'usuario_sem_vinculo'
                ELSE 'usuario'
              END,
    'papel', v_papel,
    'unidade_id', v_unid,
    'ip', r.ip::text,
    'agente', r.agente);
  PERFORM set_config('trilha.contexto', v_ctx::text, true);
  RETURN v_ctx;
END;
$$;

-- trilha_completar_contexto: corpo da E1; para OUTRO usuário (Edge Function em nome de alguém) a unidade também passa a
-- ser a da lotação vigente do servidor dele.
CREATE OR REPLACE FUNCTION public.trilha_completar_contexto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c jsonb := public.trilha_contexto();
  v_srv uuid;
  v_nome text;
  v_mat text;
BEGIN
  NEW.transacao := coalesce(NEW.transacao, txid_current());
  NEW.origem := coalesce(NEW.origem, c ->> 'origem');
  IF NEW.user_id IS NOT NULL THEN
    IF NEW.user_id = (c ->> 'user_id')::uuid THEN
      IF NEW.servidor_id IS NULL THEN
        NEW.servidor_id := (c ->> 'servidor_id')::uuid;
        NEW.servidor_nome := coalesce(NEW.servidor_nome, c ->> 'servidor_nome');
        NEW.servidor_matricula := coalesce(NEW.servidor_matricula, c ->> 'servidor_matricula');
      END IF;
      NEW.role_at_time := coalesce(NEW.role_at_time, (c ->> 'papel')::public.app_role);
      NEW.org_unit_id := coalesce(NEW.org_unit_id, (c ->> 'unidade_id')::uuid);
    ELSE
      -- outro usuário (ex.: Edge Function que grava em nome do administrador que a chamou)
      IF NEW.servidor_id IS NULL THEN
        SELECT p.servidor_id, s.nome_completo::text, s.matricula::text INTO v_srv, v_nome, v_mat
          FROM public.profiles p LEFT JOIN public.servidores s ON s.id = p.servidor_id
         WHERE p.id = NEW.user_id;
        NEW.servidor_id := v_srv;
        NEW.servidor_nome := coalesce(NEW.servidor_nome, v_nome);
        NEW.servidor_matricula := coalesce(NEW.servidor_matricula, v_mat);
      END IF;
      IF NEW.role_at_time IS NULL THEN
        SELECT ur.role INTO NEW.role_at_time FROM public.user_roles ur
         WHERE ur.user_id = NEW.user_id ORDER BY (ur.role = 'admin') DESC LIMIT 1;
      END IF;
      IF NEW.org_unit_id IS NULL THEN
        SELECT lv.unidade_id INTO NEW.org_unit_id
          FROM public.profiles p CROSS JOIN LATERAL public.lotacao_vigente(p.servidor_id) lv
         WHERE p.id = NEW.user_id AND p.servidor_id IS NOT NULL
         LIMIT 1;
      END IF;
    END IF;
  END IF;
  NEW.ip_address := coalesce(NEW.ip_address, (c ->> 'ip')::inet);
  NEW.user_agent := coalesce(NEW.user_agent, c ->> 'agente');
  RETURN NEW;
END;
$$;

-- fn_audit_trigger v3 (mesma assinatura; corpo da v2 da E1): grava em audit_logs.fundamento o fundamento da gravação
-- (fundamento_tabela, em cache na transação; para autoatendimento e chefia, fundamento_linha sobre a linha antes da
-- máscara). Regra desligada no(s) módulo(s) da tabela, ou tabela fora da regra (ex.: profiles, módulo admin):
-- fundamento nulo. Gravação feita por outro trigger (pg_trigger_depth() > 1: cascata de FK, trigger que atualiza outra
-- tabela) não é checada pela regra; a linha leva o fundamento de quem disparou, com em_cascata = true (o relatório de
-- bloqueios deve ignorá-la). A unidade da linha (org_unit_id) é a do fundamento usado; sem ela, a da lotação vigente.
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_acao text;
  v_antes jsonb;
  v_depois jsonb;
  v_campos text[];
  v_id text;
  v_entidade uuid;
  v_chave jsonb;
  v_descricao text;
  v_fund jsonb;
  v_linha jsonb;
  c jsonb;
  s record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_acao := 'create';
    v_depois := to_jsonb(NEW);
    v_descricao := 'Registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    v_antes := to_jsonb(OLD);
    v_depois := to_jsonb(NEW);
    SELECT array_agg(k ORDER BY k) INTO v_campos
      FROM jsonb_object_keys(v_depois) AS k
     WHERE (v_depois -> k) IS DISTINCT FROM (v_antes -> k)
       AND k NOT IN ('updated_at', 'updated_by', 'updated_by_servidor_id');
    IF v_campos IS NULL THEN
      RETURN NEW;   -- nada mudou além do carimbo de atualização
    END IF;
    v_descricao := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSE
    v_acao := 'delete';
    v_antes := to_jsonb(OLD);
    v_descricao := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  -- fundamento da regra de lançamento por setor (antes da máscara: a posse da linha é lida sem ela)
  v_fund := public.fundamento_tabela(TG_TABLE_NAME);
  IF v_fund IS NOT NULL THEN
    IF v_fund ->> 'modo' = 'desligado' THEN
      v_fund := NULL;
    ELSIF pg_trigger_depth() > 1 THEN
      v_fund := v_fund || jsonb_build_object('em_cascata', true);
    ELSIF (v_fund ->> 'permitido') = 'false'
          AND TG_TABLE_NAME IN ('solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto',
                                'frequencia_fechamento', 'documentos_requerimento_servidor') THEN
      v_linha := public.fundamento_linha(TG_TABLE_NAME, TG_OP, v_depois, v_antes);
      IF v_linha IS NOT NULL THEN
        v_fund := jsonb_build_object('modo', v_fund -> 'modo', 'modulos', v_fund -> 'modulos') || v_linha;
      END IF;
    END IF;
  END IF;

  v_id := coalesce(v_depois, v_antes) ->> 'id';
  IF v_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_entidade := v_id::uuid;
  END IF;

  -- máscara (mesma regra de trilha_mascarar, numa só leitura do catálogo para antes e depois)
  FOR s IN SELECT m.coluna, m.tratamento FROM public.audit_colunas_sensiveis m WHERE m.tabela = TG_TABLE_NAME LOOP
    IF v_antes ? s.coluna AND jsonb_typeof(v_antes -> s.coluna) <> 'null' THEN
      v_antes := jsonb_set(v_antes, ARRAY[s.coluna], CASE WHEN s.tratamento = 'parcial'
                   THEN to_jsonb(public.mascarar_parcial(v_antes ->> s.coluna)) ELSE to_jsonb('[protegido]'::text) END);
    END IF;
    IF v_depois ? s.coluna AND jsonb_typeof(v_depois -> s.coluna) <> 'null' THEN
      v_depois := jsonb_set(v_depois, ARRAY[s.coluna], CASE WHEN s.tratamento = 'parcial'
                   THEN to_jsonb(public.mascarar_parcial(v_depois ->> s.coluna)) ELSE to_jsonb('[protegido]'::text) END);
    END IF;
  END LOOP;

  IF v_entidade IS NULL THEN
    SELECT jsonb_object_agg(a.attname, coalesce(v_depois, v_antes) -> a.attname) INTO v_chave
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indrelid = TG_RELID AND i.indisprimary;
  END IF;

  c := public.trilha_contexto();

  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, before_data, after_data, user_id, description, metadata,
    campos_alterados, origem, servidor_id, servidor_nome, servidor_matricula, role_at_time, org_unit_id,
    ip_address, user_agent, transacao, fundamento
  ) VALUES (
    v_acao::public.audit_action, TG_TABLE_NAME, v_entidade, TG_ARGV[0], v_antes, v_depois, (c ->> 'user_id')::uuid,
    v_descricao,
    jsonb_build_object('trigger', true, 'operation', TG_OP, 'table', TG_TABLE_NAME)
      || CASE WHEN v_chave IS NOT NULL THEN jsonb_build_object('chave', v_chave) ELSE '{}'::jsonb END,
    v_campos, c ->> 'origem', (c ->> 'servidor_id')::uuid, c ->> 'servidor_nome', c ->> 'servidor_matricula',
    (c ->> 'papel')::public.app_role, coalesce((v_fund ->> 'unidade_id')::uuid, (c ->> 'unidade_id')::uuid),
    (c ->> 'ip')::inet, c ->> 'agente', txid_current(), v_fund
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- fixar_autoria: corpo da E1 sem a checagem de vínculo do início (`usuario_sem_vinculo AND
-- rh_exige_servidor_vinculado()`). Ela passa ao trigger zz_exigir_setor (bloco 6), que roda antes, vale por tabela (com
-- o modo dos módulos dela) e não alcança a configuração de acesso: setores_modulo e regra_lancamento também usam
-- fixar_autoria, e o admin sem servidor precisa configurá-las (premissa 1). Nada mais muda.
CREATE OR REPLACE FUNCTION public.fixar_autoria()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c jsonb := public.trilha_contexto();
  v_uid uuid := (c ->> 'user_id')::uuid;
  v_informa boolean := c ->> 'origem' = 'sistema';
  v_renovar text;
  n jsonb;
  o jsonb;
  ov jsonb := '{}'::jsonb;
  i int;
  arg text;
  v_criacao boolean;
  c_por text;
  c_em text;
  c_flag text;
BEGIN
  -- colunas padrão
  IF TG_OP = 'INSERT' THEN
    IF v_informa THEN
      NEW.created_by_servidor_id := coalesce(
        (SELECT p.servidor_id FROM public.profiles p WHERE p.id = NEW.created_by), NEW.created_by_servidor_id);
      NEW.created_at := coalesce(NEW.created_at, now());
    ELSE
      NEW.created_by := v_uid;
      NEW.created_by_servidor_id := (c ->> 'servidor_id')::uuid;
      NEW.created_at := now();
    END IF;
    NEW.updated_by := NEW.created_by;
    NEW.updated_by_servidor_id := NEW.created_by_servidor_id;
    NEW.updated_at := NEW.created_at;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_by_servidor_id := OLD.created_by_servidor_id;
    NEW.created_at := OLD.created_at;
    IF v_informa THEN
      IF NEW.updated_by IS NOT NULL AND NEW.updated_by IS DISTINCT FROM OLD.updated_by THEN
        NEW.updated_by_servidor_id := coalesce(
          (SELECT p.servidor_id FROM public.profiles p WHERE p.id = NEW.updated_by), NEW.updated_by_servidor_id);
      ELSE
        NEW.updated_by := NULL;
        NEW.updated_by_servidor_id := NULL;
      END IF;
    ELSE
      NEW.updated_by := v_uid;
      NEW.updated_by_servidor_id := (c ->> 'servidor_id')::uuid;
    END IF;
    NEW.updated_at := now();
  END IF;

  -- colunas de decisão (argumentos)
  IF TG_NARGS > 0 AND NOT v_informa THEN
    n := to_jsonb(NEW);
    o := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
    v_renovar := coalesce(current_setting('trilha.renovar_decisao', true), '');
    FOR i IN 0 .. TG_NARGS - 1 LOOP
      arg := TG_ARGV[i];
      v_criacao := left(arg, 1) = '+';
      IF v_criacao THEN
        arg := substr(arg, 2);
      END IF;
      c_por := split_part(arg, ':', 1);
      c_em := nullif(split_part(arg, ':', 2), '');
      c_flag := nullif(split_part(arg, ':', 3), '');
      CONTINUE WHEN NOT (n ? c_por);
      IF c_em IS NOT NULL AND NOT (n ? c_em) THEN
        c_em := NULL;
      END IF;
      IF c_flag IS NOT NULL AND NOT (n ? c_flag) THEN
        c_flag := NULL;
      END IF;
      IF v_criacao THEN
        IF TG_OP = 'INSERT' THEN
          ov := ov || jsonb_build_object(c_por, v_uid);
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
        ELSE
          ov := ov || jsonb_build_object(c_por, o -> c_por);
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, o -> c_em); END IF;
        END IF;
      ELSIF v_renovar = TG_TABLE_NAME || '.' || c_por
            OR (c_flag IS NOT NULL AND (n ->> c_flag) = 'true' AND (o ->> c_flag) IS DISTINCT FROM 'true') THEN
        ov := ov || jsonb_build_object(c_por, v_uid);                 -- decisão refeita pela RPC ou flag virou true
        IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
      ELSIF (n ->> c_por) IS NULL THEN
        IF (o ->> c_por) IS NOT NULL THEN
          ov := ov || jsonb_build_object(c_por, o -> c_por);          -- a API não apaga a decisão
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, o -> c_em); END IF;
        ELSIF c_em IS NOT NULL AND (n ->> c_em) IS DISTINCT FROM (o ->> c_em) THEN
          ov := ov || jsonb_build_object(c_em, coalesce(o -> c_em, 'null'::jsonb));   -- data sem autor não muda
        END IF;
      ELSIF (n ->> c_por) IS DISTINCT FROM (o ->> c_por) THEN
        ov := ov || jsonb_build_object(c_por, v_uid);                 -- nova decisão: de quem age, agora
        IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
      ELSIF c_em IS NOT NULL AND (n ->> c_em) IS DISTINCT FROM (o ->> c_em) THEN
        ov := ov || jsonb_build_object(c_em, coalesce(o -> c_em, 'null'::jsonb));     -- só a data mudou: volta
      END IF;
    END LOOP;
    IF ov <> '{}'::jsonb THEN
      NEW := jsonb_populate_record(NEW, ov);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- registrar_evento: corpo da E2 (20261011000200) com duas mudanças: comissoes e comissoes_membros entram na lista de
-- entidades (tabelas do RH) e a linha grava o fundamento do login no módulo rh (nulo com a regra desligada).
CREATE OR REPLACE FUNCTION public.registrar_evento(
  p_acao text,
  p_entidade text,
  p_entidade_id uuid DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_metadados jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_fund jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'registrar_evento: usuário não autenticado ou inativo' USING ERRCODE = '42501';
  END IF;
  IF p_acao IS NULL OR p_acao NOT IN ('view', 'export', 'download') THEN
    RAISE EXCEPTION 'registrar_evento: ação fora da lista (view, export, download; imprimir = download): %',
      left(coalesce(p_acao, '(nula)'), 40) USING ERRCODE = '22023';
  END IF;
  IF p_entidade IS NULL OR p_entidade <> ALL (ARRAY[
      -- tabelas do RH (as mesmas do laço do bloco 6 e as duas de trilha)
      'adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'comissoes', 'comissoes_membros', 'composicao_cargos',
      'config_agrupamento_unidades',
      'config_assinatura_frequencia', 'config_autarquia', 'config_compensacao', 'config_fechamento_folha',
      'config_fechamento_frequencia', 'config_incidencias', 'config_institucional', 'config_jornada_padrao',
      'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas', 'config_situacoes_funcionais',
      'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica', 'config_tipos_servidor', 'configuracao_jornada',
      'consignacoes', 'contas_autarquia', 'dependentes_irrf', 'designacoes', 'dias_nao_uteis', 'documentos',
      'documentos_requerimento_servidor', 'eventos_esocial', 'exportacoes_folha', 'feriados', 'ferias_servidor',
      'fichas_financeiras', 'folha_historico_status', 'folhas_pagamento', 'frequencia_arquivos',
      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'historico_funcional', 'horarios_jornada',
      'itens_ficha_financeira', 'itens_retorno_bancario', 'justificativas_ponto', 'lancamentos_banco_horas',
      'lancamentos_folha', 'licencas_afastamentos', 'lotacoes', 'memorandos_lotacao', 'nomeacoes_chefe_unidade',
      'ocorrencias_servidor', 'parametros_folha', 'pensoes_alimenticias', 'portarias_servidor', 'pre_cadastros',
      'provimentos', 'regimes_trabalho', 'registros_ponto', 'remessas_bancarias', 'retornos_bancarios', 'rubricas',
      'rubricas_historico', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tabela_inss', 'tabela_irrf', 'tipos_abono',
      'viagens_diarias', 'vinculos_funcionais', 'vinculos_servidor',
      -- documentos e consultas que não são uma tabela
      'contracheque', 'relatorio_rh', 'exportacao_rh', 'arquivo_esocial', 'arquivo_cnab', 'trilha_auditoria'
    ]) THEN
    RAISE EXCEPTION 'registrar_evento: entidade fora da lista: %', left(coalesce(p_entidade, '(nula)'), 60)
      USING ERRCODE = '22023';
  END IF;
  IF p_metadados IS NOT NULL AND (jsonb_typeof(p_metadados) <> 'object' OR length(p_metadados::text) > 4000) THEN
    RAISE EXCEPTION 'registrar_evento: metadados devem ser um objeto JSON de até 4000 caracteres' USING ERRCODE = '22023';
  END IF;
  IF NOT public.can_access_module(v_uid, 'rh') THEN
    IF p_entidade <> 'contracheque' OR p_entidade_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.fichas_financeiras f
                       WHERE f.id = p_entidade_id AND public.eh_meu_servidor(f.servidor_id)) THEN
      RAISE EXCEPTION 'registrar_evento: sem o módulo rh, só o próprio contracheque' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_fund := public.fundamento_lancamento(ARRAY['rh']);
  IF v_fund ->> 'modo' = 'desligado' THEN
    v_fund := NULL;
  END IF;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, module_name, user_id, description, metadata, fundamento)
  VALUES (p_acao::public.audit_action, p_entidade, p_entidade_id, 'rh', v_uid, left(p_descricao, 500),
          (coalesce(p_metadados, '{}'::jsonb) - ARRAY['trigger', 'operation', 'table', 'fonte', 'servidor_alvo_id'])
            || jsonb_build_object('registrar_evento', true, 'fonte', 'registrar_evento'),
          v_fund)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
COMMENT ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) IS
  'Registra na trilha do RH uma ação sem gravação (view, export, download; imprimir = download) sobre entidade de lista fechada';

-- ----------------------------------------------------------------------------
-- 6. Onde a regra roda
-- ----------------------------------------------------------------------------
-- exigir_setor(): fundamento da tabela (em cache na transação); modo exigir e sem fundamento de setor: tenta o da linha
-- (autoatendimento/chefia) e recusa com RHS01. Modo registrar: só aquece o cache (a trilha, fn_audit_trigger, grava o
-- fundamento) e nunca recusa. Pula a gravação feita por outro trigger (pg_trigger_depth() > 1: cascata de FK, trigger
-- que atualiza outra tabela, ex.: férias atualizando a situação do servidor), porque quem a disparou já foi checado; e a
-- origem sistema/anonimo (fundamento_lancamento devolve permitido). O nome começa com "zz_e": roda depois dos outros
-- BEFORE (trg_validar_etapa_frequencia já validou a etapa; trg_forcar_campos_iniciais já zerou a decisão do pedido) e
-- antes de zz_fixar_autoria.
CREATE OR REPLACE FUNCTION public.exigir_setor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f jsonb;
  v_setor text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  f := public.fundamento_tabela(TG_TABLE_NAME);
  IF f IS NULL OR f ->> 'modo' IS DISTINCT FROM 'exigir' OR (f ->> 'permitido') = 'true' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_TABLE_NAME IN ('solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto', 'frequencia_fechamento',
                       'documentos_requerimento_servidor')
     AND public.fundamento_linha(TG_TABLE_NAME, TG_OP,
           CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
           CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END) IS NOT NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  SELECT string_agg(m, ' ou ') INTO v_setor FROM jsonb_array_elements_text(f -> 'modulos') AS m;
  IF f ->> 'via' = 'negado_sem_servidor' THEN
    RAISE EXCEPTION 'Seu login não tem servidor vinculado: lançamento em % recusado (setor de %)', TG_TABLE_NAME, v_setor
      USING ERRCODE = 'RHS01',
            DETAIL = 'via=negado_sem_servidor',
            HINT = 'Sem servidor vinculado, o login só consulta. Peça ao administrador o vínculo do seu servidor ao login.';
  END IF;
  RAISE EXCEPTION 'Você não está lotado nem designado no setor de % (nem é membro de comissão vigente): lançamento em % recusado',
    v_setor, TG_TABLE_NAME
    USING ERRCODE = 'RHS01',
          DETAIL = 'via=' || coalesce(f ->> 'via', 'negado_setor'),
          HINT = 'Vale a lotação ativa no setor, a designação aprovada, vigente e com ato, ou a comissão vigente com ato.';
END;
$$;

-- 6a. Autoria e trilha nas 4 tabelas novas (as do RH no módulo rh; as de configuração no módulo admin). Sem argumentos
-- de decisão.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
      ('comissoes', 'rh'), ('comissoes_membros', 'rh'), ('setores_modulo', 'admin'), ('regra_lancamento', 'admin')
    ) AS x(tabela, modulo)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zz_fixar_autoria ON public.%I', t.tabela);
    EXECUTE format('CREATE TRIGGER zz_fixar_autoria BEFORE INSERT OR UPDATE ON public.%I '
                   'FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria()', t.tabela);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'audit_' || t.tabela, t.tabela);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I '
                   'FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger(%L)', 'audit_' || t.tabela, t.tabela, t.modulo);
  END LOOP;
END $$;

-- 6b. zz_exigir_setor nas 79 tabelas do RH (as 77 da E1 e as 2 de comissões). A tabela precisa estar em
-- lancamento_modulos_tabela (senão a migração aborta: o trigger rodaria sem módulo).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
      'adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'comissoes', 'comissoes_membros', 'composicao_cargos',
      'config_agrupamento_unidades', 'config_assinatura_frequencia', 'config_autarquia', 'config_compensacao',
      'config_fechamento_folha', 'config_fechamento_frequencia', 'config_incidencias', 'config_institucional',
      'config_jornada_padrao', 'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas',
      'config_situacoes_funcionais', 'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica',
      'config_tipos_servidor', 'configuracao_jornada', 'consignacoes', 'contas_autarquia', 'dependentes_irrf',
      'designacoes', 'dias_nao_uteis', 'documentos', 'documentos_requerimento_servidor', 'eventos_esocial',
      'exportacoes_folha', 'feriados', 'ferias_servidor', 'fichas_financeiras', 'folhas_pagamento',
      'frequencia_arquivos', 'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'historico_funcional',
      'horarios_jornada', 'itens_ficha_financeira', 'itens_retorno_bancario', 'justificativas_ponto',
      'lancamentos_banco_horas', 'lancamentos_folha', 'licencas_afastamentos', 'lotacoes', 'memorandos_lotacao',
      'nomeacoes_chefe_unidade', 'ocorrencias_servidor', 'parametros_folha', 'pensoes_alimenticias',
      'portarias_servidor', 'pre_cadastros', 'provimentos', 'regimes_trabalho', 'registros_ponto', 'remessas_bancarias',
      'retornos_bancarios', 'rubricas', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tabela_inss', 'tabela_irrf', 'tipos_abono', 'viagens_diarias',
      'vinculos_funcionais', 'vinculos_servidor']
  LOOP
    IF public.lancamento_modulos_tabela(t) IS NULL THEN
      RAISE EXCEPTION 'lançamento por setor: % está na lista de triggers e não em lancamento_modulos_tabela', t;
    END IF;
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'lançamento por setor: tabela % não existe neste banco; pulada', t;
      CONTINUE;
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS zz_exigir_setor ON public.%I', t);
    EXECUTE format('CREATE TRIGGER zz_exigir_setor BEFORE INSERT OR UPDATE OR DELETE ON public.%I '
                   'FOR EACH ROW EXECUTE FUNCTION public.exigir_setor()', t);
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- 6c. Invalidação do cache (por comando): o que muda o fundamento de alguém.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lotacoes', 'designacoes', 'cessoes', 'comissoes', 'comissoes_membros', 'setores_modulo',
                           'regra_lancamento', 'estrutura_organizacional'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'lançamento por setor: tabela % não existe neste banco; invalidação pulada', t;
      CONTINUE;
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS lancamento_cache_invalidar ON public.%I', t);
    EXECUTE format('CREATE TRIGGER lancamento_cache_invalidar AFTER INSERT OR UPDATE OR DELETE ON public.%I '
                   'FOR EACH STATEMENT EXECUTE FUNCTION public.lancamento_cache_invalidar()', t);
  END LOOP;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS lancamento_cache_invalidar ON public.profiles;
    CREATE TRIGGER lancamento_cache_invalidar AFTER INSERT OR DELETE OR UPDATE OF servidor_id, is_active ON public.profiles
      FOR EACH STATEMENT EXECUTE FUNCTION public.lancamento_cache_invalidar();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Privilégios (o dump do baseline não leva GRANT/REVOKE: o overlay/40 repete estas linhas)
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.lotacao_vigente(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unidade_e_superiores(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_modulos_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_lancamento(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_linha(text, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_cache_invalidar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor() FROM PUBLIC, anon, authenticated;
-- RPCs: só authenticated (a guarda no corpo exige usuário ativo; o saneamento, admin ou rh.auditoria.visualizar)
REVOKE EXECUTE ON FUNCTION public.meus_fundamentos_lancamento() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.meus_fundamentos_lancamento() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.saneamento_lancamento() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.saneamento_lancamento() TO authenticated;
-- as da E1 trocadas aqui mantêm o que tinham (CREATE OR REPLACE não mexe no ACL); repetidas para o estado só-migrações
REVOKE EXECUTE ON FUNCTION public.rh_exige_servidor_vinculado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_completar_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) TO authenticated;
