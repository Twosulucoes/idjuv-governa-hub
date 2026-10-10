-- ============================================================================
-- Onda 1 — fim das policies acesso_total_* no banco montado pelas migrações
-- ============================================================================
-- A migração 20260220132907 criou, em TODAS as tabelas de public, as policies acesso_total_select|
-- insert|update|delete (`TO authenticated USING (true)`). Policies permissivas se somam por OR, então
-- qualquer usuário logado lia, gravava e apagava folha, fichas financeiras, dados bancários, licenças
-- médicas (CID), processos sigilosos, trilhas de auditoria etc., independentemente de módulo.
-- Depois disso só alguns grupos foram refeitos por módulo (20260220211817, 20261010070000,
-- 20261010080000, 20261010090000, 20261010100000, 20261010170000). No replay das 259 migrações
-- sobravam 169 tabelas com acesso_total_*. Ficam de fora frequencia_pacotes e frequencia_arquivos,
-- que a migração 20261010110000_onda_b_rh_storage.sql (Onda B3, RH) fecha por permissão.
--
-- Para cada uma delas esta migração apaga as acesso_total_* e aplica o bloco da mesma tabela de
-- supabase/baseline/rls/35_policies_geradas.sql (gerado de rls/mapa.csv; cópia literal, incluindo os
-- DROP das policies antigas que o mapa manda remover). Classes envolvidas (tabelas): {'admin': 4, 'catalogo': 5, 'catalogo_admin': 2, 'modulo': 140, 'proprio': 1, 'proprio_leitura': 5, 'publico_admin': 1, 'trilha': 8}.
--   modulo           quem tem o módulo (ou o papel admin) lê e escreve;
--   trilha           o módulo lê; ninguém escreve por API (os triggers que gravam são SECURITY DEFINER);
--   proprio*         o módulo, e o próprio servidor (meu_servidor_id()) lê o que é seu;
--   catalogo         qualquer usuário ativo lê; o módulo escreve;
--   catalogo_admin   qualquer usuário ativo lê; só o papel admin escreve;
--   admin            só o papel admin;
--   publico_admin    anon e logados leem; só o papel admin escreve.
-- Ajuste ao mapa nesta mesma mudança (supabase/baseline/rls/mapa.csv, coluna modulos): 24 tabelas usadas
-- por telas de outro módulo ganharam esse módulo, para a tela não ficar vazia. Ex.: documentos (portarias)
-- também para gabinete, governanca e admin; federações também para organizacoes (o módulo federacoes não
-- existe na tela de usuários); reuniões também para admin; contas_autarquia também para rh (remessa da
-- folha); instituicoes, calendario_federacao, composicao_cargos, riscos/controles (integridade) etc.
-- _backup_usuario_modulos_old (tabela morta, fora do mapa) fica sem policy: RLS ligado = fechada.
--
-- Leitura anônima não muda: acesso_total_* era só TO authenticated, e as policies públicas que
-- ficam (config_paginas_publicas, publicacoes_lai publicadas, INSERT do cadastro de federações)
-- são as do baseline. Num banco montado pelo baseline esta migração é no-op (mesmas policies).
-- Idempotente; não toca dado.
-- ============================================================================

-- ---- _backup_usuario_modulos_old (só existe no banco das migrações; o baseline a remove)
DO $$
BEGIN
  IF to_regclass('public._backup_usuario_modulos_old') IS NOT NULL THEN
    DROP POLICY IF EXISTS "acesso_total_select" ON public._backup_usuario_modulos_old;
    DROP POLICY IF EXISTS "acesso_total_insert" ON public._backup_usuario_modulos_old;
    DROP POLICY IF EXISTS "acesso_total_update" ON public._backup_usuario_modulos_old;
    DROP POLICY IF EXISTS "acesso_total_delete" ON public._backup_usuario_modulos_old;
    ALTER TABLE public._backup_usuario_modulos_old ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ---- acesso_processo_sigiloso
DROP POLICY IF EXISTS "acesso_total_select" ON public.acesso_processo_sigiloso;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.acesso_processo_sigiloso;
DROP POLICY IF EXISTS "acesso_total_update" ON public.acesso_processo_sigiloso;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.acesso_processo_sigiloso;
ALTER TABLE public.acesso_processo_sigiloso ENABLE ROW LEVEL SECURITY;
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

-- ---- acoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.acoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.acoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.acoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.acoes;
ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;
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

-- ---- agrupamento_unidade_vinculo
DROP POLICY IF EXISTS "acesso_total_select" ON public.agrupamento_unidade_vinculo;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.agrupamento_unidade_vinculo;
DROP POLICY IF EXISTS "acesso_total_update" ON public.agrupamento_unidade_vinculo;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.agrupamento_unidade_vinculo;
ALTER TABLE public.agrupamento_unidade_vinculo ENABLE ROW LEVEL SECURITY;
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

-- ---- approval_delegations
DROP POLICY IF EXISTS "acesso_total_select" ON public.approval_delegations;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.approval_delegations;
DROP POLICY IF EXISTS "acesso_total_update" ON public.approval_delegations;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.approval_delegations;
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;
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

-- ---- approval_requests
DROP POLICY IF EXISTS "acesso_total_select" ON public.approval_requests;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.approval_requests;
DROP POLICY IF EXISTS "acesso_total_update" ON public.approval_requests;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.approval_requests;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
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

