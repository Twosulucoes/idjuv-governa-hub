-- ============================================
-- FASE 3: CORRIGIR VIEWS SECURITY DEFINER
-- Converter para SECURITY INVOKER para herdar RLS
-- ============================================

-- Alterar todas as views para usar SECURITY INVOKER
-- Isso faz com que as views respeitem as políticas RLS das tabelas subjacentes

ALTER VIEW public.v_cedencias_a_vencer SET (security_invoker = on);
ALTER VIEW public.v_historico_bem_completo SET (security_invoker = on);
ALTER VIEW public.v_instituicoes_resumo SET (security_invoker = on);
ALTER VIEW public.v_movimentacoes_completas SET (security_invoker = on);
ALTER VIEW public.v_patrimonio_por_unidade SET (security_invoker = on);
ALTER VIEW public.v_processos_resumo SET (security_invoker = on);
ALTER VIEW public.v_relatorio_patrimonio SET (security_invoker = on);
ALTER VIEW public.v_relatorio_unidades_locais SET (security_invoker = on);
ALTER VIEW public.v_relatorio_uso_unidades SET (security_invoker = on);
ALTER VIEW public.v_resumo_patrimonio SET (security_invoker = on);
ALTER VIEW public.v_servidores_situacao SET (security_invoker = on);
ALTER VIEW public.v_sic_consulta_publica SET (security_invoker = on);