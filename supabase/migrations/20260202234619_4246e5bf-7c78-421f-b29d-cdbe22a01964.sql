
-- ============================================================================
-- PATCH DE CORREÇÃO: Camada Base de Parametrização do RH
-- Versão: 1.0.1 | Data: 2026-02-02
-- Objetivo: Corrigir inconsistências de segurança, integridade e constraints
-- ============================================================================

-- ============================================================================
-- 1️⃣ CRIAR CONSTRAINT UNIQUE PARA EVITAR CONFLITOS EM config_parametros_valores
-- ============================================================================
-- Problema: ON CONFLICT sem constraint adequada
-- Solução: Criar índice UNIQUE que considera todos os critérios de unicidade
-- Nota: Usando COALESCE para permitir NULL nas colunas opcionais

CREATE UNIQUE INDEX IF NOT EXISTS idx_config_parametros_valores_unicidade
ON public.config_parametros_valores (
  instituicao_id,
  parametro_codigo,
  COALESCE(unidade_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(tipo_servidor, '__NULL__'),
  COALESCE(servidor_id, '00000000-0000-0000-0000-000000000000'::uuid),
  vigencia_inicio
);

COMMENT ON INDEX idx_config_parametros_valores_unicidade IS 
  'Garante unicidade de parâmetros por instituição, código, contexto hierárquico e vigência. Suporta ON CONFLICT para upserts.';

-- ============================================================================
-- 2️⃣ ENDURECER POLÍTICAS DE RLS - REMOVER PERMISSIVIDADE EXCESSIVA
-- ============================================================================

-- 2.1. config_institucional: SELECT não deve ser público
DROP POLICY IF EXISTS "config_institucional_select" ON public.config_institucional;

CREATE POLICY "config_institucional_select"
ON public.config_institucional
FOR SELECT
TO authenticated
USING (
  -- Apenas usuários autenticados com permissão de admin ou admin.config
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
);

COMMENT ON POLICY "config_institucional_select" ON public.config_institucional IS
  'Restringe leitura de dados institucionais apenas para admins ou usuários com permissão admin.config';

-- 2.2. config_parametros_meta: SELECT restrito a admins
DROP POLICY IF EXISTS "config_parametros_meta_select" ON public.config_parametros_meta;

CREATE POLICY "config_parametros_meta_select"
ON public.config_parametros_meta
FOR SELECT
TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
);

COMMENT ON POLICY "config_parametros_meta_select" ON public.config_parametros_meta IS
  'Restringe leitura de metadados de parâmetros apenas para admins ou usuários com permissão admin.config';

-- 2.3. config_parametros_valores: SELECT restrito a admins
DROP POLICY IF EXISTS "config_parametros_valores_select" ON public.config_parametros_valores;

CREATE POLICY "config_parametros_valores_select"
ON public.config_parametros_valores
FOR SELECT
TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
);

COMMENT ON POLICY "config_parametros_valores_select" ON public.config_parametros_valores IS
  'Restringe leitura de valores de parâmetros apenas para admins ou usuários com permissão admin.config';

-- ============================================================================
-- 3️⃣ AJUSTAR POLICIES FOR ALL - ADICIONAR WITH CHECK
-- ============================================================================

-- 3.1. config_institucional: Atualizar policy ALL para incluir WITH CHECK
DROP POLICY IF EXISTS "config_institucional_all" ON public.config_institucional;

CREATE POLICY "config_institucional_admin_write"
ON public.config_institucional
FOR ALL
TO authenticated
USING (usuario_eh_admin(auth.uid()))
WITH CHECK (usuario_eh_admin(auth.uid()));

COMMENT ON POLICY "config_institucional_admin_write" ON public.config_institucional IS
  'Permite operações completas apenas para admins, com verificação de escrita';

-- 3.2. config_parametros_meta: Atualizar policy ALL para incluir WITH CHECK
DROP POLICY IF EXISTS "config_parametros_meta_all" ON public.config_parametros_meta;

