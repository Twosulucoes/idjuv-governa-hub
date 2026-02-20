
-- Drop todas as versões existentes das funções problemáticas
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (qual LIKE '%is_admin_user%' OR qual LIKE '%can_access_module%' 
         OR with_check LIKE '%is_admin_user%' OR with_check LIKE '%can_access_module%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Drop todas as variantes
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_module(uuid, app_module) CASCADE;
DROP FUNCTION IF EXISTS public.has_module(uuid, app_module) CASCADE;
DROP FUNCTION IF EXISTS public.is_user_active() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_active(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_modules() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_access_context() CASCADE;

-- Recria todas usando tipos corretos (app_module é enum existente)
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), false);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

-- Usa inline puro (sem chamar outras funções para evitar cascata)
CREATE OR REPLACE FUNCTION public.can_access_module(_user_id uuid, _module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), false)
    AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.user_modules WHERE user_id = _user_id AND module::text = _module)
    );
$$;

CREATE OR REPLACE FUNCTION public.has_module(_user_id uuid, _module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_modules WHERE user_id = _user_id AND module::text = _module);
$$;

CREATE OR REPLACE FUNCTION public.get_my_modules()
RETURNS TABLE(module text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT um.module::text FROM public.user_modules um
  WHERE um.user_id = auth.uid() 
  AND COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.get_my_access_context()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'is_active', COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false),
    'is_admin', EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'),
    'modules', (SELECT jsonb_agg(module::text) FROM public.user_modules WHERE user_id = auth.uid()),
    'roles', (SELECT jsonb_agg(role::text) FROM public.user_roles WHERE user_id = auth.uid())
  );
$$;

-- RLS sistema
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_system" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin_user(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY "profiles_insert_system" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "user_modules_select" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_insert" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_update" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_delete" ON public.user_modules;
CREATE POLICY "user_modules_select" ON public.user_modules FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY "user_modules_insert" ON public.user_modules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "user_modules_update" ON public.user_modules FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()));
CREATE POLICY "user_modules_delete" ON public.user_modules FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- RH
DO $$
DECLARE tbl text;
  rh_tables text[] := ARRAY['servidores','frequencias','ferias_programadas','portarias',
    'afastamentos','lotacoes','cargos','adicionais_tempo_servico','banco_horas',
    'rescisoes','historico_lotacao','contracheques'];
BEGIN
  FOREACH tbl IN ARRAY rh_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_insert" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_delete" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "rh_module_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "rh_module_write" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "rh_module_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "rh_module_delete" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "rh_module_select" ON public.%I FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(),''rh''))', tbl);
      EXECUTE format('CREATE POLICY "rh_module_write" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(),''rh''))', tbl);
      EXECUTE format('CREATE POLICY "rh_module_update" ON public.%I FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(),''rh''))', tbl);
      EXECUTE format('CREATE POLICY "rh_module_delete" ON public.%I FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(),''rh''))', tbl);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE tbl text;
  fin_tables text[] := ARRAY['empenhos','sub_empenhos','pagamentos','receitas',
    'orcamentos','dotacoes_orcamentarias','alteracoes_orcamentarias',
    'restos_a_pagar','fontes_recurso','diarias'];
BEGIN
  FOREACH tbl IN ARRAY fin_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_insert" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_delete" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "fin_module_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "fin_module_write" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "fin_module_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "fin_module_delete" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "fin_module_select" ON public.%I FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(),''financeiro''))', tbl);
      EXECUTE format('CREATE POLICY "fin_module_write" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(),''financeiro''))', tbl);
      EXECUTE format('CREATE POLICY "fin_module_update" ON public.%I FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(),''financeiro''))', tbl);
      EXECUTE format('CREATE POLICY "fin_module_delete" ON public.%I FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(),''financeiro''))', tbl);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE tbl text;
  comp_tables text[] := ARRAY['processos_licitatorios','itens_licitacao','fornecedores',
    'atas_registro_preco','contratos','aditivos_contrato','notas_contrato','medicoes_contrato'];
BEGIN
  FOREACH tbl IN ARRAY comp_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_insert" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_delete" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "comp_module_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "comp_module_write" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "comp_module_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "comp_module_delete" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "comp_module_select" ON public.%I FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(),''compras'') OR public.can_access_module(auth.uid(),''contratos''))', tbl);
      EXECUTE format('CREATE POLICY "comp_module_write" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(),''compras'') OR public.can_access_module(auth.uid(),''contratos''))', tbl);
      EXECUTE format('CREATE POLICY "comp_module_update" ON public.%I FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(),''compras'') OR public.can_access_module(auth.uid(),''contratos''))', tbl);
      EXECUTE format('CREATE POLICY "comp_module_delete" ON public.%I FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(),''compras'') OR public.can_access_module(auth.uid(),''contratos''))', tbl);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE tbl text;
  pat_tables text[] := ARRAY['bens_patrimoniais','movimentacoes_patrimonio','baixas_patrimonio',
    'inventarios_patrimonio','almoxarifados','itens_material','unidades_locais','inventario_offline_coletas','agenda_unidade'];
BEGIN
  FOREACH tbl IN ARRAY pat_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_insert" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_delete" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "pat_module_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "pat_module_write" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "pat_module_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "pat_module_delete" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "pat_module_select" ON public.%I FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(),''patrimonio'') OR public.can_access_module(auth.uid(),''patrimonio_mobile''))', tbl);
      EXECUTE format('CREATE POLICY "pat_module_write" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(),''patrimonio'') OR public.can_access_module(auth.uid(),''patrimonio_mobile''))', tbl);
      EXECUTE format('CREATE POLICY "pat_module_update" ON public.%I FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(),''patrimonio'') OR public.can_access_module(auth.uid(),''patrimonio_mobile''))', tbl);
      EXECUTE format('CREATE POLICY "pat_module_delete" ON public.%I FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(),''patrimonio'') OR public.can_access_module(auth.uid(),''patrimonio_mobile''))', tbl);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE tbl text;
  adm_tables text[] := ARRAY['audit_logs','backup_config','backup_history','backup_integrity_checks'];
BEGIN
  FOREACH tbl IN ARRAY adm_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_insert" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "acesso_total_delete" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "admin_only_select" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "admin_only_insert" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "admin_only_update" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "admin_only_delete" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "admin_only_select" ON public.%I FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()))', tbl);
      EXECUTE format('CREATE POLICY "admin_only_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()))', tbl);
      EXECUTE format('CREATE POLICY "admin_only_update" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()))', tbl);
      EXECUTE format('CREATE POLICY "admin_only_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()))', tbl);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
