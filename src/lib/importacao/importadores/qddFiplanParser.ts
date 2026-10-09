/**
 * INTERPRETADOR DO QDD EXPORTADO DO FIPLAN (PDF)
 *
 * O relatório "Quadro de Detalhamento da Despesa - QDD" do FIPLAN traz, por bloco:
 *   - cabeçalho rótulo/valor (Exercício, Unidade Orçamentária, Programa de Governo, PAOE, Regional...)
 *   - uma linha de títulos de coluna (Natureza, Fonte, Cod. Acomp., IDU, TRO, Inicial ... Restos a Pagar)
 *   - uma linha por dotação (natureza de 8 dígitos)
 *   - totais (Total do Tesouro, Total de Outras Fontes, Total Geral)
 *
 * Colunas sem valor ficam em branco no PDF, então os valores são atribuídos à coluna
 * pela posição: números são alinhados à direita, e cada valor vai para a coluna cujo
 * título termina mais perto da borda direita do número. Os totais do próprio relatório
 * conferem a leitura: se a soma das linhas não bate com o "Total Geral", é erro.
 *
 * Função pura (sem pdf.js) para poder ser conferida isoladamente.
 */

import type { LinhaPdf, TrechoPdf } from "../pdfTexto";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

export const CAMPOS_VALOR_QDD = [
  "inicial",
  "suplementado",
  "anulado",
  "atual",
  "bloqueado",
  "reserva",
  "ped",
  "empenhado",
  "liquidado",
  "em_liquidacao",
  "pago",
  "disponivel",
  "restos",
] as const;

export type CampoValorQdd = (typeof CAMPOS_VALOR_QDD)[number];

export const ROTULOS_VALOR_QDD: Record<CampoValorQdd, string> = {
  inicial: "Inicial",
  suplementado: "Suplementado",
  anulado: "Anulado",
  atual: "Atual",
  bloqueado: "Bloqueado",
  reserva: "Cont./Reserva",
  ped: "PED",
  empenhado: "Empenhado",
  liquidado: "Liquidado",
  em_liquidacao: "Em liquidação",
  pago: "Pago",
  disponivel: "Disponível",
  restos: "Restos a pagar",
};

export interface LinhaQdd {
  funcao: string;
  subfuncao: string;
  programa_codigo: string;
  programa_nome: string;
  paoe_codigo: string;
  paoe_nome: string;
  regional: string;
  /** 8 dígitos, ex.: 33903900 */
  natureza: string;
  /** Como aparece no FIPLAN, ex.: 1.500 */
  fonte: string;
  cod_acomp: string;
  idu: string;
  tro: string;
  valores: Record<CampoValorQdd, number>;
}

/** Título de coluna (início do texto, sem acento/caixa) → campo */
const TITULOS_COLUNA: [string, CampoValorQdd][] = [
  ["inicial", "inicial"],
  ["suplementa", "suplementado"],
  ["anulado", "anulado"],
  ["atual", "atual"],
  ["bloqueado", "bloqueado"],
  ["cont/reserva", "reserva"],
  ["ped", "ped"],
  ["empenhado", "empenhado"],
  ["liquidado", "liquidado"],
  ["valor em", "em_liquidacao"],
  ["pago", "pago"],
  ["disponivel", "disponivel"],
  ["restos", "restos"],
];

/** Rótulos do cabeçalho do bloco (sem acento/caixa, sem os dois-pontos) */
const ROTULOS_CABECALHO = new Set([
  "exercicio",
  "esfera",
  "orgao",
  "unidade orcamentaria",
  "unidade gestora",
  "funcao",
  "subfuncao",
  "programa de governo",
  "paoe",
  "regional",
  "objetivo do paoe",
]);

const RE_VALOR = /^-?\d{1,3}(\.\d{3})*,\d{2}$/;
const RE_NATUREZA = /^\d{8}$/;
const RE_FONTE = /^\d(\.\d{3}|\d{3})$/;
/** Distância máxima (pt) entre a borda direita do número e a do título da coluna */
const DISTANCIA_MAX_COLUNA = 30;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function valorBR(texto: string): number {
  return Number(texto.replace(/\./g, "").replace(",", "."));
}

