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
--    (como antes). A leitura anônima não abre nada novo: a RPC obter_dado_oficial(text), com EXECUTE para anon
--    (overlay/40_privilegios.sql), já devolvia qualquer chave a quem não tem sessão. A tabela só guarda dado
--    institucional público (CNPJ, endereço, nome do dirigente, leis); dado pessoal não entra nela.
-- 2. GRANT SELECT para anon (igual ao overlay 40).
-- 3. Permissão admin.configuracao_cliente (ver a tela) no catálogo. Gravar continua exigindo o papel admin pela RLS.
--
-- Idempotente (DROP/CREATE POLICY, GRANT, ON CONFLICT DO NOTHING) e válida nos dois estados do banco
-- (baseline e só migrações). Não grava nenhum valor: os dados entram pela tela.
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

-- ---- 2. Privilégio anônimo (só leitura) ----
GRANT SELECT ON public.dados_oficiais TO anon;

-- ---- 3. Permissão da tela ----
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('admin', 'admin.configuracao_cliente', 'Visualizar Configuração do Cliente', 'Configuração do Cliente', 'consultar', 514)
ON CONFLICT (permission_code) DO NOTHING;
