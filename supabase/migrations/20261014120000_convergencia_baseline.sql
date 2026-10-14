-- Convergência: as migrações passam a produzir o mesmo banco que a produção (P02 do plano de finalização).
--
-- A Fotografia do banco de 14/10/2026 mostrou que a produção foi montada pelo baseline (supabase/baseline/):
-- das 364 diferenças entre produção e migrações, 361 batiam com o baseline. As correções dos overlays
-- (RLS por módulo `rls_*`, fim do "acesso total", `anon` sem privilégio, funções corrigidas, campos iniciais
-- dos formulários públicos, storage) nunca tinham virado migração. Quem montasse um banco pelas migrações
-- (teste, homologação, outra instituição) recebia o estado antigo e inseguro.
--
-- Conteúdo: os overlays do baseline e as policies geradas, na ordem de supabase/baseline/aplicar.sh, copiados
-- sem mudança, exceto o upsert de buckets (ver o bloco do 50_storage abaixo). Todos são idempotentes.
--   * Na PRODUÇÃO (que já é o baseline) é no-op: aplicada sobre um banco do baseline, o pg_dump de public, storage
--     e auth (com GRANTs, default privileges e o trigger de auth.users), os buckets e a publicação do realtime
--     ficam idênticos; e a fotografia da produção real só difere desse banco em 2 triggers internos do Storage.
--   * Num banco das migrações, deixa a estrutura igual à do baseline (fotografia sem diferença).
-- Inclui o bucket público `emails` (templates do Auth), que na produção foi criado à mão.
--
-- ATENÇÃO num banco antigo montado só pelas migrações e COM dados (homologação, outra instância): ela apaga a
-- tabela morta `_backup_usuario_modulos_old`, troca as policies antigas pelas do mapa (`rls/mapa.csv`) e tira o
-- acesso de `anon`. É o objetivo, mas confira o acesso dos usuários depois.
--
-- Pega lock exclusivo, até o COMMIT, nas ~245 tabelas cujas policies recria: o lock_timeout faz a migração
-- falhar (e desfazer tudo) em vez de ficar na fila atrás de uma consulta longa travando login e Storage.
--
-- Ao mudar um overlay, o histórico precisa de migração nova com a mudança (esta não é regenerada).

SET lock_timeout = '10s';

-- ====================================================================================================
-- supabase/baseline/overlay/10_funcoes_acesso.sql
-- ====================================================================================================

-- Funções de acesso: troca os "stubs de acesso total" e as funções que leem tabelas removidas.
--
-- No estado que as migrações produzem (validado em Postgres vazio), cinco funções de acesso
-- eram `SELECT auth.uid() IS NOT NULL`, ou seja, todo usuário logado passava em qualquer
-- checagem de super admin / papel / módulo. Outras liam usuario_perfis, perfil_funcoes e
-- funcoes_sistema (removidas em 20260207182933) e quebram ao executar.
--
-- Aqui elas passam a seguir o modelo vigente: papel em user_roles, módulo em user_modules e
-- permissão granular via has_permission_code(). can_access_module(uuid, text) já estava correta
-- (perfil ativo E (papel admin OU módulo concedido)) e é a base das policies por módulo.
--
-- Perfil ATIVO é pré-condição de tudo: is_admin_user, is_admin_atual, has_permission_code e
-- meu_servidor_id não olhavam profiles.is_active, então um administrador bloqueado continuava
-- administrador e um servidor bloqueado continuava lendo a própria ficha. Agora olham.
--
-- Todas SECURITY DEFINER com search_path fixo, como o resto do schema. Aplicar DEPOIS do schema.

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

-- Dependiam de usuario_eh_admin / usuario_modulos / modulos_sistema (não existem mais) e não são
-- usadas por policy, função ou código. Removidas em vez de mantidas quebradas.
DROP FUNCTION IF EXISTS public.usuario_tem_acesso_modulo(uuid, text);
DROP FUNCTION IF EXISTS public.usuario_tem_acesso_rota(uuid, text);

