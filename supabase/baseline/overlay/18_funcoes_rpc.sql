-- RPCs: injeção de SQL, função quebrada e SECURITY DEFINER que vazava dado pessoal.
--
-- 1) fn_gerar_numero_financeiro(p_tipo, p_exercicio) montava o nome da tabela com
--    format('... fin_%ss ...', p_tipo) sem validar nem usar %I e rodava como SECURITY DEFINER
--    (dono com BYPASSRLS), executável por qualquer logado. Reproduzido em banco vazio por usuário
--    inativo e sem módulo: p_tipo = 'parametros, (select nome_completo as numero from servidores) q --'
--    devolvia, pelo erro de cast, o nome de um servidor (qualquer coluna de qualquer tabela). Agora
--    p_tipo precisa estar na lista fechada abaixo, que também mapeia para o nome real da tabela
--    (o formato antigo gerava fin_solicitacaos e fin_liquidacaos, que não existem).
-- 2) registrar_transicao_folha lia profiles.nome (a coluna é full_name): qualquer UPDATE em
--    folhas_pagamento falhava.
-- 3) Funções somente-leitura que devolvem dado pessoal rodavam como dono (BYPASSRLS) e eram
--    executáveis por qualquer logado, ativo ou não, com módulo ou não (reproduzido com
--    fn_gerar_esocial_s2200: CPF e nome). Passam a SECURITY INVOKER: valem as policies de quem chama.
--    As que ESCREVEM (processar_folha_pagamento, fn_atualizar_situacao_servidor) perdem o EXECUTE de
--    authenticated em overlay/40_privilegios.sql.

CREATE OR REPLACE FUNCTION public.fn_gerar_numero_financeiro(
  p_tipo character varying,
  p_exercicio integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer
) RETURNS character varying
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefixo text;
  v_tabela  text;
  v_ultimo  integer;
BEGIN
  SELECT t.prefixo, t.tabela INTO v_prefixo, v_tabela
  FROM (VALUES
    ('solicitacao', 'SOL', 'fin_solicitacoes'),
    ('empenho',     'NE',  'fin_empenhos'),
    ('liquidacao',  'NL',  'fin_liquidacoes'),
    ('pagamento',   'OP',  'fin_pagamentos'),
    ('receita',     'REC', 'fin_receitas'),
    ('adiantamento','ADI', 'fin_adiantamentos'),
    ('alteracao',   'ALT', 'fin_alteracoes_orcamentarias')
  ) AS t(tipo, prefixo, tabela)
  WHERE t.tipo = p_tipo;

  IF v_prefixo IS NULL THEN
    RAISE EXCEPTION 'Tipo de documento financeiro inválido: %', left(coalesce(p_tipo, ''), 40)
      USING ERRCODE = '22023';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(MAX(NULLIF(regexp_replace(numero, %L, %L), %L)::integer), 0) + 1 FROM public.%I WHERE exercicio = $1',
    '^' || v_prefixo || '-', '', '', v_tabela
  ) INTO v_ultimo USING p_exercicio;

  RETURN v_prefixo || '-' || LPAD(COALESCE(v_ultimo, 1)::text, 6, '0');
END;
$$;

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

-- Somente-leitura com dado pessoal: passam a respeitar a RLS de quem chama.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('fn_gerar_esocial_s1200', 'fn_gerar_esocial_s2200', 'fn_validar_margem_consignavel',
                        'fn_calcular_13_proporcional', 'gerar_relatorio_responsavel', 'verificar_conflito_agenda')
      AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', f.assinatura);
  END LOOP;
END $$;


-- ============================================================================================
-- Correções da segunda rodada de revisão
-- ============================================================================================

-- B1) sync_usuario_servidor_status (trigger de servidores.situacao, SECURITY DEFINER) bloqueava e
--     DESBLOQUEAVA qualquer perfil ligado ao servidor. Com is_admin_user exigindo perfil ativo, quem
--     tem o módulo rh (que edita servidores.situacao) ligava e desligava administradores e reativava
--     contas bloqueadas à mão. Agora: bloqueia como antes (exoneração/inativação/falecimento corta o
--     acesso), mas só REATIVA contas que ele mesmo bloqueou (motivo "Servidor ...") e nunca um administrador.
CREATE OR REPLACE FUNCTION public.sync_usuario_servidor_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.situacao IN ('exonerado', 'inativo', 'falecido')
     AND OLD.situacao NOT IN ('exonerado', 'inativo', 'falecido') THEN
    UPDATE public.profiles
    SET is_active = false,
        blocked_at = now(),
        blocked_reason = 'Servidor ' || NEW.situacao || ' em ' || now()::date
    WHERE servidor_id = NEW.id AND is_active;
  ELSIF NEW.situacao = 'ativo' AND OLD.situacao IN ('exonerado', 'inativo') THEN
    UPDATE public.profiles p
    SET is_active = true, blocked_at = NULL, blocked_reason = NULL
    WHERE p.servidor_id = NEW.id
      AND NOT p.is_active
      AND p.blocked_reason LIKE 'Servidor %'
      AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- I3) obter_parametro_vigente/simples (DEFINER) devolviam o valor individual de QUALQUER servidor a
