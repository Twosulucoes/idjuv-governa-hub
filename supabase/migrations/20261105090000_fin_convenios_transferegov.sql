-- ============================================================================
-- FINANCEIRO — Convênios federais do Transferegov, entrega T1 (espelho só leitura)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md
-- Fonte: docs/INTEGRACOES_EXTERNAS.md §4 (CSV diários do Transferegov, antigo Siconv).
--
--   fin_tg_propostas       propostas em que a instituição é a proponente (siconv_proposta).
--   fin_tg_emendas         emendas parlamentares de cada proposta: número, parlamentar ou comissão, valor (siconv_emenda).
--   fin_tg_convenios       instrumento de cada proposta: situação, vigência, prestação de contas, valores (siconv_convenio).
--   fin_tg_movimentos      empenhos e desembolsos federais de cada convênio (siconv_empenho, siconv_desembolso).
--   fin_tg_sincronizacoes  quando a rotina diária carregou, a data da carga do Transferegov e quantas linhas vieram.
--   fin_tg_carregar        troca o espelho inteiro numa transação. Só a service role executa (Edge Function
--                          transferegov, chamada pela rotina diária do GitHub Actions); ninguém grava pela API.
--
-- Leitura: módulo financeiro E financeiro.convenios.visualizar (permissão nova, concedida a quem tem
-- orcamento.visualizar). Ninguém escreve, altera ou apaga pela API: o dado é do governo federal.
-- Idempotente (IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE, DROP/CREATE de policies).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_tg_propostas (
  id_proposta bigint PRIMARY KEY,
  numero text NOT NULL,
  ano integer,
  data_proposta date,
  cnpj_proponente text NOT NULL CHECK (cnpj_proponente ~ '^[0-9]{14}$'),
  orgao_superior text,
  orgao text,
  modalidade text,
  objeto text,
  situacao text,
  situacao_projeto_basico text,
  inicio_vigencia date,
  fim_vigencia date,
  valor_global numeric(16,2),
  valor_repasse numeric(16,2),
  valor_contrapartida numeric(16,2),
  banco text,
  agencia text,
  conta text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_tg_propostas_ano ON public.fin_tg_propostas (ano DESC);
COMMENT ON TABLE public.fin_tg_propostas IS
  'Propostas do Transferegov (antigo Siconv) em que a instituição é a proponente. Espelho só leitura: grava só fin_tg_carregar (rotina diária).';

CREATE TABLE IF NOT EXISTS public.fin_tg_emendas (
  id_proposta bigint NOT NULL REFERENCES public.fin_tg_propostas(id_proposta) ON DELETE CASCADE,
  numero_emenda text NOT NULL,
  programa_emenda text,
  parlamentar text,
  tipo_parlamentar text,
  qualificacao_proponente text,
  impositiva boolean,
  cnpj_beneficiario text,
  valor_repasse_proposta numeric(16,2),
  valor_repasse_emenda numeric(16,2),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id_proposta, numero_emenda)
);
COMMENT ON TABLE public.fin_tg_emendas IS
  'Emendas parlamentares federais de cada proposta do Transferegov: número, parlamentar ou comissão, tipo e valor. Espelho só leitura.';

