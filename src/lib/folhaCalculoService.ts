/**
 * ============================================
 * MOTOR DE CÁLCULO DA FOLHA DE PAGAMENTO
 * ============================================
 * 
 * Serviço centralizado para cálculo de folha de pagamento,
 * consumindo configurações parametrizadas do banco de dados
 * com fallback seguro para regras legadas.
 * 
 * PRINCÍPIOS:
 * 1. Configurações vêm do banco (config_rubricas, config_regras_calculo)
 * 2. Fallback para rubricas legadas se config não existir
 * 3. Log técnico quando usar fallback (não visível ao usuário)
 * 4. Compatibilidade total com dados existentes
 * 5. Resultados auditáveis e rastreáveis
 * 
 * @author Sistema IDJUV
 * @version 1.0.0
 * @date 03/02/2026
 */

import { supabase } from "@/integrations/supabase/client";
import {
  calcularINSSProgressivo,
  calcularIRRF,
  calcularEncargosPatronais,
  calcularMargemConsignavel,
  type FaixaINSS,
  type FaixaIRRF,
  type ParametrosFolha,
} from "./folhaCalculos";
import type {
  ConfigRubrica,
  ConfigRegraCalculo,
  ConfigIncidencia,
  ContextoServidorFolha,
  ParametrosFolhaCalculo,
  ItemCalculoRubrica,
  ResultadoCalculoServidor,
  ResultadoCalculoFolha,
  LogEntryCalculo,
  ConfiguracaoMotor,
  ConsignacaoAtiva,
  FaixaINSSCalculo,
  FaixaIRRFCalculo,
} from "@/types/motorFolha";
import { CONFIG_MOTOR_PADRAO, VERSAO_MOTOR } from "@/types/motorFolha";

// ============================================
// ESTADO DO MOTOR
// ============================================

let logs: LogEntryCalculo[] = [];
let configMotor: ConfiguracaoMotor = { ...CONFIG_MOTOR_PADRAO };

// ============================================
// FUNÇÕES DE LOG
// ============================================

