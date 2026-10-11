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
-- vinculado (profiles.servidor_id, premissa 7) e há um FUNDAMENTO vigente hoje (data_local(): o dia no fuso do órgão):
--   lotacao          lotação ativa e vigente do servidor (fora lotacao_externa) ou cessão de entrada com unidade no
--                    órgão (premissa 4) numa unidade que é setor de M (setores_modulo; com inclui_subordinadas, também
--                    as unidades abaixo dela na estrutura). Não vale a lançada pelo próprio servidor
--                    (created_by_servidor_id = ele; nulo = legado, vale)
--   designacao       designação aprovada, ativa, vigente e com ato (número e data) para uma unidade do setor de M, com
--                    aprovado_por preenchido, e o aprovador não é o próprio designado nem quem lançou a designação
--                    (premissa 5: soma à lotação; a checagem é na função, não há CHECK nas linhas antigas)
--   (comissão)       NÃO é fundamento na fase 1: comissão vale só no seu objeto (premissa 6: campanha, contrato,
--                    processo), checado por linha na fase 2, quando as tabelas desses módulos entrarem na regra. Nenhuma
--                    tabela do RH é objeto de comissão; o cadastro (comissoes, comissoes_membros) já fica pronto
--   autoatendimento  o servidor grava o que é dele, ainda sem decisão (ver fundamento_linha)
--   chefia           a chefia decide a etapa do subordinado na frequência (ver fundamento_linha)
--   sistema          sem auth.uid() e fora dos papéis da API: job, Edge Function e service role
--   anonimo          papel anon (formulário público; as tabelas da regra não aceitam anon pela RLS)
--   negado_sem_login (papel authenticated sem usuário), negado_sem_servidor, negado_setor: sem fundamento
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
--   2. permissão rh.comissoes.gerenciar (catálogo; só o papel admin até o órgão decidir) e carga de regra_lancamento
--   3. audit_logs.fundamento (+ índice parcial das linhas negadas)
--   4. funções: data_local, lotacao_vigente, unidade_e_superiores, lancamento_modulos_tabela, fundamento_lancamento (cache por
--      transação), fundamento_tabela (cache por tabela), fundamento_linha (autoatendimento e chefia),
--      meus_fundamentos_lancamento (RPC de consulta), saneamento_lancamento (RPC do relatório),
--      rh_exige_servidor_vinculado (lê a regra), lancamento_cache_invalidar
--   5. trilha: trilha_contexto (unidade da lotação vigente), trilha_completar_contexto, fn_audit_trigger v3 (grava o
--      fundamento), fixar_autoria (sem a checagem de vínculo, que passa ao trigger da regra), registrar_evento,
--      log_audit (unidade da lotação vigente)
--   6. exigir_setor() e os triggers zz_exigir_setor (BEFORE INSERT OR UPDATE OR DELETE, por linha) e
--      zz_exigir_setor_fim (AFTER, por comando) nas 79 tabelas do RH; autoria e trilha nas 4 tabelas novas; o modo
--      exigir só por migração (regra_lancamento_proteger_exigir); membros de comissão (comissoes_membros_validar);
--      invalidação do cache
--   7. privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
--
-- Códigos de erro: RHS01 = lançamento recusado pela regra de setor (modo exigir). A mensagem diz "seu login não tem
-- servidor vinculado" ou "você não está lotado nem designado no setor de <nome do módulo>"; DETAIL traz
-- `via=<via>; tabela=<tabela>`. 42501 = membro de comissão recusado (comissoes_membros_validar) ou modo exigir pela API.
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
  inclui_subordinadas boolean NOT NULL DEFAULT false,
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
-- Padrão false: incluir as subordinadas é decisão explícita (uma unidade grande não vira setor inteira por omissão).
ALTER TABLE public.setores_modulo ALTER COLUMN inclui_subordinadas SET DEFAULT false;
COMMENT ON COLUMN public.setores_modulo.inclui_subordinadas IS
  'true: as unidades abaixo desta na estrutura (superior_id) também são o setor do módulo (padrão false)';

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

-- Comissões: membro de comissão vigente, com ato, será fundamento só no objeto dela (premissa 6, fase 2).
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
-- Comissão de inventário, licitação ou fiscalização de contrato existe para um objeto (premissa 6); só `outra` fica sem.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.comissoes'::regclass
                  AND conname = 'comissoes_objeto_obrigatorio_check') THEN
    ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_objeto_obrigatorio_check
      CHECK (tipo = 'outra' OR (objeto_tipo IS NOT NULL AND objeto_id IS NOT NULL));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_comissoes_modulo ON public.comissoes USING btree (modulo);
