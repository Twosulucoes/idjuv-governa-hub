/**
 * Prazos dos processos de contratação (P3, migração 20261128090000): tipos, avisos (dias antes), situação calculada
 * (vencido é aberto ou remarcado com a data passada) e a chave do pop-up de vencidos, que volta a cada entrada.
 * As mesmas regras valem no banco (gatilho processo_prazo_preparar e compras_normalizar_avisos).
 */

import { diasEntre } from "./proximaAcao";

export const TIPOS_PRAZO = [
  { value: "proxima_acao", label: "Próxima ação" },
  { value: "resposta_orgao_externo", label: "Resposta de órgão externo" },
  { value: "assinatura_contrato", label: "Assinatura do contrato" },
  { value: "vigencia_ata", label: "Vigência da ata" },
  { value: "vigencia_contrato", label: "Vigência do contrato" },
  { value: "empenho", label: "Empenho" },
  { value: "liquidacao", label: "Liquidação" },
  { value: "pagamento", label: "Pagamento" },
  { value: "prestacao_contas", label: "Prestação de contas" },
] as const;

/** Tipos que se lançam à mão (a próxima ação nasce da movimentação). */
export const TIPOS_PRAZO_MANUAIS = TIPOS_PRAZO.filter((t) => t.value !== "proxima_acao");

export const rotuloTipoPrazo = (tipo: string | null | undefined) =>
  TIPOS_PRAZO.find((t) => t.value === tipo)?.label ?? tipo ?? "—";

export type SituacaoGravada = "aberto" | "remarcado" | "cumprido" | "cancelado";
export type SituacaoExibida = SituacaoGravada | "vencido";

export const ROTULO_SITUACAO_PRAZO: Record<SituacaoExibida, string> = {
  aberto: "Aberto",
  remarcado: "Remarcado",
  vencido: "Vencido",
  cumprido: "Cumprido",
  cancelado: "Cancelado",
};

export const prazoEmAberto = (situacao: string) => situacao === "aberto" || situacao === "remarcado";

/** Vencido não se grava: é o prazo em aberto com a data já passada. */
export function situacaoExibida(situacao: string, dataLimite: string, hoje: string): SituacaoExibida {
  if (prazoEmAberto(situacao) && diasEntre(hoje, dataLimite) < 0) return "vencido";
  return situacao as SituacaoGravada;
}

/** Dias entre 1 e 365, sem repetir, do maior para o menor, sempre com o 1 (igual a compras_normalizar_avisos). */
export function normalizarAvisos(dias: readonly number[]): number[] {
  const validos = new Set(dias.filter((d) => Number.isInteger(d) && d >= 1 && d <= 365));
  validos.add(1);
  return [...validos].sort((a, b) => b - a);
}

/** "30, 15, 7" → [30, 15, 7, 1]. Texto com algo que não seja número de 1 a 365 devolve null. */
export function lerAvisos(texto: string): number[] | null {
  const partes = texto.split(/[\s,;]+/).filter(Boolean);
  const nums = partes.map((p) => (/^\d+$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => !Number.isInteger(n) || n < 1 || n > 365)) return null;
  return normalizarAvisos(nums);
}

export const textoAvisos = (dias: readonly number[] | null | undefined) =>
  normalizarAvisos(dias ?? []).join(", ");

export type CategoriaMeuPrazo = "vencido" | "proximo" | "aviso" | "parado";

export interface MeuPrazo {
  categoria: CategoriaMeuPrazo;
  processo_id: string;
  numero_processo: string;
  objeto: string | null;
  etapa: string | null;
  prazo_id: string | null;
  tipo: string | null;
  descricao: string | null;
  data_limite: string;
  dias: number;
  responsavel: string | null;
  andamento_id: string | null;
  pode_editar: boolean;
  pode_ver: boolean;
}

/** Texto do item do pop-up e do sino ("venceu há 2 dias", "vence amanhã", "parado há 20 dias"). */
export function textoMeuPrazo(p: Pick<MeuPrazo, "categoria" | "dias">): string {
  if (p.categoria === "parado") return `parado há ${p.dias} dias`;
  if (p.dias < 0) return p.dias === -1 ? "venceu ontem" : `venceu há ${-p.dias} dias`;
  if (p.dias === 0) return "vence hoje";
  if (p.dias === 1) return "vence amanhã";
  return `vence em ${p.dias} dias`;
}

/** O que entra no número do sino e no pop-up: vencido, vence em até 3 dias e parado (o "dia de aviso" só no sino). */
export const prazoUrgente = (p: Pick<MeuPrazo, "categoria">) => p.categoria !== "aviso";

/** Uma vez por entrada: a chave muda a cada login (último acesso do Supabase Auth). */
export const chavePopupPrazos = (usuarioId: string, ultimoAcesso: string | null | undefined) =>
  `compras-prazos-popup:${usuarioId}:${ultimoAcesso ?? "sem-acesso"}`;
