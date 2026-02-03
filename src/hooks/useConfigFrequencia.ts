/**
 * ============================================
 * HOOK DE CONFIGURAÇÃO DE FREQUÊNCIA PARAMETRIZADA
 * ============================================
 * 
 * Hook centralizado para obter configurações de frequência do banco de dados.
 * Implementa fallback seguro para valores padrão caso a configuração não exista.
 * 
 * REGRAS DE FALLBACK:
 * 1. Buscar configuração do servidor específico
 * 2. Se não existir, buscar configuração da unidade
 * 3. Se não existir, buscar configuração do órgão (padrão)
 * 4. Se nenhuma existir, usar valores hardcoded com warning técnico
 * 
 * @author Sistema IDJUV
 * @version 1.0.0
 * @date 02/02/2026
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  ConfigJornadaPadrao, 
  RegimeTrabalho, 
  TipoAbono,
  ConfigCompensacao,
  DiaNaoUtil 
} from "@/types/frequencia";

// ============================================
// CONSTANTES DE FALLBACK (valores legados)
// ============================================

/** 
 * Jornada padrão de fallback
 * AVISO: Usado apenas se não houver configuração no banco
 */
export const FALLBACK_JORNADA: ConfigJornadaPadrao = {
  id: 'fallback-6h',
  nome: 'Jornada Padrão 6h (Fallback)',
  descricao: 'Configuração de fallback - configure no banco de dados',
  carga_horaria_diaria: 6,
  carga_horaria_semanal: 30,
  entrada_manha: '08:00',
  saida_manha: '14:00',
  entrada_tarde: undefined,
  saida_tarde: undefined,
  intervalo_minimo: 0,
  intervalo_maximo: 0,
  intervalo_obrigatorio: false,
  intervalo_remunerado: false,
  tolerancia_atraso: 10,
  tolerancia_saida_antecipada: 10,
  tolerancia_intervalo: 0,
  banco_tolerancia_diario: false,
  banco_tolerancia_mensal: false,
  escopo: 'orgao',
  ativo: true,
  padrao: true,
};

/**
 * Jornada 8h de fallback
 */
export const FALLBACK_JORNADA_8H: ConfigJornadaPadrao = {
  id: 'fallback-8h',
  nome: 'Jornada 8h (Fallback)',
  descricao: 'Configuração de fallback para 8h',
  carga_horaria_diaria: 8,
  carga_horaria_semanal: 40,
  entrada_manha: '08:00',
  saida_manha: '12:00',
  entrada_tarde: '14:00',
  saida_tarde: '18:00',
  intervalo_minimo: 60,
  intervalo_maximo: 120,
  intervalo_obrigatorio: true,
  intervalo_remunerado: false,
  tolerancia_atraso: 10,
  tolerancia_saida_antecipada: 10,
  tolerancia_intervalo: 15,
  banco_tolerancia_diario: false,
  banco_tolerancia_mensal: false,
  escopo: 'orgao',
  ativo: true,
  padrao: false,
};

/**
 * Regime de trabalho padrão de fallback
 */
export const FALLBACK_REGIME: RegimeTrabalho = {
  id: 'fallback-presencial',
  codigo: 'PRESENCIAL',
  nome: 'Presencial (Fallback)',
  descricao: 'Regime presencial padrão',
  tipo: 'presencial',
  dias_trabalho: [1, 2, 3, 4, 5], // Seg-Sex
  exige_registro_ponto: true,
  exige_assinatura_servidor: true,
  exige_validacao_chefia: true,
  permite_ponto_remoto: false,
  exige_localizacao: false,
  exige_foto: false,
  ativo: true,
};

/**
 * Compensação padrão de fallback
 */
export const FALLBACK_COMPENSACAO: ConfigCompensacao = {
  id: 'fallback-compensacao',
  nome: 'Compensação Padrão (Fallback)',
  permite_banco_horas: true,
  compensacao_automatica: false,
  compensacao_manual: true,
  prazo_compensar_dias: 60,
  limite_acumulo_horas: 40,
  limite_horas_extras_dia: 2,
  limite_horas_extras_mes: 20,
  quem_autoriza: 'chefia',
  exibe_na_frequencia: true,
  exibe_na_impressao: true,
  aplicar_a_todos: true,
  ativo: true,
  padrao: true,
};

/**
 * Tipos de abono padrão de fallback
 */
