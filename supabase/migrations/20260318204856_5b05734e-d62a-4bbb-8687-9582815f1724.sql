-- Corrige geração de protocolo para evitar duplicidade em concorrência
CREATE SEQUENCE IF NOT EXISTS public.cadastro_arbitros_protocolo_seq;

-- Sincroniza a sequência com o maior número já existente no protocolo
SELECT setval(
  'public.cadastro_arbitros_protocolo_seq',
  COALESCE(
    (
      SELECT MAX((regexp_match(protocolo, '^ARB-\d{4}-(\d+)$'))[1]::bigint)
      FROM public.cadastro_arbitros
      WHERE protocolo ~ '^ARB-\d{4}-\d+$'
    ),
    0
  ),
  true
);

CREATE OR REPLACE FUNCTION public.gerar_protocolo_arbitro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num bigint;
  year_txt text;
BEGIN
  IF NEW.protocolo IS NOT NULL AND NEW.protocolo <> '' THEN
    RETURN NEW;
  END IF;

  year_txt := to_char(now(), 'YYYY');
  next_num := nextval('public.cadastro_arbitros_protocolo_seq');
  NEW.protocolo := format('ARB-%s-%s', year_txt, lpad(next_num::text, 5, '0'));

  RETURN NEW;
END;
$$;