function log(
  level: LogEntryCalculo['level'],
  mensagem: string,
  dados?: Record<string, unknown>,
  servidor_id?: string,
  rubrica_codigo?: string
): void {
  const entry: LogEntryCalculo = {
    timestamp: new Date().toISOString(),
    level,
    servidor_id,
    rubrica_codigo,
    mensagem,
    dados,
  };
  
  logs.push(entry);
  
  if (configMotor.modo_debug || level === 'error') {
    const prefix = `[FOLHA-MOTOR][${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, mensagem, dados || '');
    } else if (level === 'warn') {
      console.warn(prefix, mensagem, dados || '');
    } else if (configMotor.log_detalhado) {
      console.log(prefix, mensagem, dados || '');
    }
  }
}

export function limparLogs(): void {
  logs = [];
}

export function obterLogs(): LogEntryCalculo[] {
  return [...logs];
}

export function configurarMotor(config: Partial<ConfiguracaoMotor>): void {
  configMotor = { ...configMotor, ...config };
}

// ============================================
// FUNÇÕES DE BUSCA DE CONFIGURAÇÃO
// ============================================

/**
 * Busca rubricas ativas e vigentes para a competência
 */
async function buscarRubricasVigentes(
  dataReferencia: string
): Promise<{ rubricas: ConfigRubrica[]; usouFallback: boolean }> {
  try {
    const { data, error } = await supabase
      .from('config_rubricas')
      .select('*')
      .eq('ativo', true)
      .lte('vigencia_inicio', dataReferencia)
      .or(`vigencia_fim.is.null,vigencia_fim.gte.${dataReferencia}`)
      .order('ordem_calculo', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      log('info', `Carregadas ${data.length} rubricas parametrizadas`);
      return { rubricas: data as unknown as ConfigRubrica[], usouFallback: false };
    }

    // Fallback: buscar rubricas legadas
    log('warn', 'Rubricas parametrizadas não encontradas, usando legado');
    return await buscarRubricasLegadas();
  } catch (error) {
    log('error', 'Erro ao buscar rubricas', { error });
    return await buscarRubricasLegadas();
  }
}

/**
 * Fallback para rubricas da tabela legada
 */
async function buscarRubricasLegadas(): Promise<{ rubricas: ConfigRubrica[]; usouFallback: boolean }> {
  try {
    const { data, error } = await supabase
      .from('rubricas')
      .select('*')
      .eq('ativo', true)
      .order('codigo', { ascending: true });

    if (error) throw error;

    // Mapear estrutura legada para nova
    const rubricas: ConfigRubrica[] = (data || []).map((r: Record<string, unknown>) => {
      const tipoCalculo = (r.tipo_calculo as string) || 'manual';
      const tipoCalculoValido = ['fixo', 'percentual', 'formula', 'referencia', 'tabela', 'manual'].includes(tipoCalculo) 
        ? tipoCalculo as ConfigRubrica['tipo_calculo']
        : 'manual' as const;
      
      return {
        id: r.id as string,
        codigo: r.codigo as string,
        nome: r.descricao as string,
        descricao: r.descricao as string,
        natureza: r.tipo as 'provento' | 'desconto' | 'encargo' | 'informativo',
        tipo_calculo: tipoCalculoValido,
        valor_fixo: r.valor_fixo as number | undefined,
        percentual: r.percentual as number | undefined,
        incide_inss: (r.incidencia_inss ?? r.incide_inss ?? false) as boolean,
        incide_irrf: (r.incidencia_irrf ?? r.incide_irrf ?? false) as boolean,
        incide_fgts: (r.incidencia_fgts ?? r.incide_fgts ?? false) as boolean,
        compoe_base_inss: (r.incidencia_inss ?? r.incide_inss ?? false) as boolean,
        compoe_base_irrf: (r.incidencia_irrf ?? r.incide_irrf ?? false) as boolean,
        vigencia_inicio: '2020-01-01',
        ordem_calculo: parseInt(r.codigo as string) || 999,
        ativo: true,
      };
    });

    log('warn', `Fallback: ${rubricas.length} rubricas legadas carregadas`);
    return { rubricas, usouFallback: true };
  } catch (error) {
    log('error', 'Erro ao buscar rubricas legadas', { error });
    return { rubricas: [], usouFallback: true };
  }
}

/**
 * Busca regras de cálculo específicas
 */
async function buscarRegrasCalculo(
  dataReferencia: string,
  rubricaId?: string
): Promise<ConfigRegraCalculo[]> {
  try {
    const { data, error } = await supabase
      .from('config_regras_calculo')
      .select('*')
      .eq('ativo', true)
      .lte('vigencia_inicio', dataReferencia);

    if (error) throw error;
    
    let resultado = (data || []) as unknown as ConfigRegraCalculo[];
    
    if (rubricaId) {
      resultado = resultado.filter(r => r.rubrica_id === rubricaId);
    }

    return resultado;
  } catch (error) {
    log('warn', 'Regras de cálculo não encontradas', { error });
    return [];
  }
}

/**
 * Busca incidências entre rubricas
 */
async function buscarIncidencias(
  dataReferencia: string
): Promise<ConfigIncidencia[]> {
  try {
    const { data, error } = await supabase
      .from('config_incidencias')
      .select('*')
      .eq('ativo', true)
      .lte('vigencia_inicio', dataReferencia)
      .or(`vigencia_fim.is.null,vigencia_fim.gte.${dataReferencia}`);

    if (error) throw error;
    return (data || []) as unknown as ConfigIncidencia[];
  } catch (error) {
    log('warn', 'Incidências não encontradas', { error });
    return [];
  }
}

/**
 * Busca parâmetros globais da folha
 */
async function buscarParametrosGlobais(
  ano: number,
  mes: number
): Promise<ParametrosFolhaCalculo> {
  const dataReferencia = `${ano}-${String(mes).padStart(2, '0')}-01`;
  
  // Valores padrão (legislação 2026)
  const defaults: ParametrosFolhaCalculo = {
    competencia_ano: ano,
    competencia_mes: mes,
    data_referencia: dataReferencia,
    salario_minimo: 1518.00,
    valor_dependente_irrf: 189.59,
    teto_inss: 8157.41,
    teto_constitucional: 44008.52, // Teto STF 2026
    aliquota_inss_patronal: 20,
    aliquota_rat: 2,
    aliquota_outras_entidades: 5.8,
    margem_consignavel_percentual: 35,
  };

  try {
    const { data, error } = await supabase
      .from('parametros_folha')
      .select('*')
      .eq('ativo', true)
      .lte('vigencia_inicio', dataReferencia)
      .or(`vigencia_fim.is.null,vigencia_fim.gte.${dataReferencia}`);

    if (error) throw error;

    // Mapear parâmetros encontrados
    for (const param of data || []) {
      const tipo = param.tipo_parametro;
      const valor = param.valor;
      
      switch (tipo) {
        case 'salario_minimo':
          defaults.salario_minimo = valor;
          break;
        case 'valor_dependente_irrf':
          defaults.valor_dependente_irrf = valor;
          break;
        case 'teto_inss':
          defaults.teto_inss = valor;
          break;
        case 'teto_constitucional':
          defaults.teto_constitucional = valor;
          break;
        case 'aliquota_inss_patronal':
          defaults.aliquota_inss_patronal = valor;
          break;
        case 'aliquota_rat':
          defaults.aliquota_rat = valor;
          break;
        case 'aliquota_outras_entidades':
          defaults.aliquota_outras_entidades = valor;
          break;
        case 'margem_consignavel':
          defaults.margem_consignavel_percentual = valor;
          break;
      }
    }

    log('info', 'Parâmetros globais carregados', { ...defaults } as Record<string, unknown>);
    return defaults;
  } catch (error) {
    log('warn', 'Usando parâmetros padrão', { error });
    return defaults;
  }
}

/**
 * Busca faixas de INSS vigentes
 */
async function buscarFaixasINSS(): Promise<FaixaINSSCalculo[]> {
  try {
    const { data, error } = await supabase
      .from('tabela_inss')
      .select('*')
      .order('faixa_ordem', { ascending: true });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(f => ({
        faixa_ordem: f.faixa_ordem,
        valor_minimo: f.valor_minimo,
        valor_maximo: f.valor_maximo,
        aliquota: f.aliquota,
      }));
    }
    
    // Fallback: faixas padrão 2026
    log('warn', 'Tabela INSS não encontrada, usando padrão');
    return [
      { faixa_ordem: 1, valor_minimo: 0, valor_maximo: 1518.00, aliquota: 7.5 },
      { faixa_ordem: 2, valor_minimo: 1518.01, valor_maximo: 2793.88, aliquota: 9 },
      { faixa_ordem: 3, valor_minimo: 2793.89, valor_maximo: 4190.83, aliquota: 12 },
      { faixa_ordem: 4, valor_minimo: 4190.84, valor_maximo: 8157.41, aliquota: 14 },
    ];
  } catch (error) {
    log('error', 'Erro ao buscar faixas INSS', { error });
    return [];
  }
}

/**
 * Busca faixas de IRRF vigentes
 */
async function buscarFaixasIRRF(): Promise<FaixaIRRFCalculo[]> {
  try {
    const { data, error } = await supabase
      .from('tabela_irrf')
      .select('*')
      .order('faixa_ordem', { ascending: true });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(f => ({
        faixa_ordem: f.faixa_ordem,
        valor_minimo: f.valor_minimo,
        valor_maximo: f.valor_maximo,
        aliquota: f.aliquota,
        parcela_deduzir: f.parcela_deduzir,
      }));
    }
    
    // Fallback: faixas padrão 2026
    log('warn', 'Tabela IRRF não encontrada, usando padrão');
    return [
      { faixa_ordem: 1, valor_minimo: 0, valor_maximo: 2259.20, aliquota: 0, parcela_deduzir: 0 },
      { faixa_ordem: 2, valor_minimo: 2259.21, valor_maximo: 2826.65, aliquota: 7.5, parcela_deduzir: 169.44 },
      { faixa_ordem: 3, valor_minimo: 2826.66, valor_maximo: 3751.05, aliquota: 15, parcela_deduzir: 381.44 },
      { faixa_ordem: 4, valor_minimo: 3751.06, valor_maximo: 4664.68, aliquota: 22.5, parcela_deduzir: 662.77 },
      { faixa_ordem: 5, valor_minimo: 4664.69, valor_maximo: 999999999, aliquota: 27.5, parcela_deduzir: 896.00 },
    ];
  } catch (error) {
    log('error', 'Erro ao buscar faixas IRRF', { error });
    return [];
  }
}

/**
 * Busca consignações ativas do servidor
 */
async function buscarConsignacoes(
  servidorId: string
): Promise<ConsignacaoAtiva[]> {
  try {
    const { data, error } = await supabase
      .from('consignacoes')
      .select('*')
      .eq('servidor_id', servidorId)
      .eq('ativo', true)
      .eq('quitado', false);

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      servidor_id: c.servidor_id,
      consignataria_nome: c.consignataria_nome,
      consignataria_codigo: c.consignataria_codigo,
      numero_contrato: c.numero_contrato,
      valor_parcela: c.valor_parcela,
      parcelas_restantes: c.total_parcelas - (c.parcelas_pagas || 0),
      rubrica_codigo: undefined,
    }));
  } catch (error) {
    log('warn', 'Consignações não encontradas', { error, servidorId });
    return [];
  }
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula o valor de uma rubrica específica
 */
function calcularValorRubrica(
  rubrica: ConfigRubrica,
  contexto: ContextoServidorFolha,
  parametros: ParametrosFolhaCalculo,
  valoresCalculados: Map<string, number>,
  regras: ConfigRegraCalculo[]
): { valor: number; referencia?: number; base_calculo?: number; percentual?: number } {
  let valor = 0;
  let referencia: number | undefined;
  let base_calculo: number | undefined;
  let percentual: number | undefined;

  // Verificar regras específicas
  const regraEspecifica = regras.find(r => r.rubrica_id === rubrica.id);
  if (regraEspecifica?.parametros) {
    const params = regraEspecifica.parametros;
    if (typeof params.valor_fixo === 'number') {
      valor = params.valor_fixo;
      log('debug', `Regra específica aplicada: valor_fixo=${valor}`, {}, contexto.servidor_id, rubrica.codigo);
      return { valor };
    }
  }

  switch (rubrica.tipo_calculo) {
    case 'fixo':
      valor = rubrica.valor_fixo || 0;
      break;

    case 'referencia':
      // Usar vencimento do cargo como referência
      referencia = contexto.cargo_vencimento || 0;
      valor = referencia;
      break;

    case 'percentual':
      // Calcular percentual sobre a base
      percentual = rubrica.percentual || 0;
      
      // Determinar base de cálculo
      if (rubrica.rubrica_base_id) {
        // Usar rubrica específica como base
        const rubricaBase = valoresCalculados.get(rubrica.rubrica_base_id);
        base_calculo = rubricaBase || 0;
      } else {
        // Usar vencimento como base padrão
        base_calculo = contexto.cargo_vencimento || 0;
      }
      
      valor = base_calculo * (percentual / 100);
      break;

    case 'formula':
      // Fórmulas específicas por código de rubrica
      valor = calcularFormula(rubrica, contexto, parametros, valoresCalculados);
      break;

    case 'tabela':
      // Rubricas calculadas por tabela (INSS, IRRF)
      // Serão calculadas separadamente
      valor = 0;
      break;

    case 'manual':
    default:
      // Valores manuais não são calculados automaticamente
      valor = 0;
      break;
  }

  // Aplicar proporcionalidade por dias trabalhados
  if (rubrica.proporcional_dias && contexto.dias_uteis && contexto.dias_trabalhados) {
    const proporcao = contexto.dias_trabalhados / contexto.dias_uteis;
    valor = valor * proporcao;
  }

  // Descontar faltas se aplicável
  if (rubrica.desconta_faltas && contexto.faltas && contexto.dias_uteis) {
    const desconto = (valor / contexto.dias_uteis) * contexto.faltas;
    valor = valor - desconto;
  }

  // Aplicar limites
  if (rubrica.valor_minimo !== undefined && rubrica.valor_minimo !== null) {
    valor = Math.max(valor, rubrica.valor_minimo);
  }
  if (rubrica.valor_maximo !== undefined && rubrica.valor_maximo !== null) {
    valor = Math.min(valor, rubrica.valor_maximo);
  }

  // Arredondar para 2 casas decimais
  valor = Math.round(valor * 100) / 100;

  return { valor, referencia, base_calculo, percentual };
}

/**
 * Calcula fórmulas específicas de rubricas
 */
function calcularFormula(
  rubrica: ConfigRubrica,
  contexto: ContextoServidorFolha,
  parametros: ParametrosFolhaCalculo,
  valoresCalculados: Map<string, number>
): number {
  const codigo = rubrica.codigo;
  const vencimento = contexto.cargo_vencimento || 0;
  const cargaHoraria = contexto.carga_horaria || 40;
  
  switch (codigo) {
    case '024': // Hora Extra 50%
      if (contexto.horas_extras_50) {
        const valorHora = (vencimento / cargaHoraria / 4.5);
        return valorHora * 1.5 * contexto.horas_extras_50;
      }
      return 0;

    case '025': // Hora Extra 100%
      if (contexto.horas_extras_100) {
        const valorHora = (vencimento / cargaHoraria / 4.5);
        return valorHora * 2 * contexto.horas_extras_100;
      }
      return 0;

    case '023': // Adicional Noturno
      if (contexto.horas_noturnas) {
        const valorHora = (vencimento / cargaHoraria / 4.5);
        return valorHora * 0.2 * contexto.horas_noturnas;
      }
      return 0;

    case '040': // Férias (1/3)
      // Total de proventos de férias + 1/3
      return 0; // Calculado em processamento separado

    case '042': // 13º Salário
      // Proporcional aos meses trabalhados
      return 0; // Calculado em processamento separado

    case '103': // Desconto de Faltas
      if (contexto.faltas && contexto.dias_uteis) {
        const valorDia = vencimento / contexto.dias_uteis;
        return valorDia * contexto.faltas;
      }
      return 0;

    default:
      // Se houver fórmula customizada, tentar avaliar
      if (rubrica.formula) {
        log('warn', `Fórmula customizada não implementada: ${rubrica.formula}`, {}, contexto.servidor_id, codigo);
      }
      return 0;
  }
}

// ============================================
// FUNÇÕES PRINCIPAIS DO MOTOR
// ============================================

/**
 * Calcula a folha de um servidor específico
 */
export async function calcularFolhaServidor(
  contexto: ContextoServidorFolha,
  parametros: ParametrosFolhaCalculo
): Promise<ResultadoCalculoServidor> {
  const inicio = Date.now();
  const warnings: string[] = [];
  const fallbackDetalhes: string[] = [];
  let usouFallback = false;

  log('info', `Iniciando cálculo para servidor`, { matricula: contexto.matricula }, contexto.servidor_id);

  // Buscar configurações
  const { rubricas, usouFallback: fallbackRubricas } = await buscarRubricasVigentes(parametros.data_referencia);
  if (fallbackRubricas) {
    usouFallback = true;
    fallbackDetalhes.push('rubricas');
  }

  const regras = await buscarRegrasCalculo(parametros.data_referencia);
  const incidencias = await buscarIncidencias(parametros.data_referencia);
  const faixasINSS = await buscarFaixasINSS();
  const faixasIRRF = await buscarFaixasIRRF();
  const consignacoes = await buscarConsignacoes(contexto.servidor_id);

  // Separar rubricas por natureza
  const rubricasProventos = rubricas.filter(r => r.natureza === 'provento' && r.automatica !== false);
  const rubricasDescontos = rubricas.filter(r => r.natureza === 'desconto' && r.automatica !== false);
  const rubricasEncargos = rubricas.filter(r => r.natureza === 'encargo');
  const rubricasInformativos = rubricas.filter(r => r.natureza === 'informativo');

  // Mapa para valores calculados (para referências entre rubricas)
  const valoresCalculados = new Map<string, number>();
  const itens: ItemCalculoRubrica[] = [];

  // 1. CALCULAR PROVENTOS
  let totalProventos = 0;
  let baseINSS = 0;
  let baseIRRF = 0;

  for (const rubrica of rubricasProventos) {
    try {
      const resultado = calcularValorRubrica(rubrica, contexto, parametros, valoresCalculados, regras);
      
      if (resultado.valor > 0) {
        valoresCalculados.set(rubrica.id, resultado.valor);
        totalProventos += resultado.valor;
        
        if (rubrica.compoe_base_inss) baseINSS += resultado.valor;
        if (rubrica.compoe_base_irrf) baseIRRF += resultado.valor;

        itens.push({
          rubrica_id: rubrica.id,
          rubrica_codigo: rubrica.codigo,
          rubrica_descricao: rubrica.nome,
          natureza: 'provento',
          tipo_calculo: rubrica.tipo_calculo,
          referencia: resultado.referencia,
          base_calculo: resultado.base_calculo,
          percentual: resultado.percentual,
          valor: resultado.valor,
          origem: 'automatico',
          ordem_calculo: rubrica.ordem_calculo,
        });

        log('debug', `Provento calculado: ${rubrica.codigo} = ${resultado.valor}`, {}, contexto.servidor_id, rubrica.codigo);
      }
    } catch (error) {
      warnings.push(`Erro ao calcular rubrica ${rubrica.codigo}: ${error}`);
      log('error', `Erro ao calcular rubrica`, { error }, contexto.servidor_id, rubrica.codigo);
    }
  }

  // 2. CALCULAR INSS (usando motor legado)
  const resultadoINSS = calcularINSSProgressivo(baseINSS, faixasINSS as FaixaINSS[], parametros.teto_inss);
  const valorINSS = resultadoINSS.valorTotal;

  // Adicionar item INSS
  const rubricaINSS = rubricas.find(r => r.codigo === '100');
  if (rubricaINSS) {
    itens.push({
      rubrica_id: rubricaINSS.id,
      rubrica_codigo: '100',
      rubrica_descricao: 'INSS',
      natureza: 'desconto',
      tipo_calculo: 'tabela',
      base_calculo: baseINSS,
      valor: valorINSS,
      origem: 'automatico',
      ordem_calculo: 100,
    });
  }

  // 3. CALCULAR IRRF (usando motor legado)
  const quantidadeDependentes = contexto.quantidade_dependentes_irrf || 0;
  const resultadoIRRF = calcularIRRF(
    baseIRRF,
    valorINSS,
    quantidadeDependentes,
    faixasIRRF as FaixaIRRF[],
    parametros.valor_dependente_irrf
  );
  const valorIRRF = resultadoIRRF.valorFinal;

  // Adicionar item IRRF
  const rubricaIRRF = rubricas.find(r => r.codigo === '101');
  if (rubricaIRRF) {
    itens.push({
      rubrica_id: rubricaIRRF.id,
      rubrica_codigo: '101',
      rubrica_descricao: 'IRRF',
      natureza: 'desconto',
      tipo_calculo: 'tabela',
      base_calculo: resultadoIRRF.baseAposDeducoes,
      valor: valorIRRF,
      origem: 'automatico',
      ordem_calculo: 101,
    });
  }

  // 4. CALCULAR OUTROS DESCONTOS
  let totalDescontos = valorINSS + valorIRRF;

  // Adicionar consignações
  for (const consig of consignacoes) {
    totalDescontos += consig.valor_parcela;
    itens.push({
      rubrica_id: '',
      rubrica_codigo: '200',
      rubrica_descricao: `${consig.consignataria_nome}`,
      natureza: 'desconto',
      tipo_calculo: 'fixo',
      valor: consig.valor_parcela,
      origem: 'automatico',
      ordem_calculo: 200,
      observacao: consig.numero_contrato,
    });
  }

  // 5. CALCULAR LÍQUIDO
  const valorLiquido = totalProventos - totalDescontos;

  // 6. CALCULAR ENCARGOS PATRONAIS
  const paramsEncargos: ParametrosFolha = {
    aliquota_inss_patronal: parametros.aliquota_inss_patronal,
    aliquota_rat: parametros.aliquota_rat,
    aliquota_outras_entidades: parametros.aliquota_outras_entidades,
    teto_inss: parametros.teto_inss,
  };
  const encargos = calcularEncargosPatronais(baseINSS, paramsEncargos);

  // 7. CALCULAR MARGEM CONSIGNÁVEL
  const margem = calcularMargemConsignavel(valorLiquido, parametros.margem_consignavel_percentual);
  const margemUtilizada = consignacoes.reduce((acc, c) => acc + c.valor_parcela, 0);

  // Ordenar itens por ordem de cálculo
  itens.sort((a, b) => a.ordem_calculo - b.ordem_calculo);

  const duracao = Date.now() - inicio;
  log('info', `Cálculo concluído em ${duracao}ms`, { totalProventos, totalDescontos, valorLiquido }, contexto.servidor_id);

  return {
    servidor_id: contexto.servidor_id,
    competencia_ano: parametros.competencia_ano,
    competencia_mes: parametros.competencia_mes,
    itens,
    total_proventos: totalProventos,
    total_descontos: totalDescontos,
    valor_liquido: valorLiquido,
    base_inss: baseINSS,
    base_irrf: resultadoIRRF.baseAposDeducoes,
    base_fgts: 0, // Autarquia não tem FGTS
    valor_inss: valorINSS,
    valor_irrf: valorIRRF,
    inss_patronal: encargos.inssPatronal,
    rat: encargos.rat,
    outras_entidades: encargos.outrasEntidades,
    total_encargos: encargos.total,
    base_consignavel: margem.base,
    margem_consignavel: margem.margem,
    margem_utilizada: margemUtilizada,
    processado_em: new Date().toISOString(),
    versao_motor: VERSAO_MOTOR,
    usou_fallback: usouFallback,
    fallback_detalhes: fallbackDetalhes,
    warnings,
    contexto,
  };
}

/**
 * Calcula a folha completa para múltiplos servidores
 */
export async function calcularFolhaCompleta(
  servidores: ContextoServidorFolha[],
  competenciaAno: number,
  competenciaMes: number,
  tipoFolha: ResultadoCalculoFolha['tipo_folha'] = 'mensal'
): Promise<ResultadoCalculoFolha> {
  const inicio = Date.now();
  limparLogs();
  
  log('info', `Iniciando cálculo de folha ${tipoFolha} ${competenciaMes}/${competenciaAno} para ${servidores.length} servidores`);

  // Buscar parâmetros globais
  const parametros = await buscarParametrosGlobais(competenciaAno, competenciaMes);

  // Calcular para cada servidor
  const resultadosServidores: ResultadoCalculoServidor[] = [];
  let servidoresComErro = 0;
  let servidoresComWarning = 0;

  for (const servidor of servidores) {
    try {
      const resultado = await calcularFolhaServidor(servidor, parametros);
      resultadosServidores.push(resultado);
      
      if (resultado.warnings.length > 0) {
        servidoresComWarning++;
      }
    } catch (error) {
      servidoresComErro++;
      log('error', `Erro fatal ao calcular servidor`, { error, servidor_id: servidor.servidor_id });
    }
  }

  // Consolidar totais
  const totalBruto = resultadosServidores.reduce((acc, r) => acc + r.total_proventos, 0);
  const totalDescontos = resultadosServidores.reduce((acc, r) => acc + r.total_descontos, 0);
  const totalLiquido = resultadosServidores.reduce((acc, r) => acc + r.valor_liquido, 0);
  const totalINSSServidor = resultadosServidores.reduce((acc, r) => acc + r.valor_inss, 0);
  const totalINSSPatronal = resultadosServidores.reduce((acc, r) => acc + r.inss_patronal, 0);
  const totalIRRF = resultadosServidores.reduce((acc, r) => acc + r.valor_irrf, 0);
  const totalEncargos = resultadosServidores.reduce((acc, r) => acc + r.total_encargos, 0);

  const duracao = Date.now() - inicio;
  log('info', `Cálculo de folha concluído em ${duracao}ms`, { 
    servidores: servidores.length, 
    totalBruto, 
    totalLiquido 
  });

  return {
    competencia_ano: competenciaAno,
    competencia_mes: competenciaMes,
    tipo_folha: tipoFolha,
    servidores: resultadosServidores,
    total_bruto: Math.round(totalBruto * 100) / 100,
    total_descontos: Math.round(totalDescontos * 100) / 100,
    total_liquido: Math.round(totalLiquido * 100) / 100,
    total_inss_servidor: Math.round(totalINSSServidor * 100) / 100,
    total_inss_patronal: Math.round(totalINSSPatronal * 100) / 100,
    total_irrf: Math.round(totalIRRF * 100) / 100,
    total_encargos_patronais: Math.round(totalEncargos * 100) / 100,
    quantidade_servidores: servidores.length,
    servidores_com_erro: servidoresComErro,
    servidores_com_warning: servidoresComWarning,
    processado_em: new Date().toISOString(),
    duracao_ms: duracao,
    versao_motor: VERSAO_MOTOR,
  };
}

// ============================================
// EXPORTAÇÕES PARA COMPATIBILIDADE
// ============================================

export {
  calcularINSSProgressivo,
  calcularIRRF,
  calcularEncargosPatronais,
  calcularMargemConsignavel,
} from './folhaCalculos';

export { VERSAO_MOTOR, CONFIG_MOTOR_PADRAO } from '@/types/motorFolha';
