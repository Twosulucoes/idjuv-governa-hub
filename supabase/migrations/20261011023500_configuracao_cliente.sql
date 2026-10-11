-- ============================================================================
-- Configuração do cliente — identidade da instituição e nome do sistema no banco
-- ============================================================================
-- Decisão: docs/CONFIGURACAO_CLIENTE.md. O sistema é um produto vendido a várias instituições; nome do
-- sistema, nome oficial, sigla, CNPJ, base legal, dirigente, endereço e contato saem do código e passam a
-- ser editados na tela /admin/configuracao-cliente, gravados em public.dados_oficiais (key-value auditável
-- que já existia, sem chave nova de schema). O front aplica esses valores por cima do perfil de instalação
-- (tenants/<slug>) no carregamento, inclusive no portal e na tela de login, que não têm sessão.
--
-- 1. dados_oficiais passa da classe catalogo_admin para publico_admin (supabase/baseline/rls/mapa.csv; bloco
--    copiado de supabase/baseline/rls/35_policies_geradas.sql): anon e logados leem; só o papel admin escreve
--    (como antes). A tabela só guarda dado institucional público (CNPJ, endereço, nome do dirigente, leis).
-- 2. anon lê só as colunas chave, valor e categoria (privilégio por coluna, igual ao overlay 40): o mesmo que a
--    RPC obter_dado_oficial(text), com EXECUTE para anon, já entregava. motivo_alteracao, ultima_alteracao_por,
--    descricao, lei_referencia e documento_url continuam só para logados.
-- 3. Endereços (site, diario_oficial_url, portal_transparencia_url) só com http(s): o valor vira link no portal
--    público, e javascript: seria XSS gravado. CHECK NOT VALID: vale para toda gravação nova sem recusar a
--    migração se já houver linha antiga fora do padrão.
-- 4. Autoria e trilha: ultima_alteracao_por/em também no INSERT (antes só no UPDATE) e trilha em audit_logs
--    (módulo admin) para inclusão, alteração e exclusão, no padrão de audit_config_institucional.
-- 5. Permissão admin.configuracao_cliente (ver a tela) no catálogo. Gravar continua exigindo o papel admin pela RLS.
--
-- Idempotente (DROP/CREATE POLICY e TRIGGER, REVOKE/GRANT, ON CONFLICT DO NOTHING, constraint condicional) e
-- válida nos dois estados do banco (baseline e só migrações). Não grava nenhum valor: os dados entram pela tela.
-- ============================================================================

-- ---- 1. RLS ----
ALTER TABLE public.dados_oficiais ENABLE ROW LEVEL SECURITY;

-- policies antigas (20260127011752), caso alguma tenha sobrado
DROP POLICY IF EXISTS "Dados oficiais são públicos para leitura" ON public.dados_oficiais;
DROP POLICY IF EXISTS "Apenas super_admin pode inserir dados oficiais" ON public.dados_oficiais;
DROP POLICY IF EXISTS "Apenas super_admin pode atualizar dados oficiais" ON public.dados_oficiais;

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

-- ---- 2. Privilégio anônimo (só leitura, só colunas públicas) ----
REVOKE ALL ON public.dados_oficiais FROM anon;
GRANT SELECT (chave, valor, categoria) ON public.dados_oficiais TO anon;

-- ---- 3. Endereços só http(s) ----
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dados_oficiais_url_http'
                   AND conrelid = 'public.dados_oficiais'::regclass) THEN
    ALTER TABLE public.dados_oficiais ADD CONSTRAINT dados_oficiais_url_http
      CHECK (chave NOT IN ('site', 'diario_oficial_url', 'portal_transparencia_url') OR valor ~* '^https?://')
      NOT VALID;
  END IF;
END $$;

-- ---- 4. Autoria e trilha ----
DROP TRIGGER IF EXISTS trigger_dados_oficiais_updated_at ON public.dados_oficiais;
CREATE TRIGGER trigger_dados_oficiais_updated_at
  BEFORE INSERT OR UPDATE ON public.dados_oficiais
  FOR EACH ROW EXECUTE FUNCTION public.update_dados_oficiais_updated_at();

DROP TRIGGER IF EXISTS audit_dados_oficiais ON public.dados_oficiais;
CREATE TRIGGER audit_dados_oficiais
  AFTER INSERT OR UPDATE OR DELETE ON public.dados_oficiais
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('admin');

-- ---- 5. Permissão da tela ----
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('admin', 'admin.configuracao_cliente', 'Visualizar Configuração do Cliente', 'Configuração do Cliente', 'consultar', 514)
ON CONFLICT (permission_code) DO NOTHING;
