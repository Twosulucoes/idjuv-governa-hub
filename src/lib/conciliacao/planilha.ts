/**
 * Planilha (Excel) da conciliação mensal: o quadro com um resumo de tudo, os casamentos (qual lançamento casou com
 * qual, pela regra e com a justificativa), as quatro listas de pendências e todos os itens do mês. O PDF do quadro é o
 * documento oficial; a planilha é para conferir e entender a conciliação.
 *
 * `planilhaDaConciliacao` monta as abas como dados (linhas com o papel de cada uma: título, seção, cabeçalho, dado,
 * total); `livroDaPlanilha` aplica a formatação com o ExcelJS (o xlsx da SheetJS não grava estilo).
 */

import type ExcelJS from "exceljs";
import {
  LISTAS_PENDENCIAS,
  ROTULO_REGRA,
  formatarCentavos,
  type ItemConciliacao,
  type LadoConciliacao,
  type NaturezaConciliacao,
  type OrigemItemConciliacao,
  type QuadroConciliacao,
  type RegraConciliacao,
  type ResultadoConciliacao,
} from "./tipos";

const ORIGEM: Record<OrigemItemConciliacao, string> = {
  mes: "Do mês",
  anterior: "Pendência do mês anterior",
  abertura: "Abertura",
};

export interface FundoDaPlanilha {
  inicioCentavos: number;
  aplicacoesCentavos: number;
  resgatesCentavos: number;
  rendimentoCentavos: number;
  fimCentavos: number;
}

export interface EntradaPlanilhaConciliacao {
  /** "001 · 1234-5 · 10050-1". */
  conta: string;
  /** "Julho/2026". */
  competencia: string;
  fechado: boolean;
  geradoEm: string;
  quadro: QuadroConciliacao;
  saldoContaCentavos: number;
  /** Null quando o mês não guardou o movimento do fundo (saldo digitado). */
  fundo: FundoDaPlanilha | null;
  saldoFundoCentavos: number;
  itens: ItemConciliacao[];
  resultado: ResultadoConciliacao;
}

/** Texto, número (quantidade, grupo), dinheiro (sai em reais com duas casas) ou data ISO (sai como data). */
export type Celula = string | number | { reais: number } | { data: string };

export type PapelLinha = "titulo" | "subtitulo" | "secao" | "cabecalho" | "dado" | "total" | "vazio";
export interface LinhaPlanilha {
  papel: PapelLinha;
  celulas: Celula[];
  /** Faixa clara alternada (um grupo de casamento sim, outro não). */
  faixa?: boolean;
  /** Linha que pede atenção (pendente, diferença diferente de zero) ou que fecha (diferença zero). */
  destaque?: "ok" | "alerta";
}

export interface AbaPlanilha {
  nome: string;
  /** Largura de cada coluna, em caracteres; `quebra` quebra o texto longo em várias linhas. */
  colunas: { largura: number; quebra?: boolean; centro?: boolean }[];
  linhas: LinhaPlanilha[];
  /** Linha (base 1) do cabeçalho da tabela: congela até ela e liga o filtro. */
  linhaDoFiltro?: number;
}

const reais = (centavos: number): Celula => ({ reais: centavos / 100 });
const LADO: Record<LadoConciliacao, string> = { contabil: "Razão (FIPLAN)", bancario: "Banco (extrato)" };
const NATUREZA: Record<NaturezaConciliacao, string> = { debito: "Débito", credito: "Crédito" };

const COLUNAS_ITEM = ["Lado", "Natureza", "Data", "Documento", "Tipo", "Histórico", "Valor (R$)", "Origem"];
const LARGURAS_ITEM = [
  { largura: 15 },
  { largura: 10, centro: true },
  { largura: 11, centro: true },
  { largura: 16 },
  { largura: 6, centro: true },
  { largura: 55, quebra: true },
  { largura: 16 },
  { largura: 18, quebra: true },
];
const colunasDoItem = (i: ItemConciliacao): Celula[] => [
  LADO[i.lado],
  NATUREZA[i.natureza],
  { data: i.data },
  i.documento,
  i.tipo,
  i.historico,
  reais(i.valorCentavos),
  ORIGEM[i.origem],
];

/** Itens de um grupo na ordem de leitura: razão antes do banco, depois por data. */
const ordemDeLeitura = (a: ItemConciliacao, b: ItemConciliacao) =>
  a.lado === b.lado ? a.data.localeCompare(b.data) : a.lado === "contabil" ? -1 : 1;

