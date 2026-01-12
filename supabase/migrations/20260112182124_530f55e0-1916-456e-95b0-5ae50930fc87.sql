-- Ampliar campos da tabela config_autarquia que estão muito limitados
ALTER TABLE config_autarquia 
  ALTER COLUMN natureza_juridica TYPE VARCHAR(100),
  ALTER COLUMN esocial_ambiente TYPE VARCHAR(50),
  ALTER COLUMN esocial_processo_emissao TYPE VARCHAR(10),
  ALTER COLUMN regime_tributario TYPE VARCHAR(100),
  ALTER COLUMN telefone TYPE VARCHAR(30),
  ALTER COLUMN endereco_numero TYPE VARCHAR(30),
  ALTER COLUMN crc_contabil TYPE VARCHAR(30);