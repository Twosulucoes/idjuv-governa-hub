/**
 * Pesquisa de preços (Lei 14.133, art. 23; Decreto RR 39.050-E/2025, arts. 17 e 18): parâmetros, prazo de cada
 * amostra, saneamento da série e escolha do método. Só cálculo, sem banco nem rede.
 *
 * Saneamento (art. 18, § 1º, I a VII, e art. 2º, IX e X), o mesmo da planilha do Anexo II da nota técnica da EPC:
 *   média e desvio padrão (amostral) de todos os preços considerados; fora da série o preço mais de 30% acima da
 *   média (excessivamente elevado) ou 30% ou mais abaixo dela (inexequível); dos que sobram, média saneada, desvio,
 *   coeficiente de variação e mediana. CV até 30% = média saneada; acima de 30% = mediana. Com menos de 3 preços
 *   válidos o resultado sai, mas pede justificativa (art. 18, §§ 2º, 3º e 8º).
 */

export type ParametroPesquisa = 1 | 2 | 3 | 4 | 5;
export type MetodoPesquisa = "media" | "mediana" | "menor";
export type SituacaoAmostra = "valido" | "excessivo" | "inexequivel";

export interface ParametroInfo {
  inciso: string;
  rotulo: string;
  /** Idade máxima da amostra, em meses, contada da data de referência da pesquisa. */
  prazoMeses: number;
}

/** Parâmetros do art. 17 do Decreto 39.050-E/2025 (os mesmos do art. 23, § 1º, da Lei 14.133). */
export const PARAMETROS: Record<ParametroPesquisa, ParametroInfo> = {
  1: { inciso: "I", rotulo: "Sistema oficial (Pesquisa de Preços do Compras.gov.br)", prazoMeses: 12 },
  2: { inciso: "II", rotulo: "Contratação similar (PNCP)", prazoMeses: 12 },
  3: { inciso: "III", rotulo: "Mídia especializada, tabela oficial ou site", prazoMeses: 6 },
  4: { inciso: "IV", rotulo: "Pesquisa direta com fornecedor", prazoMeses: 6 },
  5: { inciso: "V", rotulo: "Nota fiscal eletrônica", prazoMeses: 12 },
};

export const METODO_LABEL: Record<MetodoPesquisa, string> = {
  media: "Média saneada",
  mediana: "Mediana",
  menor: "Menor preço",
};

export const SITUACAO_AMOSTRA_LABEL: Record<SituacaoAmostra, string> = {
  valido: "Válido",
  excessivo: "Excessivamente elevado (art. 2º, IX)",
  inexequivel: "Inexequível (art. 2º, X)",
};

/** Limite de 30% acima e abaixo da média (art. 2º, IX e X) e teto do coeficiente de variação (art. 18, § 1º, VII). */
export const LIMITE_FAIXA = 0.3;
export const LIMITE_CV = 0.3;
export const MINIMO_PRECOS = 3;

export interface AmostraCalculo {
  id: string;
  preco: number;
}

export interface ResultadoSaneamento {
  /** Preços que entraram no cálculo (os desconsiderados à mão ficam fora antes). */
  quantidade: number;
  media: number | null;
  desvioPadrao: number | null;
  limiteSuperior: number | null;
  limiteInferior: number | null;
  situacao: Record<string, SituacaoAmostra>;
  validos: number;
  mediaSaneada: number | null;
  desvioSaneado: number | null;
  /** Fração (0,12 = 12%). Null com menos de 2 preços válidos. */
  coeficienteVariacao: number | null;
  mediana: number | null;
  menor: number | null;
  /** Método do art. 18, § 1º, VII. Null sem preço válido. */
  metodoSugerido: "media" | "mediana" | null;
  alerta: "sem_precos" | "menos_de_tres" | null;
}

const soma = (v: number[]) => v.reduce((s, x) => s + x, 0);
const mediaDe = (v: number[]) => (v.length ? soma(v) / v.length : null);

