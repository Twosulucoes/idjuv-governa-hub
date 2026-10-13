-- ============================================================================
-- Workflow: modelos de fluxo (etapas e checklist) e dias úteis
-- ============================================================================
-- Spec (aprovada pelo dono em 2026-10-13): docs/superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md
-- Primeira migração do acompanhamento do SEI: o catálogo dos modelos de processo. As colunas novas de
-- processos_administrativos, o sigilo e as RPCs vêm nas migrações seguintes (20261013100100 e 20261013100200).
--
-- Vale nos DOIS estados do banco (do baseline e só pelas migrações). Idempotente: CREATE ... IF NOT EXISTS,
-- CREATE OR REPLACE, DROP POLICY IF EXISTS, ON CONFLICT DO NOTHING na carga.
--
-- Blocos:
--   1. tabelas processo_modelos, processo_modelo_etapas e processo_modelo_checklist, com RLS e policies (classe
--      permissao do mapa: o módulo workflow lê; escrita só com o módulo E workflow.admin; cópia literal do
--      supabase/baseline/rls/35_policies_geradas.sql)
--   2. fn_somar_dias_uteis(data, n): pula sábado, domingo e feriados
--   3. carga inicial dos 7 modelos (etapas, unidade, rótulo, prazo e checklist)
--   4. privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processo_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo_processo public.tipo_processo_administrativo NOT NULL DEFAULT 'outro',
  base_legal text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- unidade_sigla: sigla em estrutura_organizacional, ou @ORIGEM (unidade de quem abriu o processo) / @CHEFIA (chefia
-- dessa unidade); responsavel_rotulo: texto mostrado na trilha; prazo_dias_uteis nulo = etapa sem prazo
CREATE TABLE IF NOT EXISTS public.processo_modelo_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL REFERENCES public.processo_modelos(id) ON DELETE CASCADE,
  ordem integer NOT NULL CHECK (ordem >= 1),
  nome text NOT NULL,
  unidade_sigla text NOT NULL,
  responsavel_rotulo text,
  prazo_dias_uteis integer CHECK (prazo_dias_uteis IS NULL OR prazo_dias_uteis > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (modelo_id, ordem)
);

-- etapa_ordem: etapa em que o item deve estar marcado para sair dela; sem FK composta de propósito (a remoção de etapa
-- com processo nela é tratada nas RPCs do módulo, e a carga confere a consistência nos testes)
CREATE TABLE IF NOT EXISTS public.processo_modelo_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL REFERENCES public.processo_modelos(id) ON DELETE CASCADE,
  etapa_ordem integer NOT NULL CHECK (etapa_ordem >= 1),
  codigo text NOT NULL,
  descricao text NOT NULL,
  obrigatorio boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (modelo_id, codigo)
);

ALTER TABLE public.processo_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_modelo_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_modelo_checklist ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies (classe permissao; cópia literal do 35_policies_geradas.sql)
-- ----------------------------------------------------------------------------
-- processo_modelo_checklist  [permissao: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processo_modelo_checklist;
CREATE POLICY "rls_select" ON public.processo_modelo_checklist FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_modelo_checklist;
CREATE POLICY "rls_insert" ON public.processo_modelo_checklist FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_modelo_checklist;
CREATE POLICY "rls_update" ON public.processo_modelo_checklist FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_modelo_checklist;
CREATE POLICY "rls_delete" ON public.processo_modelo_checklist FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));

-- processo_modelo_etapas  [permissao: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processo_modelo_etapas;
CREATE POLICY "rls_select" ON public.processo_modelo_etapas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_modelo_etapas;
CREATE POLICY "rls_insert" ON public.processo_modelo_etapas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_modelo_etapas;
CREATE POLICY "rls_update" ON public.processo_modelo_etapas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_modelo_etapas;
CREATE POLICY "rls_delete" ON public.processo_modelo_etapas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));

-- processo_modelos  [permissao: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processo_modelos;
CREATE POLICY "rls_select" ON public.processo_modelos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_modelos;
CREATE POLICY "rls_insert" ON public.processo_modelos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_modelos;
CREATE POLICY "rls_update" ON public.processo_modelos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_modelos;
CREATE POLICY "rls_delete" ON public.processo_modelos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));

