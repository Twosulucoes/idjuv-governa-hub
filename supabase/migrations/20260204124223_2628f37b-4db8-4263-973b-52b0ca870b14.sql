-- Adicionar coluna federacao_id na tabela agenda_unidade
-- Permite vincular uma reserva/cedência a uma federação específica
ALTER TABLE public.agenda_unidade 
ADD COLUMN IF NOT EXISTS federacao_id UUID REFERENCES public.federacoes_esportivas(id) ON DELETE SET NULL;

-- Criar índice parcial para consultas otimizadas de cedências por federação
CREATE INDEX IF NOT EXISTS idx_agenda_unidade_federacao 
ON public.agenda_unidade(federacao_id) 
WHERE federacao_id IS NOT NULL;

-- Comentário explicativo na coluna
COMMENT ON COLUMN public.agenda_unidade.federacao_id IS 'Referência à federação esportiva quando o solicitante é uma federação. Usado para integração com módulo de Federações.';