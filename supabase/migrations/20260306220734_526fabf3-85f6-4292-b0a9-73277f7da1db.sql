
CREATE OR REPLACE FUNCTION public.gerar_protocolo_arbitro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM public.cadastro_arbitros WHERE id != NEW.id;
  NEW.protocolo := 'ARB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq::text, 5, '0');
  RETURN NEW;
END;
$$;
