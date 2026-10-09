/**
 * Regras de negócio de férias de servidor — funções puras, sem React.
 *
 * Base legal (regime estatutário típico): 30 dias por período aquisitivo (PA),
 * fracionamento em até 3 parcelas (nenhuma inferior a 5 dias e, quando
 * parcelado, ao menos uma de 14 dias ou mais) e abono pecuniário de até 10 dias
 * (conversão de 1/3 das férias em pecúnia). Datas sempre no formato `YYYY-MM-DD`.
 */

import { addYears, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { FeriasServidor, Ocupacao } from "@/types/rh";

/** Dias de férias a que o servidor tem direito por período aquisitivo. */
export const DIAS_FERIAS_ANO = 30;
/** Número máximo de parcelas em que as férias podem ser fracionadas. */
export const MAX_PARCELAS = 3;
/** Quando fracionadas, ao menos uma parcela precisa ter este mínimo de dias. */
export const MIN_DIAS_PARCELA_MAIOR = 14;
/** Nenhuma parcela pode ter menos dias que isto. */
export const MIN_DIAS_PARCELA = 5;
/** Máximo de dias convertíveis em abono pecuniário (1/3 de 30). */
export const MAX_DIAS_ABONO = 10;

/** Subconjunto de campos de férias usados pelas regras (serve para o registro salvo e para o formulário). */
export type FeriasParaRegra = Pick<
  FeriasServidor,
  "dias_gozados" | "dias_abono" | "parcela" | "total_parcelas" | "status"
> & { id?: string; periodo_aquisitivo_inicio?: string; periodo_aquisitivo_fim?: string };

/**
 * Dias corridos entre duas datas, contando início e fim (inclusivo).
 * Retorna 0 se alguma data estiver vazia ou se o fim for anterior ao início.
 */
export function calcularDias(dataInicio?: string | null, dataFim?: string | null): number {
  if (!dataInicio || !dataFim) return 0;
  const dias = differenceInCalendarDays(parseISO(dataFim), parseISO(dataInicio)) + 1;
  return dias > 0 ? dias : 0;
}

/** Registro conta para o saldo/parcelas do PA (tudo que não foi cancelado). */
export function contaParaSaldo(registro: Pick<FeriasServidor, "status">): boolean {
  return registro.status !== "cancelada";
}

/** Filtra os registros do mesmo período aquisitivo (datas exatas de início e fim). */
export function registrosDoPeriodo<T extends Pick<FeriasServidor, "periodo_aquisitivo_inicio" | "periodo_aquisitivo_fim">>(
  registros: T[],
  pa: { inicio: string; fim: string },
): T[] {
  return registros.filter(
    (r) => r.periodo_aquisitivo_inicio === pa.inicio && r.periodo_aquisitivo_fim === pa.fim,
  );
}

/**
 * Saldo de dias do período aquisitivo: soma `dias_gozados + dias_abono` dos
 * registros do PA que não foram cancelados.
 */
export function calcularSaldoPeriodo(
  registros: FeriasServidor[],
  pa: { inicio: string; fim: string },
): { usados: number; abono: number; saldo: number } {
  const doPeriodo = registrosDoPeriodo(registros, pa).filter(contaParaSaldo);
  const usados = doPeriodo.reduce((acc, r) => acc + (r.dias_gozados || 0), 0);
  const abono = doPeriodo.reduce((acc, r) => acc + (r.dias_abono || 0), 0);
  return { usados, abono, saldo: DIAS_FERIAS_ANO - usados - abono };
}

/**
 * Valida parcela/total e o limite de 30 dias do PA.
 * `registrosDoPA` = demais lançamentos do mesmo período aquisitivo (o próprio
 * registro em edição é ignorado pelo `id`; cancelados também são ignorados).
 * Retorna a lista de mensagens de erro (vazia = válido).
 */
export function validarParcelas(registrosDoPA: FeriasParaRegra[], novo: FeriasParaRegra): string[] {
  const erros: string[] = [];
  const total = novo.total_parcelas ?? 1;
  const parcela = novo.parcela ?? 1;
  const dias = novo.dias_gozados || 0;
  const abono = novo.dias_abono || 0;

  if (!Number.isInteger(total) || total < 1 || total > MAX_PARCELAS) {
    erros.push(`O total de parcelas deve ser entre 1 e ${MAX_PARCELAS}.`);
  }
  if (!Number.isInteger(parcela) || parcela < 1 || parcela > total) {
    erros.push(`O número da parcela deve ser entre 1 e ${total || 1}.`);
  }
  if (dias < MIN_DIAS_PARCELA) {
    erros.push(`Cada parcela deve ter ao menos ${MIN_DIAS_PARCELA} dias.`);
  }

  const outros = registrosDoPA.filter((r) => contaParaSaldo(r) && (!novo.id || r.id !== novo.id));

  if (outros.some((r) => (r.parcela ?? 1) === parcela)) {
    erros.push(`A parcela ${parcela} já foi lançada neste período aquisitivo.`);
  }

  const totalDias = outros.reduce((acc, r) => acc + (r.dias_gozados || 0) + (r.dias_abono || 0), 0) + dias + abono;
  if (totalDias > DIAS_FERIAS_ANO) {
    erros.push(
      `Dias de gozo e abono somam ${totalDias} no período aquisitivo; o limite é ${DIAS_FERIAS_ANO}.`,
    );
  }

  // Quando fracionado, ao menos uma parcela ≥ 14 dias. Só dá para cobrar quando
  // todas as parcelas estiverem lançadas (esta inclusa); antes disso vale só o mínimo.
  if (total > 1) {
    const lancadas = outros.length + 1;
    const temParcelaMaior = dias >= MIN_DIAS_PARCELA_MAIOR || outros.some((r) => (r.dias_gozados || 0) >= MIN_DIAS_PARCELA_MAIOR);
    if (lancadas >= total && !temParcelaMaior) {
      erros.push(`Férias parceladas exigem ao menos uma parcela com ${MIN_DIAS_PARCELA_MAIOR} dias ou mais.`);
    }
  }

  return erros;
}

/** Abono pecuniário: no máximo 10 dias e só quando a opção estiver marcada. */
export function validarAbono(diasAbono: number | null | undefined, abonoPecuniario: boolean | null | undefined): string[] {
  const dias = diasAbono || 0;
  if (!abonoPecuniario) {
    return dias > 0 ? ["Informe dias de abono apenas com a opção de abono pecuniário marcada."] : [];
  }
  if (dias < 1) return ["Informe a quantidade de dias de abono."];
  if (dias > MAX_DIAS_ABONO) return [`O abono pecuniário é limitado a ${MAX_DIAS_ABONO} dias.`];
  return [];
}

/**
 * Ocupações que conflitam com o intervalo informado. Intervalos fechados:
 * há conflito quando `novo.inicio <= x.fim && novo.fim >= x.inicio`
 * (`fim` nulo = em aberto). Ignora o próprio registro e férias canceladas.
 */
export function detectarSobreposicao(
  novo: { id?: string; inicio: string; fim: string },
  ocupacoes: Ocupacao[],
): Ocupacao[] {
  if (!novo.inicio || !novo.fim) return [];
  return ocupacoes.filter((x) => {
    if (novo.id && x.tipo === "ferias" && x.id === novo.id) return false;
    if (x.tipo === "ferias" && x.status === "cancelada") return false;
    const comecaAntesDoFim = !x.fim || novo.inicio <= x.fim;
    return comecaAntesDoFim && novo.fim >= x.inicio;
  });
}

/**
 * Sugere o período aquisitivo a partir da data de admissão: do aniversário de
 * admissão mais recente (até a data de referência) até um ano depois menos um dia.
 * Retorna `null` sem data de admissão válida.
 */
export function sugerirPeriodoAquisitivo(
  dataAdmissao?: string | null,
  referencia: Date = new Date(),
): { inicio: string; fim: string } | null {
  if (!dataAdmissao) return null;
  const admissao = parseISO(dataAdmissao);
  if (Number.isNaN(admissao.getTime())) return null;

  let inicio = new Date(referencia.getFullYear(), admissao.getMonth(), admissao.getDate());
  if (inicio > referencia) inicio = addYears(inicio, -1);
  if (inicio < admissao) inicio = admissao;
  const fim = subDays(addYears(inicio, 1), 1);
  return { inicio: format(inicio, "yyyy-MM-dd"), fim: format(fim, "yyyy-MM-dd") };
}

/** Campos que podem ser alterados em cada status (demais status não permitem edição). */
export function camposEditaveisPorStatus(status?: string | null): "todos" | "parcial" | "nenhum" {
  if (!status || status === "programada") return "todos";
  if (status === "em_gozo") return "parcial";
  return "nenhum";
}

/**
 * Registro pode ser excluído fisicamente? Só `programada`/`cancelada`: nos demais
 * o trigger de situação do servidor já atuou e a exclusão deixaria o cadastro inconsistente.
 */
export function podeExcluir(status?: string | null): boolean {
  return status === "programada" || status === "cancelada";
}

/**
 * Transições de status permitidas a partir do status atual. `em_gozo` não pode
 * ir direto para `cancelada` (o trigger não restauraria a situação do servidor):
 * interrompe-se primeiro.
 */
export function statusPermitidos(atual?: string | null): FeriasServidor["status"][] {
  if (atual === "em_gozo") return ["em_gozo", "concluida", "interrompida"];
  return ["programada", "em_gozo", "concluida", "interrompida", "cancelada"];
}
