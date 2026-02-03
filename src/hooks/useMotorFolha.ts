/**
 * ============================================
 * HOOK PARA MOTOR DE CÁLCULO DA FOLHA
 * ============================================
 * 
 * Hook React para integrar o motor de cálculo parametrizado
 * com os componentes da aplicação.
 * 
 * @author Sistema IDJUV
 * @version 1.0.0
 * @date 03/02/2026
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  calcularFolhaServidor,
  calcularFolhaCompleta,
  obterLogs,
  limparLogs,
  configurarMotor,
} from '@/lib/folhaCalculoService';
import type {
  ContextoServidorFolha,
  ParametrosFolhaCalculo,
  ResultadoCalculoServidor,
  ResultadoCalculoFolha,
  LogEntryCalculo,
  ConfiguracaoMotor,
} from '@/types/motorFolha';

// ============================================
// HOOK PARA BUSCAR CONTEXTO DO SERVIDOR
// ============================================

/**
 * Busca o contexto completo de um servidor para cálculo
 */
export function useContextoServidor(servidorId?: string) {
  return useQuery({
    queryKey: ['contexto-servidor-folha', servidorId],
    queryFn: async (): Promise<ContextoServidorFolha | null> => {
      if (!servidorId) return null;

      // Buscar dados do servidor
      const { data: servidor, error } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          pis_pasep,
          data_admissao,
          cargo_atual_id,
          banco_codigo,
          banco_agencia,
          banco_conta,
          banco_tipo_conta
        `)
        .eq('id', servidorId)
        .single();

      if (error) throw error;
      if (!servidor) return null;

      // Buscar cargo e vencimento
      let cargoNome: string | undefined;
      let cargoVencimento: number | undefined;
      let cargoId: string | undefined;

      if (servidor.cargo_atual_id) {
        const { data: cargo } = await supabase
          .from('cargos')
          .select('id, nome, vencimento_base')
          .eq('id', servidor.cargo_atual_id)
          .single();

        if (cargo) {
          cargoId = cargo.id;
          cargoNome = cargo.nome;
          cargoVencimento = cargo.vencimento_base;
        }
      }

      // Buscar lotação atual
      const { data: lotacao } = await supabase
        .from('lotacoes')
        .select(`
          id,
          unidade_id,
          unidade:estrutura_organizacional(id, nome)
        `)
        .eq('servidor_id', servidorId)
        .eq('ativo', true)
        .order('data_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar dependentes IRRF
      const { data: dependentes } = await supabase
        .from('dependentes_irrf')
        .select('id')
        .eq('servidor_id', servidorId)
        .eq('ativo', true)
        .eq('deduz_irrf', true);

      const contexto: ContextoServidorFolha = {
        servidor_id: servidor.id,
        nome_completo: servidor.nome_completo,
        cpf: servidor.cpf,
        matricula: servidor.matricula,
        pis_pasep: servidor.pis_pasep ?? undefined,
        cargo_id: cargoId,
        cargo_nome: cargoNome,
        cargo_vencimento: cargoVencimento,
        lotacao_id: lotacao?.id,
        unidade_id: lotacao?.unidade_id ?? undefined,
        unidade_nome: (lotacao?.unidade as { nome?: string } | null)?.nome,
        tipo_vinculo: 'comissionado',
        carga_horaria: 40,
        data_admissao: servidor.data_admissao ?? undefined,
        banco_codigo: servidor.banco_codigo ?? undefined,
        banco_agencia: servidor.banco_agencia ?? undefined,
        banco_conta: servidor.banco_conta ?? undefined,
        banco_tipo_conta: servidor.banco_tipo_conta ?? undefined,
        quantidade_dependentes_irrf: dependentes?.length || 0,
      };

      return contexto;
    },
    enabled: !!servidorId,
  });
}

// ============================================
// HOOK PARA BUSCAR MÚLTIPLOS CONTEXTOS
// ============================================

/**
 * Busca contexto de múltiplos servidores para cálculo em lote
 */
export function useContextosServidores(servidorIds?: string[]) {
  return useQuery({
    queryKey: ['contextos-servidores-folha', servidorIds],
    queryFn: async (): Promise<ContextoServidorFolha[]> => {
      if (!servidorIds || servidorIds.length === 0) return [];

      // Buscar dados dos servidores
      const { data: servidores, error } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          pis_pasep,
          data_admissao,
          cargo_atual_id,
          banco_codigo,
          banco_agencia,
          banco_conta,
          banco_tipo_conta
        `)
        .in('id', servidorIds);

      if (error) throw error;
      if (!servidores) return [];

      // Buscar cargos
      const cargoIds = servidores
        .map(s => s.cargo_atual_id)
        .filter(Boolean) as string[];

      const { data: cargos } = await supabase
        .from('cargos')
        .select('id, nome, vencimento_base')
        .in('id', cargoIds);

      const cargosMap = new Map((cargos || []).map(c => [c.id, c]));

      // Buscar lotações
      const { data: lotacoes } = await supabase
        .from('lotacoes')
        .select(`id, servidor_id, unidade_id`)
        .in('servidor_id', servidorIds)
        .eq('ativo', true);

      const lotacoesMap = new Map((lotacoes || []).map(l => [l.servidor_id, l]));

      // Buscar dependentes
      const { data: dependentes } = await supabase
        .from('dependentes_irrf')
        .select('servidor_id')
        .in('servidor_id', servidorIds)
        .eq('ativo', true)
        .eq('deduz_irrf', true);

      const dependentesCount = new Map<string, number>();
      dependentes?.forEach(d => {
        const count = dependentesCount.get(d.servidor_id) || 0;
        dependentesCount.set(d.servidor_id, count + 1);
      });

      // Montar contextos
      return servidores.map(servidor => {
        const cargo = servidor.cargo_atual_id
          ? cargosMap.get(servidor.cargo_atual_id)
          : undefined;
        const lotacao = lotacoesMap.get(servidor.id);

        return {
          servidor_id: servidor.id,
          nome_completo: servidor.nome_completo,
          cpf: servidor.cpf,
          matricula: servidor.matricula,
          pis_pasep: servidor.pis_pasep ?? undefined,
          cargo_id: cargo?.id,
          cargo_nome: cargo?.nome,
          cargo_vencimento: cargo?.vencimento_base,
          lotacao_id: lotacao?.id,
          unidade_id: lotacao?.unidade_id ?? undefined,
          unidade_nome: undefined,
          tipo_vinculo: 'comissionado' as const,
          carga_horaria: 40,
          data_admissao: servidor.data_admissao ?? undefined,
          banco_codigo: servidor.banco_codigo ?? undefined,
          banco_agencia: servidor.banco_agencia ?? undefined,
          banco_conta: servidor.banco_conta ?? undefined,
          banco_tipo_conta: servidor.banco_tipo_conta ?? undefined,
          quantidade_dependentes_irrf: dependentesCount.get(servidor.id) || 0,
        };
      });
    },
    enabled: !!servidorIds && servidorIds.length > 0,
  });
}

