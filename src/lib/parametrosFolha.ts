/**
 * Catálogo dos parâmetros de folha que o cálculo reconhece (tabela `parametros_folha`).
 *
 * O NOME é a chave que o banco procura, sempre em minúsculas (`teto_inss`, `deducao_dependente_irrf`…). Antes a tela
 * gravava em MAIÚSCULAS (`TETO_INSS`) e o cálculo, que procura em minúsculas, ignorava o valor digitado. Agora a tela
 * normaliza o nome ao salvar e o banco também (trigger da migração 20261012150000).
 */

export type UnidadeParametro = "reais" | "percentual" | "sim_nao" | "numero";

export interface ParametroFolhaDef {
  tipo: string;
  descricao: string;
  unidade: UnidadeParametro;
  grupo: "Gerais" | "Licenças" | "Afastamentos";
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

export function formatarValorParametro(tipo: string, valor: number): string {
  switch (unidadeDoParametro(tipo)) {
    case "reais":
      return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "percentual":
      return `${valor}%`;
    case "sim_nao":
      return valor === 1 ? "Sim (remunerado)" : valor === 0 ? "Não (sem remuneração)" : String(valor);
    default:
      return valor.toString();
  }
}
