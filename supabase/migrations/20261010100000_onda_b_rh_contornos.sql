-- ============================================================================
-- Onda B / B2 — contornos achados na reverificação de segurança (2ª rodada)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-onda-b-rh-permissoes-design.md
-- Roda DEPOIS de 20261010090000_onda_b_rh_permissoes.sql (já mesclada; não é alterada) e vale nos mesmos DOIS estados
-- do banco: (a) baseline (policies rls_*, overlays) e (b) só-migrações (acesso_total_* em tipos_abono). Idempotente:
-- CREATE OR REPLACE, DROP ... IF EXISTS, REVOKE/GRANT.
--
-- Contornos fechados:
--   N1  a chefia trocava tipos_abono.exige_aprovacao_rh, encerrava o fluxo do abono e desfazia: a escrita em
--       tipos_abono passa a exigir rh.frequencia.configurar (catálogo: qualquer usuário ativo continua lendo).
--   N2  o RH sem vínculo trocava o CPF da PRÓPRIA ficha em servidores para escapar de eh_meu_servidor: quem tem o
--       módulo continua editando servidores, menos a própria ficha (o papel admin passa).
--   N3  autoria nula: a etapa que acontece grava o seu par _por/_em mesmo que o comando não o mande; enquanto a etapa
--       vale (status/flag ativo), o par não é apagado.
--   N4  created_by do abono = quem insere (também o isento de forcar_campos_iniciais) e imutável; sem
--       rh.frequencia.lancar, os dados do abono não mudam nem em pendente (a chefia decide, não edita).
--   N5  justificativas_ponto e solicitacoes_ajuste_ponto ganham o trigger de etapa: decisão só a partir de pendente,
--       texto do pedido imutável sem rh.frequencia.lancar, aprovador_id/data_aprovacao gravados pelo banco; excluir o
--       ajuste só com rh.frequencia.lancar.
--   N6/N7  eh_meu_servidor compara CPF com zeros à esquerda (lpad 11) e lê meu_servidor_id() uma vez só.
--   A   a chefia (isenta em forcar_campos_iniciais por rh.aprovar) inseria abono, justificativa ou ajuste já decidido
--       em nome de outro servidor: sem rh.frequencia.lancar o pedido nasce pendente (decidido é recusado, 42501) e os
--       campos de decisão nascem nulos. A isenção da 20261010090000 não muda.
--   C   servidores.cpf (base do casamento por CPF de eh_meu_servidor) só muda pelo papel admin; reformatar (mesmos
--       dígitos) segue livre. Sem índice único (dado legado pode ter duplicatas).
--   D   transição para o status legado aprovado_rh do abono é recusada (nenhuma tela grava; fica fora da autoria).
--   E   status NULL é recusado no abono, na justificativa e no ajuste (sem ALTER ... NOT NULL: dado legado).
--   F   fora da etapa ativa, os pares _por/_em (aprovador_id/data_aprovacao) vão a NULL, salvo o de uma etapa que
--       aconteceu e cujo pedido terminou depois (rejeitado/cancelado; reabertura já reconsolidada), que fica como estava.
--
-- Blocos:
--   0. eh_meu_servidor(uuid) (mesmo texto do overlay/10)
--   1. policies de tipos_abono, servidores e solicitacoes_ajuste_ponto — cópia literal de
--      supabase/baseline/rls/35_policies_geradas.sql (gerado de rls/mapa.csv); antes, RLS ligado e DROP das acesso_total_*
--   2. validar_etapa_frequencia nas quatro tabelas
--   3. servidores_proteger_cpf: CPF só pelo papel admin
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Função auxiliar das policies (N6/N7)
-- ----------------------------------------------------------------------------
-- Este servidor é do usuário logado? Base de ";sem_autoaprovacao" (rls/mapa.csv) e da isenção por permissão de
-- forcar_campos_iniciais (overlay 20): ninguém decide sobre o próprio pedido. Verdadeira quando _servidor_id =
-- meu_servidor_id() ou, se o perfil não tem vínculo (meu_servidor_id() nulo), quando o CPF do perfil é o do
-- servidor: só os dígitos, completados com zeros à esquerda até 11 (CPF gravado sem o zero inicial casa); CPF nulo
-- ou sem dígitos nunca casa. O aprovador sem vínculo que é servidor não aprova o próprio pedido. Nunca devolve
-- NULL; meu_servidor_id() é lido uma vez só. Mesmo texto em supabase/baseline/overlay/10_funcoes_acesso.sql
-- (a primeira versão, em SQL, veio na 20261010090000; CREATE OR REPLACE troca a linguagem).
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

