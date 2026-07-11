-- Área administrável de "Links Úteis" do site público
-- O admin cadastra/edita/reordena e liga/desliga links exibidos na página /links-uteis

CREATE TABLE IF NOT EXISTS public.links_uteis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.links_uteis ENABLE ROW LEVEL SECURITY;

-- Leitura pública (site público, visitante não autenticado)
DROP POLICY IF EXISTS "Leitura publica dos links uteis" ON public.links_uteis;
CREATE POLICY "Leitura publica dos links uteis"
  ON public.links_uteis
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escrita apenas para admins
DROP POLICY IF EXISTS "Apenas admins podem alterar links uteis" ON public.links_uteis;
CREATE POLICY "Apenas admins podem alterar links uteis"
  ON public.links_uteis
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

DROP TRIGGER IF EXISTS update_links_uteis_updated_at ON public.links_uteis;
CREATE TRIGGER update_links_uteis_updated_at
  BEFORE UPDATE ON public.links_uteis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
