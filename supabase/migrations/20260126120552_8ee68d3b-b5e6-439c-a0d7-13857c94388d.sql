CREATE TABLE public.calendario_federacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    federacao_id UUID NOT NULL REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'Campeonato',
    data_inicio DATE NOT NULL,
    data_fim DATE,
    local TEXT,
    cidade TEXT,
    publico_estimado INTEGER,
    categorias TEXT,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'planejado',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.calendario_federacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem visualizar calendário"
ON public.calendario_federacao FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem gerenciar calendário"
ON public.calendario_federacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_calendario_federacao_id ON public.calendario_federacao(federacao_id);
CREATE INDEX idx_calendario_data ON public.calendario_federacao(data_inicio);