-- ----------------------------------------------------------------------------
-- 1. Policies (N1, N2, N5) — classes catalogo (escrita=), proprio_leitura (sem_autoaprovacao) e permissao (excluir=)
-- ----------------------------------------------------------------------------
-- Policies permissivas são OR: as acesso_total_* do estado (b) são removidas antes de criar as geradas.

-- tipos_abono
ALTER TABLE public.tipos_abono ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.tipos_abono;
DROP POLICY IF EXISTS acesso_total_insert ON public.tipos_abono;
DROP POLICY IF EXISTS acesso_total_update ON public.tipos_abono;
DROP POLICY IF EXISTS acesso_total_delete ON public.tipos_abono;
-- (gerado por scripts/db/gerar-rls.mjs — classe catalogo: rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
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

-- servidores
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.servidores;
DROP POLICY IF EXISTS acesso_total_insert ON public.servidores;
DROP POLICY IF EXISTS acesso_total_update ON public.servidores;
DROP POLICY IF EXISTS acesso_total_delete ON public.servidores;
-- (gerado por scripts/db/gerar-rls.mjs — classe proprio_leitura: rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
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

-- solicitacoes_ajuste_ponto
ALTER TABLE public.solicitacoes_ajuste_ponto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.solicitacoes_ajuste_ponto;
DROP POLICY IF EXISTS acesso_total_insert ON public.solicitacoes_ajuste_ponto;
DROP POLICY IF EXISTS acesso_total_update ON public.solicitacoes_ajuste_ponto;
DROP POLICY IF EXISTS acesso_total_delete ON public.solicitacoes_ajuste_ponto;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao: rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
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

-- ---- privilégios de tabela (estado (b): anon/authenticated tinham ALL; o baseline já faz isto no overlay/40) ----
REVOKE ALL ON public.tipos_abono, public.servidores, public.solicitacoes_ajuste_ponto FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.tipos_abono, public.servidores, public.solicitacoes_ajuste_ponto FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. Etapas: abono, fechamento, justificativa e ajuste de ponto (N3, N4, N5)
-- ----------------------------------------------------------------------------
-- Substitui a versão da 20261010090000 (as regras de lá continuam) e passa a valer também em justificativas_ponto e
-- solicitacoes_ajuste_ponto. "Sem RH" = sem rh.frequencia.lancar (a chefia, com rh.aprovar). O papel admin passa;
-- service role e funções internas passam (GUC role, como o overlay 20). Erros de permissão com ERRCODE 42501.
--   solicitacoes_abono
--     * created_by .............................. = auth.uid() no INSERT (também para o isento); não muda no UPDATE
--     * servidor, tipo, datas, horas, justificativa, documento_url ... sem RH, nunca mudam (a chefia decide, não edita)
--     * motivo_rejeicao ......................... sem RH, só junto com pendente -> rejeitado
--     * aprovado_chefia_por/_em ................. rh.aprovar; sem RH, só junto com a decisão sobre um pendente
--     * aprovado_rh_por/_em ..................... rh.frequencia.lancar
--     * status, sem RH: só a partir de pendente, para aprovado_chefia (rh.aprovar), rejeitado (rh.aprovar) ou
--       aprovado (rh.aprovar, tipo de OLD com exige_aprovacao_rh = false, aprovação da chefia no mesmo comando);
--       aprovado_chefia exige rh.aprovar também para o RH
--     * autoria: status -> aprovado_chefia grava o par da chefia; -> aprovado grava o par da chefia (encerramento pela
--       chefia) ou o do RH; enquanto o status vale, o par não é apagado. A rejeição não tem coluna de autoria.
--   frequencia_fechamento (regras da 090000) e: validado_chefia/consolidado_rh/reaberto que viram true gravam o seu
--     par _por/_em; enquanto a flag é true, o par não é apagado
--   justificativas_ponto, solicitacoes_ajuste_ponto (status_solicitacao)
--     * texto do pedido ......................... sem RH, nunca muda
--     * status, sem RH .......................... só rh.aprovar, de pendente para aprovada ou rejeitada
--     * aprovador_id/data_aprovacao, observacao_aprovador ... sem RH, só junto com essa decisão; a decisão grava
--       aprovador_id = auth.uid() e data_aprovacao = now(); enquanto aprovada/rejeitada, o par não é apagado
--   nas quatro tabelas, DELETE ................. rh.frequencia.lancar (a policy de DELETE já exige; defesa extra)
--   autoria (todas): o par que muda para um valor não nulo na etapa ativa é de quem age, agora; fora da etapa ativa o
--     par vai a NULL, salvo o de uma etapa que aconteceu e cujo pedido terminou depois (abono rejeitado/cancelado ou
--     no status legado aprovado_rh; ajuste/justificativa cancelada; reaberto_* depois da reconsolidação).
--   INSERT sem RH (abono, justificativa, ajuste): status pendente (decidido -> 42501) e campos de decisão nulos;
--     status NULL -> 42501; abono: transição para o status legado aprovado_rh -> 42501.
-- O nome do trigger começa com "trg_v" para rodar DEPOIS de trg_forcar_campos_iniciais (ordem alfabética).
CREATE OR REPLACE FUNCTION public.validar_etapa_frequencia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chefia boolean;
  v_rh boolean;
  o jsonb;
  n jsonb;
  ov jsonb := '{}'::jsonb;
  st_antes text;
  st_depois text;
  mudou_status boolean;
  mudou_chefia boolean;
  mudou_rh boolean;
  pela_chefia boolean;
  dispensa_rh boolean;
  dados text[];
  col text;
  -- pares de autoria: coluna _por, coluna _em, forçar agora (a etapa acontece neste comando), etapa ativa
  -- (enquanto vale, o par não é apagado)
  p_por text[] := '{}';
  p_em text[] := '{}';
  p_forca boolean[] := '{}';
  p_ativo boolean[] := '{}';
  -- fora da etapa ativa: true = o par fica como estava (a etapa aconteceu e o pedido terminou depois, ex.: a chefia
  -- aprovou e o RH rejeitou), false = o par vai a NULL (não sugere uma aprovação que não houve)
  p_hist boolean[] := '{}';
  i int;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated')
     OR public.is_admin_user(v_uid) THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  v_chefia := public.has_permission_code(v_uid, 'rh.aprovar');
  v_rh := public.has_permission_code(v_uid, 'rh.frequencia.lancar');

  IF TG_OP = 'DELETE' THEN
    IF NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: excluir % exige a permissão rh.frequencia.lancar',
        CASE TG_TABLE_NAME
          WHEN 'solicitacoes_abono' THEN 'a solicitação de abono'
          WHEN 'frequencia_fechamento' THEN 'o fechamento da frequência'
          WHEN 'justificativas_ponto' THEN 'a justificativa de ponto'
          ELSE 'a solicitação de ajuste de ponto' END
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- comparações sempre por ->> (texto): no INSERT `o` é vazio e coluna nula em `n` também vira NULL
  n := to_jsonb(NEW);
  o := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;

  IF TG_TABLE_NAME = 'solicitacoes_abono' THEN
    IF n ->> 'status' IS NULL THEN
      RAISE EXCEPTION 'Abono: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- status legado (CHECK do banco): nenhuma tela grava; fica fora da autoria, então ninguém transiciona para ele
    IF mudou_status AND st_depois = 'aprovado_rh' THEN
      RAISE EXCEPTION 'Abono: o status legado aprovado_rh não é mais usado (o RH aprova com aprovado)' USING ERRCODE = '42501';
    END IF;
    -- sem RH, o pedido nasce na etapa inicial: status pendente (decidido é recusado) e campos de decisão nulos
    IF TG_OP = 'INSERT' AND NOT v_rh THEN
      IF st_depois <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: só quem tem rh.frequencia.lancar registra o abono já decidido (status %); a chefia decide depois, sobre o pendente', st_depois
          USING ERRCODE = '42501';
      END IF;
      ov := ov || jsonb_build_object('motivo_rejeicao', NULL);
    END IF;
    mudou_chefia := (n ->> 'aprovado_chefia_por') IS DISTINCT FROM (o ->> 'aprovado_chefia_por')
                 OR (n ->> 'aprovado_chefia_em') IS DISTINCT FROM (o ->> 'aprovado_chefia_em');
    mudou_rh := (n ->> 'aprovado_rh_por') IS DISTINCT FROM (o ->> 'aprovado_rh_por')
             OR (n ->> 'aprovado_rh_em') IS DISTINCT FROM (o ->> 'aprovado_rh_em');

    -- autor do pedido: quem insere (mesmo isento em forcar_campos_iniciais); não muda depois
    IF TG_OP = 'INSERT' THEN
      ov := ov || jsonb_build_object('created_by', v_uid);
    ELSIF (n ->> 'created_by') IS DISTINCT FROM (o ->> 'created_by') THEN
      RAISE EXCEPTION 'Abono: o autor do pedido (created_by) não muda' USING ERRCODE = '42501';
    END IF;

    -- dados do pedido: sem RH, nada muda (a chefia decide, não edita); o motivo da rejeição só entra junto com a
    -- rejeição de um pendente; a aprovação da chefia só junto com a decisão sobre um pendente
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      FOREACH col IN ARRAY ARRAY['servidor_id', 'tipo_abono_id', 'data_inicio', 'data_fim', 'hora_inicio', 'hora_fim',
                                 'justificativa', 'documento_url'] LOOP
        IF (n ->> col) IS DISTINCT FROM (o ->> col) THEN
          RAISE EXCEPTION 'Etapa do RH: alterar os dados do abono (%) exige a permissão rh.frequencia.lancar (a chefia decide, não edita)', col
            USING ERRCODE = '42501';
        END IF;
      END LOOP;
      IF (n ->> 'motivo_rejeicao') IS DISTINCT FROM (o ->> 'motivo_rejeicao')
         AND NOT (st_antes = 'pendente' AND st_depois = 'rejeitado') THEN
        RAISE EXCEPTION 'Etapa do RH: o motivo da rejeição só é registrado ao rejeitar um abono pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
      IF mudou_chefia AND (st_antes <> 'pendente' OR NOT mudou_status) THEN
        RAISE EXCEPTION 'Etapa do RH: a aprovação da chefia só é registrada junto com a decisão sobre um abono pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF mudou_chefia AND NOT v_chefia THEN
      RAISE EXCEPTION 'Etapa da chefia: registrar a aprovação da chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
    END IF;
    IF mudou_rh AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: registrar a aprovação do RH exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;

    IF mudou_status THEN
      IF st_depois = 'aprovado_chefia' AND NOT v_chefia THEN
        RAISE EXCEPTION 'Etapa da chefia: aprovar o abono pela chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
      END IF;
      IF NOT v_rh THEN
        -- a chefia só tira o pedido de pendente
        IF st_antes <> 'pendente' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        ELSIF st_depois = 'aprovado' THEN
          -- o tipo que vale é o da linha antes do comando (no UPDATE), não o que vem nele
          SELECT ta.exige_aprovacao_rh IS FALSE INTO dispensa_rh
            FROM public.tipos_abono ta
           WHERE ta.id = (CASE WHEN TG_OP = 'UPDATE' THEN o ELSE n END ->> 'tipo_abono_id')::uuid;
          IF NOT (v_chefia AND mudou_chefia AND coalesce(dispensa_rh, false)) THEN
            RAISE EXCEPTION 'Etapa do RH: aprovar o abono exige a permissão rh.frequencia.lancar (a chefia só encerra o fluxo quando o tipo de abono dispensa o RH)'
              USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois = 'rejeitado' THEN
          IF NOT v_chefia THEN
            RAISE EXCEPTION 'Etapa da chefia: rejeitar o abono exige a permissão rh.aprovar ou rh.frequencia.lancar' USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois <> 'aprovado_chefia' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
    -- ir para `aprovado` pela chefia (encerra o fluxo; quem tem as duas permissões e só registra a chefia) grava o par
    -- da chefia; pelo RH, o par do RH. A rejeição não tem coluna de autoria no abono.
    pela_chefia := NOT v_rh OR (mudou_chefia AND NOT mudou_rh);
    p_por := ARRAY['aprovado_chefia_por', 'aprovado_rh_por'];
    p_em := ARRAY['aprovado_chefia_em', 'aprovado_rh_em'];
    p_forca := ARRAY[mudou_status AND (st_depois = 'aprovado_chefia' OR (st_depois = 'aprovado' AND pela_chefia)),
                     mudou_status AND st_depois = 'aprovado' AND NOT pela_chefia];
    p_ativo := ARRAY[st_depois IN ('aprovado_chefia', 'aprovado'), st_depois = 'aprovado'];
    -- (aprovado_rh: linhas legadas mantêm o que tinham)
    p_hist := ARRAY[st_depois IN ('rejeitado', 'cancelado', 'aprovado_rh'), st_depois IN ('rejeitado', 'cancelado', 'aprovado_rh')];

  ELSIF TG_TABLE_NAME = 'frequencia_fechamento' THEN
    IF TG_OP = 'UPDATE'
       AND ((n ->> 'servidor_id') IS DISTINCT FROM (o ->> 'servidor_id')
            OR (n ->> 'ano') IS DISTINCT FROM (o ->> 'ano')
            OR (n ->> 'mes') IS DISTINCT FROM (o ->> 'mes')) THEN
      RAISE EXCEPTION 'Fechamento da frequência: servidor, ano e mês não mudam depois de criados (só o papel admin corrige)'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NOT v_rh AND coalesce((o ->> 'consolidado_rh')::boolean, false)
       AND (n - 'updated_at') IS DISTINCT FROM (o - 'updated_at') THEN
      RAISE EXCEPTION 'Etapa do RH: alterar uma frequência já consolidada exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    IF (coalesce((n ->> 'assinado_servidor')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'assinado_servidor')::boolean, false)
        OR (n ->> 'assinado_servidor_em') IS DISTINCT FROM (o ->> 'assinado_servidor_em'))
       AND (n ->> 'servidor_id')::uuid IS DISTINCT FROM public.meu_servidor_id() THEN
      RAISE EXCEPTION 'Assinatura do servidor: só o próprio servidor assina (ou desfaz a assinatura de) a sua frequência'
        USING ERRCODE = '42501';
    END IF;
    IF coalesce((n ->> 'validado_chefia')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'validado_chefia')::boolean, false)
       OR (n ->> 'validado_chefia_por') IS DISTINCT FROM (o ->> 'validado_chefia_por')
       OR (n ->> 'validado_chefia_em') IS DISTINCT FROM (o ->> 'validado_chefia_em') THEN
      IF coalesce((n ->> 'validado_chefia')::boolean, false) THEN
        IF NOT v_chefia THEN
          RAISE EXCEPTION 'Etapa da chefia: validar a frequência exige a permissão rh.aprovar' USING ERRCODE = '42501';
        END IF;
      ELSIF NOT v_rh THEN
        RAISE EXCEPTION 'Etapa do RH: desfazer a validação da chefia (reabertura) exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
      END IF;
    END IF;
    IF (coalesce((n ->> 'consolidado_rh')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'consolidado_rh')::boolean, false)
        OR (n ->> 'consolidado_rh_por') IS DISTINCT FROM (o ->> 'consolidado_rh_por')
        OR (n ->> 'consolidado_rh_em') IS DISTINCT FROM (o ->> 'consolidado_rh_em')
        OR coalesce((n ->> 'reaberto')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'reaberto')::boolean, false)
        OR (n ->> 'reaberto_por') IS DISTINCT FROM (o ->> 'reaberto_por')
        OR (n ->> 'reaberto_em') IS DISTINCT FROM (o ->> 'reaberto_em')
        OR (n ->> 'justificativa_reabertura') IS DISTINCT FROM (o ->> 'justificativa_reabertura'))
       AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: consolidar ou reabrir a frequência exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    -- a flag que vira true grava o seu par; enquanto ela vale, o par não é apagado
    FOREACH col IN ARRAY ARRAY['validado_chefia', 'consolidado_rh', 'reaberto'] LOOP
      p_por := p_por || (col || '_por');
      p_em := p_em || (col || '_em');
      p_forca := p_forca || (coalesce((n ->> col)::boolean, false) AND NOT coalesce((o ->> col)::boolean, false));
      p_ativo := p_ativo || coalesce((n ->> col)::boolean, false);
      -- a reabertura que já aconteceu continua registrada depois da reconsolidação (reaberto volta a false)
      p_hist := p_hist || (col = 'reaberto');
    END LOOP;

  ELSE
    -- justificativas_ponto e solicitacoes_ajuste_ponto: uma etapa só (chefia ou RH decidem; status_solicitacao)
    IF n ->> 'status' IS NULL THEN
      RAISE EXCEPTION 'Pedido de ponto: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- sem RH, o pedido nasce na etapa inicial: status pendente (decidido é recusado) e campos de decisão nulos
    IF TG_OP = 'INSERT' AND NOT v_rh THEN
      IF st_depois <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: só quem tem rh.frequencia.lancar registra o pedido já decidido (status %); a chefia decide depois, sobre o pendente', st_depois
          USING ERRCODE = '42501';
      END IF;
      ov := ov || jsonb_build_object('observacao_aprovador', NULL);
    END IF;
    dados := CASE TG_TABLE_NAME
      WHEN 'justificativas_ponto' THEN ARRAY['registro_ponto_id', 'tipo', 'descricao', 'arquivo_url']
      ELSE ARRAY['servidor_id', 'registro_ponto_id', 'data_ocorrido', 'tipo_ajuste', 'campo_ajuste', 'horario_atual',
                 'horario_correto', 'motivo', 'comprovante_url'] END;
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      FOREACH col IN ARRAY dados LOOP
        IF (n ->> col) IS DISTINCT FROM (o ->> col) THEN
          RAISE EXCEPTION 'Etapa do RH: alterar o texto do pedido (%) exige a permissão rh.frequencia.lancar (a chefia decide, não edita)', col
            USING ERRCODE = '42501';
        END IF;
      END LOOP;
      IF ((n ->> 'observacao_aprovador') IS DISTINCT FROM (o ->> 'observacao_aprovador')
          OR (n ->> 'aprovador_id') IS DISTINCT FROM (o ->> 'aprovador_id')
          OR (n ->> 'data_aprovacao') IS DISTINCT FROM (o ->> 'data_aprovacao'))
         AND NOT (st_antes = 'pendente' AND mudou_status) THEN
        RAISE EXCEPTION 'Etapa do RH: a decisão só é registrada junto com a mudança de status de um pedido pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;
    IF mudou_status AND NOT v_rh THEN
      IF NOT v_chefia OR st_antes <> 'pendente' OR st_depois NOT IN ('aprovada', 'rejeitada') THEN
        RAISE EXCEPTION 'Etapa do RH: mudar o status do pedido de % para % exige a permissão rh.frequencia.lancar (a chefia só aprova ou rejeita o pendente)', st_antes, st_depois
          USING ERRCODE = '42501';
      END IF;
    END IF;
    p_por := ARRAY['aprovador_id'];
    p_em := ARRAY['data_aprovacao'];
    p_forca := ARRAY[mudou_status AND st_depois IN ('aprovada', 'rejeitada')];
    p_ativo := ARRAY[st_depois IN ('aprovada', 'rejeitada')];
    p_hist := ARRAY[st_depois = 'cancelada'];
  END IF;

  -- autoria: o par da etapa que acontece neste comando é de quem age, agora. Enquanto a etapa vale, o par não é
  -- apagado (nem em parte) e, se mudar para um valor não nulo, também é de quem age, agora. Fora da etapa ativa, o
  -- par fica como estava (p_hist: a etapa aconteceu e o pedido terminou depois) ou vai a NULL.
  FOR i IN 1 .. coalesce(array_length(p_por, 1), 0) LOOP
    IF p_forca[i] THEN
      ov := ov || jsonb_build_object(p_por[i], v_uid, p_em[i], now());
    ELSIF p_ativo[i] THEN
      IF ((o ->> p_por[i]) IS NOT NULL AND (n ->> p_por[i]) IS NULL)
         OR ((o ->> p_em[i]) IS NOT NULL AND (n ->> p_em[i]) IS NULL) THEN
        RAISE EXCEPTION 'Autoria: o registro da etapa (%, %) não é apagado enquanto ela vale', p_por[i], p_em[i]
          USING ERRCODE = '42501';
      ELSIF ((n ->> p_por[i]) IS DISTINCT FROM (o ->> p_por[i]) OR (n ->> p_em[i]) IS DISTINCT FROM (o ->> p_em[i]))
            AND ((n ->> p_por[i]) IS NOT NULL OR (n ->> p_em[i]) IS NOT NULL) THEN
        ov := ov || jsonb_build_object(p_por[i], v_uid, p_em[i], now());
      END IF;
    ELSIF p_hist[i] THEN
      ov := ov || jsonb_build_object(p_por[i], o -> p_por[i], p_em[i], o -> p_em[i]);
    ELSE
      ov := ov || jsonb_build_object(p_por[i], NULL, p_em[i], NULL);
    END IF;
  END LOOP;
  IF ov <> '{}'::jsonb THEN
    NEW := jsonb_populate_record(NEW, n || ov);
  END IF;
  RETURN NEW;
