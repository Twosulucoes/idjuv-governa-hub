/**
 * VIGÊNCIA DA LOTAÇÃO POR DATA
 *
 * A transferência (`rh_transferir_servidor`) encerra a lotação antiga na véspera do efeito (ativo = false,
 * data_fim = efeito − 1) e já grava a nova como ativa, com início no dia do efeito. Ler só o `ativo` mostrava a
 * lotação nova como atual antes de valer (teste do RH de 06/11/2026, item 19: transferência para 09/11 aparecia
 * como lotação atual em 07/11). A vigência é pelas datas: vale a que começou até o dia e não terminou; a que começa
 * depois é agendada. Sem data de fim, vale o `ativo` (lotação aberta que foi cancelada não volta).
 */

export interface LotacaoComVigencia {
  data_inicio: string | null;
  data_fim?: string | null;
  ativo?: boolean | null;
  tipo_lotacao?: string | null;
}

export function lotacaoVigenteEm(l: LotacaoComVigencia, dia: string): boolean {
  if (!l.data_inicio || l.data_inicio.slice(0, 10) > dia) return false;
  if (l.tipo_lotacao === "lotacao_externa") return false;
  return l.data_fim ? l.data_fim.slice(0, 10) >= dia : l.ativo === true;
}

export function lotacaoAgendadaEm(l: LotacaoComVigencia, dia: string): boolean {
  return l.ativo === true && !!l.data_inicio && l.data_inicio.slice(0, 10) > dia && l.tipo_lotacao !== "lotacao_externa";
}

/** A vigente no dia (a de início mais recente) e a próxima agendada, se houver. */
export function separarLotacoes<T extends LotacaoComVigencia>(
  lotacoes: T[],
  dia: string,
): { vigente: T | null; agendada: T | null } {
  const porInicio = (a: T, b: T) => (a.data_inicio ?? "").localeCompare(b.data_inicio ?? "");
  const vigentes = lotacoes.filter((l) => lotacaoVigenteEm(l, dia)).sort(porInicio);
  const agendadas = lotacoes.filter((l) => lotacaoAgendadaEm(l, dia)).sort(porInicio);
  return { vigente: vigentes[vigentes.length - 1] ?? null, agendada: agendadas[0] ?? null };
}

/** Filtro `.or()` do PostgREST para trazer as lotações que podem valer no dia ou depois dele. */
export function filtroLotacoesDoDia(dia: string): string {
  return `ativo.eq.true,data_fim.gte.${dia}`;
}