/** "030 - Desenvolvimento do Desporto" → ["030", "Desenvolvimento do Desporto"] */
function codigoNome(valor: string | undefined): [string, string] {
  if (!valor) return ["", ""];
  const m = valor.match(/^\s*([\d.]+)\s*-\s*(.*)$/);
  return m ? [m[1], m[2].trim()] : [valor.trim(), ""];
}

function zerados(): Record<CampoValorQdd, number> {
  return Object.fromEntries(CAMPOS_VALOR_QDD.map((c) => [c, 0])) as Record<CampoValorQdd, number>;
}

type Ancoras = { campo: CampoValorQdd; xFim: number }[];

/** Colunas de texto da dotação, localizadas pelo centro do título */
type CampoTextoQdd = "fonte" | "cod_acomp" | "idu" | "tro";
type AncorasTexto = { campo: CampoTextoQdd; centro: number }[];
const TITULOS_TEXTO: [string, CampoTextoQdd][] = [
  ["fonte", "fonte"],
  ["cod.", "cod_acomp"],
  ["idu", "idu"],
  ["tro", "tro"],
];
/** Distância máxima (pt) entre o centro do texto e o do título da coluna */
const DISTANCIA_MAX_TEXTO = 20;
const centro = (t: TrechoPdf) => (t.x + t.xFim) / 2;

/** Lê a(s) linha(s) de título e devolve a borda direita de cada coluna de valor. */
function lerAncoras(trechos: TrechoPdf[], ancoras: Ancoras) {
  for (const t of trechos) {
    const n = normalizar(t.texto);
    const achado = TITULOS_COLUNA.find(([prefixo]) => n.startsWith(prefixo));
    if (achado && !ancoras.some((a) => a.campo === achado[1])) {
      ancoras.push({ campo: achado[1], xFim: t.xFim });
    }
  }
  // "Valor em" e "Restos a" podem vir em trechos separados ("Valor" + "em"): estende até o vizinho.
  for (const a of ancoras) {
    const prefixo = a.campo === "em_liquidacao" ? "em" : a.campo === "restos" ? "a" : null;
    if (!prefixo) continue;
    const vizinho = trechos.find((t) => normalizar(t.texto) === prefixo && t.x >= a.xFim && t.x - a.xFim < 6);
    if (vizinho) a.xFim = vizinho.xFim;
  }
}

function lerAncorasTexto(trechos: TrechoPdf[]): AncorasTexto {
  const ancoras: AncorasTexto = [];
  for (const t of trechos) {
    const achado = TITULOS_TEXTO.find(([titulo]) => normalizar(t.texto) === titulo);
    if (achado && !ancoras.some((a) => a.campo === achado[1])) ancoras.push({ campo: achado[1], centro: centro(t) });
  }
  return ancoras;
}

/**
 * Distribui os trechos da linha: números vão para as colunas de valor (borda direita),
 * textos para as colunas de texto (centro). O que não casar com nenhuma coluna — ou
 * cair numa coluna já preenchida — volta em `perdidos`, para virar erro de leitura.
 */
function atribuirValores(
  trechos: TrechoPdf[],
  ancoras: Ancoras,
  ancorasTexto: AncorasTexto = [],
): { valores: Record<CampoValorQdd, number>; textos: Partial<Record<CampoTextoQdd, string>>; perdidos: string[] } {
  const valores = zerados();
  const preenchidos = new Set<CampoValorQdd>();
  const textos: Partial<Record<CampoTextoQdd, string>> = {};
  const perdidos: string[] = [];
  for (const t of trechos) {
    if (!RE_VALOR.test(t.texto)) {
      let alvo: AncorasTexto[number] | null = null;
      let dist = Infinity;
      for (const a of ancorasTexto) {
        const d = Math.abs(centro(t) - a.centro);
        if (d < dist) {
          dist = d;
          alvo = a;
        }
      }
      if (alvo && dist <= DISTANCIA_MAX_TEXTO && textos[alvo.campo] === undefined) textos[alvo.campo] = t.texto;
      else perdidos.push(t.texto);
      continue;
    }
    let melhor: Ancoras[number] | null = null;
    let distancia = Infinity;
    for (const a of ancoras) {
      const d = Math.abs(t.xFim - a.xFim);
      if (d < distancia) {
        distancia = d;
        melhor = a;
      }
    }
    if (!melhor || distancia > DISTANCIA_MAX_COLUNA || preenchidos.has(melhor.campo)) {
      perdidos.push(t.texto);
      continue;
    }
    preenchidos.add(melhor.campo);
    valores[melhor.campo] = valorBR(t.texto);
  }
  return { valores, textos, perdidos };
}

