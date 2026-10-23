-- Financeiro: favorecidos (fornecedores) e lista de bancos para a remessa OBN600.
--
-- Pedido do dono do produto (2026-10-21, "sim, pode fazer tudo"): o Financeiro não tinha tela para cadastrar o
-- favorecido (CPF/CNPJ e conta, de onde a remessa OBN600 tira os dados) e a lista de bancos estava vazia, então a
-- conta pagadora não podia ser salva. O que muda:
--   1. bancos_cnab vira catálogo: qualquer usuário ativo lê (Folha e Financeiro escolhem o banco da conta); só o RH
--      altera, como antes. Antes só o módulo RH lia.
--   2. fornecedores: o módulo financeiro passa a ler, cadastrar e editar (sufixo coletor=financeiro:select|insert|update
--      de rls/mapa.csv); apagar continua só com Compras/Contratos. Compras e Contratos sem mudança.
--   3. bancos_cnab recebe os bancos mais usados (código FEBRABAN). Só insere o código que falta: não mexe em banco já
--      cadastrado (nem no Banco do Brasil inserido à mão).
--
-- As policies abaixo são o bloco de supabase/baseline/rls/35_policies_geradas.sql (gerado de rls/mapa.csv) das duas
-- tabelas, copiado sem mudança. Idempotente: DROP/CREATE das policies e INSERT ... ON CONFLICT DO NOTHING.

SET lock_timeout = '10s';

-- ====================================================================================================
-- 1 e 2. Policies (bloco gerado)
-- ====================================================================================================

-- bancos_cnab  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.bancos_cnab;
CREATE POLICY "rls_select" ON public.bancos_cnab FOR SELECT TO authenticated
  USING (public.is_active_user());
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

-- fornecedores  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_select" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_update" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_write" ON public.fornecedores;
DROP POLICY IF EXISTS "rls_select" ON public.fornecedores;
CREATE POLICY "rls_select" ON public.fornecedores FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) OR public.can_access_module(auth.uid(), 'financeiro'));
DROP POLICY IF EXISTS "rls_insert" ON public.fornecedores;
CREATE POLICY "rls_insert" ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) OR public.can_access_module(auth.uid(), 'financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.fornecedores;
CREATE POLICY "rls_update" ON public.fornecedores FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) OR public.can_access_module(auth.uid(), 'financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) OR public.can_access_module(auth.uid(), 'financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.fornecedores;
CREATE POLICY "rls_delete" ON public.fornecedores FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- ====================================================================================================
-- 3. Bancos mais usados (código FEBRABAN). O CNAB 240 da folha só existe para o Banco do Brasil.
-- ====================================================================================================

INSERT INTO public.bancos_cnab (codigo_banco, nome, nome_reduzido, layout_cnab240, layout_cnab400, ativo)
VALUES
  ('001', 'Banco do Brasil S.A.', 'BANCO DO BRASIL', true, false, true),
  ('003', 'Banco da Amazônia S.A.', 'BANCO DA AMAZONIA', false, false, true),
  ('004', 'Banco do Nordeste do Brasil S.A.', 'BANCO DO NORDESTE', false, false, true),
  ('033', 'Banco Santander (Brasil) S.A.', 'SANTANDER', false, false, true),
  ('041', 'Banco do Estado do Rio Grande do Sul S.A.', 'BANRISUL', false, false, true),
  ('070', 'BRB - Banco de Brasília S.A.', 'BRB', false, false, true),
  ('077', 'Banco Inter S.A.', 'INTER', false, false, true),
  ('104', 'Caixa Econômica Federal', 'CAIXA', false, false, true),
  ('212', 'Banco Original S.A.', 'ORIGINAL', false, false, true),
  ('237', 'Banco Bradesco S.A.', 'BRADESCO', false, false, true),
  ('260', 'Nu Pagamentos S.A. (Nubank)', 'NUBANK', false, false, true),
  ('290', 'PagSeguro Internet IP S.A.', 'PAGSEGURO', false, false, true),
  ('323', 'Mercado Pago IP Ltda.', 'MERCADO PAGO', false, false, true),
  ('336', 'Banco C6 S.A.', 'C6 BANK', false, false, true),
  ('341', 'Itaú Unibanco S.A.', 'ITAU', false, false, true),
  ('380', 'PicPay Instituição de Pagamento S.A.', 'PICPAY', false, false, true),
  ('422', 'Banco Safra S.A.', 'SAFRA', false, false, true),
  ('748', 'Banco Cooperativo Sicredi S.A.', 'SICREDI', false, false, true),
  ('756', 'Banco Cooperativo do Brasil S.A. (Sicoob)', 'SICOOB', false, false, true)
ON CONFLICT (codigo_banco) DO NOTHING;