const linha = (papel: PapelLinha, ...celulas: Celula[]): LinhaPlanilha => ({ papel, celulas });
const VAZIA: LinhaPlanilha = { papel: "vazio", celulas: [] };

export function planilhaDaConciliacao(e: EntradaPlanilhaConciliacao): AbaPlanilha[] {
  const porId = new Map(e.itens.map((i) => [i.id, i]));
  const grupoDoItem = new Map<string, number>();
  e.resultado.casamentos.forEach((c, g) => c.itens.forEach((id) => grupoDoItem.set(id, g + 1)));
  const q = e.quadro;
  const titulo = `Conciliação bancária mensal · ${e.competencia}`;
  const subtitulo = `Conta ${e.conta} · ${e.fechado ? "Mês fechado" : "Rascunho (mês não fechado)"} · gerada em ${e.geradoEm}`;
  const cabecalhoDaAba = (nome: string) => [linha("titulo", `${titulo} · ${nome}`), linha("subtitulo", subtitulo), VAZIA];
  /** Valor do grupo: a soma de um lado do casamento (débitos = créditos). */
  const valorDoGrupo = (ids: string[]) =>
    ids.reduce((s, id) => {
      const i = porId.get(id);
      return i && i.natureza === "debito" ? s + i.valorCentavos : s;
    }, 0);

  // Resumo: o quadro, o fundo e quanto cada regra casou
  const porRegra = new Map<RegraConciliacao, { grupos: number; itens: number; centavos: number }>();
  for (const c of e.resultado.casamentos) {
    const r = porRegra.get(c.regra) ?? { grupos: 0, itens: 0, centavos: 0 };
    r.grupos += 1;
    r.itens += c.itens.length;
    r.centavos += valorDoGrupo(c.itens);
    porRegra.set(c.regra, r);
  }
  const casados = e.resultado.casamentos.reduce((s, c) => s + c.itens.length, 0);
  const resumo: LinhaPlanilha[] = [
    linha("titulo", titulo),
    linha("subtitulo", subtitulo),
    VAZIA,
    linha("secao", "Quadro da conciliação", "Valor (R$)"),
    linha("dado", "Saldo do razão (FIPLAN)", reais(q.saldoRazaoCentavos)),
    linha("dado", `(-) ${LISTAS_PENDENCIAS[0].titulo}`, reais(q.debitosContabeisCentavos)),
    linha("dado", `(+) ${LISTAS_PENDENCIAS[1].titulo}`, reais(q.creditosContabeisCentavos)),
    linha("dado", `(-) ${LISTAS_PENDENCIAS[2].titulo}`, reais(q.debitosBancariosCentavos)),
    linha("dado", `(+) ${LISTAS_PENDENCIAS[3].titulo}`, reais(q.creditosBancariosCentavos)),
    linha("total", "Saldo ajustado", reais(q.saldoAjustadoCentavos)),
    linha("dado", "Conta corrente", reais(e.saldoContaCentavos)),
    linha("dado", "Fundo de investimento", reais(e.saldoFundoCentavos)),
    linha("total", "Saldo do extrato (conta + fundo)", reais(q.saldoExtratoCentavos)),
    { ...linha("total", "Diferença (ajustado − extrato)", reais(q.diferencaCentavos)), destaque: q.diferencaCentavos === 0 ? "ok" : "alerta" },
    VAZIA,
  ];
  if (e.fundo) {
    resumo.push(
      linha("secao", "Fundo de investimento no mês", "Valor (R$)"),
      linha("dado", "Saldo no início do mês", reais(e.fundo.inicioCentavos)),
      linha("dado", "(+) Aplicações (BB-APLIC no extrato)", reais(e.fundo.aplicacoesCentavos)),
      linha("dado", "(-) Resgates automáticos", reais(e.fundo.resgatesCentavos)),
      linha("dado", "(+) Rendimento do mês", reais(e.fundo.rendimentoCentavos)),
      linha("total", "Saldo no fim do mês", reais(e.fundo.fimCentavos)),
      VAZIA,
    );
  }
  resumo.push(
    linha("secao", "Itens do mês", "Quantidade"),
    linha("dado", "Itens no mês (razão + banco)", e.itens.length),
    linha("dado", "Itens casados", casados),
    linha("dado", "Grupos de casamento", e.resultado.casamentos.length),
    { ...linha("dado", "Itens pendentes", e.resultado.pendentes.length), destaque: e.resultado.pendentes.length ? "alerta" : undefined },
    VAZIA,
    linha("secao", "Casamentos por regra", "Grupos", "Itens", "Valor casado (R$)"),
    ...(Object.keys(ROTULO_REGRA) as RegraConciliacao[])
      .filter((r) => porRegra.has(r))
      .map((r) => {
        const v = porRegra.get(r)!;
        return linha("dado", ROTULO_REGRA[r], v.grupos, v.itens, reais(v.centavos));
      }),
  );

  // Casamentos: um bloco por grupo (regra, justificativa e valor), com os lançamentos do razão e do banco
  const casamentos: LinhaPlanilha[] = [...cabecalhoDaAba("Casamentos"), linha("cabecalho", "Grupo", ...COLUNAS_ITEM)];
  e.resultado.casamentos.forEach((c, g) => {
    const faixa = g % 2 === 0;
    const justificativa = c.justificativa ? ` · ${c.justificativa}` : "";
    const valor = formatarCentavos(valorDoGrupo(c.itens));
    casamentos.push({ ...linha("secao", `Grupo ${g + 1} · ${ROTULO_REGRA[c.regra]} · R$ ${valor}${justificativa}`), faixa });
    const itens = c.itens.map((id) => porId.get(id)).filter((i): i is ItemConciliacao => !!i).sort(ordemDeLeitura);
    for (const i of itens) casamentos.push({ ...linha("dado", g + 1, ...colunasDoItem(i)), faixa });
  });
  if (!e.resultado.casamentos.length) casamentos.push(linha("dado", "", "Nenhum casamento no mês."));

  // Pendências: as quatro listas do quadro, cada uma com o seu total
  const pendencias: LinhaPlanilha[] = [...cabecalhoDaAba("Pendências")];
  for (const l of LISTAS_PENDENCIAS) {
    const itens = e.resultado.pendentes.filter((p) => p.lado === l.lado && p.natureza === l.natureza);
    pendencias.push(linha("secao", `${l.sinal} ${l.titulo}`), linha("cabecalho", ...COLUNAS_ITEM));
    if (itens.length) {
      for (const p of itens) pendencias.push(linha("dado", ...colunasDoItem(p)));
    } else {
      pendencias.push(linha("dado", "Nenhum item nesta lista."));
    }
    pendencias.push(
      linha("total", `Total (${itens.length} ${itens.length === 1 ? "item" : "itens"})`, "", "", "", "", "", reais(itens.reduce((s, p) => s + p.valorCentavos, 0))),
      VAZIA,
    );
  }

  // Todos os itens, na ordem em que entraram, com a situação de cada um (tabela com filtro)
  const todos: LinhaPlanilha[] = [...cabecalhoDaAba("Todos os itens"), linha("cabecalho", "Situação", "Grupo", "Regra", ...COLUNAS_ITEM)];
  for (const i of e.itens) {
    const g = grupoDoItem.get(i.id);
    todos.push(
      g
        ? linha("dado", "Casado", g, ROTULO_REGRA[e.resultado.casamentos[g - 1].regra], ...colunasDoItem(i))
        : { ...linha("dado", "Pendente", "", "", ...colunasDoItem(i)), destaque: "alerta" },
    );
  }

  return [
    { nome: "Resumo", linhas: resumo, colunas: [{ largura: 58 }, { largura: 18 }, { largura: 10 }, { largura: 20 }] },
    { nome: "Casamentos", linhas: casamentos, colunas: [{ largura: 8, centro: true }, ...LARGURAS_ITEM], linhaDoFiltro: 4 },
    { nome: "Pendências", linhas: pendencias, colunas: LARGURAS_ITEM },
    { nome: "Todos os itens", linhas: todos, colunas: [{ largura: 10 }, { largura: 7, centro: true }, { largura: 18 }, ...LARGURAS_ITEM], linhaDoFiltro: 4 },
  ];
}