-- ---- audit_log_licitacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.audit_log_licitacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.audit_log_licitacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.audit_log_licitacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.audit_log_licitacoes;
ALTER TABLE public.audit_log_licitacoes ENABLE ROW LEVEL SECURITY;
-- audit_log_licitacoes  [trilha: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.audit_log_licitacoes;
CREATE POLICY "rls_select" ON public.audit_log_licitacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- ---- avaliacoes_controle
DROP POLICY IF EXISTS "acesso_total_select" ON public.avaliacoes_controle;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.avaliacoes_controle;
DROP POLICY IF EXISTS "acesso_total_update" ON public.avaliacoes_controle;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.avaliacoes_controle;
ALTER TABLE public.avaliacoes_controle ENABLE ROW LEVEL SECURITY;
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

-- ---- avaliacoes_risco
DROP POLICY IF EXISTS "acesso_total_select" ON public.avaliacoes_risco;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.avaliacoes_risco;
DROP POLICY IF EXISTS "acesso_total_update" ON public.avaliacoes_risco;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.avaliacoes_risco;
ALTER TABLE public.avaliacoes_risco ENABLE ROW LEVEL SECURITY;
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

-- ---- bancos_cnab
DROP POLICY IF EXISTS "acesso_total_select" ON public.bancos_cnab;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.bancos_cnab;
DROP POLICY IF EXISTS "acesso_total_update" ON public.bancos_cnab;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.bancos_cnab;
ALTER TABLE public.bancos_cnab ENABLE ROW LEVEL SECURITY;
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

-- ---- calendario_federacao
DROP POLICY IF EXISTS "acesso_total_select" ON public.calendario_federacao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.calendario_federacao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.calendario_federacao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.calendario_federacao;
ALTER TABLE public.calendario_federacao ENABLE ROW LEVEL SECURITY;
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

-- ---- campanhas_inventario
DROP POLICY IF EXISTS "acesso_total_select" ON public.campanhas_inventario;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.campanhas_inventario;
DROP POLICY IF EXISTS "acesso_total_update" ON public.campanhas_inventario;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.campanhas_inventario;
ALTER TABLE public.campanhas_inventario ENABLE ROW LEVEL SECURITY;
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

-- ---- cargo_unidade_compatibilidade
DROP POLICY IF EXISTS "acesso_total_select" ON public.cargo_unidade_compatibilidade;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cargo_unidade_compatibilidade;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cargo_unidade_compatibilidade;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cargo_unidade_compatibilidade;
ALTER TABLE public.cargo_unidade_compatibilidade ENABLE ROW LEVEL SECURITY;
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

-- ---- categorias_material
DROP POLICY IF EXISTS "acesso_total_select" ON public.categorias_material;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.categorias_material;
DROP POLICY IF EXISTS "acesso_total_update" ON public.categorias_material;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.categorias_material;
ALTER TABLE public.categorias_material ENABLE ROW LEVEL SECURITY;
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

-- ---- categorias_noticias_eventos
DROP POLICY IF EXISTS "acesso_total_select" ON public.categorias_noticias_eventos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.categorias_noticias_eventos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.categorias_noticias_eventos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.categorias_noticias_eventos;
ALTER TABLE public.categorias_noticias_eventos ENABLE ROW LEVEL SECURITY;
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

-- ---- centros_custo
DROP POLICY IF EXISTS "acesso_total_select" ON public.centros_custo;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.centros_custo;
DROP POLICY IF EXISTS "acesso_total_update" ON public.centros_custo;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.centros_custo;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
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

-- ---- cessoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.cessoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cessoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cessoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cessoes;
ALTER TABLE public.cessoes ENABLE ROW LEVEL SECURITY;
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

-- ---- checklists_conformidade
DROP POLICY IF EXISTS "acesso_total_select" ON public.checklists_conformidade;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.checklists_conformidade;
DROP POLICY IF EXISTS "acesso_total_update" ON public.checklists_conformidade;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.checklists_conformidade;
ALTER TABLE public.checklists_conformidade ENABLE ROW LEVEL SECURITY;
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

-- ---- cms_banners
DROP POLICY IF EXISTS "acesso_total_select" ON public.cms_banners;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cms_banners;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cms_banners;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cms_banners;
ALTER TABLE public.cms_banners ENABLE ROW LEVEL SECURITY;
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

-- ---- cms_categorias
DROP POLICY IF EXISTS "acesso_total_select" ON public.cms_categorias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cms_categorias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cms_categorias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cms_categorias;
ALTER TABLE public.cms_categorias ENABLE ROW LEVEL SECURITY;
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

-- ---- cms_conteudos
DROP POLICY IF EXISTS "acesso_total_select" ON public.cms_conteudos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cms_conteudos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cms_conteudos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cms_conteudos;
ALTER TABLE public.cms_conteudos ENABLE ROW LEVEL SECURITY;
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

-- ---- cms_galeria_fotos
DROP POLICY IF EXISTS "acesso_total_select" ON public.cms_galeria_fotos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cms_galeria_fotos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cms_galeria_fotos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cms_galeria_fotos;
ALTER TABLE public.cms_galeria_fotos ENABLE ROW LEVEL SECURITY;
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

-- ---- cms_galerias
DROP POLICY IF EXISTS "acesso_total_select" ON public.cms_galerias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cms_galerias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cms_galerias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cms_galerias;
ALTER TABLE public.cms_galerias ENABLE ROW LEVEL SECURITY;
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

-- ---- cms_media
DROP POLICY IF EXISTS "acesso_total_select" ON public.cms_media;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cms_media;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cms_media;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cms_media;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
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

-- ---- coletas_inventario
DROP POLICY IF EXISTS "acesso_total_select" ON public.coletas_inventario;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.coletas_inventario;
DROP POLICY IF EXISTS "acesso_total_update" ON public.coletas_inventario;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.coletas_inventario;
ALTER TABLE public.coletas_inventario ENABLE ROW LEVEL SECURITY;
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

-- ---- composicao_cargos
DROP POLICY IF EXISTS "acesso_total_select" ON public.composicao_cargos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.composicao_cargos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.composicao_cargos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.composicao_cargos;
ALTER TABLE public.composicao_cargos ENABLE ROW LEVEL SECURITY;
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

-- ---- conciliacoes_inventario
DROP POLICY IF EXISTS "acesso_total_select" ON public.conciliacoes_inventario;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.conciliacoes_inventario;
DROP POLICY IF EXISTS "acesso_total_update" ON public.conciliacoes_inventario;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.conciliacoes_inventario;
ALTER TABLE public.conciliacoes_inventario ENABLE ROW LEVEL SECURITY;
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

-- ---- config_agrupamento_unidades
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_agrupamento_unidades;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_agrupamento_unidades;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_agrupamento_unidades;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_agrupamento_unidades;
ALTER TABLE public.config_agrupamento_unidades ENABLE ROW LEVEL SECURITY;
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

-- ---- config_assinatura_frequencia
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_assinatura_frequencia;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_assinatura_frequencia;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_assinatura_frequencia;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_assinatura_frequencia;
ALTER TABLE public.config_assinatura_frequencia ENABLE ROW LEVEL SECURITY;
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

-- ---- config_assinatura_reuniao
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_assinatura_reuniao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_assinatura_reuniao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_assinatura_reuniao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_assinatura_reuniao;
ALTER TABLE public.config_assinatura_reuniao ENABLE ROW LEVEL SECURITY;
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

-- ---- config_autarquia
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_autarquia;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_autarquia;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_autarquia;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_autarquia;
ALTER TABLE public.config_autarquia ENABLE ROW LEVEL SECURITY;
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

-- ---- config_compensacao
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_compensacao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_compensacao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_compensacao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_compensacao;
ALTER TABLE public.config_compensacao ENABLE ROW LEVEL SECURITY;
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

-- ---- config_fechamento_folha
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_fechamento_folha;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_fechamento_folha;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_fechamento_folha;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_fechamento_folha;
ALTER TABLE public.config_fechamento_folha ENABLE ROW LEVEL SECURITY;
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

-- ---- config_incidencias
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_incidencias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_incidencias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_incidencias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_incidencias;
ALTER TABLE public.config_incidencias ENABLE ROW LEVEL SECURITY;
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

-- ---- config_institucional
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_institucional;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_institucional;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_institucional;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_institucional;
ALTER TABLE public.config_institucional ENABLE ROW LEVEL SECURITY;
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

-- ---- config_jornada_padrao
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_jornada_padrao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_jornada_padrao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_jornada_padrao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_jornada_padrao;
ALTER TABLE public.config_jornada_padrao ENABLE ROW LEVEL SECURITY;
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

-- ---- config_motivos_desligamento
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_motivos_desligamento;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_motivos_desligamento;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_motivos_desligamento;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_motivos_desligamento;
ALTER TABLE public.config_motivos_desligamento ENABLE ROW LEVEL SECURITY;
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

-- ---- config_paginas_historico
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_paginas_historico;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_paginas_historico;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_paginas_historico;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_paginas_historico;
ALTER TABLE public.config_paginas_historico ENABLE ROW LEVEL SECURITY;
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

-- ---- config_paginas_publicas
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_paginas_publicas;
ALTER TABLE public.config_paginas_publicas ENABLE ROW LEVEL SECURITY;
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

-- ---- config_parametros_meta
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_parametros_meta;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_parametros_meta;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_parametros_meta;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_parametros_meta;
ALTER TABLE public.config_parametros_meta ENABLE ROW LEVEL SECURITY;
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

-- ---- config_parametros_valores
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_parametros_valores;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_parametros_valores;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_parametros_valores;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_parametros_valores;
ALTER TABLE public.config_parametros_valores ENABLE ROW LEVEL SECURITY;
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

-- ---- config_regras_calculo
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_regras_calculo;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_regras_calculo;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_regras_calculo;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_regras_calculo;
ALTER TABLE public.config_regras_calculo ENABLE ROW LEVEL SECURITY;
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

-- ---- config_rubricas
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_rubricas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_rubricas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_rubricas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_rubricas;
ALTER TABLE public.config_rubricas ENABLE ROW LEVEL SECURITY;
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

-- ---- config_situacoes_funcionais
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_situacoes_funcionais;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_situacoes_funcionais;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_situacoes_funcionais;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_situacoes_funcionais;
ALTER TABLE public.config_situacoes_funcionais ENABLE ROW LEVEL SECURITY;
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

-- ---- config_tipos_ato
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_tipos_ato;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_tipos_ato;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_tipos_ato;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_tipos_ato;
ALTER TABLE public.config_tipos_ato ENABLE ROW LEVEL SECURITY;
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

-- ---- config_tipos_onus
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_tipos_onus;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_tipos_onus;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_tipos_onus;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_tipos_onus;
ALTER TABLE public.config_tipos_onus ENABLE ROW LEVEL SECURITY;
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

-- ---- config_tipos_rubrica
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_tipos_rubrica;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_tipos_rubrica;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_tipos_rubrica;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_tipos_rubrica;
ALTER TABLE public.config_tipos_rubrica ENABLE ROW LEVEL SECURITY;
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

-- ---- config_tipos_servidor
DROP POLICY IF EXISTS "acesso_total_select" ON public.config_tipos_servidor;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.config_tipos_servidor;
DROP POLICY IF EXISTS "acesso_total_update" ON public.config_tipos_servidor;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.config_tipos_servidor;
ALTER TABLE public.config_tipos_servidor ENABLE ROW LEVEL SECURITY;
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

-- ---- configuracao_jornada
DROP POLICY IF EXISTS "acesso_total_select" ON public.configuracao_jornada;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.configuracao_jornada;
DROP POLICY IF EXISTS "acesso_total_update" ON public.configuracao_jornada;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.configuracao_jornada;
ALTER TABLE public.configuracao_jornada ENABLE ROW LEVEL SECURITY;
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

-- ---- contas_autarquia
DROP POLICY IF EXISTS "acesso_total_select" ON public.contas_autarquia;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.contas_autarquia;
DROP POLICY IF EXISTS "acesso_total_update" ON public.contas_autarquia;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.contas_autarquia;
ALTER TABLE public.contas_autarquia ENABLE ROW LEVEL SECURITY;
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

-- ---- contatos_eventos_esportivos
DROP POLICY IF EXISTS "acesso_total_select" ON public.contatos_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.contatos_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.contatos_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.contatos_eventos_esportivos;
ALTER TABLE public.contatos_eventos_esportivos ENABLE ROW LEVEL SECURITY;
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

-- ---- conteudo_rascunho
DROP POLICY IF EXISTS "acesso_total_select" ON public.conteudo_rascunho;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.conteudo_rascunho;
DROP POLICY IF EXISTS "acesso_total_update" ON public.conteudo_rascunho;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.conteudo_rascunho;
ALTER TABLE public.conteudo_rascunho ENABLE ROW LEVEL SECURITY;
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

-- ---- controles_internos
DROP POLICY IF EXISTS "acesso_total_select" ON public.controles_internos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.controles_internos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.controles_internos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.controles_internos;
ALTER TABLE public.controles_internos ENABLE ROW LEVEL SECURITY;
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

-- ---- creditos_adicionais
DROP POLICY IF EXISTS "acesso_total_select" ON public.creditos_adicionais;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.creditos_adicionais;
DROP POLICY IF EXISTS "acesso_total_update" ON public.creditos_adicionais;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.creditos_adicionais;
ALTER TABLE public.creditos_adicionais ENABLE ROW LEVEL SECURITY;
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

-- ---- dados_oficiais
DROP POLICY IF EXISTS "acesso_total_select" ON public.dados_oficiais;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.dados_oficiais;
DROP POLICY IF EXISTS "acesso_total_update" ON public.dados_oficiais;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.dados_oficiais;
ALTER TABLE public.dados_oficiais ENABLE ROW LEVEL SECURITY;
-- dados_oficiais  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.dados_oficiais;
CREATE POLICY "rls_select" ON public.dados_oficiais FOR SELECT TO authenticated
  USING (public.is_active_user());
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

-- ---- debitos_tecnicos
DROP POLICY IF EXISTS "acesso_total_select" ON public.debitos_tecnicos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.debitos_tecnicos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.debitos_tecnicos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.debitos_tecnicos;
ALTER TABLE public.debitos_tecnicos ENABLE ROW LEVEL SECURITY;
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

-- ---- decisoes_administrativas
DROP POLICY IF EXISTS "acesso_total_select" ON public.decisoes_administrativas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.decisoes_administrativas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.decisoes_administrativas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.decisoes_administrativas;
ALTER TABLE public.decisoes_administrativas ENABLE ROW LEVEL SECURITY;
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

-- ---- demandas_ascom
DROP POLICY IF EXISTS "acesso_total_select" ON public.demandas_ascom;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.demandas_ascom;
DROP POLICY IF EXISTS "acesso_total_update" ON public.demandas_ascom;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.demandas_ascom;
ALTER TABLE public.demandas_ascom ENABLE ROW LEVEL SECURITY;
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

-- ---- demandas_ascom_anexos
DROP POLICY IF EXISTS "acesso_total_select" ON public.demandas_ascom_anexos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.demandas_ascom_anexos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.demandas_ascom_anexos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.demandas_ascom_anexos;
ALTER TABLE public.demandas_ascom_anexos ENABLE ROW LEVEL SECURITY;
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

-- ---- demandas_ascom_comentarios
DROP POLICY IF EXISTS "acesso_total_select" ON public.demandas_ascom_comentarios;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.demandas_ascom_comentarios;
DROP POLICY IF EXISTS "acesso_total_update" ON public.demandas_ascom_comentarios;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.demandas_ascom_comentarios;
ALTER TABLE public.demandas_ascom_comentarios ENABLE ROW LEVEL SECURITY;
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

-- ---- demandas_ascom_entregaveis
DROP POLICY IF EXISTS "acesso_total_select" ON public.demandas_ascom_entregaveis;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.demandas_ascom_entregaveis;
DROP POLICY IF EXISTS "acesso_total_update" ON public.demandas_ascom_entregaveis;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.demandas_ascom_entregaveis;
ALTER TABLE public.demandas_ascom_entregaveis ENABLE ROW LEVEL SECURITY;
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

-- ---- designacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.designacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.designacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.designacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.designacoes;
ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- despachos
DROP POLICY IF EXISTS "acesso_total_select" ON public.despachos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.despachos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.despachos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.despachos;
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
-- despachos  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.despachos;
CREATE POLICY "rls_select" ON public.despachos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.despachos;
CREATE POLICY "rls_insert" ON public.despachos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.despachos;
CREATE POLICY "rls_update" ON public.despachos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.despachos;
CREATE POLICY "rls_delete" ON public.despachos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- ---- dias_nao_uteis
DROP POLICY IF EXISTS "acesso_total_select" ON public.dias_nao_uteis;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.dias_nao_uteis;
DROP POLICY IF EXISTS "acesso_total_update" ON public.dias_nao_uteis;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.dias_nao_uteis;
ALTER TABLE public.dias_nao_uteis ENABLE ROW LEVEL SECURITY;
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

-- ---- documentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.documentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.documentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.documentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.documentos;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
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

-- ---- documentos_cedencia
DROP POLICY IF EXISTS "acesso_total_select" ON public.documentos_cedencia;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.documentos_cedencia;
DROP POLICY IF EXISTS "acesso_total_update" ON public.documentos_cedencia;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.documentos_cedencia;
ALTER TABLE public.documentos_cedencia ENABLE ROW LEVEL SECURITY;
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

-- ---- documentos_preparatorios_licitacao
DROP POLICY IF EXISTS "acesso_total_select" ON public.documentos_preparatorios_licitacao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.documentos_preparatorios_licitacao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.documentos_preparatorios_licitacao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.documentos_preparatorios_licitacao;
ALTER TABLE public.documentos_preparatorios_licitacao ENABLE ROW LEVEL SECURITY;
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

-- ---- documentos_processo
DROP POLICY IF EXISTS "acesso_total_select" ON public.documentos_processo;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.documentos_processo;
DROP POLICY IF EXISTS "acesso_total_update" ON public.documentos_processo;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.documentos_processo;
ALTER TABLE public.documentos_processo ENABLE ROW LEVEL SECURITY;
-- documentos_processo  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_processo;
CREATE POLICY "rls_select" ON public.documentos_processo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_processo;
CREATE POLICY "rls_insert" ON public.documentos_processo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_processo;
CREATE POLICY "rls_update" ON public.documentos_processo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_processo;
CREATE POLICY "rls_delete" ON public.documentos_processo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- ---- documentos_requerimento_servidor
DROP POLICY IF EXISTS "acesso_total_select" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "acesso_total_update" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.documentos_requerimento_servidor;
ALTER TABLE public.documentos_requerimento_servidor ENABLE ROW LEVEL SECURITY;
-- documentos_requerimento_servidor  [proprio: rh]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_select" ON public.documentos_requerimento_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_insert" ON public.documentos_requerimento_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_update" ON public.documentos_requerimento_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_delete" ON public.documentos_requerimento_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- encaminhamentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.encaminhamentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.encaminhamentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.encaminhamentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.encaminhamentos;
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;
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

-- ---- estoque
DROP POLICY IF EXISTS "acesso_total_select" ON public.estoque;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.estoque;
DROP POLICY IF EXISTS "acesso_total_update" ON public.estoque;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.estoque;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
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

-- ---- estrutura_organizacional
DROP POLICY IF EXISTS "acesso_total_select" ON public.estrutura_organizacional;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.estrutura_organizacional;
DROP POLICY IF EXISTS "acesso_total_update" ON public.estrutura_organizacional;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.estrutura_organizacional;
ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;
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

-- ---- eventos_esocial
DROP POLICY IF EXISTS "acesso_total_select" ON public.eventos_esocial;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.eventos_esocial;
DROP POLICY IF EXISTS "acesso_total_update" ON public.eventos_esocial;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.eventos_esocial;
ALTER TABLE public.eventos_esocial ENABLE ROW LEVEL SECURITY;
-- eventos_esocial  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.eventos_esocial;
CREATE POLICY "rls_select" ON public.eventos_esocial FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.eventos_esocial;
CREATE POLICY "rls_insert" ON public.eventos_esocial FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.eventos_esocial;
CREATE POLICY "rls_update" ON public.eventos_esocial FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.eventos_esocial;
CREATE POLICY "rls_delete" ON public.eventos_esocial FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- evidencias_controle
DROP POLICY IF EXISTS "acesso_total_select" ON public.evidencias_controle;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.evidencias_controle;
DROP POLICY IF EXISTS "acesso_total_update" ON public.evidencias_controle;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.evidencias_controle;
ALTER TABLE public.evidencias_controle ENABLE ROW LEVEL SECURITY;
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

-- ---- exportacoes_folha
DROP POLICY IF EXISTS "acesso_total_select" ON public.exportacoes_folha;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.exportacoes_folha;
DROP POLICY IF EXISTS "acesso_total_update" ON public.exportacoes_folha;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.exportacoes_folha;
ALTER TABLE public.exportacoes_folha ENABLE ROW LEVEL SECURITY;
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

-- ---- federacao_arbitros
DROP POLICY IF EXISTS "acesso_total_select" ON public.federacao_arbitros;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.federacao_arbitros;
DROP POLICY IF EXISTS "acesso_total_update" ON public.federacao_arbitros;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.federacao_arbitros;
ALTER TABLE public.federacao_arbitros ENABLE ROW LEVEL SECURITY;
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

-- ---- federacao_espacos_cedidos
DROP POLICY IF EXISTS "acesso_total_select" ON public.federacao_espacos_cedidos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.federacao_espacos_cedidos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.federacao_espacos_cedidos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.federacao_espacos_cedidos;
ALTER TABLE public.federacao_espacos_cedidos ENABLE ROW LEVEL SECURITY;
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

-- ---- federacao_parcerias
DROP POLICY IF EXISTS "acesso_total_select" ON public.federacao_parcerias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.federacao_parcerias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.federacao_parcerias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.federacao_parcerias;
ALTER TABLE public.federacao_parcerias ENABLE ROW LEVEL SECURITY;
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

-- ---- federacoes_esportivas
DROP POLICY IF EXISTS "acesso_total_select" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.federacoes_esportivas;
ALTER TABLE public.federacoes_esportivas ENABLE ROW LEVEL SECURITY;
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

-- ---- feriados
DROP POLICY IF EXISTS "acesso_total_select" ON public.feriados;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.feriados;
DROP POLICY IF EXISTS "acesso_total_update" ON public.feriados;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.feriados;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_acoes_orcamentarias
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_acoes_orcamentarias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_acoes_orcamentarias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_acoes_orcamentarias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_acoes_orcamentarias;
ALTER TABLE public.fin_acoes_orcamentarias ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_adiantamento_itens
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_adiantamento_itens;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_adiantamento_itens;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_adiantamento_itens;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_adiantamento_itens;
ALTER TABLE public.fin_adiantamento_itens ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_adiantamentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_adiantamentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_adiantamentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_adiantamentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_adiantamentos;
ALTER TABLE public.fin_adiantamentos ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_alteracoes_orcamentarias
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_alteracoes_orcamentarias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_alteracoes_orcamentarias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_alteracoes_orcamentarias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_alteracoes_orcamentarias;
ALTER TABLE public.fin_alteracoes_orcamentarias ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_audit_log
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_audit_log;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_audit_log;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_audit_log;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_audit_log;
ALTER TABLE public.fin_audit_log ENABLE ROW LEVEL SECURITY;
-- fin_audit_log  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_audit_log;
CREATE POLICY "rls_select" ON public.fin_audit_log FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- ---- fin_checklist_ci
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_checklist_ci;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_checklist_ci;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_checklist_ci;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_checklist_ci;
ALTER TABLE public.fin_checklist_ci ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_contas_bancarias
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_contas_bancarias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_contas_bancarias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_contas_bancarias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_contas_bancarias;
ALTER TABLE public.fin_contas_bancarias ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_documentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_documentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_documentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_documentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_documentos;
ALTER TABLE public.fin_documentos ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_dotacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_dotacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_dotacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_dotacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_dotacoes;
ALTER TABLE public.fin_dotacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_empenho_anulacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_empenho_anulacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_empenho_anulacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_empenho_anulacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_empenho_anulacoes;
ALTER TABLE public.fin_empenho_anulacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_empenhos
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_empenhos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_empenhos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_empenhos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_empenhos;
ALTER TABLE public.fin_empenhos ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_extrato_transacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_extrato_transacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_extrato_transacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_extrato_transacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_extrato_transacoes;
ALTER TABLE public.fin_extrato_transacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_extratos_bancarios
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_extratos_bancarios;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_extratos_bancarios;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_extratos_bancarios;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_extratos_bancarios;
ALTER TABLE public.fin_extratos_bancarios ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_fechamentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_fechamentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_fechamentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_fechamentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_fechamentos;
ALTER TABLE public.fin_fechamentos ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_fontes_recurso
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_fontes_recurso;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_fontes_recurso;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_fontes_recurso;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_fontes_recurso;
ALTER TABLE public.fin_fontes_recurso ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_lancamentos_contabeis
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_lancamentos_contabeis;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_lancamentos_contabeis;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_lancamentos_contabeis;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_lancamentos_contabeis;
ALTER TABLE public.fin_lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_liquidacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_liquidacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_liquidacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_liquidacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_liquidacoes;
ALTER TABLE public.fin_liquidacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_naturezas_despesa
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_naturezas_despesa;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_naturezas_despesa;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_naturezas_despesa;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_naturezas_despesa;
ALTER TABLE public.fin_naturezas_despesa ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_pagamentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_pagamentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_pagamentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_pagamentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_pagamentos;
ALTER TABLE public.fin_pagamentos ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_parametros
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_parametros;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_parametros;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_parametros;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_parametros;
ALTER TABLE public.fin_parametros ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_plano_contas
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_plano_contas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_plano_contas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_plano_contas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_plano_contas;
ALTER TABLE public.fin_plano_contas ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_programas_orcamentarios
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_programas_orcamentarios;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_programas_orcamentarios;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_programas_orcamentarios;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_programas_orcamentarios;
ALTER TABLE public.fin_programas_orcamentarios ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_receitas
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_receitas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_receitas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_receitas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_receitas;
ALTER TABLE public.fin_receitas ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_restos_pagar
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_restos_pagar;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_restos_pagar;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_restos_pagar;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_restos_pagar;
ALTER TABLE public.fin_restos_pagar ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_solicitacao_itens
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_solicitacao_itens;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_solicitacao_itens;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_solicitacao_itens;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_solicitacao_itens;
ALTER TABLE public.fin_solicitacao_itens ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_solicitacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_solicitacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_solicitacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_solicitacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_solicitacoes;
ALTER TABLE public.fin_solicitacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- fin_sub_empenhos
DROP POLICY IF EXISTS "acesso_total_select" ON public.fin_sub_empenhos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.fin_sub_empenhos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.fin_sub_empenhos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.fin_sub_empenhos;
ALTER TABLE public.fin_sub_empenhos ENABLE ROW LEVEL SECURITY;
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

-- ---- folha_historico_status
DROP POLICY IF EXISTS "acesso_total_select" ON public.folha_historico_status;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.folha_historico_status;
DROP POLICY IF EXISTS "acesso_total_update" ON public.folha_historico_status;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.folha_historico_status;
ALTER TABLE public.folha_historico_status ENABLE ROW LEVEL SECURITY;
-- folha_historico_status  [trilha: rh]
DROP POLICY IF EXISTS "rls_select" ON public.folha_historico_status;
CREATE POLICY "rls_select" ON public.folha_historico_status FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- galeria_eventos_esportivos
DROP POLICY IF EXISTS "acesso_total_select" ON public.galeria_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.galeria_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.galeria_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.galeria_eventos_esportivos;
ALTER TABLE public.galeria_eventos_esportivos ENABLE ROW LEVEL SECURITY;
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

-- ---- historico_conteudo_oficial
DROP POLICY IF EXISTS "acesso_total_select" ON public.historico_conteudo_oficial;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.historico_conteudo_oficial;
DROP POLICY IF EXISTS "acesso_total_update" ON public.historico_conteudo_oficial;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.historico_conteudo_oficial;
ALTER TABLE public.historico_conteudo_oficial ENABLE ROW LEVEL SECURITY;
-- historico_conteudo_oficial  [trilha: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.historico_conteudo_oficial;
CREATE POLICY "rls_select" ON public.historico_conteudo_oficial FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- ---- historico_convites_reuniao
DROP POLICY IF EXISTS "acesso_total_select" ON public.historico_convites_reuniao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.historico_convites_reuniao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.historico_convites_reuniao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.historico_convites_reuniao;
ALTER TABLE public.historico_convites_reuniao ENABLE ROW LEVEL SECURITY;
-- historico_convites_reuniao  [trilha: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.historico_convites_reuniao;
CREATE POLICY "rls_select" ON public.historico_convites_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- ---- historico_funcional
DROP POLICY IF EXISTS "acesso_total_select" ON public.historico_funcional;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.historico_funcional;
DROP POLICY IF EXISTS "acesso_total_update" ON public.historico_funcional;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.historico_funcional;
ALTER TABLE public.historico_funcional ENABLE ROW LEVEL SECURITY;
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

-- ---- historico_lai
DROP POLICY IF EXISTS "acesso_total_select" ON public.historico_lai;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.historico_lai;
DROP POLICY IF EXISTS "acesso_total_update" ON public.historico_lai;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.historico_lai;
ALTER TABLE public.historico_lai ENABLE ROW LEVEL SECURITY;
-- historico_lai  [trilha: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.historico_lai;
CREATE POLICY "rls_select" ON public.historico_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- ---- historico_patrimonio
DROP POLICY IF EXISTS "acesso_total_select" ON public.historico_patrimonio;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.historico_patrimonio;
DROP POLICY IF EXISTS "acesso_total_update" ON public.historico_patrimonio;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.historico_patrimonio;
ALTER TABLE public.historico_patrimonio ENABLE ROW LEVEL SECURITY;
-- historico_patrimonio  [trilha: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.historico_patrimonio;
CREATE POLICY "rls_select" ON public.historico_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- ---- horarios_jornada
DROP POLICY IF EXISTS "acesso_total_select" ON public.horarios_jornada;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.horarios_jornada;
DROP POLICY IF EXISTS "acesso_total_update" ON public.horarios_jornada;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.horarios_jornada;
ALTER TABLE public.horarios_jornada ENABLE ROW LEVEL SECURITY;
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

-- ---- instituicoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.instituicoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.instituicoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.instituicoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.instituicoes;
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
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

-- ---- itens_ata_registro_preco
DROP POLICY IF EXISTS "acesso_total_select" ON public.itens_ata_registro_preco;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.itens_ata_registro_preco;
DROP POLICY IF EXISTS "acesso_total_update" ON public.itens_ata_registro_preco;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.itens_ata_registro_preco;
ALTER TABLE public.itens_ata_registro_preco ENABLE ROW LEVEL SECURITY;
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

-- ---- itens_checklist
DROP POLICY IF EXISTS "acesso_total_select" ON public.itens_checklist;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.itens_checklist;
DROP POLICY IF EXISTS "acesso_total_update" ON public.itens_checklist;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.itens_checklist;
ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;
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

-- ---- itens_contrato
DROP POLICY IF EXISTS "acesso_total_select" ON public.itens_contrato;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.itens_contrato;
DROP POLICY IF EXISTS "acesso_total_update" ON public.itens_contrato;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.itens_contrato;
ALTER TABLE public.itens_contrato ENABLE ROW LEVEL SECURITY;
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

-- ---- itens_processo_licitatorio
DROP POLICY IF EXISTS "acesso_total_select" ON public.itens_processo_licitatorio;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.itens_processo_licitatorio;
DROP POLICY IF EXISTS "acesso_total_update" ON public.itens_processo_licitatorio;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.itens_processo_licitatorio;
ALTER TABLE public.itens_processo_licitatorio ENABLE ROW LEVEL SECURITY;
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

-- ---- itens_retorno_bancario
DROP POLICY IF EXISTS "acesso_total_select" ON public.itens_retorno_bancario;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.itens_retorno_bancario;
DROP POLICY IF EXISTS "acesso_total_update" ON public.itens_retorno_bancario;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.itens_retorno_bancario;
ALTER TABLE public.itens_retorno_bancario ENABLE ROW LEVEL SECURITY;
-- itens_retorno_bancario  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_retorno_bancario;
CREATE POLICY "rls_select" ON public.itens_retorno_bancario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_retorno_bancario;
CREATE POLICY "rls_insert" ON public.itens_retorno_bancario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_retorno_bancario;
CREATE POLICY "rls_update" ON public.itens_retorno_bancario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_retorno_bancario;
CREATE POLICY "rls_delete" ON public.itens_retorno_bancario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- liquidacoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.liquidacoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.liquidacoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.liquidacoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.liquidacoes;
ALTER TABLE public.liquidacoes ENABLE ROW LEVEL SECURITY;
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

-- ---- manutencoes_patrimonio
DROP POLICY IF EXISTS "acesso_total_select" ON public.manutencoes_patrimonio;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.manutencoes_patrimonio;
DROP POLICY IF EXISTS "acesso_total_update" ON public.manutencoes_patrimonio;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.manutencoes_patrimonio;
ALTER TABLE public.manutencoes_patrimonio ENABLE ROW LEVEL SECURITY;
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

-- ---- matriz_raci_atribuicoes
DROP POLICY IF EXISTS "acesso_total_select" ON public.matriz_raci_atribuicoes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.matriz_raci_atribuicoes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.matriz_raci_atribuicoes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.matriz_raci_atribuicoes;
ALTER TABLE public.matriz_raci_atribuicoes ENABLE ROW LEVEL SECURITY;
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

-- ---- matriz_raci_papeis
DROP POLICY IF EXISTS "acesso_total_select" ON public.matriz_raci_papeis;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.matriz_raci_papeis;
DROP POLICY IF EXISTS "acesso_total_update" ON public.matriz_raci_papeis;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.matriz_raci_papeis;
ALTER TABLE public.matriz_raci_papeis ENABLE ROW LEVEL SECURITY;
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

-- ---- matriz_raci_processos
DROP POLICY IF EXISTS "acesso_total_select" ON public.matriz_raci_processos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.matriz_raci_processos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.matriz_raci_processos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.matriz_raci_processos;
ALTER TABLE public.matriz_raci_processos ENABLE ROW LEVEL SECURITY;
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

-- ---- memorandos_lotacao
DROP POLICY IF EXISTS "acesso_total_select" ON public.memorandos_lotacao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.memorandos_lotacao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.memorandos_lotacao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.memorandos_lotacao;
ALTER TABLE public.memorandos_lotacao ENABLE ROW LEVEL SECURITY;
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

-- ---- modelos_mensagem_reuniao
DROP POLICY IF EXISTS "acesso_total_select" ON public.modelos_mensagem_reuniao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.modelos_mensagem_reuniao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.modelos_mensagem_reuniao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.modelos_mensagem_reuniao;
ALTER TABLE public.modelos_mensagem_reuniao ENABLE ROW LEVEL SECURITY;
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

-- ---- movimentacoes_bem
DROP POLICY IF EXISTS "acesso_total_select" ON public.movimentacoes_bem;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.movimentacoes_bem;
DROP POLICY IF EXISTS "acesso_total_update" ON public.movimentacoes_bem;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.movimentacoes_bem;
ALTER TABLE public.movimentacoes_bem ENABLE ROW LEVEL SECURITY;
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

-- ---- movimentacoes_estoque
DROP POLICY IF EXISTS "acesso_total_select" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "acesso_total_update" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.movimentacoes_estoque;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
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

-- ---- movimentacoes_processo
DROP POLICY IF EXISTS "acesso_total_select" ON public.movimentacoes_processo;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.movimentacoes_processo;
DROP POLICY IF EXISTS "acesso_total_update" ON public.movimentacoes_processo;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.movimentacoes_processo;
ALTER TABLE public.movimentacoes_processo ENABLE ROW LEVEL SECURITY;
-- movimentacoes_processo  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_processo;
CREATE POLICY "rls_select" ON public.movimentacoes_processo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_processo;
CREATE POLICY "rls_insert" ON public.movimentacoes_processo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_processo;
CREATE POLICY "rls_update" ON public.movimentacoes_processo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_processo;
CREATE POLICY "rls_delete" ON public.movimentacoes_processo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- ---- nomeacoes_chefe_unidade
DROP POLICY IF EXISTS "acesso_total_select" ON public.nomeacoes_chefe_unidade;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.nomeacoes_chefe_unidade;
DROP POLICY IF EXISTS "acesso_total_update" ON public.nomeacoes_chefe_unidade;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.nomeacoes_chefe_unidade;
ALTER TABLE public.nomeacoes_chefe_unidade ENABLE ROW LEVEL SECURITY;
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

-- ---- noticias_eventos_esportivos
DROP POLICY IF EXISTS "acesso_total_select" ON public.noticias_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.noticias_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.noticias_eventos_esportivos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.noticias_eventos_esportivos;
ALTER TABLE public.noticias_eventos_esportivos ENABLE ROW LEVEL SECURITY;
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

-- ---- ocorrencias_patrimonio
DROP POLICY IF EXISTS "acesso_total_select" ON public.ocorrencias_patrimonio;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.ocorrencias_patrimonio;
DROP POLICY IF EXISTS "acesso_total_update" ON public.ocorrencias_patrimonio;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.ocorrencias_patrimonio;
ALTER TABLE public.ocorrencias_patrimonio ENABLE ROW LEVEL SECURITY;
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

-- ---- ocorrencias_servidor
DROP POLICY IF EXISTS "acesso_total_select" ON public.ocorrencias_servidor;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.ocorrencias_servidor;
DROP POLICY IF EXISTS "acesso_total_update" ON public.ocorrencias_servidor;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.ocorrencias_servidor;
ALTER TABLE public.ocorrencias_servidor ENABLE ROW LEVEL SECURITY;
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

-- ---- pareceres_tecnicos
DROP POLICY IF EXISTS "acesso_total_select" ON public.pareceres_tecnicos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.pareceres_tecnicos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.pareceres_tecnicos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.pareceres_tecnicos;
ALTER TABLE public.pareceres_tecnicos ENABLE ROW LEVEL SECURITY;
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

-- ---- participantes_reuniao
DROP POLICY IF EXISTS "acesso_total_select" ON public.participantes_reuniao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.participantes_reuniao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.participantes_reuniao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.participantes_reuniao;
ALTER TABLE public.participantes_reuniao ENABLE ROW LEVEL SECURITY;
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

-- ---- patrimonio_unidade
DROP POLICY IF EXISTS "acesso_total_select" ON public.patrimonio_unidade;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.patrimonio_unidade;
DROP POLICY IF EXISTS "acesso_total_update" ON public.patrimonio_unidade;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.patrimonio_unidade;
ALTER TABLE public.patrimonio_unidade ENABLE ROW LEVEL SECURITY;
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

-- ---- pensoes_alimenticias
DROP POLICY IF EXISTS "acesso_total_select" ON public.pensoes_alimenticias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.pensoes_alimenticias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.pensoes_alimenticias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.pensoes_alimenticias;
ALTER TABLE public.pensoes_alimenticias ENABLE ROW LEVEL SECURITY;
-- pensoes_alimenticias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.pensoes_alimenticias;
CREATE POLICY "rls_select" ON public.pensoes_alimenticias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.pensoes_alimenticias;
CREATE POLICY "rls_insert" ON public.pensoes_alimenticias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.pensoes_alimenticias;
CREATE POLICY "rls_update" ON public.pensoes_alimenticias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.pensoes_alimenticias;
CREATE POLICY "rls_delete" ON public.pensoes_alimenticias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- planos_tratamento_risco
DROP POLICY IF EXISTS "acesso_total_select" ON public.planos_tratamento_risco;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.planos_tratamento_risco;
DROP POLICY IF EXISTS "acesso_total_update" ON public.planos_tratamento_risco;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.planos_tratamento_risco;
ALTER TABLE public.planos_tratamento_risco ENABLE ROW LEVEL SECURITY;
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

-- ---- portal_diretoria
DROP POLICY IF EXISTS "acesso_total_select" ON public.portal_diretoria;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.portal_diretoria;
DROP POLICY IF EXISTS "acesso_total_update" ON public.portal_diretoria;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.portal_diretoria;
ALTER TABLE public.portal_diretoria ENABLE ROW LEVEL SECURITY;
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

-- ---- portarias_servidor
DROP POLICY IF EXISTS "acesso_total_select" ON public.portarias_servidor;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.portarias_servidor;
DROP POLICY IF EXISTS "acesso_total_update" ON public.portarias_servidor;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.portarias_servidor;
ALTER TABLE public.portarias_servidor ENABLE ROW LEVEL SECURITY;
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

-- ---- prazos_lai
DROP POLICY IF EXISTS "acesso_total_select" ON public.prazos_lai;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.prazos_lai;
DROP POLICY IF EXISTS "acesso_total_update" ON public.prazos_lai;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.prazos_lai;
ALTER TABLE public.prazos_lai ENABLE ROW LEVEL SECURITY;
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

-- ---- prazos_processo
DROP POLICY IF EXISTS "acesso_total_select" ON public.prazos_processo;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.prazos_processo;
DROP POLICY IF EXISTS "acesso_total_update" ON public.prazos_processo;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.prazos_processo;
ALTER TABLE public.prazos_processo ENABLE ROW LEVEL SECURITY;
-- prazos_processo  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.prazos_processo;
CREATE POLICY "rls_select" ON public.prazos_processo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.prazos_processo;
CREATE POLICY "rls_insert" ON public.prazos_processo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.prazos_processo;
CREATE POLICY "rls_update" ON public.prazos_processo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.prazos_processo;
CREATE POLICY "rls_delete" ON public.prazos_processo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- ---- pre_cadastros
DROP POLICY IF EXISTS "acesso_total_select" ON public.pre_cadastros;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.pre_cadastros;
DROP POLICY IF EXISTS "acesso_total_update" ON public.pre_cadastros;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.pre_cadastros;
ALTER TABLE public.pre_cadastros ENABLE ROW LEVEL SECURITY;
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

-- ---- processos_administrativos
DROP POLICY IF EXISTS "acesso_total_select" ON public.processos_administrativos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.processos_administrativos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.processos_administrativos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.processos_administrativos;
ALTER TABLE public.processos_administrativos ENABLE ROW LEVEL SECURITY;
-- processos_administrativos  [modulo: workflow | admin]
DROP POLICY IF EXISTS "rls_select" ON public.processos_administrativos;
CREATE POLICY "rls_select" ON public.processos_administrativos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.processos_administrativos;
CREATE POLICY "rls_insert" ON public.processos_administrativos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.processos_administrativos;
CREATE POLICY "rls_update" ON public.processos_administrativos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.processos_administrativos;
CREATE POLICY "rls_delete" ON public.processos_administrativos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'admin')));

-- ---- programas
DROP POLICY IF EXISTS "acesso_total_select" ON public.programas;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.programas;
DROP POLICY IF EXISTS "acesso_total_update" ON public.programas;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.programas;
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
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

-- ---- propostas_licitacao
DROP POLICY IF EXISTS "acesso_total_select" ON public.propostas_licitacao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.propostas_licitacao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.propostas_licitacao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.propostas_licitacao;
ALTER TABLE public.propostas_licitacao ENABLE ROW LEVEL SECURITY;
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

-- ---- provimentos
DROP POLICY IF EXISTS "acesso_total_select" ON public.provimentos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.provimentos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.provimentos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.provimentos;
ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;
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

-- ---- publicacoes_lai
DROP POLICY IF EXISTS "acesso_total_select" ON public.publicacoes_lai;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.publicacoes_lai;
DROP POLICY IF EXISTS "acesso_total_update" ON public.publicacoes_lai;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.publicacoes_lai;
ALTER TABLE public.publicacoes_lai ENABLE ROW LEVEL SECURITY;
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

-- ---- publicacoes_legais
DROP POLICY IF EXISTS "acesso_total_select" ON public.publicacoes_legais;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.publicacoes_legais;
DROP POLICY IF EXISTS "acesso_total_update" ON public.publicacoes_legais;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.publicacoes_legais;
ALTER TABLE public.publicacoes_legais ENABLE ROW LEVEL SECURITY;
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

-- ---- recursos_lai
DROP POLICY IF EXISTS "acesso_total_select" ON public.recursos_lai;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.recursos_lai;
DROP POLICY IF EXISTS "acesso_total_update" ON public.recursos_lai;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.recursos_lai;
ALTER TABLE public.recursos_lai ENABLE ROW LEVEL SECURITY;
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

-- ---- regimes_trabalho
DROP POLICY IF EXISTS "acesso_total_select" ON public.regimes_trabalho;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.regimes_trabalho;
DROP POLICY IF EXISTS "acesso_total_update" ON public.regimes_trabalho;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.regimes_trabalho;
ALTER TABLE public.regimes_trabalho ENABLE ROW LEVEL SECURITY;
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

-- ---- remessas_bancarias
DROP POLICY IF EXISTS "acesso_total_select" ON public.remessas_bancarias;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.remessas_bancarias;
DROP POLICY IF EXISTS "acesso_total_update" ON public.remessas_bancarias;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.remessas_bancarias;
ALTER TABLE public.remessas_bancarias ENABLE ROW LEVEL SECURITY;
-- remessas_bancarias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.remessas_bancarias;
CREATE POLICY "rls_select" ON public.remessas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.remessas_bancarias;
CREATE POLICY "rls_insert" ON public.remessas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.remessas_bancarias;
CREATE POLICY "rls_update" ON public.remessas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.remessas_bancarias;
CREATE POLICY "rls_delete" ON public.remessas_bancarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- requisicao_itens
DROP POLICY IF EXISTS "acesso_total_select" ON public.requisicao_itens;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.requisicao_itens;
DROP POLICY IF EXISTS "acesso_total_update" ON public.requisicao_itens;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.requisicao_itens;
ALTER TABLE public.requisicao_itens ENABLE ROW LEVEL SECURITY;
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

-- ---- requisicoes_material
DROP POLICY IF EXISTS "acesso_total_select" ON public.requisicoes_material;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.requisicoes_material;
DROP POLICY IF EXISTS "acesso_total_update" ON public.requisicoes_material;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.requisicoes_material;
ALTER TABLE public.requisicoes_material ENABLE ROW LEVEL SECURITY;
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

-- ---- respostas_checklist
DROP POLICY IF EXISTS "acesso_total_select" ON public.respostas_checklist;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.respostas_checklist;
DROP POLICY IF EXISTS "acesso_total_update" ON public.respostas_checklist;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.respostas_checklist;
ALTER TABLE public.respostas_checklist ENABLE ROW LEVEL SECURITY;
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

-- ---- retornos_bancarios
DROP POLICY IF EXISTS "acesso_total_select" ON public.retornos_bancarios;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.retornos_bancarios;
DROP POLICY IF EXISTS "acesso_total_update" ON public.retornos_bancarios;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.retornos_bancarios;
ALTER TABLE public.retornos_bancarios ENABLE ROW LEVEL SECURITY;
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

-- ---- reunioes
DROP POLICY IF EXISTS "acesso_total_select" ON public.reunioes;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.reunioes;
DROP POLICY IF EXISTS "acesso_total_update" ON public.reunioes;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.reunioes;
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
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

-- ---- riscos_institucionais
DROP POLICY IF EXISTS "acesso_total_select" ON public.riscos_institucionais;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.riscos_institucionais;
DROP POLICY IF EXISTS "acesso_total_update" ON public.riscos_institucionais;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.riscos_institucionais;
ALTER TABLE public.riscos_institucionais ENABLE ROW LEVEL SECURITY;
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

-- ---- rubricas_historico
DROP POLICY IF EXISTS "acesso_total_select" ON public.rubricas_historico;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.rubricas_historico;
DROP POLICY IF EXISTS "acesso_total_update" ON public.rubricas_historico;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.rubricas_historico;
ALTER TABLE public.rubricas_historico ENABLE ROW LEVEL SECURITY;
-- rubricas_historico  [trilha: rh]
DROP POLICY IF EXISTS "rls_select" ON public.rubricas_historico;
CREATE POLICY "rls_select" ON public.rubricas_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---- servidor_regime
DROP POLICY IF EXISTS "acesso_total_select" ON public.servidor_regime;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.servidor_regime;
DROP POLICY IF EXISTS "acesso_total_update" ON public.servidor_regime;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.servidor_regime;
ALTER TABLE public.servidor_regime ENABLE ROW LEVEL SECURITY;
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

-- ---- servidor_tag_vinculos
DROP POLICY IF EXISTS "acesso_total_select" ON public.servidor_tag_vinculos;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.servidor_tag_vinculos;
DROP POLICY IF EXISTS "acesso_total_update" ON public.servidor_tag_vinculos;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.servidor_tag_vinculos;
ALTER TABLE public.servidor_tag_vinculos ENABLE ROW LEVEL SECURITY;
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

-- ---- servidor_tags
DROP POLICY IF EXISTS "acesso_total_select" ON public.servidor_tags;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.servidor_tags;
DROP POLICY IF EXISTS "acesso_total_update" ON public.servidor_tags;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.servidor_tags;
ALTER TABLE public.servidor_tags ENABLE ROW LEVEL SECURITY;
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

-- ---- solicitacoes_sic
DROP POLICY IF EXISTS "acesso_total_select" ON public.solicitacoes_sic;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.solicitacoes_sic;
DROP POLICY IF EXISTS "acesso_total_update" ON public.solicitacoes_sic;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.solicitacoes_sic;
ALTER TABLE public.solicitacoes_sic ENABLE ROW LEVEL SECURITY;
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

-- ---- termos_cessao
DROP POLICY IF EXISTS "acesso_total_select" ON public.termos_cessao;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.termos_cessao;
DROP POLICY IF EXISTS "acesso_total_update" ON public.termos_cessao;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.termos_cessao;
ALTER TABLE public.termos_cessao ENABLE ROW LEVEL SECURITY;
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

-- ---- vinculos_funcionais
DROP POLICY IF EXISTS "acesso_total_select" ON public.vinculos_funcionais;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.vinculos_funcionais;
DROP POLICY IF EXISTS "acesso_total_update" ON public.vinculos_funcionais;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.vinculos_funcionais;
ALTER TABLE public.vinculos_funcionais ENABLE ROW LEVEL SECURITY;
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

