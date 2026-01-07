-- Criar trigger para popular profiles automaticamente quando um novo usuário se cadastra
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Garantir que usuários existentes em auth.users tenham seus profiles criados
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;