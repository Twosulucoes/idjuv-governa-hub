/**
 * Hook principal do Módulo Financeiro
 * Gerencia operações de orçamento, despesas, receitas e contabilidade
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import type {
  Dotacao,
  SolicitacaoDespesa,
  Empenho,
  DocumentoEmpenhoFiplan,
  Liquidacao,
  Pagamento,
  ContaBancaria,
  Adiantamento,
  Receita,
  FonteRecurso,
  NaturezaDespesa,
  ResumoOrcamentario,
} from '@/types/financeiro';
import type { DotacaoPainel, EmpenhoPainel } from '@/lib/financeiro/painelExecucao';

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
    queryKey: ['fin_solicitacoes', ano, filtros?.status ?? null],
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
          objeto: (dados.objeto || '').trim(),
          justificativa: (dados.justificativa || '').trim(),
          valor_estimado: dados.valor_estimado!,
          status: 'rascunho' as const,
          servidor_solicitante_id: dados.servidor_solicitante_id,
          dotacao_sugerida_id: dados.dotacao_sugerida_id,
          fornecedor_id: dados.fornecedor_id,
          contrato_id: dados.contrato_id,
          processo_licitatorio_id: dados.processo_licitatorio_id,
          prioridade: dados.prioridade || 'normal',
          prazo_execucao: dados.prazo_execucao,
          observacoes: (dados.observacoes || '').trim() || undefined,
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

/** Unidades ativas da estrutura organizacional, para o campo "unidade solicitante". */
export function useUnidadesSolicitantes() {
  return useQuery({
    queryKey: ['fin_unidades_solicitantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as { id: string; nome: string; sigla: string | null }[];
    },
  });
}

// ===========================================
// EMPENHOS
// ===========================================

