/**
 * Regras puras da prestação de contas das passagens (entrega 2): retorno do passageiro, o que falta entregar, prazo e
 * atraso. Plano: docs/superpowers/plans/2026-10-25-contratos-passagens-entrega2.md
 *
 * Datas em "AAAA-MM-DD" (sem fuso). O prazo conta em dias corridos a partir do último voo emitido e não cancelado.
 */

import type { PassagemPassageiro, PassagemPedido, PassagemTrecho } from "@/types/passagens";

/** Dias corridos depois do retorno, quando o módulo não define outro (module_settings.settings). */
export const PRAZO_PADRAO_DIAS = 5;
export const CHAVE_PRAZO = "passagens_prazo_prestacao_dias";

export type TipoPendencia = "embarque" | "relatorio" | "relatorio_evento";

export const ROTULO_PENDENCIA: Record<TipoPendencia, string> = {
  embarque: "Cartão de embarque",
  relatorio: "Relatório de viagem",
  relatorio_evento: "Relatório do evento",
};

type TrechoData = Pick<PassagemTrecho, "data_voo" | "situacao" | "localizador">;
type PassageiroPrestacao = Pick<
  PassagemPassageiro,
  "id" | "nome" | "servidor_id" | "embarque_entregue_em" | "relatorio_entregue_em" | "prestacao_dispensada"
> & { trechos: TrechoData[] };
type PedidoPrestacao = Pick<PassagemPedido, "prestacao_contas" | "relatorio_evento_entregue_em"> & {
  passageiros: PassageiroPrestacao[];
};

export interface Pendencia {
  tipo: TipoPendencia;
  vencimento: string;
  diasAtraso: number;
}
export interface PendenciaDoPedido extends Pendencia {
  passageiroId: string | null;
  nome: string | null;
}

const SEM_VOO = new Set(["cancelado", "reembolsado"]);
const DIA = 86_400_000;
const utc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

export function somarDias(data: string, dias: number): string {
  return new Date(utc(data) + dias * DIA).toISOString().slice(0, 10);
}

const diasEntre = (de: string, ate: string) => Math.round((utc(ate) - utc(de)) / DIA);

/** Prazo gravado no módulo (`settings` de module_settings); inválido ou ausente = padrão. */
export function lerPrazo(settings: unknown): number {
  const v = settings && typeof settings === "object" && !Array.isArray(settings)
    ? Number((settings as Record<string, unknown>)[CHAVE_PRAZO])
    : NaN;
  return Number.isInteger(v) && v > 0 && v <= 365 ? v : PRAZO_PADRAO_DIAS;
}

/** Data do último voo com bilhete emitido e não cancelado (null = o passageiro não viaja). */
export function retornoDoPassageiro(trechos: TrechoData[]): string | null {
  const datas = trechos.filter((t) => t.localizador && !SEM_VOO.has(t.situacao)).map((t) => t.data_voo.slice(0, 10));
  return datas.length ? datas.sort().at(-1)! : null;
}

interface Contexto {
  prazoDias: number;
  hoje: string;
  /** Para a conclusão: conta o que falta mesmo antes do retorno. */
  ignorarData?: boolean;
}

function pendencia(tipo: TipoPendencia, retorno: string, ctx: Contexto): Pendencia {
  const vencimento = somarDias(retorno, ctx.prazoDias);
  return { tipo, vencimento, diasAtraso: Math.max(0, diasEntre(vencimento, ctx.hoje)) };
}

/**
 * O que o passageiro ainda deve. Individual: cartão e relatório (o relatório apresentado no RH conta). Evento e
 * dispensado: só o cartão. Passageiro dispensado ou sem bilhete: nada. Antes do retorno não há pendência.
 */
export function pendenciasDoPassageiro(
  modo: string,
  p: PassageiroPrestacao,
  ctx: Contexto & { relatorioRh: boolean },
): Pendencia[] {
  if (p.prestacao_dispensada) return [];
  const retorno = retornoDoPassageiro(p.trechos);
  if (!retorno || (!ctx.ignorarData && ctx.hoje < retorno)) return [];
  const lista: Pendencia[] = [];
  if (!p.embarque_entregue_em) lista.push(pendencia("embarque", retorno, ctx));
  if (modo === "individual" && !p.relatorio_entregue_em && !ctx.relatorioRh) lista.push(pendencia("relatorio", retorno, ctx));
  return lista;
}

const ORDEM: Record<TipoPendencia, number> = { relatorio_evento: 0, embarque: 1, relatorio: 2 };

/** Pendências do pedido, da mais atrasada para a menos; no modo evento, o relatório único vence pelo último retorno. */
export function pendenciasDoPedido(
  pedido: PedidoPrestacao,
  ctx: Contexto & { relatorioRh: Record<string, boolean> },
): PendenciaDoPedido[] {
  const lista: PendenciaDoPedido[] = pedido.passageiros.flatMap((p) =>
    pendenciasDoPassageiro(pedido.prestacao_contas, p, { ...ctx, relatorioRh: !!ctx.relatorioRh[p.id] }).map((x) => ({
      ...x,
      passageiroId: p.id,
      nome: p.nome,
    })),
  );
  if (pedido.prestacao_contas === "evento" && !pedido.relatorio_evento_entregue_em) {
    const retornos = pedido.passageiros
      .filter((p) => !p.prestacao_dispensada)
      .map((p) => retornoDoPassageiro(p.trechos))
      .filter((d): d is string => !!d)
      .sort();
    const ultimo = retornos.at(-1);
    if (ultimo && (ctx.ignorarData || ctx.hoje >= ultimo)) {
      lista.push({ ...pendencia("relatorio_evento", ultimo, ctx), passageiroId: null, nome: null });
    }
  }
  return lista.sort(
    (a, b) => b.diasAtraso - a.diasAtraso || (a.nome ?? "").localeCompare(b.nome ?? "") || ORDEM[a.tipo] - ORDEM[b.tipo],
  );
}

/** O pedido só vai para "concluído" com tudo entregue ou dispensado, mesmo antes do vencimento. */
export function podeConcluir(pedido: PedidoPrestacao, ctx: Contexto & { relatorioRh: Record<string, boolean> }): boolean {
  return pendenciasDoPedido(pedido, { ...ctx, ignorarData: true }).length === 0;
}