-- Só o super admin promove rascunho (a checagem lia usuario_perfis, removida: sempre falhava).
CREATE OR REPLACE FUNCTION public.promover_rascunho(p_rascunho_id uuid, p_justificativa text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rascunho RECORD;
  v_proxima_versao INTEGER;
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode promover conteúdo';
  END IF;

  SELECT * INTO v_rascunho FROM public.conteudo_rascunho WHERE id = p_rascunho_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rascunho não encontrado';
  END IF;

  SELECT COALESCE(MAX(versao), 0) + 1 INTO v_proxima_versao
  FROM public.historico_conteudo_oficial
  WHERE tipo = v_rascunho.tipo AND identificador IS NOT DISTINCT FROM v_rascunho.identificador;

  INSERT INTO public.historico_conteudo_oficial (
    tipo, identificador, titulo, conteudo, conteudo_estruturado,
    versao, promovido_por, justificativa
  ) VALUES (
    v_rascunho.tipo, v_rascunho.identificador, v_rascunho.titulo,
    v_rascunho.conteudo, v_rascunho.conteudo_estruturado,
    v_proxima_versao, auth.uid(), p_justificativa
  );

  UPDATE public.conteudo_rascunho
  SET status = 'publicado', aprovado_por = auth.uid(), aprovado_em = now(), updated_at = now()
  WHERE id = p_rascunho_id;

  RETURN true;
END;
$$;

-- Servidor vinculado ao usuário logado: base das policies "o próprio servidor vê o que é seu"
-- (contracheque, ponto, pedidos). Definer para não depender da RLS de profiles.
CREATE OR REPLACE FUNCTION public.meu_servidor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT servidor_id FROM public.profiles WHERE id = auth.uid() AND is_active;
$$;

-- Este servidor é do usuário logado? Base de ";sem_autoaprovacao" (rls/mapa.csv) e da isenção por permissão de
-- forcar_campos_iniciais (overlay 20): ninguém decide sobre o próprio pedido. Verdadeira quando _servidor_id =
-- meu_servidor_id() ou, se o perfil não tem vínculo (meu_servidor_id() nulo), quando o CPF do perfil é o do
-- servidor: só os dígitos, completados com zeros à esquerda até 11 (CPF gravado sem o zero inicial casa); CPF nulo
-- ou sem dígitos nunca casa. O aprovador sem vínculo que é servidor não aprova o próprio pedido. Nunca devolve
-- NULL; meu_servidor_id() é lido uma vez só. Mesmo texto na migração 20261010100000_onda_b_rh_contornos.sql
-- (a primeira versão, em SQL, veio na 20261010090000).
-- EXECUTE só para authenticated (as policies a chamam como o usuário; a service role não passa por RLS).
CREATE OR REPLACE FUNCTION public.eh_meu_servidor(_servidor_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meu uuid;
  v_cpf text;
BEGIN
  IF _servidor_id IS NULL OR auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  v_meu := public.meu_servidor_id();
  IF v_meu IS NOT NULL THEN
    RETURN _servidor_id = v_meu;
  END IF;
  SELECT regexp_replace(coalesce(p.cpf, ''), '[^0-9]', '', 'g') INTO v_cpf
    FROM public.profiles p WHERE p.id = auth.uid();
  IF coalesce(v_cpf, '') = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.servidores s
     WHERE s.id = _servidor_id
       AND regexp_replace(coalesce(s.cpf, ''), '[^0-9]', '', 'g') <> ''
       AND lpad(regexp_replace(s.cpf, '[^0-9]', '', 'g'), 11, '0') = lpad(v_cpf, 11, '0'));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.eh_meu_servidor(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eh_meu_servidor(uuid) TO authenticated;

-- B3 (storage do RH): o objeto do bucket `frequencias` é o PDF de frequência do usuário logado? Verdadeira quando há
-- uma linha em frequencia_arquivos com arquivo_path = _path e servidor_id = meu_servidor_id() (o vínculo do perfil
-- ativo: o mesmo dono da RLS de frequencia_arquivos, ;proprio; sem vínculo, nada). Perfil ativo é pré-condição.
-- SECURITY DEFINER porque o servidor não precisa enxergar a linha de frequencia_arquivos pela RLS para ler o seu PDF. Nunca devolve NULL. Mesmo texto na migração 20261010210000_onda_b_rh_storage.sql; EXECUTE só para
-- authenticated (overlay/40).
CREATE OR REPLACE FUNCTION public.eh_meu_arquivo_frequencia(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
     AND _path IS NOT NULL
     AND public.is_active_user()
     AND EXISTS (
       SELECT 1
         FROM public.frequencia_arquivos fa
        WHERE fa.arquivo_path = _path
          AND fa.servidor_id = public.meu_servidor_id());
$$;

-- B3: o objeto do bucket `documentos-requerimento` está na pasta do servidor do usuário logado? O caminho é
-- <servidor_id>/<doc_id>.<ext> (DocumentosServidorTab): a primeira pasta precisa ter formato de uuid (conferido ANTES
-- do cast, para nome fora do padrão dar false e não erro) e ser meu_servidor_id() (mesmo dono da RLS ;proprio).
-- Perfil ativo é pré-condição.
-- Nunca devolve NULL. Mesmo texto na migração 20261010210000_onda_b_rh_storage.sql; EXECUTE só para authenticated
-- (overlay/40).
CREATE OR REPLACE FUNCTION public.eh_minha_pasta_servidor(_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pasta text;
BEGIN
  IF _name IS NULL OR auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RETURN false;
  END IF;
  v_pasta := (storage.foldername(_name))[1];
  IF v_pasta IS NULL
     OR v_pasta !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  RETURN coalesce(v_pasta::uuid = public.meu_servidor_id(), false);
END;
$$;

-- ---- perfil ativo como pré-condição ----
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

-- Os triggers de folha chamam usuario_eh_admin(uuid), função transitória removida em 20260207182933
-- sem que seus chamadores fossem atualizados: fechar/reabrir/enviar folha para conferência sempre
-- falhava. O alias devolve a função ao modelo vigente.
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

-- ====================================================================================================
-- supabase/baseline/overlay/12_protecao_profiles.sql
-- ====================================================================================================

-- profiles: o usuário não pode se ativar, se desbloquear nem assumir o servidor de outra pessoa.
--
-- Estado das migrações: profiles_update_own/upd_profiles_own_or_admin deixavam QUALQUER usuário
-- logado fazer UPDATE da própria linha em todas as colunas. Reproduzido em banco vazio:
--   UPDATE profiles SET is_active = true, servidor_id = '<servidor alheio>' WHERE id = auth.uid()
-- ativava a conta (criada inativa por handle_new_user), reativava a conta bloqueada de um
-- ex-servidor e dava acesso ao contracheque, ao ponto e aos pedidos de outro servidor.
--
-- Correção em duas camadas:
--   1. trigger BEFORE UPDATE: quem age como `authenticated`/`anon` e não é admin não muda as
--      colunas de identidade, vínculo e bloqueio. Funções SECURITY DEFINER (donas: postgres),
--      a service role (Edge Functions) e administradores passam, como antes;
--   2. policies reescritas sem duplicatas: INSERT e DELETE só por administrador (o perfil nasce
--      em handle_new_user; INSERT com id = auth.uid() deixava recriar o próprio perfil ATIVO).
--
-- O que um usuário comum ainda edita na própria linha: full_name, avatar_url,
-- requires_password_change (a tela de troca de senha obrigatória) e updated_at.

CREATE OR REPLACE FUNCTION public.profiles_proteger_colunas()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.is_admin_user(auth.uid()) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.blocked_at IS DISTINCT FROM OLD.blocked_at
       OR NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason
       OR NEW.servidor_id IS DISTINCT FROM OLD.servidor_id
       OR NEW.tipo_usuario IS DISTINCT FROM OLD.tipo_usuario
       OR NEW.restringir_modulos IS DISTINCT FROM OLD.restringir_modulos
       OR NEW.cpf IS DISTINCT FROM OLD.cpf
    THEN
      RAISE EXCEPTION 'Somente administradores alteram identidade, vínculo e bloqueio do perfil'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_proteger_colunas ON public.profiles;
CREATE TRIGGER profiles_proteger_colunas
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_proteger_colunas();

-- Policies: nomes antigos (duplicados) saem; ficam quatro.
DO $$
DECLARE nome text;
BEGIN
  FOREACH nome IN ARRAY ARRAY[
    'del_profiles_admin', 'ins_profiles_admin', 'profiles_insert_system', 'profiles_select_own',
    'profiles_update_own', 'sel_profiles_own_or_admin', 'upd_profiles_own_or_admin',
    'profiles_select', 'profiles_insert', 'profiles_update', 'profiles_delete'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', nome);
  END LOOP;
END $$;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin_user(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY profiles_delete ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- ====================================================================================================
-- supabase/baseline/overlay/15_novo_usuario.sql
-- ====================================================================================================

-- handle_new_user: criar usuário no Auth falhava.
--
-- O trigger on_auth_user_created chama handle_new_user(), que inseria em profiles sem
-- tipo_usuario, coluna NOT NULL sem valor padrão (o types.ts do banco ao vivo mostra a mesma
-- restrição): todo INSERT em auth.users abortava. A Edge Function admin-create-user usa a mesma
-- regra de tipo (tecnico quando informado, senão servidor), mantida aqui.
-- O perfil nasce INATIVO e com papel 'user' (mesma política de antes); um admin ativa.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_active, tipo_usuario)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false,
    CASE WHEN NEW.raw_user_meta_data->>'tipo_usuario' = 'tecnico' THEN 'tecnico' ELSE 'servidor' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- O trigger vive em auth.users (fora de `public`, portanto fora do dump do schema): é recriado aqui.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================================================
-- supabase/baseline/overlay/18_funcoes_rpc.sql
-- ====================================================================================================

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
--     Desde a E2 (20261011000300, mesmo texto) as duas gravam module_name 'rh' (antes 'folha').
--     Desde a E3 (20261011010000, mesmo texto) reabrir_folha trava a folha, recusa folha com remessa ativa e tira da
--     vigência os eventos do eSocial rascunho da folha.
--     Desde o protocolo do RH (20261012110000, mesmo texto) as duas registram protocolo (`rh_protocolo_atual`).
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
  
  PERFORM public.rh_protocolo_atual('folha', format('Fechamento da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

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
    'update', 'folhas_pagamento', p_folha_id, 'rh',
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
  v_remessas text;
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
  
  -- Buscar folha (travada até o fim: geração de remessa/eSocial em curso termina antes; a que vier depois espera)
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;

  -- Remessa bancária ativa: cancelar antes (E3)
  SELECT string_agg(r.numero_remessa::text, ', ' ORDER BY r.numero_remessa) INTO v_remessas
    FROM public.remessas_bancarias r
   WHERE r.folha_id = p_folha_id AND r.status <> 'cancelada';
  IF v_remessas IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('A folha tem remessa bancária ativa (nº %s). Cancele a remessa antes de reabrir a folha.', v_remessas));
  END IF;
  
  PERFORM public.rh_protocolo_atual('folha', format('Reabertura da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;

  -- Eventos do eSocial rascunho da folha saem da vigência (E3)
  UPDATE public.eventos_esocial
     SET status = 'erro', mensagem_retorno = 'Folha reaberta: gere o evento de novo depois de fechar'
   WHERE folha_id = p_folha_id AND recibo IS NULL AND status NOT IN ('erro', 'rejeitado');
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
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
--     Desde a E2 (20261011000200, mesmo texto): recusa entity_type storage.* e tira servidor_alvo_id dos metadados.
--     Desde a regra de setor (20261011020000, mesmo texto): org_unit_id = unidade da lotação vigente do login.
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
  -- linha de arquivo do Storage (entity_type storage.<bucket>) só vem do trigger trilha_storage (E2)
  IF lower(btrim(coalesce(_entity_type, ''))) LIKE 'storage.%' THEN
    RAISE EXCEPTION 'log_audit: entity_type storage.* é gravado só pelo banco (trilha do Storage)' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_before_data::text, '')) > 32768 OR length(coalesce(_after_data::text, '')) > 32768
     OR length(coalesce(_metadata::text, '')) > 32768 THEN
    RAISE EXCEPTION 'log_audit: antes, depois e metadados têm limite de 32 KB cada' USING ERRCODE = '22023';
  END IF;
  _meta := CASE WHEN _metadata IS NULL THEN '{}'::jsonb
                WHEN jsonb_typeof(_metadata) = 'object' THEN _metadata
                ELSE jsonb_build_object('valor', _metadata) END;
  _meta := (_meta - ARRAY['trigger', 'operation', 'table', 'registrar_evento', 'fonte', 'servidor_alvo_id'])
           || jsonb_build_object('fonte', 'log_audit');

  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  -- unidade da lotação vigente do servidor do login (como o resto da trilha, regra de setor 20261011020000); antes,
  -- a unidade principal de user_org_units (escopo de acesso, não onde a pessoa trabalha)
  SELECT lv.unidade_id INTO _user_org_unit
    FROM public.profiles p CROSS JOIN LATERAL public.lotacao_vigente(p.servidor_id) lv
   WHERE p.id = auth.uid() AND p.servidor_id IS NOT NULL
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

-- Cota de uso por usuário das Edge Functions caras ou abusáveis (migração 20261010233100): conta e registra
-- em audit_logs na mesma transação, sob lock por (tipo, usuário). Só a service role executa (40_privilegios).
CREATE OR REPLACE FUNCTION public.consumir_cota_uso(
  _usuario uuid, _tipo text, _quantidade integer, _limite integer, _modulo text, _descricao text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  usado integer;
BEGIN
  IF _usuario IS NULL OR _tipo IS NULL OR coalesce(_quantidade, 0) < 1 OR coalesce(_limite, 0) < 1 THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cota_uso:' || _tipo), hashtext(_usuario::text));
  SELECT coalesce(sum(coalesce((metadata ->> 'quantidade')::integer, 1)), 0) INTO usado
    FROM public.audit_logs
   WHERE user_id = _usuario AND entity_type = _tipo AND "timestamp" >= now() - interval '1 hour';
  IF usado + _quantidade > _limite THEN
    RETURN false;
  END IF;
  INSERT INTO public.audit_logs (action, entity_type, user_id, module_name, description, metadata)
  VALUES ('submit', _tipo, _usuario, _modulo, _descricao, jsonb_build_object('quantidade', _quantidade));
  RETURN true;
END;
$$;

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

-- ====================================================================================================
-- supabase/baseline/overlay/20_campos_iniciais.sql
-- ====================================================================================================

-- Formulários públicos e pedidos do servidor: quem não gere o módulo não escolhe status nem aprovação.
--
-- As policies de INSERT desses formulários só conferiam "quem é" (anon/true ou servidor_id próprio)
-- e deixavam o autor gravar qualquer valor nas demais colunas. Reproduzido em banco vazio:
--   * servidor inseriu solicitacoes_abono com status = 'aprovado' e aprovado_rh_por/em forjados;
--   * anon inseriu federacoes_esportivas com status = 'ativo' e analisado_por preenchido, e
--     cadastro_arbitros com status = 'aprovado' e protocolo escolhido por ele.
--
-- O trigger BEFORE INSERT abaixo devolve essas colunas ao valor inicial quando o autor atua como
-- `anon`/`authenticated` (papel da sessão) SEM acesso ao módulo que administra a tabela. Quem tem o módulo (a equipe
-- que cadastra em nome de outra pessoa) e os caminhos internos (funções SECURITY DEFINER, service
-- role) não são afetados. Argumentos do trigger: módulo, depois coluna=valor (NULL = nulo; @uid =
-- auth.uid()). Colunas que a tabela não tem são ignoradas, então uma lista serve a tabelas parecidas.
-- O nome começa com "trg_forcar" para rodar ANTES de triggers que preenchem protocolo.
-- Nos pedidos do RH (Onda B / B2) o módulo sozinho não isenta: é preciso também a permissão de decidir
-- (formato `perm:` do primeiro argumento, abaixo), e nunca na linha do próprio servidor. A migração
-- 20261010090000_onda_b_rh_permissoes.sql traz a mesma função e os mesmos triggers do RH.

-- SECURITY DEFINER porque `anon` não tem EXECUTE em can_access_module (nem deve ter). Dentro de uma
-- função definer current_user vira o dono, então o papel de quem chamou vem do GUC `role` (o PostgREST
-- faz SET LOCAL ROLE anon/authenticated); service role e conexões diretas têm `role` = none/postgres.
--
-- Primeiro argumento (quem fica isento, ou seja, pode gravar status/aprovação já no INSERT):
--   <módulo>                                   quem tem o módulo (formato original; tabelas de outros domínios)
--   perm:<módulo>:<código>[|<código>...][:<tabela_pai>.<coluna_fk> | :usuario]
--                                              quem tem o módulo E qualquer dos códigos (Onda B / B2: no RH,
--                                              ter o módulo sem a permissão não basta), e mesmo assim NÃO na
--                                              linha do próprio servidor (ninguém decide sobre o próprio pedido):
--                                              a posse é NEW.servidor_id ou, com <tabela_pai>.<coluna_fk>, o
--                                              servidor_id da linha pai, conferida por eh_meu_servidor() (vínculo
--                                              do perfil ou, sem vínculo, o CPF). Com `:usuario` a posse é o
--                                              USUÁRIO: NEW.servidor_id guarda o id de profiles (FK para
--                                              profiles(id), ex.: solicitacoes_ajuste_ponto) e é comparado com
--                                              auth.uid(). O papel admin é sempre isento.
CREATE OR REPLACE FUNCTION public.forcar_campos_iniciais()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ov jsonb := '{}'::jsonb;
  kv text;
  i int;
  isento boolean;
  partes text[];
  ref text[];
  posse uuid;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF TG_ARGV[0] LIKE 'perm:%' THEN
    partes := string_to_array(TG_ARGV[0], ':');
    isento := public.can_access_module(auth.uid(), partes[2])
      AND EXISTS (SELECT 1 FROM unnest(string_to_array(partes[3], '|')) AS c(codigo)
                  WHERE public.has_permission_code(auth.uid(), c.codigo));
    IF isento AND NOT public.is_admin_user(auth.uid()) THEN
      IF partes[4] = 'usuario' THEN
        -- posse por usuário: a coluna servidor_id guarda o id de profiles
        IF (to_jsonb(NEW) ->> 'servidor_id')::uuid = auth.uid() THEN
          isento := false;
        END IF;
      ELSE
        IF partes[4] IS NOT NULL THEN
          ref := string_to_array(partes[4], '.');
          EXECUTE format('SELECT servidor_id FROM public.%I WHERE id = $1', ref[1])
            INTO posse USING (to_jsonb(NEW) ->> ref[2])::uuid;
        ELSE
          posse := (to_jsonb(NEW) ->> 'servidor_id')::uuid;
        END IF;
        IF public.eh_meu_servidor(posse) THEN
          isento := false;
        END IF;
      END IF;
    END IF;
  ELSE
    isento := public.can_access_module(auth.uid(), TG_ARGV[0]);
  END IF;
  IF NOT isento THEN
    FOR i IN 1 .. TG_NARGS - 1 LOOP
      kv := TG_ARGV[i];
      IF to_jsonb(NEW) ? split_part(kv, '=', 1) THEN
        ov := ov || jsonb_build_object(
          split_part(kv, '=', 1),
          CASE split_part(kv, '=', 2) WHEN 'NULL' THEN NULL WHEN '@uid' THEN auth.uid()::text ELSE split_part(kv, '=', 2) END
        );
      END IF;
    END LOOP;
    NEW := jsonb_populate_record(NEW, to_jsonb(NEW) || ov);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('cadastro_arbitros',                'arbitros',           'status=enviado,protocolo=NULL,created_by=@uid'),
    ('cadastro_arbitros_modalidades',    'arbitros',           'status=pendente,observacoes=NULL,created_by=@uid'),
    ('federacoes_esportivas',            'federacoes',         'status=em_analise,observacoes_internas=NULL,analisado_por=NULL,data_analise=NULL,created_by=@uid'),
    ('gestores_escolares',               'gestores_escolares', 'status=aguardando,responsavel_id=NULL,responsavel_nome=NULL,observacoes=NULL,contato_realizado=false,acesso_testado=false,data_cadastro_cbde=NULL,data_contato=NULL,data_confirmacao=NULL,created_by=@uid'),
    -- RH (Onda B / B2): isento quem tem o módulo E rh.aprovar ou rh.frequencia.lancar, fora da própria linha
    -- (solicitacoes_ajuste_ponto.servidor_id tem FK para profiles(id): posse por usuário, `:usuario`)
    ('solicitacoes_abono',               'perm:rh:rh.aprovar|rh.frequencia.lancar', 'status=pendente,aprovado_chefia_por=NULL,aprovado_chefia_em=NULL,aprovado_rh_por=NULL,aprovado_rh_em=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('justificativas_ponto',             'perm:rh:rh.aprovar|rh.frequencia.lancar:registros_ponto.registro_ponto_id', 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('solicitacoes_ajuste_ponto',        'perm:rh:rh.aprovar|rh.frequencia.lancar:usuario', 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    -- B3 (migração 20261010210000): isento só quem tem o módulo E rh.servidores.editar, fora do próprio pedido; o
    -- servidor que pede o próprio documento não grava arquivo assinado, data do envio nem link de modelo
    ('documentos_requerimento_servidor', 'perm:rh:rh.servidores.editar', 'status=pendente,arquivo_assinado_url=NULL,data_upload_assinado=NULL,modelo_url=NULL,created_by=@uid')
  ) AS v(tabela, isencao, campos)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.%I', r.tabela);
    EXECUTE format(
      'CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais(%s)',
      r.tabela,
      (SELECT string_agg(quote_literal(x), ', ') FROM unnest(ARRAY[r.isencao] || string_to_array(r.campos, ',')) AS x)
    );
  END LOOP;
END $$;

-- Formulário público de gestores escolares: o INSERT anônimo só cria pré-cadastro "aguardando" (igual à
-- migração 20261010170000; o trigger acima já força o status, a policy recusa em vez de corrigir).
DROP POLICY IF EXISTS "insercao_publica_gestores" ON public.gestores_escolares;
CREATE POLICY "insercao_publica_gestores" ON public.gestores_escolares FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'aguardando');

-- Links gravados por quem envia o formulário público (foto e documentos do árbitro) aparecem como <a href>
-- na tela da equipe: `javascript:` ou um endereço de phishing viravam link clicável dentro do sistema.
-- Só ficam endereços do próprio bucket arbitros-docs (como o getPublicUrl do front os gera).
CREATE OR REPLACE FUNCTION public.sanear_urls_arbitros()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  j jsonb := to_jsonb(NEW);
  padrao constant text := '^https?://[^/]+/storage/v1/object/public/arbitros-docs/';
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND NOT public.can_access_module(auth.uid(), 'arbitros') THEN
    IF j ? 'foto_url' AND j->>'foto_url' IS NOT NULL AND j->>'foto_url' !~ padrao THEN
      j := j || jsonb_build_object('foto_url', NULL);
    END IF;
    IF j ? 'documentos_urls' AND jsonb_typeof(j->'documentos_urls') = 'array' THEN
      j := j || jsonb_build_object('documentos_urls', COALESCE(
        (SELECT jsonb_agg(e) FROM jsonb_array_elements(j->'documentos_urls') e
          WHERE jsonb_typeof(e) = 'string' AND (e #>> '{}') ~ padrao), '[]'::jsonb));
    ELSIF j ? 'documentos_urls' THEN
      j := j || jsonb_build_object('documentos_urls', '[]'::jsonb);
    END IF;
    NEW := jsonb_populate_record(NEW, j);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forcar_urls_arbitros ON public.cadastro_arbitros;
CREATE TRIGGER trg_forcar_urls_arbitros BEFORE INSERT OR UPDATE ON public.cadastro_arbitros
  FOR EACH ROW EXECUTE FUNCTION public.sanear_urls_arbitros();
DROP TRIGGER IF EXISTS trg_forcar_urls_arbitros ON public.cadastro_arbitros_modalidades;
CREATE TRIGGER trg_forcar_urls_arbitros BEFORE INSERT OR UPDATE ON public.cadastro_arbitros_modalidades
  FOR EACH ROW EXECUTE FUNCTION public.sanear_urls_arbitros();

-- ====================================================================================================
-- supabase/baseline/overlay/30_remover_acesso_total.sql
-- ====================================================================================================

-- Remove TODAS as policies `acesso_total_*` (SELECT/INSERT/UPDATE/DELETE para qualquer usuário
-- logado, `auth.uid() IS NOT NULL`) deixadas pela migração 20260220132907.
-- Aplicar ANTES de rls/35_policies_geradas.sql.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname ILIKE 'acesso_total%'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Cópia de segurança legada de user_modules (migração de 2026): sem uso no app nem em funções, e
-- sem dado num banco novo. Não faz sentido nascer junto com o schema.
DROP TABLE IF EXISTS public._backup_usuario_modulos_old;

-- ====================================================================================================
-- supabase/baseline/rls/35_policies_geradas.sql
-- ====================================================================================================

-- GERADO por scripts/db/gerar-rls.mjs a partir de supabase/baseline/rls/mapa.csv.
-- NÃO edite à mão: altere o mapa e rode `node scripts/db/gerar-rls.mjs`.
--
-- Depende de: overlay/10_funcoes_acesso.sql (is_active_user, is_admin_user, meu_servidor_id
-- reescritos para exigir perfil ativo; can_access_module já era correta) e de
-- overlay/30_remover_acesso_total.sql (remove as policies acesso_total_* antes de estas entrarem).
-- Todas as policies são TO authenticated; nenhuma concede acesso a anon.

-- acesso_processo_sigiloso  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_select" ON public.acesso_processo_sigiloso FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_insert" ON public.acesso_processo_sigiloso FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_update" ON public.acesso_processo_sigiloso FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_delete" ON public.acesso_processo_sigiloso FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- acoes  [modulo: programas]
DROP POLICY IF EXISTS "rls_select" ON public.acoes;
CREATE POLICY "rls_select" ON public.acoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.acoes;
CREATE POLICY "rls_insert" ON public.acoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.acoes;
CREATE POLICY "rls_update" ON public.acoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.acoes;
CREATE POLICY "rls_delete" ON public.acoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));

-- adicionais_tempo_servico  [modulo: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rh_module_select" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rh_module_update" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rh_module_write" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rls_select" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_select" ON public.adicionais_tempo_servico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_insert" ON public.adicionais_tempo_servico FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_update" ON public.adicionais_tempo_servico FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_delete" ON public.adicionais_tempo_servico FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- aditivos_contrato  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "comp_module_select" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "comp_module_update" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "comp_module_write" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "rls_select" ON public.aditivos_contrato;
CREATE POLICY "rls_select" ON public.aditivos_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.aditivos_contrato;
CREATE POLICY "rls_insert" ON public.aditivos_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.aditivos_contrato;
CREATE POLICY "rls_update" ON public.aditivos_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.aditivos_contrato;
CREATE POLICY "rls_delete" ON public.aditivos_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- agenda_unidade  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_select" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_update" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_write" ON public.agenda_unidade;
DROP POLICY IF EXISTS "rls_select" ON public.agenda_unidade;
CREATE POLICY "rls_select" ON public.agenda_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.agenda_unidade;
CREATE POLICY "rls_insert" ON public.agenda_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.agenda_unidade;
CREATE POLICY "rls_update" ON public.agenda_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.agenda_unidade;
CREATE POLICY "rls_delete" ON public.agenda_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- agrupamento_unidade_vinculo  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_select" ON public.agrupamento_unidade_vinculo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_insert" ON public.agrupamento_unidade_vinculo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_update" ON public.agrupamento_unidade_vinculo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_delete" ON public.agrupamento_unidade_vinculo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- almoxarifados  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_select" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_update" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_write" ON public.almoxarifados;
DROP POLICY IF EXISTS "rls_select" ON public.almoxarifados;
CREATE POLICY "rls_select" ON public.almoxarifados FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.almoxarifados;
CREATE POLICY "rls_insert" ON public.almoxarifados FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.almoxarifados;
CREATE POLICY "rls_update" ON public.almoxarifados FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.almoxarifados;
CREATE POLICY "rls_delete" ON public.almoxarifados FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- approval_delegations  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.approval_delegations;
CREATE POLICY "rls_select" ON public.approval_delegations FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.approval_delegations;
CREATE POLICY "rls_insert" ON public.approval_delegations FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.approval_delegations;
CREATE POLICY "rls_update" ON public.approval_delegations FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.approval_delegations;
CREATE POLICY "rls_delete" ON public.approval_delegations FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- approval_requests  [modulo: workflow | admin]
DROP POLICY IF EXISTS "rls_select" ON public.approval_requests;
CREATE POLICY "rls_select" ON public.approval_requests FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.approval_requests;
CREATE POLICY "rls_insert" ON public.approval_requests FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.approval_requests;
CREATE POLICY "rls_update" ON public.approval_requests FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.approval_requests;
CREATE POLICY "rls_delete" ON public.approval_requests FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));

-- atas_registro_preco  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "comp_module_select" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "comp_module_update" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "comp_module_write" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "rls_select" ON public.atas_registro_preco;
CREATE POLICY "rls_select" ON public.atas_registro_preco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.atas_registro_preco;
CREATE POLICY "rls_insert" ON public.atas_registro_preco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.atas_registro_preco;
CREATE POLICY "rls_update" ON public.atas_registro_preco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.atas_registro_preco;
CREATE POLICY "rls_delete" ON public.atas_registro_preco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- audit_colunas_sensiveis  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_select" ON public.audit_colunas_sensiveis FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_insert" ON public.audit_colunas_sensiveis FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_update" ON public.audit_colunas_sensiveis FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_delete" ON public.audit_colunas_sensiveis FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- audit_log_licitacoes  [trilha: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.audit_log_licitacoes;
CREATE POLICY "rls_select" ON public.audit_log_licitacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- audit_logs  [admin_leitura]
DROP POLICY IF EXISTS "admin_only_select" ON public.audit_logs;
DROP POLICY IF EXISTS "rls_select" ON public.audit_logs;
CREATE POLICY "rls_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- avaliacoes_controle  [modulo: governanca | integridade]
DROP POLICY IF EXISTS "rls_select" ON public.avaliacoes_controle;
CREATE POLICY "rls_select" ON public.avaliacoes_controle FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_insert" ON public.avaliacoes_controle;
CREATE POLICY "rls_insert" ON public.avaliacoes_controle FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_update" ON public.avaliacoes_controle;
CREATE POLICY "rls_update" ON public.avaliacoes_controle FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_delete" ON public.avaliacoes_controle;
CREATE POLICY "rls_delete" ON public.avaliacoes_controle FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));

-- avaliacoes_risco  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.avaliacoes_risco;
CREATE POLICY "rls_select" ON public.avaliacoes_risco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.avaliacoes_risco;
CREATE POLICY "rls_insert" ON public.avaliacoes_risco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.avaliacoes_risco;
CREATE POLICY "rls_update" ON public.avaliacoes_risco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.avaliacoes_risco;
CREATE POLICY "rls_delete" ON public.avaliacoes_risco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- avisos  [preservar: comunicacao]
-- (nenhuma policy gerada)

-- avisos_leituras  [preservar: comunicacao]
-- (nenhuma policy gerada)

-- backup_config  [admin]
DROP POLICY IF EXISTS "admin_only_delete" ON public.backup_config;
DROP POLICY IF EXISTS "admin_only_insert" ON public.backup_config;
DROP POLICY IF EXISTS "admin_only_select" ON public.backup_config;
DROP POLICY IF EXISTS "admin_only_update" ON public.backup_config;
DROP POLICY IF EXISTS "rls_select" ON public.backup_config;
CREATE POLICY "rls_select" ON public.backup_config FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.backup_config;
CREATE POLICY "rls_insert" ON public.backup_config FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.backup_config;
CREATE POLICY "rls_update" ON public.backup_config FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.backup_config;
CREATE POLICY "rls_delete" ON public.backup_config FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- backup_history  [admin]
DROP POLICY IF EXISTS "admin_only_delete" ON public.backup_history;
DROP POLICY IF EXISTS "admin_only_insert" ON public.backup_history;
DROP POLICY IF EXISTS "admin_only_select" ON public.backup_history;
DROP POLICY IF EXISTS "admin_only_update" ON public.backup_history;
DROP POLICY IF EXISTS "rls_select" ON public.backup_history;
CREATE POLICY "rls_select" ON public.backup_history FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.backup_history;
CREATE POLICY "rls_insert" ON public.backup_history FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.backup_history;
CREATE POLICY "rls_update" ON public.backup_history FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.backup_history;
CREATE POLICY "rls_delete" ON public.backup_history FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- backup_integrity_checks  [admin]
DROP POLICY IF EXISTS "admin_only_delete" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "admin_only_insert" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "admin_only_select" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "admin_only_update" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "rls_select" ON public.backup_integrity_checks;
CREATE POLICY "rls_select" ON public.backup_integrity_checks FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.backup_integrity_checks;
CREATE POLICY "rls_insert" ON public.backup_integrity_checks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.backup_integrity_checks;
CREATE POLICY "rls_update" ON public.backup_integrity_checks FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.backup_integrity_checks;
CREATE POLICY "rls_delete" ON public.backup_integrity_checks FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- baixas_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_select" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_update" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_write" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "rls_select" ON public.baixas_patrimonio;
CREATE POLICY "rls_select" ON public.baixas_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.baixas_patrimonio;
CREATE POLICY "rls_insert" ON public.baixas_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.baixas_patrimonio;
CREATE POLICY "rls_update" ON public.baixas_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.baixas_patrimonio;
CREATE POLICY "rls_delete" ON public.baixas_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- banco_horas  [permissao: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.banco_horas;
DROP POLICY IF EXISTS "rh_module_select" ON public.banco_horas;
DROP POLICY IF EXISTS "rh_module_update" ON public.banco_horas;
DROP POLICY IF EXISTS "rh_module_write" ON public.banco_horas;
DROP POLICY IF EXISTS "rls_select" ON public.banco_horas;
CREATE POLICY "rls_select" ON public.banco_horas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR (servidor_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.banco_horas;
CREATE POLICY "rls_insert" ON public.banco_horas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.banco_horas;
CREATE POLICY "rls_update" ON public.banco_horas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.banco_horas;
CREATE POLICY "rls_delete" ON public.banco_horas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));

-- bancos_cnab  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.bancos_cnab;
CREATE POLICY "rls_select" ON public.bancos_cnab FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.bancos_cnab;
CREATE POLICY "rls_insert" ON public.bancos_cnab FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.bancos_cnab;
CREATE POLICY "rls_update" ON public.bancos_cnab FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.bancos_cnab;
CREATE POLICY "rls_delete" ON public.bancos_cnab FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- bens_patrimoniais  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_select" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_update" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_write" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "rls_select" ON public.bens_patrimoniais;
CREATE POLICY "rls_select" ON public.bens_patrimoniais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.bens_patrimoniais;
CREATE POLICY "rls_insert" ON public.bens_patrimoniais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.bens_patrimoniais;
CREATE POLICY "rls_update" ON public.bens_patrimoniais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.bens_patrimoniais;
CREATE POLICY "rls_delete" ON public.bens_patrimoniais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- cadastro_arbitros  [modulo: arbitros]
DROP POLICY IF EXISTS "authenticated_read_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "authenticated_update_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "authenticated_delete_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "rls_select" ON public.cadastro_arbitros;
CREATE POLICY "rls_select" ON public.cadastro_arbitros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_insert" ON public.cadastro_arbitros;
CREATE POLICY "rls_insert" ON public.cadastro_arbitros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_update" ON public.cadastro_arbitros;
CREATE POLICY "rls_update" ON public.cadastro_arbitros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_delete" ON public.cadastro_arbitros;
CREATE POLICY "rls_delete" ON public.cadastro_arbitros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));

-- cadastro_arbitros_modalidades  [modulo: arbitros]
DROP POLICY IF EXISTS "arbitros_modalidades_select_authenticated" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "Admin pode deletar modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "Admin pode atualizar modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "rls_select" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_select" ON public.cadastro_arbitros_modalidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_insert" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_insert" ON public.cadastro_arbitros_modalidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_update" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_update" ON public.cadastro_arbitros_modalidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_delete" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_delete" ON public.cadastro_arbitros_modalidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));

-- calendario_federacao  [modulo: federacoes | organizacoes | comunicacao | programas]
DROP POLICY IF EXISTS "rls_select" ON public.calendario_federacao;
CREATE POLICY "rls_select" ON public.calendario_federacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.calendario_federacao;
CREATE POLICY "rls_insert" ON public.calendario_federacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.calendario_federacao;
CREATE POLICY "rls_update" ON public.calendario_federacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.calendario_federacao;
CREATE POLICY "rls_delete" ON public.calendario_federacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));

-- campanhas_inventario  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.campanhas_inventario;
CREATE POLICY "rls_select" ON public.campanhas_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.campanhas_inventario;
CREATE POLICY "rls_insert" ON public.campanhas_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.campanhas_inventario;
CREATE POLICY "rls_update" ON public.campanhas_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.campanhas_inventario;
CREATE POLICY "rls_delete" ON public.campanhas_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- campanhas_inventario_unidades  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_select" ON public.campanhas_inventario_unidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_insert" ON public.campanhas_inventario_unidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_update" ON public.campanhas_inventario_unidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_delete" ON public.campanhas_inventario_unidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- cargo_unidade_compatibilidade  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_select" ON public.cargo_unidade_compatibilidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_insert" ON public.cargo_unidade_compatibilidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_update" ON public.cargo_unidade_compatibilidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_delete" ON public.cargo_unidade_compatibilidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- cargos  [catalogo: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_select" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_update" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_write" ON public.cargos;
DROP POLICY IF EXISTS "rls_select" ON public.cargos;
CREATE POLICY "rls_select" ON public.cargos FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.cargos;
CREATE POLICY "rls_insert" ON public.cargos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.cargos;
CREATE POLICY "rls_update" ON public.cargos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.cargos;
CREATE POLICY "rls_delete" ON public.cargos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- categorias_material  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.categorias_material;
CREATE POLICY "rls_select" ON public.categorias_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.categorias_material;
CREATE POLICY "rls_insert" ON public.categorias_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.categorias_material;
CREATE POLICY "rls_update" ON public.categorias_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.categorias_material;
CREATE POLICY "rls_delete" ON public.categorias_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- categorias_noticias_eventos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_select" ON public.categorias_noticias_eventos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_insert" ON public.categorias_noticias_eventos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_update" ON public.categorias_noticias_eventos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_delete" ON public.categorias_noticias_eventos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- centros_custo  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.centros_custo;
CREATE POLICY "rls_select" ON public.centros_custo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.centros_custo;
CREATE POLICY "rls_insert" ON public.centros_custo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.centros_custo;
CREATE POLICY "rls_update" ON public.centros_custo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.centros_custo;
CREATE POLICY "rls_delete" ON public.centros_custo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- cessoes  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.cessoes;
CREATE POLICY "rls_select" ON public.cessoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.cessoes;
CREATE POLICY "rls_insert" ON public.cessoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.cessoes;
CREATE POLICY "rls_update" ON public.cessoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.cessoes;
CREATE POLICY "rls_delete" ON public.cessoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- checklists_conformidade  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.checklists_conformidade;
CREATE POLICY "rls_select" ON public.checklists_conformidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.checklists_conformidade;
CREATE POLICY "rls_insert" ON public.checklists_conformidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.checklists_conformidade;
CREATE POLICY "rls_update" ON public.checklists_conformidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.checklists_conformidade;
CREATE POLICY "rls_delete" ON public.checklists_conformidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- cms_banners  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_banners;
CREATE POLICY "rls_select" ON public.cms_banners FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_banners;
CREATE POLICY "rls_insert" ON public.cms_banners FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_banners;
CREATE POLICY "rls_update" ON public.cms_banners FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_banners;
CREATE POLICY "rls_delete" ON public.cms_banners FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_categorias  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_categorias;
CREATE POLICY "rls_select" ON public.cms_categorias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_categorias;
CREATE POLICY "rls_insert" ON public.cms_categorias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_categorias;
CREATE POLICY "rls_update" ON public.cms_categorias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_categorias;
CREATE POLICY "rls_delete" ON public.cms_categorias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_conteudos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_conteudos;
CREATE POLICY "rls_select" ON public.cms_conteudos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_conteudos;
CREATE POLICY "rls_insert" ON public.cms_conteudos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_conteudos;
CREATE POLICY "rls_update" ON public.cms_conteudos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_conteudos;
CREATE POLICY "rls_delete" ON public.cms_conteudos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_galeria_fotos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_galeria_fotos;
CREATE POLICY "rls_select" ON public.cms_galeria_fotos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_galeria_fotos;
CREATE POLICY "rls_insert" ON public.cms_galeria_fotos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_galeria_fotos;
CREATE POLICY "rls_update" ON public.cms_galeria_fotos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_galeria_fotos;
CREATE POLICY "rls_delete" ON public.cms_galeria_fotos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_galerias  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_galerias;
CREATE POLICY "rls_select" ON public.cms_galerias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_galerias;
CREATE POLICY "rls_insert" ON public.cms_galerias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_galerias;
CREATE POLICY "rls_update" ON public.cms_galerias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_galerias;
CREATE POLICY "rls_delete" ON public.cms_galerias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_media  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_media;
CREATE POLICY "rls_select" ON public.cms_media FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_media;
CREATE POLICY "rls_insert" ON public.cms_media FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_media;
CREATE POLICY "rls_update" ON public.cms_media FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_media;
CREATE POLICY "rls_delete" ON public.cms_media FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- coletas_inventario  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.coletas_inventario;
CREATE POLICY "rls_select" ON public.coletas_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.coletas_inventario;
CREATE POLICY "rls_insert" ON public.coletas_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.coletas_inventario;
CREATE POLICY "rls_update" ON public.coletas_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.coletas_inventario;
CREATE POLICY "rls_delete" ON public.coletas_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- comissoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.comissoes;
CREATE POLICY "rls_select" ON public.comissoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.comissoes;
CREATE POLICY "rls_insert" ON public.comissoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.comissoes;
CREATE POLICY "rls_update" ON public.comissoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.comissoes;
CREATE POLICY "rls_delete" ON public.comissoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));

-- comissoes_membros  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.comissoes_membros;
CREATE POLICY "rls_select" ON public.comissoes_membros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.comissoes_membros;
CREATE POLICY "rls_insert" ON public.comissoes_membros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.comissoes_membros;
CREATE POLICY "rls_update" ON public.comissoes_membros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.comissoes_membros;
CREATE POLICY "rls_delete" ON public.comissoes_membros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.comissoes.gerenciar'));

-- composicao_cargos  [modulo: rh | governanca]
DROP POLICY IF EXISTS "rls_select" ON public.composicao_cargos;
CREATE POLICY "rls_select" ON public.composicao_cargos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.composicao_cargos;
CREATE POLICY "rls_insert" ON public.composicao_cargos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.composicao_cargos;
CREATE POLICY "rls_update" ON public.composicao_cargos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.composicao_cargos;
CREATE POLICY "rls_delete" ON public.composicao_cargos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')));

-- conciliacoes_inventario  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.conciliacoes_inventario;
CREATE POLICY "rls_select" ON public.conciliacoes_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.conciliacoes_inventario;
CREATE POLICY "rls_insert" ON public.conciliacoes_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.conciliacoes_inventario;
CREATE POLICY "rls_update" ON public.conciliacoes_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.conciliacoes_inventario;
CREATE POLICY "rls_delete" ON public.conciliacoes_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- config_agrupamento_unidades  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_select" ON public.config_agrupamento_unidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_insert" ON public.config_agrupamento_unidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_update" ON public.config_agrupamento_unidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_delete" ON public.config_agrupamento_unidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_assinatura_frequencia  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_select" ON public.config_assinatura_frequencia FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_insert" ON public.config_assinatura_frequencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_update" ON public.config_assinatura_frequencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_delete" ON public.config_assinatura_frequencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_assinatura_reuniao  [modulo: gabinete | admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_select" ON public.config_assinatura_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_insert" ON public.config_assinatura_reuniao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_update" ON public.config_assinatura_reuniao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_delete" ON public.config_assinatura_reuniao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));