--     qualquer logado, contornando a classe `admin` de config_parametros_valores. Agora exigem perfil
--     ativo e só consultam o nível "servidor" para o próprio servidor ou para rh/financeiro.
CREATE OR REPLACE FUNCTION public.obter_parametro_vigente(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date DEFAULT CURRENT_DATE, p_servidor_id uuid DEFAULT NULL::uuid, p_tipo_servidor character varying DEFAULT NULL::character varying, p_unidade_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_resultado jsonb;
    v_valor_padrao jsonb;
BEGIN
    -- sem usuário (service role, chamadas internas de triggers/cron) segue como antes
    IF auth.uid() IS NOT NULL AND NOT public.is_active_user() THEN
        RETURN '{}'::jsonb;
    END IF;
    -- nível "servidor individual": só o próprio servidor, o RH e o financeiro
    -- (COALESCE: meu_servidor_id() é NULL para quem não tem servidor, e NULL faria o IF não disparar)
    IF auth.uid() IS NOT NULL AND p_servidor_id IS NOT NULL AND NOT (
         COALESCE(p_servidor_id = public.meu_servidor_id(), false)
         OR public.can_access_module(auth.uid(), 'rh')
         OR public.can_access_module(auth.uid(), 'financeiro')) THEN
        p_servidor_id := NULL;
    END IF;
    -- Nível 4: Servidor individual
    IF p_servidor_id IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND servidor_id = p_servidor_id
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 3: Tipo de servidor
    IF p_tipo_servidor IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND tipo_servidor = p_tipo_servidor
          AND servidor_id IS NULL
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 2: Unidade
    IF p_unidade_id IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND unidade_id = p_unidade_id
          AND tipo_servidor IS NULL
          AND servidor_id IS NULL
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 1: Instituição (padrão)
    SELECT valor INTO v_resultado
    FROM public.config_parametros_valores
    WHERE instituicao_id = p_instituicao_id
      AND parametro_codigo = p_parametro_codigo
      AND unidade_id IS NULL
      AND tipo_servidor IS NULL
      AND servidor_id IS NULL
      AND ativo = true
      AND vigencia_inicio <= p_data_referencia
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
    ORDER BY vigencia_inicio DESC
    LIMIT 1;
    IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    
    -- Nível 0: Fallback do sistema (valor_padrao do metadado)
    SELECT valor_padrao INTO v_valor_padrao
    FROM public.config_parametros_meta
    WHERE codigo = p_parametro_codigo AND ativo = true;
    
    RETURN COALESCE(v_valor_padrao, '{}'::jsonb);
END;
$function$;

-- I4) folhas_pagamento: o UPDATE direto de `status` contornava as guardas de fechar_folha/reabrir_folha
--     (qualquer usuário do módulo rh fechava e reabria folha). Este trigger vale só para quem age como
--     `authenticated`/`anon`: as RPCs (SECURITY DEFINER, dono postgres) e a service role passam.
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

-- I5) Triggers que atualizam OUTRA tabela precisam ser SECURITY DEFINER: `anon` não tem (nem deve ter)
--     privilégio em escolas_jer, e o formulário público de gestores escolares falhava com
--     "permission denied for table escolas_jer".
ALTER FUNCTION public.marcar_escola_cadastrada() SECURITY DEFINER;
ALTER FUNCTION public.desmarcar_escola_cadastrada() SECURITY DEFINER;

-- M3) A trilha de auditoria nunca gravou nestas funções: audit_logs.entity_id é uuid e elas passavam
--     texto (`column "entity_id" is of type uuid but expression is of type text`). Consequência:
--     fechar_folha/reabrir_folha e qualquer escrita em config_parametros_valores falhavam, até para admin.
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

CREATE OR REPLACE FUNCTION public.fn_audit_parametros()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE(NEW.id, OLD.id),
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
$function$;

-- M2) log_audit gravava para usuário inativo (a sessão do Auth continua válida depois do bloqueio).
CREATE OR REPLACE FUNCTION public.log_audit(_action audit_action, _entity_type character varying DEFAULT NULL::character varying, _entity_id uuid DEFAULT NULL::uuid, _module_name character varying DEFAULT NULL::character varying, _before_data jsonb DEFAULT NULL::jsonb, _after_data jsonb DEFAULT NULL::jsonb, _description text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
BEGIN
  -- perfil bloqueado/inexistente não grava (a sessão do Auth dele pode continuar válida). Sem usuário
  -- (service role, ou registrar_denuncia_publica chamada por anon) segue como antes.
  IF auth.uid() IS NOT NULL AND NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Usuário inativo' USING ERRCODE = '42501';
  END IF;
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
$function$;

-- M6) is_active_user(uuid) devolvia TRUE para perfil inexistente (COALESCE(..., true)).
CREATE OR REPLACE FUNCTION public.is_active_user(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = p_user_id), false);
$$;
