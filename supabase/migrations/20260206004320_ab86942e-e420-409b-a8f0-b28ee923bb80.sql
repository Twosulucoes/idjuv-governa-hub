-- ============================================
-- MIGRAÇÃO: COMPLETAR RESET DO RBAC (PARTE 2)
-- Backup da tabela existente e finalização
-- ============================================

-- Fazer backup da tabela usuario_modulos existente
ALTER TABLE IF EXISTS public.usuario_modulos RENAME TO _backup_usuario_modulos_old;

-- Criar a tabela usuario_modulos nova
CREATE TABLE public.usuario_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  modulo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, modulo)
);

-- RLS para usuario_modulos
ALTER TABLE public.usuario_modulos ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes se houver
DROP POLICY IF EXISTS "Usuario pode ver seus próprios módulos" ON public.usuario_modulos;
DROP POLICY IF EXISTS "Super admin pode gerenciar módulos de usuários" ON public.usuario_modulos;

-- Criar políticas
CREATE POLICY "Usuario pode ver seus próprios módulos"
  ON public.usuario_modulos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.usuario_eh_super_admin(auth.uid()));

CREATE POLICY "Super admin pode gerenciar módulos de usuários"
  ON public.usuario_modulos FOR ALL
  TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()))
  WITH CHECK (public.usuario_eh_super_admin(auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuario_modulos_user ON public.usuario_modulos(user_id);
CREATE INDEX IF NOT EXISTS idx_usuario_modulos_modulo ON public.usuario_modulos(modulo);