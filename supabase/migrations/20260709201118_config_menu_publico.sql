-- Controle de visibilidade dos itens do menu de navegação do site público
-- (cabeçalho do site: Governança, Processos, Manuais, Integridade, Transparência)

CREATE TABLE IF NOT EXISTS public.config_menu_publico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE, -- ex: 'governanca', 'processos', 'manuais', 'integridade', 'transparencia'
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

DROP TRIGGER IF EXISTS update_config_menu_publico_updated_at ON public.config_menu_publico;
CREATE TRIGGER update_config_menu_publico_updated_at
  BEFORE UPDATE ON public.config_menu_publico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.config_menu_publico (chave, label, ordem) VALUES
  ('governanca', 'Governança', 1),
  ('processos', 'Processos', 2),
  ('manuais', 'Manuais', 3),
  ('integridade', 'Integridade', 4),
  ('transparencia', 'Transparência', 5)
ON CONFLICT (chave) DO NOTHING;
