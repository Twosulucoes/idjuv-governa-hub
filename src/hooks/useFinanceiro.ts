/**
 * Hook principal do Módulo Financeiro
 * Gerencia operações de orçamento, despesas, receitas e contabilidade
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import type {
  Dotacao,
  SolicitacaoDespesa,
  Empenho,
  Liquidacao,
  Pagamento,
  ContaBancaria,
  Adiantamento,
  Receita,
  FonteRecurso,
  NaturezaDespesa,
  ResumoOrcamentario,
} from '@/types/financeiro';

// ===========================================
// DOTAÇÕES ORÇAMENTÁRIAS
// ===========================================

export function useDotacoes(exercicio?: number) {
  const ano = exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_dotacoes', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_dotacoes')
        .select(`
          *,
          unidade:estrutura_organizacional(id, nome, sigla),
          programa:fin_programas_orcamentarios(id, codigo, nome),
          acao:fin_acoes_orcamentarias(id, codigo, nome),
          natureza_despesa:fin_naturezas_despesa(id, codigo, nome),
          fonte_recurso:fin_fontes_recurso(id, codigo, nome)
        `)
        .eq('exercicio', ano)
        .eq('ativo', true)
        .order('codigo_dotacao');
      
      if (error) throw error;
      return data as unknown as Dotacao[];
    },
  });
}

export function useResumoOrcamentario(exercicio?: number) {
  const ano = exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_resumo_orcamentario', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_dotacoes')
        .select('valor_inicial, valor_suplementado, valor_reduzido, valor_empenhado, valor_liquidado, valor_pago')
        .eq('exercicio', ano)
        .eq('ativo', true);
      
      if (error) throw error;
      
      const resumo: ResumoOrcamentario = {
        dotacao_inicial: 0,
        suplementacoes: 0,
        reducoes: 0,
        dotacao_atual: 0,
        empenhado: 0,
        liquidado: 0,
        pago: 0,
        saldo_disponivel: 0,
        percentual_executado: 0,
      };
      
      data?.forEach((d: any) => {
        resumo.dotacao_inicial += Number(d.valor_inicial) || 0;
        resumo.suplementacoes += Number(d.valor_suplementado) || 0;
        resumo.reducoes += Number(d.valor_reduzido) || 0;
        resumo.empenhado += Number(d.valor_empenhado) || 0;
        resumo.liquidado += Number(d.valor_liquidado) || 0;
        resumo.pago += Number(d.valor_pago) || 0;
      });
      
      resumo.dotacao_atual = resumo.dotacao_inicial + resumo.suplementacoes - resumo.reducoes;
      resumo.saldo_disponivel = resumo.dotacao_atual - resumo.empenhado;
      resumo.percentual_executado = resumo.dotacao_atual > 0 
        ? (resumo.pago / resumo.dotacao_atual) * 100 
        : 0;
      
      return resumo;
    },
  });
}

// ===========================================
// SOLICITAÇÕES DE DESPESA
// ===========================================

export function useSolicitacoes(filtros?: { status?: string; exercicio?: number }) {
  const ano = filtros?.exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_solicitacoes', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fin_solicitacoes')
        .select(`
          *,
          unidade_solicitante:estrutura_organizacional(id, nome, sigla),
          servidor_solicitante:servidores(id, nome_completo),
          fornecedor:fornecedores(id, razao_social)
        `)
        .eq('exercicio', ano)
        .order('created_at', { ascending: false });
      
      if (filtros?.status) {
        query = query.eq('status', filtros.status as any);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as SolicitacaoDespesa[];
    },
  });
}

export function useCriarSolicitacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();
  
  return useMutation({
    mutationFn: async (dados: Partial<SolicitacaoDespesa>) => {
      // Gerar número
      const exercicio = dados.exercicio || new Date().getFullYear();
      const { data: numero } = await supabase.rpc('fn_gerar_numero_financeiro', {
        p_tipo: 'solicitacao',
        p_exercicio: exercicio,
      });
      
      const numeroGerado = numero || `SOL-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('fin_solicitacoes')
        .insert({
          numero: numeroGerado,
          exercicio,
          data_solicitacao: dados.data_solicitacao || new Date().toISOString().split('T')[0],
          unidade_solicitante_id: dados.unidade_solicitante_id!,
          tipo_despesa: dados.tipo_despesa!,
          objeto: dados.objeto!,
          justificativa: dados.justificativa!,
          valor_estimado: dados.valor_estimado!,
          status: 'rascunho' as const,
          servidor_solicitante_id: dados.servidor_solicitante_id,
          dotacao_sugerida_id: dados.dotacao_sugerida_id,
          fornecedor_id: dados.fornecedor_id,
          contrato_id: dados.contrato_id,
          processo_licitatorio_id: dados.processo_licitatorio_id,
          prioridade: dados.prioridade || 'normal',
          prazo_execucao: dados.prazo_execucao,
          observacoes: dados.observacoes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logCreate('fin_solicitacoes', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_solicitacoes'] });
      toast({ title: 'Solicitação criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao criar solicitação', 
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===========================================
// EMPENHOS
// ===========================================

export function useEmpenhos(filtros?: { status?: string; exercicio?: number }) {
  const ano = filtros?.exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_empenhos', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fin_empenhos')
        .select(`
          *,
          dotacao:fin_dotacoes(id, codigo_dotacao, saldo_disponivel),
          fornecedor:fornecedores(id, razao_social, cnpj_cpf),
          natureza_despesa:fin_naturezas_despesa(id, codigo, nome),
          fonte_recurso:fin_fontes_recurso(id, codigo, nome)
        `)
        .eq('exercicio', ano)
        .order('data_empenho', { ascending: false });
      
      if (filtros?.status) {
        query = query.eq('status', filtros.status as any);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Empenho[];
    },
  });
}

export function useCriarEmpenho() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();
  
  return useMutation({
    mutationFn: async (dados: Partial<Empenho>) => {
      const exercicio = dados.exercicio || new Date().getFullYear();
      
      // Gerar número
      const { data: numero } = await supabase.rpc('fn_gerar_numero_financeiro', {
        p_tipo: 'empenho',
        p_exercicio: exercicio,
      });
      
      const numeroGerado = numero || `NE-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('fin_empenhos')
        .insert({
          numero: numeroGerado,
          exercicio,
          data_empenho: dados.data_empenho || new Date().toISOString().split('T')[0],
          dotacao_id: dados.dotacao_id!,
          fornecedor_id: dados.fornecedor_id!,
          objeto: dados.objeto!,
          valor_empenhado: dados.valor_empenhado!,
          tipo: dados.tipo || 'ordinario',
          status: 'emitido' as const,
          solicitacao_id: dados.solicitacao_id,
          contrato_id: dados.contrato_id,
          natureza_despesa_id: dados.natureza_despesa_id,
          fonte_recurso_id: dados.fonte_recurso_id,
          processo_sei: dados.processo_sei,
          observacoes: dados.observacoes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logCreate('fin_empenhos', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      queryClient.invalidateQueries({ queryKey: ['fin_dotacoes'] });
      queryClient.invalidateQueries({ queryKey: ['fin_resumo_orcamentario'] });
      toast({ title: 'Empenho emitido com sucesso' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao emitir empenho', 
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===========================================
// LIQUIDAÇÕES
// ===========================================

export function useLiquidacoes(filtros?: { status?: string; empenho_id?: string }) {
  return useQuery({
    queryKey: ['fin_liquidacoes', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fin_liquidacoes')
        .select(`
          *,
          empenho:fin_empenhos(
            id, numero, objeto,
            fornecedor:fornecedores(id, razao_social)
          )
        `)
        .order('data_liquidacao', { ascending: false });
      
      if (filtros?.status) {
        query = query.eq('status', filtros.status as any);
      }
      
      if (filtros?.empenho_id) {
        query = query.eq('empenho_id', filtros.empenho_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Liquidacao[];
    },
  });
}

export function useCriarLiquidacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();
  
  return useMutation({
    mutationFn: async (dados: Partial<Liquidacao>) => {
      const exercicio = dados.exercicio || new Date().getFullYear();
      
      const { data: numero } = await supabase.rpc('fn_gerar_numero_financeiro', {
        p_tipo: 'liquidacao',
        p_exercicio: exercicio,
      });
      
      const numeroGerado = numero || `NL-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('fin_liquidacoes')
        .insert({
          numero: numeroGerado,
          exercicio,
          data_liquidacao: dados.data_liquidacao || new Date().toISOString().split('T')[0],
          empenho_id: dados.empenho_id!,
          tipo_documento: dados.tipo_documento!,
          numero_documento: dados.numero_documento!,
          data_documento: dados.data_documento!,
          valor_documento: dados.valor_documento!,
          valor_liquidado: dados.valor_liquidado!,
          status: 'pendente' as const,
          serie_documento: dados.serie_documento,
          chave_nfe: dados.chave_nfe,
          valor_retencoes: dados.valor_retencoes,
          retencao_inss: dados.retencao_inss,
          retencao_irrf: dados.retencao_irrf,
          retencao_iss: dados.retencao_iss,
          outras_retencoes: dados.outras_retencoes,
          observacoes: dados.observacoes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logCreate('fin_liquidacoes', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_liquidacoes'] });
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      toast({ title: 'Liquidação registrada com sucesso' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao registrar liquidação', 
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===========================================
// PAGAMENTOS
// ===========================================

export function usePagamentos(filtros?: { status?: string; exercicio?: number }) {
  const ano = filtros?.exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_pagamentos', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fin_pagamentos')
        .select(`
          *,
          liquidacao:fin_liquidacoes(id, numero, valor_liquidado),
          empenho:fin_empenhos(id, numero, objeto),
          conta_bancaria:fin_contas_bancarias(id, nome_conta, banco_nome),
          fornecedor:fornecedores(id, razao_social)
        `)
        .eq('exercicio', ano)
        .order('data_pagamento', { ascending: false });
      
      if (filtros?.status) {
        query = query.eq('status', filtros.status as any);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Pagamento[];
    },
  });
}

export function useCriarPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();
  
  return useMutation({
    mutationFn: async (dados: Partial<Pagamento>) => {
      const exercicio = dados.exercicio || new Date().getFullYear();
      
      const { data: numero } = await supabase.rpc('fn_gerar_numero_financeiro', {
        p_tipo: 'pagamento',
        p_exercicio: exercicio,
      });
      
      const numeroGerado = numero || `OP-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('fin_pagamentos')
        .insert({
          numero: numeroGerado,
          exercicio,
          data_pagamento: dados.data_pagamento || new Date().toISOString().split('T')[0],
          liquidacao_id: dados.liquidacao_id!,
          empenho_id: dados.empenho_id!,
          conta_bancaria_id: dados.conta_bancaria_id!,
          valor_bruto: dados.valor_bruto!,
          forma_pagamento: dados.forma_pagamento!,
          status: 'programado' as const,
          fornecedor_id: dados.fornecedor_id,
          banco_favorecido: dados.banco_favorecido,
          agencia_favorecido: dados.agencia_favorecido,
          conta_favorecido: dados.conta_favorecido,
          tipo_conta_favorecido: dados.tipo_conta_favorecido,
          valor_retencoes: dados.valor_retencoes,
          identificador_transacao: dados.identificador_transacao,
          observacoes: dados.observacoes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logCreate('fin_pagamentos', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['fin_liquidacoes'] });
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      toast({ title: 'Pagamento programado com sucesso' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao programar pagamento', 
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===========================================
// CONTAS BANCÁRIAS
// ===========================================

export function useContasBancarias() {
  return useQuery({
    queryKey: ['fin_contas_bancarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_contas_bancarias')
        .select(`
          *,
          fonte_recurso:fin_fontes_recurso(id, codigo, nome),
          responsavel:servidores(id, nome_completo)
        `)
        .eq('ativo', true)
        .order('nome_conta');
      
      if (error) throw error;
      return data as unknown as ContaBancaria[];
    },
  });
}

// ===========================================
// ADIANTAMENTOS
// ===========================================

export function useAdiantamentos(filtros?: { status?: string; servidor_id?: string }) {
  return useQuery({
    queryKey: ['fin_adiantamentos', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fin_adiantamentos')
        .select(`
          *,
          servidor_suprido:servidores(id, nome_completo, cpf),
          unidade:estrutura_organizacional(id, nome, sigla),
          empenho:fin_empenhos(id, numero)
        `)
        .order('data_solicitacao', { ascending: false });
      
      if (filtros?.status) {
        query = query.eq('status', filtros.status as any);
      }
      
      if (filtros?.servidor_id) {
        query = query.eq('servidor_suprido_id', filtros.servidor_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Adiantamento[];
    },
  });
}

// ===========================================
// RECEITAS
// ===========================================

export function useReceitas(exercicio?: number) {
  const ano = exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_receitas', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_receitas')
        .select(`
          *,
          fonte_recurso:fin_fontes_recurso(id, codigo, nome),
          conta_bancaria:fin_contas_bancarias(id, nome_conta, banco_nome)
        `)
        .eq('exercicio', ano)
        .order('data_receita', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Receita[];
    },
  });
}

// ===========================================
// CADASTROS BASE
// ===========================================

export function useFontesRecurso() {
  return useQuery({
    queryKey: ['fin_fontes_recurso'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_fontes_recurso')
        .select('*')
        .eq('ativo', true)
        .order('codigo');
      
      if (error) throw error;
      return data as FonteRecurso[];
    },
  });
}

export function useNaturezasDespesa() {
  return useQuery({
    queryKey: ['fin_naturezas_despesa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_naturezas_despesa')
        .select('*')
        .eq('ativo', true)
        .order('codigo');
      
      if (error) throw error;
      return data as NaturezaDespesa[];
    },
  });
}

// ===========================================
// DASHBOARD
// ===========================================

export function useDashboardFinanceiro(exercicio?: number) {
  const ano = exercicio || new Date().getFullYear();
  
  const resumoOrcamentario = useResumoOrcamentario(ano);
  const contasBancarias = useContasBancarias();
  
  // Pagamentos pendentes
  const pagamentosPendentes = useQuery({
    queryKey: ['fin_pagamentos_pendentes', ano],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fin_pagamentos')
        .select('*', { count: 'exact', head: true })
        .eq('exercicio', ano)
        .eq('status', 'programado');
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  // Adiantamentos com prestação pendente
  const adiantamentosPendentes = useQuery({
    queryKey: ['fin_adiantamentos_pendentes'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fin_adiantamentos')
        .select('*', { count: 'exact', head: true })
        .in('status', ['em_uso', 'prestacao_pendente', 'bloqueado']);
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  // Solicitações pendentes de análise
  const solicitacoesPendentes = useQuery({
    queryKey: ['fin_solicitacoes_pendentes', ano],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fin_solicitacoes')
        .select('*', { count: 'exact', head: true })
        .eq('exercicio', ano)
        .in('status', ['pendente_analise', 'em_analise']);
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  return {
    resumoOrcamentario,
    contasBancarias,
    pagamentosPendentes,
    adiantamentosPendentes,
    solicitacoesPendentes,
    loading: resumoOrcamentario.isLoading || contasBancarias.isLoading,
  };
}