CREATE TABLE IF NOT EXISTS public.fin_tg_convenios (
  numero text PRIMARY KEY,
  id_proposta bigint NOT NULL REFERENCES public.fin_tg_propostas(id_proposta) ON DELETE CASCADE,
  situacao text,
  subsituacao text,
  situacao_publicacao text,
  instrumento_ativo boolean,
  assinado boolean,
  numero_processo text,
  ug_emitente text,
  data_assinatura date,
  data_publicacao date,
  inicio_vigencia date,
  fim_vigencia date,
  fim_vigencia_original date,
  data_limite_prestacao_contas date,
  dias_prestacao_contas integer,
  qtd_aditivos integer,
  qtd_prorrogacoes integer,
  valor_global numeric(16,2),
  valor_repasse numeric(16,2),
  valor_contrapartida numeric(16,2),
  valor_empenhado numeric(16,2),
  valor_desembolsado numeric(16,2),
  saldo_reman_tesouro numeric(16,2),
  saldo_reman_convenente numeric(16,2),
  rendimento_aplicacao numeric(16,2),
  ingresso_contrapartida numeric(16,2),
  saldo_conta numeric(16,2),
  valor_global_original numeric(16,2),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_tg_convenios_proposta ON public.fin_tg_convenios (id_proposta);
COMMENT ON TABLE public.fin_tg_convenios IS
  'Instrumento (convênio) de cada proposta do Transferegov. Antes da assinatura o número é provisório e assinado = false. Espelho só leitura.';

CREATE TABLE IF NOT EXISTS public.fin_tg_movimentos (
  tipo text NOT NULL CHECK (tipo IN ('empenho', 'desembolso')),
  id_origem bigint NOT NULL,
  numero_convenio text NOT NULL REFERENCES public.fin_tg_convenios(numero) ON DELETE CASCADE,
  numero text,
  data date,
  valor numeric(16,2),
  situacao text,
  descricao text,
  indicacao text,
  natureza_despesa text,
  ug_emitente text,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tipo, id_origem)
);
CREATE INDEX IF NOT EXISTS idx_fin_tg_movimentos_convenio ON public.fin_tg_movimentos (numero_convenio, data);
COMMENT ON TABLE public.fin_tg_movimentos IS
  'Empenhos e desembolsos federais de cada convênio do Transferegov. indicacao traz o texto da emenda no SIAFI (quem indicou). Espelho só leitura.';

CREATE TABLE IF NOT EXISTS public.fin_tg_sincronizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executada_em timestamptz NOT NULL DEFAULT now(),
  data_carga timestamptz,
  cnpj text NOT NULL CHECK (cnpj ~ '^[0-9]{14}$'),
  propostas integer NOT NULL DEFAULT 0,
  emendas integer NOT NULL DEFAULT 0,
  convenios integer NOT NULL DEFAULT 0,
  movimentos integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fin_tg_sincronizacoes_executada ON public.fin_tg_sincronizacoes (executada_em DESC);
COMMENT ON TABLE public.fin_tg_sincronizacoes IS
  'Cada carga da rotina diária do Transferegov: quando rodou, a data da carga do Transferegov e quantas linhas vieram.';

ALTER TABLE public.fin_tg_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_tg_emendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_tg_convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_tg_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_tg_sincronizacoes ENABLE ROW LEVEL SECURITY;

-- Só leitura pela API (o dump do schema não leva GRANT/REVOKE: o overlay 40 repete estas linhas)
REVOKE ALL ON public.fin_tg_propostas, public.fin_tg_emendas, public.fin_tg_convenios,
              public.fin_tg_movimentos, public.fin_tg_sincronizacoes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_tg_propostas, public.fin_tg_emendas, public.fin_tg_convenios,
              public.fin_tg_movimentos, public.fin_tg_sincronizacoes FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. fin_tg_carregar: troca o espelho numa transação
