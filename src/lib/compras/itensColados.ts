/**
 * Itens do termo de referência colados de uma tabela do Word ou do Excel (linhas com tabulação ou ponto e vírgula).
 * Reconhece as colunas pelo cabeçalho (item, descrição/especificação, unidade, quantidade, CATMAT/CATSER) ou, sem
 * cabeçalho, pela ordem nº, descrição, unidade, quantidade [, código] ou descrição, unidade, quantidade.
 * Só leitura do texto; quem chama grava os itens.
 */

import { lerNumeroBr } from "@/lib/pca/numero";
import { normalizarTexto } from "./pesquisaPrecos";

export interface ItemColado {
  numero: number | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  /** Código do item do CATMAT ou do serviço do CATSER, quando a tabela tem a coluna. */
  codigo: number | null;
}

type Coluna = "numero" | "descricao" | "unidade" | "quantidade" | "codigo";

const CABECALHO: [Coluna, RegExp][] = [
  ["codigo", /^(catmat|catser|codigo|cod|catalogo)/],
  ["descricao", /^(descri|especifica|objeto|produto|material|servico)/],
  ["quantidade", /^(qtd|qtde|qde|quant)/],
  ["unidade", /^(unid|und|un|u m|medida|unidade)/],
  ["numero", /^(item|n|no|numero|seq|lote)$/],
];

function colunaDoCabecalho(celula: string): Coluna | null {
  const t = normalizarTexto(celula);
  return CABECALHO.find(([, re]) => re.test(t))?.[0] ?? null;
}

const inteiroPositivo = (t: string | undefined) => (/^\d{1,9}$/.test((t ?? "").trim()) ? Number(t!.trim()) : null);

export function lerItensColados(texto: string): { itens: ItemColado[]; ignoradas: number[] } {
  const linhas = texto.split(/\r?\n/).map((l, i) => ({ n: i + 1, celulas: (l.includes("\t") ? l.split("\t") : l.split(";")).map((c) => c.trim()) }))
    .filter((l) => l.celulas.some(Boolean));
  if (!linhas.length) return { itens: [], ignoradas: [] };

  let mapa: Partial<Record<Coluna, number>> = {};
  let corpo = linhas;
  const cab = linhas[0].celulas.map(colunaDoCabecalho);
  if (cab.includes("descricao")) {
    cab.forEach((c, i) => { if (c && mapa[c] === undefined) mapa[c] = i; });
    corpo = linhas.slice(1);
  }

  const itens: ItemColado[] = [];
  const ignoradas: number[] = [];
  for (const { n, celulas } of corpo) {
    let m = mapa;
    if (!Object.keys(m).length) {
      m = inteiroPositivo(celulas[0]) !== null && celulas.length >= 4
        ? { numero: 0, descricao: 1, unidade: 2, quantidade: 3, codigo: celulas.length >= 5 ? 4 : undefined }
        : { descricao: 0, unidade: 1, quantidade: 2 };
    }
    const pegar = (c: Coluna) => (m[c] === undefined ? "" : celulas[m[c]!] ?? "");
    const descricao = pegar("descricao").replace(/\s+/g, " ").trim();
    const unidade = pegar("unidade").trim();
    const quantidade = lerNumeroBr(pegar("quantidade"));
    if (!descricao || !unidade || unidade.length > 60 || descricao.length > 2000 || !(quantidade > 0)) {
      ignoradas.push(n);
      continue;
    }
    const numero = inteiroPositivo(pegar("numero"));
    itens.push({ numero: numero && numero <= 9999 ? numero : null, descricao, unidade, quantidade, codigo: inteiroPositivo(pegar("codigo")) });
  }
  return { itens, ignoradas };
}