-- config_autarquia  [modulo: rh | financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.config_autarquia;
CREATE POLICY "rls_select" ON public.config_autarquia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_autarquia;
CREATE POLICY "rls_insert" ON public.config_autarquia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.config_autarquia;
CREATE POLICY "rls_update" ON public.config_autarquia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_autarquia;
CREATE POLICY "rls_delete" ON public.config_autarquia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));

-- config_compensacao  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_compensacao;
CREATE POLICY "rls_select" ON public.config_compensacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_compensacao;
CREATE POLICY "rls_insert" ON public.config_compensacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_compensacao;
CREATE POLICY "rls_update" ON public.config_compensacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_compensacao;
CREATE POLICY "rls_delete" ON public.config_compensacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_envio  [preservar: admin]
-- (nenhuma policy gerada)

-- config_fechamento_folha  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_fechamento_folha;
CREATE POLICY "rls_select" ON public.config_fechamento_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_fechamento_folha;
CREATE POLICY "rls_insert" ON public.config_fechamento_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_fechamento_folha;
CREATE POLICY "rls_update" ON public.config_fechamento_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_fechamento_folha;
CREATE POLICY "rls_delete" ON public.config_fechamento_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_fechamento_frequencia  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_select" ON public.config_fechamento_frequencia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_insert" ON public.config_fechamento_frequencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_update" ON public.config_fechamento_frequencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_delete" ON public.config_fechamento_frequencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));

-- config_incidencias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_incidencias;
CREATE POLICY "rls_select" ON public.config_incidencias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_incidencias;
CREATE POLICY "rls_insert" ON public.config_incidencias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_incidencias;
CREATE POLICY "rls_update" ON public.config_incidencias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_incidencias;
CREATE POLICY "rls_delete" ON public.config_incidencias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_institucional  [modulo: rh | financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.config_institucional;
CREATE POLICY "rls_select" ON public.config_institucional FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_institucional;
CREATE POLICY "rls_insert" ON public.config_institucional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.config_institucional;
CREATE POLICY "rls_update" ON public.config_institucional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_institucional;
CREATE POLICY "rls_delete" ON public.config_institucional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));

-- config_jornada_padrao  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_jornada_padrao;
CREATE POLICY "rls_select" ON public.config_jornada_padrao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_jornada_padrao;
CREATE POLICY "rls_insert" ON public.config_jornada_padrao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_jornada_padrao;
CREATE POLICY "rls_update" ON public.config_jornada_padrao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_jornada_padrao;
CREATE POLICY "rls_delete" ON public.config_jornada_padrao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_menu_publico  [publico_admin]
DROP POLICY IF EXISTS "Apenas admins podem alterar menu publico" ON public.config_menu_publico;
DROP POLICY IF EXISTS "Leitura publica dos itens de menu" ON public.config_menu_publico;
DROP POLICY IF EXISTS "rls_select" ON public.config_menu_publico;
CREATE POLICY "rls_select" ON public.config_menu_publico FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.config_menu_publico;
CREATE POLICY "rls_insert" ON public.config_menu_publico FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_menu_publico;
CREATE POLICY "rls_update" ON public.config_menu_publico FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_menu_publico;
CREATE POLICY "rls_delete" ON public.config_menu_publico FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_motivos_desligamento  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_motivos_desligamento;
CREATE POLICY "rls_select" ON public.config_motivos_desligamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_motivos_desligamento;
CREATE POLICY "rls_insert" ON public.config_motivos_desligamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_motivos_desligamento;
CREATE POLICY "rls_update" ON public.config_motivos_desligamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_motivos_desligamento;
CREATE POLICY "rls_delete" ON public.config_motivos_desligamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_paginas_historico  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_paginas_historico;
CREATE POLICY "rls_select" ON public.config_paginas_historico FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.config_paginas_historico;
CREATE POLICY "rls_insert" ON public.config_paginas_historico FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_paginas_historico;
CREATE POLICY "rls_update" ON public.config_paginas_historico FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_paginas_historico;
CREATE POLICY "rls_delete" ON public.config_paginas_historico FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_paginas_publicas  [publico_admin]
DROP POLICY IF EXISTS "Apenas admins podem alterar config paginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "Leitura publica do status das paginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "leitura_publica_status_paginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "rls_select" ON public.config_paginas_publicas;
CREATE POLICY "rls_select" ON public.config_paginas_publicas FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.config_paginas_publicas;
CREATE POLICY "rls_insert" ON public.config_paginas_publicas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_paginas_publicas;
CREATE POLICY "rls_update" ON public.config_paginas_publicas FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_paginas_publicas;
CREATE POLICY "rls_delete" ON public.config_paginas_publicas FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_parametros_meta  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_parametros_meta;
CREATE POLICY "rls_select" ON public.config_parametros_meta FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.config_parametros_meta;
CREATE POLICY "rls_insert" ON public.config_parametros_meta FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_parametros_meta;
CREATE POLICY "rls_update" ON public.config_parametros_meta FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_parametros_meta;
CREATE POLICY "rls_delete" ON public.config_parametros_meta FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_parametros_valores  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_parametros_valores;
CREATE POLICY "rls_select" ON public.config_parametros_valores FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.config_parametros_valores;
CREATE POLICY "rls_insert" ON public.config_parametros_valores FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_parametros_valores;
CREATE POLICY "rls_update" ON public.config_parametros_valores FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_parametros_valores;
CREATE POLICY "rls_delete" ON public.config_parametros_valores FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_regras_calculo  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_regras_calculo;
CREATE POLICY "rls_select" ON public.config_regras_calculo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_regras_calculo;
CREATE POLICY "rls_insert" ON public.config_regras_calculo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_regras_calculo;
CREATE POLICY "rls_update" ON public.config_regras_calculo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_regras_calculo;
CREATE POLICY "rls_delete" ON public.config_regras_calculo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_rubricas  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_rubricas;
CREATE POLICY "rls_select" ON public.config_rubricas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_rubricas;
CREATE POLICY "rls_insert" ON public.config_rubricas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_rubricas;
CREATE POLICY "rls_update" ON public.config_rubricas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_rubricas;
CREATE POLICY "rls_delete" ON public.config_rubricas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_situacoes_funcionais  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_select" ON public.config_situacoes_funcionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_insert" ON public.config_situacoes_funcionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_update" ON public.config_situacoes_funcionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_delete" ON public.config_situacoes_funcionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_ato  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_ato;
CREATE POLICY "rls_select" ON public.config_tipos_ato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_ato;
CREATE POLICY "rls_insert" ON public.config_tipos_ato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_ato;
CREATE POLICY "rls_update" ON public.config_tipos_ato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_ato;
CREATE POLICY "rls_delete" ON public.config_tipos_ato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_onus  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_onus;
CREATE POLICY "rls_select" ON public.config_tipos_onus FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_onus;
CREATE POLICY "rls_insert" ON public.config_tipos_onus FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_onus;
CREATE POLICY "rls_update" ON public.config_tipos_onus FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_onus;
CREATE POLICY "rls_delete" ON public.config_tipos_onus FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_rubrica  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_rubrica;
CREATE POLICY "rls_select" ON public.config_tipos_rubrica FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_rubrica;
CREATE POLICY "rls_insert" ON public.config_tipos_rubrica FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_rubrica;
CREATE POLICY "rls_update" ON public.config_tipos_rubrica FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_rubrica;
CREATE POLICY "rls_delete" ON public.config_tipos_rubrica FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_servidor  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_servidor;
CREATE POLICY "rls_select" ON public.config_tipos_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_servidor;
CREATE POLICY "rls_insert" ON public.config_tipos_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_servidor;
CREATE POLICY "rls_update" ON public.config_tipos_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_servidor;
CREATE POLICY "rls_delete" ON public.config_tipos_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- configuracao_jornada  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.configuracao_jornada;
CREATE POLICY "rls_select" ON public.configuracao_jornada FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.configuracao_jornada;
CREATE POLICY "rls_insert" ON public.configuracao_jornada FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.configuracao_jornada;
CREATE POLICY "rls_update" ON public.configuracao_jornada FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.configuracao_jornada;
CREATE POLICY "rls_delete" ON public.configuracao_jornada FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- consignacoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.consignacoes;
CREATE POLICY "rls_select" ON public.consignacoes FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.consignacoes;
CREATE POLICY "rls_insert" ON public.consignacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.consignacoes;
CREATE POLICY "rls_update" ON public.consignacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.consignacoes;
CREATE POLICY "rls_delete" ON public.consignacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- contas_autarquia  [modulo: financeiro | rh]
DROP POLICY IF EXISTS "rls_select" ON public.contas_autarquia;
CREATE POLICY "rls_select" ON public.contas_autarquia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro') OR public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.contas_autarquia;
CREATE POLICY "rls_insert" ON public.contas_autarquia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro') OR public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.contas_autarquia;
CREATE POLICY "rls_update" ON public.contas_autarquia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro') OR public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro') OR public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.contas_autarquia;
CREATE POLICY "rls_delete" ON public.contas_autarquia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro') OR public.can_access_module(auth.uid(), 'rh')));

