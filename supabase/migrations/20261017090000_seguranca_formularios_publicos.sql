-- ============================================================================
-- P12: segurança dos formulários públicos e das funções de permissão
-- ============================================================================
-- Auditoria de segurança P12. Aprovado por Fabiano em 2026-10-17 ("sim").
--
-- 1. Limite por IP nos caminhos anônimos (mesma técnica do pré-cadastro, 20261012140000: IP de
--    trilha_contexto_requisicao(), guardado só como hash md5 junto da ação, janela de 1 hora, erro PT429 que o
--    PostgREST devolve como HTTP 429). Como várias ações são LEITURA (não há linha onde guardar o hash, como no
--    pré-cadastro), as tentativas ficam numa tabela própria, limite_requisicoes_publicas: RLS ligado e sem policy,
--    sem privilégio para anon/authenticated, escrita só por limite_publico_consumir (SECURITY DEFINER, fora da API).
--    Linhas com mais de 1 dia são apagadas a cada uso (o hash não fica guardado além disso).
--    Quem consome: anon e o logado SEM o módulo dono do formulário (a equipe trabalha atrás do mesmo IP do órgão
--    e não pode ser barrada). Service role, migrações e superusuário não consomem.
--      gestor_registrar   registrar_gestor_publico          10 por hora
--      gestor_consultar   consultar_gestor_por_cpf          30 por hora
--      arbitro_cpf        arbitro_cpf_cadastrado            30 por hora
--      denuncia           registrar_denuncia_publica        10 por hora
--      arbitro_cadastro   INSERT em cadastro_arbitros       20 por hora (trigger)
--      arbitro_modalidade INSERT em cadastro_arbitros_modalidades  100 por hora (trigger; várias por cadastro)
--      federacao_cadastro INSERT em federacoes_esportivas   10 por hora (trigger)
--    A tentativa só conta se a transação termina bem: por isso registrar_gestor_publico devolve a duplicidade
--    no corpo da resposta ({"erro": ...}) em vez de lançar erro (que desfaria também a contagem).
-- 2. Gestores escolares: o cadastro público passa a ser só pela RPC. Sai a policy insercao_publica_gestores
--    (anon e logado sem módulo inseriam direto, sem limite, e ocupavam todas as escolas) e o INSERT de anon na
--    tabela. Duplicidade de CPF, e-mail ou escola vira uma mensagem neutra (sem nome de constraint, sem dizer
--    qual dado já existe). A equipe do módulo continua inserindo pela policy gerada rls_insert.
-- 3. consultar_gestor_por_cpf devolve só a situação e o nome da escola (sem id, sem nome da pessoa).
-- 4. Formulários de federações e árbitros: o INSERT público só aceita a situação inicial e sem campos internos
--    (antes WITH CHECK (true)). O trigger trg_forcar_campos_iniciais (overlay 20) já devolvia esses campos ao valor
--    inicial; a policy é a segunda barreira, que não depende do trigger. O protocolo do árbitro não entra na
--    policy: o WITH CHECK é avaliado depois dos triggers BEFORE, quando trg_gerar_protocolo_arbitro já o preencheu;
--    quem garante que o autor não escolhe o protocolo é trg_forcar_campos_iniciais (zera antes do gerador).
-- 5. Funções SECURITY DEFINER que respondiam sobre OUTRO usuário a qualquer logado:
--      get_user_permission_codes(uuid), listar_permissoes_usuario(uuid), get_permissions_from_servidor(uuid),
--      get_user_permissions(uuid): só o próprio usuário ou o papel admin (42501 nos demais). Chamadas internas
--      (service role, como a Edge Function download-frequencia via has_permission_code, e conexões diretas)
--      passam: o papel da sessão (GUC role) não é anon/authenticated. Nas policies, has_permission_code é sempre
--      chamada com auth.uid(), então a guarda deixa passar o caso legítimo.
--    get_chefe_unidade_atual(uuid) recebe uma UNIDADE, não um usuário: passa a responder só a quem lê
--      nomeacoes_chefe_unidade pela RLS (módulos rh ou patrimonio); os demais recebem vazio (a tela trata).
--
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS antes de cada CREATE.
-- Os overlays 18, 20 e 40 do baseline e o rls/mapa.csv trazem a mesma mudança.
-- ============================================================================

