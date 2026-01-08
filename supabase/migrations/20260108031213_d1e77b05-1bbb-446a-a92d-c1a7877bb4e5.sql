
-- ============================================
-- REESTRUTURAÇÃO: USUÁRIO vs SERVIDOR
-- ============================================

-- 1. Criar enum para tipo de usuário
CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

-- 2. Adicionar campos ao profiles para vincular a servidor e tipo
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tipo_usuario tipo_usuario NOT NULL DEFAULT 'servidor',
  ADD COLUMN IF NOT EXISTS servidor_id UUID REFERENCES public.servidores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_profiles_servidor_id ON public.profiles(servidor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 4. Adicionar unique constraint no CPF (pode ser null para técnicos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_unique ON public.profiles(cpf) WHERE cpf IS NOT NULL;

-- 5. Migrar dados existentes - vincular profiles a servidores existentes via user_id
UPDATE public.profiles p
SET servidor_id = s.id,
    cpf = s.cpf,
    tipo_usuario = 'servidor'
FROM public.servidores s
WHERE s.user_id = p.id
  AND p.servidor_id IS NULL;

-- 6. Criar função para bloquear usuário quando servidor é inativado
CREATE OR REPLACE FUNCTION public.sync_usuario_servidor_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando servidor é exonerado, desligado ou falecido, bloqueia o usuário
  IF NEW.situacao IN ('exonerado', 'desligado', 'falecido') 
     AND OLD.situacao NOT IN ('exonerado', 'desligado', 'falecido') THEN
    UPDATE public.profiles
    SET is_active = false,
        blocked_at = now(),
        blocked_reason = 'Servidor ' || NEW.situacao || ' em ' || now()::date
    WHERE servidor_id = NEW.id;
  -- Quando servidor é reativado
  ELSIF NEW.situacao = 'ativo' AND OLD.situacao IN ('exonerado', 'desligado') THEN
    UPDATE public.profiles
    SET is_active = true,
        blocked_at = NULL,
        blocked_reason = NULL
    WHERE servidor_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Criar trigger para sincronizar status
DROP TRIGGER IF EXISTS trigger_sync_usuario_servidor ON public.servidores;
CREATE TRIGGER trigger_sync_usuario_servidor
  AFTER UPDATE OF situacao ON public.servidores
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_usuario_servidor_status();

-- 8. Criar função para herdar permissões do cargo/setor
CREATE OR REPLACE FUNCTION public.get_permissions_from_servidor(_user_id UUID)
RETURNS app_permission[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_servidor RECORD;
  v_permissions app_permission[] := ARRAY[]::app_permission[];
  v_role app_role;
BEGIN
  -- Buscar dados do servidor vinculado
  SELECT s.cargo_atual_id, s.unidade_atual_id, c.nome as cargo_nome
  INTO v_servidor
  FROM public.profiles p
  JOIN public.servidores s ON s.id = p.servidor_id
  LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
  WHERE p.id = _user_id;
  
  -- Se não tem servidor vinculado, retorna vazio
  IF v_servidor IS NULL THEN
    RETURN v_permissions;
  END IF;
  
  -- Buscar role do usuário
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Buscar permissões baseadas no role
  SELECT ARRAY_AGG(DISTINCT rp.permission) INTO v_permissions
  FROM public.role_permissions rp
  WHERE rp.role = v_role;
  
  RETURN COALESCE(v_permissions, ARRAY[]::app_permission[]);
END;
$$;

-- 9. Criar função para validar criação de usuário
CREATE OR REPLACE FUNCTION public.validate_user_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se é usuário do tipo servidor, deve ter servidor_id
  IF NEW.tipo_usuario = 'servidor' AND NEW.servidor_id IS NULL THEN
    RAISE EXCEPTION 'Usuário do tipo servidor deve ter um servidor vinculado';
  END IF;
  
  -- CPF é obrigatório para usuários do tipo servidor
  IF NEW.tipo_usuario = 'servidor' AND (NEW.cpf IS NULL OR NEW.cpf = '') THEN
    -- Tentar buscar CPF do servidor
    SELECT cpf INTO NEW.cpf
    FROM public.servidores
    WHERE id = NEW.servidor_id;
    
    IF NEW.cpf IS NULL THEN
      RAISE EXCEPTION 'CPF é obrigatório para usuários do tipo servidor';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Criar trigger de validação
DROP TRIGGER IF EXISTS trigger_validate_user_creation ON public.profiles;
CREATE TRIGGER trigger_validate_user_creation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_creation();

-- 11. Criar view para facilitar consultas de usuários
CREATE OR REPLACE VIEW public.v_usuarios_sistema AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.tipo_usuario,
  p.is_active,
  p.blocked_at,
  p.blocked_reason,
  p.cpf,
  p.created_at,
  p.servidor_id,
  s.nome_completo as servidor_nome,
  s.matricula as servidor_matricula,
  s.situacao as servidor_situacao,
  s.vinculo as servidor_vinculo,
  c.nome as cargo_nome,
  eo.nome as unidade_nome,
  ur.role as user_role
FROM public.profiles p
LEFT JOIN public.servidores s ON s.id = p.servidor_id
LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
LEFT JOIN public.estrutura_organizacional eo ON eo.id = s.unidade_atual_id
LEFT JOIN public.user_roles ur ON ur.user_id = p.id;

-- 12. RLS para a view (criando policies na tabela base)
-- As policies já existentes em profiles continuam valendo

-- 13. Função para criar usuário a partir de servidor
CREATE OR REPLACE FUNCTION public.criar_usuario_para_servidor(
  p_servidor_id UUID,
  p_email TEXT,
  p_role app_role DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_servidor RECORD;
  v_user_id UUID;
BEGIN
  -- Buscar dados do servidor
  SELECT id, nome_completo, cpf, email_institucional, email_pessoal
  INTO v_servidor
  FROM public.servidores
  WHERE id = p_servidor_id;
  
  IF v_servidor IS NULL THEN
    RAISE EXCEPTION 'Servidor não encontrado';
  END IF;
  
  -- Verificar se já existe usuário para este servidor
  IF EXISTS (SELECT 1 FROM public.profiles WHERE servidor_id = p_servidor_id) THEN
    RAISE EXCEPTION 'Já existe um usuário vinculado a este servidor';
  END IF;
  
  -- Verificar se email já está em uso
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso por outro usuário';
  END IF;
  
  -- Retornar dados para criação via Supabase Auth (feito no frontend)
  RETURN p_servidor_id;
END;
$$;

-- 14. Função para listar usuários técnicos (para relatórios que excluem técnicos)
CREATE OR REPLACE FUNCTION public.is_usuario_tecnico(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tipo_usuario = 'tecnico'
  FROM public.profiles
  WHERE id = _user_id
$$;
