
-- Adicionar campo de tipo de ônus e campos de workflow à tabela viagens_diarias
ALTER TABLE public.viagens_diarias 
  ADD COLUMN IF NOT EXISTS tipo_onus text NOT NULL DEFAULT 'com_onus',
  ADD COLUMN IF NOT EXISTS numero_sei_diarias text,
  ADD COLUMN IF NOT EXISTS workflow_diraf_status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS workflow_diraf_solicitado_em timestamptz,
  ADD COLUMN IF NOT EXISTS workflow_diraf_concluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS workflow_diraf_observacoes text;

-- Comentários
COMMENT ON COLUMN public.viagens_diarias.tipo_onus IS 'sem_onus ou com_onus - define se a viagem gera diárias';
COMMENT ON COLUMN public.viagens_diarias.numero_sei_diarias IS 'Número do processo SEI gerado pela DIRAF para pagamento das diárias';
COMMENT ON COLUMN public.viagens_diarias.workflow_diraf_status IS 'Status do workflow DIRAF: pendente, solicitado, em_andamento, concluido';
