-- Adicionar colunas faltantes em fichas_financeiras para processar_folha_pagamento funcionar
ALTER TABLE fichas_financeiras 
ADD COLUMN IF NOT EXISTS competencia_ano INTEGER,
ADD COLUMN IF NOT EXISTS competencia_mes INTEGER,
ADD COLUMN IF NOT EXISTS tipo_folha VARCHAR,
ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES estrutura_organizacional(id),
ADD COLUMN IF NOT EXISTS unidade_nome VARCHAR;

-- Criar constraint UNIQUE para registros_ponto permitir upsert
ALTER TABLE registros_ponto 
ADD CONSTRAINT registros_ponto_servidor_data_unique 
UNIQUE (servidor_id, data);

-- Criar constraint UNIQUE para frequencia_mensal permitir upsert
ALTER TABLE frequencia_mensal 
ADD CONSTRAINT frequencia_mensal_servidor_ano_mes_unique 
UNIQUE (servidor_id, ano, mes);