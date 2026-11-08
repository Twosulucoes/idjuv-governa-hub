/**
 * Próxima ação do processo SEI (P2, migração 20261122090000): cada movimentação diz a próxima etapa, quem responde
 * (servidor ou setor) e até quando. Aqui ficam as regras puras: a etapa sugerida, o prazo sugerido pelos dias da
 * etapa (compras_etapa_parametros, com estes valores de reserva) e a situação do prazo para a lista e a ficha.
 * A regra que obriga os três campos é a mesma do banco (processo_proxima_acao_falta).
 */

import { ETAPAS_PROCESSO } from "@/types/processos";

/** Etapas que fecham o processo: não pedem próxima ação. */
export const ETAPAS_FINAIS = ["encerrado", "cancelado"] as const;

export const exigeProximaAcao = (etapa: string | null | undefined) =>
  !!etapa && !(ETAPAS_FINAIS as readonly string[]).includes(etapa);

export interface ParametroEtapa {
  etapa: string;
  dias_prazo: number;
  dias_limite_parado: number;
}

/** Mesmos números da semente da migração; valem enquanto a tabela não carrega ou se a linha faltar. */
export const PARAMETROS_PADRAO: Record<string, Omit<ParametroEtapa, "etapa">> = {
  abertura: { dias_prazo: 5, dias_limite_parado: 15 },
  dfd: { dias_prazo: 10, dias_limite_parado: 15 },
  etp: { dias_prazo: 15, dias_limite_parado: 15 },
  tr: { dias_prazo: 10, dias_limite_parado: 15 },
  cotacao: { dias_prazo: 15, dias_limite_parado: 15 },
  levantamento_tecnico: { dias_prazo: 10, dias_limite_parado: 15 },
  instrucao_adesao: { dias_prazo: 10, dias_limite_parado: 15 },
  analise_juridica: { dias_prazo: 10, dias_limite_parado: 15 },
  selecao: { dias_prazo: 30, dias_limite_parado: 15 },
  contrato: { dias_prazo: 10, dias_limite_parado: 15 },
  execucao: { dias_prazo: 30, dias_limite_parado: 15 },
  encerrado: { dias_prazo: 30, dias_limite_parado: 365 },
  cancelado: { dias_prazo: 30, dias_limite_parado: 365 },
};

/** Dias de prazo da etapa: o do banco quando há, senão o padrão (10 se a etapa for desconhecida). */
export function diasDePrazo(etapa: string | null | undefined, parametros?: ParametroEtapa[]): number {
  if (!etapa) return 10;
  return parametros?.find((p) => p.etapa === etapa)?.dias_prazo ?? PARAMETROS_PADRAO[etapa]?.dias_prazo ?? 10;
}

/** A etapa seguinte na ordem do processo; depois da execução vem o encerramento. Etapa final não tem seguinte. */
export function proximaEtapaSugerida(etapa: string | null | undefined): string | null {
  if (!exigeProximaAcao(etapa)) return null;
  const ordem = ETAPAS_PROCESSO.map((e) => e.value as string).filter((v) => v !== "cancelado");
  const i = ordem.indexOf(etapa as string);
  if (i < 0) return null;
  return ordem[Math.min(i + 1, ordem.length - 1)];
}

/** Soma dias corridos a uma data AAAA-MM-DD (sem fuso: a conta é feita em UTC). */
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const r = new Date(Date.UTC(a, m - 1, d + dias));
  return r.toISOString().slice(0, 10);
}

/** Dias de `de` até `ate` (positivo quando `ate` é depois). */
export function diasEntre(de: string, ate: string): number {
  const [a1, m1, d1] = de.split("-").map(Number);
  const [a2, m2, d2] = ate.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

export type SituacaoPrazo = "vencido" | "hoje" | "proximo" | "em_dia";

/** Até 3 dias antes é "próximo" (o aviso escalonado da P3 parte daqui). */
export const DIAS_PRAZO_PROXIMO = 3;

export function situacaoPrazo(prazo: string | null | undefined, hoje: string): SituacaoPrazo | null {
  if (!prazo) return null;
  const faltam = diasEntre(hoje, prazo);
  if (faltam < 0) return "vencido";
  if (faltam === 0) return "hoje";
  if (faltam <= DIAS_PRAZO_PROXIMO) return "proximo";
  return "em_dia";
}

/** Texto curto do prazo para a lista e a ficha ("venceu há 2 dias", "vence hoje", "faltam 5 dias"). */
export function textoPrazo(prazo: string, hoje: string): string {
  const faltam = diasEntre(hoje, prazo);
  if (faltam < 0) return faltam === -1 ? "venceu ontem" : `venceu há ${-faltam} dias`;
  if (faltam === 0) return "vence hoje";
  if (faltam === 1) return "vence amanhã";
  return `faltam ${faltam} dias`;
}

export interface ProximaAcao {
  etapa: string;
  data: string;
  proxima_etapa?: string | null;
  responsavel_servidor_id?: string | null;
  responsavel_setor?: string | null;
  prazo_proxima?: string | null;
}

/** O que falta na próxima ação (mesma regra e mesmas mensagens do banco), ou null quando está completa. */
export function faltaNaProximaAcao(a: ProximaAcao): string | null {
  if (!exigeProximaAcao(a.etapa)) return null;
  if (!a.proxima_etapa) return "Informe a próxima etapa.";
  if (!a.responsavel_servidor_id && !(a.responsavel_setor ?? "").trim()) {
    return "Informe o responsável pela próxima ação (servidor ou setor).";
  }
  if (!a.prazo_proxima) return "Informe o prazo da próxima ação.";
  if (a.prazo_proxima < a.data) return "O prazo da próxima ação não pode ser antes da data da movimentação.";
  return null;
}

/** Hoje (AAAA-MM-DD) no fuso de quem vê. */
export function hojeLocal(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