COMMENT ON TABLE public.comissoes IS
  'Comissões com ato, período e motivo (inventário, licitação, fiscalização de contrato...). Membro de comissão vale só no objeto dela (premissa 6, fase 2); na fase 1 a comissão é só cadastro, não fundamento.';

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
-- carga por action_type a dá ao papel `user`). Só o papel admin até o órgão decidir quem cadastra (a linha do manager,
-- se uma versão anterior desta migração a criou, sai).
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.comissoes.gerenciar', 'Gerenciar Comissões',
   'Cadastra comissões (ato, período, motivo, objeto) e seus membros; membro de comissão vigente é fundamento de lançamento no módulo da comissão',
   'Comissões', 'gerenciar', 512)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
VALUES ('admin', 'rh.comissoes.gerenciar')
ON CONFLICT (role, permission) DO NOTHING;
DELETE FROM public.role_permissions WHERE role = 'manager' AND permission = 'rh.comissoes.gerenciar';

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
-- Relatório "quem seria bloqueado": as linhas negadas de um módulo na ordem da trilha. Parcial: só as negadas. Criado
-- sem CONCURRENTLY (a migração roda numa transação; nenhuma linha tem fundamento ainda, então o índice nasce vazio e o
-- custo é a varredura de audit_logs, pequena hoje). Se a trilha crescer antes do merge, criar à parte com CONCURRENTLY.
CREATE INDEX IF NOT EXISTS idx_audit_logs_fundamento_negado ON public.audit_logs USING btree (module_name, sequencia DESC)
  WHERE ((fundamento ->> 'permitido') = 'false');

-- ----------------------------------------------------------------------------
-- 4. Funções da regra
-- ----------------------------------------------------------------------------
-- Todas plpgsql (plano em cache: os triggers as chamam por linha), search_path fixo e sem EXECUTE para a API, exceto
-- meus_fundamentos_lancamento e saneamento_lancamento (RPCs; bloco 7).

-- Data de hoje no fuso do órgão. CURRENT_DATE segue o TimeZone da sessão, que no Supabase é UTC: de 20h/21h em diante
-- (no Brasil) já seria "amanhã" e uma designação que termina hoje deixaria de valer à noite. O fuso vem da variável
-- app.fuso_horario do banco, definida por instância (ALTER DATABASE <banco> SET app.fuso_horario = '<zona IANA>', ver
-- docs/BANCO_DE_DADOS.md); sem ela, ou com nome inválido, America/Sao_Paulo. Usa now() (início da transação), como
-- CURRENT_DATE: estável na transação, então o cache por transação continua certo.
CREATE OR REPLACE FUNCTION public.data_local()
RETURNS date LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE
  v_fuso text := nullif(btrim(current_setting('app.fuso_horario', true)), '');
BEGIN
  IF v_fuso IS NOT NULL THEN
    BEGIN
      RETURN (now() AT TIME ZONE v_fuso)::date;
    EXCEPTION WHEN invalid_parameter_value THEN
      NULL;   -- fuso inválido: cai no padrão (não derruba a gravação)
    END;
  END IF;
  RETURN (now() AT TIME ZONE 'America/Sao_Paulo')::date;
END;
$$;
COMMENT ON FUNCTION public.data_local() IS
  'Data de hoje no fuso do órgão (app.fuso_horario do banco; padrão America/Sao_Paulo). Usada pela regra de setor no lugar de CURRENT_DATE';

