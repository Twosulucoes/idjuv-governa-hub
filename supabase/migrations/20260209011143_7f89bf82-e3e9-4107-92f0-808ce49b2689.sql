-- Tabela para controle de status das páginas públicas
CREATE TABLE public.config_paginas_publicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE, -- ex: 'portal_home', 'transparencia', 'selecoes'
  nome TEXT NOT NULL,
  descricao TEXT,
  rota TEXT NOT NULL, -- ex: '/', '/transparencia', '/selecoes'
  ativo BOOLEAN NOT NULL DEFAULT true,
  em_manutencao BOOLEAN NOT NULL DEFAULT false,
  mensagem_manutencao TEXT DEFAULT 'Esta página está temporariamente em manutenção. Voltaremos em breve!',
  titulo_manutencao TEXT DEFAULT 'Página em Manutenção',
  previsao_retorno TIMESTAMP WITH TIME ZONE,
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.config_paginas_publicas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para verificar status)
CREATE POLICY "Leitura pública do status das páginas"
  ON public.config_paginas_publicas
  FOR SELECT
  USING (true);

-- Política de escrita apenas para admins
CREATE POLICY "Apenas admins podem alterar configuração"
  ON public.config_paginas_publicas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_config_paginas_updated_at
  BEFORE UPDATE ON public.config_paginas_publicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir páginas públicas iniciais
INSERT INTO public.config_paginas_publicas (codigo, nome, descricao, rota) VALUES
  ('portal_home', 'Portal - Página Inicial', 'Página inicial do portal público', '/'),
  ('portal_preview', 'Portal - Preview 2026', 'Nova versão do portal institucional', '/portal-preview-idjuv-2026'),
  ('transparencia_home', 'Transparência - Página Inicial', 'Portal da Transparência', '/transparencia'),
  ('transparencia_licitacoes', 'Transparência - Licitações', 'Licitações públicas', '/transparencia/licitacoes'),
  ('transparencia_contratos', 'Transparência - Contratos', 'Contratos públicos', '/transparencia/contratos'),
  ('transparencia_orcamento', 'Transparência - Orçamento', 'Execução orçamentária', '/transparencia/orcamento'),
  ('transparencia_patrimonio', 'Transparência - Patrimônio', 'Patrimônio público', '/transparencia/patrimonio'),
  ('transparencia_cargos', 'Transparência - Cargos', 'Cargos e remuneração', '/transparencia/cargos'),
  ('transparencia_lai', 'Transparência - e-SIC/LAI', 'Lei de Acesso à Informação', '/transparencia/lai'),
  ('selecoes', 'Seletivas Estudantis', 'Hot site das Seletivas Estudantis', '/selecoes'),
  ('integridade_portal', 'Integridade - Portal', 'Portal de integridade', '/integridade'),
  ('integridade_denuncias', 'Integridade - Denúncias', 'Canal de denúncias', '/integridade/denuncias'),
  ('cadastro_gestores', 'Cadastro de Gestores', 'Formulário público de gestores escolares', '/cadastrogestores');

-- Histórico de alterações
CREATE TABLE public.config_paginas_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pagina_id UUID NOT NULL REFERENCES public.config_paginas_publicas(id) ON DELETE CASCADE,
  acao TEXT NOT NULL, -- 'ativar', 'desativar', 'manutencao_on', 'manutencao_off'
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para histórico
ALTER TABLE public.config_paginas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins veem histórico"
  ON public.config_paginas_historico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sistema insere histórico"
  ON public.config_paginas_historico
  FOR INSERT
  WITH CHECK (true);

-- Função para registrar alterações automaticamente
CREATE OR REPLACE FUNCTION public.log_alteracao_pagina()
RETURNS TRIGGER AS $$
DECLARE
  acao_descricao TEXT;
BEGIN
  -- Determinar ação
  IF OLD.ativo != NEW.ativo THEN
    acao_descricao := CASE WHEN NEW.ativo THEN 'ativar' ELSE 'desativar' END;
  ELSIF OLD.em_manutencao != NEW.em_manutencao THEN
    acao_descricao := CASE WHEN NEW.em_manutencao THEN 'manutencao_on' ELSE 'manutencao_off' END;
  ELSE
    acao_descricao := 'atualizar';
  END IF;

  INSERT INTO public.config_paginas_historico (
    pagina_id,
    acao,
    dados_anteriores,
    dados_novos,
    usuario_id
  ) VALUES (
    NEW.id,
    acao_descricao,
    row_to_json(OLD)::jsonb,
    row_to_json(NEW)::jsonb,
    auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para log automático
CREATE TRIGGER log_alteracao_pagina_trigger
  AFTER UPDATE ON public.config_paginas_publicas
  FOR EACH ROW
  EXECUTE FUNCTION public.log_alteracao_pagina();