export const FALLBACK_TIPOS_ABONO: TipoAbono[] = [
  {
    id: 'fallback-atestado',
    codigo: 'ATESTADO',
    nome: 'Atestado Médico',
    descricao: 'Afastamento por motivo de saúde',
    conta_como_presenca: true,
    exige_documento: true,
    exige_aprovacao_chefia: false,
    exige_aprovacao_rh: true,
    impacto_horas: 'neutro',
    ativo: true,
    ordem: 1,
  },
  {
    id: 'fallback-licenca',
    codigo: 'LICENCA_MEDICA',
    nome: 'Licença Médica',
    descricao: 'Licença para tratamento de saúde',
    conta_como_presenca: true,
    exige_documento: true,
    exige_aprovacao_chefia: false,
    exige_aprovacao_rh: true,
    impacto_horas: 'neutro',
    ativo: true,
    ordem: 2,
  },
  {
    id: 'fallback-servico-externo',
    codigo: 'SERVICO_EXTERNO',
    nome: 'Serviço Externo',
    descricao: 'Ausência para serviço externo',
    conta_como_presenca: true,
    exige_documento: false,
    exige_aprovacao_chefia: true,
    exige_aprovacao_rh: false,
    impacto_horas: 'neutro',
    ativo: true,
    ordem: 3,
  },
];

// ============================================
// LOGGER DE FALLBACK (warnings técnicos)
// ============================================

const logFallbackWarning = (tipo: string, contexto?: string) => {
  console.warn(
    `[FREQUENCIA-CONFIG] Usando fallback para ${tipo}.`,
    contexto ? `Contexto: ${contexto}` : '',
    'Configure os parâmetros no banco de dados.'
  );
};

// ============================================
// HOOKS DE CONFIGURAÇÃO
// ============================================

/**
 * Hook para obter a jornada vigente de um servidor
 * 
 * Hierarquia de resolução:
 * 1. Jornada específica do servidor (servidor_regime.jornada_id)
 * 2. Jornada do cargo do servidor
 * 3. Jornada da unidade do servidor
 * 4. Jornada padrão do órgão
 * 5. Fallback hardcoded
 */