const COR = {
  titulo: "FF1F3A5F",
  cabecalho: "FF1F3A5F",
  textoCabecalho: "FFFFFFFF",
  secao: "FFDCE6F1",
  faixa: "FFF3F6FA",
  total: "FFEDEDED",
  ok: "FFE2F0D9",
  alerta: "FFFDE9E7",
  borda: "FFBFBFBF",
};
const preenchimento = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const BORDA: Partial<ExcelJS.Borders> = (["top", "left", "bottom", "right"] as const).reduce(
  (b, lado) => ({ ...b, [lado]: { style: "thin", color: { argb: COR.borda } } }),
  {},
);

/** Data ISO como data do Excel (meio-dia UTC, para o fuso não mudar o dia). */
const comoData = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12));
};

/** Pasta de trabalho formatada: título, seções, cabeçalho escuro, bordas, R$ e datas, faixas por grupo. */
export async function livroDaPlanilha(abas: AbaPlanilha[]): Promise<ExcelJS.Workbook> {
  const { default: Excel } = await import("exceljs");
  const livro = new Excel.Workbook();
  livro.creator = "Conciliação bancária mensal";
  for (const aba of abas) {
    const n = aba.colunas.length;
    const folha = livro.addWorksheet(aba.nome, {
      views: aba.linhaDoFiltro ? [{ state: "frozen", ySplit: aba.linhaDoFiltro }] : [],
      // A4; o resumo cabe numa página em pé, as tabelas deitadas com a largura numa página
      pageSetup:
        aba.nome === "Resumo"
          ? { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 }
          : { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    folha.columns = aba.colunas.map((c) => ({ width: c.largura }));
    // Até onde vão as bordas de uma linha de dado: a largura do último cabeçalho (no resumo, cada bloco tem a sua)
    let larguraDoBloco = n;
    aba.linhas.forEach((l, indice) => {
      const r = indice + 1;
      const row = folha.getRow(r);
      l.celulas.forEach((v, c) => {
        const cel = row.getCell(c + 1);
        if (typeof v === "object" && "reais" in v) {
          cel.value = v.reais;
          cel.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
        } else if (typeof v === "object") {
          cel.value = comoData(v.data);
          cel.numFmt = "dd/mm/yyyy";
        } else {
          cel.value = v;
        }
      });
      if (l.papel === "titulo" || l.papel === "subtitulo") {
        folha.mergeCells(r, 1, r, n);
        row.getCell(1).font = l.papel === "titulo" ? { bold: true, size: 14, color: { argb: COR.titulo } } : { italic: true, color: { argb: "FF595959" } };
        return;
      }
      if (l.papel === "vazio") return;
      // Seção de uma célula só (grupo, lista) ocupa a linha inteira
      if (l.papel === "secao" && l.celulas.length === 1) folha.mergeCells(r, 1, r, n);
      const secaoInteira = l.papel === "secao" && l.celulas.length === 1;
      if (l.papel === "cabecalho" || (l.papel === "secao" && !secaoInteira)) larguraDoBloco = l.celulas.length;
      const largura = secaoInteira ? 1 : Math.max(l.celulas.length, larguraDoBloco);
      for (let c = 1; c <= Math.min(largura, n); c++) {
        const cel = row.getCell(c);
        cel.border = BORDA;
        const coluna = aba.colunas[c - 1];
        cel.alignment = {
          vertical: "top",
          wrapText: !!coluna?.quebra || secaoInteira,
          horizontal: coluna?.centro && l.papel === "dado" ? "center" : undefined,
        };
        if (l.papel === "cabecalho") {
          cel.font = { bold: true, color: { argb: COR.textoCabecalho } };
          cel.fill = preenchimento(COR.cabecalho);
          cel.alignment = { vertical: "middle", wrapText: true };
        } else if (l.papel === "secao") {
          cel.font = { bold: true };
          cel.fill = preenchimento(COR.secao);
        } else if (l.papel === "total") {
          cel.font = { bold: true };
          cel.fill = preenchimento(COR.total);
        } else if (l.faixa) {
          cel.fill = preenchimento(COR.faixa);
        }
        if (l.destaque) cel.fill = preenchimento(COR[l.destaque]);
      }
    });
    if (aba.linhaDoFiltro) folha.autoFilter = { from: { row: aba.linhaDoFiltro, column: 1 }, to: { row: aba.linhaDoFiltro, column: n } };
  }
  return livro;
}

export async function baixarPlanilhaDaConciliacao(abas: AbaPlanilha[], nomeArquivo: string): Promise<void> {
  const livro = await livroDaPlanilha(abas);
  const blob = new Blob([await livro.xlsx.writeBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