export function useEmpenhos(filtros?: { status?: string; exercicio?: number }) {
  const ano = filtros?.exercicio || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['fin_empenhos', ano, filtros?.status ?? null],
    queryFn: async () => {
      let query = supabase
        .from('fin_empenhos')
        .select(`
          *,
          dotacao:fin_dotacoes(id, codigo_dotacao, saldo_disponivel),
          fornecedor:fornecedores(id, razao_social, cpf_cnpj),
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
          objeto: (dados.objeto || '').trim(),
          valor_empenhado: dados.valor_empenhado!,
          tipo: dados.tipo || 'ordinario',
          status: 'emitido' as const,
          solicitacao_id: dados.solicitacao_id,
          contrato_id: dados.contrato_id,
          natureza_despesa_id: dados.natureza_despesa_id,
          fonte_recurso_id: dados.fonte_recurso_id,
          processo_sei: (dados.processo_sei || '').trim() || undefined,
          observacoes: (dados.observacoes || '').trim() || undefined,
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

/** Empenho com dotação, favorecido, natureza e fonte (tela de detalhe). */
export function useEmpenhoDetalhe(id?: string) {
  return useQuery({
    queryKey: ['fin_empenho', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_empenhos')
        .select(`
          *,
          dotacao:fin_dotacoes(id, codigo_dotacao, idu, saldo_disponivel),
          fornecedor:fornecedores(id, razao_social, cpf_cnpj),
          natureza_despesa:fin_naturezas_despesa(id, codigo, nome),
          fonte_recurso:fin_fontes_recurso(id, codigo, nome)
        `)
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Empenho | null;
    },
  });
}

/** LIQ, NOB, GCV e estornos do FIPLAN de um empenho importado do FIP 614, na ordem do relatório. */
export function useDocumentosEmpenhoFiplan(empenhoId?: string) {
  return useQuery({
    queryKey: ['fin_empenho_documentos_fiplan', empenhoId],
    enabled: !!empenhoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_empenho_documentos_fiplan')
        .select('*')
        .eq('empenho_id', empenhoId!)
        .order('ordem');
      if (error) throw error;
      return data as unknown as DocumentoEmpenhoFiplan[];
    },
  });
}

/**
 * Dotações do QDD em que o empenho do FIPLAN pode cair: mesmos dígitos de função a fonte. O FIP 614 em PDF corta a
 * dotação antes do IDU, então pode haver mais de uma (ex.: recurso livre e emenda na mesma natureza).
 */
export function useDotacoesCandidatasEmpenho(empenho?: Pick<Empenho, 'exercicio' | 'dotacao_fiplan' | 'origem'> | null) {
  const prefixo = empenho?.dotacao_fiplan
    ? empenho.dotacao_fiplan.split('.').slice(2, 9).join('').replace(/\D/g, '')
    : '';
  return useQuery({
    queryKey: ['fin_dotacoes', empenho?.exercicio, 'candidatas', prefixo],
    enabled: empenho?.origem === 'fiplan' && prefixo.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_dotacoes')
        .select('id, codigo_dotacao, idu, natureza_despesa_id, fonte_recurso_id, valor_atual, valor_empenhado')
        .eq('exercicio', empenho!.exercicio);
      if (error) throw error;
      return (data ?? []).filter((d) => d.codigo_dotacao.replace(/\D/g, '').startsWith(prefixo));
    },
  });
}

/** Liga o empenho do FIPLAN a uma das dotações candidatas (com a natureza e a fonte dela). */
export function useDefinirDotacaoEmpenho() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (dados: { empenhoId: string; dotacao: { id: string; natureza_despesa_id: string | null; fonte_recurso_id: string | null } }) => {
      const { error } = await supabase
        .from('fin_empenhos')
        .update({
          dotacao_id: dados.dotacao.id,
          natureza_despesa_id: dados.dotacao.natureza_despesa_id,
          fonte_recurso_id: dados.dotacao.fonte_recurso_id,
        })
        .eq('id', dados.empenhoId)
        .eq('origem', 'fiplan');
      if (error) throw error;
    },
    onSuccess: (_d, dados) => {
      queryClient.invalidateQueries({ queryKey: ['fin_empenho', dados.empenhoId] });
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      toast({ title: 'Dotação do empenho definida' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao definir a dotação', description: error.message, variant: 'destructive' });
    },
  });
}

// ===========================================
// LIQUIDAÇÕES
// ===========================================

/** Sem `exercicio`, traz todos os anos (ex.: liquidação de ano anterior ainda a pagar). */
export function useLiquidacoes(filtros?: { status?: string; empenho_id?: string; exercicio?: number }) {
  return useQuery({
    queryKey: ['fin_liquidacoes', filtros?.exercicio ?? 'todos', filtros?.status ?? null, filtros?.empenho_id ?? null],
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

      if (filtros?.exercicio) {
        query = query.eq('exercicio', filtros.exercicio);
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
          numero_documento: (dados.numero_documento || '').trim(),
          data_documento: dados.data_documento!,
          valor_documento: dados.valor_documento!,
          valor_liquidado: dados.valor_liquidado!,
          status: 'pendente' as const,
          serie_documento: (dados.serie_documento || '').trim() || undefined,
          chave_nfe: (dados.chave_nfe || '').trim() || undefined,
          valor_retencoes: dados.valor_retencoes,
          retencao_inss: dados.retencao_inss,
          retencao_irrf: dados.retencao_irrf,
          retencao_iss: dados.retencao_iss,
          outras_retencoes: dados.outras_retencoes,
          observacoes: (dados.observacoes || '').trim() || undefined,
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
    queryKey: ['fin_pagamentos', ano, filtros?.status ?? null],
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
          banco_favorecido: (dados.banco_favorecido || '').trim() || undefined,
          agencia_favorecido: (dados.agencia_favorecido || '').trim() || undefined,
          conta_favorecido: (dados.conta_favorecido || '').trim() || undefined,
          tipo_conta_favorecido: dados.tipo_conta_favorecido,
          valor_retencoes: dados.valor_retencoes,
          identificador_transacao: dados.identificador_transacao,
          observacoes: (dados.observacoes || '').trim() || undefined,
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

export interface NovaContaBancariaInput {
  banco_codigo: string;
  banco_nome: string;
  agencia: string;
  agencia_digito?: string;
  conta: string;
  conta_digito?: string;
  tipo: ContaBancaria['tipo'];
  nome_conta: string;
}

/** Cadastro de conta bancária (RLS: quem acessa o módulo financeiro). */
export function useCriarContaBancaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();

  return useMutation({
    mutationFn: async (dados: NovaContaBancariaInput) => {
      const { data, error } = await supabase
        .from('fin_contas_bancarias')
        .insert({
          banco_codigo: dados.banco_codigo.trim(),
          banco_nome: dados.banco_nome.trim(),
          agencia: dados.agencia.trim(),
          agencia_digito: dados.agencia_digito?.trim() || null,
          conta: dados.conta.trim(),
          conta_digito: dados.conta_digito?.trim() || null,
          tipo: dados.tipo,
          nome_conta: dados.nome_conta.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logCreate('fin_contas_bancarias', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_contas_bancarias'] });
      toast({ title: 'Conta bancária cadastrada' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar conta bancária',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ===========================================
// ADIANTAMENTOS
// ===========================================

/** Sem `exercicio`, traz todos os anos. */
export function useAdiantamentos(filtros?: { status?: string; servidor_id?: string; exercicio?: number }) {
  return useQuery({
    queryKey: ['fin_adiantamentos', filtros?.exercicio ?? 'todos', filtros?.status ?? null, filtros?.servidor_id ?? null],
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

      if (filtros?.exercicio) {
        query = query.eq('exercicio', filtros.exercicio);
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
// PAINEL DO FINANCEIRO (execução do exercício)
// ===========================================

/** Linhas do painel: dotações ativas (QDD), empenhos com saldo (FIP 614) e data das últimas importações. */
export function usePainelFinanceiro(exercicio: number) {
  const dotacoes = useQuery({
    queryKey: ['fin_painel_dotacoes', exercicio],
    queryFn: async (): Promise<DotacaoPainel[]> => {
      const { data, error } = await supabase
        .from('fin_dotacoes')
        .select(`
          paoe, valor_atual, valor_empenhado, valor_liquidado, valor_pago,
          valor_bloqueado, valor_reserva, valor_ped,
          natureza_despesa:fin_naturezas_despesa(codigo, nome),
          fonte_recurso:fin_fontes_recurso(codigo)
        `)
        .eq('exercicio', exercicio)
        .eq('ativo', true);

      if (error) throw error;
      return (data ?? []).map(({ natureza_despesa, fonte_recurso, ...valores }) => ({
        ...valores,
        natureza: natureza_despesa?.codigo ?? null,
        natureza_nome: natureza_despesa?.nome ?? null,
        fonte: fonte_recurso?.codigo ?? null,
      }));
    },
  });

  const empenhos = useQuery({
    queryKey: ['fin_painel_empenhos', exercicio],
    queryFn: async (): Promise<EmpenhoPainel[]> => {
      const { data, error } = await supabase
        .from('fin_empenhos')
        .select('credor_nome, data_empenho, saldo_liquidar, saldo_pagar, status, fornecedor:fornecedores(razao_social)')
        .eq('exercicio', exercicio)
        .or('saldo_liquidar.gt.0,saldo_pagar.gt.0');

      if (error) throw error;
      return (data ?? []).map((e) => ({
        credor: e.credor_nome ?? e.fornecedor?.razao_social ?? null,
        data_empenho: e.data_empenho,
        saldo_liquidar: e.saldo_liquidar,
        saldo_pagar: e.saldo_pagar,
        status: e.status,
      }));
    },
  });

  const atualizacao = useQuery({
    queryKey: ['fin_painel_atualizacao', exercicio],
    queryFn: async () => {
      // Uma consulta por tipo: reimportações de um não escondem a última do outro
      const ultima = async (tipo: string) => {
        const { data, error } = await supabase
          .from('importacoes')
          .select('created_at')
          .eq('exercicio', exercicio)
          .eq('tipo', tipo)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        return data?.[0]?.created_at ?? null;
      };
      const [qdd, fip614] = await Promise.all([ultima('qdd_fiplan'), ultima('empenhos_fip614')]);
      return { qdd, fip614 };
    },
  });

  return { dotacoes, empenhos, atualizacao };
}

// ===========================================
// IMPORTAÇÕES DO FIPLAN
// ===========================================

export interface UltimaImportacao {
  arquivo_nome: string;
  created_at: string;
}

/** Última importação do QDD do FIPLAN no exercício (null se nunca importado). */
export function useUltimaImportacaoQdd(exercicio: number) {
  return useQuery({
    queryKey: ['importacoes', 'qdd_fiplan', 'ultima', exercicio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('importacoes')
        .select('arquivo_nome, created_at')
        .eq('tipo', 'qdd_fiplan')
        .eq('exercicio', exercicio)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return ((data ?? [])[0] as UltimaImportacao | undefined) ?? null;
    },
  });
}