export function useJornadaServidor(
  servidorId: string | undefined,
  cargaHorariaPadrao?: number
) {
  return useQuery({
    queryKey: ["jornada-servidor", servidorId],
    queryFn: async (): Promise<ConfigJornadaPadrao> => {
      if (!servidorId) {
        logFallbackWarning('jornada', 'servidorId não fornecido');
        return cargaHorariaPadrao === 8 ? FALLBACK_JORNADA_8H : FALLBACK_JORNADA;
      }

      try {
        // 1. Buscar regime do servidor (pode ter jornada vinculada)
        const { data: servidorRegime, error: errRegime } = await supabase
          .from("servidor_regime")
          .select(`
            *,
            jornada:jornada_id(*)
          `)
          .eq("servidor_id", servidorId)
          .eq("ativo", true)
          .order("data_inicio", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!errRegime && servidorRegime?.jornada) {
          return servidorRegime.jornada as unknown as ConfigJornadaPadrao;
        }

        // 2. Buscar jornada padrão do órgão
        const { data: jornadaPadrao, error: errPadrao } = await supabase
          .from("config_jornada_padrao")
          .select("*")
          .eq("padrao", true)
          .eq("ativo", true)
          .maybeSingle();

        if (!errPadrao && jornadaPadrao) {
          return jornadaPadrao as ConfigJornadaPadrao;
        }

        // 3. Fallback baseado na carga horária
        logFallbackWarning('jornada', `servidor ${servidorId}`);
        return cargaHorariaPadrao === 8 ? FALLBACK_JORNADA_8H : FALLBACK_JORNADA;
      } catch (error) {
        console.error('[FREQUENCIA-CONFIG] Erro ao buscar jornada:', error);
        logFallbackWarning('jornada', 'erro no banco');
        return cargaHorariaPadrao === 8 ? FALLBACK_JORNADA_8H : FALLBACK_JORNADA;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
}

/**
 * Hook para obter o regime de trabalho vigente de um servidor
 */
export function useRegimeServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["regime-servidor", servidorId],
    queryFn: async (): Promise<RegimeTrabalho> => {
      if (!servidorId) {
        logFallbackWarning('regime', 'servidorId não fornecido');
        return FALLBACK_REGIME;
      }

      try {
        // 1. Buscar regime vinculado ao servidor
        const { data: servidorRegime, error: errRegime } = await supabase
          .from("servidor_regime")
          .select(`
            *,
            regime:regime_id(*)
          `)
          .eq("servidor_id", servidorId)
          .eq("ativo", true)
          .order("data_inicio", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!errRegime && servidorRegime?.regime) {
          return servidorRegime.regime as unknown as RegimeTrabalho;
        }

        // 2. Buscar regime padrão (presencial)
        const { data: regimePadrao, error: errPadrao } = await supabase
          .from("regimes_trabalho")
          .select("*")
          .eq("codigo", "PRESENCIAL")
          .eq("ativo", true)
          .maybeSingle();

        if (!errPadrao && regimePadrao) {
          return regimePadrao as RegimeTrabalho;
        }

        logFallbackWarning('regime', `servidor ${servidorId}`);
        return FALLBACK_REGIME;
      } catch (error) {
        console.error('[FREQUENCIA-CONFIG] Erro ao buscar regime:', error);
        logFallbackWarning('regime', 'erro no banco');
        return FALLBACK_REGIME;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obter todos os tipos de abono ativos
 */
export function useTiposAbonoConfig() {
  return useQuery({
    queryKey: ["tipos-abono-config"],
    queryFn: async (): Promise<TipoAbono[]> => {
      try {
        const { data, error } = await supabase
          .from("tipos_abono")
          .select("*")
          .eq("ativo", true)
          .order("ordem")
          .order("nome");

        if (error) throw error;

        if (data && data.length > 0) {
          return data as TipoAbono[];
        }

        logFallbackWarning('tipos_abono');
        return FALLBACK_TIPOS_ABONO;
      } catch (error) {
        console.error('[FREQUENCIA-CONFIG] Erro ao buscar tipos de abono:', error);
        logFallbackWarning('tipos_abono', 'erro no banco');
        return FALLBACK_TIPOS_ABONO;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obter configuração de compensação vigente
 */
export function useConfigCompensacaoAtiva(unidadeId?: string) {
  return useQuery({
    queryKey: ["config-compensacao-ativa", unidadeId],
    queryFn: async (): Promise<ConfigCompensacao> => {
      try {
        // 1. Buscar configuração específica da unidade
        if (unidadeId) {
          const { data: configUnidade, error: errUnidade } = await supabase
            .from("config_compensacao")
            .select("*")
            .eq("unidade_id", unidadeId)
            .eq("ativo", true)
            .maybeSingle();

          if (!errUnidade && configUnidade) {
            return configUnidade as ConfigCompensacao;
          }
        }

        // 2. Buscar configuração padrão
        const { data: configPadrao, error: errPadrao } = await supabase
          .from("config_compensacao")
          .select("*")
          .eq("padrao", true)
          .eq("ativo", true)
          .maybeSingle();

        if (!errPadrao && configPadrao) {
          return configPadrao as ConfigCompensacao;
        }

        logFallbackWarning('compensacao');
        return FALLBACK_COMPENSACAO;
      } catch (error) {
        console.error('[FREQUENCIA-CONFIG] Erro ao buscar compensação:', error);
        logFallbackWarning('compensacao', 'erro no banco');
        return FALLBACK_COMPENSACAO;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obter dias não úteis de um período
 */
export function useDiasNaoUteisPeriodo(ano: number, mes: number) {
  return useQuery({
    queryKey: ["dias-nao-uteis-periodo", ano, mes],
    queryFn: async (): Promise<DiaNaoUtil[]> => {
      try {
        const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

        const { data, error } = await supabase
          .from("dias_nao_uteis")
          .select("*")
          .gte("data", dataInicio)
          .lte("data", dataFim)
          .eq("ativo", true)
          .order("data");

        if (error) throw error;
        return (data || []) as DiaNaoUtil[];
      } catch (error) {
        console.error('[FREQUENCIA-CONFIG] Erro ao buscar dias não úteis:', error);
        return [];
      }
    },
    enabled: ano > 0 && mes > 0,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// ============================================
// FUNÇÕES SÍNCRONAS DE CÁLCULO
// ============================================

/**
 * Calcula dias úteis considerando feriados e dias não úteis
 * 
 * @param ano - Ano da competência
 * @param mes - Mês da competência (1-12)
 * @param diasNaoUteis - Lista de dias não úteis do período
 * @param diasTrabalho - Dias da semana que são trabalhados (padrão: seg-sex)
 * @returns Número de dias úteis no mês
 */
export function calcularDiasUteisParametrizado(
  ano: number,
  mes: number,
  diasNaoUteis: DiaNaoUtil[],
  diasTrabalho: number[] = [1, 2, 3, 4, 5]
): number {
  let diasUteis = 0;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  
  // Criar set para lookup rápido de dias não úteis
  const diasNaoUteisSet = new Set(
    diasNaoUteis
      .filter(d => d.ativo && !d.conta_frequencia)
      .map(d => d.data)
  );

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = data.getDay();
    const dataStr = data.toISOString().split('T')[0];

    // Verifica se é dia de trabalho E não é dia não útil
    if (diasTrabalho.includes(diaSemana) && !diasNaoUteisSet.has(dataStr)) {
      diasUteis++;
    }
  }

  return diasUteis;
}

/**
 * Calcula horas previstas no mês baseado na jornada
 * 
 * @param diasUteis - Número de dias úteis
 * @param cargaHorariaDiaria - Carga horária diária em horas
 * @returns Horas previstas no mês
 */
export function calcularHorasPrevistas(
  diasUteis: number,
  cargaHorariaDiaria: number
): number {
  return diasUteis * cargaHorariaDiaria;
}

/**
 * Verifica se um registro de ponto está dentro da tolerância
 * 
 * @param horaRegistro - Hora registrada (formato HH:mm)
 * @param horaEsperada - Hora esperada (formato HH:mm)
 * @param toleranciaMinutos - Tolerância em minutos
 * @param tipo - 'entrada' ou 'saida'
 * @returns true se está dentro da tolerância
 */
export function verificarTolerancia(
  horaRegistro: string,
  horaEsperada: string,
  toleranciaMinutos: number,
  tipo: 'entrada' | 'saida'
): boolean {
  const [hReg, mReg] = horaRegistro.split(':').map(Number);
  const [hEsp, mEsp] = horaEsperada.split(':').map(Number);
  
  const minRegistro = hReg * 60 + mReg;
  const minEsperado = hEsp * 60 + mEsp;
  const diferenca = minRegistro - minEsperado;

  if (tipo === 'entrada') {
    // Entrada: tolerância para atraso (positivo)
    return diferenca <= toleranciaMinutos;
  } else {
    // Saída: tolerância para saída antecipada (negativo)
    return diferenca >= -toleranciaMinutos;
  }
}

/**
 * Calcula horas trabalhadas em um dia
 * 
 * @param entrada1 - Entrada 1º turno
 * @param saida1 - Saída 1º turno
 * @param entrada2 - Entrada 2º turno (opcional)
 * @param saida2 - Saída 2º turno (opcional)
 * @returns Horas trabalhadas (decimal)
 */
export function calcularHorasDia(
  entrada1?: string,
  saida1?: string,
  entrada2?: string,
  saida2?: string
): number {
  let totalMinutos = 0;

  // 1º turno
  if (entrada1 && saida1) {
    const [h1, m1] = entrada1.split(':').map(Number);
    const [h2, m2] = saida1.split(':').map(Number);
    totalMinutos += (h2 * 60 + m2) - (h1 * 60 + m1);
  }

  // 2º turno
  if (entrada2 && saida2) {
    const [h3, m3] = entrada2.split(':').map(Number);
    const [h4, m4] = saida2.split(':').map(Number);
    totalMinutos += (h4 * 60 + m4) - (h3 * 60 + m3);
  }

  return Math.max(0, totalMinutos / 60);
}

/**
 * Determina se servidor usa 1 ou 2 turnos baseado na jornada
 * 
 * REGRA PARAMETRIZADA:
 * - Carga <= 6h: 1 turno (sem intervalo obrigatório)
 * - Carga >= 8h: 2 turnos (com intervalo obrigatório)
 * 
 * @param jornada - Configuração de jornada
 * @returns true se usa 2 turnos
 */
export function usaDoisTurnos(jornada: ConfigJornadaPadrao): boolean {
  // Regra principal: baseada na carga horária
  if (jornada.carga_horaria_diaria >= 8) return true;
  if (jornada.carga_horaria_diaria <= 6) return false;
  
  // Regra secundária: baseada no intervalo obrigatório
  return jornada.intervalo_obrigatorio === true;
}

/**
 * Verifica se um tipo de abono conta como presença
 * 
 * @param codigoAbono - Código do tipo de abono
 * @param tiposAbono - Lista de tipos de abono configurados
 * @returns true se conta como presença
 */
export function abonoContaPresenca(
  codigoAbono: string,
  tiposAbono: TipoAbono[]
): boolean {
  const tipo = tiposAbono.find(t => t.codigo === codigoAbono);
  return tipo?.conta_como_presenca ?? false;
}
