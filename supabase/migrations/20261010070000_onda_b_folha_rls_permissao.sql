-- ============================================================================
-- Onda B / B1 — segurança da folha no banco: RLS por permissão, RPC com guarda e triggers
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-onda-b-folha-seguranca-design.md
-- Plano: docs/superpowers/plans/2026-10-10-onda-b-folha-seguranca.md
--
-- O estado do banco de produção é desconhecido e esta migração precisa valer nos DOIS estados
-- possíveis (premissa 1 da spec):
--
--   (a) banco construído do baseline (docs/NOVO_BANCO.md): policies `rls_*` por módulo, funções de
--       acesso corrigidas (overlay/10), `processar_folha_pagamento` SEM EXECUTE para authenticated;
--   (b) banco produzido só pelas migrações (replay): policies `acesso_total_*` (auth.uid() IS NOT NULL),
--       `has_role`/`has_module(app_module)`/`can_access_module(app_module)` são stubs que devolvem true
--       para qualquer logado, `usuario_eh_admin` não existe (os triggers de folha fechada quebram) e
--       `registrar_transicao_folha` lê `profiles.nome` (coluna inexistente: todo UPDATE em
--       folhas_pagamento falha).
--
-- Por isso tudo aqui é idempotente (CREATE OR REPLACE, DROP ... IF EXISTS, DO com checagem) e o bloco 1
-- recria as funções-base com o texto já revisado dos overlays do baseline (não inventa corpo novo):
-- no estado (a) é no-op; no estado (b), corrige. O CLI aplica o arquivo inteiro numa transação:
-- as policies novas só restringem depois do DROP das `acesso_total_*`, no mesmo commit.
--
-- Blocos:
--   1. funções-base (cópia textual de overlay/10_funcoes_acesso.sql e, da folha, overlay/18_funcoes_rpc.sql)
--   2. policies das 10 tabelas da folha — classe `permissao` do gerador (supabase/baseline/rls/mapa.csv):
--      leitura pelo módulo rh (fichas/itens também pelo próprio servidor); escrita só com
--      financeiro.folha.processar (operação) ou financeiro.folha.configurar (rubricas/parâmetros/tabelas)
--   3. processar_folha_pagamento: guarda has_permission_code + EXECUTE para authenticated (anon não)
--   4. folha fechada barra também o INSERT em fichas_financeiras e itens_ficha_financeira (42501)
--   5. índice único parcial para "Lançar na ficha" (só se não houver duplicata; senão WARNING)
--   6. auditoria (fn_audit_trigger) em folhas_pagamento, itens_ficha_financeira e consignacoes
--      (fichas_financeiras e dependentes_irrf ficam fora: dado bancário/CPF — premissa 6)
--   7. catálogo: os códigos financeiro.folha.* passam ao module_code 'rh' (não são renomeados)
--
-- Quem perde acesso: quem tem o módulo rh e escreve na folha SEM a permissão (direto na API). O papel
-- `user` (só visualizar) perde escrita; `manager` e `admin` não. Leitura não muda.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Funções-base (overlay/10_funcoes_acesso.sql — cópia textual)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.usuario_eh_super_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user(COALESCE(check_user_id, auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_module(_module public.app_module)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_module(auth.uid(), _module::text);
$$;

CREATE OR REPLACE FUNCTION public.can_access_module(_module public.app_module)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_access_module(auth.uid(), _module::text);
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(_user_id uuid, _codigo_funcao text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_permission_code(_user_id, _codigo_funcao);
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_permissao_financeira(p_user_id uuid, p_permissao character varying)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_permission_code(p_user_id, p_permissao::text);
$$;

CREATE OR REPLACE FUNCTION public.meu_servidor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT servidor_id FROM public.profiles WHERE id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role = 'admin' AND p.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_atual()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user(COALESCE(check_user_id, auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.has_permission_code(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.is_active FROM public.profiles p WHERE p.id = _user_id), false)
     AND (
       -- super admin passa por cima
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
       OR _permission = ANY (public.get_user_permission_codes(_user_id))
     );
$$;

-- is_active_user(uuid) (overlay/18, item M6): devolvia TRUE para perfil inexistente.
CREATE OR REPLACE FUNCTION public.is_active_user(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = p_user_id), false);
$$;

-- ---- folha (overlay/18_funcoes_rpc.sql — cópia textual) ----
-- registrar_transicao_folha: versão que lê profiles.full_name (a coluna `nome` não existe).
-- O trigger trg_registrar_transicao_folha (BEFORE UPDATE em folhas_pagamento) já existe nos dois estados.
CREATE OR REPLACE FUNCTION public.registrar_transicao_folha()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_nome TEXT;
BEGIN
  SELECT full_name INTO v_user_nome FROM public.profiles WHERE id = auth.uid();

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id, status_anterior, status_novo, usuario_id, usuario_nome, justificativa
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), v_user_nome,
      CASE
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );

    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := COALESCE(NEW.fechado_por, auth.uid());
      NEW.fechado_em := COALESCE(NEW.fechado_em, now());
    END IF;

    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := COALESCE(NEW.conferido_por, auth.uid());
      NEW.conferido_em := COALESCE(NEW.conferido_em, now());
    END IF;

    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := COALESCE(NEW.reaberto_por, auth.uid());
      NEW.reaberto_em := COALESCE(NEW.reaberto_em, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- folhas_proteger_fechamento: o UPDATE direto de `status` não contorna fechar_folha/reabrir_folha.
-- Vale só para quem age como authenticated/anon (RPCs SECURITY DEFINER e service role passam).
CREATE OR REPLACE FUNCTION public.folhas_proteger_fechamento()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'fechada' AND NOT public.usuario_pode_fechar_folha(auth.uid()) THEN
      RAISE EXCEPTION 'Sem permissão para fechar a folha' USING ERRCODE = '42501';
    END IF;
    IF (NEW.status = 'reaberta' OR OLD.status = 'fechada') AND NOT public.usuario_pode_reabrir_folha(auth.uid()) THEN
      RAISE EXCEPTION 'Apenas administradores reabrem folhas' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS folhas_proteger_fechamento ON public.folhas_pagamento;
CREATE TRIGGER folhas_proteger_fechamento
  BEFORE UPDATE ON public.folhas_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.folhas_proteger_fechamento();

-- fechar_folha / reabrir_folha: auditoria com entity_id uuid (antes gravava texto e falhava).
CREATE OR REPLACE FUNCTION public.fechar_folha(p_folha_id uuid, p_justificativa text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar permissão
  IF NOT public.usuario_pode_fechar_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para fechar folha');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status = 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha já está fechada');
  END IF;
  
  IF v_folha.status NOT IN ('processando', 'aberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar em conferência ou aberta para ser fechada');
  END IF;
  
  -- Atualizar para fechada
  UPDATE public.folhas_pagamento
  SET 
    status = 'fechada',
    fechado_por = v_user_id,
    fechado_em = now(),
    justificativa_fechamento = p_justificativa,
    data_fechamento = now()
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'folha',
    format('Folha %s/%s fechada. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, COALESCE(p_justificativa, 'Sem justificativa')),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha fechada com sucesso');
END;
$function$;

CREATE OR REPLACE FUNCTION public.reabrir_folha(p_folha_id uuid, p_justificativa text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Justificativa obrigatória
  IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabrir folha');
  END IF;
  
  -- Verificar permissão (apenas super_admin)
  IF NOT public.usuario_pode_reabrir_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super administradores podem reabrir folhas');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;
  
  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'folha',
    format('Folha %s/%s REABERTA por super_admin. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, p_justificativa),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha reaberta com sucesso');
END;
$function$;

-- Privilégios das funções-base: como no baseline (overlay/40): sem EXECUTE para PUBLIC/anon;
-- authenticated (as policies as chamam como o usuário) e service_role executam. No estado (b) a função
-- nova nasceria executável por anon pelos privilégios padrão da plataforma.
REVOKE EXECUTE ON FUNCTION public.usuario_eh_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_eh_super_admin(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_active_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_module(public.app_module) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_module(public.app_module) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_access_module(public.app_module) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_module(public.app_module) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.usuario_tem_permissao(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_tem_permissao(uuid, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.usuario_tem_permissao_financeira(uuid, character varying) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_tem_permissao_financeira(uuid, character varying) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.meu_servidor_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.meu_servidor_id() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin_atual() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_atual() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.usuario_eh_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_eh_admin(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_permission_code(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission_code(uuid, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.fechar_folha(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fechar_folha(uuid, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.reabrir_folha(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reabrir_folha(uuid, text) TO authenticated, service_role;
-- folhas_proteger_fechamento é função de trigger: ninguém a chama diretamente.
REVOKE EXECUTE ON FUNCTION public.folhas_proteger_fechamento() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Policies das 10 tabelas da folha (classe `permissao`; SQL idêntico ao de
--    supabase/baseline/rls/35_policies_geradas.sql — não editar à mão, regenerar)
-- ----------------------------------------------------------------------------
-- Policies permissivas são OR: qualquer `acesso_total_*` que sobrasse anularia a restrição, por isso os
-- nomes dos dois estados são removidos antes de criar as geradas.

-- folhas_pagamento
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.folhas_pagamento;
DROP POLICY IF EXISTS acesso_total_insert ON public.folhas_pagamento;
DROP POLICY IF EXISTS acesso_total_update ON public.folhas_pagamento;
DROP POLICY IF EXISTS acesso_total_delete ON public.folhas_pagamento;
DROP POLICY IF EXISTS rls_select ON public.folhas_pagamento;
DROP POLICY IF EXISTS rls_insert ON public.folhas_pagamento;
DROP POLICY IF EXISTS rls_update ON public.folhas_pagamento;
DROP POLICY IF EXISTS rls_delete ON public.folhas_pagamento;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.folhas_pagamento;
CREATE POLICY "rls_select" ON public.folhas_pagamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.folhas_pagamento;
CREATE POLICY "rls_insert" ON public.folhas_pagamento FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.folhas_pagamento;
CREATE POLICY "rls_update" ON public.folhas_pagamento FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.folhas_pagamento;
CREATE POLICY "rls_delete" ON public.folhas_pagamento FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- fichas_financeiras
ALTER TABLE public.fichas_financeiras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.fichas_financeiras;
DROP POLICY IF EXISTS acesso_total_insert ON public.fichas_financeiras;
DROP POLICY IF EXISTS acesso_total_update ON public.fichas_financeiras;
DROP POLICY IF EXISTS acesso_total_delete ON public.fichas_financeiras;
DROP POLICY IF EXISTS rls_select ON public.fichas_financeiras;
DROP POLICY IF EXISTS rls_insert ON public.fichas_financeiras;
DROP POLICY IF EXISTS rls_update ON public.fichas_financeiras;
DROP POLICY IF EXISTS rls_delete ON public.fichas_financeiras;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.fichas_financeiras;
CREATE POLICY "rls_select" ON public.fichas_financeiras FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.fichas_financeiras;
CREATE POLICY "rls_insert" ON public.fichas_financeiras FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.fichas_financeiras;
CREATE POLICY "rls_update" ON public.fichas_financeiras FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fichas_financeiras;
CREATE POLICY "rls_delete" ON public.fichas_financeiras FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- itens_ficha_financeira
ALTER TABLE public.itens_ficha_financeira ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS acesso_total_insert ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS acesso_total_update ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS acesso_total_delete ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS rls_select ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS rls_insert ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS rls_update ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS rls_delete ON public.itens_ficha_financeira;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.itens_ficha_financeira;
CREATE POLICY "rls_select" ON public.itens_ficha_financeira FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.fichas_financeiras p WHERE p.id = itens_ficha_financeira.ficha_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ficha_financeira;
CREATE POLICY "rls_insert" ON public.itens_ficha_financeira FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ficha_financeira;
CREATE POLICY "rls_update" ON public.itens_ficha_financeira FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ficha_financeira;
CREATE POLICY "rls_delete" ON public.itens_ficha_financeira FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- consignacoes
ALTER TABLE public.consignacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.consignacoes;
DROP POLICY IF EXISTS acesso_total_insert ON public.consignacoes;
DROP POLICY IF EXISTS acesso_total_update ON public.consignacoes;
DROP POLICY IF EXISTS acesso_total_delete ON public.consignacoes;
DROP POLICY IF EXISTS rls_select ON public.consignacoes;
DROP POLICY IF EXISTS rls_insert ON public.consignacoes;
DROP POLICY IF EXISTS rls_update ON public.consignacoes;
DROP POLICY IF EXISTS rls_delete ON public.consignacoes;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.consignacoes;
CREATE POLICY "rls_select" ON public.consignacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.consignacoes;
CREATE POLICY "rls_insert" ON public.consignacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.consignacoes;
CREATE POLICY "rls_update" ON public.consignacoes FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.consignacoes;
CREATE POLICY "rls_delete" ON public.consignacoes FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- dependentes_irrf
ALTER TABLE public.dependentes_irrf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.dependentes_irrf;
DROP POLICY IF EXISTS acesso_total_insert ON public.dependentes_irrf;
DROP POLICY IF EXISTS acesso_total_update ON public.dependentes_irrf;
DROP POLICY IF EXISTS acesso_total_delete ON public.dependentes_irrf;
DROP POLICY IF EXISTS rls_select ON public.dependentes_irrf;
DROP POLICY IF EXISTS rls_insert ON public.dependentes_irrf;
DROP POLICY IF EXISTS rls_update ON public.dependentes_irrf;
DROP POLICY IF EXISTS rls_delete ON public.dependentes_irrf;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.dependentes_irrf;
CREATE POLICY "rls_select" ON public.dependentes_irrf FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.dependentes_irrf;
CREATE POLICY "rls_insert" ON public.dependentes_irrf FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.dependentes_irrf;
CREATE POLICY "rls_update" ON public.dependentes_irrf FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.dependentes_irrf;
CREATE POLICY "rls_delete" ON public.dependentes_irrf FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- lancamentos_folha
ALTER TABLE public.lancamentos_folha ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.lancamentos_folha;
DROP POLICY IF EXISTS acesso_total_insert ON public.lancamentos_folha;
DROP POLICY IF EXISTS acesso_total_update ON public.lancamentos_folha;
DROP POLICY IF EXISTS acesso_total_delete ON public.lancamentos_folha;
DROP POLICY IF EXISTS rls_select ON public.lancamentos_folha;
DROP POLICY IF EXISTS rls_insert ON public.lancamentos_folha;
DROP POLICY IF EXISTS rls_update ON public.lancamentos_folha;
DROP POLICY IF EXISTS rls_delete ON public.lancamentos_folha;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_folha;
CREATE POLICY "rls_select" ON public.lancamentos_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_folha;
CREATE POLICY "rls_insert" ON public.lancamentos_folha FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_folha;
CREATE POLICY "rls_update" ON public.lancamentos_folha FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_folha;
CREATE POLICY "rls_delete" ON public.lancamentos_folha FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- parametros_folha
ALTER TABLE public.parametros_folha ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.parametros_folha;
DROP POLICY IF EXISTS acesso_total_insert ON public.parametros_folha;
DROP POLICY IF EXISTS acesso_total_update ON public.parametros_folha;
DROP POLICY IF EXISTS acesso_total_delete ON public.parametros_folha;
DROP POLICY IF EXISTS rls_select ON public.parametros_folha;
DROP POLICY IF EXISTS rls_insert ON public.parametros_folha;
DROP POLICY IF EXISTS rls_update ON public.parametros_folha;
DROP POLICY IF EXISTS rls_delete ON public.parametros_folha;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.parametros_folha;
CREATE POLICY "rls_select" ON public.parametros_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.parametros_folha;
CREATE POLICY "rls_insert" ON public.parametros_folha FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.parametros_folha;
CREATE POLICY "rls_update" ON public.parametros_folha FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.parametros_folha;
CREATE POLICY "rls_delete" ON public.parametros_folha FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- rubricas
ALTER TABLE public.rubricas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.rubricas;
DROP POLICY IF EXISTS acesso_total_insert ON public.rubricas;
DROP POLICY IF EXISTS acesso_total_update ON public.rubricas;
DROP POLICY IF EXISTS acesso_total_delete ON public.rubricas;
DROP POLICY IF EXISTS rls_select ON public.rubricas;
DROP POLICY IF EXISTS rls_insert ON public.rubricas;
DROP POLICY IF EXISTS rls_update ON public.rubricas;
DROP POLICY IF EXISTS rls_delete ON public.rubricas;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.rubricas;
CREATE POLICY "rls_select" ON public.rubricas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.rubricas;
CREATE POLICY "rls_insert" ON public.rubricas FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.rubricas;
CREATE POLICY "rls_update" ON public.rubricas FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.rubricas;
CREATE POLICY "rls_delete" ON public.rubricas FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- tabela_inss
ALTER TABLE public.tabela_inss ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.tabela_inss;
DROP POLICY IF EXISTS acesso_total_insert ON public.tabela_inss;
DROP POLICY IF EXISTS acesso_total_update ON public.tabela_inss;
DROP POLICY IF EXISTS acesso_total_delete ON public.tabela_inss;
DROP POLICY IF EXISTS rls_select ON public.tabela_inss;
DROP POLICY IF EXISTS rls_insert ON public.tabela_inss;
DROP POLICY IF EXISTS rls_update ON public.tabela_inss;
DROP POLICY IF EXISTS rls_delete ON public.tabela_inss;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.tabela_inss;
CREATE POLICY "rls_select" ON public.tabela_inss FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.tabela_inss;
CREATE POLICY "rls_insert" ON public.tabela_inss FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.tabela_inss;
CREATE POLICY "rls_update" ON public.tabela_inss FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.tabela_inss;
CREATE POLICY "rls_delete" ON public.tabela_inss FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- tabela_irrf
ALTER TABLE public.tabela_irrf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.tabela_irrf;
DROP POLICY IF EXISTS acesso_total_insert ON public.tabela_irrf;
DROP POLICY IF EXISTS acesso_total_update ON public.tabela_irrf;
DROP POLICY IF EXISTS acesso_total_delete ON public.tabela_irrf;
DROP POLICY IF EXISTS rls_select ON public.tabela_irrf;
DROP POLICY IF EXISTS rls_insert ON public.tabela_irrf;
DROP POLICY IF EXISTS rls_update ON public.tabela_irrf;
DROP POLICY IF EXISTS rls_delete ON public.tabela_irrf;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao)
DROP POLICY IF EXISTS "rls_select" ON public.tabela_irrf;
CREATE POLICY "rls_select" ON public.tabela_irrf FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.tabela_irrf;
CREATE POLICY "rls_insert" ON public.tabela_irrf FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.tabela_irrf;
CREATE POLICY "rls_update" ON public.tabela_irrf FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.tabela_irrf;
CREATE POLICY "rls_delete" ON public.tabela_irrf FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- ----------------------------------------------------------------------------
-- 3. processar_folha_pagamento: corpo atual (schema/01_pre_data.sql) + guarda de permissão
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha RECORD;
  v_servidor RECORD;
  v_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_base_inss NUMERIC;
  v_valor_inss NUMERIC;
  v_base_irrf NUMERIC;
  v_valor_irrf NUMERIC;
  v_qtd_dependentes INTEGER;
  v_deducao_dependentes NUMERIC;
  v_total_descontos NUMERIC;
  v_valor_liquido NUMERIC;
  v_vencimento NUMERIC;
  v_data_referencia DATE;
  v_total_servidores_ativos INTEGER := 0;
  v_total_com_provimento INTEGER := 0;
  v_total_sem_vencimento INTEGER := 0;
BEGIN
  -- Guarda (migração 20261010070000): só quem tem a permissão de processar a folha (ou o papel admin,
  -- via has_permission_code) executa. 42501 = insufficient_privilege, mesmo código das policies.
  IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN
    RAISE EXCEPTION 'Sem permissão para processar a folha' USING ERRCODE = '42501';
  END IF;

  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  
  -- Verificar status - permitir previa, aberta, reaberta ou processando
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;
  
  -- Data de referência para cálculos (último dia do mês da competência)
  v_data_referencia := (make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1) + interval '1 month - 1 day')::date;
  
  -- Atualizar status para processando
  UPDATE folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;
  
  -- Limpar fichas existentes desta folha (para reprocessamento)
  DELETE FROM fichas_financeiras WHERE folha_id = p_folha_id;
  
  -- Contar total de servidores ativos
  SELECT COUNT(*) INTO v_total_servidores_ativos
  FROM servidores s
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Contar servidores com provimento ativo
  SELECT COUNT(DISTINCT s.id) INTO v_total_com_provimento
  FROM servidores s
  INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Buscar servidores ativos com provimento ativo (incluindo dados bancários)
  FOR v_servidor IN
    SELECT 
      s.id,
      s.nome_completo,
      s.cpf,
      s.matricula,
      s.pis_pasep,
      s.banco_codigo,
      s.banco_nome,
      s.banco_agencia,
      s.banco_conta,
      s.banco_tipo_conta,
      p.cargo_id,
      p.unidade_id,
      c.nome AS cargo_nome,
      COALESCE(c.vencimento_base, 0) AS vencimento_base,
      eo.nome AS unidade_nome,
      eo.sigla AS unidade_sigla
    FROM servidores s
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
    INNER JOIN cargos c ON c.id = p.cargo_id
    LEFT JOIN estrutura_organizacional eo ON eo.id = p.unidade_id
    WHERE s.situacao = 'ativo'
      AND s.ativo = true
  LOOP
    BEGIN
      -- Vencimento base do cargo
      v_vencimento := COALESCE(v_servidor.vencimento_base, 0);
      
      -- Se não tem vencimento, registrar erro e pular
      IF v_vencimento <= 0 THEN
        v_total_sem_vencimento := v_total_sem_vencimento + 1;
        v_errors := v_errors || jsonb_build_object(
          'servidor_id', v_servidor.id,
          'nome', v_servidor.nome_completo,
          'cargo', v_servidor.cargo_nome,
          'erro', 'Cargo sem vencimento base definido'
        );
        CONTINUE;
      END IF;
      
      -- Calcular INSS
      v_base_inss := v_vencimento;
      v_valor_inss := calcular_inss_servidor(v_base_inss, v_data_referencia);
      
      -- Contar dependentes e calcular dedução
      v_qtd_dependentes := count_dependentes_irrf(v_servidor.id, v_data_referencia);
      v_deducao_dependentes := v_qtd_dependentes * COALESCE(get_parametro_vigente('deducao_dependente_irrf', v_data_referencia), 189.59);
      
      -- Calcular IRRF
      v_base_irrf := v_vencimento - v_valor_inss - v_deducao_dependentes;
      IF v_base_irrf < 0 THEN v_base_irrf := 0; END IF;
      v_valor_irrf := calcular_irrf(v_base_irrf, v_data_referencia);
      
      -- Total de descontos
      v_total_descontos := v_valor_inss + v_valor_irrf;
      
      -- Valor líquido
      v_valor_liquido := v_vencimento - v_total_descontos;
      
      -- Inserir ficha financeira COM DADOS BANCÁRIOS
      INSERT INTO fichas_financeiras (
        folha_id,
        servidor_id,
        competencia_ano,
        competencia_mes,
        tipo_folha,
        cargo_id,
        cargo_nome,
        cargo_vencimento,
        unidade_id,
        unidade_nome,
        total_proventos,
        total_descontos,
        valor_liquido,
        base_inss,
        valor_inss,
        base_irrf,
        valor_irrf,
        quantidade_dependentes,
        valor_deducao_dependentes,
        -- DADOS BANCÁRIOS COPIADOS DO SERVIDOR
        banco_codigo,
        banco_nome,
        banco_agencia,
        banco_conta,
        banco_tipo_conta,
        processado,
        data_processamento,
        created_at
      ) VALUES (
        p_folha_id,
        v_servidor.id,
        v_folha.competencia_ano,
        v_folha.competencia_mes,
        v_folha.tipo_folha,
        v_servidor.cargo_id,
        v_servidor.cargo_nome,
        v_vencimento,
        v_servidor.unidade_id,
        COALESCE(v_servidor.unidade_sigla, '') || ' - ' || COALESCE(v_servidor.unidade_nome, ''),
        v_vencimento,
        v_total_descontos,
        v_valor_liquido,
        v_base_inss,
        v_valor_inss,
        v_base_irrf,
        v_valor_irrf,
        v_qtd_dependentes,
        v_deducao_dependentes,
        -- DADOS BANCÁRIOS
        v_servidor.banco_codigo,
        v_servidor.banco_nome,
        v_servidor.banco_agencia,
        v_servidor.banco_conta,
        v_servidor.banco_tipo_conta,
        true,
        now(),
        now()
      );
      
      v_count := v_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'servidor_id', v_servidor.id,
        'nome', v_servidor.nome_completo,
        'erro', SQLERRM
      );
    END;
  END LOOP;
  
  -- Atualizar totais da folha - manter status "aberta" para permitir ajustes
  UPDATE folhas_pagamento
  SET 
    total_bruto = COALESCE((SELECT SUM(total_proventos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_descontos = COALESCE((SELECT SUM(total_descontos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    quantidade_servidores = v_count,
    status = 'aberta',
    data_processamento = now(),
    updated_at = now()
  WHERE id = p_folha_id;
  
  -- Retorno em formato JSONB
  RETURN jsonb_build_object(
    'sucesso', true,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_total_servidores_ativos,
    'total_com_provimento', v_total_com_provimento,
    'total_sem_vencimento', v_total_sem_vencimento,
    'erros', v_errors
  );
  
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Guarda de permissão (início do corpo): propaga o 42501. Sem esta cláusula o handler abaixo engolia
    -- a exceção e, como SECURITY DEFINER, "revertia" a folha para 'aberta' — inclusive uma folha fechada —
    -- a pedido de quem NÃO tem permissão.
    RAISE;
  WHEN OTHERS THEN
  -- Em caso de erro, reverter status
  UPDATE folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
  
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro', SQLERRM,
    'servidores_processados', v_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.processar_folha_pagamento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processar_folha_pagamento(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Folha fechada barra também o INSERT (espelho de bloquear_alteracao_*_ficha_fechada)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bloquear_insercao_ficha_fechada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.folha_esta_bloqueada(NEW.folha_id) AND NOT public.usuario_eh_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Folha fechada: não é possível incluir fichas financeiras' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bloquear_insercao_item_ficha_fechada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_folha_id uuid;
BEGIN
  -- a folha vem pela ficha
  SELECT folha_id INTO v_folha_id FROM public.fichas_financeiras WHERE id = NEW.ficha_id;
  IF public.folha_esta_bloqueada(v_folha_id) AND NOT public.usuario_eh_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Folha fechada: não é possível incluir itens de fichas financeiras' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- funções de trigger: ninguém as chama diretamente (padrão do overlay/40)
REVOKE EXECUTE ON FUNCTION public.bloquear_insercao_ficha_fechada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_insercao_item_ficha_fechada() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bloquear_insercao_ficha_fechada ON public.fichas_financeiras;
CREATE TRIGGER trg_bloquear_insercao_ficha_fechada
  BEFORE INSERT ON public.fichas_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_insercao_ficha_fechada();

DROP TRIGGER IF EXISTS trg_bloquear_insercao_item_ficha_fechada ON public.itens_ficha_financeira;
CREATE TRIGGER trg_bloquear_insercao_item_ficha_fechada
  BEFORE INSERT ON public.itens_ficha_financeira
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_insercao_item_ficha_fechada();

-- ----------------------------------------------------------------------------
-- 5. Índice único parcial: um desconto por referência em cada ficha ("Lançar na ficha")
-- ----------------------------------------------------------------------------
-- Só é criado se não houver duplicata; com duplicata a migração NÃO falha (WARNING no log do CI) e o
-- índice fica para depois da limpeza manual.
DO $$
DECLARE v_dup integer;
BEGIN
  SELECT count(*) INTO v_dup FROM (
    SELECT ficha_id, lower(referencia)
    FROM public.itens_ficha_financeira
    WHERE tipo = 'desconto' AND referencia IS NOT NULL
    GROUP BY ficha_id, lower(referencia)
    HAVING count(*) > 1
  ) d;
  IF v_dup = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS itens_ficha_financeira_ficha_referencia_desconto_uidx
      ON public.itens_ficha_financeira (ficha_id, lower(referencia))
      WHERE tipo = 'desconto' AND referencia IS NOT NULL;
  ELSE
    RAISE WARNING 'itens_ficha_financeira: % par(es) (ficha_id, lower(referencia)) duplicado(s) em descontos; índice itens_ficha_financeira_ficha_referencia_desconto_uidx NÃO criado — limpar e criar depois', v_dup;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Auditoria (fn_audit_trigger, módulo rh) — sem fichas_financeiras nem dependentes_irrf
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_folhas_pagamento ON public.folhas_pagamento;
CREATE TRIGGER audit_folhas_pagamento AFTER INSERT OR DELETE OR UPDATE ON public.folhas_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

DROP TRIGGER IF EXISTS audit_itens_ficha_financeira ON public.itens_ficha_financeira;
CREATE TRIGGER audit_itens_ficha_financeira AFTER INSERT OR DELETE OR UPDATE ON public.itens_ficha_financeira
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

DROP TRIGGER IF EXISTS audit_consignacoes ON public.consignacoes;
CREATE TRIGGER audit_consignacoes AFTER INSERT OR DELETE OR UPDATE ON public.consignacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- ----------------------------------------------------------------------------
-- 7. Catálogo: a folha pertence ao módulo rh (decisão em card; padrão = sim)
-- ----------------------------------------------------------------------------
-- Os códigos continuam financeiro.folha.* (role_permissions/user_permissions referenciam permission_code
-- com ON UPDATE CASCADE e não mudam); só o agrupamento por módulo muda, para que get_user_permission_codes
-- conceda a permissão de papel a quem tem o módulo rh. module_code não tem FK nem CHECK; a única unicidade
-- é permission_code.
UPDATE public.module_permissions_catalog
   SET module_code = 'rh'
 WHERE permission_code LIKE 'financeiro.folha.%'
   AND module_code <> 'rh';
