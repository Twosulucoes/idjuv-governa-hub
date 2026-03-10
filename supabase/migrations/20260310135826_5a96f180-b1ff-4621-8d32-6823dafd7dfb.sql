-- Limpar índices órfãos de migrações anteriores
DROP INDEX IF EXISTS public.idx_vinculos_ativo;
DROP INDEX IF EXISTS public.idx_vinculos_servidor;
DROP INDEX IF EXISTS public.idx_vinculos_tipo;

-- ============================================================
-- TABELA: vinculos_servidor
-- Permite múltiplos vínculos simultâneos por servidor
-- ============================================================

CREATE TYPE public.tipo_vinculo_servidor AS ENUM (
  'efetivo',
  'comissionado',
  'cedido_entrada',
  'requisitado',
  'federal',
  'temporario',
  'estagiario'
);

CREATE TYPE public.origem_vinculo AS ENUM (
  'idjuv',
  'estado_rr',
  'federal',
  'municipal',
  'outro_orgao'
);

CREATE TABLE public.vinculos_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo tipo_vinculo_servidor NOT NULL,
  origem origem_vinculo NOT NULL DEFAULT 'idjuv',
  orgao_nome TEXT,
  cargo_id UUID REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  funcao_exercida TEXT,
  onus TEXT CHECK (onus IN ('origem', 'destino', 'compartilhado')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ato_tipo TEXT,
  ato_numero TEXT,
  ato_data DATE,
  ato_doe_numero TEXT,
  ato_doe_data DATE,
  ato_url TEXT,
  remuneracao_bruta NUMERIC(12,2),
  gratificacoes NUMERIC(12,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_vinc_serv_servidor ON public.vinculos_servidor(servidor_id);
CREATE INDEX idx_vinc_serv_ativo ON public.vinculos_servidor(servidor_id, ativo) WHERE ativo = true;
CREATE INDEX idx_vinc_serv_tipo ON public.vinculos_servidor(tipo);

ALTER TABLE public.vinculos_servidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_servidor FORCE ROW LEVEL SECURITY;

CREATE POLICY "vinculos_select" ON public.vinculos_servidor
FOR SELECT TO authenticated
USING (public.can_access_module(auth.uid(), 'rh'));

CREATE POLICY "vinculos_insert" ON public.vinculos_servidor
FOR INSERT TO authenticated
WITH CHECK (public.can_access_module(auth.uid(), 'rh'));

CREATE POLICY "vinculos_update" ON public.vinculos_servidor
FOR UPDATE TO authenticated
USING (public.can_access_module(auth.uid(), 'rh'))
WITH CHECK (public.can_access_module(auth.uid(), 'rh'));

CREATE POLICY "vinculos_delete" ON public.vinculos_servidor
FOR DELETE TO authenticated
USING (public.can_access_module(auth.uid(), 'rh'));

CREATE TRIGGER set_vinculos_servidor_updated_at
  BEFORE UPDATE ON public.vinculos_servidor
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Migrar dados existentes (todos comissionado_idjuv)
INSERT INTO public.vinculos_servidor (servidor_id, tipo, origem, cargo_id, unidade_id, data_inicio, ativo, created_by)
SELECT 
  s.id,
  'comissionado'::tipo_vinculo_servidor,
  'idjuv'::origem_vinculo,
  s.cargo_atual_id,
  s.unidade_atual_id,
  COALESCE(s.data_admissao, CURRENT_DATE),
  true,
  s.user_id
FROM public.servidores s;

-- View: tipo derivado dos vínculos ativos
CREATE OR REPLACE VIEW public.v_servidor_tipo_derivado AS
SELECT 
  s.id AS servidor_id,
  s.nome_completo,
  s.matricula,
  CASE
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'efetivo')
      AND EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'efetivo_comissionado'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'efetivo')
    THEN 'efetivo'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'cedido_entrada')
      AND EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'cedido_comissionado'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'cedido_entrada')
    THEN 'cedido_entrada'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'federal')
      AND EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'federal_comissionado'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'federal')
    THEN 'federal'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'comissionado'
    WHEN EXISTS (SELECT 1 FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'requisitado')
    THEN 'requisitado'
    ELSE 'nao_classificado'
  END AS tipo_derivado,
  (SELECT COUNT(*) FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo) AS total_vinculos_ativos,
  (SELECT array_agg(DISTINCT v.tipo::text ORDER BY v.tipo::text) FROM vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo) AS tipos_ativos
FROM public.servidores s;