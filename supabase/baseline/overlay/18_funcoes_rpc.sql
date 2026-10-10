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
--    folhas_pagamento falhava. Desde a E1 (migração 20261011000000, mesmo texto): quem fechou, conferiu ou reabriu
--    é sempre quem age, agora (antes COALESCE com o valor mandado pelo cliente) e não muda fora da transição.
-- 3) Funções somente-leitura que devolvem dado pessoal rodavam como dono (BYPASSRLS) e eram
--    executáveis por qualquer logado, ativo ou não, com módulo ou não (reproduzido com
--    fn_gerar_esocial_s2200: CPF e nome). Passam a SECURITY INVOKER: valem as policies de quem chama.
--    As que ESCREVEM (fn_atualizar_situacao_servidor; processar_folha_pagamento até a migração 20261010070000,
--    que lhe deu guarda de permissão) perdem o EXECUTE de
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
  v_uid uuid := auth.uid();
  v_informa boolean := auth.uid() IS NULL
    AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated');
BEGIN
  SELECT full_name INTO v_user_nome FROM public.profiles WHERE id = v_uid;

  -- quem fechou, conferiu ou reabriu só muda na transição de status (abaixo)
  IF NOT v_informa THEN
    NEW.fechado_por := OLD.fechado_por;
    NEW.fechado_em := OLD.fechado_em;
    NEW.conferido_por := OLD.conferido_por;
    NEW.conferido_em := OLD.conferido_em;
    NEW.reaberto_por := OLD.reaberto_por;
    NEW.reaberto_em := OLD.reaberto_em;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id, status_anterior, status_novo, usuario_id, usuario_nome, justificativa
    ) VALUES (
      NEW.id, OLD.status, NEW.status, v_uid, v_user_nome,
      CASE
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );

    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := CASE WHEN v_informa THEN COALESCE(NEW.fechado_por, v_uid) ELSE v_uid END;
      NEW.fechado_em := CASE WHEN v_informa THEN COALESCE(NEW.fechado_em, now()) ELSE now() END;
    END IF;

    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := CASE WHEN v_informa THEN COALESCE(NEW.conferido_por, v_uid) ELSE v_uid END;
      NEW.conferido_em := CASE WHEN v_informa THEN COALESCE(NEW.conferido_em, now()) ELSE now() END;
    END IF;

    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := CASE WHEN v_informa THEN COALESCE(NEW.reaberto_por, v_uid) ELSE v_uid END;
      NEW.reaberto_em := CASE WHEN v_informa THEN COALESCE(NEW.reaberto_em, now()) ELSE now() END;
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
--     E1 (migração 20261011000000, mesmo texto): no módulo rh só view/export/download sem antes/depois; chaves de
--     trigger/registrar_evento tiradas dos metadados, que levam fonte = log_audit; antes/depois/metadados até 32 KB.
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
  _meta jsonb;
BEGIN
  -- perfil bloqueado/inexistente não grava (a sessão do Auth dele pode continuar válida). Sem usuário
  -- (service role, ou registrar_denuncia_publica chamada por anon) segue como antes.
  IF auth.uid() IS NOT NULL AND NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Usuário inativo' USING ERRCODE = '42501';
  END IF;
  IF lower(btrim(coalesce(_module_name, ''))) = 'rh' THEN
    IF _action::text NOT IN ('view', 'export', 'download') THEN
      RAISE EXCEPTION 'log_audit: no módulo rh só view, export e download (lançamentos entram pela trilha do banco)'
        USING ERRCODE = '22023';
    END IF;
    IF _before_data IS NOT NULL OR _after_data IS NOT NULL THEN
      RAISE EXCEPTION 'log_audit: no módulo rh a linha não leva antes/depois' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF length(coalesce(_before_data::text, '')) > 32768 OR length(coalesce(_after_data::text, '')) > 32768
     OR length(coalesce(_metadata::text, '')) > 32768 THEN
    RAISE EXCEPTION 'log_audit: antes, depois e metadados têm limite de 32 KB cada' USING ERRCODE = '22023';
  END IF;
  _meta := CASE WHEN _metadata IS NULL THEN '{}'::jsonb
                WHEN jsonb_typeof(_metadata) = 'object' THEN _metadata
                ELSE jsonb_build_object('valor', _metadata) END;
  _meta := (_meta - ARRAY['trigger', 'operation', 'table', 'registrar_evento', 'fonte'])
           || jsonb_build_object('fonte', 'log_audit');

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
    _before_data, _after_data, _description, _meta,
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

