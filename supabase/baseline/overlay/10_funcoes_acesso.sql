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
-- servidor (só os dígitos; CPF nulo ou vazio nunca casa): o aprovador sem vínculo que é servidor não aprova o
-- próprio pedido. Nunca devolve NULL. Mesmo texto na migração 20261010090000_onda_b_rh_permissoes.sql.
-- EXECUTE só para authenticated (as policies a chamam como o usuário; a service role não passa por RLS).
CREATE OR REPLACE FUNCTION public.eh_meu_servidor(_servidor_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _servidor_id IS NULL OR auth.uid() IS NULL THEN false
    WHEN public.meu_servidor_id() IS NOT NULL THEN _servidor_id = public.meu_servidor_id()
    ELSE EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.servidores s ON s.id = _servidor_id
      WHERE p.id = auth.uid()
        AND nullif(regexp_replace(coalesce(p.cpf, ''), '[^0-9]', '', 'g'), '')
            = regexp_replace(coalesce(s.cpf, ''), '[^0-9]', '', 'g')
    )
  END;
$$;
REVOKE EXECUTE ON FUNCTION public.eh_meu_servidor(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eh_meu_servidor(uuid) TO authenticated;

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
