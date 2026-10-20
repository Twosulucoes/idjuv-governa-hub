/**
 * Catálogo dos parâmetros de folha que o cálculo reconhece (tabela `parametros_folha`).
 *
 * O NOME é a chave que o banco procura, sempre em minúsculas (`teto_inss`, `deducao_dependente_irrf`…). Antes a tela
 * gravava em MAIÚSCULAS (`TETO_INSS`) e o cálculo, que procura em minúsculas, ignorava o valor digitado. Agora a tela
 * normaliza o nome ao salvar e o banco também (trigger da migração 20261012160000).
 */

export type UnidadeParametro = "reais" | "percentual" | "sim_nao" | "numero";

export const GRUPOS_PARAMETROS = ["Gerais", "IRRF", "Encargos", "Licenças", "Afastamentos"] as const;

export interface ParametroFolhaDef {
  tipo: string;
  descricao: string;
  unidade: UnidadeParametro;
  grupo: (typeof GRUPOS_PARAMETROS)[number];
}

const LICENCAS: [string, string][] = [
  ["maternidade", "Licença-maternidade"],
  ["paternidade", "Licença-paternidade"],
  ["medica", "Licença médica"],
  ["casamento", "Licença por casamento"],
  ["luto", "Licença por luto"],
  ["interesse_particular", "Licença para interesse particular"],
  ["capacitacao", "Licença para capacitação"],
  ["premio", "Licença-prêmio"],
  ["mandato_eletivo", "Licença para mandato eletivo"],
  ["mandato_classista", "Licença para mandato classista"],
  ["outra", "Outra licença"],
];

const AFASTAMENTOS: [string, string][] = [
  ["suspensao", "Suspensão"],
  ["cessao", "Cessão"],
  ["disposicao", "Disposição"],
  ["servico_externo", "Serviço externo"],
  ["missao", "Missão"],
  ["outro", "Outro afastamento"],
];

export const PARAMETROS_FOLHA: ParametroFolhaDef[] = [
  { tipo: "deducao_dependente_irrf", descricao: "Dedução por dependente para IRRF", unidade: "reais", grupo: "Gerais" },
  { tipo: "teto_inss", descricao: "Teto da base de contribuição do INSS/previdência (opcional)", unidade: "reais", grupo: "Gerais" },
  { tipo: "teto_rpps", descricao: "Teto do Regime Próprio de Previdência", unidade: "reais", grupo: "Gerais" },
  { tipo: "teto_remuneratorio", descricao: "Teto remuneratório (alerta quando a ficha passa dele)", unidade: "reais", grupo: "Gerais" },
  { tipo: "salario_minimo", descricao: "Salário mínimo nacional", unidade: "reais", grupo: "Gerais" },
  { tipo: "salario_familia_cota", descricao: "Valor da cota do salário-família", unidade: "reais", grupo: "Gerais" },
  { tipo: "salario_familia_limite", descricao: "Limite salarial para salário-família", unidade: "reais", grupo: "Gerais" },
  { tipo: "aliquota_fgts", descricao: "Alíquota do FGTS", unidade: "percentual", grupo: "Gerais" },
  { tipo: "margem_consignavel", descricao: "Margem consignável (fração, ex.: 0,35)", unidade: "numero", grupo: "Gerais" },
  // IRRF mensal: desconto simplificado (substitui as deduções quando é maior) e redução da Lei 15.270/2025
  { tipo: "desconto_simplificado_irrf", descricao: "Desconto simplificado mensal do IRRF", unidade: "reais", grupo: "IRRF" },
  { tipo: "irrf_reducao_limite_isencao", descricao: "Redução do IRRF: rendimento até o qual o IR é zerado", unidade: "reais", grupo: "IRRF" },
  { tipo: "irrf_reducao_maxima", descricao: "Redução do IRRF: valor máximo da redução", unidade: "reais", grupo: "IRRF" },
  { tipo: "irrf_reducao_limite", descricao: "Redução do IRRF: rendimento a partir do qual não há redução", unidade: "reais", grupo: "IRRF" },
  { tipo: "irrf_reducao_constante", descricao: "Redução do IRRF: parcela constante da fórmula", unidade: "reais", grupo: "IRRF" },
  { tipo: "irrf_reducao_coeficiente", descricao: "Redução do IRRF: coeficiente sobre o rendimento (ex.: 0,133145)", unidade: "numero", grupo: "IRRF" },
  // Parte patronal do regime geral e arredondamento do INSS (migração 20261021100000)
  { tipo: "inss_patronal_aliquota", descricao: "INSS patronal: alíquota em fração (ex.: 0,20)", unidade: "numero", grupo: "Encargos" },
  { tipo: "rat_fap_aliquota", descricao: "RAT já ajustado pelo FAP: alíquota em fração (ex.: 0,02)", unidade: "numero", grupo: "Encargos" },
  { tipo: "inss_truncar_por_faixa", descricao: "INSS do servidor: truncar cada faixa nos centavos, como o SIGRH? (1 = sim, 0 = não)", unidade: "sim_nao", grupo: "Encargos" },
  ...LICENCAS.map(([t, d]): ParametroFolhaDef => ({
    tipo: `licenca_remunerada_${t}`,
    descricao: `${d}: é remunerada? (1 = sim, 0 = não)`,
    unidade: "sim_nao",
    grupo: "Licenças",
  })),
  ...AFASTAMENTOS.map(([t, d]): ParametroFolhaDef => ({
    tipo: `afastamento_remunerado_${t}`,
    descricao: `${d}: é remunerado? (1 = sim, 0 = não)`,
    unidade: "sim_nao",
    grupo: "Afastamentos",
  })),
];

