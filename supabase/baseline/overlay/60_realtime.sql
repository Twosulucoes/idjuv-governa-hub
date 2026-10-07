-- Realtime: tabelas publicadas em supabase_realtime.
--
-- A publicação não faz parte do dump de `public`; as migrações originais adicionaram estas duas
-- tabelas (acompanhamento ao vivo do processamento da folha). Sem a publicação (Postgres puro) o
-- bloco não faz nada.
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['fichas_financeiras', 'folhas_pagamento'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;
