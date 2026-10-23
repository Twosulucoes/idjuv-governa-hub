/**
 * INTERPRETADOR DO FIP 614 – SITUAÇÃO DE EMPENHO (PDF ou Excel do FIPLAN)
 *
 * O relatório traz um bloco por PED, aberto por "Nº PROCESSO: 00000112/26-14":
 *   - PED   nº, data, dotação completa e credor ("código - nome"; dotação e nome podem quebrar de linha)
 *   - EMP   nº, data e valor
 *   - LIQ   nº, data e valor, seguida de "Histórico da Liquidação: ..."
 *   - NOB   nº, P/C, data e valor
 *   - GCV   nº, data e valores (devolve o liquidado e o pago para a coluna GCV)
 *   - EST   estorno: tira o valor da coluna onde ele cai (EMP, LIQ, NOB ou GCV); no Excel vem "EST EMP",
 *           "EST LIQ"..., e o documento estornado vem como "LIQ EST", "NOB EST"

 *   - TOTAL EMP, LIQ, NOB, GCV, saldo a liquidar e a pagar do bloco
 * e, no fim de cada UG, "TOTAL UG ..." com a soma dos blocos.
 *
 * Os valores vão para a coluna pela posição (borda direita do número × a do título da coluna), porque
 * colunas vazias somem no texto corrido. A soma dos documentos de cada bloco é conferida com o TOTAL do
 * bloco, e a soma dos blocos com o TOTAL UG: qualquer diferença é erro de leitura.
 *
 * O Excel do FIPLAN é uma tabela HTML: `linhasFip614DoExcel` põe cada célula na posição da sua coluna e o
 * mesmo interpretador lê os dois formatos. O Excel não traz o título, o exercício nem a data de referência; o
 * exercício sai do número dos empenhos.
 *
 * Função pura (sem pdf.js) para poder ser conferida isoladamente.
 */

import type { LinhaPdf, TrechoPdf } from "../pdfTexto";
import type { CelulaHtml } from "../tabelaHtml";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";
import { valorBR } from "./qddFiplanParser";

export const COLUNAS_FIP614 = ["emp", "liq", "nob", "gcv", "saldo_liquidar", "a_pagar"] as const;
export type ColunaFip614 = (typeof COLUNAS_FIP614)[number];
/** Colunas em que os documentos lançam valor (as duas últimas só aparecem nos totais) */
export type ColunaDocumentoFip614 = "emp" | "liq" | "nob" | "gcv";

export type TipoDocumentoFip614 = "EMP" | "EST" | "LIQ" | "NOB" | "GCV";

export interface DocumentoFip614 {
  tipo: TipoDocumentoFip614;
  numero: string;
  /** AAAA-MM-DD */
  data: string;
  /** NOB: P (pagamento) ou C (consignação) */
  pc: "P" | "C" | null;
  valores: Partial<Record<ColunaDocumentoFip614, number>>;
  historico: string | null;
}

export interface LinhaEmpenhoFip614 {
  /** Como o FIPLAN mostra: 00000112/26-14 */
  processo: string;
  /** No padrão do SEI: 17302.000112/2026.14 */
  processo_sei: string;
  convenio: string | null;
  ped_numero: string;
  ped_data: string;
  /** Dotação do FIPLAN: UO.UG.função.subfunção.programa.PAOE.regional.natureza.fonte.acomp.IDU.x (IDU em número) */
  dotacao: string;
  credor_codigo: string;
  credor_nome: string;
  /** Número do EMP (17302.0001.26.00051-8) */
  numero: string;
  data_empenho: string;
  /** EMP, LIQ, NOB, GCV e estornos, na ordem do relatório */
  documentos: DocumentoFip614[];
  /** Valor original do EMP (antes dos estornos) */
  valor_empenhado: number;
  /** Estornos do empenho (EMP − TOTAL EMP) */
  valor_anulado: number;
  totais: Record<ColunaFip614, number>;
}

