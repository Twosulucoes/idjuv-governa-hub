-- ============================================================
-- IDJUV - BACKUP COMPLETO - HABILITAR RLS
-- Gerado em: 2026-02-08
-- ============================================================

-- Este script habilita Row Level Security em TODAS as tabelas
-- Execute ANTES de 07_rls_policies.sql

-- ============================================
-- TABELAS DE USUÁRIOS E AUTH
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_org_units ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SISTEMA DE PERFIS
-- ============================================
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfis ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ESTRUTURA ORGANIZACIONAL
-- ============================================
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composicao_cargos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SERVIDORES E RH
-- ============================================
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_funcional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_funcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias_servidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencas_afastamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PONTO E FREQUÊNCIA
-- ============================================
ALTER TABLE public.configuracao_jornada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

-- ============================================
-- UNIDADES LOCAIS
-- ============================================
ALTER TABLE public.unidades_locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_unidade ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FINANCEIRO
-- ============================================
ALTER TABLE public.rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bancos_cnab ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FORNECEDORES E CONTRATOS
-- ============================================
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PATRIMÔNIO
-- ============================================
ALTER TABLE public.bens_patrimoniais ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FEDERAÇÕES
-- ============================================
ALTER TABLE public.federacoes_esportivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDITORIA E BACKUP
-- ============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- APROVAÇÕES
-- ============================================
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DOCUMENTOS
-- ============================================
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIM: 06_rls_enable.sql
-- Próximo: 07_rls_policies.sql
-- ============================================================