const centavos = (v: number) => Math.round(v * 100);

export function interpretarQddFiplan(linhasPdf: LinhaPdf[]): ResultadoLeitura<LinhaQdd> {
  const linhas: LinhaQdd[] = [];
  const problemas: ProblemaLeitura[] = [];
  const cabecalho: Record<string, string> = {};
  let contexto: Record<string, string> = {};
  let ancoras: Ancoras = [];
  let ancorasTexto: AncorasTexto = [];
  let lendoTitulos = false;
  /** Índice da primeira linha do bloco ainda não conferido com um "Total Geral" */
  let inicioBloco = 0;
  let totaisConferidos = 0;
  const exercicios = new Set<string>();

  for (const linhaPdf of linhasPdf) {
    const trechos = linhaPdf.trechos;
    const primeiro = trechos[0]?.texto ?? "";
    const rotulo = normalizar(primeiro.replace(/:$/, ""));

    // 1. Cabeçalho "Rótulo:  valor" (pode haver mais de um rótulo na mesma linha)
    if (primeiro.endsWith(":") && ROTULOS_CABECALHO.has(rotulo)) {
      let atual = "";
      const partes: Record<string, string[]> = {};
      for (const t of trechos) {
        const r = normalizar(t.texto.replace(/:$/, ""));
        if (t.texto.endsWith(":") && ROTULOS_CABECALHO.has(r)) {
          atual = r;
          partes[r] = [];
        } else {
          partes[atual].push(t.texto);
        }
      }
      for (const [r, textos] of Object.entries(partes)) {
        const valor = textos.join(" ").trim();
        // Novo PAOE com linhas ainda não conferidas: o bloco anterior ficou sem "Total Geral".
        if (r === "paoe" && inicioBloco < linhas.length) {
          problemas.push({
            gravidade: "aviso",
            mensagem: `PAOE ${contexto["paoe"] ?? "?"} sem "Total Geral" no relatório; a soma das linhas não foi conferida.`,
          });
          inicioBloco = linhas.length;
        }
        contexto = { ...contexto, [r]: valor };
        if (r === "exercicio") exercicios.add(valor);
      }
      lendoTitulos = false;
      continue;
    }

    // 2. Linha de títulos (pode continuar na linha seguinte: "do", "Liquidação", "Pagar"...)
    const normalizados = trechos.map((t) => normalizar(t.texto));
    if (normalizados.includes("natureza") && normalizados.includes("inicial")) {
      ancoras = [];
      lerAncoras(trechos, ancoras);
      ancorasTexto = lerAncorasTexto(trechos);
      lendoTitulos = true;
      continue;
    }

    // 3. Dotação
    if (RE_NATUREZA.test(primeiro)) {
      lendoTitulos = false;
      if (ancoras.length === 0) {
        problemas.push({ gravidade: "erro", mensagem: `Dotação ${primeiro} antes da linha de títulos das colunas.` });
        continue;
      }
      const { valores, textos, perdidos } = atribuirValores(trechos.slice(1), ancoras, ancorasTexto);
      const { fonte = "", cod_acomp: codAcomp = "", idu = "", tro = "" } = textos;
      const indice = linhas.length;
      if (!RE_FONTE.test(fonte) || !/^\d{4}$/.test(codAcomp) || !/^[^\d.,\s]{1,6}$/.test(idu)) {
        problemas.push({
          gravidade: "erro",
          mensagem: `Linha ${primeiro}: fonte "${fonte}", código de acompanhamento "${codAcomp}" ou IDU "${idu}" fora do padrão.`,
        });
        continue;
      }
      const [programaCodigo, programaNome] = codigoNome(contexto["programa de governo"]);
      const [paoeCodigo, paoeNome] = codigoNome(contexto["paoe"]);
      const [regional] = codigoNome(contexto["regional"]);
      const [funcao] = codigoNome(contexto["funcao"]);
      const [subfuncao] = codigoNome(contexto["subfuncao"]);
      linhas.push({
        funcao,
        subfuncao,
        programa_codigo: programaCodigo,
        programa_nome: programaNome,
        paoe_codigo: paoeCodigo,
        paoe_nome: paoeNome,
        regional,
        natureza: primeiro,
        fonte: fonte.includes(".") ? fonte : `${fonte[0]}.${fonte.slice(1)}`,
        cod_acomp: codAcomp,
        idu,
        tro,
        valores,
      });
      if (perdidos.length) {
        problemas.push({
          gravidade: "erro",
          linha: indice,
          mensagem: `Linha ${primeiro}: valor(es) ${perdidos.join(", ")} sem coluna correspondente.`,
        });
      }
      if (!paoeCodigo || !programaCodigo) {
        problemas.push({ gravidade: "erro", linha: indice, mensagem: `Linha ${primeiro} sem Programa/PAOE no cabeçalho.` });
      }
      const esperado = valores.inicial + valores.suplementado - valores.anulado;
      if (centavos(esperado) !== centavos(valores.atual)) {
        problemas.push({
          gravidade: "aviso",
          linha: indice,
          mensagem: `Linha ${primeiro}: Inicial + Suplementado − Anulado não bate com o Atual do FIPLAN.`,
        });
      }
      continue;
    }

    // 4. Total Geral do bloco: confere a soma das linhas lidas. Nos totais o FIPLAN só alinha
    //    Inicial e Atual com as colunas das dotações (o terceiro valor sai fora de posição),
    //    então a conferência usa só essas duas.
    if (normalizados[0] === "total geral") {
      const { valores } = atribuirValores(trechos.slice(1), ancoras);
      // Sem linhas novas desde o último total: é o total do relatório inteiro.
      const bloco = inicioBloco < linhas.length ? linhas.slice(inicioBloco) : linhas;
      for (const campo of ["inicial", "atual"] as const) {
        const soma = bloco.reduce((s, l) => s + l.valores[campo], 0);
        if (centavos(soma) !== centavos(valores[campo])) {
          problemas.push({
            gravidade: "erro",
            mensagem: `PAOE ${contexto["paoe"] ?? "?"}: soma de "${ROTULOS_VALOR_QDD[campo]}" das linhas não bate com o Total Geral do relatório.`,
          });
        }
      }
      inicioBloco = linhas.length;
      totaisConferidos++;
      continue;
    }

    // 5. Continuação dos títulos ("do", "Liquidação", "Pagar"): já tratada pelas âncoras
    if (lendoTitulos) continue;
  }

  // Cabeçalho exibido na pré-visualização (relatório de uma única UO)
  for (const [chave, rotuloExibido] of [
    ["exercicio", "Exercício"],
    ["orgao", "Órgão"],
    ["unidade orcamentaria", "Unidade orçamentária"],
    ["unidade gestora", "Unidade gestora"],
  ] as const) {
    if (contexto[chave]) cabecalho[rotuloExibido] = contexto[chave];
  }
  const paoes = [...new Set(linhas.map((l) => `${l.paoe_codigo} - ${l.paoe_nome}`))];
  if (paoes.length) cabecalho["PAOE"] = paoes.join("; ");

  const exercicio = Number(contexto["exercicio"]);
  if (exercicios.size > 1) {
    problemas.push({ gravidade: "erro", mensagem: `O relatório mistura exercícios (${[...exercicios].join(", ")}); exporte um exercício por vez.` });
  } else if (!Number.isInteger(exercicio) || exercicio < 2000 || exercicio > 2100) {
    problemas.push({ gravidade: "erro", mensagem: "Exercício não encontrado no cabeçalho do relatório." });
  }
  if (linhas.length === 0) {
    problemas.push({
      gravidade: "erro",
      mensagem: "Nenhuma dotação encontrada. Confira se o PDF é o \"Quadro de Detalhamento da Despesa - QDD\" do FIPLAN.",
    });
  } else if (totaisConferidos === 0) {
    problemas.push({ gravidade: "aviso", mensagem: "O relatório não trouxe \"Total Geral\"; a soma das linhas não pôde ser conferida." });
  } else if (inicioBloco < linhas.length) {
    problemas.push({ gravidade: "aviso", mensagem: "As últimas linhas do relatório não têm \"Total Geral\" para conferência." });
  }

  return { linhas, problemas, cabecalho, parametros: { exercicio } };
}
