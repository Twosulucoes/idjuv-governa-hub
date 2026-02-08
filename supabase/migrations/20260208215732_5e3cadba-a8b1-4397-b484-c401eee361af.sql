-- ============================================================
-- Adicionar código interno automático para servidores
-- Usado para organização de pastas físicas
-- ============================================================

-- Adicionar coluna de código interno
ALTER TABLE public.servidores 
ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(10) UNIQUE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_servidores_codigo_interno 
ON public.servidores(codigo_interno);

-- Função para gerar código interno sequencial
CREATE OR REPLACE FUNCTION public.gerar_codigo_interno_servidor()
RETURNS TRIGGER AS $$
DECLARE
  max_codigo INTEGER;
  novo_codigo VARCHAR(10);
BEGIN
  -- Buscar o maior código existente
  SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo_interno, '\D', '', 'g'), '')::INTEGER), 0)
  INTO max_codigo
  FROM public.servidores
  WHERE codigo_interno IS NOT NULL;
  
  -- Gerar novo código com prefixo SRV- e 5 dígitos
  novo_codigo := 'SRV-' || LPAD((max_codigo + 1)::TEXT, 5, '0');
  
  NEW.codigo_interno := novo_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente no INSERT
DROP TRIGGER IF EXISTS trigger_gerar_codigo_interno_servidor ON public.servidores;
CREATE TRIGGER trigger_gerar_codigo_interno_servidor
  BEFORE INSERT ON public.servidores
  FOR EACH ROW
  WHEN (NEW.codigo_interno IS NULL)
  EXECUTE FUNCTION public.gerar_codigo_interno_servidor();

-- Gerar códigos para servidores existentes (em ordem de criação)
WITH servidores_ordenados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as seq
  FROM public.servidores
  WHERE codigo_interno IS NULL
)
UPDATE public.servidores s
SET codigo_interno = 'SRV-' || LPAD(so.seq::TEXT, 5, '0')
FROM servidores_ordenados so
WHERE s.id = so.id;

-- Comentário descritivo
COMMENT ON COLUMN public.servidores.codigo_interno IS 'Código interno sequencial automático (SRV-00001) para organização de pastas físicas';