/**
 * Relatório da pesquisa de preços: junta item, amostras e o cálculo do art. 18 numa estrutura só, usada pelo PDF
 * (Anexo da nota técnica), pela planilha e pelo texto das seções 2 a 5 da Nota Técnica de Análise Crítica de
 * Pesquisa de Preços, que a EPC cola e assina no SEI (o sistema não gera o ato; só o texto de apoio).
 */

import {
  avisoDePrazo,
  METODO_LABEL,
  PARAMETROS,
  sanear,
  valorPeloMetodo,
  arredondar,
  type MetodoPesquisa,
  type ParametroPesquisa,
  type ResultadoSaneamento,
} from "./pesquisaPrecos";

export type SituacaoNoRelatorio = "valido" | "excessivo" | "inexequivel" | "desconsiderada";

export const SITUACAO_RELATORIO_LABEL: Record<SituacaoNoRelatorio, string> = {
  valido: "Válido",
  excessivo: "Excessivamente elevado",
  inexequivel: "Inexequível",
  desconsiderada: "Desconsiderado",
};

/** Campos da amostra que o relatório usa (os mesmos nomes da tabela pesquisas_precos_amostras). */
export interface AmostraBase {
  id: string;
  parametro: number;
  origem: string;
  orgao: string | null;
  uasg: string | null;
  uf: string | null;
  municipio: string | null;
  numero_compra: string | null;
  data_referencia: string | null;
  fornecedor_nome: string | null;
  fornecedor_ni: string | null;
  marca: string | null;
  unidade: string | null;
  preco_unitario: number;
  link: string | null;
  consultado_em: string;
  considerada: boolean;
  motivo_desconsideracao: string | null;
}

export interface ItemBase {
  numero: number;
  descricao: string;
  tipo: string;
  catalogo_campo: string | null;
  codigo_catalogo: number | null;
  nome_catalogo: string | null;
  unidade: string;
  quantidade: number;
  metodo: string | null;
  justificativa: string | null;
}

export interface AmostraRelatorio extends AmostraBase {
  situacao: SituacaoNoRelatorio;
  aviso: string | null;
}

export interface ItemRelatorio extends ItemBase {
  amostras: AmostraRelatorio[];
  analise: ResultadoSaneamento;
  metodoAdotado: MetodoPesquisa | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  /** O que impede usar o resultado sem mais nada (justificativa que falta, amostra fora do prazo). */
  pendencias: string[];
}

const METODOS: readonly MetodoPesquisa[] = ["media", "mediana", "menor"];
const METODO_NO_TEXTO: Record<MetodoPesquisa, string> = { media: "a média saneada", mediana: "a mediana", menor: "o menor preço" };
const ehMetodo = (m: string | null): m is MetodoPesquisa => !!m && (METODOS as readonly string[]).includes(m);
const ehParametro = (p: number): p is ParametroPesquisa => p >= 1 && p <= 5 && Number.isInteger(p);

export function montarItemRelatorio(item: ItemBase, amostras: AmostraBase[], dataReferencia: string): ItemRelatorio {
  const consideradas = amostras.filter((a) => a.considerada);
  const analise = sanear(consideradas.map((a) => ({ id: a.id, preco: Number(a.preco_unitario) })));
  const escolhido = ehMetodo(item.metodo) ? item.metodo : null;
  const metodoAdotado = escolhido ?? analise.metodoSugerido;
  const valorUnitario = valorPeloMetodo(analise, metodoAdotado);
  const linhas: AmostraRelatorio[] = [...amostras]
    .sort((a, b) => Number(a.preco_unitario) - Number(b.preco_unitario))
    .map((a) => ({
      ...a,
      situacao: a.considerada ? analise.situacao[a.id] ?? "valido" : "desconsiderada",
      aviso: ehParametro(a.parametro) ? avisoDePrazo(a.parametro, a.data_referencia, dataReferencia) : null,
    }));
  const semJustificativa = !item.justificativa?.trim();
  const pendencias: string[] = [];
  if (analise.alerta === "sem_precos") pendencias.push("Nenhum preço válido: registre o motivo e o critério adotado (art. 18, §§ 2º, 3º e 6º).");
  if (analise.alerta === "menos_de_tres" && semJustificativa) {
    pendencias.push("Menos de 3 preços válidos: falta a justificativa (art. 18, §§ 2º, 3º e 8º).");
  }
  if (escolhido && escolhido !== analise.metodoSugerido && semJustificativa) {
    pendencias.push(`Método diferente do art. 18, § 1º, VII (${METODO_LABEL[analise.metodoSugerido ?? "media"]}): falta a justificativa.`);
  }
  const foraDoPrazo = linhas.filter((l) => l.considerada && l.aviso).length;
  if (foraDoPrazo) pendencias.push(`${foraDoPrazo} preço(s) considerado(s) com aviso de prazo ou sem data: confira ou desconsidere.`);
  return {
    ...item,
    amostras: linhas,
    analise,
    metodoAdotado,
    valorUnitario,
    valorTotal: valorUnitario === null ? null : arredondar(valorUnitario * Number(item.quantidade), 2),
    pendencias,
  };
}