-- ----------------------------------------------------------------------------
-- p_dados: {propostas: [...], emendas: [...], convenios: [...], movimentos: [...]}, com as chaves iguais às
-- colunas das tabelas (datas AAAA-MM-DD, valores numéricos). Recusa (22023):
--   * CNPJ fora do formato ou diferente do cadastrado na Configuração do cliente (dados_oficiais, chave cnpj);
--   * proposta de outro proponente;
--   * lista de propostas vazia quando o espelho já tem propostas, sem p_forcar (protege contra arquivo lido errado).
CREATE OR REPLACE FUNCTION public.fin_tg_carregar(
  p_cnpj text,
  p_data_carga timestamptz,
  p_dados jsonb,
  p_forcar boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cadastrado text;
  v_propostas integer;
  v_emendas integer;
  v_convenios integer;
  v_movimentos integer;
BEGIN
  IF p_cnpj IS NULL OR p_cnpj !~ '^[0-9]{14}$' THEN
    RAISE EXCEPTION 'CNPJ inválido' USING ERRCODE = '22023';
  END IF;
  SELECT regexp_replace(valor, '\D', '', 'g') INTO v_cadastrado FROM public.dados_oficiais WHERE chave = 'cnpj';
  IF v_cadastrado IS DISTINCT FROM p_cnpj THEN
    RAISE EXCEPTION 'CNPJ diferente do cadastrado na Configuração do cliente' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_dados) <> 'object'
     OR jsonb_typeof(coalesce(p_dados->'propostas', '[]')) <> 'array'
     OR jsonb_typeof(coalesce(p_dados->'emendas', '[]')) <> 'array'
     OR jsonb_typeof(coalesce(p_dados->'convenios', '[]')) <> 'array'
     OR jsonb_typeof(coalesce(p_dados->'movimentos', '[]')) <> 'array' THEN
    RAISE EXCEPTION 'Dados em formato inesperado' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_dados->'propostas', '[]')) e
              WHERE e->>'cnpj_proponente' IS DISTINCT FROM p_cnpj) THEN
    RAISE EXCEPTION 'Proposta de outro proponente' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(coalesce(p_dados->'propostas', '[]')) = 0 AND NOT p_forcar
     AND EXISTS (SELECT 1 FROM public.fin_tg_propostas) THEN
    RAISE EXCEPTION 'Nenhuma proposta veio e o espelho tem propostas: confira a leitura ou use p_forcar' USING ERRCODE = '22023';
  END IF;

  -- O espelho inteiro é trocado: o que sumiu do Transferegov sai daqui também (filhas saem em cascata)
  DELETE FROM public.fin_tg_propostas;

  INSERT INTO public.fin_tg_propostas (
    id_proposta, numero, ano, data_proposta, cnpj_proponente, orgao_superior, orgao, modalidade, objeto, situacao,
    situacao_projeto_basico, inicio_vigencia, fim_vigencia, valor_global, valor_repasse, valor_contrapartida,
    banco, agencia, conta)
  SELECT id_proposta, numero, ano, data_proposta, cnpj_proponente, orgao_superior, orgao, modalidade, objeto, situacao,
         situacao_projeto_basico, inicio_vigencia, fim_vigencia, valor_global, valor_repasse, valor_contrapartida,
         banco, agencia, conta
    FROM jsonb_populate_recordset(NULL::public.fin_tg_propostas, coalesce(p_dados->'propostas', '[]'));
  GET DIAGNOSTICS v_propostas = ROW_COUNT;

  INSERT INTO public.fin_tg_emendas (
    id_proposta, numero_emenda, programa_emenda, parlamentar, tipo_parlamentar, qualificacao_proponente, impositiva,
    cnpj_beneficiario, valor_repasse_proposta, valor_repasse_emenda)
  SELECT id_proposta, numero_emenda, programa_emenda, parlamentar, tipo_parlamentar, qualificacao_proponente, impositiva,
         cnpj_beneficiario, valor_repasse_proposta, valor_repasse_emenda
    FROM jsonb_populate_recordset(NULL::public.fin_tg_emendas, coalesce(p_dados->'emendas', '[]'));
  GET DIAGNOSTICS v_emendas = ROW_COUNT;

  INSERT INTO public.fin_tg_convenios (
    numero, id_proposta, situacao, subsituacao, situacao_publicacao, instrumento_ativo, assinado, numero_processo,
    ug_emitente, data_assinatura, data_publicacao, inicio_vigencia, fim_vigencia, fim_vigencia_original,
    data_limite_prestacao_contas, dias_prestacao_contas, qtd_aditivos, qtd_prorrogacoes, valor_global, valor_repasse,
    valor_contrapartida, valor_empenhado, valor_desembolsado, saldo_reman_tesouro, saldo_reman_convenente,
    rendimento_aplicacao, ingresso_contrapartida, saldo_conta, valor_global_original)
  SELECT numero, id_proposta, situacao, subsituacao, situacao_publicacao, instrumento_ativo, assinado, numero_processo,
         ug_emitente, data_assinatura, data_publicacao, inicio_vigencia, fim_vigencia, fim_vigencia_original,
         data_limite_prestacao_contas, dias_prestacao_contas, qtd_aditivos, qtd_prorrogacoes, valor_global, valor_repasse,
         valor_contrapartida, valor_empenhado, valor_desembolsado, saldo_reman_tesouro, saldo_reman_convenente,
         rendimento_aplicacao, ingresso_contrapartida, saldo_conta, valor_global_original
    FROM jsonb_populate_recordset(NULL::public.fin_tg_convenios, coalesce(p_dados->'convenios', '[]'));
  GET DIAGNOSTICS v_convenios = ROW_COUNT;

  INSERT INTO public.fin_tg_movimentos (
    tipo, id_origem, numero_convenio, numero, data, valor, situacao, descricao, indicacao, natureza_despesa, ug_emitente)
  SELECT tipo, id_origem, numero_convenio, numero, data, valor, situacao, descricao, indicacao, natureza_despesa, ug_emitente
    FROM jsonb_populate_recordset(NULL::public.fin_tg_movimentos, coalesce(p_dados->'movimentos', '[]'));
  GET DIAGNOSTICS v_movimentos = ROW_COUNT;

  INSERT INTO public.fin_tg_sincronizacoes (data_carga, cnpj, propostas, emendas, convenios, movimentos)
  VALUES (p_data_carga, p_cnpj, v_propostas, v_emendas, v_convenios, v_movimentos);

  RETURN jsonb_build_object('propostas', v_propostas, 'emendas', v_emendas, 'convenios', v_convenios,
                            'movimentos', v_movimentos);
