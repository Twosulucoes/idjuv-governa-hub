-- Corrigir a FK da tabela frequencia_mensal que referencia profiles ao invés de servidores
ALTER TABLE public.frequencia_mensal 
DROP CONSTRAINT IF EXISTS frequencia_mensal_servidor_id_fkey;

ALTER TABLE public.frequencia_mensal 
ADD CONSTRAINT frequencia_mensal_servidor_id_fkey 
FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;