-- Lotação vigente do servidor na data (premissa 4): lotação ATIVA cujo período cobre a data, fora `lotacao_externa`;
-- e cessão de ENTRADA ativa, com unidade no órgão (unidade_idjuv_id) e período que cobre a data. Lotação antes de cessão,
-- a mais recente primeiro. Para datas passadas vale o mesmo critério (a lotação que está ativa hoje); a lotação histórica
-- fica para a coleta offline da fase 2. created_by_servidor_id (autoria E1) diz quem lançou: o fundamento ignora a
-- lançada pelo próprio servidor (autoconcedida); a trilha e o saneamento usam todas.
-- Assinatura nova (coluna created_by_servidor_id e p_data DEFAULT NULL = data_local()): o DROP troca a versão anterior
-- desta migração, se houver (nenhuma função depende dela por catálogo; as chamadas plpgsql são resolvidas na execução).
DROP FUNCTION IF EXISTS public.lotacao_vigente(uuid, date);
CREATE FUNCTION public.lotacao_vigente(p_servidor_id uuid, p_data date DEFAULT NULL)
RETURNS TABLE (origem text, registro_id uuid, unidade_id uuid, tipo text, data_inicio date, data_fim date,
               ato_tipo text, ato_numero text, ato_data date, ato_doe_numero text, ato_doe_data date,
               created_by_servidor_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date := coalesce(p_data, public.data_local());
BEGIN
  RETURN QUERY
  SELECT x.o, x.rid, x.uni, x.tp, x.di, x.df, x.a_tipo, x.a_num, x.a_data, x.a_doe_num, x.a_doe_data, x.autor
    FROM (
      SELECT 'lotacao'::text AS o, l.id AS rid, l.unidade_id AS uni, coalesce(l.tipo_lotacao::text, 'lotacao_interna') AS tp,
             l.data_inicio AS di, l.data_fim AS df, l.ato_tipo AS a_tipo, l.ato_numero AS a_num, l.ato_data AS a_data,
             l.ato_doe_numero AS a_doe_num, l.ato_doe_data AS a_doe_data, l.created_by_servidor_id AS autor
        FROM public.lotacoes l
       WHERE l.servidor_id = p_servidor_id AND l.ativo IS TRUE
         AND l.data_inicio <= d AND (l.data_fim IS NULL OR l.data_fim >= d)
         AND l.tipo_lotacao IS DISTINCT FROM 'lotacao_externa'
         AND EXISTS (SELECT 1 FROM public.estrutura_organizacional e WHERE e.id = l.unidade_id)
      UNION ALL
      SELECT 'cessao'::text, c.id, c.unidade_idjuv_id, 'cessao_entrada', c.data_inicio, coalesce(c.data_retorno, c.data_fim),
             c.ato_tipo, c.ato_numero, c.ato_data, c.ato_doe_numero, c.ato_doe_data, c.created_by_servidor_id
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
  'Lotação ativa vigente do servidor na data (padrão: data_local(); fora lotacao_externa) e cessão de entrada com unidade no órgão; lotação primeiro; created_by_servidor_id = quem lançou';

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

-- Fundamento do login atual para lançar nos módulos informados, hoje (data_local()). Devolve jsonb (chaves nulas
-- omitidas):
--   permitido (boolean), via (lotacao | designacao | sistema | anonimo | negado_sem_login | negado_sem_servidor |
--   negado_setor), modo (o mais restritivo entre os módulos), modulos (os informados, sem repetição), modulo (o do
--   setor que deu o fundamento; nos negados, o primeiro), servidor_id, data, unidade_id (lotação/cessão: a unidade;
--   designação: o destino; negado_setor: a unidade da lotação vigente, se houver), setor_unidade_id (a unidade de
--   setores_modulo que casou), lotacao_id | cessao_id | designacao_id e ato {tipo, numero, data, doe_numero, doe_data}.
-- Ordem: lotação, designação; dentro de cada via, o módulo na ordem informada. Sem atalho para o papel admin.
-- Fundamento autoconcedido não conta: lotação ou cessão lançada pelo próprio servidor (created_by_servidor_id = ele;
-- nulo = legado anterior à autoria, conta); designação sem aprovado_por, ou aprovada pelo próprio designado ou por quem
-- a lançou. Comissão não é fundamento na fase 1 (vale só no objeto, premissa 6: fase 2).
-- Sem auth.uid(): o papel anon é `anonimo` (formulário público); authenticated sem usuário é `negado_sem_login`;
-- qualquer outro papel (service_role, postgres, job) é `sistema`.
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
  v_papel_sessao text := coalesce(current_setting('role', true), 'none');
  c jsonb;
  v_uid uuid;
  v_srv uuid;
  v_data date := public.data_local();
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
  v_chave := coalesce(auth.uid()::text, '-') || '|' || v_papel_sessao || '|'
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
    f := CASE v_papel_sessao
           WHEN 'anon' THEN jsonb_build_object('permitido', true, 'via', 'anonimo')
           WHEN 'authenticated' THEN jsonb_build_object('permitido', false, 'via', 'negado_sem_login', 'modulo', v_mods[1])
           ELSE jsonb_build_object('permitido', true, 'via', 'sistema')
         END;
  ELSIF v_srv IS NULL THEN
    f := jsonb_build_object('permitido', false, 'via', 'negado_sem_servidor', 'modulo', v_mods[1]);
  ELSE
    -- 1. lotação (ou cessão de entrada) vigente numa unidade do setor, não lançada pelo próprio servidor
    SELECT lv.origem, lv.registro_id, lv.unidade_id, sm.unidade_id AS setor_id, sm.modulo::text AS modulo,
           lv.ato_tipo, lv.ato_numero, lv.ato_data, lv.ato_doe_numero, lv.ato_doe_data
      INTO r
      FROM public.lotacao_vigente(v_srv, v_data) lv
      JOIN public.setores_modulo sm
        ON sm.ativo AND sm.modulo::text = ANY (v_mods)
       AND (sm.unidade_id = lv.unidade_id
            OR (sm.inclui_subordinadas AND sm.unidade_id = ANY (public.unidade_e_superiores(lv.unidade_id))))
     WHERE lv.created_by_servidor_id IS DISTINCT FROM v_srv
     ORDER BY array_position(v_mods, sm.modulo::text), (lv.origem = 'cessao'), lv.data_inicio DESC
     LIMIT 1;
    IF FOUND THEN
      f := jsonb_build_object('permitido', true, 'via', 'lotacao', 'modulo', r.modulo, 'unidade_id', r.unidade_id,
                              'setor_unidade_id', r.setor_id,
                              CASE WHEN r.origem = 'cessao' THEN 'cessao_id' ELSE 'lotacao_id' END, r.registro_id,
                              'ato', nullif(jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)), '{}'::jsonb));
    ELSE
      -- 2. designação aprovada (por outra pessoa), ativa, vigente e com ato para uma unidade do setor
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
         AND d.aprovado_por IS NOT NULL AND d.aprovado_por IS DISTINCT FROM d.created_by
         AND d.aprovado_por <> v_uid
         AND NOT EXISTS (SELECT 1 FROM public.profiles pa WHERE pa.id = d.aprovado_por AND pa.servidor_id = d.servidor_id)
       ORDER BY array_position(v_mods, sm.modulo::text), d.data_inicio DESC
       LIMIT 1;
      IF FOUND THEN
        f := jsonb_build_object('permitido', true, 'via', 'designacao', 'modulo', r.modulo, 'unidade_id', r.unidade_destino_id,
                                'setor_unidade_id', r.setor_id, 'designacao_id', r.id,
                                'ato', jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                  'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)));
      ELSE
        SELECT lv.unidade_id INTO v_unid FROM public.lotacao_vigente(v_srv, v_data) lv LIMIT 1;
        f := jsonb_build_object('permitido', false, 'via', 'negado_setor', 'modulo', v_mods[1], 'unidade_id', v_unid);
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
  'Fundamento do login atual para lançar nos módulos (lotação, designação, sistema, anônimo ou negado), com o modo da regra; cache por transação';

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
--   autoatendimento — INSERT do PEDIDO do próprio servidor, ainda sem decisão, nas tabelas em que a RLS deixa o dono
--     inserir (;insere_proprio no mapa): solicitacoes_abono (servidor_id = o do login; status pendente e
--     aprovado_chefia_*, aprovado_rh_* e motivo_rejeicao nulos), documentos_requerimento_servidor (servidor_id = o do
--     login; status pendente, arquivo_assinado_url e data_upload_assinado nulos), solicitacoes_ajuste_ponto
--     (;posse=usuario: servidor_id = auth.uid(); status pendente, aprovador_id, data_aprovacao e observacao_aprovador
--     nulos) e justificativas_ponto (;pai=registros_ponto: o ponto é do servidor do login; mesmas colunas do ajuste).
--     O pedido que já entra decidido (o admin, que tem a isenção do forcar_campos_iniciais por permissão) não é
--     autoatendimento. E a assinatura da própria frequência: UPDATE de frequencia_fechamento do próprio servidor que só
--     muda assinado_servidor/assinado_servidor_em (validar_etapa_frequencia já garante que só o dono assina).
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
  v_decisao text[];
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
    v_decisao := CASE p_tabela
      WHEN 'solicitacoes_abono' THEN ARRAY['aprovado_chefia_por', 'aprovado_chefia_em', 'aprovado_rh_por', 'aprovado_rh_em',
                                           'motivo_rejeicao']
      WHEN 'documentos_requerimento_servidor' THEN ARRAY['arquivo_assinado_url', 'data_upload_assinado']
      WHEN 'solicitacoes_ajuste_ponto' THEN ARRAY['aprovador_id', 'data_aprovacao', 'observacao_aprovador']
      WHEN 'justificativas_ponto' THEN ARRAY['aprovador_id', 'data_aprovacao', 'observacao_aprovador']
    END;
    IF v_decisao IS NOT NULL
       AND p_novo ->> 'status' = 'pendente'
       AND NOT EXISTS (SELECT 1 FROM unnest(v_decisao) AS k WHERE p_novo ->> k IS NOT NULL)
       AND ((p_tabela IN ('solicitacoes_abono', 'documentos_requerimento_servidor') AND (p_novo ->> 'servidor_id')::uuid = v_srv)
            OR (p_tabela = 'solicitacoes_ajuste_ponto' AND (p_novo ->> 'servidor_id')::uuid = v_uid)
            OR (p_tabela = 'justificativas_ponto' AND EXISTS (
                  SELECT 1 FROM public.registros_ponto rp
                   WHERE rp.id = (p_novo ->> 'registro_ponto_id')::uuid AND rp.servidor_id = v_srv))) THEN
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
  RETURN jsonb_build_object('permitido', true, 'via', v_via, 'modulo', 'rh', 'servidor_id', v_srv, 'data', public.data_local());
END;
$$;

-- RPC de consulta (o front mostra "somente consulta" e desabilita os botões): uma linha por módulo do enum (ou só os de
-- p_modulos, na ordem do enum), com o modo da regra e o fundamento do login atual hoje. `permitido` é o fundamento de
-- setor (independe do modo); `bloqueado` = modo exigir sem fundamento. Autoatendimento e chefia dependem da linha e não
-- aparecem aqui: continuam valendo mesmo com bloqueado = true (a tela do próprio servidor e a de aprovação da chefia não
-- devem ser bloqueadas por isto). comissao_id fica sempre nulo na fase 1 (comissão não é fundamento; coluna mantida
-- para a fase 2). Assinatura nova (p_modulos com padrão NULL; a chamada sem argumento continua valendo): o DROP tira a
-- versão sem argumento de uma aplicação anterior desta migração.
DROP FUNCTION IF EXISTS public.meus_fundamentos_lancamento();
CREATE OR REPLACE FUNCTION public.meus_fundamentos_lancamento(p_modulos public.app_module[] DEFAULT NULL)
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
  FOR m IN SELECT e::text FROM unnest(enum_range(NULL::public.app_module)) AS e
            WHERE p_modulos IS NULL OR e = ANY (p_modulos) LOOP
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
COMMENT ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) IS
  'Por módulo (todos, ou os de p_modulos): modo da regra de lançamento, se o login tem fundamento de setor hoje (via, unidade, ato) e se está bloqueado (exigir sem fundamento)';

