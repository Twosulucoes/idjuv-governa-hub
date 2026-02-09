-- Corrigir política de SELECT da folhas_pagamento para remover acesso do módulo financeiro
-- Dados sensíveis de folha devem ser acessados apenas pelo RH

DROP POLICY IF EXISTS "rh_folhas_pagamento_select" ON public.folhas_pagamento;

CREATE POLICY "rh_folhas_pagamento_select"
ON public.folhas_pagamento
FOR SELECT
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
);

-- Adicionar comentário explicativo para documentar a decisão de segurança
COMMENT ON POLICY "rh_folhas_pagamento_select" ON public.folhas_pagamento IS 
'Acesso restrito ao módulo RH. Módulo financeiro NÃO tem acesso direto aos dados de folha - deve usar fichas_financeiras para consultas.';