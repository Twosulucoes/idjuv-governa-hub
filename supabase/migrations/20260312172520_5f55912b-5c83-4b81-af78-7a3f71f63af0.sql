
CREATE TABLE public.form_field_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL DEFAULT 'pre_cadastro',
  field_key text NOT NULL,
  section text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  required boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(form_type, field_key)
);

ALTER TABLE public.form_field_config ENABLE ROW LEVEL SECURITY;

-- Admins podem ler e editar
CREATE POLICY "admin_read_form_config" ON public.form_field_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_write_form_config" ON public.form_field_config
  FOR ALL TO authenticated
  USING (public.can_access_module(auth.uid(), 'admin'))
  WITH CHECK (public.can_access_module(auth.uid(), 'admin'));

-- Acesso anon para formulário público
CREATE POLICY "anon_read_form_config" ON public.form_field_config
  FOR SELECT TO anon
  USING (true);

-- Inserir configurações padrão para o pré-cadastro
INSERT INTO public.form_field_config (form_type, section, field_key, label, enabled, required, display_order) VALUES
-- Documentos
('pre_cadastro', 'documentos', 'rg', 'Documento de Identidade (RG)', true, true, 1),
('pre_cadastro', 'documentos', 'certidao_tipo', 'Tipo de Certidão', true, false, 2),
('pre_cadastro', 'documentos', 'titulo_eleitor', 'Título de Eleitor', true, false, 3),
('pre_cadastro', 'documentos', 'certificado_reservista', 'Certificado de Reservista', true, false, 4),
('pre_cadastro', 'documentos', 'ctps', 'Carteira de Trabalho (CTPS)', true, false, 5),
-- Dados Pessoais
('pre_cadastro', 'dados_pessoais', 'nome_social', 'Nome Social', true, false, 1),
('pre_cadastro', 'dados_pessoais', 'foto_url', 'Foto do Servidor', true, false, 2),
('pre_cadastro', 'dados_pessoais', 'raca_cor', 'Raça/Cor', true, false, 3),
('pre_cadastro', 'dados_pessoais', 'pcd', 'Pessoa com Deficiência (PcD)', true, false, 4),
('pre_cadastro', 'dados_pessoais', 'nome_mae', 'Nome da Mãe', true, false, 5),
('pre_cadastro', 'dados_pessoais', 'nome_pai', 'Nome do Pai', true, false, 6),
('pre_cadastro', 'dados_pessoais', 'tipo_sanguineo', 'Tipo Sanguíneo', true, false, 7),
-- Seções inteiras
('pre_cadastro', 'secoes', 'escolaridade', 'Escolaridade / CNH', true, false, 1),
('pre_cadastro', 'secoes', 'dados_bancarios', 'Dados Bancários', true, false, 2),
('pre_cadastro', 'secoes', 'dependentes', 'Dependentes', true, false, 3),
('pre_cadastro', 'secoes', 'emergencia', 'Contato de Emergência', true, false, 4),
('pre_cadastro', 'secoes', 'aptidoes', 'Aptidões e Habilidades', true, false, 5),
('pre_cadastro', 'secoes', 'checklist', 'Checklist de Documentos', true, false, 6),
('pre_cadastro', 'secoes', 'previdencia', 'Dados Previdenciários (PIS/PASEP)', true, false, 7),
-- Dados de Estrangeiro
('pre_cadastro', 'dados_pessoais', 'estrangeiro', 'Dados de Estrangeiro', false, false, 8),
('pre_cadastro', 'dados_pessoais', 'primeiro_emprego', 'Primeiro Emprego', false, false, 9),
('pre_cadastro', 'dados_pessoais', 'acumula_cargo', 'Acumulação de Cargo', true, false, 10),
('pre_cadastro', 'dados_pessoais', 'indicacao', 'Indicação', false, false, 11);
