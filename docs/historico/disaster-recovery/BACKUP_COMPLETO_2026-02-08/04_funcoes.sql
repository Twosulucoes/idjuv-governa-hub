-- ============================================================
-- IDJUV - BACKUP COMPLETO - FUNÇÕES
-- Gerado em: 2026-02-08
-- Total: 100+ funções
-- ============================================================

-- ============================================
-- FUNÇÕES DE AUTENTICAÇÃO E AUTORIZAÇÃO
-- ============================================

-- Verifica se usuário tem role específica (versão com 2 params)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Verifica se usuário autenticado tem role (versão com 1 param)
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- Verifica se usuário tem permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission app_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
    UNION
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;

-- Verifica se usuário tem módulo específico
CREATE OR REPLACE FUNCTION public.has_module(_module app_module)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_modules
    WHERE user_id = auth.uid()
      AND module = _module
      AND ativo = true
  )
$$;

-- Verifica se é usuário admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'admin'
  )
$$;

-- Verifica se usuário está ativo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- Verifica se usuário eh admin (alias brasileiro)
CREATE OR REPLACE FUNCTION public.usuario_eh_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user(_user_id)
$$;

-- Verifica se é super admin
CREATE OR REPLACE FUNCTION public.usuario_eh_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user(_user_id)
$$;

-- Retorna role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Pode aprovar solicitações
CREATE OR REPLACE FUNCTION public.can_approve(_user_id UUID, _module_name VARCHAR DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin'::app_role)
    OR public.has_permission(_user_id, 'requests.approve'::app_permission)
    OR EXISTS (
      SELECT 1 FROM public.approval_delegations
      WHERE delegate_id = _user_id
        AND is_active = true
        AND NOW() BETWEEN valid_from AND valid_until
        AND (module_name IS NULL OR approval_delegations.module_name = _module_name)
    )
$$;

-- Pode acessar módulo
CREATE OR REPLACE FUNCTION public.can_access_module(_module app_module)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_user() 
    AND (public.has_role('admin') OR public.has_module(_module));
$$;

-- ============================================
-- FUNÇÕES DE TRIGGER
-- ============================================

-- Atualiza coluna updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handler para novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.user_security_settings (user_id, force_password_change)
  VALUES (NEW.id, true)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- FUNÇÕES DE AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit(
  _action audit_action,
  _entity_type VARCHAR DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _module_name VARCHAR DEFAULT NULL,
  _before_data JSONB DEFAULT NULL,
  _after_data JSONB DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
BEGIN
  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  SELECT unidade_id INTO _user_org_unit
  FROM public.user_org_units
  WHERE user_id = auth.uid() AND is_primary = true
  LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _metadata,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Auditoria de mudanças de permissão
CREATE OR REPLACE FUNCTION public.audit_permission_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    description
  )
  VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::uuid,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid(),
    'Alteração em ' || TG_TABLE_NAME
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================
-- FUNÇÕES DE CÁLCULO
-- ============================================

CREATE OR REPLACE FUNCTION public.calcular_horas_trabalhadas(
  p_entrada1 TIMESTAMPTZ, 
  p_saida1 TIMESTAMPTZ, 
  p_entrada2 TIMESTAMPTZ, 
  p_saida2 TIMESTAMPTZ, 
  p_entrada3 TIMESTAMPTZ DEFAULT NULL, 
  p_saida3 TIMESTAMPTZ DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_minutos INTEGER := 0;
BEGIN
  IF p_entrada1 IS NOT NULL AND p_saida1 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida1 - p_entrada1)) / 60;
  END IF;
  
  IF p_entrada2 IS NOT NULL AND p_saida2 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida2 - p_entrada2)) / 60;
  END IF;
  
  IF p_entrada3 IS NOT NULL AND p_saida3 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida3 - p_entrada3)) / 60;
  END IF;
  
  RETURN ROUND(total_minutos / 60.0, 2);
END;
$$;

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Lista tabelas públicas para backup
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name TEXT, row_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  cnt BIGINT;
BEGIN
  FOR r IN
    SELECT t.table_name::TEXT as tbl
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE '_realtime%'
      AND t.table_name NOT IN ('schema_migrations', 'supabase_functions_migrations')
    ORDER BY t.table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', r.tbl) INTO cnt;
    table_name := r.tbl;
    row_count := cnt;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Gerar protocolo para agenda
CREATE OR REPLACE FUNCTION public.gerar_protocolo_agenda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano INTEGER;
  v_sequencia INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_protocolo, '/', 1) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.agenda_unidade
  WHERE numero_protocolo LIKE '%/' || v_ano;
  
  NEW.numero_protocolo := LPAD(v_sequencia::TEXT, 4, '0') || '/' || v_ano;
  
  RETURN NEW;
END;
$$;

-- Gerar código para unidades locais
CREATE OR REPLACE FUNCTION public.gerar_codigo_unidade_local()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefixo TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_prefixo := CASE NEW.tipo_unidade
    WHEN 'ginasio' THEN 'GIN'
    WHEN 'estadio' THEN 'EST'
    WHEN 'parque_aquatico' THEN 'PAQ'
    WHEN 'piscina' THEN 'PIS'
    WHEN 'complexo' THEN 'CPX'
    WHEN 'quadra' THEN 'QUA'
    ELSE 'OUT'
  END;
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codigo_unidade, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.unidades_locais
  WHERE codigo_unidade LIKE v_prefixo || '-' || v_ano || '-%';
  
  NEW.codigo_unidade := v_prefixo || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- FIM: 04_funcoes.sql
-- Próximo: 05_views.sql
-- ============================================================