-- Relatório de saneamento (fase 1, passo 1 da transição): servidores ativos (ativo e situação fora de exonerado,
-- aposentado, falecido e inativo) com pelo menos um problema: sem login vinculado (nenhum perfil com servidor_id), sem
-- lotação vigente (lotacao_vigente vazia), com servidores.unidade_atual_id diferente da unidade da lotação vigente, ou
-- com fundamento autoconcedido (lotação ou cessão vigente lançada pelo próprio servidor, ou designação aprovada e
-- vigente aprovada por ele mesmo ou por quem a lançou: a regra ignora esses registros).
-- Sem CPF nem outro dado pessoal além de nome e matrícula. Admin, ou módulo rh com rh.auditoria.visualizar.
CREATE OR REPLACE FUNCTION public.saneamento_lancamento()
RETURNS TABLE (servidor_id uuid, nome text, matricula text, situacao text, tem_login boolean, login_ativo boolean,
               lotacao_unidade_id uuid, lotacao_unidade_nome text, unidade_atual_id uuid, unidade_atual_nome text,
               problemas text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_hoje date := public.data_local();
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
                    THEN 'lotacao_divergente' END,
               CASE WHEN EXISTS (SELECT 1 FROM public.lotacao_vigente(s.id, v_hoje) a WHERE a.created_by_servidor_id = s.id)
                      OR EXISTS (SELECT 1 FROM public.designacoes d
                                  WHERE d.servidor_id = s.id AND d.status = 'aprovada' AND d.ativo IS NOT FALSE
                                    AND d.data_inicio <= v_hoje AND (d.data_fim IS NULL OR d.data_fim >= v_hoje)
                                    AND d.aprovado_por IS NOT NULL
                                    AND (d.aprovado_por = d.created_by
                                         OR EXISTS (SELECT 1 FROM public.profiles pa
                                                     WHERE pa.id = d.aprovado_por AND pa.servidor_id = s.id)))
                    THEN 'fundamento_autoconcedido' END], NULL) AS probs
        FROM public.servidores s
        CROSS JOIN LATERAL (
          SELECT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.servidor_id = s.id) AS tem,
                 EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.servidor_id = s.id AND pr.is_active) AS ativo_login) p
        LEFT JOIN LATERAL (SELECT v.unidade_id FROM public.lotacao_vigente(s.id, v_hoje) v LIMIT 1) lv ON true
       WHERE s.ativo IS NOT FALSE AND s.situacao::text NOT IN ('exonerado', 'aposentado', 'falecido', 'inativo')
    ) x
    LEFT JOIN public.estrutura_organizacional el ON el.id = x.luni
    LEFT JOIN public.estrutura_organizacional ea ON ea.id = x.uatual
   WHERE cardinality(x.probs) > 0
   ORDER BY x.snome;
