-- ============================================
-- IDJuv - Schema de Migração
-- Arquivo 05: Políticas RLS
-- ============================================
-- Execute APÓS 04_triggers.sql
-- ============================================

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composicao_cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_funcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias_servidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_ficha_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bancos_cnab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA PROFILES
-- ============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.usuario_eh_admin(auth.uid()));

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Admins podem gerenciar todos os perfis
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA SISTEMA DE PERMISSÕES
-- ============================================

-- Perfis - leitura para autenticados
CREATE POLICY "Authenticated can read perfis"
ON public.perfis FOR SELECT
TO authenticated
USING (true);

-- Perfis - gerenciamento apenas para admins
CREATE POLICY "Admins can manage perfis"
ON public.perfis FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Funções do sistema - leitura para autenticados
CREATE POLICY "Authenticated can read funcoes_sistema"
ON public.funcoes_sistema FOR SELECT
TO authenticated
USING (true);

-- Funções do sistema - gerenciamento apenas para admins
CREATE POLICY "Admins can manage funcoes_sistema"
ON public.funcoes_sistema FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Perfil_funcoes - leitura para autenticados
CREATE POLICY "Authenticated can read perfil_funcoes"
ON public.perfil_funcoes FOR SELECT
TO authenticated
USING (true);

-- Perfil_funcoes - gerenciamento apenas para admins
CREATE POLICY "Admins can manage perfil_funcoes"
ON public.perfil_funcoes FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Usuario_perfis - leitura para autenticados
CREATE POLICY "Authenticated can read usuario_perfis"
ON public.usuario_perfis FOR SELECT
TO authenticated
USING (true);

-- Usuario_perfis - gerenciamento apenas para admins
CREATE POLICY "Admins can manage usuario_perfis"
ON public.usuario_perfis FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA ESTRUTURA ORGANIZACIONAL
-- ============================================

-- Estrutura - leitura pública para autenticados
CREATE POLICY "Authenticated can read estrutura"
ON public.estrutura_organizacional FOR SELECT
TO authenticated
USING (true);

-- Estrutura - gerenciamento apenas para admins
CREATE POLICY "Admins can manage estrutura"
ON public.estrutura_organizacional FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Cargos - leitura pública para autenticados
CREATE POLICY "Authenticated can read cargos"
ON public.cargos FOR SELECT
TO authenticated
USING (true);

-- Cargos - gerenciamento apenas para admins
CREATE POLICY "Admins can manage cargos"
ON public.cargos FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Composição de cargos - leitura para autenticados
CREATE POLICY "Authenticated can read composicao_cargos"
ON public.composicao_cargos FOR SELECT
TO authenticated
USING (true);

-- Composição de cargos - gerenciamento para admins
CREATE POLICY "Admins can manage composicao_cargos"
ON public.composicao_cargos FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA SERVIDORES E RH
-- ============================================

-- Servidores - leitura para autenticados
CREATE POLICY "Authenticated can read servidores"
ON public.servidores FOR SELECT
TO authenticated
USING (true);

-- Servidores - gerenciamento apenas para admins
CREATE POLICY "Admins can manage servidores"
ON public.servidores FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Lotações - leitura para autenticados
CREATE POLICY "Authenticated can read lotacoes"
ON public.lotacoes FOR SELECT
TO authenticated
USING (true);

-- Lotações - gerenciamento para admins
CREATE POLICY "Admins can manage lotacoes"
ON public.lotacoes FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Provimentos - leitura para autenticados
CREATE POLICY "Authenticated can read provimentos"
ON public.provimentos FOR SELECT
TO authenticated
USING (true);

-- Provimentos - gerenciamento para admins
CREATE POLICY "Admins can manage provimentos"
ON public.provimentos FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Designações - leitura para autenticados
CREATE POLICY "Authenticated can read designacoes"
ON public.designacoes FOR SELECT
TO authenticated
USING (true);

-- Designações - gerenciamento para admins
CREATE POLICY "Admins can manage designacoes"
ON public.designacoes FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Vínculos funcionais - leitura para autenticados
CREATE POLICY "Authenticated can read vinculos_funcionais"
ON public.vinculos_funcionais FOR SELECT
TO authenticated
USING (true);

-- Vínculos funcionais - gerenciamento para admins
CREATE POLICY "Admins can manage vinculos_funcionais"
ON public.vinculos_funcionais FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Férias - leitura para autenticados
CREATE POLICY "Authenticated can read ferias"
ON public.ferias_servidor FOR SELECT
TO authenticated
USING (true);

-- Férias - gerenciamento para admins
CREATE POLICY "Admins can manage ferias"
ON public.ferias_servidor FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA UNIDADES LOCAIS
-- ============================================

-- Unidades locais - leitura pública
CREATE POLICY "Public can read unidades_locais"
ON public.unidades_locais FOR SELECT
TO authenticated
USING (true);

-- Unidades locais - gerenciamento para admins
CREATE POLICY "Admins can manage unidades_locais"
ON public.unidades_locais FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA FINANCEIRO
-- ============================================

-- Rubricas - leitura para autenticados
CREATE POLICY "Authenticated can read rubricas"
ON public.rubricas FOR SELECT
TO authenticated
USING (true);

-- Rubricas - gerenciamento para admins
CREATE POLICY "Admins can manage rubricas"
ON public.rubricas FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Folhas de pagamento - leitura para autenticados
CREATE POLICY "Authenticated can read folhas_pagamento"
ON public.folhas_pagamento FOR SELECT
TO authenticated
USING (true);

-- Folhas de pagamento - gerenciamento para admins
CREATE POLICY "Admins can manage folhas_pagamento"
ON public.folhas_pagamento FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Fichas financeiras - servidor vê a própria
CREATE POLICY "Servidor can view own ficha"
ON public.fichas_financeiras FOR SELECT
TO authenticated
USING (
  servidor_id IN (
    SELECT servidor_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Fichas financeiras - admins veem todas
CREATE POLICY "Admins can view all fichas"
ON public.fichas_financeiras FOR SELECT
TO authenticated
USING (public.usuario_eh_admin(auth.uid()));

-- Fichas financeiras - gerenciamento para admins
CREATE POLICY "Admins can manage fichas"
ON public.fichas_financeiras FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Itens ficha financeira - seguem regra da ficha
CREATE POLICY "View itens based on ficha access"
ON public.itens_ficha_financeira FOR SELECT
TO authenticated
USING (
  ficha_id IN (
    SELECT id FROM public.fichas_financeiras ff
    WHERE ff.servidor_id IN (
      SELECT servidor_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  OR public.usuario_eh_admin(auth.uid())
);

-- Itens ficha financeira - gerenciamento para admins
CREATE POLICY "Admins can manage itens_ficha"
ON public.itens_ficha_financeira FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- Bancos CNAB - leitura para autenticados
CREATE POLICY "Authenticated can read bancos_cnab"
ON public.bancos_cnab FOR SELECT
TO authenticated
USING (true);

-- Bancos CNAB - gerenciamento para admins
CREATE POLICY "Admins can manage bancos_cnab"
ON public.bancos_cnab FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA AUDITORIA
-- ============================================

-- Audit logs - leitura apenas para admins
CREATE POLICY "Admins can view audit_logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.usuario_eh_admin(auth.uid()));

-- Audit logs - inserção permitida para sistema
CREATE POLICY "System can insert audit_logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Audit logs - não podem ser alterados ou deletados
-- (sem política de UPDATE ou DELETE)

-- ============================================
-- FIM DO ARQUIVO 05_rls_policies.sql
-- Próximo: 06_dados_iniciais.sql
-- ============================================
