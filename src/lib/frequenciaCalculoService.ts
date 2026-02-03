/**
 * ============================================
 * SERVIÇO DE CÁLCULO DE FREQUÊNCIA PARAMETRIZADO
 * ============================================
 * 
 * Centraliza toda a lógica de cálculo de frequência, consumindo
 * configurações do banco de dados com fallback seguro.
 * 
 * PRINCÍPIOS:
 * 1. Todas as regras vêm do banco de dados
 * 2. Fallback para valores legados se config não existir
 * 3. Log técnico (não visível ao usuário) quando usar fallback
 * 4. Compatibilidade total com dados existentes
 * 
 * @author Sistema IDJUV
 * @version 1.0.0
 * @date 02/02/2026
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  ConfigJornadaPadrao,
  RegimeTrabalho,
  TipoAbono,
  ConfigCompensacao,
  DiaNaoUtil,
} from "@/types/frequencia";
import {
  FALLBACK_JORNADA,
  FALLBACK_JORNADA_8H,
  FALLBACK_REGIME,
  FALLBACK_COMPENSACAO,
  FALLBACK_TIPOS_ABONO,
  calcularDiasUteisParametrizado,
  calcularHorasDia,
  usaDoisTurnos,
  abonoContaPresenca,
} from "@/hooks/useConfigFrequencia";

// ============================================
// TIPOS DO SERVIÇO
// ============================================

export interface ConfigFrequenciaCompleta {
  jornada: ConfigJornadaPadrao;
  regime: RegimeTrabalho;
  compensacao: ConfigCompensacao;
  tiposAbono: TipoAbono[];
  diasNaoUteis: DiaNaoUtil[];
  usouFallback: boolean;
  fallbackDetalhes: string[];
}

export interface CalculoResumoMensal {
  diasUteis: number;
  diasTrabalhados: number;
  horasPrevistas: number;
  horasTrabalhadas: number;
  faltas: number;
  atrasos: number;
  horasExtras: number;
  abonos: Record<string, number>;
  percentualPresenca: number;
}

export interface RegistroDiaCalculo {
  data: string;
  diaSemana: number;
  situacao: 'util' | 'feriado' | 'domingo' | 'sabado' | 'ponto_facultativo' | 'recesso' | 'licenca' | 'ferias';
  label?: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  horasTrabalhadas: number;
  horasPrevistas: number;
  atraso: number;
  saidaAntecipada: number;
  tipoRegistro?: string;
  observacao?: string;
}

// ============================================
// FUNÇÕES DE BUSCA DE CONFIGURAÇÃO
// ============================================

/**
 * Busca todas as configurações necessárias para cálculo de frequência
 * de um servidor específico em um período.
 * 
 * @param servidorId - ID do servidor
 * @param ano - Ano da competência
 * @param mes - Mês da competência
 * @param cargaHorariaPadrao - Carga horária do servidor (fallback)
 */
