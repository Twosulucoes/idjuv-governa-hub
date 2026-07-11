-- Enxuga o site público: deixa no ar apenas Editais, Base Legal e Links Úteis.
-- O restante fica oculto no menu e desativado nas páginas — tudo reativável pelo
-- admin em /admin/menu-site e /admin/paginas.
--
-- Esta migração é AUTOSSUFICIENTE: garante que as tabelas de configuração
-- (config_menu_publico e config_paginas_publicas) existam antes de popular,
-- para funcionar mesmo em bancos onde as migrações anteriores ainda não rodaram.

-- ============================================================
-- 0) Função utilitária de updated_at (idempotente)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1) Menu do site público (config_menu_publico)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config_menu_publico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  visivel BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.config_menu_publico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica dos itens de menu" ON public.config_menu_publico;
CREATE POLICY "Leitura publica dos itens de menu"
  ON public.config_menu_publico
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Apenas admins podem alterar menu publico" ON public.config_menu_publico;
CREATE POLICY "Apenas admins podem alterar menu publico"
  ON public.config_menu_publico
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_config_menu_publico_updated_at ON public.config_menu_publico;
CREATE TRIGGER update_config_menu_publico_updated_at
  BEFORE UPDATE ON public.config_menu_publico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Garante os grupos originais (para poderem ser reativados no admin)
INSERT INTO public.config_menu_publico (chave, label, ordem) VALUES
  ('governanca', 'Governança', 10),
  ('processos', 'Processos', 11),
  ('manuais', 'Manuais', 12),
  ('integridade', 'Integridade', 13),
  ('transparencia', 'Transparência', 14)
ON CONFLICT (chave) DO NOTHING;

-- Novos itens no ar (visíveis)
INSERT INTO public.config_menu_publico (chave, label, visivel, ordem) VALUES
  ('editais', 'Editais', true, 1),
  ('base_legal', 'Base Legal', true, 2),
  ('links_uteis', 'Links Úteis', true, 3)
ON CONFLICT (chave) DO NOTHING;

-- Oculta os grupos que hoje levam à área restrita (reativáveis em /admin/menu-site)
UPDATE public.config_menu_publico
   SET visivel = false, updated_at = now()
 WHERE chave IN ('governanca', 'processos', 'manuais', 'integridade', 'transparencia');

-- ============================================================
-- 2) Status das páginas públicas (config_paginas_publicas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config_paginas_publicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  rota TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  em_manutencao BOOLEAN NOT NULL DEFAULT false,
  mensagem_manutencao TEXT DEFAULT 'Esta página está temporariamente em manutenção. Voltaremos em breve!',
  titulo_manutencao TEXT DEFAULT 'Página em Manutenção',
  previsao_retorno TIMESTAMP WITH TIME ZONE,
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.config_paginas_publicas ENABLE ROW LEVEL SECURITY;

-- Leitura pública (o guard roda sem autenticação → precisa de anon)
DROP POLICY IF EXISTS "Leitura pública do status das páginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "Leitura publica do status das paginas" ON public.config_paginas_publicas;
CREATE POLICY "Leitura publica do status das paginas"
  ON public.config_paginas_publicas
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas admins podem alterar configuração" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "Apenas admins podem alterar config paginas" ON public.config_paginas_publicas;
CREATE POLICY "Apenas admins podem alterar config paginas"
  ON public.config_paginas_publicas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_config_paginas_updated_at ON public.config_paginas_publicas;
CREATE TRIGGER update_config_paginas_updated_at
  BEFORE UPDATE ON public.config_paginas_publicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Páginas que ficam NO AR
INSERT INTO public.config_paginas_publicas (codigo, nome, descricao, rota, ativo) VALUES
  ('portal_home', 'Portal - Página Inicial', 'Página inicial do portal público', '/', true),
  ('editais_publico', 'Editais', 'Página pública de editais', '/editais', true),
  ('base_legal', 'Base Legal', 'Lei de Criação e Decreto Regulamentador', '/base-legal', true),
  ('links_uteis', 'Links Úteis', 'Links úteis administráveis', '/links-uteis', true)
ON CONFLICT (codigo) DO UPDATE SET ativo = true, updated_at = now();

-- Páginas públicas que saem do ar por enquanto (reativáveis em /admin/paginas).
-- Usa ON CONFLICT DO UPDATE para funcionar tanto em banco novo quanto existente.
INSERT INTO public.config_paginas_publicas (codigo, nome, descricao, rota, ativo) VALUES
  ('transparencia_home', 'Transparência - Página Inicial', 'Portal da Transparência', '/transparencia', false),
  ('transparencia_licitacoes', 'Transparência - Licitações', 'Licitações públicas', '/transparencia/licitacoes', false),
  ('transparencia_contratos', 'Transparência - Contratos', 'Contratos públicos', '/transparencia/contratos', false),
  ('transparencia_orcamento', 'Transparência - Orçamento', 'Execução orçamentária', '/transparencia/orcamento', false),
  ('transparencia_patrimonio', 'Transparência - Patrimônio', 'Patrimônio público', '/transparencia/patrimonio', false),
  ('transparencia_cargos', 'Transparência - Cargos', 'Cargos e remuneração', '/transparencia/cargos', false),
  ('transparencia_lai', 'Transparência - e-SIC/LAI', 'Lei de Acesso à Informação', '/transparencia/lai', false),
  ('cadastro_gestores', 'Cadastro de Gestores', 'Formulário público de gestores escolares', '/cadastrogestores', false),
  ('programas_selecoes', 'Programas - Seleções', 'Seleções de programas', '/programas/selecoes', false),
  ('curriculo', 'Mini-currículo', 'Formulário público de mini-currículo', '/curriculo', false),
  ('ascom_solicitar', 'ASCOM - Solicitar', 'Solicitação de comunicação', '/ascom/solicitar', false),
  ('ascom_consultar', 'ASCOM - Consultar', 'Consulta de solicitação', '/ascom/consultar', false),
  ('noticias_portal', 'Notícias', 'Portal de notícias', '/noticias-portal', false),
  ('galerias', 'Galerias', 'Galerias de fotos', '/galerias', false),
  ('federacoes_cadastro', 'Federações - Cadastro', 'Cadastro de federações', '/federacoes/cadastro', false),
  ('cadastro_arbitros', 'Cadastro de Árbitros', 'Cadastro público de árbitros', '/cadastro-arbitros', false)
ON CONFLICT (codigo) DO UPDATE SET ativo = false, updated_at = now();
