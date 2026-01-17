-- Adicionar campos para rastrear envio de convites
ALTER TABLE public.participantes_reuniao
ADD COLUMN IF NOT EXISTS convite_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS convite_enviado_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS convite_enviado_por uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS convite_canal text;