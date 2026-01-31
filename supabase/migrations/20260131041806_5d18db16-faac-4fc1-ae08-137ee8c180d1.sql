-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- MÓDULO: FEDERAÇÕES ESPORTIVAS
-- Tabelas: federacoes_esportivas, calendario_federacao
-- ============================================================

-- ============================================================
-- TABELA 1: public.federacoes_esportivas (Cadastro Principal)
-- Tabela de médio risco - dados institucionais de federações
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.federacoes_esportivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.federacoes_esportivas FORCE ROW LEVEL SECURITY;

-- Remover policies antigas/permissivas
DROP POLICY IF EXISTS "federacoes_esportivas_select" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "federacoes_esportivas_insert" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "federacoes_esportivas_update" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "federacoes_esportivas_delete" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Anyone can view federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Authenticated users can view federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Admins can manage federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Authenticated can insert federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Authenticated can update federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Authenticated can delete federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Gestores podem gerenciar federacoes" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "federacoes_esportivas_policy" ON public.federacoes_esportivas;

-- ============================================================
-- SELECT: super_admin, permissão ou gestor de federações
-- ============================================================
CREATE POLICY "federacoes_esportivas_select" ON public.federacoes_esportivas
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão federacoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'federacoes.visualizar')
  OR
  -- Gestores de federações
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
);

-- ============================================================
-- INSERT: super_admin ou quem tem permissão criar/gerenciar
-- NÃO permitir autosserviço público
-- ============================================================
CREATE POLICY "federacoes_esportivas_insert" ON public.federacoes_esportivas
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.criar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
);

-- ============================================================
-- UPDATE: super_admin ou gestores de federações
-- ============================================================
CREATE POLICY "federacoes_esportivas_update" ON public.federacoes_esportivas
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
);

-- ============================================================
-- DELETE: Apenas super_admin
-- Federações devem ser preservadas para histórico
-- ============================================================
CREATE POLICY "federacoes_esportivas_delete" ON public.federacoes_esportivas
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
);

-- ============================================================
-- TABELA 2: public.calendario_federacao (Eventos/Competições)
-- Tabela de baixo risco - calendário de eventos esportivos
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.calendario_federacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_federacao FORCE ROW LEVEL SECURITY;

-- Remover policies antigas/permissivas
DROP POLICY IF EXISTS "calendario_federacao_select" ON public.calendario_federacao;
DROP POLICY IF EXISTS "calendario_federacao_insert" ON public.calendario_federacao;
DROP POLICY IF EXISTS "calendario_federacao_update" ON public.calendario_federacao;
DROP POLICY IF EXISTS "calendario_federacao_delete" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Anyone can view calendario" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Authenticated users can view calendario" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Admins can manage calendario" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Authenticated can insert calendario" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Authenticated can update calendario" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Authenticated can delete calendario" ON public.calendario_federacao;
DROP POLICY IF EXISTS "Gestores podem gerenciar calendario" ON public.calendario_federacao;

-- ============================================================
-- SELECT: super_admin, permissão ou gestor
-- Calendário pode ser consultado por quem gerencia federações
-- ============================================================
CREATE POLICY "calendario_federacao_select" ON public.calendario_federacao
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todos
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão federacoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'federacoes.visualizar')
  OR
  -- Gestores de federações
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
  OR
  -- Criador do evento
  created_by = auth.uid()
);

-- ============================================================
-- INSERT: super_admin ou quem tem permissão gerenciar
-- ============================================================
CREATE POLICY "calendario_federacao_insert" ON public.calendario_federacao
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
  OR
  -- Quem tem permissão de criar pode criar
  public.usuario_tem_permissao(auth.uid(), 'federacoes.criar')
);

-- ============================================================
-- UPDATE: super_admin, gestor ou criador do evento
-- ============================================================
CREATE POLICY "calendario_federacao_update" ON public.calendario_federacao
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
  OR
  -- Criador pode atualizar seus eventos
  created_by = auth.uid()
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'federacoes.gerenciar')
  OR
  created_by = auth.uid()
);

-- ============================================================
-- DELETE: NÃO PERMITIDO
-- Eventos devem ser preservados para histórico esportivo
-- ============================================================
CREATE POLICY "calendario_federacao_delete" ON public.calendario_federacao
FOR DELETE TO authenticated
USING (false);

-- ============================================================
-- FIM DA MIGRAÇÃO - FEDERAÇÕES ESPORTIVAS
-- ============================================================