// ---------------------------------------------------------------- formatação (pt-BR, sem depender do navegador)
const fmt = (casas: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const F2 = fmt(2);
const F4 = fmt(4);
export const moedaBR = (n: number) => `R$ ${F2.format(n)}`;
/** Preço unitário: 2 casas; abaixo de R$ 1,00 com centavos fracionados, 4 casas. */
export const precoBR = (n: number) => `R$ ${(n < 1 && arredondar(n, 2) !== arredondar(n, 4) ? F4 : F2).format(n)}`;
export const pctBR = (fracao: number) => `${F2.format(fracao * 100)}%`;
export const quantidadeBR = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
/** AAAA-MM-DD → DD/MM/AAAA (sem fuso). */
export const dataBR = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "sem data");
/** Data e hora da consulta em UTC−4 (fuso da instituição; o banco guarda em UTC). */
export function dataHoraConsulta(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 4 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}h${p(d.getUTCMinutes())}`;
}

/** CNPJ formatado; CPF de pessoa física sai mascarado (LGPD), como no Portal da Transparência. */
export function documentoNoRelatorio(ni: string | null | undefined): string | null {
  const d = (ni ?? "").replace(/\D/g, "");
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  return null;
}

export const fonteDaAmostra = (a: AmostraBase) =>
  [a.orgao, a.uasg && a.uasg !== a.orgao ? a.uasg : null, [a.municipio, a.uf].filter(Boolean).join("/") || null]
    .filter(Boolean).join(" · ") || "Fonte não informada";

export const catalogoDoItem = (i: ItemBase) =>
  i.codigo_catalogo
    ? `${i.tipo === "servico" ? "CATSER" : i.catalogo_campo === "codigoPdm" ? "CATMAT (tipo de material)" : "CATMAT"} ${i.codigo_catalogo}`
    : null;

// ---------------------------------------------------------------- texto de apoio da nota técnica
export interface DadosNota {
  numeroSei: string;
  objeto: string;
  dataReferencia: string;
  itens: ItemRelatorio[];
}

/** Seções 2 a 5 da nota técnica, em texto corrido para colar no SEI. Afirma o que os dados mostram e cita a norma. */
export function textoNotaTecnica(d: DadosNota): string {
  const todas = d.itens.flatMap((i) => i.amostras);
  const linhas: string[] = [];
  linhas.push("2. FONTES CONSULTADAS", "");
  const usados = ([1, 2, 3, 4, 5] as const).filter((p) => todas.some((a) => a.parametro === p));
  if (!usados.length) linhas.push("2.1. Nenhum preço foi coletado.");
  usados.forEach((p, n) => {
    const doParametro = todas.filter((a) => a.parametro === p);
    const consultas = [...new Set(doParametro.map((a) => dataHoraConsulta(a.consultado_em).slice(0, 10)))].sort();
    linhas.push(`2.${n + 1}. ${PARAMETROS[p].rotulo} (Decreto nº 39.050-E/2025, art. 17, ${PARAMETROS[p].inciso}): ${doParametro.length} preço(s), `
      + `consultados em ${consultas.join(", ")} (UTC−4), com prazo de até ${PARAMETROS[p].prazoMeses} meses antes de ${dataBR(d.dataReferencia)}.`);
  });
  if (!usados.includes(1) && !usados.includes(2)) {
    linhas.push(`2.${usados.length + 1}. Os parâmetros dos incisos I e II do art. 17 não foram usados: [JUSTIFICAR] (Decreto nº 39.050-E/2025, art. 17, § 1º).`);
  }

  linhas.push("", "3. SÉRIE DE PREÇOS COLETADOS", "");
  linhas.push("3.1. A série de cada item, com órgão ou fonte, UF, compra ou ata, data, fornecedor, preço, link e data e hora da "
    + "consulta, está no relatório da pesquisa de preços, anexo a esta nota.");

  linhas.push("", "4. METODOLOGIA PARA OBTENÇÃO DO PREÇO ESTIMADO", "");
  linhas.push("4.1. Para cada item, calcularam-se a média dos preços considerados, o desvio padrão e os limites de 30% acima e abaixo "
    + "da média; os preços fora desses limites foram retirados da série (Decreto nº 39.050-E/2025, art. 2º, IX e X, e art. 18, § 1º, I a IV). "
    + "Dos preços válidos, calcularam-se a média saneada e o coeficiente de variação: até 30%, adota-se a média saneada; acima de 30%, "
    + "a mediana (art. 18, § 1º, V a VII).");
  d.itens.forEach((i, n) => {
    const a = i.analise;
    if (!a.validos) {
      linhas.push(`4.${n + 2}. Item ${i.numero}: nenhum preço válido.${i.justificativa ? ` ${i.justificativa.trim()}` : " [JUSTIFICAR]"}`);
      return;
    }
    const fora = a.quantidade - a.validos;
    const partes = [
      `4.${n + 2}. Item ${i.numero}: ${a.quantidade} preço(s) considerado(s)`,
      fora ? `, ${fora} fora dos limites de ${precoBR(a.limiteInferior!)} a ${precoBR(a.limiteSuperior!)}` : ", nenhum fora dos limites",
      `; média saneada de ${precoBR(a.mediaSaneada!)}`,
      a.coeficienteVariacao !== null ? `, coeficiente de variação de ${pctBR(a.coeficienteVariacao)}` : "",
      a.mediana !== null && a.validos > 1 ? `, mediana de ${precoBR(a.mediana)}` : "",
      `. Adotou-se ${METODO_NO_TEXTO[i.metodoAdotado!]}`,
      i.metodoAdotado === a.metodoSugerido
        ? (a.coeficienteVariacao !== null ? (a.metodoSugerido === "media" ? ", porque o coeficiente ficou em até 30%" : ", porque o coeficiente passou de 30%") : "")
        : `: ${i.justificativa?.trim() || "[JUSTIFICAR]"}`,
      ".",
      a.alerta === "menos_de_tres" ? ` Menos de 3 preços válidos: ${i.justificativa?.trim() || "[JUSTIFICAR]"} (art. 18, §§ 2º, 3º e 8º).` : "",
    ];
    linhas.push(partes.join(""));
  });
  const desconsideradas = d.itens.flatMap((i) => i.amostras.filter((a) => a.situacao === "desconsiderada").map((a) => ({ i, a })));
  if (desconsideradas.length) {
    linhas.push(`4.${d.itens.length + 2}. Preços desconsiderados antes do cálculo (art. 18, caput e § 6º):`);
    for (const { i, a } of desconsideradas) {
      linhas.push(`- Item ${i.numero}: ${fonteDaAmostra(a)}${a.numero_compra ? `, ${a.numero_compra}` : ""}, ${precoBR(Number(a.preco_unitario))}: `
        + `${a.motivo_desconsideracao?.trim() ?? ""}`);
    }
  }

  linhas.push("", "5. MEMÓRIA DE CÁLCULO E CONCLUSÃO", "");
  let total = 0;
  d.itens.forEach((i, n) => {
    if (i.valorUnitario === null) {
      linhas.push(`5.${n + 1}. Item ${i.numero} (${i.descricao}): sem preço estimado.`);
      return;
    }
    total += i.valorTotal!;
    linhas.push(`5.${n + 1}. Item ${i.numero} (${i.descricao}): ${precoBR(i.valorUnitario)} por ${i.unidade} × ${quantidadeBR(Number(i.quantidade))} `
      + `= ${moedaBR(i.valorTotal!)}.`);
  });
  linhas.push(`5.${d.itens.length + 1}. O valor estimado da contratação é de ${moedaBR(arredondar(total, 2))}, compatível com os preços `
    + "praticados no mercado, na forma do art. 23 da Lei nº 14.133/2021 e dos arts. 17 e 18 do Decreto nº 39.050-E/2025.");
  return linhas.join("\n");
}
