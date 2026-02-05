-- Adicionar coluna para armazenar modalidades esportivas (array de texto)
ALTER TABLE agenda_unidade 
ADD COLUMN IF NOT EXISTS modalidades_esportivas text[] DEFAULT '{}';

-- Criar índice GIN para buscas eficientes por modalidade
CREATE INDEX IF NOT EXISTS idx_agenda_modalidades 
ON agenda_unidade USING GIN (modalidades_esportivas);

-- Comentário para documentação
COMMENT ON COLUMN agenda_unidade.modalidades_esportivas 
IS 'Array de modalidades esportivas praticadas no evento';