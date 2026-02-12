
-- Tabela para configuração global de módulos
CREATE TABLE public.module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  display_name text,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler (para checar módulo ativo)
CREATE POLICY "module_settings_select"
ON public.module_settings FOR SELECT
TO authenticated
USING (true);

-- Admins podem inserir
CREATE POLICY "module_settings_insert"
ON public.module_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

-- Admins podem atualizar
CREATE POLICY "module_settings_update"
ON public.module_settings FOR UPDATE
TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

-- Admins podem deletar
CREATE POLICY "module_settings_delete"
ON public.module_settings FOR DELETE
TO authenticated
USING (public.has_role('admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_module_settings_updated_at
BEFORE UPDATE ON public.module_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed com todos os módulos atuais
INSERT INTO public.module_settings (module_code, display_name, description, enabled) VALUES
  ('admin', 'Administração', 'Usuários, perfis, auditoria, reuniões', true),
  ('rh', 'Recursos Humanos', 'Servidores, frequência, férias, portarias, folha, lotações', true),
  ('workflow', 'Processos', 'Tramitação de processos administrativos', true),
  ('compras', 'Compras', 'Licitações e processos de aquisição', true),
  ('contratos', 'Contratos', 'Gestão e execução contratual', true),
  ('financeiro', 'Financeiro', 'Orçamento, empenhos, pagamentos', true),
  ('patrimonio', 'Patrimônio', 'Bens, inventário, almoxarifado, unidades', true),
  ('governanca', 'Governança', 'Estrutura, organograma, cargos', true),
  ('integridade', 'Integridade', 'Denúncias, ética e compliance', true),
  ('transparencia', 'Transparência', 'Portal LAI e dados públicos', true),
  ('comunicacao', 'Comunicação', 'ASCOM e demandas de comunicação', true),
  ('programas', 'Programas', 'Programas sociais e esportivos', true),
  ('gestores_escolares', 'Gestores Escolares', 'Credenciamento de gestores para Jogos Escolares', true),
  ('organizacoes', 'Organizações', 'Federações, instituições, associações e entes parceiros', true),
  ('gabinete', 'Gabinete', 'Pré-cadastros, portarias, ordens de missão e workflow', true),
  ('patrimonio_mobile', 'Patrimônio Mobile', 'App móvel para coleta de inventário e cadastro em campo', true);
