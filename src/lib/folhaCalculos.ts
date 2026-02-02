/**
 * Engine de Cálculos para Folha de Pagamento
 * INSS Progressivo, IRRF com deduções, margem consignável
 */

// Interfaces para faixas
export interface FaixaINSS {
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
}

export interface FaixaIRRF {
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  parcela_deduzir: number;
}

export interface ParametrosFolha {
  salario_minimo?: number;
  valor_dependente_irrf?: number;
  teto_inss?: number;
  aliquota_inss_patronal?: number;
  aliquota_rat?: number;
  aliquota_outras_entidades?: number;
  margem_consignavel_percentual?: number;
}

export interface ResultadoCalculoINSS {
  baseCalculo: number;
  valorTotal: number;
  detalhamento: Array<{
    faixa: number;
    base: number;
    aliquota: number;
    valor: number;
  }>;
}

export interface ResultadoCalculoIRRF {
  baseCalculo: number;
  baseAposDeducoes: number;
  deducaoINSS: number;
  deducaoDependentes: number;
  valorBruto: number;
  parcelaDeduzir: number;
  valorFinal: number;
  aliquotaEfetiva: number;
  faixaAplicada: number;
}

export interface ResultadoCalculoCompleto {
  totalProventos: number;
  totalDescontos: number;
  valorLiquido: number;
  inss: ResultadoCalculoINSS;
  irrf: ResultadoCalculoIRRF;
  inssPatronal: number;
  rat: number;
  outrasEntidades: number;
  totalEncargosPatronais: number;
  baseConsignavel: number;
  margemConsignavel: number;
}

/**
 * Calcula INSS Progressivo (faixa por faixa)
 * Implementa o cálculo conforme tabela progressiva vigente
 */
export function calcularINSSProgressivo(
  salarioBruto: number,
  faixas: FaixaINSS[],
  tetoINSS?: number
): ResultadoCalculoINSS {
  // Ordenar faixas por ordem
  const faixasOrdenadas = [...faixas].sort((a, b) => a.faixa_ordem - b.faixa_ordem);
  
  // Aplicar teto se existir
  const baseCalculo = tetoINSS ? Math.min(salarioBruto, tetoINSS) : salarioBruto;
  
  let valorRestante = baseCalculo;
  let valorTotal = 0;
  const detalhamento: ResultadoCalculoINSS['detalhamento'] = [];

  for (const faixa of faixasOrdenadas) {
    if (valorRestante <= 0) break;

    const limiteFaixa = faixa.valor_maximo - faixa.valor_minimo;
    const baseNaFaixa = Math.min(valorRestante, limiteFaixa > 0 ? limiteFaixa : valorRestante);
    
    // Verificar se o salário está nesta faixa
    if (baseCalculo > faixa.valor_minimo) {
      const valorNaFaixa = Math.min(
        baseCalculo - faixa.valor_minimo,
        faixa.valor_maximo - faixa.valor_minimo
      );
      
      if (valorNaFaixa > 0) {
        const contribuicao = valorNaFaixa * (faixa.aliquota / 100);
        valorTotal += contribuicao;
        
        detalhamento.push({
          faixa: faixa.faixa_ordem,
          base: valorNaFaixa,
          aliquota: faixa.aliquota,
          valor: contribuicao,
        });
      }
    }
    
    valorRestante = Math.max(0, baseCalculo - faixa.valor_maximo);
  }

  return {
    baseCalculo,
    valorTotal: Math.round(valorTotal * 100) / 100,
    detalhamento,
  };
}

/**
 * Calcula IRRF com deduções legais
 * Base = Salário Bruto - INSS - (nº dependentes × valor por dependente)
 */
