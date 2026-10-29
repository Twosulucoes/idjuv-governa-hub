-- ============================================================================
-- FINANCEIRO — Emendas parlamentares (etapa 2 de "dotação comum e emendas no QDD")
-- ============================================================================
-- O QDD do FIPLAN só diz o tipo da emenda (IDU: ECNI, ECI, EII) e o valor por natureza; não diz de quem é a
-- emenda, para que serve nem quem recebe. Uma dotação de emenda pode reunir várias emendas.
--
--   fin_emendas            cada emenda: número, tipo (IDU), autor, objeto, beneficiário, valor e a dotação do QDD
--                          em que caiu; reserva (PED) lançada à mão, porque o QDD só traz a reserva da dotação.
--   fin_empenhos.emenda_id o empenho que executa a emenda; o empenhado da emenda é a soma desses empenhos.
--
-- RLS (gerada de rls/mapa.csv, classe permissao): o módulo financeiro lê; gravar exige orcamento.criar.
-- Idempotente (IF NOT EXISTS, DROP/CREATE de policies e gatilho).
-- ============================================================================

SET lock_timeout = '10s';

CREATE TABLE IF NOT EXISTS public.fin_emendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio integer NOT NULL CHECK (exercicio BETWEEN 2000 AND 2100),
  dotacao_id uuid NOT NULL REFERENCES public.fin_dotacoes(id) ON DELETE RESTRICT,
  numero text NOT NULL CHECK (char_length(btrim(numero)) BETWEEN 1 AND 50),
  idu text NOT NULL CHECK (char_length(btrim(idu)) BETWEEN 1 AND 6 AND lower(btrim(idu)) <> 'não'),
  autor text NOT NULL CHECK (char_length(btrim(autor)) BETWEEN 1 AND 200),
  objeto text NOT NULL CHECK (char_length(btrim(objeto)) BETWEEN 1 AND 2000),
  beneficiario text CHECK (beneficiario IS NULL OR char_length(beneficiario) <= 300),
  beneficiario_cnpj text CHECK (beneficiario_cnpj IS NULL OR beneficiario_cnpj ~ '^\d{14}$'),
  valor numeric(15,2) NOT NULL CHECK (valor > 0),
  valor_reservado numeric(15,2) NOT NULL DEFAULT 0 CHECK (valor_reservado >= 0),
  ped_numero text CHECK (ped_numero IS NULL OR char_length(ped_numero) <= 30),
  processo_sei text CHECK (processo_sei IS NULL OR char_length(processo_sei) <= 50),
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT fin_emendas_numero_exercicio_key UNIQUE (exercicio, numero)
);
CREATE INDEX IF NOT EXISTS idx_fin_emendas_dotacao ON public.fin_emendas (dotacao_id);
COMMENT ON TABLE public.fin_emendas IS
  'Emendas parlamentares do orçamento: autor, objeto, beneficiário e valor de cada emenda, ligada à dotação do QDD (IDU de emenda). O empenhado vem dos empenhos com emenda_id.';
COMMENT ON COLUMN public.fin_emendas.idu IS 'Tipo da emenda como no IDU do QDD do FIPLAN (ex.: ECNI, ECI, EII).';
COMMENT ON COLUMN public.fin_emendas.valor_reservado IS 'Reserva (PED) feita para a emenda e ainda não empenhada, lançada à mão.';

DROP TRIGGER IF EXISTS update_fin_emendas_updated_at ON public.fin_emendas;
CREATE TRIGGER update_fin_emendas_updated_at BEFORE UPDATE ON public.fin_emendas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.fin_empenhos
  ADD COLUMN IF NOT EXISTS emenda_id uuid REFERENCES public.fin_emendas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_emenda ON public.fin_empenhos (emenda_id) WHERE emenda_id IS NOT NULL;
COMMENT ON COLUMN public.fin_empenhos.emenda_id IS 'Emenda parlamentar que o empenho executa (fin_emendas).';

-- ----------------------------------------------------------------------------
-- RLS (gerada de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_emendas ENABLE ROW LEVEL SECURITY;

-- fin_emendas  [permissao: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_emendas;
CREATE POLICY "rls_select" ON public.fin_emendas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_emendas;
CREATE POLICY "rls_insert" ON public.fin_emendas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'orcamento.criar'));
DROP POLICY IF EXISTS "rls_update" ON public.fin_emendas;
CREATE POLICY "rls_update" ON public.fin_emendas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'orcamento.criar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'orcamento.criar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_emendas;
CREATE POLICY "rls_delete" ON public.fin_emendas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'orcamento.criar'));