END;
$$;
COMMENT ON FUNCTION public.saneamento_lancamento() IS
  'Servidores ativos sem login vinculado, sem lotação vigente, com unidade_atual_id divergente da lotação ou com fundamento autoconcedido (sem CPF)';

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
-- fundamento nulo. Gravação em cascata de uma gravação da regra já checada (marca lancamento.cadeia de exigir_setor,
-- ver bloco 6) não é checada de novo; a linha leva o fundamento de quem disparou, com em_cascata = true (o relatório de
-- bloqueios deve ignorá-la). Cascata vinda de tabela fora da regra (ex.: estrutura_organizacional -> lotacoes) é
-- checada e gravada como qualquer outra. Limite: na cascata de FK (ON DELETE CASCADE/SET NULL) o Postgres enfileira os
-- AFTER da linha filha no comando de fora, depois do fim dele; a linha filha da trilha sai sem em_cascata e com o
-- fundamento calculado para a tabela filha (mesmo login; na fase 1, mesmo módulo rh). A unidade da linha
-- (org_unit_id) é a do fundamento usado; sem ela, a da lotação vigente.
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
    ELSIF pg_trigger_depth() > 1 AND current_setting('lancamento.cadeia', true) = 'on' THEN
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

-- log_audit: corpo da E2 (20261011000200; o mesmo do supabase/baseline/overlay/18_funcoes_rpc.sql) com uma mudança:
-- org_unit_id passa a ser a unidade da lotação vigente do servidor do login, como no resto da trilha (antes: a unidade
-- principal de user_org_units, que é escopo de acesso). Sem servidor ou sem lotação: nula.
CREATE OR REPLACE FUNCTION public.log_audit(_action audit_action, _entity_type character varying DEFAULT NULL::character varying, _entity_id uuid DEFAULT NULL::uuid, _module_name character varying DEFAULT NULL::character varying, _before_data jsonb DEFAULT NULL::jsonb, _after_data jsonb DEFAULT NULL::jsonb, _description text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
  _meta jsonb;
BEGIN
  -- perfil bloqueado/inexistente não grava (a sessão do Auth dele pode continuar válida). Sem usuário
  -- (service role, ou registrar_denuncia_publica chamada por anon) segue como antes.
  IF auth.uid() IS NOT NULL AND NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Usuário inativo' USING ERRCODE = '42501';
  END IF;
  IF lower(btrim(coalesce(_module_name, ''))) = 'rh' THEN
    IF _action::text NOT IN ('view', 'export', 'download') THEN
      RAISE EXCEPTION 'log_audit: no módulo rh só view, export e download (lançamentos entram pela trilha do banco)'
        USING ERRCODE = '22023';
    END IF;
    IF _before_data IS NOT NULL OR _after_data IS NOT NULL THEN
      RAISE EXCEPTION 'log_audit: no módulo rh a linha não leva antes/depois' USING ERRCODE = '22023';
    END IF;
  END IF;
  -- linha de arquivo do Storage (entity_type storage.<bucket>) só vem do trigger trilha_storage (E2)
  IF lower(btrim(coalesce(_entity_type, ''))) LIKE 'storage.%' THEN
    RAISE EXCEPTION 'log_audit: entity_type storage.* é gravado só pelo banco (trilha do Storage)' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_before_data::text, '')) > 32768 OR length(coalesce(_after_data::text, '')) > 32768
     OR length(coalesce(_metadata::text, '')) > 32768 THEN
    RAISE EXCEPTION 'log_audit: antes, depois e metadados têm limite de 32 KB cada' USING ERRCODE = '22023';
  END IF;
  _meta := CASE WHEN _metadata IS NULL THEN '{}'::jsonb
                WHEN jsonb_typeof(_metadata) = 'object' THEN _metadata
                ELSE jsonb_build_object('valor', _metadata) END;
  _meta := (_meta - ARRAY['trigger', 'operation', 'table', 'registrar_evento', 'fonte', 'servidor_alvo_id'])
           || jsonb_build_object('fonte', 'log_audit');

  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  -- unidade da lotação vigente do servidor do login (como o resto da trilha, regra de setor 20261011020000); antes,
  -- a unidade principal de user_org_units (escopo de acesso, não onde a pessoa trabalha)
  SELECT lv.unidade_id INTO _user_org_unit
    FROM public.profiles p CROSS JOIN LATERAL public.lotacao_vigente(p.servidor_id) lv
   WHERE p.id = auth.uid() AND p.servidor_id IS NOT NULL
   LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _meta,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$function$;

