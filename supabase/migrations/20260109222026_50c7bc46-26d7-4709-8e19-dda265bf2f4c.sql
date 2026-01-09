
-- Corrigir função sync_usuario_servidor_status para usar apenas valores válidos do enum
CREATE OR REPLACE FUNCTION sync_usuario_servidor_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando servidor é exonerado, inativo ou falecido, bloqueia o usuário
  IF NEW.situacao IN ('exonerado', 'inativo', 'falecido') 
     AND OLD.situacao NOT IN ('exonerado', 'inativo', 'falecido') THEN
    UPDATE public.profiles
    SET is_active = false,
        blocked_at = now(),
        blocked_reason = 'Servidor ' || NEW.situacao || ' em ' || now()::date
    WHERE servidor_id = NEW.id;
  -- Quando servidor é reativado
  ELSIF NEW.situacao = 'ativo' AND OLD.situacao IN ('exonerado', 'inativo') THEN
    UPDATE public.profiles
    SET is_active = true,
        blocked_at = NULL,
        blocked_reason = NULL
    WHERE servidor_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;
