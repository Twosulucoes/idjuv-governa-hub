-- Limpar dados existentes dos campos ato_nomeacao_* em provimentos
UPDATE provimentos SET
  ato_nomeacao_tipo = NULL,
  ato_nomeacao_numero = NULL,
  ato_nomeacao_data = NULL,
  ato_nomeacao_doe_numero = NULL,
  ato_nomeacao_doe_data = NULL,
  ato_nomeacao_url = NULL;

-- Remover as colunas ato_nomeacao_* da tabela provimentos
-- A portaria de nomeação agora é gerenciada exclusivamente pela Central de Portarias (tabela documentos)
ALTER TABLE provimentos
  DROP COLUMN IF EXISTS ato_nomeacao_tipo,
  DROP COLUMN IF EXISTS ato_nomeacao_numero,
  DROP COLUMN IF EXISTS ato_nomeacao_data,
  DROP COLUMN IF EXISTS ato_nomeacao_doe_numero,
  DROP COLUMN IF EXISTS ato_nomeacao_doe_data,
  DROP COLUMN IF EXISTS ato_nomeacao_url;

-- Adicionar comentário na tabela para documentar a mudança
COMMENT ON TABLE provimentos IS 'Provimentos/nomeações de servidores. Portarias de nomeação devem ser gerenciadas pela Central de Portarias (tabela documentos).';