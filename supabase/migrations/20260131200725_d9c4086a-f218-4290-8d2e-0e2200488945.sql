-- Corrige FK incorreta: registros_ponto.servidor_id deve referenciar servidores(id), não profiles(id)

ALTER TABLE public.registros_ponto
  DROP CONSTRAINT IF EXISTS registros_ponto_servidor_id_fkey;

ALTER TABLE public.registros_ponto
  ADD CONSTRAINT registros_ponto_servidor_id_fkey
  FOREIGN KEY (servidor_id)
  REFERENCES public.servidores(id)
  ON DELETE CASCADE;
