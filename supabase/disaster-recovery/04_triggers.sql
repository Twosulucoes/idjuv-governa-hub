-- ============================================
-- IDJuv - Schema de Migração
-- Arquivo 04: Triggers
-- ============================================
-- Execute APÓS 03_funcoes.sql
-- ============================================

-- ============================================
-- TRIGGERS DE TIMESTAMP
-- ============================================

-- Profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Perfis
CREATE TRIGGER update_perfis_updated_at
BEFORE UPDATE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Funções do sistema
CREATE TRIGGER update_funcoes_sistema_updated_at
BEFORE UPDATE ON public.funcoes_sistema
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Estrutura organizacional
CREATE TRIGGER update_estrutura_organizacional_updated_at
BEFORE UPDATE ON public.estrutura_organizacional
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cargos
CREATE TRIGGER update_cargos_updated_at
BEFORE UPDATE ON public.cargos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Servidores
CREATE TRIGGER update_servidores_updated_at
BEFORE UPDATE ON public.servidores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lotações
CREATE TRIGGER update_lotacoes_updated_at
BEFORE UPDATE ON public.lotacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Provimentos
CREATE TRIGGER update_provimentos_updated_at
BEFORE UPDATE ON public.provimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Designações
CREATE TRIGGER update_designacoes_updated_at
BEFORE UPDATE ON public.designacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vínculos funcionais
CREATE TRIGGER update_vinculos_funcionais_updated_at
BEFORE UPDATE ON public.vinculos_funcionais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Férias
CREATE TRIGGER update_ferias_servidor_updated_at
BEFORE UPDATE ON public.ferias_servidor
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Unidades locais
CREATE TRIGGER update_unidades_locais_updated_at
BEFORE UPDATE ON public.unidades_locais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rubricas
CREATE TRIGGER update_rubricas_updated_at
BEFORE UPDATE ON public.rubricas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Folhas de pagamento
CREATE TRIGGER update_folhas_pagamento_updated_at
BEFORE UPDATE ON public.folhas_pagamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fichas financeiras
CREATE TRIGGER update_fichas_financeiras_updated_at
BEFORE UPDATE ON public.fichas_financeiras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGERS DE NEGÓCIO
-- ============================================

-- Encerrar lotação anterior ao criar nova
CREATE TRIGGER tr_encerrar_lotacao_anterior
AFTER INSERT ON public.lotacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_encerrar_lotacao_anterior();

-- Encerrar vínculo anterior ao criar novo
CREATE TRIGGER tr_encerrar_vinculo_anterior
AFTER INSERT ON public.vinculos_funcionais
FOR EACH ROW EXECUTE FUNCTION public.fn_encerrar_vinculo_anterior();

-- ============================================
-- TRIGGERS DE AUDITORIA
-- ============================================

-- Auditoria em perfis
CREATE TRIGGER tr_audit_perfis
AFTER INSERT OR UPDATE OR DELETE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

-- Auditoria em funções do sistema
CREATE TRIGGER tr_audit_funcoes_sistema
AFTER INSERT OR UPDATE OR DELETE ON public.funcoes_sistema
FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

-- Auditoria em perfil_funcoes
CREATE TRIGGER tr_audit_perfil_funcoes
AFTER INSERT OR UPDATE OR DELETE ON public.perfil_funcoes
FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

-- Auditoria em usuario_perfis
CREATE TRIGGER tr_audit_usuario_perfis
AFTER INSERT OR UPDATE OR DELETE ON public.usuario_perfis
FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

-- ============================================
-- FIM DO ARQUIVO 04_triggers.sql
-- Próximo: 05_rls_policies.sql
-- ============================================