END;
$$;

COMMENT ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) IS
  'Troca o espelho do Transferegov (propostas, emendas, convênios e movimentos) numa transação. Só a service role executa.';

REVOKE ALL ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Permissão financeiro.convenios.visualizar, concedida a quem tem orcamento.visualizar
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('financeiro', 'financeiro.convenios.visualizar', 'Ver convênios federais (Transferegov)', 'Convênios', 'visualizar', 520)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, 'financeiro.convenios.visualizar'
  FROM public.role_permissions rp
 WHERE rp.permission = 'orcamento.visualizar'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, 'financeiro.convenios.visualizar', up.created_by
  FROM public.user_permissions up
 WHERE up.permission = 'orcamento.visualizar'
ON CONFLICT (user_id, permission) DO NOTHING;

UPDATE public.user_modules
   SET permissions = permissions || ARRAY['financeiro.convenios.visualizar']
 WHERE 'orcamento.visualizar' = ANY (permissions)
   AND NOT ('financeiro.convenios.visualizar' = ANY (permissions));

-- ----------------------------------------------------------------------------
-- 4. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- fin_tg_convenios  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_tg_convenios;
CREATE POLICY "rls_select" ON public.fin_tg_convenios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'));

-- fin_tg_emendas  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_tg_emendas;
CREATE POLICY "rls_select" ON public.fin_tg_emendas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'));

-- fin_tg_movimentos  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_tg_movimentos;
CREATE POLICY "rls_select" ON public.fin_tg_movimentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'));

-- fin_tg_propostas  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_tg_propostas;
CREATE POLICY "rls_select" ON public.fin_tg_propostas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'));

-- fin_tg_sincronizacoes  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_tg_sincronizacoes;
CREATE POLICY "rls_select" ON public.fin_tg_sincronizacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'));
