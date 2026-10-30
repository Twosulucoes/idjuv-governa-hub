/**
 * Localizador de processos do SEI: o que cada fonte significa na tela (nome, link do registro) e o agrupamento do
 * resultado da RPC `localizar_processos_sei` por processo SEI (um cartão por número, com tudo o que o sistema tem dele).
 * A tela só lê; tramitar é no SEI.
 */

import { chaveSei } from "./numeroSei";

export type OrigemLocalizador =
  | "workflow"
  | "contratacao"
  | "contrato"
  | "passagem"
  | "pca"
  | "empenho"
  | "documento"
  | "termo_cessao"
  | "diaria";

/** Uma linha devolvida por `localizar_processos_sei` (e, sem `ref`/`valor`, por `processos_parados`). */
export interface RegistroLocalizado {
  chave: string | null;
  numero_sei: string | null;
  origem: OrigemLocalizador;
  registro_id: string;
  ref: string | null;
  titulo: string | null;
  situacao: string | null;
  onde: string | null;
  atualizado_em: string | null;
  valor: number | null;
}

interface InfoOrigem {
  rotulo: string;
  /** Singular e plural para o resumo do cartão ("1 empenho", "2 empenhos"). */
  singular: string;
  plural: string;
  link: (r: Pick<RegistroLocalizado, "registro_id" | "ref">) => string;
}

export const ORIGENS: Record<OrigemLocalizador, InfoOrigem> = {
  workflow: { rotulo: "Processo acompanhado", singular: "processo acompanhado", plural: "processos acompanhados", link: (r) => `/workflow/processos/${r.registro_id}` },
  contratacao: { rotulo: "Processo de contratação", singular: "processo de contratação", plural: "processos de contratação", link: (r) => `/compras/processos/${r.registro_id}` },
  contrato: { rotulo: "Contrato", singular: "contrato", plural: "contratos", link: (r) => `/contratos/${r.registro_id}` },
  passagem: { rotulo: "Pedido de passagem", singular: "pedido de passagem", plural: "pedidos de passagem", link: (r) => `/gabinete/passagens/${r.registro_id}` },
  pca: { rotulo: "Demanda do PCA", singular: "demanda do PCA", plural: "demandas do PCA", link: (r) => (r.ref ? `/compras/pca/${r.ref}` : "/compras/pca") },
  empenho: { rotulo: "Empenho", singular: "empenho", plural: "empenhos", link: (r) => `/financeiro/empenhos/${r.registro_id}` },
  documento: { rotulo: "Ato", singular: "ato", plural: "atos", link: (r) => (r.ref === "portaria" ? "/gabinete/portarias" : "/admin/documentos") },
  termo_cessao: { rotulo: "Termo de cessão", singular: "termo de cessão", plural: "termos de cessão", link: (r) => (r.ref ? `/unidades/${r.ref}` : "/unidades") },
  diaria: { rotulo: "Diária", singular: "diária", plural: "diárias", link: () => "/rh/viagens" },
};

/** Ordem das fontes dentro do cartão: o processo primeiro, o dinheiro depois, os atos por último. */
const ORDEM: OrigemLocalizador[] = ["contratacao", "contrato", "workflow", "pca", "passagem", "empenho", "diaria", "termo_cessao", "documento"];

export interface ProcessoLocalizado {
  /** Chave do nº SEI; registro sem nº reconhecível fica sozinho com a chave `origem:id`. */
  chave: string;
  /** Como o número aparece no registro (prefere o formato completo, que é o que o SEI pesquisa). */
  numeroSei: string | null;
  titulo: string | null;
  onde: string | null;
  ultimaMovimentacao: string | null;
  registros: RegistroLocalizado[];
}

function maisRecente(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return b > a ? b : a;
}

/** Agrupa por processo SEI, do processo com movimentação mais recente para o mais antigo. */
export function agruparPorProcesso(registros: RegistroLocalizado[]): ProcessoLocalizado[] {
  const grupos = new Map<string, ProcessoLocalizado>();
  for (const r of registros) {
    const chave = r.chave ?? chaveSei(r.numero_sei) ?? `${r.origem}:${r.registro_id}`;
    let g = grupos.get(chave);
    if (!g) {
      g = { chave, numeroSei: null, titulo: null, onde: null, ultimaMovimentacao: null, registros: [] };
      grupos.set(chave, g);
    }
    g.registros.push(r);
    g.ultimaMovimentacao = maisRecente(g.ultimaMovimentacao, r.atualizado_em);
  }

  for (const g of grupos.values()) {
    g.registros.sort((a, b) => ORDEM.indexOf(a.origem) - ORDEM.indexOf(b.origem) || (b.atualizado_em ?? "").localeCompare(a.atualizado_em ?? ""));
    const numeros = g.registros.map((r) => r.numero_sei?.trim()).filter((n): n is string => !!n);
    g.numeroSei = numeros.sort((a, b) => b.length - a.length)[0] ?? null;
    g.titulo = g.registros.find((r) => r.titulo)?.titulo ?? null;
    const comLugar = g.registros.filter((r) => r.onde && (r.origem === "contratacao" || r.origem === "workflow"));
    g.onde = comLugar.sort((a, b) => (b.atualizado_em ?? "").localeCompare(a.atualizado_em ?? ""))[0]?.onde ?? null;
  }

  return [...grupos.values()].sort((a, b) => (b.ultimaMovimentacao ?? "").localeCompare(a.ultimaMovimentacao ?? ""));
}

/** Contagem por fonte, na ordem do cartão: "1 processo de contratação · 2 empenhos". */
export function resumoDasFontes(registros: RegistroLocalizado[]): string {
  const contagem = new Map<OrigemLocalizador, number>();
  for (const r of registros) contagem.set(r.origem, (contagem.get(r.origem) ?? 0) + 1);
  return ORDEM.filter((o) => contagem.has(o))
    .map((o) => {
      const n = contagem.get(o)!;
      return n === 1 ? `1 ${ORIGENS[o].singular}` : `${n} ${ORIGENS[o].plural}`;
    })
    .join(" · ");
}
