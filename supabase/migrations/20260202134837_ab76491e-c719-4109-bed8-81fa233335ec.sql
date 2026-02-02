
-- ============================================================
-- MIGRAÇÃO: PARAMETRIZAÇÃO INSTITUCIONAL DE FREQUÊNCIA
-- Adiciona campos de esfera e localidade + controle de vigência
-- ============================================================

-- 1. Adicionar coluna 'esfera' para classificar feriados por nível
ALTER TABLE public.dias_nao_uteis 
ADD COLUMN IF NOT EXISTS esfera VARCHAR(20) DEFAULT 'nacional';

-- 2. Adicionar colunas de localidade
ALTER TABLE public.dias_nao_uteis 
ADD COLUMN IF NOT EXISTS uf CHAR(2);

ALTER TABLE public.dias_nao_uteis 
ADD COLUMN IF NOT EXISTS municipio VARCHAR(100);

-- 3. Adicionar coluna de updated_at para auditoria
ALTER TABLE public.dias_nao_uteis 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.dias_nao_uteis 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 4. Adicionar coluna de fundamentação legal
ALTER TABLE public.dias_nao_uteis 
ADD COLUMN IF NOT EXISTS fundamentacao_legal TEXT;

-- 5. Comentários para documentação
COMMENT ON TABLE public.dias_nao_uteis IS 'Calendário oficial institucional com feriados, pontos facultativos e dias não úteis';
COMMENT ON COLUMN public.dias_nao_uteis.esfera IS 'Esfera do feriado: nacional, estadual, municipal ou institucional';
COMMENT ON COLUMN public.dias_nao_uteis.uf IS 'UF aplicável para feriados estaduais (ex: RR)';
COMMENT ON COLUMN public.dias_nao_uteis.municipio IS 'Município aplicável para feriados municipais';
COMMENT ON COLUMN public.dias_nao_uteis.fundamentacao_legal IS 'Lei, decreto ou portaria que fundamenta o dia não útil';

-- 6. Adicionar controle de vigência na tabela de jornada
ALTER TABLE public.config_jornada_padrao 
ADD COLUMN IF NOT EXISTS vigencia_inicio DATE;

ALTER TABLE public.config_jornada_padrao 
ADD COLUMN IF NOT EXISTS vigencia_fim DATE;

ALTER TABLE public.config_jornada_padrao 
ADD COLUMN IF NOT EXISTS fundamentacao_legal TEXT;

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_data ON public.dias_nao_uteis(data);
CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_tipo ON public.dias_nao_uteis(tipo);
CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_esfera ON public.dias_nao_uteis(esfera);
CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_ativo ON public.dias_nao_uteis(ativo) WHERE ativo = true;

-- 8. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_updated_at_dias_nao_uteis ON public.dias_nao_uteis;
CREATE TRIGGER set_updated_at_dias_nao_uteis
  BEFORE UPDATE ON public.dias_nao_uteis
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- 9. Garantir RLS está ativo
ALTER TABLE public.dias_nao_uteis ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para dias_nao_uteis
DROP POLICY IF EXISTS "dias_nao_uteis_select" ON public.dias_nao_uteis;
CREATE POLICY "dias_nao_uteis_select" ON public.dias_nao_uteis
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "dias_nao_uteis_admin" ON public.dias_nao_uteis;
CREATE POLICY "dias_nao_uteis_admin" ON public.dias_nao_uteis
  FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'rh.admin'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'rh.admin'));

-- 11. Inserir feriados nacionais padrão de 2026 se não existirem
INSERT INTO public.dias_nao_uteis (data, nome, tipo, esfera, conta_frequencia, exige_compensacao, recorrente, mes_recorrente, dia_recorrente, ativo)
SELECT * FROM (VALUES
  ('2026-01-01'::DATE, 'Confraternização Universal', 'feriado_nacional', 'nacional', false, false, true, 1, 1, true),
  ('2026-04-03'::DATE, 'Sexta-feira Santa', 'feriado_nacional', 'nacional', false, false, false, null, null, true),
  ('2026-04-21'::DATE, 'Tiradentes', 'feriado_nacional', 'nacional', false, false, true, 4, 21, true),
  ('2026-05-01'::DATE, 'Dia do Trabalho', 'feriado_nacional', 'nacional', false, false, true, 5, 1, true),
  ('2026-06-04'::DATE, 'Corpus Christi', 'ponto_facultativo', 'nacional', false, false, false, null, null, true),
  ('2026-09-07'::DATE, 'Independência do Brasil', 'feriado_nacional', 'nacional', false, false, true, 9, 7, true),
  ('2026-10-12'::DATE, 'Nossa Senhora Aparecida', 'feriado_nacional', 'nacional', false, false, true, 10, 12, true),
  ('2026-11-02'::DATE, 'Finados', 'feriado_nacional', 'nacional', false, false, true, 11, 2, true),
  ('2026-11-15'::DATE, 'Proclamação da República', 'feriado_nacional', 'nacional', false, false, true, 11, 15, true),
  ('2026-12-25'::DATE, 'Natal', 'feriado_nacional', 'nacional', false, false, true, 12, 25, true),
  ('2026-10-05'::DATE, 'Aniversário de Roraima', 'feriado_estadual', 'estadual', false, false, true, 10, 5, true)
) AS v(data, nome, tipo, esfera, conta_frequencia, exige_compensacao, recorrente, mes_recorrente, dia_recorrente, ativo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dias_nao_uteis d WHERE d.data = v.data
);