-- contatos_eventos_esportivos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_select" ON public.contatos_eventos_esportivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_insert" ON public.contatos_eventos_esportivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_update" ON public.contatos_eventos_esportivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_delete" ON public.contatos_eventos_esportivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- conteudo_rascunho  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.conteudo_rascunho;
CREATE POLICY "rls_select" ON public.conteudo_rascunho FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.conteudo_rascunho;
CREATE POLICY "rls_insert" ON public.conteudo_rascunho FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.conteudo_rascunho;
CREATE POLICY "rls_update" ON public.conteudo_rascunho FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.conteudo_rascunho;
CREATE POLICY "rls_delete" ON public.conteudo_rascunho FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- contratos  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_select" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_update" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_write" ON public.contratos;
DROP POLICY IF EXISTS "rls_select" ON public.contratos;
CREATE POLICY "rls_select" ON public.contratos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.contratos;
CREATE POLICY "rls_insert" ON public.contratos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.contratos;
CREATE POLICY "rls_update" ON public.contratos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.contratos;
CREATE POLICY "rls_delete" ON public.contratos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- controles_internos  [modulo: governanca | integridade]
DROP POLICY IF EXISTS "rls_select" ON public.controles_internos;
CREATE POLICY "rls_select" ON public.controles_internos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_insert" ON public.controles_internos;
CREATE POLICY "rls_insert" ON public.controles_internos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_update" ON public.controles_internos;
CREATE POLICY "rls_update" ON public.controles_internos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_delete" ON public.controles_internos;
CREATE POLICY "rls_delete" ON public.controles_internos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));

-- creditos_adicionais  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.creditos_adicionais;
CREATE POLICY "rls_select" ON public.creditos_adicionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.creditos_adicionais;
CREATE POLICY "rls_insert" ON public.creditos_adicionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.creditos_adicionais;
CREATE POLICY "rls_update" ON public.creditos_adicionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.creditos_adicionais;
CREATE POLICY "rls_delete" ON public.creditos_adicionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- dados_oficiais  [publico_admin]
DROP POLICY IF EXISTS "rls_select" ON public.dados_oficiais;
CREATE POLICY "rls_select" ON public.dados_oficiais FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.dados_oficiais;
CREATE POLICY "rls_insert" ON public.dados_oficiais FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.dados_oficiais;
CREATE POLICY "rls_update" ON public.dados_oficiais FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.dados_oficiais;
CREATE POLICY "rls_delete" ON public.dados_oficiais FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- datas_importantes  [preservar: comunicacao]
-- (nenhuma policy gerada)

-- debitos_tecnicos  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.debitos_tecnicos;
CREATE POLICY "rls_select" ON public.debitos_tecnicos FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.debitos_tecnicos;
CREATE POLICY "rls_insert" ON public.debitos_tecnicos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.debitos_tecnicos;
CREATE POLICY "rls_update" ON public.debitos_tecnicos FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.debitos_tecnicos;
CREATE POLICY "rls_delete" ON public.debitos_tecnicos FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- decisoes_administrativas  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.decisoes_administrativas;
CREATE POLICY "rls_select" ON public.decisoes_administrativas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.decisoes_administrativas;
CREATE POLICY "rls_insert" ON public.decisoes_administrativas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.decisoes_administrativas;
CREATE POLICY "rls_update" ON public.decisoes_administrativas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.decisoes_administrativas;
CREATE POLICY "rls_delete" ON public.decisoes_administrativas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- demandas_ascom  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom;
CREATE POLICY "rls_select" ON public.demandas_ascom FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom;
CREATE POLICY "rls_insert" ON public.demandas_ascom FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom;
CREATE POLICY "rls_update" ON public.demandas_ascom FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom;
CREATE POLICY "rls_delete" ON public.demandas_ascom FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- demandas_ascom_anexos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_select" ON public.demandas_ascom_anexos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_insert" ON public.demandas_ascom_anexos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_update" ON public.demandas_ascom_anexos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_delete" ON public.demandas_ascom_anexos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- demandas_ascom_comentarios  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_select" ON public.demandas_ascom_comentarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_insert" ON public.demandas_ascom_comentarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_update" ON public.demandas_ascom_comentarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_delete" ON public.demandas_ascom_comentarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- demandas_ascom_entregaveis  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_select" ON public.demandas_ascom_entregaveis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_insert" ON public.demandas_ascom_entregaveis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_update" ON public.demandas_ascom_entregaveis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_delete" ON public.demandas_ascom_entregaveis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- denuncias  [preservar: integridade]
-- (nenhuma policy gerada)

-- dependentes_irrf  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.dependentes_irrf;
CREATE POLICY "rls_select" ON public.dependentes_irrf FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.dependentes_irrf;
CREATE POLICY "rls_insert" ON public.dependentes_irrf FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.dependentes_irrf;
CREATE POLICY "rls_update" ON public.dependentes_irrf FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.dependentes_irrf;
CREATE POLICY "rls_delete" ON public.dependentes_irrf FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- designacoes  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.designacoes;
CREATE POLICY "rls_select" ON public.designacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.designacoes;
CREATE POLICY "rls_insert" ON public.designacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.designacoes;
CREATE POLICY "rls_update" ON public.designacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.designacoes;
CREATE POLICY "rls_delete" ON public.designacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- despachos  [preservar: workflow]
DROP POLICY IF EXISTS "rls_delete" ON public.despachos;
DROP POLICY IF EXISTS "rls_insert" ON public.despachos;
DROP POLICY IF EXISTS "rls_select" ON public.despachos;
DROP POLICY IF EXISTS "rls_update" ON public.despachos;

-- dias_nao_uteis  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.dias_nao_uteis;
CREATE POLICY "rls_select" ON public.dias_nao_uteis FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.dias_nao_uteis;
CREATE POLICY "rls_insert" ON public.dias_nao_uteis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.dias_nao_uteis;
CREATE POLICY "rls_update" ON public.dias_nao_uteis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.dias_nao_uteis;
CREATE POLICY "rls_delete" ON public.dias_nao_uteis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- documentos  [modulo: workflow | rh | gabinete | governanca | admin]
DROP POLICY IF EXISTS "rls_select" ON public.documentos;
CREATE POLICY "rls_select" ON public.documentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos;
CREATE POLICY "rls_insert" ON public.documentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos;
CREATE POLICY "rls_update" ON public.documentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos;
CREATE POLICY "rls_delete" ON public.documentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'admin')));

-- documentos_cedencia  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_cedencia;
CREATE POLICY "rls_select" ON public.documentos_cedencia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_cedencia;
CREATE POLICY "rls_insert" ON public.documentos_cedencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_cedencia;
CREATE POLICY "rls_update" ON public.documentos_cedencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_cedencia;
CREATE POLICY "rls_delete" ON public.documentos_cedencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- documentos_preparatorios_licitacao  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_select" ON public.documentos_preparatorios_licitacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_insert" ON public.documentos_preparatorios_licitacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_update" ON public.documentos_preparatorios_licitacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_delete" ON public.documentos_preparatorios_licitacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- documentos_processo  [preservar: workflow]
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_processo;
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_processo;
DROP POLICY IF EXISTS "rls_select" ON public.documentos_processo;
DROP POLICY IF EXISTS "rls_update" ON public.documentos_processo;

-- documentos_requerimento_servidor  [permissao: rh]
DROP POLICY IF EXISTS "Authenticated users can view" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "Only creator or admin can delete" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "RH users can insert" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "RH users can update" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "rls_select" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_select" ON public.documentos_requerimento_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_insert" ON public.documentos_requerimento_servidor FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_update" ON public.documentos_requerimento_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_delete" ON public.documentos_requerimento_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'));

-- dotacoes_orcamentarias  [modulo: financeiro]
DROP POLICY IF EXISTS "fin_module_delete" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "fin_module_select" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "fin_module_update" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "fin_module_write" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "rls_select" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_select" ON public.dotacoes_orcamentarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_insert" ON public.dotacoes_orcamentarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_update" ON public.dotacoes_orcamentarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_delete" ON public.dotacoes_orcamentarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- empenhos  [modulo: financeiro]
DROP POLICY IF EXISTS "fin_module_delete" ON public.empenhos;
DROP POLICY IF EXISTS "fin_module_select" ON public.empenhos;
DROP POLICY IF EXISTS "fin_module_update" ON public.empenhos;
DROP POLICY IF EXISTS "fin_module_write" ON public.empenhos;
DROP POLICY IF EXISTS "rls_select" ON public.empenhos;
CREATE POLICY "rls_select" ON public.empenhos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.empenhos;
CREATE POLICY "rls_insert" ON public.empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.empenhos;
CREATE POLICY "rls_update" ON public.empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.empenhos;
CREATE POLICY "rls_delete" ON public.empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- encaminhamentos  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.encaminhamentos;
CREATE POLICY "rls_select" ON public.encaminhamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.encaminhamentos;
CREATE POLICY "rls_insert" ON public.encaminhamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.encaminhamentos;
CREATE POLICY "rls_update" ON public.encaminhamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.encaminhamentos;
CREATE POLICY "rls_delete" ON public.encaminhamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- envios_log  [preservar: admin]
-- (nenhuma policy gerada)

-- escolas_jer  [modulo: gestores_escolares]
DROP POLICY IF EXISTS "rls_select" ON public.escolas_jer;
CREATE POLICY "rls_select" ON public.escolas_jer FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_insert" ON public.escolas_jer;
CREATE POLICY "rls_insert" ON public.escolas_jer FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_update" ON public.escolas_jer;
CREATE POLICY "rls_update" ON public.escolas_jer FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_delete" ON public.escolas_jer;
CREATE POLICY "rls_delete" ON public.escolas_jer FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- estoque  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.estoque;
CREATE POLICY "rls_select" ON public.estoque FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.estoque;
CREATE POLICY "rls_insert" ON public.estoque FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.estoque;
CREATE POLICY "rls_update" ON public.estoque FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.estoque;
CREATE POLICY "rls_delete" ON public.estoque FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- estrutura_organizacional  [catalogo: organizacoes]
DROP POLICY IF EXISTS "rls_select" ON public.estrutura_organizacional;
CREATE POLICY "rls_select" ON public.estrutura_organizacional FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.estrutura_organizacional;
CREATE POLICY "rls_insert" ON public.estrutura_organizacional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.estrutura_organizacional;
CREATE POLICY "rls_update" ON public.estrutura_organizacional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.estrutura_organizacional;
CREATE POLICY "rls_delete" ON public.estrutura_organizacional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')));

-- eventos_esocial  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.eventos_esocial;
CREATE POLICY "rls_select" ON public.eventos_esocial FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.eventos_esocial;
CREATE POLICY "rls_insert" ON public.eventos_esocial FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.eventos_esocial;
CREATE POLICY "rls_update" ON public.eventos_esocial FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.eventos_esocial;

-- evidencias_controle  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.evidencias_controle;
CREATE POLICY "rls_select" ON public.evidencias_controle FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.evidencias_controle;
CREATE POLICY "rls_insert" ON public.evidencias_controle FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.evidencias_controle;
CREATE POLICY "rls_update" ON public.evidencias_controle FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.evidencias_controle;
CREATE POLICY "rls_delete" ON public.evidencias_controle FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- exportacoes_folha  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.exportacoes_folha;
CREATE POLICY "rls_select" ON public.exportacoes_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.exportacoes_folha;
CREATE POLICY "rls_insert" ON public.exportacoes_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.exportacoes_folha;
CREATE POLICY "rls_update" ON public.exportacoes_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.exportacoes_folha;
CREATE POLICY "rls_delete" ON public.exportacoes_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- federacao_arbitros  [modulo: federacoes | organizacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacao_arbitros;
CREATE POLICY "rls_select" ON public.federacao_arbitros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacao_arbitros;
CREATE POLICY "rls_insert" ON public.federacao_arbitros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacao_arbitros;
CREATE POLICY "rls_update" ON public.federacao_arbitros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacao_arbitros;
CREATE POLICY "rls_delete" ON public.federacao_arbitros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));

-- federacao_espacos_cedidos  [modulo: federacoes | organizacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_select" ON public.federacao_espacos_cedidos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_insert" ON public.federacao_espacos_cedidos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_update" ON public.federacao_espacos_cedidos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_delete" ON public.federacao_espacos_cedidos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));

-- federacao_parcerias  [modulo: federacoes | organizacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacao_parcerias;
CREATE POLICY "rls_select" ON public.federacao_parcerias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacao_parcerias;
CREATE POLICY "rls_insert" ON public.federacao_parcerias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacao_parcerias;
CREATE POLICY "rls_update" ON public.federacao_parcerias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacao_parcerias;
CREATE POLICY "rls_delete" ON public.federacao_parcerias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes')));

-- federacoes_esportivas  [modulo: federacoes | organizacoes | patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.federacoes_esportivas;
CREATE POLICY "rls_select" ON public.federacoes_esportivas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacoes_esportivas;
CREATE POLICY "rls_insert" ON public.federacoes_esportivas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.federacoes_esportivas;
CREATE POLICY "rls_update" ON public.federacoes_esportivas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacoes_esportivas;
CREATE POLICY "rls_delete" ON public.federacoes_esportivas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes') OR public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio')));

-- feriados  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.feriados;
CREATE POLICY "rls_select" ON public.feriados FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.feriados;
CREATE POLICY "rls_insert" ON public.feriados FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.feriados;
CREATE POLICY "rls_update" ON public.feriados FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.feriados;
CREATE POLICY "rls_delete" ON public.feriados FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ferias_servidor  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.ferias_servidor;
CREATE POLICY "rls_select" ON public.ferias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.ferias_servidor;
CREATE POLICY "rls_insert" ON public.ferias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar') OR public.has_permission_code(auth.uid(), 'rh.ferias.editar') OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.ferias_servidor;
CREATE POLICY "rls_update" ON public.ferias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar') OR public.has_permission_code(auth.uid(), 'rh.ferias.editar') OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar') OR public.has_permission_code(auth.uid(), 'rh.ferias.editar') OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.ferias_servidor;
CREATE POLICY "rls_delete" ON public.ferias_servidor FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- fichas_financeiras  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.fichas_financeiras;
CREATE POLICY "rls_select" ON public.fichas_financeiras FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.fichas_financeiras;
CREATE POLICY "rls_insert" ON public.fichas_financeiras FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.fichas_financeiras;
CREATE POLICY "rls_update" ON public.fichas_financeiras FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fichas_financeiras;
CREATE POLICY "rls_delete" ON public.fichas_financeiras FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- fin_acoes_orcamentarias  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_select" ON public.fin_acoes_orcamentarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_insert" ON public.fin_acoes_orcamentarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_update" ON public.fin_acoes_orcamentarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_delete" ON public.fin_acoes_orcamentarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_adiantamento_itens  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_select" ON public.fin_adiantamento_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_insert" ON public.fin_adiantamento_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_update" ON public.fin_adiantamento_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_delete" ON public.fin_adiantamento_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_adiantamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_adiantamentos;
CREATE POLICY "rls_select" ON public.fin_adiantamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_adiantamentos;
CREATE POLICY "rls_insert" ON public.fin_adiantamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_adiantamentos;
CREATE POLICY "rls_update" ON public.fin_adiantamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_adiantamentos;
CREATE POLICY "rls_delete" ON public.fin_adiantamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_alteracoes_orcamentarias  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_select" ON public.fin_alteracoes_orcamentarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_insert" ON public.fin_alteracoes_orcamentarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_update" ON public.fin_alteracoes_orcamentarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_delete" ON public.fin_alteracoes_orcamentarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_audit_log  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_audit_log;
CREATE POLICY "rls_select" ON public.fin_audit_log FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_checklist_ci  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_checklist_ci;
CREATE POLICY "rls_select" ON public.fin_checklist_ci FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_checklist_ci;
CREATE POLICY "rls_insert" ON public.fin_checklist_ci FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_checklist_ci;
CREATE POLICY "rls_update" ON public.fin_checklist_ci FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_checklist_ci;
CREATE POLICY "rls_delete" ON public.fin_checklist_ci FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_contas_bancarias  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_contas_bancarias;
CREATE POLICY "rls_select" ON public.fin_contas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_contas_bancarias;
CREATE POLICY "rls_insert" ON public.fin_contas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_contas_bancarias;
CREATE POLICY "rls_update" ON public.fin_contas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_contas_bancarias;
CREATE POLICY "rls_delete" ON public.fin_contas_bancarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_documentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_documentos;
CREATE POLICY "rls_select" ON public.fin_documentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_documentos;
CREATE POLICY "rls_insert" ON public.fin_documentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_documentos;
CREATE POLICY "rls_update" ON public.fin_documentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_documentos;
CREATE POLICY "rls_delete" ON public.fin_documentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_dotacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_dotacoes;
CREATE POLICY "rls_select" ON public.fin_dotacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_dotacoes;
CREATE POLICY "rls_insert" ON public.fin_dotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_dotacoes;
CREATE POLICY "rls_update" ON public.fin_dotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_dotacoes;
CREATE POLICY "rls_delete" ON public.fin_dotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_empenho_anulacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_select" ON public.fin_empenho_anulacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_insert" ON public.fin_empenho_anulacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_update" ON public.fin_empenho_anulacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_delete" ON public.fin_empenho_anulacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_empenhos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_empenhos;
CREATE POLICY "rls_select" ON public.fin_empenhos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_empenhos;
CREATE POLICY "rls_insert" ON public.fin_empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_empenhos;
CREATE POLICY "rls_update" ON public.fin_empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_empenhos;
CREATE POLICY "rls_delete" ON public.fin_empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_extrato_lancamentos  [preservar: financeiro]
-- (nenhuma policy gerada)