/** Nome do parâmetro como o banco guarda: minúsculas, sem acento, sem espaço, só letras, números e `_`. */
export function normalizarTipoParametro(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function definicaoParametro(tipo: string): ParametroFolhaDef | undefined {
  const t = normalizarTipoParametro(tipo);
  return PARAMETROS_FOLHA.find((p) => p.tipo === t);
}

/** Unidade do valor, pelo catálogo; para nomes fora dele, deduzida do prefixo (compatível com os já cadastrados). */
export function unidadeDoParametro(tipo: string): UnidadeParametro {
  const def = definicaoParametro(tipo);
  if (def) return def.unidade;
  const t = normalizarTipoParametro(tipo);
  if (t.startsWith("licenca_remunerada_") || t.startsWith("afastamento_remunerado_")) return "sim_nao";
  if (/(salario|teto|deducao)/.test(t)) return "reais";
  if (/(aliquota|percentual)/.test(t)) return "percentual";
  return "numero";
}

/** Parâmetros sim/não de licença e afastamento: 1 = remunerado. Os demais sim/não são uma opção do cálculo. */
export function ehRemuneracaoSimNao(tipo: string): boolean {
  const t = normalizarTipoParametro(tipo);
  return t.startsWith("licenca_remunerada_") || t.startsWith("afastamento_remunerado_");
}

export function formatarValorParametro(tipo: string, valor: number): string {
  switch (unidadeDoParametro(tipo)) {
    case "reais":
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "percentual":
      return `${valor}%`;
    case "sim_nao":
      if (!ehRemuneracaoSimNao(tipo)) return valor === 1 ? "Sim" : valor === 0 ? "Não" : String(valor);
      return valor === 1 ? "Sim (remunerado)" : valor === 0 ? "Não (sem remuneração)" : String(valor);
    default:
      return valor.toString();
  }
}

/**
 * Alíquota das tabelas de INSS e IRRF: a tela mostra em % (7,5) e o banco guarda a fração (0,075), que é o que
 * `calcular_inss_servidor` e `calcular_irrf` multiplicam. O banco recusa alíquota acima de 1 (migração 20261019200000).
 */
export function aliquotaEmPercentual(fracao: number | string | null | undefined): number {
  return Number((Number(fracao ?? 0) * 100).toFixed(4));
}

export function aliquotaEmFracao(percentual: number | string | null | undefined): number {
  return Number((Number(percentual ?? 0) / 100).toFixed(6));
}
