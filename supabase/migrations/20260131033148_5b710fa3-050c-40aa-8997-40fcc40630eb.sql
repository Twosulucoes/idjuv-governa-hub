-- ============================================================
-- ETAPA 3 - FASE 2: RLS DENY-BY-DEFAULT
-- Tabelas: funcoes_sistema, perfil_funcoes, audit_logs
-- ============================================================

-- ============================================================
-- 1. PUBLIC.FUNCOES_SISTEMA
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.funcoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes_sistema FORCE ROW LEVEL SECURITY;

-- Remover policies antigas/permissivas
DROP POLICY IF EXISTS "funcoes_sistema_select" ON public.funcoes_sistema;
DROP POLICY IF EXISTS "funcoes_sistema_insert" ON public.funcoes_sistema;
DROP POLICY IF EXISTS "funcoes_sistema_update" ON public.funcoes_sistema;
DROP POLICY IF EXISTS "funcoes_sistema_delete" ON public.funcoes_sistema;
DROP POLICY IF EXISTS "Anyone can view active funcoes" ON public.funcoes_sistema;
DROP POLICY IF EXISTS "Admins can manage funcoes" ON public.funcoes_sistema;

-- SELECT: super_admin, admin.permissoes.visualizar, ou permissões próprias do usuário
CREATE POLICY "funcoes_sistema_select" ON public.funcoes_sistema
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver tudo
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão admin.permissoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'admin.permissoes.visualizar')
  OR
  -- Usuário pode ver funções dos seus próprios perfis (para UI)
  EXISTS (
    SELECT 1 
    FROM public.usuario_perfis up
    JOIN public.perfil_funcoes pf ON pf.perfil_id = up.perfil_id
    WHERE up.user_id = auth.uid()
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND pf.funcao_id = funcoes_sistema.id
      AND pf.concedido = true
  )
);

-- INSERT: apenas super_admin
CREATE POLICY "funcoes_sistema_insert" ON public.funcoes_sistema
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
);

-- UPDATE: apenas super_admin
CREATE POLICY "funcoes_sistema_update" ON public.funcoes_sistema
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
);

-- DELETE: apenas super_admin
CREATE POLICY "funcoes_sistema_delete" ON public.funcoes_sistema
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
);

-- ============================================================
-- 2. PUBLIC.PERFIL_FUNCOES
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.perfil_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_funcoes FORCE ROW LEVEL SECURITY;

-- Remover policies antigas/permissivas
DROP POLICY IF EXISTS "perfil_funcoes_select" ON public.perfil_funcoes;
DROP POLICY IF EXISTS "perfil_funcoes_insert" ON public.perfil_funcoes;
DROP POLICY IF EXISTS "perfil_funcoes_update" ON public.perfil_funcoes;
DROP POLICY IF EXISTS "perfil_funcoes_delete" ON public.perfil_funcoes;
DROP POLICY IF EXISTS "Anyone can view perfil_funcoes" ON public.perfil_funcoes;
DROP POLICY IF EXISTS "Admins can manage perfil_funcoes" ON public.perfil_funcoes;

-- SELECT: super_admin, admin.permissoes.visualizar, ou próprias permissões
CREATE POLICY "perfil_funcoes_select" ON public.perfil_funcoes
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver tudo
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão admin.permissoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'admin.permissoes.visualizar')
  OR
  -- Usuário pode ver apenas linhas dos perfis que ele possui
  EXISTS (
    SELECT 1 
    FROM public.usuario_perfis up
    WHERE up.user_id = auth.uid()
      AND up.perfil_id = perfil_funcoes.perfil_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
  )
);

-- INSERT: super_admin ou admin.permissoes.gerenciar
CREATE POLICY "perfil_funcoes_insert" ON public.perfil_funcoes
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'admin.permissoes.gerenciar')
);

-- UPDATE: super_admin ou admin.permissoes.gerenciar
CREATE POLICY "perfil_funcoes_update" ON public.perfil_funcoes
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'admin.permissoes.gerenciar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'admin.permissoes.gerenciar')
);

-- DELETE: super_admin ou admin.permissoes.gerenciar
CREATE POLICY "perfil_funcoes_delete" ON public.perfil_funcoes
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'admin.permissoes.gerenciar')
);

-- ============================================================
-- 3. PUBLIC.AUDIT_LOGS
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- Remover policies antigas/permissivas
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit_logs" ON public.audit_logs;

-- SELECT: super_admin, admin.auditoria.visualizar, ou próprios logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver tudo
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão admin.auditoria.visualizar
  public.usuario_tem_permissao(auth.uid(), 'admin.auditoria.visualizar')
  OR
  -- Usuário pode ver seus próprios logs
  user_id = auth.uid()
);

-- INSERT: sempre permitido para authenticated (para triggers/funções)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE: NINGUÉM pode (logs são imutáveis)
CREATE POLICY "audit_logs_update" ON public.audit_logs
FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

-- DELETE: NINGUÉM pode (logs são imutáveis)
CREATE POLICY "audit_logs_delete" ON public.audit_logs
FOR DELETE TO authenticated
USING (false);

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================