-- fin_extrato_transacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_select" ON public.fin_extrato_transacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_insert" ON public.fin_extrato_transacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_update" ON public.fin_extrato_transacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_delete" ON public.fin_extrato_transacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_extratos_bancarios  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_select" ON public.fin_extratos_bancarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_insert" ON public.fin_extratos_bancarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_update" ON public.fin_extratos_bancarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_delete" ON public.fin_extratos_bancarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_fechamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_fechamentos;
CREATE POLICY "rls_select" ON public.fin_fechamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_fechamentos;
CREATE POLICY "rls_insert" ON public.fin_fechamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_fechamentos;
CREATE POLICY "rls_update" ON public.fin_fechamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_fechamentos;
CREATE POLICY "rls_delete" ON public.fin_fechamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_fontes_recurso  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_fontes_recurso;
CREATE POLICY "rls_select" ON public.fin_fontes_recurso FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_fontes_recurso;
CREATE POLICY "rls_insert" ON public.fin_fontes_recurso FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_fontes_recurso;
CREATE POLICY "rls_update" ON public.fin_fontes_recurso FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_fontes_recurso;
CREATE POLICY "rls_delete" ON public.fin_fontes_recurso FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_lancamentos_contabeis  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_select" ON public.fin_lancamentos_contabeis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_insert" ON public.fin_lancamentos_contabeis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_update" ON public.fin_lancamentos_contabeis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_delete" ON public.fin_lancamentos_contabeis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_liquidacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_liquidacoes;
CREATE POLICY "rls_select" ON public.fin_liquidacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_liquidacoes;
CREATE POLICY "rls_insert" ON public.fin_liquidacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_liquidacoes;
CREATE POLICY "rls_update" ON public.fin_liquidacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_liquidacoes;
CREATE POLICY "rls_delete" ON public.fin_liquidacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_movimentos_bancarios  [preservar: financeiro]
-- (nenhuma policy gerada)

-- fin_naturezas_despesa  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_select" ON public.fin_naturezas_despesa FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_insert" ON public.fin_naturezas_despesa FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_update" ON public.fin_naturezas_despesa FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_delete" ON public.fin_naturezas_despesa FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_pagamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_pagamentos;
CREATE POLICY "rls_select" ON public.fin_pagamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_pagamentos;
CREATE POLICY "rls_insert" ON public.fin_pagamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_pagamentos;
CREATE POLICY "rls_update" ON public.fin_pagamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_pagamentos;
CREATE POLICY "rls_delete" ON public.fin_pagamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_parametros  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_parametros;
CREATE POLICY "rls_select" ON public.fin_parametros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_parametros;
CREATE POLICY "rls_insert" ON public.fin_parametros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_parametros;
CREATE POLICY "rls_update" ON public.fin_parametros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_parametros;
CREATE POLICY "rls_delete" ON public.fin_parametros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_plano_contas  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_plano_contas;
CREATE POLICY "rls_select" ON public.fin_plano_contas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_plano_contas;
CREATE POLICY "rls_insert" ON public.fin_plano_contas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_plano_contas;
CREATE POLICY "rls_update" ON public.fin_plano_contas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_plano_contas;
CREATE POLICY "rls_delete" ON public.fin_plano_contas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_programas_orcamentarios  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_select" ON public.fin_programas_orcamentarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_insert" ON public.fin_programas_orcamentarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_update" ON public.fin_programas_orcamentarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_delete" ON public.fin_programas_orcamentarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_receitas  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_receitas;
CREATE POLICY "rls_select" ON public.fin_receitas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_receitas;
CREATE POLICY "rls_insert" ON public.fin_receitas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_receitas;
CREATE POLICY "rls_update" ON public.fin_receitas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_receitas;
CREATE POLICY "rls_delete" ON public.fin_receitas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_remessas_bancarias  [preservar: financeiro]
-- (nenhuma policy gerada)

-- fin_restos_pagar  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_restos_pagar;
CREATE POLICY "rls_select" ON public.fin_restos_pagar FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_restos_pagar;
CREATE POLICY "rls_insert" ON public.fin_restos_pagar FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_restos_pagar;
CREATE POLICY "rls_update" ON public.fin_restos_pagar FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_restos_pagar;
CREATE POLICY "rls_delete" ON public.fin_restos_pagar FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_solicitacao_itens  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_select" ON public.fin_solicitacao_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_insert" ON public.fin_solicitacao_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_update" ON public.fin_solicitacao_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_delete" ON public.fin_solicitacao_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_solicitacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_solicitacoes;
CREATE POLICY "rls_select" ON public.fin_solicitacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_solicitacoes;
CREATE POLICY "rls_insert" ON public.fin_solicitacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_solicitacoes;
CREATE POLICY "rls_update" ON public.fin_solicitacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_solicitacoes;
CREATE POLICY "rls_delete" ON public.fin_solicitacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_sub_empenhos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_sub_empenhos;
CREATE POLICY "rls_select" ON public.fin_sub_empenhos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_sub_empenhos;
CREATE POLICY "rls_insert" ON public.fin_sub_empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_sub_empenhos;
CREATE POLICY "rls_update" ON public.fin_sub_empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_sub_empenhos;
CREATE POLICY "rls_delete" ON public.fin_sub_empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- folha_historico_status  [trilha: rh]
DROP POLICY IF EXISTS "rls_select" ON public.folha_historico_status;
CREATE POLICY "rls_select" ON public.folha_historico_status FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- folhas_pagamento  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.folhas_pagamento;
CREATE POLICY "rls_select" ON public.folhas_pagamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.fichas_financeiras f WHERE f.folha_id = folhas_pagamento.id AND f.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.folhas_pagamento;
CREATE POLICY "rls_insert" ON public.folhas_pagamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.folhas_pagamento;
CREATE POLICY "rls_update" ON public.folhas_pagamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.folhas_pagamento;
CREATE POLICY "rls_delete" ON public.folhas_pagamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- form_field_config  [modulo: admin]
DROP POLICY IF EXISTS "admin_write_form_config" ON public.form_field_config;
DROP POLICY IF EXISTS "rls_select" ON public.form_field_config;
CREATE POLICY "rls_select" ON public.form_field_config FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.form_field_config;
CREATE POLICY "rls_insert" ON public.form_field_config FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.form_field_config;
CREATE POLICY "rls_update" ON public.form_field_config FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.form_field_config;
CREATE POLICY "rls_delete" ON public.form_field_config FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'admin')));

-- fornecedores  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_select" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_update" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_write" ON public.fornecedores;
DROP POLICY IF EXISTS "rls_select" ON public.fornecedores;
CREATE POLICY "rls_select" ON public.fornecedores FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.fornecedores;
CREATE POLICY "rls_insert" ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.fornecedores;
CREATE POLICY "rls_update" ON public.fornecedores FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.fornecedores;
CREATE POLICY "rls_delete" ON public.fornecedores FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- fotos_vistoria_inventario  [preservar: patrimonio | patrimonio_mobile]
-- (nenhuma policy gerada)

-- frequencia_arquivos  [permissao: rh]
DROP POLICY IF EXISTS "Usuários autenticados podem inserir arquivos" ON public.frequencia_arquivos;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar arquivos" ON public.frequencia_arquivos;
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_arquivos;
CREATE POLICY "rls_select" ON public.frequencia_arquivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_arquivos;
CREATE POLICY "rls_insert" ON public.frequencia_arquivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_arquivos;
CREATE POLICY "rls_update" ON public.frequencia_arquivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_arquivos;
CREATE POLICY "rls_delete" ON public.frequencia_arquivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));

-- frequencia_fechamento  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_fechamento;
CREATE POLICY "rls_select" ON public.frequencia_fechamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_fechamento;
CREATE POLICY "rls_insert" ON public.frequencia_fechamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_fechamento;
CREATE POLICY "rls_update" ON public.frequencia_fechamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_fechamento;
CREATE POLICY "rls_delete" ON public.frequencia_fechamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- frequencia_mensal  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_mensal;
CREATE POLICY "rls_select" ON public.frequencia_mensal FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_mensal;
CREATE POLICY "rls_insert" ON public.frequencia_mensal FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_mensal;
CREATE POLICY "rls_update" ON public.frequencia_mensal FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_mensal;
CREATE POLICY "rls_delete" ON public.frequencia_mensal FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- frequencia_pacotes  [permissao: rh]
DROP POLICY IF EXISTS "frequencia_pacotes_update_rh" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pacotes" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir pacotes" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar pacotes" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_pacotes;
CREATE POLICY "rls_select" ON public.frequencia_pacotes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_pacotes;
CREATE POLICY "rls_insert" ON public.frequencia_pacotes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_pacotes;
CREATE POLICY "rls_update" ON public.frequencia_pacotes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_pacotes;
CREATE POLICY "rls_delete" ON public.frequencia_pacotes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));

-- galeria_eventos_esportivos  [modulo: comunicacao | programas]
DROP POLICY IF EXISTS "rls_select" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_select" ON public.galeria_eventos_esportivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_insert" ON public.galeria_eventos_esportivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_update" ON public.galeria_eventos_esportivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_delete" ON public.galeria_eventos_esportivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));

-- gestores_escolares  [modulo: gestores_escolares]
DROP POLICY IF EXISTS "leitura_publica_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "admin_delete_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "admin_update_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "rls_select" ON public.gestores_escolares;
CREATE POLICY "rls_select" ON public.gestores_escolares FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_insert" ON public.gestores_escolares;
CREATE POLICY "rls_insert" ON public.gestores_escolares FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_update" ON public.gestores_escolares;
CREATE POLICY "rls_update" ON public.gestores_escolares FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_delete" ON public.gestores_escolares;
CREATE POLICY "rls_delete" ON public.gestores_escolares FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- gestores_escolares_historico  [trilha: gestores_escolares]
DROP POLICY IF EXISTS "Admin pode ver todo histórico" ON public.gestores_escolares_historico;
DROP POLICY IF EXISTS "rls_select" ON public.gestores_escolares_historico;
CREATE POLICY "rls_select" ON public.gestores_escolares_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- historico_conteudo_oficial  [trilha: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.historico_conteudo_oficial;
CREATE POLICY "rls_select" ON public.historico_conteudo_oficial FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- historico_convites_reuniao  [trilha: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.historico_convites_reuniao;
CREATE POLICY "rls_select" ON public.historico_convites_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- historico_funcional  [proprio_leitura: rh | gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.historico_funcional;
CREATE POLICY "rls_select" ON public.historico_funcional FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.historico_funcional;
CREATE POLICY "rls_insert" ON public.historico_funcional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.historico_funcional;
CREATE POLICY "rls_update" ON public.historico_funcional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.historico_funcional;
CREATE POLICY "rls_delete" ON public.historico_funcional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));

-- historico_lai  [trilha: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.historico_lai;
CREATE POLICY "rls_select" ON public.historico_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- historico_patrimonio  [trilha: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.historico_patrimonio;
CREATE POLICY "rls_select" ON public.historico_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- horarios_jornada  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.horarios_jornada;
CREATE POLICY "rls_select" ON public.horarios_jornada FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.horarios_jornada;
CREATE POLICY "rls_insert" ON public.horarios_jornada FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.horarios_jornada;
CREATE POLICY "rls_update" ON public.horarios_jornada FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.horarios_jornada;
CREATE POLICY "rls_delete" ON public.horarios_jornada FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- importacoes  [preservar: financeiro]
-- (nenhuma policy gerada)

-- instituicoes  [modulo: organizacoes | patrimonio | comunicacao | programas]
DROP POLICY IF EXISTS "rls_select" ON public.instituicoes;
CREATE POLICY "rls_select" ON public.instituicoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.instituicoes;
CREATE POLICY "rls_insert" ON public.instituicoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.instituicoes;
CREATE POLICY "rls_update" ON public.instituicoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.instituicoes;
CREATE POLICY "rls_delete" ON public.instituicoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes') OR public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));

-- itens_ata_registro_preco  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_select" ON public.itens_ata_registro_preco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_insert" ON public.itens_ata_registro_preco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_update" ON public.itens_ata_registro_preco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_delete" ON public.itens_ata_registro_preco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_checklist  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.itens_checklist;
CREATE POLICY "rls_select" ON public.itens_checklist FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_checklist;
CREATE POLICY "rls_insert" ON public.itens_checklist FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_checklist;
CREATE POLICY "rls_update" ON public.itens_checklist FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_checklist;
CREATE POLICY "rls_delete" ON public.itens_checklist FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- itens_contrato  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_contrato;
CREATE POLICY "rls_select" ON public.itens_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_contrato;
CREATE POLICY "rls_insert" ON public.itens_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_contrato;
CREATE POLICY "rls_update" ON public.itens_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_contrato;
CREATE POLICY "rls_delete" ON public.itens_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_ficha_financeira  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_ficha_financeira;
CREATE POLICY "rls_select" ON public.itens_ficha_financeira FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))) OR EXISTS (SELECT 1 FROM public.fichas_financeiras p WHERE p.id = itens_ficha_financeira.ficha_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ficha_financeira;
CREATE POLICY "rls_insert" ON public.itens_ficha_financeira FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ficha_financeira;
CREATE POLICY "rls_update" ON public.itens_ficha_financeira FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ficha_financeira;
CREATE POLICY "rls_delete" ON public.itens_ficha_financeira FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- itens_licitacao  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.itens_licitacao;
DROP POLICY IF EXISTS "comp_module_select" ON public.itens_licitacao;
DROP POLICY IF EXISTS "comp_module_update" ON public.itens_licitacao;
DROP POLICY IF EXISTS "comp_module_write" ON public.itens_licitacao;
DROP POLICY IF EXISTS "rls_select" ON public.itens_licitacao;
CREATE POLICY "rls_select" ON public.itens_licitacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_licitacao;
CREATE POLICY "rls_insert" ON public.itens_licitacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_licitacao;
CREATE POLICY "rls_update" ON public.itens_licitacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_licitacao;
CREATE POLICY "rls_delete" ON public.itens_licitacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_material  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_select" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_update" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_write" ON public.itens_material;
DROP POLICY IF EXISTS "rls_select" ON public.itens_material;
CREATE POLICY "rls_select" ON public.itens_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_material;
CREATE POLICY "rls_insert" ON public.itens_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_material;
CREATE POLICY "rls_update" ON public.itens_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_material;
CREATE POLICY "rls_delete" ON public.itens_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- itens_processo_licitatorio  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_select" ON public.itens_processo_licitatorio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_insert" ON public.itens_processo_licitatorio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_update" ON public.itens_processo_licitatorio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_delete" ON public.itens_processo_licitatorio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_retorno_bancario  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_retorno_bancario;
CREATE POLICY "rls_select" ON public.itens_retorno_bancario FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_retorno_bancario;
CREATE POLICY "rls_insert" ON public.itens_retorno_bancario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_retorno_bancario;
CREATE POLICY "rls_update" ON public.itens_retorno_bancario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_retorno_bancario;
CREATE POLICY "rls_delete" ON public.itens_retorno_bancario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- justificativas_ponto  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.justificativas_ponto;
CREATE POLICY "rls_select" ON public.justificativas_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.justificativas_ponto;
CREATE POLICY "rls_insert" ON public.justificativas_ponto FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id)))) OR EXISTS (SELECT 1 FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_update" ON public.justificativas_ponto;
CREATE POLICY "rls_update" ON public.justificativas_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id))))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id))));
DROP POLICY IF EXISTS "rls_delete" ON public.justificativas_ponto;
CREATE POLICY "rls_delete" ON public.justificativas_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id))));

-- lancamentos_banco_horas  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_select" ON public.lancamentos_banco_horas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id AND (p.servidor_id = auth.uid() AND public.is_active_user())));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_insert" ON public.lancamentos_banco_horas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_update" ON public.lancamentos_banco_horas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_delete" ON public.lancamentos_banco_horas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()));

-- lancamentos_folha  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_folha;
CREATE POLICY "rls_select" ON public.lancamentos_folha FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_folha;
CREATE POLICY "rls_insert" ON public.lancamentos_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_folha;
CREATE POLICY "rls_update" ON public.lancamentos_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_folha;
CREATE POLICY "rls_delete" ON public.lancamentos_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- licencas_afastamentos  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.licencas_afastamentos;
CREATE POLICY "rls_select" ON public.licencas_afastamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.licencas_afastamentos;
CREATE POLICY "rls_insert" ON public.licencas_afastamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar') OR public.has_permission_code(auth.uid(), 'rh.licencas.editar') OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.licencas_afastamentos;
CREATE POLICY "rls_update" ON public.licencas_afastamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar') OR public.has_permission_code(auth.uid(), 'rh.licencas.editar') OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar') OR public.has_permission_code(auth.uid(), 'rh.licencas.editar') OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.licencas_afastamentos;
CREATE POLICY "rls_delete" ON public.licencas_afastamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- links_uteis  [publico_admin]
DROP POLICY IF EXISTS "Apenas admins podem alterar links uteis" ON public.links_uteis;
DROP POLICY IF EXISTS "Leitura publica dos links uteis" ON public.links_uteis;
DROP POLICY IF EXISTS "rls_select" ON public.links_uteis;
CREATE POLICY "rls_select" ON public.links_uteis FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.links_uteis;
CREATE POLICY "rls_insert" ON public.links_uteis FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.links_uteis;
CREATE POLICY "rls_update" ON public.links_uteis FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.links_uteis;
CREATE POLICY "rls_delete" ON public.links_uteis FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- liquidacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.liquidacoes;
CREATE POLICY "rls_select" ON public.liquidacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.liquidacoes;
CREATE POLICY "rls_insert" ON public.liquidacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.liquidacoes;
CREATE POLICY "rls_update" ON public.liquidacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.liquidacoes;
CREATE POLICY "rls_delete" ON public.liquidacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- lotacoes  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_select" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_update" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_write" ON public.lotacoes;
DROP POLICY IF EXISTS "rls_select" ON public.lotacoes;
CREATE POLICY "rls_select" ON public.lotacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.lotacoes;
CREATE POLICY "rls_insert" ON public.lotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.lotacoes;
CREATE POLICY "rls_update" ON public.lotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.lotacoes;
CREATE POLICY "rls_delete" ON public.lotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- manutencoes_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_select" ON public.manutencoes_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_insert" ON public.manutencoes_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_update" ON public.manutencoes_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_delete" ON public.manutencoes_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- matriz_raci_atribuicoes  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_select" ON public.matriz_raci_atribuicoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_insert" ON public.matriz_raci_atribuicoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_update" ON public.matriz_raci_atribuicoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_delete" ON public.matriz_raci_atribuicoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- matriz_raci_papeis  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.matriz_raci_papeis;
CREATE POLICY "rls_select" ON public.matriz_raci_papeis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.matriz_raci_papeis;
CREATE POLICY "rls_insert" ON public.matriz_raci_papeis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.matriz_raci_papeis;
CREATE POLICY "rls_update" ON public.matriz_raci_papeis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.matriz_raci_papeis;
CREATE POLICY "rls_delete" ON public.matriz_raci_papeis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- matriz_raci_processos  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.matriz_raci_processos;
CREATE POLICY "rls_select" ON public.matriz_raci_processos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.matriz_raci_processos;
CREATE POLICY "rls_insert" ON public.matriz_raci_processos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.matriz_raci_processos;
CREATE POLICY "rls_update" ON public.matriz_raci_processos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.matriz_raci_processos;
CREATE POLICY "rls_delete" ON public.matriz_raci_processos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- medicoes_contrato  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "comp_module_select" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "comp_module_update" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "comp_module_write" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "rls_select" ON public.medicoes_contrato;
CREATE POLICY "rls_select" ON public.medicoes_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.medicoes_contrato;
CREATE POLICY "rls_insert" ON public.medicoes_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.medicoes_contrato;
CREATE POLICY "rls_update" ON public.medicoes_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.medicoes_contrato;
CREATE POLICY "rls_delete" ON public.medicoes_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- memorandos_lotacao  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.memorandos_lotacao;
CREATE POLICY "rls_select" ON public.memorandos_lotacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.memorandos_lotacao;
CREATE POLICY "rls_insert" ON public.memorandos_lotacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.memorandos_lotacao;
CREATE POLICY "rls_update" ON public.memorandos_lotacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.memorandos_lotacao;
CREATE POLICY "rls_delete" ON public.memorandos_lotacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- modelos_mensagem_reuniao  [modulo: gabinete | admin]
DROP POLICY IF EXISTS "rls_select" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_select" ON public.modelos_mensagem_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_insert" ON public.modelos_mensagem_reuniao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_update" ON public.modelos_mensagem_reuniao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_delete" ON public.modelos_mensagem_reuniao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));