const TIPOS = new Set(["PED", "EMP", "EST", "LIQ", "NOB", "GCV"]);
const RE_VALOR = /^-?\d{1,3}(\.\d{3})*,\d{2}$/;
const RE_NUMERO = /^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$/;
const RE_DATA = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const RE_CREDOR = /^(\d{4}\.\d{5}-\d)\s*-\s*(.*)$/;
/** Distância máxima (pt) entre a borda direita do número e a do título da coluna */
const DISTANCIA_MAX_COLUNA = 30;
/** Tolerância (pt) para reconhecer a continuação da dotação e do credor na linha de baixo */
const TOLERANCIA_CONTINUACAO = 5;

/** Título de coluna (sem acento/caixa) → coluna */
const TITULOS: [string, ColunaFip614][] = [
  ["valor emp/est", "emp"],
  ["valor liq/est", "liq"],
  ["valor nob/est", "nob"],
  ["valor gcv/est", "gcv"],
  ["sdo a liq", "saldo_liquidar"],
  ["valor a pagar", "a_pagar"],
];

const ROTULOS_COLUNA: Record<ColunaFip614, string> = {
  emp: "EMP",
  liq: "LIQ",
  nob: "NOB",
  gcv: "GCV",
  saldo_liquidar: "saldo a liquidar",
  a_pagar: "a pagar",
};

/** "EST EMP" → EST (o estorno); "LIQ EST" → LIQ (o documento que foi estornado); "LIQ" → LIQ */
function tipoDoDocumento(texto: string): string {
  const [primeiro, segundo] = texto.split(/\s+/);
  return segundo && primeiro === "EST" ? "EST" : primeiro;
}

/** Largura, em "pontos", de cada coluna do Excel ao virar linha posicionada */
const LARGURA_COLUNA_EXCEL = 100;