-- 1. Limite por IP ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.limite_requisicoes_publicas (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  acao text NOT NULL,
  chave_hash text NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.limite_requisicoes_publicas IS
  'Tentativas recentes dos formulários e consultas públicas (hash do IP por ação), para o limite por IP. Só limite_publico_consumir grava; ninguém lê pela API.';
CREATE INDEX IF NOT EXISTS limite_requisicoes_publicas_chave_idx
  ON public.limite_requisicoes_publicas (acao, chave_hash, criado_em);
CREATE INDEX IF NOT EXISTS limite_requisicoes_publicas_criado_em_idx
  ON public.limite_requisicoes_publicas (criado_em);
ALTER TABLE public.limite_requisicoes_publicas ENABLE ROW LEVEL SECURITY;
-- sem policy: negado a todos pela API (a service role ignora a RLS)
REVOKE ALL ON TABLE public.limite_requisicoes_publicas FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.limite_publico_consumir(p_acao text, p_limite integer, p_modulo text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_papel text := coalesce(current_setting('role', true), 'none');
  v_ip text;
  v_hash text;
BEGIN
  -- caminhos internos (service role, migrações, superusuário) não consomem
  IF v_papel NOT IN ('anon', 'authenticated') THEN
    RETURN;
  END IF;
  -- a equipe do módulo, logada, trabalha atrás do mesmo IP do órgão
  IF v_papel = 'authenticated' AND p_modulo IS NOT NULL AND public.can_access_module(auth.uid(), p_modulo) THEN
    RETURN;
  END IF;
  v_ip := (SELECT ip::text FROM public.trilha_contexto_requisicao());
  v_hash := md5(p_acao || '|' || coalesce(v_ip, 'sem-ip'));
  -- pedidos em paralelo do mesmo IP contam um depois do outro
  PERFORM pg_advisory_xact_lock(hashtext('limite_publico:' || p_acao), hashtext(v_hash));
  IF (SELECT count(*) FROM public.limite_requisicoes_publicas
       WHERE acao = p_acao AND chave_hash = v_hash AND criado_em > now() - interval '1 hour') >= p_limite THEN
    RAISE EXCEPTION 'Muitas solicitações deste endereço. Tente novamente mais tarde.' USING ERRCODE = 'PT429';
  END IF;
  INSERT INTO public.limite_requisicoes_publicas (acao, chave_hash) VALUES (p_acao, v_hash);
  DELETE FROM public.limite_requisicoes_publicas WHERE criado_em < now() - interval '1 day';
END;
$function$;

-- INSERT direto dos formulários públicos (árbitros e federações): argumentos ação, limite, módulo dono
CREATE OR REPLACE FUNCTION public.limite_publico_insercao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.limite_publico_consumir(TG_ARGV[0], TG_ARGV[1]::integer, TG_ARGV[2]);
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.limite_publico_consumir(text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limite_publico_insercao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_limite_publico ON public.cadastro_arbitros;
CREATE TRIGGER trg_limite_publico BEFORE INSERT ON public.cadastro_arbitros
  FOR EACH ROW EXECUTE FUNCTION public.limite_publico_insercao('arbitro_cadastro', '20', 'arbitros');
DROP TRIGGER IF EXISTS trg_limite_publico ON public.cadastro_arbitros_modalidades;
CREATE TRIGGER trg_limite_publico BEFORE INSERT ON public.cadastro_arbitros_modalidades
  FOR EACH ROW EXECUTE FUNCTION public.limite_publico_insercao('arbitro_modalidade', '100', 'arbitros');
DROP TRIGGER IF EXISTS trg_limite_publico ON public.federacoes_esportivas;
CREATE TRIGGER trg_limite_publico BEFORE INSERT ON public.federacoes_esportivas
  FOR EACH ROW EXECUTE FUNCTION public.limite_publico_insercao('federacao_cadastro', '10', 'federacoes');

-- 2 e 3. Gestores escolares: cadastro só pela RPC, consulta sem dado pessoal --------
DROP POLICY IF EXISTS "insercao_publica_gestores" ON public.gestores_escolares;
REVOKE INSERT ON public.gestores_escolares FROM anon;

CREATE OR REPLACE FUNCTION public.consultar_gestor_por_cpf(p_cpf text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) <> 11 THEN
    RETURN NULL;
  END IF;
  PERFORM public.limite_publico_consumir('gestor_consultar', 30, 'gestores_escolares');
  RETURN (
    SELECT jsonb_build_object('status', g.status, 'escola', jsonb_build_object('nome', e.nome))
    FROM public.gestores_escolares g
    LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
    WHERE regexp_replace(coalesce(g.cpf, ''), '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g')
    LIMIT 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_gestor_publico(
  p_escola_id uuid, p_nome text, p_cpf text, p_rg text, p_data_nascimento date,
  p_email text, p_celular text, p_endereco text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.limite_publico_consumir('gestor_registrar', 10, 'gestores_escolares');
  BEGIN
    INSERT INTO public.gestores_escolares (escola_id, nome, cpf, rg, data_nascimento, email, celular, endereco, status)
    VALUES (p_escola_id, p_nome, p_cpf, p_rg, p_data_nascimento, p_email, p_celular, p_endereco, 'aguardando')
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    -- CPF, e-mail ou escola já cadastrados: mensagem neutra (não diz qual dado existe) e a tentativa conta no limite
    RETURN jsonb_build_object('erro',
      'Não foi possível concluir o pré-cadastro com estes dados. Confira as informações ou procure a coordenação.');
  END;
  RETURN (SELECT jsonb_build_object('nome', g.nome, 'status', g.status, 'escola', jsonb_build_object('nome', e.nome))
          FROM public.gestores_escolares g LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
          WHERE g.id = v_id);
END;
$function$;

-- 4. Formulários públicos de federações e árbitros: só a situação inicial ------------
DROP POLICY IF EXISTS cadastro_publico_insert ON public.federacoes_esportivas;
CREATE POLICY cadastro_publico_insert ON public.federacoes_esportivas FOR INSERT TO anon
  WITH CHECK (status = 'em_analise' AND analisado_por IS NULL AND data_analise IS NULL AND observacoes_internas IS NULL);

DROP POLICY IF EXISTS "Qualquer pessoa pode se cadastrar como árbitro" ON public.cadastro_arbitros;
CREATE POLICY "Qualquer pessoa pode se cadastrar como árbitro" ON public.cadastro_arbitros FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'enviado');

DROP POLICY IF EXISTS "Público pode inserir modalidades" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "Público pode inserir modalidades" ON public.cadastro_arbitros_modalidades FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pendente' AND observacoes IS NULL);

CREATE OR REPLACE FUNCTION public.arbitro_cpf_cadastrado(p_cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) <> 11 THEN
    RETURN false;
  END IF;
  PERFORM public.limite_publico_consumir('arbitro_cpf', 30, 'arbitros');
  RETURN EXISTS (
    SELECT 1
    FROM public.cadastro_arbitros
    WHERE regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g'));
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_denuncia_publica(p_anonima boolean, p_tipo text, p_envolvidos text, p_data_ocorrencia text, p_local_ocorrencia text, p_descricao text, p_evidencias text DEFAULT NULL::text, p_nome text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_cargo text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _protocolo text;
  _id uuid;
BEGIN
  IF p_tipo NOT IN ('corrupcao', 'assedio', 'conflito', 'favorecimento', 'irregularidade', 'outro') THEN
    RAISE EXCEPTION 'Tipo de denúncia inválido';
  END IF;

  IF coalesce(trim(p_envolvidos), '') = ''
     OR coalesce(trim(p_data_ocorrencia), '') = ''
     OR coalesce(trim(p_local_ocorrencia), '') = ''
     OR coalesce(trim(p_descricao), '') = '' THEN
    RAISE EXCEPTION 'Preencha todos os campos obrigatórios da denúncia';
  END IF;

  IF NOT p_anonima AND coalesce(trim(p_nome), '') = '' THEN
    RAISE EXCEPTION 'Informe seu nome ou selecione denúncia anônima';
  END IF;

  PERFORM public.limite_publico_consumir('denuncia', 10, 'integridade');

  _protocolo := 'DEN-' || to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('public.denuncias_protocolo_seq')::text, 4, '0');

  INSERT INTO public.denuncias (
    protocolo, tipo, anonima,
    nome_denunciante, email_denunciante, telefone_denunciante, cargo_denunciante,
    envolvidos, data_ocorrencia, local_ocorrencia, descricao, evidencias
  ) VALUES (
    _protocolo, p_tipo, p_anonima,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_nome), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_email), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_telefone), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_cargo), '') END,
    p_envolvidos, p_data_ocorrencia, p_local_ocorrencia, p_descricao, nullif(trim(p_evidencias), '')
  )
  RETURNING id INTO _id;

  BEGIN
    PERFORM public.log_audit(
      'create'::audit_action,
      'denuncia',
      _id,
      'integridade',
      NULL,
      NULL,
      'Nova denúncia registrada: ' || _protocolo,
      jsonb_build_object('protocolo', _protocolo, 'tipo', p_tipo, 'anonima', p_anonima)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- auditoria é best-effort; não pode bloquear o registro da denúncia
  END;

  RETURN _protocolo;
END;
$function$;

-- As RPCs públicas mantêm o EXECUTE de anon (CREATE OR REPLACE preserva os privilégios); repetido por clareza.
REVOKE EXECUTE ON FUNCTION public.consultar_gestor_por_cpf(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_gestor_publico(uuid, text, text, text, date, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.arbitro_cpf_cadastrado(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consultar_gestor_por_cpf(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_gestor_publico(uuid, text, text, text, date, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arbitro_cpf_cadastrado(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

-- 5. Permissões de outro usuário: só o próprio ou o papel admin --------------------
CREATE OR REPLACE FUNCTION public.get_user_permission_codes(_user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Pela API (anon/authenticated) só sobre si mesmo ou sendo admin. Dentro das policies has_permission_code
  -- é chamada com auth.uid(); service role e conexões diretas não passam por aqui.
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND _user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para consultar as permissões de outro usuário' USING ERRCODE = '42501';
  END IF;
  RETURN (
    SELECT COALESCE(array_agg(DISTINCT permission), '{}'::text[])
    FROM (
      -- 1. concessão avulsa
      SELECT up.permission
      FROM public.user_permissions up
      WHERE up.user_id = _user_id
      UNION
      -- 2. padrão do papel, RESTRITO aos módulos que o usuário tem.
      --    Sem esse recorte, o papel `user` (que recebe todos os `visualizar`
      --    do catálogo) daria leitura de financeiro a quem só tem o módulo rh —
      --    o papel define o QUE se pode fazer, o módulo define ONDE.
      SELECT rp.permission
      FROM public.user_roles ur
      JOIN public.role_permissions rp
        ON rp.role = ur.role
      JOIN public.module_permissions_catalog mpc
        ON mpc.permission_code = rp.permission
      JOIN public.user_modules um
        ON um.user_id = ur.user_id
       AND um.module::text = mpc.module_code
      WHERE ur.user_id = _user_id
      UNION
      -- 3. concessão dentro do módulo
      SELECT unnest(um.permissions)
      FROM public.user_modules um
      WHERE um.user_id = _user_id
        AND um.permissions IS NOT NULL
    ) fontes(permission));
END;
$function$;

CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id uuid)
 RETURNS TABLE(funcao_id text, funcao_codigo text, funcao_nome text, modulo text, submodulo text, tipo_acao text, perfil_nome text, rota text, icone text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND check_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para consultar as permissões de outro usuário' USING ERRCODE = '42501';
  END IF;

  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = check_user_id
  ORDER BY (ur.role = 'admin') DESC
  LIMIT 1;

  -- Super admin: uma entrada sintética, o bypass é resolvido no front.
  IF user_role = 'admin' THEN
    RETURN QUERY SELECT
      'admin'::text, 'admin'::text, 'Administrador'::text,
      'admin'::text, NULL::text, 'full'::text,
      'Administrador'::text, '/admin'::text, 'shield'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mpc.id::text,
    mpc.permission_code::text,
    mpc.label::text,
    mpc.module_code::text,
    mpc.category::text,
    mpc.action_type::text,
    COALESCE(user_role, 'user')::text,
    NULL::text,
    NULL::text
  FROM public.module_permissions_catalog mpc
  WHERE mpc.permission_code = ANY (public.get_user_permission_codes(check_user_id))
  ORDER BY mpc.module_code, mpc.sort_order;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_permissions_from_servidor(_user_id uuid)
 RETURNS public.app_permission[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_servidor RECORD;
  v_permissions app_permission[] := ARRAY[]::app_permission[];
  v_role app_role;
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND _user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para consultar as permissões de outro usuário' USING ERRCODE = '42501';
  END IF;

  -- Buscar dados do servidor vinculado
  SELECT s.cargo_atual_id, s.unidade_atual_id, c.nome as cargo_nome
  INTO v_servidor
  FROM public.profiles p
  JOIN public.servidores s ON s.id = p.servidor_id
  LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
  WHERE p.id = _user_id;

  -- Se não tem servidor vinculado, retorna vazio
  IF v_servidor IS NULL THEN
    RETURN v_permissions;
  END IF;

  -- Buscar role do usuário
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  -- Buscar permissões baseadas no role
  SELECT ARRAY_AGG(DISTINCT rp.permission) INTO v_permissions
  FROM public.role_permissions rp
  WHERE rp.role = v_role;

  RETURN COALESCE(v_permissions, ARRAY[]::app_permission[]);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND _user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para consultar as permissões de outro usuário' USING ERRCODE = '42501';
  END IF;
  RETURN (
    SELECT ARRAY_AGG(DISTINCT permission::TEXT)
    FROM (
      SELECT permission FROM public.user_permissions WHERE user_id = _user_id
      UNION
      SELECT rp.permission FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role = rp.role
      WHERE ur.user_id = _user_id
    ) perms);
END;
$function$;

-- Chefe da unidade: quem lê nomeacoes_chefe_unidade pela RLS (módulos rh ou patrimonio, admin passa).
CREATE OR REPLACE FUNCTION public.get_chefe_unidade_atual(p_unidade_id uuid)
 RETURNS TABLE(nomeacao_id uuid, servidor_id uuid, servidor_nome text, cargo text, data_inicio date, ato_numero text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    n.id as nomeacao_id,
    n.servidor_id,
    s.nome_completo as servidor_nome,
    n.cargo,
    n.data_inicio,
    n.ato_numero
  FROM public.nomeacoes_chefe_unidade n
  JOIN public.servidores s ON s.id = n.servidor_id
  WHERE n.unidade_local_id = p_unidade_id
    AND n.status = 'ativo'
    AND (coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated')
         OR public.can_access_module(auth.uid(), 'rh')
         OR public.can_access_module(auth.uid(), 'patrimonio'))
  ORDER BY n.data_inicio DESC
  LIMIT 1;
$function$;
