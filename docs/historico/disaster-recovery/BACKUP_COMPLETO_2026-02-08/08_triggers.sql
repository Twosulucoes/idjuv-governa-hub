-- ============================================================
-- IDJUV - BACKUP COMPLETO - TRIGGERS
-- Gerado em: 2026-02-08
-- ============================================================

-- ============================================
-- TRIGGER: Criar perfil para novo usuário
-- ============================================
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servidores_updated_at 
  BEFORE UPDATE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cargos_updated_at 
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estrutura_updated_at 
  BEFORE UPDATE ON public.estrutura_organizacional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_locais_updated_at 
  BEFORE UPDATE ON public.unidades_locais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_unidade_updated_at 
  BEFORE UPDATE ON public.agenda_unidade
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bens_patrimoniais_updated_at 
  BEFORE UPDATE ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at 
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at 
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backup_config_updated_at 
  BEFORE UPDATE ON public.backup_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: Gerar protocolo para agenda
-- ============================================
CREATE OR REPLACE TRIGGER trigger_gerar_protocolo_agenda
  BEFORE INSERT ON public.agenda_unidade
  FOR EACH ROW 
  WHEN (NEW.numero_protocolo IS NULL)
  EXECUTE FUNCTION public.gerar_protocolo_agenda();

-- ============================================
-- TRIGGER: Gerar código para unidades locais
-- ============================================
CREATE OR REPLACE TRIGGER trigger_gerar_codigo_unidade
  BEFORE INSERT ON public.unidades_locais
  FOR EACH ROW 
  WHEN (NEW.codigo_unidade IS NULL)
  EXECUTE FUNCTION public.gerar_codigo_unidade_local();

-- ============================================================
-- FIM: 08_triggers.sql
-- Próximo: 09_dados_iniciais.sql
-- ============================================================