/** Desvio padrão amostral (n − 1), como o DESVPAD/STDEV da planilha. Null com menos de 2 valores. */
export function desvioPadraoAmostral(v: number[]): number | null {
  if (v.length < 2) return null;
  const m = soma(v) / v.length;
  return Math.sqrt(soma(v.map((x) => (x - m) ** 2)) / (v.length - 1));
}

export function medianaDe(v: number[]): number | null {
  if (!v.length) return null;
  const o = [...v].sort((a, b) => a - b);
  const meio = Math.floor(o.length / 2);
  return o.length % 2 ? o[meio] : (o[meio - 1] + o[meio]) / 2;
}

/** Arredonda sem o erro de ponto flutuante de 1,005 → 1,00. */
export function arredondar(n: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function sanear(amostras: AmostraCalculo[]): ResultadoSaneamento {
  const precos = amostras.filter((a) => Number.isFinite(a.preco) && a.preco > 0);
  const media = mediaDe(precos.map((a) => a.preco));
  const situacao: Record<string, SituacaoAmostra> = {};
  for (const a of precos) {
    // desvio arredondado a 6 casas, como na planilha: -30% exato é inexequível, +30% exato ainda é válido
    const desvio = arredondar(a.preco / media! - 1, 6);
    situacao[a.id] = desvio > LIMITE_FAIXA ? "excessivo" : desvio <= -LIMITE_FAIXA ? "inexequivel" : "valido";
  }
  const validos = precos.filter((a) => situacao[a.id] === "valido").map((a) => a.preco);
  const mediaSaneada = mediaDe(validos);
  const desvioSaneado = desvioPadraoAmostral(validos);
  const coeficienteVariacao = mediaSaneada && desvioSaneado !== null ? desvioSaneado / mediaSaneada : null;
  return {
    quantidade: precos.length,
    media,
    desvioPadrao: desvioPadraoAmostral(precos.map((a) => a.preco)),
    limiteSuperior: media === null ? null : media * (1 + LIMITE_FAIXA),
    limiteInferior: media === null ? null : media * (1 - LIMITE_FAIXA),
    situacao,
    validos: validos.length,
    mediaSaneada,
    desvioSaneado,
    coeficienteVariacao,
    mediana: medianaDe(validos),
    menor: validos.length ? Math.min(...validos) : null,
    metodoSugerido: !validos.length ? null : coeficienteVariacao !== null && coeficienteVariacao > LIMITE_CV ? "mediana" : "media",
    alerta: !validos.length ? "sem_precos" : validos.length < MINIMO_PRECOS ? "menos_de_tres" : null,
  };
}

/** Valor unitário estimado pelo método (o sugerido, ou o escolhido com justificativa), em centavos arredondados. */
export function valorPeloMetodo(r: ResultadoSaneamento, metodo: MetodoPesquisa | null | undefined): number | null {
  const m = metodo ?? r.metodoSugerido;
  const v = m === "media" ? r.mediaSaneada : m === "mediana" ? r.mediana : m === "menor" ? r.menor : null;
  return v === null ? null : arredondar(v, 2);
}

/** Soma meses a uma data ISO (AAAA-MM-DD) sem fuso; o dia que não existe no mês cai no último dia. */
export function somarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}

/**
 * Aviso quando a amostra está fora do prazo do parâmetro (12 meses nos incisos I, II e V; 6 meses nos III e IV) ou
 * tem data depois da data de referência. Null = no prazo.
 */
export function avisoDePrazo(parametro: ParametroPesquisa, dataAmostra: string | null | undefined, dataReferencia: string): string | null {
  if (!dataAmostra) return "Sem data: informe a data da compra, do orçamento ou da nota.";
  const dia = dataAmostra.slice(0, 10);
  const ref = dataReferencia.slice(0, 10);
  if (dia > ref) return "Data depois da data de referência da pesquisa.";
  const { prazoMeses, inciso } = PARAMETROS[parametro];
  if (dia < somarMeses(ref, -prazoMeses)) {
    return `Mais de ${prazoMeses} meses antes da data de referência (art. 17, ${inciso}).`;
  }
  return null;
}

