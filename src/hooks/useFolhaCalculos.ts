/**
 * Hook para cálculos de folha de pagamento usando tabelas dinâmicas do banco
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  calcularINSSProgressivo,
  calcularIRRF,
  calcularEncargosPatronais,
  calcularMargemConsignavel,
  type FaixaINSS,
  type FaixaIRRF,
  type ParametrosFolha,
  type ResultadoCalculoCompleto,
} from '@/lib/folhaCalculos';

// Buscar faixas INSS vigentes
export function useFaixasINSS(dataReferencia?: string) {
  const data = dataReferencia || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['faixas-inss', data],
    queryFn: async () => {
      const { data: faixas, error } = await supabase
        .from('tabela_inss')
        .select('*')
        .lte('vigencia_inicio', data)
        .or(`vigencia_fim.is.null,vigencia_fim.gte.${data}`)
        .order('faixa_ordem');
      if (error) throw error;
      return faixas as FaixaINSS[];
    },
  });
}

// Buscar faixas IRRF vigentes
export function useFaixasIRRF(dataReferencia?: string) {
  const data = dataReferencia || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['faixas-irrf', data],
    queryFn: async () => {
      const { data: faixas, error } = await supabase
        .from('tabela_irrf')
        .select('*')
        .lte('vigencia_inicio', data)
        .or(`vigencia_fim.is.null,vigencia_fim.gte.${data}`)
        .order('faixa_ordem');
      if (error) throw error;
      return faixas.map(f => ({
        ...f,
        aliquota: Number(f.aliquota) * 100, // Converter de decimal para percentual
        parcela_deduzir: Number(f.parcela_deduzir),
      })) as FaixaIRRF[];
    },
  });
}

// Buscar parâmetros da folha
export function useParametrosFolha(dataReferencia?: string) {
  const data = dataReferencia || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['parametros-folha', data],
    queryFn: async () => {
      const { data: params, error } = await supabase
        .from('parametros_folha')
        .select('*')
        .eq('ativo', true)
        .lte('vigencia_inicio', data)
        .or(`vigencia_fim.is.null,vigencia_fim.gte.${data}`);
      if (error) throw error;

      const result: ParametrosFolha & { teto_remuneratorio?: number } = {};
      for (const p of params || []) {
        const valor = Number(p.valor);
        switch (p.tipo_parametro) {
          case 'salario_minimo': result.salario_minimo = valor; break;
          case 'teto_inss': result.teto_inss = valor; break;
          case 'deducao_dependente_irrf': result.valor_dependente_irrf = valor; break;
          case 'margem_consignavel': result.margem_consignavel_percentual = valor * 100; break;
          case 'inss_patronal_aliquota': result.aliquota_inss_patronal = valor * 100; break;
          case 'teto_remuneratorio': result.teto_remuneratorio = valor; break;
        }
      }
      return result;
    },
  });
}

// Validar teto remuneratório via função do banco
export function useValidarTetoRemuneratorio(remuneracaoBruta: number) {
  return useQuery({
    queryKey: ['validar-teto', remuneracaoBruta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_validar_teto_remuneratorio', {
        p_remuneracao_bruta: remuneracaoBruta,
      });
      if (error) throw error;
      return data?.[0] as {
        dentro_teto: boolean;
        valor_teto: number;
        valor_excedente: number;
        percentual_teto: number;
      } | undefined;
    },
    enabled: remuneracaoBruta > 0,
  });
}

// Calcular 13º proporcional via função do banco
export function useCalcular13Proporcional(servidorId: string, ano: number, remuneracaoBase: number) {
  return useQuery({
    queryKey: ['calcular-13', servidorId, ano, remuneracaoBase],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_calcular_13_proporcional', {
        p_servidor_id: servidorId,
        p_ano: ano,
        p_remuneracao_base: remuneracaoBase,
      });
      if (error) throw error;
      return data?.[0] as {
        meses_trabalhados: number;
        valor_proporcional: number;
        valor_integral: number;
      } | undefined;
    },
    enabled: !!servidorId && remuneracaoBase > 0,
  });
}

// Calcular férias via função do banco
export function useCalcularFerias(remuneracaoBase: number, diasFerias: number = 30) {
  return useQuery({
    queryKey: ['calcular-ferias', remuneracaoBase, diasFerias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_calcular_ferias', {
        p_remuneracao_base: remuneracaoBase,
        p_dias_ferias: diasFerias,
      });
      if (error) throw error;
      return data?.[0] as {
        valor_ferias: number;
        terco_constitucional: number;
        valor_total: number;
        dias: number;
      } | undefined;
    },
    enabled: remuneracaoBase > 0,
  });
}

/**
 * Hook completo: busca tabelas do banco e calcula folha
 */
export function useCalculoFolhaCompleto(
  totalProventos: number,
  outrosDescontos: number,
  quantidadeDependentes: number,
  dataReferencia?: string
) {
  const { data: faixasINSS } = useFaixasINSS(dataReferencia);
  const { data: faixasIRRF } = useFaixasIRRF(dataReferencia);
  const { data: params } = useParametrosFolha(dataReferencia);

  const resultado: ResultadoCalculoCompleto | null =
    faixasINSS && faixasIRRF && params && totalProventos > 0
      ? (() => {
          const inss = calcularINSSProgressivo(totalProventos, faixasINSS, params.teto_inss);
          const irrf = calcularIRRF(
            totalProventos,
            inss.valorTotal,
            quantidadeDependentes,
            faixasIRRF,
            params.valor_dependente_irrf
          );
          const totalDescontos = inss.valorTotal + irrf.valorFinal + outrosDescontos;
          const valorLiquido = totalProventos - totalDescontos;
          const encargos = calcularEncargosPatronais(totalProventos, params);
          const margem = calcularMargemConsignavel(valorLiquido, params.margem_consignavel_percentual);

          return {
            totalProventos,
            totalDescontos: Math.round(totalDescontos * 100) / 100,
            valorLiquido: Math.round(valorLiquido * 100) / 100,
            inss,
            irrf,
            inssPatronal: encargos.inssPatronal,
            rat: encargos.rat,
            outrasEntidades: encargos.outrasEntidades,
            totalEncargosPatronais: encargos.total,
            baseConsignavel: margem.base,
            margemConsignavel: margem.margem,
          };
        })()
      : null;

  return {
    resultado,
    isLoading: !faixasINSS || !faixasIRRF || !params,
    faixasINSS,
    faixasIRRF,
    params,
  };
}