// ============================================
// HOOK PRINCIPAL DO MOTOR DE CÁLCULO
// ============================================

interface UseMotorFolhaOptions {
  configuracao?: Partial<ConfiguracaoMotor>;
}

interface UseMotorFolhaReturn {
  // Estado
  isCalculando: boolean;
  ultimoResultado: ResultadoCalculoServidor | null;
  ultimoResultadoFolha: ResultadoCalculoFolha | null;
  logs: LogEntryCalculo[];
  
  // Ações
  calcularServidor: (
    contexto: ContextoServidorFolha,
    ano: number,
    mes: number
  ) => Promise<ResultadoCalculoServidor>;
  
  calcularFolha: (
    contextos: ContextoServidorFolha[],
    ano: number,
    mes: number,
    tipo?: ResultadoCalculoFolha['tipo_folha']
  ) => Promise<ResultadoCalculoFolha>;
  
  limparResultados: () => void;
  obterLogs: () => LogEntryCalculo[];
}

export function useMotorFolha(options?: UseMotorFolhaOptions): UseMotorFolhaReturn {
  const [isCalculando, setIsCalculando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoCalculoServidor | null>(null);
  const [ultimoResultadoFolha, setUltimoResultadoFolha] = useState<ResultadoCalculoFolha | null>(null);
  const [logs, setLogs] = useState<LogEntryCalculo[]>([]);

  // Aplicar configuração
  if (options?.configuracao) {
    configurarMotor(options.configuracao);
  }

  const calcularServidor = useCallback(async (
    contexto: ContextoServidorFolha,
    ano: number,
    mes: number
  ): Promise<ResultadoCalculoServidor> => {
    setIsCalculando(true);
    limparLogs();

    try {
      const parametros: ParametrosFolhaCalculo = {
        competencia_ano: ano,
        competencia_mes: mes,
        data_referencia: `${ano}-${String(mes).padStart(2, '0')}-01`,
        salario_minimo: 1518.00,
        valor_dependente_irrf: 189.59,
        teto_inss: 8157.41,
        aliquota_inss_patronal: 20,
        aliquota_rat: 2,
        aliquota_outras_entidades: 5.8,
        margem_consignavel_percentual: 35,
      };

      const resultado = await calcularFolhaServidor(contexto, parametros);
      
      setUltimoResultado(resultado);
      setLogs(obterLogs());

      if (resultado.usou_fallback) {
        console.warn('[MOTOR-FOLHA] Cálculo usou fallback:', resultado.fallback_detalhes);
      }

      if (resultado.warnings.length > 0) {
        resultado.warnings.forEach(w => console.warn('[MOTOR-FOLHA]', w));
      }

      return resultado;
    } catch (error) {
      console.error('[MOTOR-FOLHA] Erro no cálculo:', error);
      throw error;
    } finally {
      setIsCalculando(false);
    }
  }, []);

  const calcularFolha = useCallback(async (
    contextos: ContextoServidorFolha[],
    ano: number,
    mes: number,
    tipo: ResultadoCalculoFolha['tipo_folha'] = 'mensal'
  ): Promise<ResultadoCalculoFolha> => {
    setIsCalculando(true);
    limparLogs();

    try {
      const resultado = await calcularFolhaCompleta(contextos, ano, mes, tipo);
      
      setUltimoResultadoFolha(resultado);
      setLogs(obterLogs());

      // Notificar se houve erros
      if (resultado.servidores_com_erro > 0) {
        toast.error(`${resultado.servidores_com_erro} servidores com erro no cálculo`);
      }

      // Notificar se houve warnings
      if (resultado.servidores_com_warning > 0) {
        toast.warning(`${resultado.servidores_com_warning} servidores com avisos`);
      }

      return resultado;
    } catch (error) {
      console.error('[MOTOR-FOLHA] Erro no cálculo da folha:', error);
      throw error;
    } finally {
      setIsCalculando(false);
    }
  }, []);

  const limparResultados = useCallback(() => {
    setUltimoResultado(null);
    setUltimoResultadoFolha(null);
    setLogs([]);
    limparLogs();
  }, []);

  const obterLogsAtuais = useCallback(() => {
    return obterLogs();
  }, []);

  return {
    isCalculando,
    ultimoResultado,
    ultimoResultadoFolha,
    logs,
    calcularServidor,
    calcularFolha,
    limparResultados,
    obterLogs: obterLogsAtuais,
  };
}

// ============================================
// HOOK PARA RUBRICAS PARAMETRIZADAS
// ============================================

export function useRubricasParametrizadas(apenasAtivas = true) {
  return useQuery({
    queryKey: ['rubricas-parametrizadas', { apenasAtivas }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_rubricas')
        .select(`
          *,
          tipo:tipo_rubrica_id(codigo, nome, natureza)
        `)
        .eq('ativo', apenasAtivas ? true : undefined)
        .order('ordem_calculo', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// ============================================
// HOOK PARA TIPOS DE RUBRICA
// ============================================

export function useTiposRubrica() {
  return useQuery({
    queryKey: ['tipos-rubrica'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_tipos_rubrica')
        .select('*')
        .eq('ativo', true)
        .order('ordem_exibicao', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// ============================================
// MUTATION PARA PROCESSAR FOLHA
// ============================================

export function useProcessarFolhaCalculada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      folhaId, 
      resultados 
    }: { 
      folhaId: string; 
      resultados: ResultadoCalculoFolha;
    }) => {
      // Atualizar totais da folha
      const { error: erroFolha } = await supabase
        .from('folhas_pagamento')
        .update({
          total_bruto: resultados.total_bruto,
          total_descontos: resultados.total_descontos,
          total_liquido: resultados.total_liquido,
          total_inss_servidor: resultados.total_inss_servidor,
          total_inss_patronal: resultados.total_inss_patronal,
          total_irrf: resultados.total_irrf,
          total_encargos_patronais: resultados.total_encargos_patronais,
          quantidade_servidores: resultados.quantidade_servidores,
          data_processamento: new Date().toISOString(),
          status: 'processando',
        })
        .eq('id', folhaId);

      if (erroFolha) throw erroFolha;

      // Inserir fichas financeiras
      for (const resultado of resultados.servidores) {
        // Verificar se já existe ficha
        const { data: fichaExistente } = await supabase
          .from('fichas_financeiras')
          .select('id')
          .eq('folha_id', folhaId)
          .eq('servidor_id', resultado.servidor_id)
          .maybeSingle();

        const fichaData = {
          folha_id: folhaId,
          servidor_id: resultado.servidor_id,
          cargo_nome: resultado.contexto.cargo_nome,
          cargo_vencimento: resultado.contexto.cargo_vencimento,
          unidade_nome: resultado.contexto.unidade_nome,
          total_proventos: resultado.total_proventos,
          total_descontos: resultado.total_descontos,
          valor_liquido: resultado.valor_liquido,
          base_inss: resultado.base_inss,
          valor_inss: resultado.valor_inss,
          base_irrf: resultado.base_irrf,
          valor_irrf: resultado.valor_irrf,
          inss_patronal: resultado.inss_patronal,
          rat: resultado.rat,
          outras_entidades: resultado.outras_entidades,
          total_encargos: resultado.total_encargos,
          base_consignavel: resultado.base_consignavel,
          margem_consignavel_usada: resultado.margem_utilizada,
          banco_codigo: resultado.contexto.banco_codigo,
          banco_agencia: resultado.contexto.banco_agencia,
          banco_conta: resultado.contexto.banco_conta,
          banco_tipo_conta: resultado.contexto.banco_tipo_conta,
          quantidade_dependentes: resultado.contexto.quantidade_dependentes_irrf,
          processado: true,
          data_processamento: new Date().toISOString(),
        };

        if (fichaExistente) {
          await supabase
            .from('fichas_financeiras')
            .update(fichaData)
            .eq('id', fichaExistente.id);
        } else {
          await supabase
            .from('fichas_financeiras')
            .insert(fichaData);
        }
      }

      return { success: true, folhaId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-financeiras', variables.folhaId] });
      toast.success('Folha processada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao processar folha: ${error.message}`);
    },
  });
}