-- module_access_scopes  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.module_access_scopes;
CREATE POLICY "rls_select" ON public.module_access_scopes FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.module_access_scopes;
CREATE POLICY "rls_insert" ON public.module_access_scopes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.module_access_scopes;
CREATE POLICY "rls_update" ON public.module_access_scopes FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.module_access_scopes;
CREATE POLICY "rls_delete" ON public.module_access_scopes FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- module_permissions_catalog  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.module_permissions_catalog;
CREATE POLICY "rls_select" ON public.module_permissions_catalog FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.module_permissions_catalog;
CREATE POLICY "rls_insert" ON public.module_permissions_catalog FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.module_permissions_catalog;
CREATE POLICY "rls_update" ON public.module_permissions_catalog FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.module_permissions_catalog;
CREATE POLICY "rls_delete" ON public.module_permissions_catalog FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- module_settings  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.module_settings;
CREATE POLICY "rls_select" ON public.module_settings FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.module_settings;
CREATE POLICY "rls_insert" ON public.module_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.module_settings;
CREATE POLICY "rls_update" ON public.module_settings FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.module_settings;
CREATE POLICY "rls_delete" ON public.module_settings FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- movimentacoes_bem  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_bem;
CREATE POLICY "rls_select" ON public.movimentacoes_bem FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_bem;
CREATE POLICY "rls_insert" ON public.movimentacoes_bem FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_bem;
CREATE POLICY "rls_update" ON public.movimentacoes_bem FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_bem;
CREATE POLICY "rls_delete" ON public.movimentacoes_bem FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- movimentacoes_estoque  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_estoque;
CREATE POLICY "rls_select" ON public.movimentacoes_estoque FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_estoque;
CREATE POLICY "rls_insert" ON public.movimentacoes_estoque FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_estoque;
CREATE POLICY "rls_update" ON public.movimentacoes_estoque FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_estoque;
CREATE POLICY "rls_delete" ON public.movimentacoes_estoque FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- movimentacoes_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_select" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_update" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_write" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_select" ON public.movimentacoes_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_insert" ON public.movimentacoes_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_update" ON public.movimentacoes_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_delete" ON public.movimentacoes_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- movimentacoes_processo  [preservar: workflow]
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_processo;
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_processo;
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_processo;
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_processo;

-- nomeacoes_chefe_unidade  [modulo: rh | patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_select" ON public.nomeacoes_chefe_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_insert" ON public.nomeacoes_chefe_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_update" ON public.nomeacoes_chefe_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_delete" ON public.nomeacoes_chefe_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'patrimonio')));

-- noticias_eventos_esportivos  [modulo: comunicacao | programas]
DROP POLICY IF EXISTS "rls_select" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_select" ON public.noticias_eventos_esportivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_insert" ON public.noticias_eventos_esportivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_update" ON public.noticias_eventos_esportivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_delete" ON public.noticias_eventos_esportivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao') OR public.can_access_module(auth.uid(), 'programas')));

-- ocorrencias_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_select" ON public.ocorrencias_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_insert" ON public.ocorrencias_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_update" ON public.ocorrencias_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_delete" ON public.ocorrencias_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- ocorrencias_servidor  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.ocorrencias_servidor;
CREATE POLICY "rls_select" ON public.ocorrencias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.ocorrencias_servidor;
CREATE POLICY "rls_insert" ON public.ocorrencias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.ocorrencias_servidor;
CREATE POLICY "rls_update" ON public.ocorrencias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.ocorrencias_servidor;
CREATE POLICY "rls_delete" ON public.ocorrencias_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- pagamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "fin_module_delete" ON public.pagamentos;
DROP POLICY IF EXISTS "fin_module_select" ON public.pagamentos;
DROP POLICY IF EXISTS "fin_module_update" ON public.pagamentos;
DROP POLICY IF EXISTS "fin_module_write" ON public.pagamentos;
DROP POLICY IF EXISTS "rls_select" ON public.pagamentos;
CREATE POLICY "rls_select" ON public.pagamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.pagamentos;
CREATE POLICY "rls_insert" ON public.pagamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.pagamentos;
CREATE POLICY "rls_update" ON public.pagamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.pagamentos;
CREATE POLICY "rls_delete" ON public.pagamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- parametros_folha  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.parametros_folha;
CREATE POLICY "rls_select" ON public.parametros_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.parametros_folha;
CREATE POLICY "rls_insert" ON public.parametros_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.parametros_folha;
CREATE POLICY "rls_update" ON public.parametros_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.parametros_folha;
CREATE POLICY "rls_delete" ON public.parametros_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- pareceres_tecnicos  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.pareceres_tecnicos;
CREATE POLICY "rls_select" ON public.pareceres_tecnicos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.pareceres_tecnicos;
CREATE POLICY "rls_insert" ON public.pareceres_tecnicos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.pareceres_tecnicos;
CREATE POLICY "rls_update" ON public.pareceres_tecnicos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.pareceres_tecnicos;
CREATE POLICY "rls_delete" ON public.pareceres_tecnicos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- participantes_reuniao  [modulo: gabinete | admin]
DROP POLICY IF EXISTS "rls_select" ON public.participantes_reuniao;
CREATE POLICY "rls_select" ON public.participantes_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.participantes_reuniao;
CREATE POLICY "rls_insert" ON public.participantes_reuniao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.participantes_reuniao;
CREATE POLICY "rls_update" ON public.participantes_reuniao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.participantes_reuniao;
CREATE POLICY "rls_delete" ON public.participantes_reuniao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));

-- patrimonio_unidade  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.patrimonio_unidade;
CREATE POLICY "rls_select" ON public.patrimonio_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.patrimonio_unidade;
CREATE POLICY "rls_insert" ON public.patrimonio_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.patrimonio_unidade;
CREATE POLICY "rls_update" ON public.patrimonio_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.patrimonio_unidade;
CREATE POLICY "rls_delete" ON public.patrimonio_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- pensoes_alimenticias  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.pensoes_alimenticias;
CREATE POLICY "rls_select" ON public.pensoes_alimenticias FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pensoes_alimenticias;
CREATE POLICY "rls_insert" ON public.pensoes_alimenticias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.pensoes_alimenticias;
CREATE POLICY "rls_update" ON public.pensoes_alimenticias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pensoes_alimenticias;
CREATE POLICY "rls_delete" ON public.pensoes_alimenticias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- planos_tratamento_risco  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.planos_tratamento_risco;
CREATE POLICY "rls_select" ON public.planos_tratamento_risco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.planos_tratamento_risco;
CREATE POLICY "rls_insert" ON public.planos_tratamento_risco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.planos_tratamento_risco;
CREATE POLICY "rls_update" ON public.planos_tratamento_risco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.planos_tratamento_risco;
CREATE POLICY "rls_delete" ON public.planos_tratamento_risco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- portal_diretoria  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.portal_diretoria;
CREATE POLICY "rls_select" ON public.portal_diretoria FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.portal_diretoria;
CREATE POLICY "rls_insert" ON public.portal_diretoria FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.portal_diretoria;
CREATE POLICY "rls_update" ON public.portal_diretoria FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.portal_diretoria;
CREATE POLICY "rls_delete" ON public.portal_diretoria FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- portarias_servidor  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.portarias_servidor;
CREATE POLICY "rls_select" ON public.portarias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.portarias_servidor;
CREATE POLICY "rls_insert" ON public.portarias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.portarias_servidor;
CREATE POLICY "rls_update" ON public.portarias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.portarias_servidor;
CREATE POLICY "rls_delete" ON public.portarias_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- prazos_lai  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.prazos_lai;
CREATE POLICY "rls_select" ON public.prazos_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.prazos_lai;
CREATE POLICY "rls_insert" ON public.prazos_lai FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.prazos_lai;
CREATE POLICY "rls_update" ON public.prazos_lai FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.prazos_lai;
CREATE POLICY "rls_delete" ON public.prazos_lai FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- prazos_processo  [preservar: workflow]
DROP POLICY IF EXISTS "rls_delete" ON public.prazos_processo;
DROP POLICY IF EXISTS "rls_insert" ON public.prazos_processo;
DROP POLICY IF EXISTS "rls_select" ON public.prazos_processo;
DROP POLICY IF EXISTS "rls_update" ON public.prazos_processo;

-- pre_cadastros  [modulo: rh | gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.pre_cadastros;
CREATE POLICY "rls_select" ON public.pre_cadastros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.pre_cadastros;
CREATE POLICY "rls_insert" ON public.pre_cadastros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.pre_cadastros;
CREATE POLICY "rls_update" ON public.pre_cadastros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.pre_cadastros;
CREATE POLICY "rls_delete" ON public.pre_cadastros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));

-- processo_checklist_respostas  [preservar: workflow]
-- (nenhuma policy gerada)

-- processo_modelo_checklist  [permissao: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processo_modelo_checklist;
CREATE POLICY "rls_select" ON public.processo_modelo_checklist FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_modelo_checklist;
CREATE POLICY "rls_insert" ON public.processo_modelo_checklist FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_modelo_checklist;
CREATE POLICY "rls_update" ON public.processo_modelo_checklist FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_modelo_checklist;
CREATE POLICY "rls_delete" ON public.processo_modelo_checklist FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));

-- processo_modelo_etapas  [permissao: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processo_modelo_etapas;
CREATE POLICY "rls_select" ON public.processo_modelo_etapas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_modelo_etapas;
CREATE POLICY "rls_insert" ON public.processo_modelo_etapas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_modelo_etapas;
CREATE POLICY "rls_update" ON public.processo_modelo_etapas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_modelo_etapas;
CREATE POLICY "rls_delete" ON public.processo_modelo_etapas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));

-- processo_modelos  [permissao: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processo_modelos;
CREATE POLICY "rls_select" ON public.processo_modelos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_modelos;
CREATE POLICY "rls_insert" ON public.processo_modelos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_modelos;
CREATE POLICY "rls_update" ON public.processo_modelos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_modelos;
CREATE POLICY "rls_delete" ON public.processo_modelos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')) AND public.has_permission_code(auth.uid(), 'workflow.admin'));

-- processos_administrativos  [preservar: workflow]
DROP POLICY IF EXISTS "rls_delete" ON public.processos_administrativos;
DROP POLICY IF EXISTS "rls_insert" ON public.processos_administrativos;
DROP POLICY IF EXISTS "rls_select" ON public.processos_administrativos;
DROP POLICY IF EXISTS "rls_update" ON public.processos_administrativos;

-- processos_licitatorios  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "comp_module_select" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "comp_module_update" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "comp_module_write" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "rls_select" ON public.processos_licitatorios;
CREATE POLICY "rls_select" ON public.processos_licitatorios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.processos_licitatorios;
CREATE POLICY "rls_insert" ON public.processos_licitatorios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.processos_licitatorios;
CREATE POLICY "rls_update" ON public.processos_licitatorios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.processos_licitatorios;
CREATE POLICY "rls_delete" ON public.processos_licitatorios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- profiles  [preservar]
-- (nenhuma policy gerada)

-- programas  [modulo: programas]
DROP POLICY IF EXISTS "rls_select" ON public.programas;
CREATE POLICY "rls_select" ON public.programas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.programas;
CREATE POLICY "rls_insert" ON public.programas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.programas;
CREATE POLICY "rls_update" ON public.programas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.programas;
CREATE POLICY "rls_delete" ON public.programas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));

-- propostas_licitacao  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.propostas_licitacao;
CREATE POLICY "rls_select" ON public.propostas_licitacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.propostas_licitacao;
CREATE POLICY "rls_insert" ON public.propostas_licitacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.propostas_licitacao;
CREATE POLICY "rls_update" ON public.propostas_licitacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.propostas_licitacao;
CREATE POLICY "rls_delete" ON public.propostas_licitacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- provimentos  [modulo: rh | gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.provimentos;
CREATE POLICY "rls_select" ON public.provimentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.provimentos;
CREATE POLICY "rls_insert" ON public.provimentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.provimentos;
CREATE POLICY "rls_update" ON public.provimentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.provimentos;
CREATE POLICY "rls_delete" ON public.provimentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));

-- publicacoes_lai  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.publicacoes_lai;
CREATE POLICY "rls_select" ON public.publicacoes_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.publicacoes_lai;
CREATE POLICY "rls_insert" ON public.publicacoes_lai FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.publicacoes_lai;
CREATE POLICY "rls_update" ON public.publicacoes_lai FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.publicacoes_lai;
CREATE POLICY "rls_delete" ON public.publicacoes_lai FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- publicacoes_legais  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.publicacoes_legais;
CREATE POLICY "rls_select" ON public.publicacoes_legais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.publicacoes_legais;
CREATE POLICY "rls_insert" ON public.publicacoes_legais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.publicacoes_legais;
CREATE POLICY "rls_update" ON public.publicacoes_legais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.publicacoes_legais;
CREATE POLICY "rls_delete" ON public.publicacoes_legais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- recursos_lai  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.recursos_lai;
CREATE POLICY "rls_select" ON public.recursos_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.recursos_lai;
CREATE POLICY "rls_insert" ON public.recursos_lai FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.recursos_lai;
CREATE POLICY "rls_update" ON public.recursos_lai FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.recursos_lai;
CREATE POLICY "rls_delete" ON public.recursos_lai FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- regimes_trabalho  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.regimes_trabalho;
CREATE POLICY "rls_select" ON public.regimes_trabalho FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.regimes_trabalho;
CREATE POLICY "rls_insert" ON public.regimes_trabalho FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.regimes_trabalho;
CREATE POLICY "rls_update" ON public.regimes_trabalho FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.regimes_trabalho;
CREATE POLICY "rls_delete" ON public.regimes_trabalho FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- registros_ponto  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.registros_ponto;
CREATE POLICY "rls_select" ON public.registros_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.registros_ponto;
CREATE POLICY "rls_insert" ON public.registros_ponto FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.registros_ponto;
CREATE POLICY "rls_update" ON public.registros_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.registros_ponto;
CREATE POLICY "rls_delete" ON public.registros_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- regra_lancamento  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.regra_lancamento;
CREATE POLICY "rls_select" ON public.regra_lancamento FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.regra_lancamento;
CREATE POLICY "rls_insert" ON public.regra_lancamento FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.regra_lancamento;
CREATE POLICY "rls_update" ON public.regra_lancamento FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.regra_lancamento;

-- remessas_bancarias  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.remessas_bancarias;
CREATE POLICY "rls_select" ON public.remessas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.remessas_bancarias;
CREATE POLICY "rls_insert" ON public.remessas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.remessas_bancarias;
CREATE POLICY "rls_update" ON public.remessas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.remessas_bancarias;

-- requisicao_itens  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.requisicao_itens;
CREATE POLICY "rls_select" ON public.requisicao_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.requisicao_itens;
CREATE POLICY "rls_insert" ON public.requisicao_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.requisicao_itens;
CREATE POLICY "rls_update" ON public.requisicao_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.requisicao_itens;
CREATE POLICY "rls_delete" ON public.requisicao_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- requisicoes_material  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.requisicoes_material;
CREATE POLICY "rls_select" ON public.requisicoes_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.requisicoes_material;
CREATE POLICY "rls_insert" ON public.requisicoes_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.requisicoes_material;
CREATE POLICY "rls_update" ON public.requisicoes_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.requisicoes_material;
CREATE POLICY "rls_delete" ON public.requisicoes_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- respostas_checklist  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.respostas_checklist;
CREATE POLICY "rls_select" ON public.respostas_checklist FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.respostas_checklist;
CREATE POLICY "rls_insert" ON public.respostas_checklist FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.respostas_checklist;
CREATE POLICY "rls_update" ON public.respostas_checklist FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.respostas_checklist;
CREATE POLICY "rls_delete" ON public.respostas_checklist FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- retornos_bancarios  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.retornos_bancarios;
CREATE POLICY "rls_select" ON public.retornos_bancarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.retornos_bancarios;
CREATE POLICY "rls_insert" ON public.retornos_bancarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.retornos_bancarios;
CREATE POLICY "rls_update" ON public.retornos_bancarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.retornos_bancarios;
CREATE POLICY "rls_delete" ON public.retornos_bancarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- reunioes  [modulo: gabinete | admin]
DROP POLICY IF EXISTS "rls_select" ON public.reunioes;
CREATE POLICY "rls_select" ON public.reunioes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.reunioes;
CREATE POLICY "rls_insert" ON public.reunioes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.reunioes;
CREATE POLICY "rls_update" ON public.reunioes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.reunioes;
CREATE POLICY "rls_delete" ON public.reunioes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'admin')));

-- riscos_institucionais  [modulo: governanca | integridade]
DROP POLICY IF EXISTS "rls_select" ON public.riscos_institucionais;
CREATE POLICY "rls_select" ON public.riscos_institucionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_insert" ON public.riscos_institucionais;
CREATE POLICY "rls_insert" ON public.riscos_institucionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_update" ON public.riscos_institucionais;
CREATE POLICY "rls_update" ON public.riscos_institucionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));
DROP POLICY IF EXISTS "rls_delete" ON public.riscos_institucionais;
CREATE POLICY "rls_delete" ON public.riscos_institucionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca') OR public.can_access_module(auth.uid(), 'integridade')));

