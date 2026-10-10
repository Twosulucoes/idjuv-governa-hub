/**
 * Regras puras do fluxo de frequência (abono → chefia → RH → fechamento).
 *
 * Sem React nem Supabase: só decide o que cada etapa pode fazer a partir dos
 * dados já carregados. Usado pelas telas de validação, pela "Minha Frequência"
 * e pelo guard-rail do lançamento de ocorrências.
 */

import type {
  FrequenciaFechamento,
  SolicitacaoAbono,
  StatusFechamento,
  StatusSolicitacaoAbono,
} from "@/types/frequencia";
import { formatDateBR } from "@/lib/formatters";

/** "dd/mm/aaaa a dd/mm/aaaa · hh:mm–hh:mm" (horas só quando informadas). */
export function formatarPeriodoAbono(
  s: Pick<SolicitacaoAbono, "data_inicio" | "data_fim" | "hora_inicio" | "hora_fim">,
): string {
  const datas =
    s.data_fim && s.data_fim !== s.data_inicio
      ? `${formatDateBR(s.data_inicio)} a ${formatDateBR(s.data_fim)}`
      : formatDateBR(s.data_inicio);
  const horas = s.hora_inicio && s.hora_fim ? ` · ${s.hora_inicio.slice(0, 5)}–${s.hora_fim.slice(0, 5)}` : "";
  return `${datas}${horas}`;
}

/** Status em que a solicitação ainda aguarda alguma decisão. */
export const STATUS_ABONO_EM_ABERTO: StatusSolicitacaoAbono[] = ["pendente", "aprovado_chefia"];

export function abonoEmAberto(s: Pick<SolicitacaoAbono, "status">): boolean {
  return STATUS_ABONO_EM_ABERTO.includes(s.status);
}

/** Chefia só decide o que ainda está pendente — e só quando o tipo de abono exige a chefia. */
export function podeAprovarChefia(s: Pick<SolicitacaoAbono, "status" | "tipo_abono">): boolean {
  return s.status === "pendente" && s.tipo_abono?.exige_aprovacao_chefia !== false;
}

/**
 * RH aprova depois da chefia. Quando o tipo de abono não exige chefia
 * (`exige_aprovacao_chefia = false`), o RH decide direto sobre o pendente.
 */
export function podeAprovarRH(s: Pick<SolicitacaoAbono, "status" | "tipo_abono">): boolean {
  if (s.status === "aprovado_chefia") return true;
  return s.status === "pendente" && s.tipo_abono?.exige_aprovacao_chefia === false;
}

/** Aprovação da chefia encerra o fluxo quando o tipo dispensa o RH. */
export function chefiaEncerraFluxo(s: Pick<SolicitacaoAbono, "tipo_abono">): boolean {
  return s.tipo_abono?.exige_aprovacao_rh === false;
}

export function podeRejeitar(s: Pick<SolicitacaoAbono, "status">): boolean {
  return abonoEmAberto(s);
}

function limitesCompetencia(ano: number, mes: number): { inicio: string; fim: string } {
  const mm = String(mes).padStart(2, "0");
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return { inicio: `${ano}-${mm}-01`, fim: `${ano}-${mm}-${String(ultimoDia).padStart(2, "0")}` };
}

/** Solicitação toca a competência se o intervalo [data_inicio, data_fim] cruza o mês. */
export function abonoNaCompetencia(
  s: Pick<SolicitacaoAbono, "data_inicio" | "data_fim">,
  ano: number,
  mes: number,
): boolean {
  const { inicio, fim } = limitesCompetencia(ano, mes);
  const dataFim = s.data_fim || s.data_inicio;
  return s.data_inicio <= fim && dataFim >= inicio;
}

export function abonosPendentesNaCompetencia(
  solicitacoes: Pick<SolicitacaoAbono, "status" | "data_inicio" | "data_fim">[],
  ano: number,
  mes: number,
): number {
  return solicitacoes.filter((s) => abonoEmAberto(s) && abonoNaCompetencia(s, ano, mes)).length;
}

type FechamentoFlags = Pick<FrequenciaFechamento, "validado_chefia" | "consolidado_rh" | "reaberto">;

/** Fechamento do servidor está travado: consolidado pelo RH e não reaberto. */
export function fechamentoTravado(f: FechamentoFlags | null | undefined): boolean {
  return !!f && !!f.consolidado_rh && !f.reaberto;
}

/**
 * Lançar ocorrência fica bloqueado quando a competência está `consolidado`
 * ou o fechamento do servidor está travado.
 */
export function lancamentoBloqueado(
  statusCompetencia: StatusFechamento | null | undefined,
  fechamento: FechamentoFlags | null | undefined,
): { bloqueado: boolean; motivo?: string } {
  if (statusCompetencia === "consolidado") {
    return { bloqueado: true, motivo: "A competência está consolidada pelo RH." };
  }
  if (fechamentoTravado(fechamento)) {
    return { bloqueado: true, motivo: "A frequência deste servidor já foi consolidada pelo RH." };
  }
  return { bloqueado: false };
}

/** Chefia valida enquanto não validou (a reabertura zera a validação, então o ciclo recomeça). */
export function podeValidarChefia(f: FechamentoFlags | null | undefined): boolean {
  return !f || !f.validado_chefia;
}

/** RH consolida depois da chefia; se já consolidou, só após reabrir. */
export function podeConsolidarRH(f: FechamentoFlags | null | undefined): boolean {
  if (!f || !f.validado_chefia) return false;
  return !f.consolidado_rh || !!f.reaberto;
}

export interface RegrasReabertura {
  /** `config_fechamento_frequencia.permite_reabertura` (null/undefined = permite). */
  permiteReabertura?: boolean | null;
  /** `config_fechamento_frequencia.prazo_reabertura_dias` contados da consolidação (0/null = sem prazo). */
  prazoDias?: number | null;
}

const MS_POR_DIA = 86_400_000;

/** Reabre só o consolidado e não reaberto, se a config permite e dentro do prazo (quando houver). */
export function podeReabrir(
  f: (FechamentoFlags & Pick<FrequenciaFechamento, "consolidado_rh_em">) | null | undefined,
  regras: RegrasReabertura = {},
  hoje: Date = new Date(),
): boolean {
  if (regras.permiteReabertura === false || !fechamentoTravado(f)) return false;
  if (regras.prazoDias && f.consolidado_rh_em) {
    const dias = (hoje.getTime() - new Date(f.consolidado_rh_em).getTime()) / MS_POR_DIA;
    if (dias > regras.prazoDias) return false;
  }
  return true;
}

export interface SituacaoFechamentoCompetencia {
  totalServidores: number;
  consolidados: number;
  abonosPendentes: number;
  statusAtual: StatusFechamento | null | undefined;
}

/** Competência só fecha sem abono em aberto e com todos os servidores consolidados. */
export function podeFecharCompetencia(sit: SituacaoFechamentoCompetencia): { ok: boolean; motivos: string[] } {
  const motivos: string[] = [];
  if (sit.statusAtual === "consolidado") motivos.push("A competência já está consolidada.");
  if (sit.abonosPendentes > 0) {
    motivos.push(`${sit.abonosPendentes} solicitação(ões) de abono ainda aguardam decisão.`);
  }
  if (sit.totalServidores === 0) motivos.push("Não há servidores ativos na competência.");
  const faltam = sit.totalServidores - sit.consolidados;
  if (sit.totalServidores > 0 && faltam > 0) {
    motivos.push(`${faltam} servidor(es) ainda não consolidado(s) pelo RH.`);
  }
  return { ok: motivos.length === 0, motivos };
}