-- ----------------------------------------------------------------------------
-- 6. Onde a regra roda
-- ----------------------------------------------------------------------------
-- exigir_setor(): fundamento da tabela (em cache na transação); modo exigir e sem fundamento de setor: tenta o da linha
-- (autoatendimento/chefia) e recusa com RHS01. Modo registrar: só aquece o cache (a trilha, fn_audit_trigger, grava o
-- fundamento) e nunca recusa. A origem sistema/anonimo passa (fundamento_lancamento devolve permitido).
-- Cascata: a gravação de nível 1 (pg_trigger_depth() = 1, o comando que a API ou a RPC mandou) aceita deixa a marca
-- lancamento.cadeia = 'on' na transação, e zz_exigir_setor_fim (AFTER, por comando, nível 1) a apaga no fim do comando.
-- Gravação de nível > 1 com a marca descende de uma gravação já checada (cascata de FK, ex.: comissão apagada levando os
-- membros; trigger AFTER que atualiza outra tabela, ex.: licença ativa mudando a situação do servidor) e não é checada
-- de novo. Sem a marca (cascata que começa numa tabela
-- fora da regra, ex.: estrutura_organizacional -> lotacoes, ou trigger BEFORE que grava antes da checagem da linha que o
-- disparou) é checada como qualquer gravação: negada, vai ao relatório ou é recusada.
-- O nome começa com "zz_e": roda depois dos outros BEFORE (trg_validar_etapa_frequencia já validou a etapa;
-- trg_forcar_campos_iniciais já zerou a decisão do pedido) e antes de zz_fixar_autoria.
-- Mensagem: o nome do(s) módulo(s) vem de module_settings.display_name (sem ele, o código); a tabela vai no DETAIL.
CREATE OR REPLACE FUNCTION public.exigir_setor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f jsonb;
  v_setor text;
  v_via text;
  v_det text;