-- role_permissions  [catalogo_admin]
DROP POLICY IF EXISTS "del_role_permissions_admin" ON public.role_permissions;
DROP POLICY IF EXISTS "ins_role_permissions_admin" ON public.role_permissions;
DROP POLICY IF EXISTS "sel_role_permissions_authenticated" ON public.role_permissions;
DROP POLICY IF EXISTS "upd_role_permissions_admin" ON public.role_permissions;
DROP POLICY IF EXISTS "rls_select" ON public.role_permissions;
CREATE POLICY "rls_select" ON public.role_permissions FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.role_permissions;
CREATE POLICY "rls_insert" ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.role_permissions;
CREATE POLICY "rls_update" ON public.role_permissions FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.role_permissions;
CREATE POLICY "rls_delete" ON public.role_permissions FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- rubricas  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.rubricas;
CREATE POLICY "rls_select" ON public.rubricas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.rubricas;
CREATE POLICY "rls_insert" ON public.rubricas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.rubricas;
CREATE POLICY "rls_update" ON public.rubricas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.rubricas;
CREATE POLICY "rls_delete" ON public.rubricas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- rubricas_historico  [trilha: rh]
DROP POLICY IF EXISTS "rls_select" ON public.rubricas_historico;
CREATE POLICY "rls_select" ON public.rubricas_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidor_regime  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.servidor_regime;
CREATE POLICY "rls_select" ON public.servidor_regime FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidor_regime;
CREATE POLICY "rls_insert" ON public.servidor_regime FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidor_regime;
CREATE POLICY "rls_update" ON public.servidor_regime FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidor_regime;
CREATE POLICY "rls_delete" ON public.servidor_regime FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidor_tag_vinculos  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_select" ON public.servidor_tag_vinculos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_insert" ON public.servidor_tag_vinculos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_update" ON public.servidor_tag_vinculos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_delete" ON public.servidor_tag_vinculos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidor_tags  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.servidor_tags;
CREATE POLICY "rls_select" ON public.servidor_tags FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidor_tags;
CREATE POLICY "rls_insert" ON public.servidor_tags FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidor_tags;
CREATE POLICY "rls_update" ON public.servidor_tags FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidor_tags;
CREATE POLICY "rls_delete" ON public.servidor_tags FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidores  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_select" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_update" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_write" ON public.servidores;
DROP POLICY IF EXISTS "rls_select" ON public.servidores;
CREATE POLICY "rls_select" ON public.servidores FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.servidores;
CREATE POLICY "rls_insert" ON public.servidores FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(id)));
DROP POLICY IF EXISTS "rls_update" ON public.servidores;
CREATE POLICY "rls_update" ON public.servidores FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(id)));
DROP POLICY IF EXISTS "rls_delete" ON public.servidores;
CREATE POLICY "rls_delete" ON public.servidores FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(id)));

-- setores_modulo  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.setores_modulo;
CREATE POLICY "rls_select" ON public.setores_modulo FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.setores_modulo;
CREATE POLICY "rls_insert" ON public.setores_modulo FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.setores_modulo;
CREATE POLICY "rls_update" ON public.setores_modulo FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.setores_modulo;
CREATE POLICY "rls_delete" ON public.setores_modulo FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- solicitacoes_abono  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_abono;
CREATE POLICY "rls_select" ON public.solicitacoes_abono FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_abono;
CREATE POLICY "rls_insert" ON public.solicitacoes_abono FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id))) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_abono;
CREATE POLICY "rls_update" ON public.solicitacoes_abono FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_abono;
CREATE POLICY "rls_delete" ON public.solicitacoes_abono FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- solicitacoes_ajuste_ponto  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_select" ON public.solicitacoes_ajuste_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR (servidor_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_insert" ON public.solicitacoes_ajuste_ponto FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid())) OR (servidor_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_update" ON public.solicitacoes_ajuste_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_delete" ON public.solicitacoes_ajuste_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));

-- solicitacoes_sic  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_sic;
CREATE POLICY "rls_select" ON public.solicitacoes_sic FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_sic;
CREATE POLICY "rls_insert" ON public.solicitacoes_sic FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_sic;
CREATE POLICY "rls_update" ON public.solicitacoes_sic FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_sic;
CREATE POLICY "rls_delete" ON public.solicitacoes_sic FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- tabela_inss  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.tabela_inss;
CREATE POLICY "rls_select" ON public.tabela_inss FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.tabela_inss;
CREATE POLICY "rls_insert" ON public.tabela_inss FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.tabela_inss;
CREATE POLICY "rls_update" ON public.tabela_inss FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.tabela_inss;
CREATE POLICY "rls_delete" ON public.tabela_inss FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- tabela_irrf  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.tabela_irrf;
CREATE POLICY "rls_select" ON public.tabela_irrf FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.tabela_irrf;
CREATE POLICY "rls_insert" ON public.tabela_irrf FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.tabela_irrf;
CREATE POLICY "rls_update" ON public.tabela_irrf FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.tabela_irrf;
CREATE POLICY "rls_delete" ON public.tabela_irrf FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));

-- termos_cessao  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.termos_cessao;
CREATE POLICY "rls_select" ON public.termos_cessao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.termos_cessao;
CREATE POLICY "rls_insert" ON public.termos_cessao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.termos_cessao;
CREATE POLICY "rls_update" ON public.termos_cessao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.termos_cessao;
CREATE POLICY "rls_delete" ON public.termos_cessao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- tipos_abono  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.tipos_abono;
CREATE POLICY "rls_select" ON public.tipos_abono FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.tipos_abono;
CREATE POLICY "rls_insert" ON public.tipos_abono FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.tipos_abono;
CREATE POLICY "rls_update" ON public.tipos_abono FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.tipos_abono;
CREATE POLICY "rls_delete" ON public.tipos_abono FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));

-- unidades_locais  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_select" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_update" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_write" ON public.unidades_locais;
DROP POLICY IF EXISTS "rls_select" ON public.unidades_locais;
CREATE POLICY "rls_select" ON public.unidades_locais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.unidades_locais;
CREATE POLICY "rls_insert" ON public.unidades_locais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.unidades_locais;
CREATE POLICY "rls_update" ON public.unidades_locais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.unidades_locais;
CREATE POLICY "rls_delete" ON public.unidades_locais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- user_modules  [proprio_user]
DROP POLICY IF EXISTS "del_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "ins_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "sel_user_modules_own_or_admin" ON public.user_modules;
DROP POLICY IF EXISTS "upd_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_delete" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_insert" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_select" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_update" ON public.user_modules;
DROP POLICY IF EXISTS "rls_select" ON public.user_modules;
CREATE POLICY "rls_select" ON public.user_modules FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_modules;
CREATE POLICY "rls_insert" ON public.user_modules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_modules;
CREATE POLICY "rls_update" ON public.user_modules FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_modules;
CREATE POLICY "rls_delete" ON public.user_modules FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_org_units  [proprio_user]
DROP POLICY IF EXISTS "rls_select" ON public.user_org_units;
CREATE POLICY "rls_select" ON public.user_org_units FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_org_units;
CREATE POLICY "rls_insert" ON public.user_org_units FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_org_units;
CREATE POLICY "rls_update" ON public.user_org_units FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_org_units;
CREATE POLICY "rls_delete" ON public.user_org_units FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_permissions  [proprio_user]
DROP POLICY IF EXISTS "del_user_permissions_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "ins_user_permissions_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "sel_user_permissions_own_or_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "upd_user_permissions_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "rls_select" ON public.user_permissions;
CREATE POLICY "rls_select" ON public.user_permissions FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_permissions;
CREATE POLICY "rls_insert" ON public.user_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_permissions;
CREATE POLICY "rls_update" ON public.user_permissions FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_permissions;
CREATE POLICY "rls_delete" ON public.user_permissions FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_roles  [proprio_user]
DROP POLICY IF EXISTS "del_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "ins_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "sel_user_roles_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "upd_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "rls_select" ON public.user_roles;
CREATE POLICY "rls_select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_roles;
CREATE POLICY "rls_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_roles;
CREATE POLICY "rls_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_roles;
CREATE POLICY "rls_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- vagas_cargo  [catalogo: rh | governanca]
DROP POLICY IF EXISTS "rls_select" ON public.vagas_cargo;
CREATE POLICY "rls_select" ON public.vagas_cargo FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.vagas_cargo;
CREATE POLICY "rls_insert" ON public.vagas_cargo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.vagas_cargo;
CREATE POLICY "rls_update" ON public.vagas_cargo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.vagas_cargo;
CREATE POLICY "rls_delete" ON public.vagas_cargo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'));

-- viagens_diarias  [permissao: rh | financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.viagens_diarias;
CREATE POLICY "rls_select" ON public.viagens_diarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.viagens_diarias;
CREATE POLICY "rls_insert" ON public.viagens_diarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar') OR public.has_permission_code(auth.uid(), 'rh.viagens.editar') OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar') OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.viagens_diarias;
CREATE POLICY "rls_update" ON public.viagens_diarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar') OR public.has_permission_code(auth.uid(), 'rh.viagens.editar') OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar') OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar') OR public.has_permission_code(auth.uid(), 'rh.viagens.editar') OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar') OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.viagens_diarias;
CREATE POLICY "rls_delete" ON public.viagens_diarias FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- vinculos_funcionais  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.vinculos_funcionais;
CREATE POLICY "rls_select" ON public.vinculos_funcionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.vinculos_funcionais;
CREATE POLICY "rls_insert" ON public.vinculos_funcionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.vinculos_funcionais;
CREATE POLICY "rls_update" ON public.vinculos_funcionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.vinculos_funcionais;
CREATE POLICY "rls_delete" ON public.vinculos_funcionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- vinculos_servidor  [proprio_leitura: rh]
DROP POLICY IF EXISTS "vinculos_delete" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_insert" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_select" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_update" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "rls_select" ON public.vinculos_servidor;
CREATE POLICY "rls_select" ON public.vinculos_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.vinculos_servidor;
CREATE POLICY "rls_insert" ON public.vinculos_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.vinculos_servidor;
CREATE POLICY "rls_update" ON public.vinculos_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.vinculos_servidor;
CREATE POLICY "rls_delete" ON public.vinculos_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ====================================================================================================
-- supabase/baseline/overlay/40_privilegios.sql
-- ====================================================================================================

-- Privilégios: `anon` não recebe nada por padrão; só as exceções públicas intencionais.
--
-- Por padrão o Supabase concede ALL em tudo que o postgres cria em public a anon/authenticated/
-- service_role, e funções ficam executáveis por PUBLIC. A RLS protege as tabelas, mas FUNÇÕES
-- SECURITY DEFINER não passam por RLS: no estado atual, 159 funções de public eram executáveis
-- por anon (133 SECURITY DEFINER), entre elas processar_folha_pagamento, fechar_folha,
-- fn_gerar_esocial_s2200 e generate_schema_ddl().
--
-- Este arquivo é idempotente e também serve a um banco já em uso (revisar a lista de exceções
-- antes). authenticated e service_role mantêm os privilégios padrão.

-- ---- tabelas e sequências: anon sem nada ----
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- ---- funções: ninguém executa por PUBLIC; anon só as RPCs públicas abaixo ----
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- ---- objetos futuros herdam o mesmo padrão fechado ----
-- O EXECUTE para PUBLIC é um privilégio padrão GLOBAL do Postgres: `IN SCHEMA` só revoga o que foi
-- concedido por default privileges daquele schema e NÃO o remove. Sem a linha global, uma função
-- criada depois deste arquivo nascia executável por anon (verificado em banco vazio).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
-- Funções novas ainda nascem executáveis por `authenticated` (padrão do Supabase, usado pelas
-- policies e pelo front). Toda função SECURITY DEFINER nova precisa checar quem chama ou receber
-- REVOKE explícito: scripts/db/testar-rls.sql falha se aparecer uma sem checagem fora da lista revisada.

-- ---- TRUNCATE/TRIGGER/REFERENCES não servem à API: ninguém de fora precisa deles ----
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;

-- ---- trilha de auditoria: só acréscimo, por privilégio e por RLS ----
-- (migração 20261006230500; o dump do schema não leva GRANT/REVOKE, então a revogação volta aqui)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- ---- exceções públicas intencionais: tabelas ----
-- leitura (portal e formulários públicos); as policies de RLS filtram o conteúdo
GRANT SELECT ON public.config_menu_publico, public.config_paginas_publicas, public.links_uteis,
                public.escolas_jer, public.form_field_config, public.publicacoes_lai TO anon;
-- configuração do cliente (migração 20261011023500): só as colunas públicas, não a autoria nem o motivo
GRANT SELECT (chave, valor, categoria) ON public.dados_oficiais TO anon;
-- escrita (formulários públicos de cadastro); sem SELECT: ver as RPCs abaixo
GRANT INSERT ON public.cadastro_arbitros, public.cadastro_arbitros_modalidades,
                public.federacoes_esportivas, public.gestores_escolares TO anon;