CREATE POLICY "config_parametros_meta_admin_write"
ON public.config_parametros_meta
FOR ALL
TO authenticated
USING (usuario_eh_admin(auth.uid()))
WITH CHECK (usuario_eh_admin(auth.uid()));

COMMENT ON POLICY "config_parametros_meta_admin_write" ON public.config_parametros_meta IS
  'Permite operações completas apenas para admins, com verificação de escrita';

-- 3.3. config_parametros_valores: Atualizar policies INSERT e UPDATE com WITH CHECK adequado
DROP POLICY IF EXISTS "config_parametros_valores_insert" ON public.config_parametros_valores;
DROP POLICY IF EXISTS "config_parametros_valores_update" ON public.config_parametros_valores;

CREATE POLICY "config_parametros_valores_insert"
ON public.config_parametros_valores
FOR INSERT
TO authenticated
WITH CHECK (
  usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR usuario_eh_admin(auth.uid())
);

CREATE POLICY "config_parametros_valores_update"
ON public.config_parametros_valores
FOR UPDATE
TO authenticated
USING (
  usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR usuario_eh_admin(auth.uid())
)
WITH CHECK (
  usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR usuario_eh_admin(auth.uid())
);

-- 3.4. Adicionar política DELETE explícita (não existia)
CREATE POLICY "config_parametros_valores_delete"
ON public.config_parametros_valores
FOR DELETE
TO authenticated
USING (
  -- Apenas super_admin pode excluir (mais restritivo)
  usuario_eh_super_admin(auth.uid())
);

COMMENT ON POLICY "config_parametros_valores_delete" ON public.config_parametros_valores IS
  'Apenas super_admin pode excluir valores de parâmetros (operação crítica)';

-- ============================================================================
-- 4️⃣ VALIDAR INTEGRIDADE DE VIGÊNCIA - ADICIONAR CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE public.config_parametros_valores
ADD CONSTRAINT chk_vigencia_valida
CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio);

COMMENT ON CONSTRAINT chk_vigencia_valida ON public.config_parametros_valores IS
  'Garante que a data de fim de vigência não seja anterior à data de início';

-- ============================================================================
-- 5️⃣ GARANTIR COMPATIBILIDADE COM AUDITORIA EXISTENTE
-- ============================================================================
-- VERIFICAÇÃO: audit_logs e audit_action JÁ EXISTEM no sistema
-- Não é necessário criar versões novas - apenas documentar a dependência

COMMENT ON TABLE public.config_parametros_valores IS
  'Valores dos parâmetros configuráveis com hierarquia e vigência temporal.
   DEPENDÊNCIA: Utiliza audit_logs e audit_action para registro de alterações.
   TRIGGER: trg_audit_parametros registra todas as modificações nesta tabela.';

-- ============================================================================
-- 6️⃣ AJUSTE NO TRIGGER DE AUDITORIA PARA USAR ENUM EXISTENTE
-- ============================================================================
-- O enum audit_action já possui os valores necessários: create, update, delete
-- Verificar e ajustar o trigger existente

CREATE OR REPLACE FUNCTION public.fn_audit_parametros()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action;
BEGIN
  -- Determinar a ação baseada no tipo de operação
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
  END IF;

  -- Inserir no audit_logs existente
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    module_name,
    description
  ) VALUES (
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    'config.parametros',
    format('Parâmetro %s: %s', 
      COALESCE(NEW.parametro_codigo, OLD.parametro_codigo),
      TG_OP
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION fn_audit_parametros IS
  'Registra alterações em parâmetros no audit_logs existente do sistema';

-- Recriar trigger (caso não exista)
DROP TRIGGER IF EXISTS trg_audit_parametros ON public.config_parametros_valores;

CREATE TRIGGER trg_audit_parametros
AFTER INSERT OR UPDATE OR DELETE ON public.config_parametros_valores
FOR EACH ROW
EXECUTE FUNCTION fn_audit_parametros();

-- ============================================================================
-- FIM DO PATCH DE CORREÇÃO
-- ============================================================================