BEGIN
  IF pg_trigger_depth() > 1 AND current_setting('lancamento.cadeia', true) = 'on' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  f := public.fundamento_tabela(TG_TABLE_NAME);
  IF f IS NULL OR f ->> 'modo' IS DISTINCT FROM 'exigir' OR (f ->> 'permitido') = 'true'
     OR (TG_TABLE_NAME IN ('solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto',
                           'frequencia_fechamento', 'documentos_requerimento_servidor')
         AND public.fundamento_linha(TG_TABLE_NAME, TG_OP,
               CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
               CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END) IS NOT NULL) THEN
    IF pg_trigger_depth() = 1 AND current_setting('lancamento.cadeia', true) IS DISTINCT FROM 'on' THEN
      PERFORM set_config('lancamento.cadeia', 'on', true);
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  SELECT string_agg(coalesce(nome.n, x.m), ' ou ' ORDER BY x.o) INTO v_setor
    FROM jsonb_array_elements_text(f -> 'modulos') WITH ORDINALITY AS x(m, o)
    LEFT JOIN LATERAL (SELECT nullif(btrim(ms.display_name), '') AS n FROM public.module_settings ms
                        WHERE ms.module_code = x.m LIMIT 1) nome ON true;
  v_via := coalesce(f ->> 'via', 'negado_setor');
  v_det := format('via=%s; tabela=%s', v_via, TG_TABLE_NAME);
  IF v_via = 'negado_sem_servidor' THEN
    RAISE EXCEPTION 'Seu login não tem servidor vinculado: lançamento no setor de % recusado', v_setor
      USING ERRCODE = 'RHS01', DETAIL = v_det,
            HINT = 'Sem servidor vinculado, o login só consulta. Peça ao administrador o vínculo do seu servidor ao login.';
  ELSIF v_via = 'negado_sem_login' THEN
    RAISE EXCEPTION 'Sessão sem usuário identificado: lançamento no setor de % recusado', v_setor
      USING ERRCODE = 'RHS01', DETAIL = v_det, HINT = 'Entre de novo no sistema.';
  END IF;
  RAISE EXCEPTION 'Você não está lotado nem designado no setor de %: lançamento recusado', v_setor
    USING ERRCODE = 'RHS01', DETAIL = v_det,
          HINT = 'Vale a lotação ativa no setor (não lançada por você) ou a designação aprovada por outra pessoa, vigente e com ato.';
END;
$$;

-- Fim do comando de nível 1 numa tabela da regra: apaga a marca da cascata (ver exigir_setor).
CREATE OR REPLACE FUNCTION public.exigir_setor_fim()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() = 1 AND current_setting('lancamento.cadeia', true) = 'on' THEN
    PERFORM set_config('lancamento.cadeia', '', true);
  END IF;
  RETURN NULL;
END;
$$;

