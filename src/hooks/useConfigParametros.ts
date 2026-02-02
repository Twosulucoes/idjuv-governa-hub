// ============================================================================
// HOOK: useConfigParametros
// Consumo de parâmetros configuráveis com hierarquia e vigência
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContextoParametro {
  instituicaoId?: string;
  servidorId?: string;
  tipoServidor?: string;
  unidadeId?: string;
  dataReferencia?: string; // formato YYYY-MM-DD
}

interface ConfigInstitucional {
  id: string;
  codigo: string;
  nome: string;
  nomeFatasia?: string;
  cnpj: string;
  endereco?: Record<string, unknown>;
  contato?: Record<string, unknown>;
  expediente?: {
    inicio: string;
    fim: string;
    dias: number[];
    carga_horaria_diaria?: number;
  };
}

/**
 * Hook para consumo de parâmetros configuráveis do sistema.
 * 
 * Este hook fornece acesso à camada de parametrização do RH,
 * permitindo buscar parâmetros com resolução hierárquica e vigência temporal.
 * 
 * Hierarquia de precedência (do mais específico ao mais genérico):
 * 1. Servidor individual
 * 2. Tipo de servidor
 * 3. Unidade
 * 4. Instituição
 * 5. Fallback do sistema
 * 
 * @example
 * ```tsx
 * const { obterParametro, obterInstituicao, loading } = useConfigParametros();
 * 
 * // Buscar jornada padrão
 * const jornada = await obterParametro('FREQ.JORNADA_PADRAO', {
 *   instituicaoId: 'uuid...',
 *   tipoServidor: 'comissionado_idjuv'
 * });
 * 
 * // Buscar instituição atual
 * const instituicao = await obterInstituicao('IDJUV');
 * ```
 */
export function useConfigParametros() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca a instituição padrão (IDJUV) ou por código específico
   */
  const obterInstituicao = useCallback(async (
    codigo: string = 'IDJUV'
  ): Promise<ConfigInstitucional | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('config_institucional')
        .select('*')
        .eq('codigo', codigo)
        .eq('ativo', true)
        .single();

      if (fetchError) {
        // Se não encontrar, retorna null sem erro (tabela pode não ter dados ainda)
        if (fetchError.code === 'PGRST116') {
          return null;
        }
        throw fetchError;
      }

      return {
        id: data.id,
        codigo: data.codigo,
        nome: data.nome,
        nomeFatasia: data.nome_fantasia,
        cnpj: data.cnpj,
        endereco: data.endereco as Record<string, unknown>,
        contato: data.contato as Record<string, unknown>,
        expediente: data.expediente as ConfigInstitucional['expediente'],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar instituição';
      setError(message);
      console.error('Erro ao buscar instituição:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um parâmetro com resolução hierárquica via função RPC
   * 
   * @param codigo - Código do parâmetro (ex: 'FREQ.JORNADA_PADRAO')
   * @param contexto - Contexto para resolução hierárquica
   * @returns Valor do parâmetro em JSONB ou null
   */
  const obterParametro = useCallback(async <T = unknown>(
    codigo: string,
    contexto: ContextoParametro = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      // Se não tiver instituicaoId, buscar a padrão (IDJUV)
      let instituicaoId = contexto.instituicaoId;
      
      if (!instituicaoId) {
        const instituicao = await obterInstituicao('IDJUV');
        if (!instituicao) {
          console.warn('Instituição IDJUV não encontrada, usando fallback');
          return null;
        }
        instituicaoId = instituicao.id;
      }

      const { data, error: rpcError } = await supabase.rpc('obter_parametro_vigente', {
        p_instituicao_id: instituicaoId,
        p_parametro_codigo: codigo,
        p_data_referencia: contexto.dataReferencia || new Date().toISOString().split('T')[0],
        p_servidor_id: contexto.servidorId || null,
        p_tipo_servidor: contexto.tipoServidor || null,
        p_unidade_id: contexto.unidadeId || null,
      });

      if (rpcError) throw rpcError;

      // Se o valor for um objeto com campo "v", extrair o valor
      if (data && typeof data === 'object' && 'v' in data) {
        return data.v as T;
      }

      return data as T;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar parâmetro';
      setError(message);
      console.error(`Erro ao buscar parâmetro ${codigo}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [obterInstituicao]);

  /**
   * Busca um parâmetro simples (retorna string/number diretamente)
   */
  const obterParametroSimples = useCallback(async (
    codigo: string,
    contexto: ContextoParametro = {}
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      let instituicaoId = contexto.instituicaoId;
      
      if (!instituicaoId) {
        const instituicao = await obterInstituicao('IDJUV');
        if (!instituicao) return null;
        instituicaoId = instituicao.id;
      }

      const { data, error: rpcError } = await supabase.rpc('obter_parametro_simples', {
        p_instituicao_id: instituicaoId,
        p_parametro_codigo: codigo,
        p_data_referencia: contexto.dataReferencia || new Date().toISOString().split('T')[0],
        p_servidor_id: contexto.servidorId || null,
        p_tipo_servidor: contexto.tipoServidor || null,
        p_unidade_id: contexto.unidadeId || null,
      });

      if (rpcError) throw rpcError;

      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar parâmetro';
      setError(message);
      console.error(`Erro ao buscar parâmetro simples ${codigo}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [obterInstituicao]);

  /**
   * Lista todos os metadados de parâmetros disponíveis
   */
  const listarParametrosMeta = useCallback(async (dominio?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('config_parametros_meta')
        .select('*')
        .eq('ativo', true)
        .order('dominio')
        .order('ordem');

      if (dominio) {
        query = query.eq('dominio', dominio);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao listar parâmetros';
      setError(message);
      console.error('Erro ao listar parâmetros:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    obterParametro,
    obterParametroSimples,
    obterInstituicao,
    listarParametrosMeta,
    loading,
    error,
  };
}

// ============================================================================
// CONSTANTES DE CÓDIGOS DE PARÂMETROS
// Para uso tipado e evitar erros de digitação
// ============================================================================

export const PARAM_CODES = {
  // Institucional
  INST_NOME: 'INST.NOME',
  INST_CNPJ: 'INST.CNPJ',
  INST_EXPEDIENTE: 'INST.EXPEDIENTE',
  
  // Frequência
  FREQ_JORNADA_PADRAO: 'FREQ.JORNADA_PADRAO',
  FREQ_TOLERANCIA_ATRASO: 'FREQ.TOLERANCIA_ATRASO',
  
  // Folha
  FOLHA_MARGEM_CONSIGNAVEL: 'FOLHA.MARGEM_CONSIGNAVEL',
} as const;

export type ParamCode = typeof PARAM_CODES[keyof typeof PARAM_CODES];
