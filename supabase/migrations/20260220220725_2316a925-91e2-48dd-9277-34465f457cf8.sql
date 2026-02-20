-- Corrige RLS: permite leitura pública da tabela de status de páginas
-- (necessário pois o PublicPageGuard roda sem autenticação)
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_paginas_publicas;

CREATE POLICY "leitura_publica_status_paginas"
ON public.config_paginas_publicas
FOR SELECT
TO anon, authenticated
USING (true);