-- O modo exigir só entra por migração (spec: "modo exigir, módulo a módulo, cada um numa migração pequena"): com usuário
-- na sessão (API, inclusive o admin), INSERT ou UPDATE que leva um módulo a exigir é recusado (42501). Sair de exigir
-- (voltar a registrar ou desligado) continua com o admin: é a saída de emergência. Migração e service role (sem
-- auth.uid()) passam.
CREATE OR REPLACE FUNCTION public.regra_lancamento_proteger_exigir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.modo = 'exigir' AND auth.uid() IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.modo IS DISTINCT FROM 'exigir' OR OLD.modulo IS DISTINCT FROM NEW.modulo) THEN
    RAISE EXCEPTION 'O modo exigir da regra de lançamento (módulo %) só entra por migração', NEW.modulo
      USING ERRCODE = '42501',
            HINT = 'Pela tela, os modos são desligado e registrar; exigir é ligado por migração, módulo a módulo.';
  END IF;
  RETURN NEW;
END;
$$;

-- Membros de comissão: quem cadastrou a comissão não é membro dela, e ninguém (exceto o papel admin) se inclui numa
-- comissão (autoconcessão; seg. 1 da revisão). Vale no INSERT e no UPDATE que troca o servidor ou a comissão.
CREATE OR REPLACE FUNCTION public.comissoes_membros_validar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_criador uuid;
  v_meu uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.servidor_id IS NOT DISTINCT FROM OLD.servidor_id
     AND NEW.comissao_id IS NOT DISTINCT FROM OLD.comissao_id THEN
    RETURN NEW;
  END IF;
  SELECT co.created_by_servidor_id INTO v_criador FROM public.comissoes co WHERE co.id = NEW.comissao_id;
  IF v_criador IS NOT NULL AND NEW.servidor_id = v_criador THEN
    RAISE EXCEPTION 'Quem cadastrou a comissão não pode ser membro dela' USING ERRCODE = '42501';
  END IF;
  IF v_uid IS NOT NULL AND NOT public.is_admin_user(v_uid) THEN
    SELECT p.servidor_id INTO v_meu FROM public.profiles p WHERE p.id = v_uid;
    IF v_meu IS NOT NULL AND NEW.servidor_id = v_meu THEN
      RAISE EXCEPTION 'Você não pode se incluir numa comissão' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
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

-- O modo exigir só por migração; membros de comissão sem autoconcessão. Nomes "trg_": rodam antes dos zz_.
DROP TRIGGER IF EXISTS trg_regra_lancamento_exigir ON public.regra_lancamento;
CREATE TRIGGER trg_regra_lancamento_exigir BEFORE INSERT OR UPDATE ON public.regra_lancamento
  FOR EACH ROW EXECUTE FUNCTION public.regra_lancamento_proteger_exigir();
DROP TRIGGER IF EXISTS trg_comissoes_membros_validar ON public.comissoes_membros;
CREATE TRIGGER trg_comissoes_membros_validar BEFORE INSERT OR UPDATE ON public.comissoes_membros
  FOR EACH ROW EXECUTE FUNCTION public.comissoes_membros_validar();

-- 6b. zz_exigir_setor (por linha) e zz_exigir_setor_fim (por comando, apaga a marca da cascata) nas 79 tabelas do RH
-- (as 77 da E1 e as 2 de comissões). A tabela precisa estar em lancamento_modulos_tabela (senão a migração aborta: o
-- trigger rodaria sem módulo).
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
    EXECUTE format('DROP TRIGGER IF EXISTS zz_exigir_setor_fim ON public.%I', t);
    EXECUTE format('CREATE TRIGGER zz_exigir_setor_fim AFTER INSERT OR UPDATE OR DELETE ON public.%I '
                   'FOR EACH STATEMENT EXECUTE FUNCTION public.exigir_setor_fim()', t);
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
REVOKE EXECUTE ON FUNCTION public.data_local() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lotacao_vigente(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unidade_e_superiores(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_modulos_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_lancamento(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_linha(text, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_cache_invalidar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor_fim() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.regra_lancamento_proteger_exigir() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.comissoes_membros_validar() FROM PUBLIC, anon, authenticated;
-- RPCs: só authenticated (a guarda no corpo exige usuário ativo; o saneamento, admin ou rh.auditoria.visualizar)
REVOKE EXECUTE ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.saneamento_lancamento() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.saneamento_lancamento() TO authenticated;
-- as da E1 trocadas aqui mantêm o que tinham (CREATE OR REPLACE não mexe no ACL); repetidas para o estado só-migrações
REVOKE EXECUTE ON FUNCTION public.rh_exige_servidor_vinculado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_completar_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) TO authenticated;
