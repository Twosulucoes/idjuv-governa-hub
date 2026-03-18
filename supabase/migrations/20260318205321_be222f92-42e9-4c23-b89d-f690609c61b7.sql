-- CONSOLIDAÇÃO: Manter 1 registro por CPF, mover modalidades para tabela filha

-- 1. Para cada CPF duplicado, eleger o registro "principal" (prioridade: aprovado > enviado > outros, depois o mais antigo)
-- 2. Inserir modalidades únicas dos duplicados na tabela filha
-- 3. Deletar registros duplicados

DO $$
DECLARE
  rec RECORD;
  dup RECORD;
  mod_exists BOOLEAN;
BEGIN
  -- Para cada CPF com mais de 1 registro
  FOR rec IN
    SELECT cpf,
      (
        SELECT id FROM cadastro_arbitros ca2
        WHERE ca2.cpf = ca1.cpf
        ORDER BY
          CASE status WHEN 'aprovado' THEN 0 WHEN 'enviado' THEN 1 ELSE 2 END,
          created_at ASC
        LIMIT 1
      ) AS principal_id
    FROM cadastro_arbitros ca1
    GROUP BY cpf
    HAVING COUNT(*) > 1
  LOOP
    -- Para cada registro duplicado desse CPF
    FOR dup IN
      SELECT id, modalidade, categoria, status, documentos_urls
      FROM cadastro_arbitros
      WHERE cpf = rec.cpf
    LOOP
      -- Garantir que cada modalidade exista na tabela filha para o registro principal
      IF dup.modalidade IS NOT NULL AND dup.modalidade <> '' THEN
        -- Pode ter múltiplas modalidades separadas por vírgula
        DECLARE
          mod_item TEXT;
          mod_arr TEXT[];
        BEGIN
          mod_arr := string_to_array(dup.modalidade, ',');
          FOREACH mod_item IN ARRAY mod_arr LOOP
            mod_item := btrim(mod_item);
            IF mod_item <> '' THEN
              SELECT EXISTS(
                SELECT 1 FROM cadastro_arbitros_modalidades
                WHERE arbitro_id = rec.principal_id
                  AND modalidade = mod_item
              ) INTO mod_exists;

              IF NOT mod_exists THEN
                INSERT INTO cadastro_arbitros_modalidades (arbitro_id, modalidade, categoria, status)
                VALUES (rec.principal_id, mod_item, dup.categoria, COALESCE(dup.status, 'enviado'));
              END IF;
            END IF;
          END LOOP;
        END;
      END IF;
    END LOOP;

    -- Deletar modalidades órfãs dos registros que serão removidos
    DELETE FROM cadastro_arbitros_modalidades
    WHERE arbitro_id IN (
      SELECT id FROM cadastro_arbitros WHERE cpf = rec.cpf AND id != rec.principal_id
    );

    -- Deletar registros duplicados (manter apenas o principal)
    DELETE FROM cadastro_arbitros
    WHERE cpf = rec.cpf AND id != rec.principal_id;
  END LOOP;
END $$;

-- Também consolidar registros únicos: garantir que suas modalidades estejam na tabela filha
INSERT INTO cadastro_arbitros_modalidades (arbitro_id, modalidade, categoria, status)
SELECT ca.id, btrim(unnest(string_to_array(ca.modalidade, ','))), ca.categoria, ca.status
FROM cadastro_arbitros ca
WHERE NOT EXISTS (
  SELECT 1 FROM cadastro_arbitros_modalidades cam WHERE cam.arbitro_id = ca.id
)
AND ca.modalidade IS NOT NULL AND ca.modalidade <> ''
ON CONFLICT DO NOTHING;