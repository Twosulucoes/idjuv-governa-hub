-- Endurece a trilha de auditoria e a leitura anônima de dados de árbitros.
--
-- S3 — audit_logs aceitava INSERT de qualquer usuário autenticado. Havia DUAS policies
--      "FOR INSERT TO authenticated WITH CHECK (true)": "insert_audit_logs"
--      (20260107111532) e "audit_logs_insert" (20260131033148, que não derrubava a
--      anterior). Qualquer usuário podia forjar entradas da trilha. Passa a gravar só por
--      funções SECURITY DEFINER (log_audit, fn_audit_trigger, fn_audit_parametros,
--      audit_permission_changes, fechar_folha, reabrir_folha) e pela service role.
--
-- S4 — cadastro_arbitros (CPF, RG, e-mail, dados bancários) e cadastro_arbitros_modalidades
--      (documentos_urls) eram legíveis por `anon` (USING (true)). O formulário público só
--      precisa INSERIR; a checagem de CPF duplicado e a recuperação do protocolo passam a
--      usar as RPCs abaixo, que não devolvem dado pessoal.
--
-- Não aplicar em projeto remoto sem pedido explícito (AGENTS.md, invariante 8).

-- ============================================
-- 1) audit_logs: sem INSERT direto por anon/authenticated
-- ============================================
DROP POLICY IF EXISTS "insert_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

REVOKE INSERT ON public.audit_logs FROM anon, authenticated;

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
