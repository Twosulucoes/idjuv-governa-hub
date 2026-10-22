/**
 * Planilha (Excel) da conciliação mensal: o quadro com um resumo de tudo, os casamentos (qual lançamento casou com
 * qual, pela regra e com a justificativa), as quatro listas de pendências e todos os itens do mês. O PDF do quadro é o
 * documento oficial; a planilha é para conferir e entender a conciliação.
 */

import * as XLSX from "xlsx";
import {
  LISTAS_PENDENCIAS,
  ROTULO_REGRA,
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

/** Texto, número (quantidade, grupo) ou dinheiro (sai em reais com duas casas). */
export type Celula = string | number | { reais: number };
export interface AbaPlanilha {
  nome: string;
  linhas: Celula[][];
  /** Largura de cada coluna, em caracteres. */
  larguras: number[];
}

const reais = (centavos: number): Celula => ({ reais: centavos / 100 });
const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const LADO: Record<LadoConciliacao, string> = { contabil: "Razão (FIPLAN)", bancario: "Banco (extrato)" };
const NATUREZA: Record<NaturezaConciliacao, string> = { debito: "Débito", credito: "Crédito" };

const COLUNAS_ITEM = ["Lado", "Natureza", "Data", "Documento", "Tipo", "Histórico", "Valor (R$)", "Origem"];
const LARGURAS_ITEM = [16, 9, 11, 18, 6, 60, 15, 24];
const colunasDoItem = (i: ItemConciliacao): Celula[] => [
  LADO[i.lado],
  NATUREZA[i.natureza],
  dataBR(i.data),
  i.documento,
  i.tipo,
  i.historico,
  reais(i.valorCentavos),
  ORIGEM[i.origem],
];

/** Itens de um grupo na ordem de leitura: razão antes do banco, depois por data. */
const ordemDeLeitura = (a: ItemConciliacao, b: ItemConciliacao) =>
  a.lado === b.lado ? a.data.localeCompare(b.data) : a.lado === "contabil" ? -1 : 1;

export function planilhaDaConciliacao(e: EntradaPlanilhaConciliacao): AbaPlanilha[] {
  const porId = new Map(e.itens.map((i) => [i.id, i]));
  const grupoDoItem = new Map<string, number>();
  e.resultado.casamentos.forEach((c, g) => c.itens.forEach((id) => grupoDoItem.set(id, g + 1)));
  const q = e.quadro;

  // Resumo: o quadro, o fundo e quanto cada regra casou
  const porRegra = new Map<RegraConciliacao, { grupos: number; itens: number; centavos: number }>();
  for (const c of e.resultado.casamentos) {
    const r = porRegra.get(c.regra) ?? { grupos: 0, itens: 0, centavos: 0 };
    r.grupos += 1;
    r.itens += c.itens.length;
    // Valor do grupo: a soma de um lado do casamento (débitos = créditos)
    r.centavos += c.itens.reduce((s, id) => {
      const i = porId.get(id);
      return i && i.natureza === "debito" ? s + i.valorCentavos : s;
    }, 0);
    porRegra.set(c.regra, r);
  }
  const casados = e.resultado.casamentos.reduce((s, c) => s + c.itens.length, 0);
  const resumo: Celula[][] = [
    ["Conciliação bancária mensal"],
    ["Conta", e.conta],
    ["Competência", e.competencia],
    ["Situação", e.fechado ? "Mês fechado" : "Rascunho (mês não fechado)"],
    ["Gerada em", e.geradoEm],
    [],
    ["Quadro da conciliação", "Valor (R$)"],
    ["Saldo do razão (FIPLAN)", reais(q.saldoRazaoCentavos)],
    [`(-) ${LISTAS_PENDENCIAS[0].titulo}`, reais(q.debitosContabeisCentavos)],
    [`(+) ${LISTAS_PENDENCIAS[1].titulo}`, reais(q.creditosContabeisCentavos)],
    [`(-) ${LISTAS_PENDENCIAS[2].titulo}`, reais(q.debitosBancariosCentavos)],
    [`(+) ${LISTAS_PENDENCIAS[3].titulo}`, reais(q.creditosBancariosCentavos)],
    ["Saldo ajustado", reais(q.saldoAjustadoCentavos)],
    ["Saldo do extrato (conta + fundo)", reais(q.saldoExtratoCentavos)],
    ["   Conta corrente", reais(e.saldoContaCentavos)],
    ["   Fundo de investimento", reais(e.saldoFundoCentavos)],
    ["Diferença (ajustado − extrato)", reais(q.diferencaCentavos)],
    [],
  ];
  if (e.fundo) {
    resumo.push(
      ["Fundo de investimento", "Valor (R$)"],
      ["Saldo no início do mês", reais(e.fundo.inicioCentavos)],
      ["(+) Aplicações (BB-APLIC no extrato)", reais(e.fundo.aplicacoesCentavos)],
      ["(-) Resgates automáticos", reais(e.fundo.resgatesCentavos)],
      ["(+) Rendimento do mês", reais(e.fundo.rendimentoCentavos)],
      ["Saldo no fim do mês", reais(e.fundo.fimCentavos)],
      [],
    );
  }
  resumo.push(
    ["Itens", "Quantidade"],
    ["Itens no mês (razão + banco)", e.itens.length],
    ["Itens casados", casados],
    ["Grupos de casamento", e.resultado.casamentos.length],
    ["Itens pendentes", e.resultado.pendentes.length],
    [],
    ["Casamentos por regra", "Grupos", "Itens", "Valor casado (R$)"],
    ...(Object.keys(ROTULO_REGRA) as RegraConciliacao[])
      .filter((r) => porRegra.has(r))
      .map((r) => {
        const v = porRegra.get(r)!;
        return [ROTULO_REGRA[r], v.grupos, v.itens, reais(v.centavos)];
      }),
  );

  // Casamentos: uma linha por item, com o número do grupo para filtrar
  const casamentos: Celula[][] = [["Grupo", "Regra", "Justificativa", ...COLUNAS_ITEM]];
  e.resultado.casamentos.forEach((c, g) => {
    const itens = c.itens.map((id) => porId.get(id)).filter((i): i is ItemConciliacao => !!i).sort(ordemDeLeitura);
    for (const i of itens) casamentos.push([g + 1, ROTULO_REGRA[c.regra], c.justificativa ?? "", ...colunasDoItem(i)]);
  });

  // Pendências: as quatro listas do quadro, uma depois da outra
  const pendencias: Celula[][] = [["Lista do quadro", "Sinal", ...COLUNAS_ITEM]];
  for (const l of LISTAS_PENDENCIAS) {
    for (const p of e.resultado.pendentes.filter((p) => p.lado === l.lado && p.natureza === l.natureza)) {
      pendencias.push([l.titulo, l.sinal, ...colunasDoItem(p)]);
    }
  }

  // Todos os itens, na ordem em que entraram, com a situação de cada um
  const todos: Celula[][] = [["Situação", "Grupo", "Regra", ...COLUNAS_ITEM]];
  for (const i of e.itens) {
    const g = grupoDoItem.get(i.id);
    todos.push(
      g
        ? ["Casado", g, ROTULO_REGRA[e.resultado.casamentos[g - 1].regra], ...colunasDoItem(i)]
        : ["Pendente", "", "", ...colunasDoItem(i)],
    );
  }

  return [
    { nome: "Resumo", linhas: resumo, larguras: [52, 18, 10, 18] },
    { nome: "Casamentos", linhas: casamentos, larguras: [7, 20, 40, ...LARGURAS_ITEM] },
    { nome: "Pendências", linhas: pendencias, larguras: [46, 6, ...LARGURAS_ITEM] },
    { nome: "Todos os itens", linhas: todos, larguras: [10, 7, 20, ...LARGURAS_ITEM] },
  ];
}

/** Pasta de trabalho do Excel com as abas; dinheiro em reais com duas casas. */
export function livroDaPlanilha(abas: AbaPlanilha[]): XLSX.WorkBook {
  const livro = XLSX.utils.book_new();
  for (const aba of abas) {
    const folha = XLSX.utils.aoa_to_sheet(aba.linhas.map((linha) => linha.map((v) => (typeof v === "object" ? v.reais : v))));
    folha["!cols"] = aba.larguras.map((wch) => ({ wch }));
    aba.linhas.forEach((linha, r) =>
      linha.forEach((v, c) => {
        if (typeof v === "object") folha[XLSX.utils.encode_cell({ r, c })].z = "#,##0.00";
      }),
    );
    XLSX.utils.book_append_sheet(livro, folha, aba.nome);
  }
  return livro;
}

export function baixarPlanilhaDaConciliacao(abas: AbaPlanilha[], nomeArquivo: string): void {
  XLSX.writeFile(livroDaPlanilha(abas), nomeArquivo);
}
