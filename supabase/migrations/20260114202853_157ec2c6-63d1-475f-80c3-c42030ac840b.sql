-- Adicionar campo de indicação (apenas admins podem ver/editar)
ALTER TABLE public.servidores 
ADD COLUMN IF NOT EXISTS indicacao TEXT;

-- Comentário para documentar o campo sensível
COMMENT ON COLUMN public.servidores.indicacao IS 'Campo estratégico de indicação - acesso restrito a administradores';

-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.can_view_indicacao(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'ti_admin', 'presidencia')
  )
$$;