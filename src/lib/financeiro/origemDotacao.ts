/**
 * ORIGEM DA DOTAÇÃO NO QDD: DOTAÇÃO COMUM × EMENDAS
 *
 * O QDD do FIPLAN marca cada dotação com o IDU: "Não" é dotação comum; as siglas de emenda (ECNI, ECI, EII)
 * marcam crédito que veio de emenda parlamentar. O saldo de emenda fica preso ao objeto da emenda, então não
 * pode ser somado ao saldo livre da natureza: uma contratação comum só conta com o disponível da dotação comum.
 *
 * Funções puras para a tela do QDD e para conferência com vitest.
 */

import type { Dotacao } from "@/types/financeiro";

export const IDU_DOTACAO_COMUM = "Não";

/**
 * Nome por extenso das siglas de emenda que aparecem no IDU do QDD. Sigla que não estiver aqui é tratada
 * como emenda (tudo que não é "Não") e aparece só pela sigla.
 */
export const NOMES_EMENDA: Record<string, string> = {
  ECNI: "Emenda coletiva não impositiva",
  ECI: "Emenda coletiva impositiva",
  EII: "Emenda individual impositiva",
};

/** IDU vazio também é dotação comum (dotações lançadas antes do QDD trazer o IDU). */
export function ehEmenda(idu: string | null | undefined): boolean {
  const valor = (idu ?? "").trim();
  return valor !== "" && valor.toLowerCase() !== IDU_DOTACAO_COMUM.toLowerCase();
}

/** "ECI" → "Emenda coletiva impositiva (ECI)"; "Não" → "Dotação comum". */
export function rotuloOrigem(idu: string | null | undefined): string {
  if (!ehEmenda(idu)) return "Dotação comum";
  const sigla = (idu ?? "").trim();
  return NOMES_EMENDA[sigla] ? `${NOMES_EMENDA[sigla]} (${sigla})` : `Emenda ${sigla}`;
}

type DotacaoValores = Pick<
  Dotacao,
  "idu" | "valor_atual" | "valor_bloqueado" | "valor_reserva" | "valor_empenhado" | "saldo_disponivel"
>;

export interface TotaisOrigem {
  atual: number;
  bloqueado: number;
  reserva: number;
  empenhado: number;
  disponivel: number;
}

const zerado = (): TotaisOrigem => ({ atual: 0, bloqueado: 0, reserva: 0, empenhado: 0, disponivel: 0 });

function somar(t: TotaisOrigem, d: DotacaoValores) {
  t.atual += d.valor_atual || 0;
  t.bloqueado += d.valor_bloqueado || 0;
  t.reserva += d.valor_reserva || 0;
  t.empenhado += d.valor_empenhado || 0;
  t.disponivel += d.saldo_disponivel || 0;
}

export interface ResumoOrigem {
  comum: TotaisOrigem;
  emendas: TotaisOrigem;
  /** Por sigla de emenda (ECNI, ECI, EII...), na ordem alfabética */
  porTipo: { idu: string; totais: TotaisOrigem }[];
}

/** Separa os valores da dotação comum dos de emendas, e as emendas por tipo. */
export function resumirPorOrigem(dotacoes: DotacaoValores[]): ResumoOrigem {
  const comum = zerado();
  const emendas = zerado();
  const tipos = new Map<string, TotaisOrigem>();
  for (const d of dotacoes) {
    if (!ehEmenda(d.idu)) {
      somar(comum, d);
      continue;
    }
    somar(emendas, d);
    const sigla = (d.idu ?? "").trim();
    if (!tipos.has(sigla)) tipos.set(sigla, zerado());
    somar(tipos.get(sigla)!, d);
  }
  const porTipo = [...tipos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([idu, totais]) => ({ idu, totais }));
  return { comum, emendas, porTipo };
}

/** Chave de agrupamento: a mesma natureza em fontes diferentes é dotação diferente. */
type DotacaoAgrupavel = DotacaoValores & Pick<Dotacao, "id"> & {
  natureza_despesa?: { codigo?: string | null } | null;
  fonte_recurso?: { codigo?: string | null } | null;
};

export interface GrupoNatureza<T extends DotacaoAgrupavel> {
  chave: string;
  natureza: string;
  fonte: string;
  /** Dotação comum primeiro, depois as emendas pela sigla */
  dotacoes: T[];
  /** Só quando a natureza tem mais de uma origem (comum e emenda, ou mais de uma emenda) */
  subtotal: TotaisOrigem | null;
  /** Disponível que pode ser usado sem vínculo a emenda */
  disponivelComum: number;
}

/** Agrupa as dotações por natureza e fonte, mantendo a ordem da natureza. */
export function agruparPorNatureza<T extends DotacaoAgrupavel>(dotacoes: T[]): GrupoNatureza<T>[] {
  const grupos = new Map<string, GrupoNatureza<T>>();
  for (const d of dotacoes) {
    const natureza = d.natureza_despesa?.codigo ?? "";
    const fonte = d.fonte_recurso?.codigo ?? "";
    const chave = `${natureza}|${fonte}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, { chave, natureza, fonte, dotacoes: [], subtotal: null, disponivelComum: 0 });
    }
    grupos.get(chave)!.dotacoes.push(d);
  }
  const ordemOrigem = (d: DotacaoValores) => (ehEmenda(d.idu) ? `1${(d.idu ?? "").trim()}` : "0");
  return [...grupos.values()]
    .sort((a, b) => a.natureza.localeCompare(b.natureza) || a.fonte.localeCompare(b.fonte))
    .map((g) => {
      g.dotacoes.sort((a, b) => ordemOrigem(a).localeCompare(ordemOrigem(b)));
      if (g.dotacoes.length > 1) {
        g.subtotal = zerado();
        g.dotacoes.forEach((d) => somar(g.subtotal!, d));
      }
      g.disponivelComum = g.dotacoes.filter((d) => !ehEmenda(d.idu)).reduce((s, d) => s + (d.saldo_disponivel || 0), 0);
      return g;
    });
}