-- ---- exceções públicas intencionais: RPCs ----
GRANT EXECUTE ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_dado_oficial(text) TO anon;
GRANT EXECUTE ON FUNCTION public.arbitro_cpf_cadastrado(text) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_protocolo_arbitro(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.consultar_gestor_por_cpf(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registrar_gestor_publico(uuid, text, text, text, date, text, text, text) TO anon;
-- Portal da Transparência (migração 20261010200100): só os campos das telas, filtro de LGPD no servidor
GRANT EXECUTE ON FUNCTION public.transparencia_execucao_orcamentaria() TO anon;
GRANT EXECUTE ON FUNCTION public.transparencia_licitacoes(integer, text) TO anon;
GRANT EXECUTE ON FUNCTION public.transparencia_patrimonio() TO anon;
-- Quadro de cargos comissionados (migração 20261010234000): nome do ocupante sim; indicação, CPF e contato nunca
GRANT EXECUTE ON FUNCTION public.transparencia_cargos_publicos() TO anon;

-- ---- funções só da service role (Edge Functions): fecham também para authenticated ----
REVOKE EXECUTE ON FUNCTION public.list_public_tables() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_schema_ddl() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_schema_ddl() TO service_role;
REVOKE EXECUTE ON FUNCTION public.consumir_cota_uso(uuid, text, integer, integer, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cota_uso(uuid, text, integer, integer, text, text) TO service_role;

-- ---- funções de trigger sem uso direto (migração 20261009160000; o dump não leva o REVOKE) ----
REVOKE EXECUTE ON FUNCTION public.fn_fotos_vistoria_inventario_imutavel() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_campanhas_inventario_unidades_autoria() FROM authenticated;

-- ---- patrimônio (migração 20261010230000): o número de tombamento nasce no INSERT do bem ----
REVOKE EXECUTE ON FUNCTION public.gerar_numero_tombamento(uuid) FROM authenticated;

-- ---- privilégios das migrações de 2026-10-09/10 (o dump do schema não leva GRANT/REVOKE) ----
-- Copiados das migrações 20261009120000 (avisos), 20261009150000 (envios), 20261009153000 (importações)
-- e 20261010070000 (folha): funções de trigger sem EXECUTE para authenticated; RPC só da service role;
-- tabelas com escrita restrita e config_envio com privilégios por coluna (segredo_id nunca legível pela API).
REVOKE EXECUTE ON FUNCTION public.fixar_autoria_aviso() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria_config_envio() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_insercao_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_insercao_item_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.folhas_proteger_fechamento() FROM authenticated;
-- triggers de folha fechada que já existiam (o dump não leva o REVOKE; a migração 20261010070000 também o faz)
REVOKE EXECUTE ON FUNCTION public.bloquear_alteracao_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_alteracao_item_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_exclusao_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.folhas_proteger_exclusao() FROM authenticated;
-- trigger de etapas do abono/fechamento (migração 20261010090000, B2). Guardado por existência: a função só
-- entra em schema/ quando o baseline é regenerado a partir do replay.
DO $$ BEGIN
  IF to_regprocedure('public.validar_etapa_frequencia()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.validar_etapa_frequencia() FROM authenticated;
  END IF;
  -- trigger que protege servidores.cpf (migração 20261010100000), mesma guarda por existência
  IF to_regprocedure('public.servidores_proteger_cpf()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.servidores_proteger_cpf() FROM authenticated;
  END IF;
END $$;
-- ajudantes das policies de storage do RH (migração 20261010210000, B3; definidos no overlay/10): só authenticated
-- executa (as policies os chamam como o usuário; a service role não passa por RLS). O dump não leva o REVOKE.
REVOKE EXECUTE ON FUNCTION public.eh_meu_arquivo_frequencia(text) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.eh_minha_pasta_servidor(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eh_meu_arquivo_frequencia(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eh_minha_pasta_servidor(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.config_envio_servidor(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.config_envio_servidor(text) TO service_role;
-- trilha e autoria do RH (migração 20261011000000, E1; o dump não leva GRANT/REVOKE): funções de apoio e de trigger
-- sem EXECUTE para a API; registrar_evento só para authenticated (a guarda no corpo exige usuário ativo)
REVOKE EXECUTE ON FUNCTION public.trilha_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto_invalidar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.responsavel_atual() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_exige_servidor_vinculado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mascarar_parcial(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_mascarar(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto_requisicao() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_completar_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_imutavel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) TO authenticated;
-- trilha dos arquivos do RH no Storage (migração 20261011000200, E2): função de trigger e de apoio fora da API
REVOKE EXECUTE ON FUNCTION public.trilha_storage_chave(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_storage() FROM PUBLIC, anon, authenticated;
-- integridade da remessa CNAB e do eSocial (migração 20261011010000, E3): funções de trigger fora da API;
-- cancelar_remessa só para authenticated (a guarda no corpo exige o módulo rh e financeiro.folha.processar)
REVOKE EXECUTE ON FUNCTION public.exigir_folha_fechada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remessa_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) TO authenticated;
-- lançamento por setor (migração 20261011020000, fase 1): funções de apoio e de trigger fora da API;
-- meus_fundamentos_lancamento e saneamento_lancamento só para authenticated (a guarda no corpo exige usuário ativo
-- e, no saneamento, admin ou rh.auditoria.visualizar)
REVOKE EXECUTE ON FUNCTION public.data_local() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lotacao_vigente(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unidade_e_superiores(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_modulos_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_lancamento(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_linha(text, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_cache_invalidar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor_fim() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.regra_lancamento_proteger_exigir() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.comissoes_membros_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.saneamento_lancamento() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.saneamento_lancamento() TO authenticated;
-- RH de 2026-10-12 (migrações 20261012090000 a 20261012140000; o dump não leva GRANT/REVOKE e o baseline só foi
-- regenerado com elas na migração 20261012150000): funções de apoio e de trigger fora da API; o pré-cadastro público
-- expõe ao anônimo só as quatro RPCs do formulário (guarda: token)
REVOKE EXECUTE ON FUNCTION public.trilha_atribuir_protocolo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_avancar_status_por_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.portaria_nomeacao_publicada(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.folha_montar_ficha(uuid, uuid, text, date, date, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.afastamento_remunerado(text, text, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.viagens_diarias_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastros_gerar_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_colunas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_filtrar(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_buscar(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_criar(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_obter(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_salvar(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_enviar(text) TO anon, authenticated;
-- quadro de vagas (migração 20261012150000): funções de trigger fora da API; rh_vaga_situacao e
-- rh_vaga_ocupante_atual (guarda: usuário ativo; sem dado pessoal) e rh_importar_quadro_vagas (INVOKER, guarda:
-- governanca.cargos.gerenciar) seguem executáveis por authenticated
REVOKE EXECUTE ON FUNCTION public.rh_provimento_vaga() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_vagas_cargo_validar() FROM PUBLIC, anon, authenticated;
-- portaria pelo SEI (migração 20261012160000): a gravação do DOE na ficha é função de trigger, fora da API
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_ficha() FROM PUBLIC, anon, authenticated;
-- remessas e eventos do eSocial sem DELETE pela API (migração 20261011010100, E3; a RLS também não tem policy de DELETE,
-- classe modulo com excluir=ninguem no rls/mapa.csv): a remessa é cancelada por cancelar_remessa
REVOKE DELETE ON public.remessas_bancarias, public.eventos_esocial FROM anon, authenticated;
REVOKE ALL ON public.avisos_leituras FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.avisos_leituras TO authenticated;
REVOKE ALL ON public.envios_log FROM anon, authenticated;
GRANT SELECT ON public.envios_log TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.importacoes FROM authenticated;
-- financeiro: arquivos bancários, reenvio e extrato do BB (migrações 20261011100000 a 20261011100300). As tabelas só
-- são lidas pela API (escrita pelas RPCs com pagamento.conciliar ou pela service role na Edge Function bb-api);
-- funções de apoio e de trigger fora da API; registrar_extrato_bb só para a service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_movimentos_bancarios, public.fin_remessas_bancarias,
                                           public.fin_extrato_lancamentos FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_alteracoes_proteger_situacao_fiplan() FROM PUBLIC, anon, authenticated;
-- baixa do pagamento só pelo banco e exclusão de alteração confirmada (migração 20261011100400): triggers fora da API
REVOKE EXECUTE ON FUNCTION public.fin_pagamentos_proteger_baixa() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_casar_movimento_pagamento(text, text, numeric, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_marcar_pagamento_pago(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_remessa_bancaria_json(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) TO service_role;
REVOKE ALL ON public.config_envio FROM anon, authenticated;
GRANT SELECT (
  canal, ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates,
  segredo_atualizado_em, updated_by, created_at, updated_at
) ON public.config_envio TO authenticated;
GRANT INSERT (
  canal, ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates
) ON public.config_envio TO authenticated;
GRANT UPDATE (
  ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates
) ON public.config_envio TO authenticated;

-- ---- funções que ESCREVEM e não são chamadas por usuário logado ----
-- fn_atualizar_situacao_servidor só é chamada por triggers SECURITY DEFINER. processar_folha_pagamento
-- saiu desta lista na migração 20261010070000: ganhou guarda has_permission_code('financeiro.folha.processar')
-- no corpo e EXECUTE para authenticated (o front chama a RPC no botão Processar).
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('fn_atualizar_situacao_servidor')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', f.assinatura);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.assinatura);
  END LOOP;
END $$;

-- ---- workflow ----
-- modelos de fluxo do workflow (migração 20261013100000): anon sem nada nas três tabelas; fn_somar_dias_uteis só
-- para authenticated
REVOKE ALL ON public.processo_modelos, public.processo_modelo_etapas, public.processo_modelo_checklist FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_somar_dias_uteis(date, integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_somar_dias_uteis(date, integer) TO authenticated;
-- sigilo do workflow (migração 20261013100100): anon sem nada nas respostas do checklist; wf_pode_ver_processo é
-- chamada pelas policies das tabelas do processo, então authenticated executa; a função do trigger que recusa apagar
-- etapa em uso ninguém executa pela API
REVOKE ALL ON public.processo_checklist_respostas FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.processo_checklist_respostas FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.wf_pode_ver_processo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wf_pode_ver_processo(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.wf_recusar_etapa_em_uso() FROM PUBLIC, anon, authenticated, service_role;
-- RPCs do acompanhamento (migração 20261013100200): as internas (resolver unidade, travar processo, pendências,
-- número SEI, movimentação) ninguém executa pela API; as RPCs e o semáforo só authenticated; a view só SELECT para
-- authenticated
REVOKE EXECUTE ON FUNCTION public.wf_resolver_unidade(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_travar_processo(uuid, boolean) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_exigir_em_andamento(public.status_processo_administrativo) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_pendencias(uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_preparar_numero_sei(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_registrar_movimentacao(uuid, public.tipo_movimentacao_processo, text, text, uuid, uuid, integer, integer, integer, date) FROM PUBLIC, anon, authenticated, service_role;
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.wf_abrir_processo(text, text, text, text, text, text, public.nivel_sigilo_processo, text)',
    'public.wf_marcar_item(uuid, text, boolean, text)',
    'public.wf_avancar_etapa(uuid, integer, text)',
    'public.wf_devolver_etapa(uuid, integer, integer, text)',
    'public.wf_suspender(uuid, text)',
    'public.wf_reativar(uuid, text)',
    'public.wf_concluir(uuid, text)',
    'public.wf_arquivar(uuid, text)',
    'public.wf_atualizar_numero_sei(uuid, text)',
    'public.wf_conceder_acesso(uuid, uuid, text, text)',
    'public.wf_revogar_acesso(uuid, uuid)',
    'public.wf_listar_credenciais(uuid)',
    'public.wf_listar_usuarios_ativos()',
    'public.fn_situacao_prazo(date)'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, service_role', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON public.v_processos_acompanhamento FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_processos_acompanhamento TO authenticated;

-- ====================================================================================================
-- supabase/baseline/overlay/50_storage.sql
-- ====================================================================================================

-- Storage: buckets e policies por módulo.
--
-- Estado anterior (replay das migrações): 26 policies em storage.objects, várias com
-- `auth.uid() IS NOT NULL` (qualquer usuário logado lê/escreve), leitura anônima de buckets
-- públicos e bucket de documentos de servidores (documentos-requerimento) legível por qualquer
-- logado. Aqui tudo passa a exigir módulo; anônimo só INSERE no formulário de árbitros.
--
-- Buckets públicos continuam servindo o arquivo por URL (isso não passa por policy), mas
-- ninguém consegue LISTAR/consultar a tabela de objetos sem módulo. Para fechar o acesso por URL
-- é preciso bucket privado + URL assinada no front (pendência registrada em supabase/baseline/README.md).
--
-- Remove só as policies conhecidas (por nome), para não apagar nada que a plataforma ou outro
-- sistema tenha criado em storage.objects.

DO $$
DECLARE nome text;
BEGIN
  FOREACH nome IN ARRAY ARRAY[
    'Autenticados podem atualizar publicacoes oficiais','Autenticados podem enviar publicacoes oficiais',
    'Autenticados podem remover publicacoes oficiais','Auth users can delete docs','Auth users can update docs',
    'Auth users can upload docs','Auth users can view docs','Fotos patrimonio publicas para leitura',
    'Leitura publica de publicacoes oficiais','Upload público de documentos de árbitros',
    'Usuarios autenticados podem atualizar','Usuarios autenticados podem atualizar documentos',
    'Usuarios autenticados podem deletar','Usuarios autenticados podem deletar documentos',
    'Usuarios autenticados podem fazer upload','Usuarios autenticados podem fazer upload de documentos',
    'Usuários autenticados podem atualizar frequências','Usuários autenticados podem fazer upload',
    'Usuários autenticados podem inserir frequências','Usuários autenticados podem visualizar arquivos ASCOM',
    'Usuários autenticados podem visualizar frequências','arbitros_docs_select_authenticated',
    'inventario_fotos_delete_authenticated','inventario_fotos_insert_authenticated',
    'inventario_fotos_select_public','inventario_fotos_update_authenticated',
    'Leitura pública de documentos de árbitros'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', nome);
  END LOOP;
END $$;

-- Buckets (idempotente). public = leitura por URL sem login.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('arbitros-docs',             'arbitros-docs',             false, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']),
  ('ascom-demandas',            'ascom-demandas',            false, NULL,     NULL),
  ('documentos',                'documentos',                false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('documentos-requerimento',   'documentos-requerimento',   false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('frequencias',               'frequencias',               false, 52428800, ARRAY['application/pdf','application/zip','application/x-zip-compressed']),
  ('inventario-evidencias',     'inventario-evidencias',     false, 10485760, ARRAY['image/jpeg','image/webp']),
  ('inventario-fotos',          'inventario-fotos',          true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('patrimonio-docs',           'patrimonio-docs',           false, 10485760, NULL),
  ('patrimonio-fotos',          'patrimonio-fotos',          true,  NULL,     NULL),
  ('remessas-cnab',             'remessas-cnab',             false, 10485760, ARRAY['text/plain','application/octet-stream']),
  ('transparencia-publicacoes', 'transparencia-publicacoes', true,  10485760, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  -- templates dos e-mails do Supabase Auth: o GoTrue os busca por HTTP, sem login (docs/EMAILS_AUTH.md)
  ('emails',                    'emails',                    true,  NULL,     NULL)
-- Na migração só `public` é acertado num bucket que já existe: tamanho e tipos aceitos podem ter sido
-- ajustados à mão na produção e a fotografia não os compara, então ficam como estão.
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public;

-- Policies: leitura e escrita por módulo (can_access_module já exige perfil ativo e dá passagem ao papel admin).
-- frequencias e documentos-requerimento saíram do laço na B3 (policies próprias mais abaixo).
DO $$
DECLARE
  b record; mods text; cond text; cmd text;
BEGIN
  FOR b IN SELECT * FROM (VALUES
    ('arbitros-docs',             ARRAY['arbitros']),
    ('ascom-demandas',            ARRAY['comunicacao']),
    ('documentos',                ARRAY['workflow','rh']),
    ('inventario-evidencias',     ARRAY['patrimonio','patrimonio_mobile']),
    ('inventario-fotos',          ARRAY['patrimonio','patrimonio_mobile']),
    ('patrimonio-docs',           ARRAY['patrimonio','patrimonio_mobile']),
    ('patrimonio-fotos',          ARRAY['patrimonio','patrimonio_mobile']),
    ('transparencia-publicacoes', ARRAY['transparencia'])
  ) AS v(bucket, modulos)
  LOOP
    SELECT string_agg(format('public.can_access_module(auth.uid(), %L)', m), ' OR ') INTO mods FROM unnest(b.modulos) m;
    cond := format('bucket_id = %L AND (%s)', b.bucket, mods);
    FOREACH cmd IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'st_' || b.bucket || '_' || lower(cmd));
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR %s TO authenticated %s',
        'st_' || b.bucket || '_' || lower(cmd), cmd,
        CASE cmd WHEN 'INSERT' THEN format('WITH CHECK (%s)', cond)
                 WHEN 'UPDATE' THEN format('USING (%s) WITH CHECK (%s)', cond, cond)
                 ELSE format('USING (%s)', cond) END);
    END LOOP;
  END LOOP;
END $$;

-- Evidências do inventário de campo (migração 20261009160000): o arquivo tem o hash gravado em
-- fotos_vistoria_inventario, então sobrescrever (UPDATE) ou apagar exige patrimonio.tramitar, como o
-- DELETE da tabela. Ler e enviar continuam por módulo (policies do laço acima).
DROP POLICY IF EXISTS "st_inventario-evidencias_update" ON storage.objects;
CREATE POLICY "st_inventario-evidencias_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'inventario-evidencias' AND public.has_permission_code(auth.uid(), 'patrimonio.tramitar'))
  WITH CHECK (bucket_id = 'inventario-evidencias' AND public.has_permission_code(auth.uid(), 'patrimonio.tramitar'));
DROP POLICY IF EXISTS "st_inventario-evidencias_delete" ON storage.objects;
CREATE POLICY "st_inventario-evidencias_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inventario-evidencias' AND public.has_permission_code(auth.uid(), 'patrimonio.tramitar'));

-- Arquivos do RH (Onda B / B3, migração 20261010210000_onda_b_rh_storage.sql, mesmo texto): ler continua pelo módulo
-- rh, mais o dono do arquivo; gravar (INSERT/UPDATE/DELETE) exige o módulo E um código do catálogo, como as tabelas
-- do RH na B2.
--   frequencias ............... o servidor lê o PDF dele (eh_meu_arquivo_frequencia: arquivo_path em
--                               frequencia_arquivos com servidor_id do usuário); gravar com rh.frequencia.lancar|criar|editar
--   documentos-requerimento ... o servidor lê a pasta dele (eh_minha_pasta_servidor: <servidor_id>/...); gravar com
--                               rh.servidores.editar (o servidor não envia arquivo)
-- As duas funções estão no overlay/10 (EXECUTE só para authenticated, overlay/40).
DROP POLICY IF EXISTS "st_frequencias_select" ON storage.objects;
CREATE POLICY "st_frequencias_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') OR public.eh_meu_arquivo_frequencia(name)));
DROP POLICY IF EXISTS "st_frequencias_insert" ON storage.objects;
CREATE POLICY "st_frequencias_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))));
DROP POLICY IF EXISTS "st_frequencias_update" ON storage.objects;
CREATE POLICY "st_frequencias_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))))
  WITH CHECK (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))));
DROP POLICY IF EXISTS "st_frequencias_delete" ON storage.objects;
CREATE POLICY "st_frequencias_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))));

DROP POLICY IF EXISTS "st_documentos-requerimento_select" ON storage.objects;
CREATE POLICY "st_documentos-requerimento_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') OR public.eh_minha_pasta_servidor(name)));
DROP POLICY IF EXISTS "st_documentos-requerimento_insert" ON storage.objects;
CREATE POLICY "st_documentos-requerimento_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
DROP POLICY IF EXISTS "st_documentos-requerimento_update" ON storage.objects;
CREATE POLICY "st_documentos-requerimento_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')))
  WITH CHECK (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
DROP POLICY IF EXISTS "st_documentos-requerimento_delete" ON storage.objects;
CREATE POLICY "st_documentos-requerimento_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')));

-- Arquivo da remessa CNAB (Onda E3, migração 20261011010000_rh_cnab_esocial_integridade.sql, mesmo texto): um objeto
-- por remessa, <remessa_id>.rem. Ler e enviar com o módulo rh E financeiro.folha.processar; enviar só para remessa que
-- existe, não cancelada e ainda sem arquivo. Sem UPDATE nem DELETE: o arquivo guardado não muda (o sha256 está na
-- remessa). Bucket privado (URL assinada), 10 MB, texto.
DROP POLICY IF EXISTS "st_remessas-cnab_select" ON storage.objects;
CREATE POLICY "st_remessas-cnab_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'remessas-cnab' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar')));
DROP POLICY IF EXISTS "st_remessas-cnab_insert" ON storage.objects;
CREATE POLICY "st_remessas-cnab_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'remessas-cnab' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
              AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.rem$'
              AND EXISTS (SELECT 1 FROM public.remessas_bancarias r
                           WHERE r.id::text = left(objects.name, 36) AND r.arquivo_path IS NULL AND r.status = 'gerada'
                             AND r.gerado_por = auth.uid() AND r.data_geracao > now() - interval '1 hour'));
DROP POLICY IF EXISTS "st_remessas-cnab_update" ON storage.objects;
DROP POLICY IF EXISTS "st_remessas-cnab_delete" ON storage.objects;

-- Trilha dos arquivos do RH (Onda E2, migração 20261011000200_rh_trilha_consulta.sql, mesmo texto): gravação, troca
-- e exclusão de objeto em frequencias e documentos-requerimento viram linha em audit_logs (módulo rh, entity_type
-- 'storage.<bucket>', sem conteúdo e sem caminho com dado pessoal), pela função public.trilha_storage (schema/, sem
-- EXECUTE para a API no overlay/40). Sem o privilégio TRIGGER em storage.objects, WARNING e a trilha fica desligada
-- (limitação em docs/BANCO_DE_DADOS.md).
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE WARNING 'trilha do Storage do RH: storage.objects não existe; triggers não criados';
    RETURN;
  END IF;
  BEGIN
    CREATE OR REPLACE TRIGGER trilha_rh_storage_insert AFTER INSERT ON storage.objects
      FOR EACH ROW WHEN (NEW.bucket_id IN ('frequencias', 'documentos-requerimento'))
      EXECUTE FUNCTION public.trilha_storage('rh');
    CREATE OR REPLACE TRIGGER trilha_rh_storage_update AFTER UPDATE ON storage.objects
      FOR EACH ROW WHEN (OLD.bucket_id IN ('frequencias', 'documentos-requerimento')
                         OR NEW.bucket_id IN ('frequencias', 'documentos-requerimento'))
      EXECUTE FUNCTION public.trilha_storage('rh');
    CREATE OR REPLACE TRIGGER trilha_rh_storage_delete AFTER DELETE ON storage.objects
      FOR EACH ROW WHEN (OLD.bucket_id IN ('frequencias', 'documentos-requerimento'))
      EXECUTE FUNCTION public.trilha_storage('rh');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE WARNING 'trilha do Storage do RH NÃO ligada: % (%). Os arquivos de frequencias e documentos-requerimento ficam sem trilha no banco; ver docs/BANCO_DE_DADOS.md',
      SQLERRM, current_user;
  END;
END $$;

-- Formulário público de árbitros: upload de foto/documentos sem login (só INSERT; a leitura
-- fica para o módulo arbitros acima, por URL assinada: o bucket é privado desde a migração
-- 20261010233000, porque guarda cópias de RG/CPF). Só nas três pastas que o formulário usa; o bucket limita tamanho
-- (5 MB; o front limita a 2 MB, mas isso é só do navegador) e tipo (imagem e PDF). Continua sem
-- limite de taxa: aplique no proxy (Kong/nginx) e use CAPTCHA no formulário (docs/NOVO_BANCO.md).
DROP POLICY IF EXISTS "st_arbitros-docs_insert_anon" ON storage.objects;
CREATE POLICY "st_arbitros-docs_insert_anon" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'arbitros-docs' AND (storage.foldername(name))[1] IN ('fotos', 'documentos', 'modalidades'));

-- ====================================================================================================
-- supabase/baseline/overlay/60_realtime.sql
-- ====================================================================================================

-- Realtime: tabelas publicadas em supabase_realtime.
--
-- A publicação não faz parte do dump de `public`; as migrações originais adicionaram estas duas
-- tabelas (acompanhamento ao vivo do processamento da folha). Sem a publicação (Postgres puro) o
-- bloco não faz nada.
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['fichas_financeiras', 'folhas_pagamento'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

RESET lock_timeout;