END;
$$;

-- função de trigger: ninguém a chama diretamente (padrão do overlay/40)
REVOKE EXECUTE ON FUNCTION public.validar_etapa_frequencia() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_validar_etapa_frequencia ON public.solicitacoes_abono;
CREATE TRIGGER trg_validar_etapa_frequencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.solicitacoes_abono
  FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();

DROP TRIGGER IF EXISTS trg_validar_etapa_frequencia ON public.frequencia_fechamento;
CREATE TRIGGER trg_validar_etapa_frequencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.frequencia_fechamento
  FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();

DROP TRIGGER IF EXISTS trg_validar_etapa_frequencia ON public.justificativas_ponto;
CREATE TRIGGER trg_validar_etapa_frequencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.justificativas_ponto
  FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();

DROP TRIGGER IF EXISTS trg_validar_etapa_frequencia ON public.solicitacoes_ajuste_ponto;
CREATE TRIGGER trg_validar_etapa_frequencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.solicitacoes_ajuste_ponto
  FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();

-- ----------------------------------------------------------------------------
-- 3. servidores.cpf só pelo papel admin (C)
-- ----------------------------------------------------------------------------
-- eh_meu_servidor casa o aprovador sem vínculo com a ficha pelo CPF: quem pudesse trocar o CPF de uma ficha (a de
-- outro servidor, para casar com o próprio perfil, ou vice-versa) mudaria o que é "seu". Compara só os dígitos
-- completados a 11 (a mesma regra de eh_meu_servidor): gravar o mesmo CPF com ou sem pontuação, como faz o
-- formulário da ficha, continua livre. Só para quem age como anon/authenticated (GUC role); o papel admin passa.
CREATE OR REPLACE FUNCTION public.servidores_proteger_cpf()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND NOT public.is_admin_user(auth.uid())
     AND lpad(regexp_replace(coalesce(NEW.cpf, ''), '[^0-9]', '', 'g'), 11, '0')
         IS DISTINCT FROM lpad(regexp_replace(coalesce(OLD.cpf, ''), '[^0-9]', '', 'g'), 11, '0') THEN
    RAISE EXCEPTION 'Ficha do servidor: o CPF só é alterado pelo papel admin (ele identifica o servidor nas aprovações)'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
-- função de trigger: ninguém a chama diretamente (padrão do overlay/40)
REVOKE EXECUTE ON FUNCTION public.servidores_proteger_cpf() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_servidores_proteger_cpf ON public.servidores;
CREATE TRIGGER trg_servidores_proteger_cpf
  BEFORE UPDATE OF cpf ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.servidores_proteger_cpf();
