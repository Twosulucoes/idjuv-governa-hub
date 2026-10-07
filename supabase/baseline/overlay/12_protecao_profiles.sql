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