-- ----------------------------------------------------------------------------
-- 2. Dias úteis
-- ----------------------------------------------------------------------------
-- Soma p_dias dias úteis a p_inicio: o dia de início não conta, sábado, domingo e feriados (feriados.data; os
-- recorrentes valem em todo ano, pelo mês e dia) não contam. p_dias <= 0 devolve p_inicio. INVOKER: feriados é
-- lido por qualquer usuário ativo.
CREATE OR REPLACE FUNCTION public.fn_somar_dias_uteis(p_inicio date, p_dias integer)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  d date := p_inicio;
  feitos integer := 0;
BEGIN
  IF p_inicio IS NULL OR p_dias IS NULL OR p_dias <= 0 THEN
    RETURN p_inicio;
  END IF;
  WHILE feitos < p_dias LOOP
    d := d + 1;
    IF extract(isodow FROM d) < 6 AND NOT EXISTS (
      SELECT 1 FROM public.feriados f
      WHERE coalesce(f.ativo, true)
        AND (f.data = d OR (coalesce(f.recorrente, false) AND to_char(f.data, 'MMDD') = to_char(d, 'MMDD')))
    ) THEN
      feitos := feitos + 1;
    END IF;
  END LOOP;
  RETURN d;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Carga inicial dos modelos
-- ----------------------------------------------------------------------------
-- Etapas e checklist vêm das páginas /processos/* (src/pages/processos). Onde o código não dizia, a spec marca
-- "(proposta)" e o órgão confirma depois; os prazos (5 dias úteis, sem prazo em Fiscalização, Execução e Viagem)
-- também são proposta, ajustáveis pela tabela.
-- Siglas (Lei 2.301/2025; a Lei não fixa sigla para a Presidência e as assessorias):
--   PRES     a página dizia "Presidência"; PRES é a sigla da Presidência no banco (VinculosServidorPanel) e nenhuma
--            norma a fixa (D13 em 01_ESTRUTURA_INSTITUCIONAL.md; a numeração da Portaria 001/2026 usa PRESI/GAB, que não
--            serve de sigla de unidade)
--   CI, CPL, ASJUR  siglas usadas no cadastro de unidades (a Lei cria Controle Interno, Comissão de Contratação e
--            Assessoria Jurídica sem sigla; a página dizia CI e CPL)
--   DIRAF    as páginas dizem DIRAF; pela Lei a execução é da DiCOF (orçamento, empenho, liquidação, pagamento) e da
--            DiAGP/NuPat (patrimônio), mas a spec mantém DIRAF até o cadastro das unidades da Lei
--   NuPat    Núcleo de Patrimônio e Logística (DiAGP): tombamento e baixa de bens
--   NuAlm    proposta: o almoxarifado é atribuição da DiAGP, mas a Lei não cria núcleo próprio; a página dizia
--            "Almoxarifado"
--   @ORIGEM  a página dizia Unidade Demandante, Unidade Solicitante, Servidor ou Fiscal de Contrato (unidade de quem
--            abriu o processo); @CHEFIA: "Chefia Imediata"
-- base_legal de compras (Lei nº 14.133/2021) e pagamentos (Lei nº 4.320/1964): (proposta), não consta da spec; o órgão confirma
INSERT INTO public.processo_modelos (codigo, nome, tipo_processo, base_legal) VALUES
  ('compras', 'Compras e Contratos', 'compra', 'Lei nº 14.133/2021'),
  ('diarias', 'Diárias e Viagens', 'diaria', NULL),
  ('convenios', 'Convênios e Parcerias', 'convenio', NULL),
  ('almoxarifado', 'Almoxarifado', 'outro', NULL),
  ('pagamentos', 'Pagamentos', 'outro', 'Lei nº 4.320/1964'),
  ('patrimonio_tombamento', 'Patrimônio: tombamento', 'patrimonio', NULL),
  ('patrimonio_baixa', 'Patrimônio: baixa', 'patrimonio', NULL)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.processo_modelo_etapas (modelo_id, ordem, nome, unidade_sigla, responsavel_rotulo, prazo_dias_uteis)
SELECT m.id, v.ordem, v.nome, v.unidade_sigla, v.rotulo, v.prazo
FROM (VALUES
  ('compras', 1, 'Termo de Demanda', '@ORIGEM', 'Unidade Demandante', 5),
  ('compras', 2, 'Análise Orçamentária', 'DIRAF', 'DIRAF', 5),
  ('compras', 3, 'Parecer Controle Interno', 'CI', 'Controle Interno', 5),
  ('compras', 4, 'Autorização', 'PRES', 'Presidência', 5),
  ('compras', 5, 'Processo Licitatório', 'CPL', 'Comissão de Contratação', 5),
  ('compras', 6, 'Contratação', 'DIRAF', 'DIRAF', 5),
  ('compras', 7, 'Fiscalização', '@ORIGEM', 'Fiscal de Contrato', NULL),
  ('compras', 8, 'Pagamento', 'DIRAF', 'DIRAF', 5),
  ('diarias', 1, 'Solicitação', '@ORIGEM', 'Servidor', 5),
  ('diarias', 2, 'Aprovação Chefia', '@CHEFIA', 'Chefia Imediata', 5),
  ('diarias', 3, 'Ordem de Missão', 'DIRAF', 'DIRAF', 5),
  ('diarias', 4, 'Autorização', 'PRES', 'Presidência', 5),
  ('diarias', 5, 'Empenho/Pagamento', 'DIRAF', 'DIRAF', 5),
  ('diarias', 6, 'Viagem', '@ORIGEM', 'Servidor', NULL),
  ('diarias', 7, 'Relatório', '@ORIGEM', 'Servidor', 5),
  ('diarias', 8, 'Prestação de Contas', 'DIRAF', 'DIRAF', 5),
  ('convenios', 1, 'Proposta/Plano de Trabalho', '@ORIGEM', 'Unidade Proponente', 5),
  ('convenios', 2, 'Análise Jurídica', 'ASJUR', 'Assessoria Jurídica', 5),
  ('convenios', 3, 'Aprovação Técnica', '@ORIGEM', 'Unidade Proponente', 5),
  ('convenios', 4, 'Celebração', 'PRES', 'Presidência', 5),
  ('convenios', 5, 'Execução', '@ORIGEM', 'Unidade Proponente', NULL),
  ('convenios', 6, 'Prestação de Contas', 'DIRAF', 'DIRAF', 5),
  ('almoxarifado', 1, 'Requisição', '@ORIGEM', 'Unidade Solicitante', 5),
  ('almoxarifado', 2, 'Aprovação Chefia', '@CHEFIA', 'Chefia Imediata', 5),
  ('almoxarifado', 3, 'Verificação Estoque', 'NuAlm', 'Almoxarifado', 5),
  ('almoxarifado', 4, 'Separação Material', 'NuAlm', 'Almoxarifado', 5),
  ('almoxarifado', 5, 'Entrega', 'NuAlm', 'Almoxarifado', 5),
  ('almoxarifado', 6, 'Baixa no Sistema', 'NuAlm', 'Almoxarifado', 5),
  ('pagamentos', 1, 'Recebimento da Demanda', 'DIRAF', 'DIRAF', 5),
  ('pagamentos', 2, 'Conferência Documental', 'DIRAF', 'DIRAF', 5),
  ('pagamentos', 3, 'Empenho', 'DIRAF', 'DIRAF', 5),
  ('pagamentos', 4, 'Liquidação', 'DIRAF', 'DIRAF', 5),
  ('pagamentos', 5, 'Ordenação', 'PRES', 'Presidência (ordenador de despesas)', 5),
  ('pagamentos', 6, 'Pagamento', 'DIRAF', 'DIRAF', 5),
  ('patrimonio_tombamento', 1, 'Recebimento', '@ORIGEM', 'Unidade Recebedora', 5),
  ('patrimonio_tombamento', 2, 'Tombamento', 'NuPat', 'Patrimônio', 5),
  ('patrimonio_tombamento', 3, 'Termo de Responsabilidade', '@ORIGEM', 'Responsável pelo bem', 5),
  ('patrimonio_baixa', 1, 'Laudo', 'NuPat', 'Patrimônio', 5),
  ('patrimonio_baixa', 2, 'Parecer Controle Interno', 'CI', 'Controle Interno', 5),
  ('patrimonio_baixa', 3, 'Autorização', 'PRES', 'Presidência', 5),
  ('patrimonio_baixa', 4, 'Destinação', 'NuPat', 'Patrimônio', 5)
) AS v(modelo, ordem, nome, unidade_sigla, rotulo, prazo)
JOIN public.processo_modelos m ON m.codigo = v.modelo
ON CONFLICT (modelo_id, ordem) DO NOTHING;

INSERT INTO public.processo_modelo_checklist (modelo_id, etapa_ordem, codigo, descricao, obrigatorio)
SELECT m.id, v.etapa, v.codigo, v.descricao, v.obrigatorio
FROM (VALUES
  ('compras', 1, 'demanda', 'Termo de Demanda preenchido e assinado', true),
  ('compras', 1, 'justificativa', 'Justificativa da necessidade (interesse público)', true),
  ('compras', 1, 'tr', 'Termo de Referência ou Projeto Básico', true),
  ('compras', 1, 'pesquisa', 'Pesquisa de preços (mínimo 3 cotações)', true),
  ('compras', 2, 'orcamento', 'Disponibilidade orçamentária atestada', true),
  ('compras', 3, 'ci', 'Parecer do Controle Interno', true),
  ('compras', 3, 'parecer', 'Parecer jurídico (quando aplicável)', false),
  ('compras', 4, 'autorizacao', 'Autorização da Presidência', true),
  ('diarias', 1, 'solicitacao', 'Formulário de solicitação de diária preenchido', true),
  ('diarias', 1, 'justificativa', 'Justificativa da missão (interesse público)', true),
  ('diarias', 1, 'programacao', 'Programação da viagem com cronograma', true),
  ('diarias', 2, 'aprovacao', 'Aprovação da chefia imediata', true),
  ('diarias', 3, 'ordem', 'Ordem de Missão emitida', true),
  ('diarias', 4, 'autorizacao', 'Autorização da Presidência', true),
  ('convenios', 1, 'plano_trabalho', 'Plano de trabalho', true),
  ('convenios', 2, 'parecer_juridico', 'Parecer jurídico', true),
  ('convenios', 4, 'publicacao_doe', 'Publicação no Diário Oficial do Estado', true),
  ('almoxarifado', 1, 'requisicao', 'Requisição de Material preenchida', true),
  ('almoxarifado', 1, 'justificativa', 'Justificativa da necessidade', true),
  ('almoxarifado', 2, 'aprovacao', 'Aprovação da chefia imediata', true),
  ('almoxarifado', 3, 'verificacao', 'Verificação de disponibilidade no estoque', true),
  ('pagamentos', 2, 'nota_fiscal_atesto', 'Nota fiscal com atesto', true),
  ('pagamentos', 3, 'nota_empenho', 'Nota de empenho', true),
  ('patrimonio_tombamento', 1, 'nota', 'Nota fiscal ou documento de aquisição', true),
  ('patrimonio_tombamento', 1, 'termo', 'Termo de Recebimento', true),
  ('patrimonio_tombamento', 2, 'plaqueta', 'Plaqueta de identificação afixada', true),
  ('patrimonio_tombamento', 2, 'foto', 'Registro fotográfico do bem', false),
  ('patrimonio_tombamento', 3, 'responsavel', 'Termo de Responsabilidade assinado', true),
  ('patrimonio_baixa', 1, 'laudo', 'Laudo técnico de inservibilidade', true),
  ('patrimonio_baixa', 2, 'parecer', 'Parecer do Controle Interno', true),
  ('patrimonio_baixa', 3, 'autorizacao', 'Autorização da Presidência', true),
  ('patrimonio_baixa', 4, 'destino', 'Documentação de destinação final', true)
) AS v(modelo, etapa, codigo, descricao, obrigatorio)
JOIN public.processo_modelos m ON m.codigo = v.modelo
ON CONFLICT (modelo_id, codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Privilégios
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.processo_modelos, public.processo_modelo_etapas, public.processo_modelo_checklist FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_somar_dias_uteis(date, integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_somar_dias_uteis(date, integer) TO authenticated;