export interface ReferenciaPncp {
  cnpj: string;
  ano: number;
  sequencial: number;
}

/**
 * Lê o link do edital no PNCP (…/app/editais/<cnpj>/<ano>/<seq>) ou o número de controle
 * (<cnpj>-1-<seq>/<ano>). Null se não reconhecer.
 */
export function lerReferenciaPncp(texto: string): ReferenciaPncp | null {
  const t = texto.trim();
  const link = t.match(/pncp\.gov\.br\/app\/(?:editais|contratos|atas)\/(\d{14})\/(\d{4})\/(\d{1,6})(?:\D|$)/i);
  const controle = t.match(/^(\d{14})-\d-(\d{1,6})\/(\d{4})$/);
  const [cnpj, ano, seq] = link ? [link[1], link[2], link[3]] : controle ? [controle[1], controle[3], controle[2]] : [];
  if (!cnpj) return null;
  const r = { cnpj, ano: Number(ano), sequencial: Number(seq) };
  return r.ano >= 2021 && r.ano <= 2100 && r.sequencial > 0 ? r : null;
}

export const linkEditalPncp = (r: ReferenciaPncp) => `https://pncp.gov.br/app/editais/${r.cnpj}/${r.ano}/${r.sequencial}`;

/** CNPJ (14 dígitos) ou CPF (11) só com dígitos, ou null. */
export function documentoFornecedor(v: string | null | undefined): string | null {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 14 || d.length === 11 ? d : null;
}

// ---------------------------------------------------------------- busca simples (nome do produto, unidade, marcação)