/** Linhas da tabela do Excel → linhas posicionadas, com cada célula na posição da sua coluna. */
export function linhasFip614DoExcel(tabela: CelulaHtml[][]): LinhaPdf[] {
  return tabela.map((celulas, i) => ({
    pagina: 1,
    y: i,
    trechos: celulas.map((c) => ({
      texto: c.texto,
      x: c.coluna * LARGURA_COLUNA_EXCEL,
      xFim: c.coluna * LARGURA_COLUNA_EXCEL + LARGURA_COLUNA_EXCEL - 10,
      y: i,
      pagina: 1,
    })),
  }));
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const centavos = (v: number) => Math.round(v * 100);
const zerados = () => Object.fromEntries(COLUNAS_FIP614.map((c) => [c, 0])) as Record<ColunaFip614, number>;

function dataIso(texto: string): string | null {
  const m = texto.match(RE_DATA);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** "00000112/26-14" + UO 17302 → "17302.000112/2026.14" */
export function processoSei(processo: string, uo: string): string {
  const m = processo.match(/^(\d+)\/(\d{2})-(\d{2})$/);
  if (!m || !uo) return processo;
  return `${uo}.${m[1].slice(-6).padStart(6, "0")}/20${m[2]}.${m[3]}`;
}

type Ancoras = { coluna: ColunaFip614; xFim: number }[];

/** Valores da linha → colunas, pela borda direita. O que não casar volta em `perdidos`. */
function atribuirValores(trechos: TrechoPdf[], ancoras: Ancoras) {
  const valores: Partial<Record<ColunaFip614, number>> = {};
  const perdidos: string[] = [];
  for (const t of trechos) {
    let melhor: Ancoras[number] | null = null;
    let distancia = Infinity;
    for (const a of ancoras) {
      const d = Math.abs(t.xFim - a.xFim);
      if (d < distancia) {
        distancia = d;
        melhor = a;
      }
    }
    if (!melhor || distancia > DISTANCIA_MAX_COLUNA || valores[melhor.coluna] !== undefined) {
      perdidos.push(t.texto);
      continue;
    }
    valores[melhor.coluna] = valorBR(t.texto);
  }
  return { valores, perdidos };
}

interface Bloco {
  processo: string;
  convenio: string | null;
  ped?: { numero: string; data: string; dotacao: string; credor: string; xDotacao: number; xCredor: number };
  /** Ainda pode vir a continuação da dotação/credor (até o primeiro documento depois do PED) */
  continuando: boolean;
  documentos: DocumentoFip614[];
  pagina: number;
}

export function interpretarEmpenhosFip614(linhasPdf: LinhaPdf[]): ResultadoLeitura<LinhaEmpenhoFip614> {
  const linhas: LinhaEmpenhoFip614[] = [];
  const problemas: ProblemaLeitura[] = [];
  const cabecalho: Record<string, string> = {};
  let ancoras: Ancoras = [];
  let exercicio = "";
  let uo = "";
  let referencia = "";
  let reconhecido = false;
  let bloco: Bloco | null = null;
  /** Blocos ainda não conferidos com um "TOTAL UG" */
  let inicioUg = 0;
  let totaisUg = 0;

  const fecharSemTotal = () => {
    if (bloco?.ped) {
      problemas.push({
        gravidade: "erro",
        mensagem: `PED ${bloco.ped.numero} (página ${bloco.pagina}) sem a linha TOTAL do bloco.`,
      });
    }
    bloco = null;
  };

  for (const linhaPdf of linhasPdf) {
    const trechos = linhaPdf.trechos;
    if (!trechos.length) continue;
    const primeiro = trechos[0].texto;
    const texto = trechos.map((t) => t.texto).join(" ");
    const n = normalizar(texto);

    // Cabeçalho do relatório (repete em todas as páginas)
    // O Excel não traz o título "FIP 614": reconhece pelo título do quadro, que os dois formatos têm
    if (n.startsWith("fip 614") || n === "documentos de execucao") {
      reconhecido = true;
      continue;
    }
    let m = texto.match(/Exerc[íi]cio igual a (\d{4})/);
    if (m) {
      exercicio ||= m[1];
      if (m[1] !== exercicio) {
        problemas.push({ gravidade: "erro", mensagem: `O relatório mistura exercícios (${exercicio}, ${m[1]}); exporte um por vez.` });
      }
      continue;
    }
    m = texto.match(/Data de Refer[êe]ncia.*?(\d{2}\/\d{2}\/\d{4})/);
    if (m) {
      referencia ||= m[1];
      continue;
    }
    m = texto.match(/Unidade Or[çc]ament[áa]ria igual a (\d{5})/);
    if (m) {
      uo ||= m[1];
      continue;
    }
    if (/^(UO|UG):/.test(primeiro)) {
      const [rotulo, ...resto] = texto.split(":");
      cabecalho[rotulo === "UO" ? "Unidade orçamentária" : "Unidade gestora"] ??= resto.join(":").trim();
      if (rotulo === "UO") uo ||= texto.match(/^UO:\s*(\d{5})/)?.[1] ?? "";
      continue;
    }

    // Títulos das colunas de valor
    if (n.includes("valor emp/est")) {
      ancoras = [];
      for (const t of trechos) {
        const achado = TITULOS.find(([prefixo]) => normalizar(t.texto).startsWith(prefixo));
        if (achado && !ancoras.some((a) => a.coluna === achado[1])) ancoras.push({ coluna: achado[1], xFim: t.xFim });
      }
      continue;
    }

    // Abertura do bloco
    m = texto.match(/^N[ºo°] PROCESSO:\s*(\S+)(?:.*?N[ºo°] Conv[êe]nio:\s*(.*))?$/i);
    if (m) {
      if (bloco) fecharSemTotal();
      bloco = { processo: m[1], convenio: m[2]?.trim() || null, continuando: false, documentos: [], pagina: linhaPdf.pagina };
      continue;
    }

    // Total da UG: confere a soma dos blocos desde o último total de UG
    if (n.startsWith("total ug")) {
      if (bloco) fecharSemTotal();
      const { valores } = atribuirValores(trechos.filter((t) => RE_VALOR.test(t.texto)), ancoras);
      for (const coluna of COLUNAS_FIP614) {
        const soma = linhas.slice(inicioUg).reduce((s, l) => s + l.totais[coluna], 0);
        if (centavos(soma) !== centavos(valores[coluna] ?? 0)) {
          problemas.push({
            gravidade: "erro",
            mensagem: `A soma dos empenhos na coluna ${ROTULOS_COLUNA[coluna]} não bate com o TOTAL UG do relatório.`,
          });
        }
      }
      inicioUg = linhas.length;
      totaisUg++;
      continue;
    }
    if (n.startsWith("total de execucao")) continue;

    if (!bloco) continue;

    // Total do bloco: fecha o empenho
    if (primeiro === "TOTAL") {
      const { valores, perdidos } = atribuirValores(trechos.slice(1), ancoras);
      const totais = { ...zerados(), ...valores };
      const atual: Bloco = bloco;
      bloco = null;
      if (!atual.ped) {
        problemas.push({ gravidade: "erro", mensagem: `Processo ${atual.processo} (página ${atual.pagina}): bloco sem PED.` });
        continue;
      }
      const emps = atual.documentos.filter((d) => d.tipo === "EMP");
      if (emps.length !== 1) {
        problemas.push({
          gravidade: emps.length ? "erro" : "aviso",
          mensagem: emps.length
            ? `PED ${atual.ped.numero}: ${emps.length} empenhos no mesmo bloco; o importador espera um.`
            : `PED ${atual.ped.numero}: sem empenho no relatório; ignorado.`,
        });
        continue;
      }
      const credor = atual.ped.credor.match(RE_CREDOR);
      const indice = linhas.length;
      const valorEmpenhado = emps[0].valores.emp ?? 0;
      linhas.push({
        processo: atual.processo,
        processo_sei: processoSei(atual.processo, uo),
        convenio: atual.convenio,
        ped_numero: atual.ped.numero,
        ped_data: atual.ped.data,
        dotacao: atual.ped.dotacao,
        credor_codigo: credor?.[1] ?? "",
        credor_nome: (credor?.[2] ?? atual.ped.credor).trim(),
        numero: emps[0].numero,
        data_empenho: emps[0].data,
        documentos: atual.documentos,
        valor_empenhado: valorEmpenhado,
        valor_anulado: Math.round((valorEmpenhado - totais.emp) * 100) / 100,
        totais,
      });
      if (perdidos.length) {
        problemas.push({ gravidade: "erro", linha: indice, mensagem: `EMP ${emps[0].numero}: total ${perdidos.join(", ")} sem coluna.` });
      }
      if (!credor) {
        problemas.push({ gravidade: "erro", linha: indice, mensagem: `EMP ${emps[0].numero}: credor "${atual.ped.credor}" fora do padrão "código - nome".` });
      }
      // Documentos (estorno subtrai) × TOTAL do bloco
      for (const coluna of ["emp", "liq", "nob", "gcv"] as const) {
        const soma = atual.documentos.reduce((s, d) => s + (d.tipo === "EST" ? -1 : 1) * (d.valores[coluna] ?? 0), 0);
        if (centavos(soma) !== centavos(totais[coluna])) {
          problemas.push({
            gravidade: "erro",
            linha: indice,
            mensagem: `EMP ${emps[0].numero}: os documentos na coluna ${ROTULOS_COLUNA[coluna]} não somam o TOTAL do bloco.`,
          });
        }
      }
      if (
        centavos(totais.emp - totais.liq) !== centavos(totais.saldo_liquidar) ||
        centavos(totais.liq - totais.nob) !== centavos(totais.a_pagar)
      ) {
        problemas.push({ gravidade: "aviso", linha: indice, mensagem: `EMP ${emps[0].numero}: saldo a liquidar ou a pagar diferente da conta do relatório.` });
      }
      continue;
    }

    // Histórico da liquidação (vai para a última LIQ do bloco)
    if (n.startsWith("historico da liquidacao")) {
      const liq = [...bloco.documentos].reverse().find((d) => d.tipo === "LIQ");
      if (liq) liq.historico = texto.replace(/^Hist[óo]rico da Liquida[çc][ãa]o:\s*/i, "").trim() || null;
      continue;
    }

    // Documento: tipo + número
    const tipo = tipoDoDocumento(primeiro);
    if (TIPOS.has(tipo) && trechos[1] && RE_NUMERO.test(trechos[1].texto)) {
      const numero = trechos[1].texto;
      const resto = trechos.slice(2);
      const data = resto.map((t) => dataIso(t.texto)).find(Boolean) ?? null;
      if (!data) {
        problemas.push({ gravidade: "erro", mensagem: `${tipo} ${numero} (página ${linhaPdf.pagina}) sem data.` });
        continue;
      }
      if (tipo === "PED") {
        const textos = resto.filter((t) => !RE_DATA.test(t.texto));
        const dot = textos.find((t) => /^\d{5}\.\d{4}\./.test(t.texto));
        const cred = textos.find((t) => RE_CREDOR.test(t.texto));
        bloco.ped = {
          numero,
          data,
          dotacao: dot?.texto ?? "",
          credor: cred?.texto ?? "",
          xDotacao: dot?.x ?? NaN,
          xCredor: cred?.x ?? NaN,
        };
        bloco.continuando = true;
        continue;
      }
      bloco.continuando = false;
      const pc = resto.find((t) => t.texto === "P" || t.texto === "C")?.texto as "P" | "C" | undefined;
      const { valores, perdidos } = atribuirValores(resto.filter((t) => RE_VALOR.test(t.texto)), ancoras);
      if (perdidos.length || valores.saldo_liquidar !== undefined || valores.a_pagar !== undefined) {
        problemas.push({ gravidade: "erro", mensagem: `${tipo} ${numero} (página ${linhaPdf.pagina}): valor fora das colunas.` });
      }
      const { saldo_liquidar: _s, a_pagar: _p, ...lancados } = valores;
      bloco.documentos.push({ tipo: tipo as TipoDocumentoFip614, numero, data, pc: pc ?? null, valores: lancados, historico: null });
      continue;
    }

    // Continuação da dotação e do nome do credor, logo abaixo do PED
    if (bloco.ped && bloco.continuando) {
      for (const t of trechos) {
        if (Math.abs(t.x - bloco.ped.xDotacao) <= TOLERANCIA_CONTINUACAO) bloco.ped.dotacao += t.texto;
        else if (Math.abs(t.x - bloco.ped.xCredor) <= TOLERANCIA_CONTINUACAO) bloco.ped.credor += ` ${t.texto}`;
      }
    }
  }
  if (bloco) fecharSemTotal();

  if (!reconhecido) {
    problemas.push({ gravidade: "erro", mensagem: 'O arquivo não parece o "FIP 614 - Situação de Empenho" do FIPLAN.' });
  }
  // Sem o cabeçalho (Excel): o exercício sai do número dos empenhos (17302.0001.26.00051-8 → 2026)
  if (!exercicio && linhas.length) {
    const anos = new Set(linhas.map((l) => `20${l.numero.split(".")[2]}`));
    if (anos.size === 1) exercicio = [...anos][0];
    else problemas.push({ gravidade: "erro", mensagem: `O relatório mistura exercícios (${[...anos].join(", ")}); exporte um por vez.` });
  }
  const ano = Number(exercicio);
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    problemas.push({ gravidade: "erro", mensagem: "Exercício não encontrado no cabeçalho do relatório." });
  }
  if (!uo) problemas.push({ gravidade: "erro", mensagem: "Unidade orçamentária não encontrada no cabeçalho do relatório." });
  if (reconhecido && linhas.length === 0) {
    problemas.push({ gravidade: "erro", mensagem: "Nenhum empenho encontrado no relatório." });
  } else if (linhas.length && totaisUg === 0) {
    problemas.push({ gravidade: "aviso", mensagem: 'O relatório não trouxe "TOTAL UG"; a soma dos empenhos não pôde ser conferida.' });
  }
  const repetidos = linhas.map((l) => l.numero).filter((num, i, todos) => todos.indexOf(num) !== i);
  for (const num of new Set(repetidos)) {
    problemas.push({ gravidade: "erro", mensagem: `EMP ${num} aparece mais de uma vez no relatório.` });
  }

  if (exercicio) cabecalho["Exercício"] = exercicio;
  if (referencia) cabecalho["Data de referência"] = referencia;
  cabecalho["Empenhos"] = String(linhas.length);

  return { linhas, problemas, cabecalho, parametros: { exercicio: ano, uo, data_referencia: dataIso(referencia) } };
}
