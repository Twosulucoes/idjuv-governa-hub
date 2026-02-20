
-- Força reload do cache PostgREST para que todas as FKs sejam reconhecidas
-- Isso resolve os erros PGRST200 de relacionamentos não encontrados
SELECT pg_notify('pgrst', 'reload schema');
NOTIFY pgrst, 'reload schema';
