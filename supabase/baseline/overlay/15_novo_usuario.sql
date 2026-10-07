-- handle_new_user: criar usuário no Auth falhava.
--
-- O trigger on_auth_user_created chama handle_new_user(), que inseria em profiles sem
-- tipo_usuario, coluna NOT NULL sem valor padrão (o types.ts do banco ao vivo mostra a mesma
-- restrição): todo INSERT em auth.users abortava. A Edge Function admin-create-user usa a mesma
-- regra de tipo (tecnico quando informado, senão servidor), mantida aqui.
-- O perfil nasce INATIVO e com papel 'user' (mesma política de antes); um admin ativa.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_active, tipo_usuario)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false,
    CASE WHEN NEW.raw_user_meta_data->>'tipo_usuario' = 'tecnico' THEN 'tecnico' ELSE 'servidor' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- O trigger vive em auth.users (fora de `public`, portanto fora do dump do schema): é recriado aqui.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
