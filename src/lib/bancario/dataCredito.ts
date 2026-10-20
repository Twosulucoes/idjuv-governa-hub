/**
 * Data de crédito da remessa da folha: dia útil, nunca antes de amanhã. O padrão é o dia de pagamento da
 * configuração de fechamento, no mês da competência, recuado para o dia útil anterior quando cai em fim de semana
 * ou feriado. Datas em `yyyy-MM-dd` (hora local), como o <input type="date">.
 */

const dois = (n: number) => n.toString().padStart(2, "0");

export const isoLocal = (d: Date) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

export function deIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isoLocal(d) === iso ? d : null;
}

const somarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Sábado, domingo ou data da lista de feriados (`yyyy-MM-dd`). */
export function ehDiaUtil(d: Date, feriados: ReadonlySet<string> = new Set()): boolean {
  const dia = d.getDay();
  return dia !== 0 && dia !== 6 && !feriados.has(isoLocal(d));
}

function proximoDiaUtil(d: Date, feriados: ReadonlySet<string>): Date {
  let x = d;
  while (!ehDiaUtil(x, feriados)) x = somarDias(x, 1);
  return x;
}

function diaUtilAnterior(d: Date, feriados: ReadonlySet<string>): Date {
  let x = d;
  while (!ehDiaUtil(x, feriados)) x = somarDias(x, -1);
  return x;
}

/** Data sugerida (`yyyy-MM-dd`). Sem dia de pagamento configurado, usa o último dia do mês da competência. */
export function dataCreditoPadrao(p: {
  ano: number;
  mes: number;
  diaPagamento?: number | null;
  hoje: Date;
  feriados?: ReadonlySet<string>;
}): string {
  const feriados = p.feriados ?? new Set<string>();
  const ultimo = new Date(p.ano, p.mes, 0).getDate();
  const dia = p.diaPagamento && p.diaPagamento > 0 ? Math.min(p.diaPagamento, ultimo) : ultimo;
  const amanha = somarDias(new Date(p.hoje.getFullYear(), p.hoje.getMonth(), p.hoje.getDate()), 1);
  const alvo = diaUtilAnterior(new Date(p.ano, p.mes - 1, dia), feriados);
  return isoLocal(alvo < amanha ? proximoDiaUtil(amanha, feriados) : alvo);
}

/** O que impede a data escolhida (null = pode usar). */
export function problemaDataCredito(iso: string, hoje: Date, feriados: ReadonlySet<string> = new Set()): string | null {
  const d = deIso(iso);
  if (!d) return "Informe a data de crédito.";
  const amanha = somarDias(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), 1);
  if (d < amanha) return "A data de crédito precisa ser a partir de amanhã.";
  if (!ehDiaUtil(d, feriados)) return "A data de crédito cai em fim de semana ou feriado: escolha um dia útil.";
  return null;
}

/** Feriados ativos como `yyyy-MM-dd`; o recorrente vale no mesmo dia e mês de cada ano pedido. */
export function conjuntoFeriados(
  linhas: readonly { data: string; recorrente?: boolean | null; ativo?: boolean | null }[],
  anos: readonly number[],
): Set<string> {
  const datas = new Set<string>();
  for (const f of linhas) {
    if (f.ativo === false || !deIso(f.data)) continue;
    if (f.recorrente) anos.forEach((ano) => datas.add(`${ano}${f.data.slice(4)}`));
    else datas.add(f.data);
  }
  return datas;
}