export async function buscarConfigFrequenciaServidor(
  servidorId: string,
  ano: number,
  mes: number,
  cargaHorariaPadrao?: number
): Promise<ConfigFrequenciaCompleta> {
  const fallbackDetalhes: string[] = [];
  let usouFallback = false;

  // 1. JORNADA
  let jornada: ConfigJornadaPadrao;
  try {
    // Tentar buscar regime do servidor com jornada
    const { data: servidorRegime } = await supabase
      .from("servidor_regime")
      .select(`*, jornada:jornada_id(*)`)
      .eq("servidor_id", servidorId)
      .eq("ativo", true)
      .order("data_inicio", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (servidorRegime?.jornada) {
      jornada = servidorRegime.jornada as unknown as ConfigJornadaPadrao;
    } else {
      // Buscar jornada padrão
      const { data: jornadaPadrao } = await supabase
        .from("config_jornada_padrao")
        .select("*")
        .eq("padrao", true)
        .eq("ativo", true)
        .maybeSingle();

      if (jornadaPadrao) {
        jornada = jornadaPadrao as ConfigJornadaPadrao;
      } else {
        usouFallback = true;
        fallbackDetalhes.push('jornada');
        jornada = cargaHorariaPadrao === 8 ? FALLBACK_JORNADA_8H : FALLBACK_JORNADA;
        console.warn('[FREQUENCIA-CALCULO] Fallback: jornada não encontrada no banco');
      }
    }
  } catch (error) {
    usouFallback = true;
    fallbackDetalhes.push('jornada (erro)');
    jornada = cargaHorariaPadrao === 8 ? FALLBACK_JORNADA_8H : FALLBACK_JORNADA;
    console.error('[FREQUENCIA-CALCULO] Erro ao buscar jornada:', error);
  }

  // 2. REGIME
  let regime: RegimeTrabalho;
  try {
    const { data: servidorRegime } = await supabase
      .from("servidor_regime")
      .select(`*, regime:regime_id(*)`)
      .eq("servidor_id", servidorId)
      .eq("ativo", true)
      .order("data_inicio", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (servidorRegime?.regime) {
      regime = servidorRegime.regime as unknown as RegimeTrabalho;
    } else {
      const { data: regimePadrao } = await supabase
        .from("regimes_trabalho")
        .select("*")
        .eq("codigo", "PRESENCIAL")
        .eq("ativo", true)
        .maybeSingle();

      if (regimePadrao) {
        regime = regimePadrao as RegimeTrabalho;
      } else {
        usouFallback = true;
        fallbackDetalhes.push('regime');
        regime = FALLBACK_REGIME;
        console.warn('[FREQUENCIA-CALCULO] Fallback: regime não encontrado no banco');
      }
    }
  } catch (error) {
    usouFallback = true;
    fallbackDetalhes.push('regime (erro)');
    regime = FALLBACK_REGIME;
    console.error('[FREQUENCIA-CALCULO] Erro ao buscar regime:', error);
  }

  // 3. COMPENSAÇÃO
  let compensacao: ConfigCompensacao;
  try {
    const { data: configPadrao } = await supabase
      .from("config_compensacao")
      .select("*")
      .eq("padrao", true)
      .eq("ativo", true)
      .maybeSingle();

    if (configPadrao) {
      compensacao = configPadrao as ConfigCompensacao;
    } else {
      usouFallback = true;
      fallbackDetalhes.push('compensacao');
      compensacao = FALLBACK_COMPENSACAO;
      console.warn('[FREQUENCIA-CALCULO] Fallback: compensação não encontrada no banco');
    }
  } catch (error) {
    usouFallback = true;
    fallbackDetalhes.push('compensacao (erro)');
    compensacao = FALLBACK_COMPENSACAO;
    console.error('[FREQUENCIA-CALCULO] Erro ao buscar compensação:', error);
  }

  // 4. TIPOS DE ABONO
  let tiposAbono: TipoAbono[];
  try {
    const { data } = await supabase
      .from("tipos_abono")
      .select("*")
      .eq("ativo", true)
      .order("ordem");

    if (data && data.length > 0) {
      tiposAbono = data as TipoAbono[];
    } else {
      usouFallback = true;
      fallbackDetalhes.push('tipos_abono');
      tiposAbono = FALLBACK_TIPOS_ABONO;
      console.warn('[FREQUENCIA-CALCULO] Fallback: tipos de abono não encontrados');
    }
  } catch (error) {
    usouFallback = true;
    fallbackDetalhes.push('tipos_abono (erro)');
    tiposAbono = FALLBACK_TIPOS_ABONO;
    console.error('[FREQUENCIA-CALCULO] Erro ao buscar tipos de abono:', error);
  }

  // 5. DIAS NÃO ÚTEIS
  let diasNaoUteis: DiaNaoUtil[] = [];
  try {
    const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

    const { data } = await supabase
      .from("dias_nao_uteis")
      .select("*")
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .eq("ativo", true);

    diasNaoUteis = (data || []) as DiaNaoUtil[];
  } catch (error) {
    console.error('[FREQUENCIA-CALCULO] Erro ao buscar dias não úteis:', error);
    // Não é fallback crítico, apenas vazio
  }

  return {
    jornada,
    regime,
    compensacao,
    tiposAbono,
    diasNaoUteis,
    usouFallback,
    fallbackDetalhes,
  };
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula o resumo mensal de frequência de um servidor
 * baseado nas configurações parametrizadas.
 * 
 * @param servidorId - ID do servidor
 * @param ano - Ano da competência
 * @param mes - Mês da competência
 * @param registros - Registros de ponto do período
 * @param cargaHorariaPadrao - Carga horária do servidor (fallback)
 */
export async function calcularResumoMensalParametrizado(
  servidorId: string,
  ano: number,
  mes: number,
  registros: Array<{
    data: string;
    tipo: string;
    entrada1?: string;
    saida1?: string;
    entrada2?: string;
    saida2?: string;
    observacao?: string;
  }>,
  cargaHorariaPadrao?: number
): Promise<CalculoResumoMensal & { config: ConfigFrequenciaCompleta }> {
  // Buscar configurações
  const config = await buscarConfigFrequenciaServidor(
    servidorId,
    ano,
    mes,
    cargaHorariaPadrao
  );

  const { jornada, regime, tiposAbono, diasNaoUteis } = config;

  // Calcular dias úteis com parâmetros
  const diasTrabalho = regime.dias_trabalho || [1, 2, 3, 4, 5];
  const diasUteis = calcularDiasUteisParametrizado(ano, mes, diasNaoUteis, diasTrabalho);

  // Inicializar contadores
  let diasTrabalhados = 0;
  let horasTrabalhadas = 0;
  let faltas = 0;
  let atrasos = 0;
  const abonos: Record<string, number> = {};

  // Processar registros
  for (const registro of registros) {
    const tipo = registro.tipo;

    switch (tipo) {
      case 'normal':
        diasTrabalhados++;
        horasTrabalhadas += calcularHorasDia(
          registro.entrada1,
          registro.saida1,
          registro.entrada2,
          registro.saida2
        );
        break;

      case 'falta':
        faltas++;
        break;

      default:
        // Verificar se é um tipo de abono configurado
        const tipoAbono = tiposAbono.find(t => 
          t.codigo.toLowerCase() === tipo.toLowerCase() ||
          t.codigo === tipo.toUpperCase()
        );

        if (tipoAbono) {
          abonos[tipoAbono.codigo] = (abonos[tipoAbono.codigo] || 0) + 1;
          
          // Se conta como presença, incrementar dias trabalhados
          if (tipoAbono.conta_como_presenca) {
            diasTrabalhados++;
            horasTrabalhadas += jornada.carga_horaria_diaria;
          }
        } else {
          // Tipos legados (ferias, licenca, atestado, folga)
          abonos[tipo] = (abonos[tipo] || 0) + 1;
          
          // Tipos que contam como presença (legado)
          if (['atestado', 'ferias', 'licenca', 'folga'].includes(tipo)) {
            diasTrabalhados++;
            horasTrabalhadas += jornada.carga_horaria_diaria;
          }
        }
        break;
    }
  }

  // Calcular horas previstas e extras
  const horasPrevistas = diasUteis * jornada.carga_horaria_diaria;
  const horasExtras = Math.max(0, horasTrabalhadas - horasPrevistas);

  // Calcular percentual de presença
  const percentualPresenca = diasUteis > 0
    ? Math.round((diasTrabalhados / diasUteis) * 1000) / 10
    : 0;

  return {
    diasUteis,
    diasTrabalhados,
    horasPrevistas,
    horasTrabalhadas,
    faltas,
    atrasos,
    horasExtras,
    abonos,
    percentualPresenca,
    config,
  };
}

/**
 * Gera os registros diários para impressão de frequência
 * considerando as configurações parametrizadas.
 * 
 * @param ano - Ano da competência
 * @param mes - Mês da competência
 * @param diasNaoUteis - Dias não úteis do período
 * @param regime - Configuração de regime
 * @param jornada - Configuração de jornada
 */
export function gerarRegistrosDiariosParametrizado(
  ano: number,
  mes: number,
  diasNaoUteis: DiaNaoUtil[],
  regime: RegimeTrabalho,
  jornada: ConfigJornadaPadrao
): RegistroDiaCalculo[] {
  const registros: RegistroDiaCalculo[] = [];
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diasTrabalho = regime.dias_trabalho || [1, 2, 3, 4, 5];

  // Set para lookup rápido
  const diasNaoUteisMap = new Map(
    diasNaoUteis.map(d => [d.data, d])
  );

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = data.getDay();
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // Determinar situação do dia
    let situacao: RegistroDiaCalculo['situacao'] = 'util';
    let label: string | undefined;

    // Verificar dia não útil
    const diaNaoUtil = diasNaoUteisMap.get(dataStr);
    if (diaNaoUtil && diaNaoUtil.ativo) {
      const tipo = diaNaoUtil.tipo;
      if (tipo.includes('feriado')) {
        situacao = 'feriado';
      } else if (tipo === 'ponto_facultativo') {
        situacao = 'ponto_facultativo';
      } else if (tipo === 'recesso') {
        situacao = 'recesso';
      }
      label = diaNaoUtil.nome;
    } else if (diaSemana === 0) {
      situacao = 'domingo';
    } else if (diaSemana === 6) {
      situacao = 'sabado';
    } else if (!diasTrabalho.includes(diaSemana)) {
      // Dia que não é de trabalho conforme regime
      situacao = 'sabado'; // Tratar como não útil
    }

    registros.push({
      data: dataStr,
      diaSemana,
      situacao,
      label,
      horasTrabalhadas: 0,
      horasPrevistas: situacao === 'util' ? jornada.carga_horaria_diaria : 0,
      atraso: 0,
      saidaAntecipada: 0,
    });
  }

  return registros;
}

/**
 * Verifica se a configuração do servidor usa 2 turnos
 * baseado na jornada parametrizada.
 * 
 * @param cargaHorariaDiaria - Carga horária ou configuração de jornada
 */
export function verificarDoisTurnos(
  cargaHorariaDiariaOuJornada: number | ConfigJornadaPadrao
): boolean {
  if (typeof cargaHorariaDiariaOuJornada === 'number') {
    // Compatibilidade: se receber número, usar regra simples
    return cargaHorariaDiariaOuJornada >= 8;
  }
  
  // Se receber configuração completa, usar função parametrizada
  return usaDoisTurnos(cargaHorariaDiariaOuJornada);
}

// ============================================
// EXPORTAÇÕES PARA COMPATIBILIDADE
// ============================================

export {
  calcularDiasUteisParametrizado,
  calcularHorasDia,
  usaDoisTurnos,
  abonoContaPresenca,
};
