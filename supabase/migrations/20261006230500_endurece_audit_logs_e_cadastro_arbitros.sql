-- Endurece a trilha de auditoria, a leitura anônima de dados de árbitros e a listagem de tabelas.
--
-- S3 — Trilha de auditoria (audit_logs). Estado final das migrações anteriores:
--      20260220132907 apagou TODAS as policies de public e 20260220211817 recriou as de
--      audit_logs como admin_only_select/insert/update/delete (is_admin_user). Resultado:
--        (a) administrador podia inserir, ALTERAR e APAGAR linhas da trilha (a migração
--            20260131033148 queria a trilha imutável);
--        (b) log_audit (SECURITY DEFINER) estava com EXECUTE para PUBLIC: qualquer visitante
--            anônimo gravava linhas na trilha, com user_id nulo.
--      Passa a ser trilha só de acréscimo: ninguém insere direto, altera ou apaga. Grava-se
--      por log_audit (somente usuário autenticado), pelos triggers SECURITY DEFINER
--      (fn_audit_trigger, fn_audit_parametros, audit_permission_changes, fechar_folha,
--      reabrir_folha) e pela service role. Limite: usuário autenticado ainda registra
--      entradas pela RPC log_audit (user_id é sempre auth.uid(), mas o conteúdo é informado
--      pelo cliente).
--
-- S4 — cadastro_arbitros (CPF, RG, e-mail, dados bancários) e cadastro_arbitros_modalidades
--      (documentos_urls) eram legíveis por `anon` (USING (true)); o bucket arbitros-docs
--      permitia LISTAR todos os arquivos (SELECT anon em storage.objects). O formulário
--      público só precisa INSERIR; a checagem de CPF duplicado e a recuperação do protocolo
--      passam a usar as RPCs abaixo, que não devolvem dado pessoal.
--      NÃO coberto: o bucket continua público (quem tem a URL de um arquivo ainda o baixa).
--      Fechá-lo exige bucket privado + URL assinada no front (pendência).
--
-- S2 (complemento) — list_public_tables() é SECURITY DEFINER sem REVOKE FROM PUBLIC: qualquer
--      anônimo listava nomes de tabelas e contagem de linhas pelo PostgREST, contornando o
--      fechamento do list-tables da Edge Function. Só a service role a chama.
--
-- ORDEM DE DEPLOY: publicar o front ANTES de aplicar esta migração e esperar o service worker
-- do PWA atualizar. O bundle antigo faz INSERT ... RETURNING anônimo em cadastro_arbitros e
-- INSERT direto em audit_logs; ambos passam a falhar por RLS/privilégio assim que a migração
-- for aplicada (cadastros de árbitros deixam de ser aceitos e o log de acesso ao contracheque
-- perde registros sem erro visível).
--
-- Não aplicar em projeto remoto sem pedido explícito (AGENTS.md, invariante 8).

-- ============================================
-- 1) audit_logs: trilha só de acréscimo
-- ============================================
-- Policies de escrita: legadas (20260107, 20260131; já apagadas em 20260220, mas o DROP é
-- inofensivo) e as vigentes admin_only_* (20260220211817). admin_only_select permanece.
DROP POLICY IF EXISTS "insert_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "admin_only_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "admin_only_update" ON public.audit_logs;
DROP POLICY IF EXISTS "admin_only_delete" ON public.audit_logs;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- audit_logs tem FORCE ROW LEVEL SECURITY: as funções SECURITY DEFINER gravam como dono
-- da tabela. Se o papel dono não tiver BYPASSRLS (ou for membro de `authenticated`), elas
-- perderiam o INSERT ao remover as policies acima — e a auditoria pararia sem erro visível.
-- Esta policy garante a gravação sem depender dessa propriedade do papel.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    DROP POLICY IF EXISTS "audit_logs_insert_owner" ON public.audit_logs;
    CREATE POLICY "audit_logs_insert_owner" ON public.audit_logs
      FOR INSERT TO postgres
      WITH CHECK (true);
  END IF;
END $$;

-- log_audit: só usuário autenticado e service role. Nenhum fluxo do front a chama sem login.
-- Percorre todas as sobrecargas existentes em vez de fixar uma assinatura.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_audit'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.assinatura);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.assinatura);
  END LOOP;
END $$;

-- ============================================
-- 2) cadastro_arbitros e modalidades: sem leitura anônima
-- ============================================
-- Usuários autenticados continuam lendo por "authenticated_read_arbitros" (20260306224152).
DROP POLICY IF EXISTS "Consulta pública por protocolo" ON public.cadastro_arbitros;

DROP POLICY IF EXISTS "Público pode ler próprias modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "arbitros_modalidades_select_authenticated" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "arbitros_modalidades_select_authenticated"
ON public.cadastro_arbitros_modalidades
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.cadastro_arbitros FROM anon;
REVOKE SELECT ON public.cadastro_arbitros_modalidades FROM anon;

-- Checagem de CPF duplicado no formulário público: devolve só se existe (antes o front lia
-- nome e protocolo do registro encontrado).
CREATE OR REPLACE FUNCTION public.arbitro_cpf_cadastrado(p_cpf text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) = 11
     AND EXISTS (
       SELECT 1
       FROM public.cadastro_arbitros
       WHERE regexp_replace(coalesce(cpf, ''), '\D', '', 'g')
           = regexp_replace(p_cpf, '\D', '', 'g')
     );
$$;

-- Protocolo do cadastro recém-enviado. O id é um UUID gerado no navegador de quem enviou
-- (não enumerável); a função devolve só o protocolo, nenhum dado pessoal.
CREATE OR REPLACE FUNCTION public.obter_protocolo_arbitro(p_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT protocolo FROM public.cadastro_arbitros WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.arbitro_cpf_cadastrado(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obter_protocolo_arbitro(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arbitro_cpf_cadastrado(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_protocolo_arbitro(uuid) TO anon, authenticated;

-- ============================================
-- 3) bucket arbitros-docs: sem listagem anônima
-- ============================================
-- O front só usa upload (policy de INSERT, mantida) e getPublicUrl, que funciona em bucket
-- público sem policy de SELECT. A listagem deixa de ser possível para anônimo.
DROP POLICY IF EXISTS "Leitura pública de documentos de árbitros" ON storage.objects;
DROP POLICY IF EXISTS "arbitros_docs_select_authenticated" ON storage.objects;
CREATE POLICY "arbitros_docs_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'arbitros-docs');

-- ============================================
-- 4) list_public_tables(): só service role
-- ============================================
REVOKE ALL ON FUNCTION public.list_public_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;
