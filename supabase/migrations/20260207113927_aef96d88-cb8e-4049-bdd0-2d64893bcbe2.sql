-- Corrigir search_path nas funções criadas para este módulo
CREATE OR REPLACE FUNCTION public.update_gestores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.marcar_escola_cadastrada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.escolas_jer 
  SET ja_cadastrada = true, updated_at = now()
  WHERE id = NEW.escola_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.desmarcar_escola_cadastrada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.escolas_jer 
  SET ja_cadastrada = false, updated_at = now()
  WHERE id = OLD.escola_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql
SET search_path = public;