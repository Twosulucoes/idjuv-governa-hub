-- Campos de segundo vínculo funcional
ALTER TABLE public.servidores 
  ADD COLUMN IF NOT EXISTS possui_vinculo_externo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vinculo_externo_esfera TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_orgao TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_cargo TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_matricula TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_situacao TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_forma TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_ato_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vinculo_externo_observacoes TEXT;

-- Comentários descritivos
COMMENT ON COLUMN public.servidores.possui_vinculo_externo IS 'Indica se o servidor possui vínculo efetivo em outro órgão';
COMMENT ON COLUMN public.servidores.vinculo_externo_esfera IS 'Esfera do vínculo: federal, estadual_rr, estadual_outro, municipal';
COMMENT ON COLUMN public.servidores.vinculo_externo_orgao IS 'Nome do órgão onde possui vínculo externo';
COMMENT ON COLUMN public.servidores.vinculo_externo_cargo IS 'Cargo que ocupa no órgão externo';
COMMENT ON COLUMN public.servidores.vinculo_externo_matricula IS 'Matrícula no órgão externo';
COMMENT ON COLUMN public.servidores.vinculo_externo_situacao IS 'Situação do vínculo externo: ativo, licenciado, cedido, afastado';
COMMENT ON COLUMN public.servidores.vinculo_externo_forma IS 'Forma do vínculo: informal, cessao, requisicao, licenca';
COMMENT ON COLUMN public.servidores.vinculo_externo_ato_id IS 'Referência ao documento/ato formal na Central de Portarias';
COMMENT ON COLUMN public.servidores.vinculo_externo_observacoes IS 'Observações adicionais sobre o vínculo externo';

-- Índice para busca eficiente
CREATE INDEX IF NOT EXISTS idx_servidores_vinculo_externo_ato 
  ON public.servidores(vinculo_externo_ato_id) 
  WHERE vinculo_externo_ato_id IS NOT NULL;

-- Índice para filtrar servidores com vínculo externo
CREATE INDEX IF NOT EXISTS idx_servidores_possui_vinculo_externo 
  ON public.servidores(possui_vinculo_externo) 
  WHERE possui_vinculo_externo = true;