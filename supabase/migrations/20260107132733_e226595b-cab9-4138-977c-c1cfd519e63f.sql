-- ============================================
-- MÓDULO DE BACKUP OFFSITE
-- ============================================

-- Enum para tipo de backup
CREATE TYPE public.backup_type AS ENUM ('daily', 'weekly', 'monthly', 'manual');

-- Enum para status do backup
CREATE TYPE public.backup_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');

-- Tabela de configuração de backup
CREATE TABLE public.backup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  schedule_cron VARCHAR(100) DEFAULT '0 2 * * *', -- 02:00 diário
  weekly_day INTEGER DEFAULT 0, -- Domingo
  retention_daily INTEGER DEFAULT 14,
  retention_weekly INTEGER DEFAULT 8,
  retention_monthly INTEGER DEFAULT 12,
  buckets_included TEXT[] DEFAULT ARRAY['documentos'],
  encryption_enabled BOOLEAN DEFAULT true,
  last_backup_at TIMESTAMPTZ,
  last_backup_status backup_status,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico de backups
CREATE TABLE public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type backup_type NOT NULL,
  status backup_status DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id),
  trigger_mode VARCHAR(20) DEFAULT 'auto', -- 'auto' ou 'manual'
  
  -- Detalhes do banco
  db_file_path TEXT,
  db_file_size BIGINT,
  db_checksum VARCHAR(64),
  
  -- Detalhes do storage
  storage_file_path TEXT,
  storage_file_size BIGINT,
  storage_checksum VARCHAR(64),
  storage_objects_count INTEGER,
  
  -- Manifest
  manifest_path TEXT,
  manifest_checksum VARCHAR(64),
  
  -- Totais
  total_size BIGINT,
  duration_seconds INTEGER,
  
  -- Erros
  error_message TEXT,
  error_details JSONB,
  
  -- Metadados
  system_version VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de logs de verificação de integridade
CREATE TABLE public.backup_integrity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES public.backup_history(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES auth.users(id),
  checked_at TIMESTAMPTZ DEFAULT now(),
  is_valid BOOLEAN,
  db_checksum_valid BOOLEAN,
  storage_checksum_valid BOOLEAN,
  manifest_valid BOOLEAN,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.backup_config (id) VALUES (gen_random_uuid());

-- Enable RLS
ALTER TABLE public.backup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_integrity_checks ENABLE ROW LEVEL SECURITY;

-- Policies para backup_config (apenas TI-admin e Presidência)
CREATE POLICY "backup_config_select" ON public.backup_config
  FOR SELECT USING (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

CREATE POLICY "backup_config_update" ON public.backup_config
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

-- Policies para backup_history
CREATE POLICY "backup_history_select" ON public.backup_history
  FOR SELECT USING (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

CREATE POLICY "backup_history_insert" ON public.backup_history
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

-- Policies para backup_integrity_checks
CREATE POLICY "backup_integrity_select" ON public.backup_integrity_checks
  FOR SELECT USING (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

CREATE POLICY "backup_integrity_insert" ON public.backup_integrity_checks
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

-- Trigger para updated_at
CREATE TRIGGER update_backup_config_updated_at
  BEFORE UPDATE ON public.backup_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_backup_history_type ON public.backup_history(backup_type);
CREATE INDEX idx_backup_history_status ON public.backup_history(status);
CREATE INDEX idx_backup_history_started_at ON public.backup_history(started_at DESC);