export function calcularIRRF(
  salarioBruto: number,
  valorINSS: number,
  quantidadeDependentes: number,
  faixas: FaixaIRRF[],
  valorPorDependente: number = 189.59 // Valor padrão 2024/2025
): ResultadoCalculoIRRF {
  // Deduções legais
  const deducaoINSS = valorINSS;
  const deducaoDependentes = quantidadeDependentes * valorPorDependente;
  
  // Base de cálculo após deduções
  const baseAposDeducoes = Math.max(0, salarioBruto - deducaoINSS - deducaoDependentes);
  
  // Ordenar faixas
  const faixasOrdenadas = [...faixas].sort((a, b) => a.faixa_ordem - b.faixa_ordem);
  
  // Encontrar faixa aplicável
  let faixaAplicavel: FaixaIRRF | null = null;
  for (const faixa of faixasOrdenadas) {
    if (baseAposDeducoes >= faixa.valor_minimo && baseAposDeducoes <= faixa.valor_maximo) {
      faixaAplicavel = faixa;
      break;
    }
  }
  
  // Se não encontrou faixa ou é isento (alíquota 0)
  if (!faixaAplicavel || faixaAplicavel.aliquota === 0) {
    return {
      baseCalculo: salarioBruto,
      baseAposDeducoes,
      deducaoINSS,
      deducaoDependentes,
      valorBruto: 0,
      parcelaDeduzir: 0,
      valorFinal: 0,
      aliquotaEfetiva: 0,
      faixaAplicada: 0,
    };
  }
  
  // Calcular imposto
  const valorBruto = baseAposDeducoes * (faixaAplicavel.aliquota / 100);
  const valorFinal = Math.max(0, valorBruto - faixaAplicavel.parcela_deduzir);
  const aliquotaEfetiva = baseAposDeducoes > 0 ? (valorFinal / baseAposDeducoes) * 100 : 0;

  return {
    baseCalculo: salarioBruto,
    baseAposDeducoes,
    deducaoINSS,
    deducaoDependentes,
    valorBruto: Math.round(valorBruto * 100) / 100,
    parcelaDeduzir: faixaAplicavel.parcela_deduzir,
    valorFinal: Math.round(valorFinal * 100) / 100,
    aliquotaEfetiva: Math.round(aliquotaEfetiva * 100) / 100,
    faixaAplicada: faixaAplicavel.faixa_ordem,
  };
}

/**
 * Calcula encargos patronais (INSS empregador, RAT, Outras Entidades)
 */
export function calcularEncargosPatronais(
  salarioBruto: number,
  params: ParametrosFolha
): { inssPatronal: number; rat: number; outrasEntidades: number; total: number } {
  const aliquotaINSS = params.aliquota_inss_patronal ?? 20; // 20% padrão
  const aliquotaRAT = params.aliquota_rat ?? 2; // 2% padrão (ajustável por grau de risco)
  const aliquotaOutras = params.aliquota_outras_entidades ?? 5.8; // Sistema S
  
  const teto = params.teto_inss ?? salarioBruto;
  const base = Math.min(salarioBruto, teto);
  
  const inssPatronal = base * (aliquotaINSS / 100);
  const rat = base * (aliquotaRAT / 100);
  const outrasEntidades = base * (aliquotaOutras / 100);
  
  return {
    inssPatronal: Math.round(inssPatronal * 100) / 100,
    rat: Math.round(rat * 100) / 100,
    outrasEntidades: Math.round(outrasEntidades * 100) / 100,
    total: Math.round((inssPatronal + rat + outrasEntidades) * 100) / 100,
  };
}

/**
 * Calcula margem consignável (35% do salário líquido por padrão)
 */
export function calcularMargemConsignavel(
  valorLiquido: number,
  percentual: number = 35
): { base: number; margem: number } {
  const margem = valorLiquido * (percentual / 100);
  return {
    base: valorLiquido,
    margem: Math.round(margem * 100) / 100,
  };
}

/**
 * Cálculo completo de folha para um servidor
 */
export function calcularFolhaCompleta(
  totalProventos: number,
  outrosDescontos: number,
  quantidadeDependentes: number,
  faixasINSS: FaixaINSS[],
  faixasIRRF: FaixaIRRF[],
  params: ParametrosFolha
): ResultadoCalculoCompleto {
  // 1. Calcular INSS do servidor
  const inss = calcularINSSProgressivo(totalProventos, faixasINSS, params.teto_inss);
  
  // 2. Calcular IRRF
  const irrf = calcularIRRF(
    totalProventos,
    inss.valorTotal,
    quantidadeDependentes,
    faixasIRRF,
    params.valor_dependente_irrf
  );
  
  // 3. Calcular total de descontos
  const totalDescontos = inss.valorTotal + irrf.valorFinal + outrosDescontos;
  
  // 4. Calcular valor líquido
  const valorLiquido = totalProventos - totalDescontos;
  
  // 5. Calcular encargos patronais
  const encargos = calcularEncargosPatronais(totalProventos, params);
  
  // 6. Calcular margem consignável
  const margem = calcularMargemConsignavel(
    valorLiquido,
    params.margem_consignavel_percentual
  );

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
}

/**
 * Formata valor monetário para exibição
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Valida CPF (dígitos verificadores)
 */
export function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros[9])) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros[10])) return false;
  
  return true;
}

/**
 * Valida PIS/PASEP
 */
export function validarPIS(pis: string): boolean {
  const numeros = pis.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  
  const multiplicadores = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * multiplicadores[i];
  }
  
  const resto = soma % 11;
  const digito = resto < 2 ? 0 : 11 - resto;
  
  return digito === parseInt(numeros[10]);
}
