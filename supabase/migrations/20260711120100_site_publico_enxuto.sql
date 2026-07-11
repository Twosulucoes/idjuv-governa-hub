-- Enxuga o site público: deixa no ar apenas Editais, Base Legal e Links Úteis.
-- O restante fica oculto no menu e desativado nas páginas — tudo reativável pelo
-- admin em /admin/menu-site e /admin/paginas.

-- ============================================================
-- 1) Menu do site público (config_menu_publico)
-- ============================================================

-- Novos itens no ar (visíveis)
INSERT INTO public.config_menu_publico (chave, label, visivel, ordem) VALUES
  ('editais', 'Editais', true, 1),
  ('base_legal', 'Base Legal', true, 2),
  ('links_uteis', 'Links Úteis', true, 3)
ON CONFLICT (chave) DO NOTHING;

-- Itens que hoje levam à área restrita (ou não devem ficar no ar agora): ocultar.
-- Continuam reativáveis pelo admin em /admin/menu-site.
UPDATE public.config_menu_publico
   SET visivel = false, updated_at = now()
 WHERE chave IN ('governanca', 'processos', 'manuais', 'integridade', 'transparencia');

-- ============================================================
-- 2) Status das páginas públicas (config_paginas_publicas)
-- ============================================================

-- Páginas que ficam NO AR
INSERT INTO public.config_paginas_publicas (codigo, nome, descricao, rota, ativo) VALUES
  ('editais_publico', 'Editais', 'Página pública de editais', '/editais', true),
  ('base_legal', 'Base Legal', 'Lei de Criação e Decreto Regulamentador', '/base-legal', true),
  ('links_uteis', 'Links Úteis', 'Links úteis administráveis', '/links-uteis', true)
ON CONFLICT (codigo) DO NOTHING;

-- Páginas públicas que saem do ar por enquanto (reativáveis em /admin/paginas).
-- Inserimos as que ainda não têm registro, já desativadas.
INSERT INTO public.config_paginas_publicas (codigo, nome, descricao, rota, ativo) VALUES
  ('programas_selecoes', 'Programas - Seleções', 'Seleções de programas', '/programas/selecoes', false),
  ('curriculo', 'Mini-currículo', 'Formulário público de mini-currículo', '/curriculo', false),
  ('ascom_solicitar', 'ASCOM - Solicitar', 'Solicitação de comunicação', '/ascom/solicitar', false),
  ('ascom_consultar', 'ASCOM - Consultar', 'Consulta de solicitação', '/ascom/consultar', false),
  ('noticias_portal', 'Notícias', 'Portal de notícias', '/noticias-portal', false),
  ('galerias', 'Galerias', 'Galerias de fotos', '/galerias', false),
  ('federacoes_cadastro', 'Federações - Cadastro', 'Cadastro de federações', '/federacoes/cadastro', false),
  ('cadastro_arbitros', 'Cadastro de Árbitros', 'Cadastro público de árbitros', '/cadastro-arbitros', false)
ON CONFLICT (codigo) DO NOTHING;

-- Desativa registros já existentes que não devem ficar no ar agora
UPDATE public.config_paginas_publicas
   SET ativo = false, updated_at = now()
 WHERE rota IN (
   '/transparencia',
   '/transparencia/licitacoes',
   '/transparencia/contratos',
   '/transparencia/orcamento',
   '/transparencia/patrimonio',
   '/transparencia/cargos',
   '/transparencia/lai',
   '/cadastrogestores'
 );