/** Minúsculas, sem acento e sem pontuação: "Peça, Nº 5" → "peca n 5". */
export function normalizarTexto(t: string | null | undefined): string {
  return String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const PALAVRAS_VAZIAS = new Set([
  "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "para", "por", "com", "sem", "and", "uma", "um", "tipo",
  "aos", "que", "pela", "pelo", "conforme", "cada",
]);

/** As primeiras palavras que identificam o produto (3 letras ou mais, sem as de ligação), sem acento. */
export function palavrasDaBusca(texto: string | null | undefined, maximo = 3): string[] {
  return normalizarTexto(texto).split(" ").filter((p) => p.length >= 3 && !PALAVRAS_VAZIAS.has(p)).slice(0, maximo);
}

/** Termos para achar o código no catálogo: do mais completo ao mais curto ("bola futebol campo", "bola futebol", "bola"). */
export function termosDoCatalogo(termo: string): string[] {
  const palavras = palavrasDaBusca(termo, 5);
  return palavras.map((_, i) => palavras.slice(0, palavras.length - i).join(" "));
}

const radical = (p: string) => (p.length > 4 ? p.replace(/(es|s)$/, "") : p);

/** A descrição tem todas as palavras buscadas (começo da palavra, sem acento, singular ou plural)? */
export function descricaoCombina(descricao: string | null | undefined, palavras: string[]): boolean {
  if (!palavras.length) return true;
  const tokens = normalizarTexto(descricao).split(" ").filter(Boolean);
  return palavras.every((p) => tokens.some((t) => t.startsWith(radical(p))));
}

const SINONIMOS_UNIDADE: Record<string, string> = {
  u: "unidade", un: "unidade", und: "unidade", unid: "unidade", unidade: "unidade", unidades: "unidade",
  pc: "peca", pca: "peca", peca: "peca", pecas: "peca",
  cx: "caixa", caixa: "caixa", caixas: "caixa",
  pct: "pacote", pt: "pacote", pacote: "pacote", pacotes: "pacote",
  kg: "kg", quilo: "kg", quilograma: "kg", quilogramas: "kg",
  g: "grama", gr: "grama", grama: "grama", gramas: "grama",
  l: "litro", lt: "litro", litro: "litro", litros: "litro",
  ml: "ml", mililitro: "ml",
  m: "metro", mt: "metro", metro: "metro", metros: "metro",
  m2: "m2", "metro quadrado": "m2", m3: "m3", "metro cubico": "m3",
  mes: "mes", meses: "mes", mensal: "mes",
  sv: "servico", serv: "servico", servico: "servico", servicos: "servico",
  par: "par", pares: "par", jg: "jogo", jogo: "jogo", jogos: "jogo", kit: "kit", kits: "kit",
  rl: "rolo", rolo: "rolo", rolos: "rolo", rs: "resma", resma: "resma", resmas: "resma",
  fr: "frasco", frasco: "frasco", frascos: "frasco", gl: "galao", galao: "galao", dz: "duzia", duzia: "duzia",
  h: "hora", hr: "hora", hora: "hora", horas: "hora", dia: "dia", dias: "dia", diaria: "diaria", diarias: "diaria",
};

function unidadeCanonica(u: string | null | undefined): { base: string; capacidade: number | null } | null {
  const bruto = String(u ?? "");
  const capacidade = bruto.match(/\((\d+(?:[.,]\d+)?)\)/);
  const base = normalizarTexto(bruto.replace(/\(.*?\)/g, " "));
  if (!base) return null;
  return { base: SINONIMOS_UNIDADE[base] ?? base, capacidade: capacidade ? Number(capacidade[1].replace(",", ".")) : null };
}

/**
 * Mesma unidade de fornecimento, por sinônimo (UN = unidade, CX = caixa, mês = MES). Embalagem com capacidade diferente
 * de 1 no portal (ex.: "CAIXA (12)") não conta como a mesma: a quantidade dentro dela pode ser outra.
 */
export function mesmaUnidade(doItem: string | null | undefined, doPreco: string | null | undefined): boolean {
  const a = unidadeCanonica(doItem);
  const b = unidadeCanonica(doPreco);
  if (!a || !b) return false;
  if (b.capacidade !== null && b.capacidade !== 1 && b.capacidade !== a.capacidade) return false;
  return a.base === b.base;
}

export const LIMITE_PRE_MARCADOS = 10;

/**
 * Preços que já vêm marcados na busca: da mesma unidade do item, com as palavras buscadas na descrição, que ainda não
 * estão no item; os mais recentes primeiro, até o limite. Quem pesquisa confere e desmarca antes de usar.
 */
export function preMarcar(
  precos: { idExterno: string; dataReferencia: string | null; unidade: string | null; descricao: string | null }[],
  o: { unidade: string; palavras: string[]; jaNoItem: Set<string>; limite?: number },
): Set<string> {
  return new Set(precos
    .filter((p) => !o.jaNoItem.has(p.idExterno) && mesmaUnidade(o.unidade, p.unidade) && descricaoCombina(p.descricao, o.palavras))
    .sort((a, b) => (b.dataReferencia ?? "").localeCompare(a.dataReferencia ?? ""))
    .slice(0, o.limite ?? LIMITE_PRE_MARCADOS)
    .map((p) => p.idExterno));
}

// ---------------------------------------------------------------- comparação com a ata ou o contrato

export interface ComparacaoAta {
  preco: number;
  /** Fração: −0,10 = 10% abaixo do estimado. */
  diferenca: number;
  situacao: "abaixo" | "igual" | "acima";
}

/**
 * Preço registrado na ata (adesão, Lei 14.133, art. 86, § 2º, II) ou do contrato (prorrogação, art. 107) diante do
 * valor estimado pela pesquisa. "igual" quando os dois batem no centavo.
 */
export function compararComAta(preco: number | null | undefined, estimado: number | null | undefined): ComparacaoAta | null {
  if (!preco || preco <= 0 || !estimado || estimado <= 0) return null;
  if (arredondar(preco, 2) === arredondar(estimado, 2)) return { preco, diferenca: 0, situacao: "igual" };
  const diferenca = arredondar(preco / estimado - 1, 4);
  return { preco, diferenca, situacao: diferenca < 0 ? "abaixo" : "acima" };
}