-- I5) Formulário público de gestores escolares. A leitura anônima de gestores_escolares (CPF, RG, e-mail,
--     celular de TODOS os gestores) foi fechada; as duas telas públicas só precisam de nome, status e nome da
--     escola, então passam a usar estas RPCs (mesma ideia das de árbitros: nada de dado pessoal além do que
--     a própria pessoa informou ou já conhece). Quem envia continua sem escolher o status (trigger do overlay 20).
CREATE OR REPLACE FUNCTION public.consultar_gestor_por_cpf(p_cpf text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
           'id', g.id, 'nome', g.nome, 'status', g.status,
           'escola', jsonb_build_object('id', e.id, 'nome', e.nome))
  FROM public.gestores_escolares g
  LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
  WHERE length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) = 11
    AND regexp_replace(coalesce(g.cpf, ''), '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.registrar_gestor_publico(
  p_escola_id uuid, p_nome text, p_cpf text, p_rg text, p_data_nascimento date,
  p_email text, p_celular text, p_endereco text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.gestores_escolares (escola_id, nome, cpf, rg, data_nascimento, email, celular, endereco, status)
  VALUES (p_escola_id, p_nome, p_cpf, p_rg, p_data_nascimento, p_email, p_celular, p_endereco, 'aguardando')
  RETURNING id INTO v_id;
  RETURN (SELECT jsonb_build_object('id', g.id, 'nome', g.nome, 'status', g.status,
                                    'escola', jsonb_build_object('id', e.id, 'nome', e.nome))
          FROM public.gestores_escolares g LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
          WHERE g.id = v_id);
END;
$$;

-- I6) Portal da Transparência (migração 20261010200100): execução orçamentária, licitações e patrimônio.
--     As tabelas continuam fechadas para anon; estas RPCs devolvem só os campos das telas públicas, com o
--     filtro de LGPD no servidor. GRANT para anon em overlay/40_privilegios.sql.
-- 1) Execução orçamentária: totais por exercício
CREATE OR REPLACE FUNCTION public.transparencia_execucao_orcamentaria()
RETURNS TABLE (
  exercicio integer,
  valor_inicial numeric,
  valor_atual numeric,
  valor_empenhado numeric,
  valor_liquidado numeric,
  valor_pago numeric,
  quantidade_dotacoes bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.exercicio,
         coalesce(sum(d.valor_inicial), 0),
         coalesce(sum(d.valor_atual), 0),
         coalesce(sum(d.valor_empenhado), 0),
         coalesce(sum(d.valor_liquidado), 0),
         coalesce(sum(d.valor_pago), 0),
         count(*)
  FROM public.dotacoes_orcamentarias d
  GROUP BY d.exercicio
  ORDER BY d.exercicio DESC;
$$;

-- 2) Licitações. O vencedor vem das propostas vencedoras (não desclassificadas) e de
--    itens_licitacao.vencedor_id: processos_licitatorios não tem fornecedor próprio nem coluna de
--    data de homologação (data_homologacao sai NULL até a tabela ganhar o campo).
CREATE OR REPLACE FUNCTION public.transparencia_licitacoes(
  p_ano integer DEFAULT NULL,
  p_modalidade text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  numero_processo text,
  ano integer,
  modalidade text,
  objeto text,
  fase_atual text,
  valor_estimado numeric,
  data_abertura date,
  data_homologacao date,
  unidade_requisitante text,
  vencedor_razao_social text,
  vencedor_cnpj_parcial text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH vencedores AS (
    SELECT pr.processo_id, pr.fornecedor_id
    FROM public.propostas_licitacao pr
    WHERE pr.vencedora AND NOT coalesce(pr.desclassificada, false)
    UNION
    SELECT il.processo_id, il.vencedor_id
    FROM public.itens_licitacao il
    WHERE il.vencedor_id IS NOT NULL
  )
  SELECT p.id,
         p.numero_processo::text,
         p.ano,
         p.modalidade::text,
         p.objeto,
         p.fase_atual::text,
         p.valor_estimado,
         p.data_abertura,
         NULL::date,
         eo.nome,
         v.razao_social::text,
         -- CNPJ mascarado como a tela fazia: 8 primeiros dígitos, ****, 2 últimos (nunca CPF)
         CASE WHEN length(v.doc) = 14 THEN left(v.doc, 8) || '****' || substr(v.doc, 13) END
  FROM public.processos_licitatorios p
  LEFT JOIN public.estrutura_organizacional eo ON eo.id = p.unidade_requisitante_id
  -- LGPD: só vencedor pessoa jurídica; se o único vencedor é pessoa física, nome e documento saem NULL
  LEFT JOIN LATERAL (
    SELECT f.razao_social, regexp_replace(f.cpf_cnpj, '\D', '', 'g') AS doc
    FROM vencedores vc
    JOIN public.fornecedores f ON f.id = vc.fornecedor_id
    WHERE vc.processo_id = p.id AND f.tipo_pessoa = 'PJ'
    ORDER BY f.razao_social
    LIMIT 1
  ) v ON p.fase_atual IN ('homologacao', 'adjudicacao', 'contratacao', 'encerrado')
  -- Fase interna (antes da publicação do edital) não é pública: o valor estimado pode ser
  -- sigiloso até o julgamento (Lei 14.133, art. 24). O vencedor só aparece após a homologação.
  WHERE p.fase_atual NOT IN ('planejamento', 'elaboracao', 'edital')
    AND (p_ano IS NULL OR p.ano = p_ano)
    AND (p_modalidade IS NULL OR p.modalidade::text = p_modalidade)
  ORDER BY p.ano DESC, p.numero_processo DESC;
$$;

-- 3) Patrimônio: só dados do bem e da unidade (nunca responsável nem dado pessoal)
CREATE OR REPLACE FUNCTION public.transparencia_patrimonio()
RETURNS TABLE (
  id uuid,
  numero_patrimonio text,
  descricao text,
  marca text,
  modelo text,
  situacao text,
  estado_conservacao text,
  valor_aquisicao numeric,
  data_aquisicao date,
  unidade_local_nome text,
  unidade_local_municipio text,
  unidade_organizacional_nome text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id,
         b.numero_patrimonio::text,
         b.descricao::text,
         b.marca::text,
         b.modelo::text,
         b.situacao::text,
         b.estado_conservacao::text,
         b.valor_aquisicao,
         b.data_aquisicao,
         ul.nome_unidade,
         ul.municipio,
         eo.nome
  FROM public.bens_patrimoniais b
  LEFT JOIN public.unidades_locais ul ON ul.id = b.unidade_local_id
  LEFT JOIN public.estrutura_organizacional eo ON eo.id = b.unidade_id
  ORDER BY b.numero_patrimonio;
$$;

COMMENT ON FUNCTION public.transparencia_execucao_orcamentaria() IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe só totais de dotacoes_orcamentarias por exercício (valor_inicial, valor_atual, valor_empenhado, valor_liquidado, valor_pago, quantidade de dotações).';
COMMENT ON FUNCTION public.transparencia_licitacoes(integer, text) IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe de processos_licitatorios id, numero_processo, ano, modalidade, objeto, fase_atual, valor_estimado, data_abertura, data_homologacao (NULL: a tabela não tem a coluna), nome da unidade requisitante e, do vencedor pessoa jurídica, razão social e CNPJ mascarado (8 dígitos + **** + 2). Processos na fase interna (planejamento, elaboração, edital) ou sem fase não aparecem (valor estimado pode ser sigiloso, Lei 14.133 art. 24); o vencedor só aparece a partir da homologação; vencedor pessoa física nunca é exposto: sem vencedor PJ, razão social e CNPJ saem NULL.';
COMMENT ON FUNCTION public.transparencia_patrimonio() IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe de bens_patrimoniais id, numero_patrimonio, descricao, marca, modelo, situacao, estado_conservacao, valor_aquisicao, data_aquisicao, nome e município da unidade local e nome da unidade organizacional. Nunca responsável nem dado pessoal.';

-- I7) Portal da Transparência (migração 20261010234000): quadro de cargos comissionados, uma linha por vaga,
--     com o nome do ocupante (nome social quando houver). Substitui public/data/cargos.json/.csv, que
--     publicavam `indicacao`. Nunca CPF, matrícula, indicação, contato nem dado bancário. GRANT para anon
--     em overlay/40_privilegios.sql.
CREATE OR REPLACE FUNCTION public.transparencia_cargos_publicos()
RETURNS TABLE (
  cargo_id uuid,
  cargo text,
  simbolo text,
  categoria text,
  natureza text,
  nivel_hierarquico integer,
  vencimento numeric,
  lei_criacao_numero text,
  lei_criacao_data date,
  unidade_id uuid,
  unidade text,
  unidade_sigla text,
  unidade_superior text,
  diretoria text,
  diretoria_tipo text,
  vaga integer,
  vagas_previstas integer,
  vagas_ocupadas integer,
  ocupante text,
  atualizado_em timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE
  cargos_pub AS (
    SELECT c.*
    FROM public.cargos c
    WHERE coalesce(c.ativo, true)
      AND (c.categoria IN ('comissionado', 'funcao_gratificada') OR c.natureza = 'comissionado')
  ),
  -- só o nome do ocupante sai daqui (nunca CPF, matrícula, indicação ou contato)
  ocupantes AS (
    SELECT vs.cargo_id, vs.unidade_id,
           coalesce(nullif(btrim(s.nome_social), ''), s.nome_completo) AS nome
    FROM public.vinculos_servidor vs
    JOIN cargos_pub c ON c.id = vs.cargo_id
    JOIN public.servidores s ON s.id = vs.servidor_id
    WHERE vs.ativo
  ),
  composicao AS (
    SELECT cc.cargo_id, cc.unidade_id, coalesce(cc.quantidade_vagas, 0) AS vagas
    FROM public.composicao_cargos cc
    JOIN cargos_pub c ON c.id = cc.cargo_id
    JOIN public.estrutura_organizacional eo ON eo.id = cc.unidade_id
    WHERE coalesce(eo.ativo, true)
  ),
  grupos AS (
    SELECT g.cargo_id, g.unidade_id, sum(g.vagas)::integer AS vagas
    FROM (
      -- vagas previstas por unidade
      SELECT cp.cargo_id, cp.unidade_id, cp.vagas FROM composicao cp
      UNION ALL
      -- cargo sem composição: vagas do cargo sem unidade (descontados os ocupantes já lotados numa unidade)
      SELECT c.id, NULL::uuid,
             greatest(coalesce(c.quantidade_vagas, 0)
                      - (SELECT count(*) FROM ocupantes o WHERE o.cargo_id = c.id AND o.unidade_id IS NOT NULL), 0)::integer
      FROM cargos_pub c
      WHERE NOT EXISTS (SELECT 1 FROM composicao cp WHERE cp.cargo_id = c.id)
      UNION ALL
      -- ocupante numa unidade sem vaga prevista: ganha a própria linha
      SELECT DISTINCT o.cargo_id, o.unidade_id, 0
      FROM ocupantes o
      WHERE NOT EXISTS (SELECT 1 FROM composicao cp
                        WHERE cp.cargo_id = o.cargo_id AND cp.unidade_id IS NOT DISTINCT FROM o.unidade_id)
    ) g
    GROUP BY g.cargo_id, g.unidade_id
  ),
  ocupantes_num AS (
    SELECT o.cargo_id, o.unidade_id, o.nome,
           row_number() OVER (PARTITION BY o.cargo_id, o.unidade_id ORDER BY o.nome)::integer AS posicao,
           count(*) OVER (PARTITION BY o.cargo_id, o.unidade_id)::integer AS quantidade
    FROM ocupantes o
  ),
  -- sobe a hierarquia até a primeira diretoria (ou até a raiz); profundidade limita ciclo acidental
  subida AS (
    SELECT eo.id AS unidade_id, eo.id AS atual_id, eo.superior_id, eo.tipo, 0 AS profundidade
    FROM public.estrutura_organizacional eo
    WHERE eo.id IN (SELECT g.unidade_id FROM grupos g WHERE g.unidade_id IS NOT NULL)
    UNION ALL
    SELECT s.unidade_id, p.id, p.superior_id, p.tipo, s.profundidade + 1
    FROM subida s
    JOIN public.estrutura_organizacional p ON p.id = s.superior_id
    WHERE s.tipo <> 'diretoria' AND s.profundidade < 20
  ),
  diretorias AS (
    SELECT DISTINCT ON (s.unidade_id) s.unidade_id, s.atual_id AS diretoria_id
    FROM subida s
    ORDER BY s.unidade_id, s.profundidade DESC
  )
  SELECT c.id,
         c.nome,
         c.sigla,
         c.categoria::text,
         c.natureza::text,
         c.nivel_hierarquico,
         c.vencimento_base,
         c.lei_criacao_numero,
         c.lei_criacao_data,
         u.id,
         u.nome,
         u.sigla,
         coalesce(nullif(sup.sigla, ''), sup.nome),
         coalesce(nullif(d.sigla, ''), d.nome),
         d.tipo::text,
         v.n,
         g.vagas,
         coalesce(oq.quantidade, 0),
         o.nome,
         c.updated_at
  FROM grupos g
  JOIN cargos_pub c ON c.id = g.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = g.unidade_id
  LEFT JOIN public.estrutura_organizacional sup ON sup.id = u.superior_id
  LEFT JOIN diretorias dr ON dr.unidade_id = g.unidade_id
  LEFT JOIN public.estrutura_organizacional d ON d.id = dr.diretoria_id
  LEFT JOIN LATERAL (
    SELECT max(onum.quantidade) AS quantidade FROM ocupantes_num onum
    WHERE onum.cargo_id = g.cargo_id AND onum.unidade_id IS NOT DISTINCT FROM g.unidade_id
  ) oq ON true
  CROSS JOIN LATERAL generate_series(1, greatest(g.vagas, coalesce(oq.quantidade, 0))) AS v(n)
  LEFT JOIN ocupantes_num o
         ON o.cargo_id = g.cargo_id AND o.unidade_id IS NOT DISTINCT FROM g.unidade_id AND o.posicao = v.n
  ORDER BY c.vencimento_base DESC NULLS LAST, c.nome, u.nome NULLS LAST, v.n;
$$;

COMMENT ON FUNCTION public.transparencia_cargos_publicos() IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Quadro de cargos em comissão e funções gratificadas ativos, uma linha por vaga: de cargos id, nome, sigla (símbolo), categoria, natureza, nível hierárquico, vencimento_base, número e data da lei de criação e updated_at; nome, sigla, unidade superior e diretoria da unidade (composicao_cargos/estrutura_organizacional); vagas previstas e ocupadas; e o nome do ocupante (vínculo ativo em vinculos_servidor; nome social quando houver). Nunca CPF, matrícula, indicação, contato, endereço, dado bancário nem remuneração individual.';
