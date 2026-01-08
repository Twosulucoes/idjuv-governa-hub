-- Corrigir FK de lotacoes para referenciar servidores em vez de profiles
ALTER TABLE public.lotacoes 
DROP CONSTRAINT IF EXISTS lotacoes_servidor_id_fkey;

ALTER TABLE public.lotacoes 
ADD CONSTRAINT lotacoes_servidor_id_fkey 
FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;