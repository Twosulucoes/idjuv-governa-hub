/**
 * DIAS NÃO ÚTEIS DE UM PERÍODO
 *
 * Feriado fixo (Natal, Finados, Consciência Negra…) é cadastrado uma vez, com `recorrente` e mês/dia, e a `data`
 * guarda só o ano em que foi criado. Buscar por `data` entre o início e o fim do mês deixava esses feriados de fora
 * em qualquer outro ano: novembro de 2027 contaria Finados e a Proclamação da República como dias úteis (teste do
 * RH de 06/11/2026, item 17, "revisar o calendário de todos os anos"). Aqui a busca traz também os recorrentes e
 * cada um vira a data do ano pedido. Mesma regra do banco em `public.rh_dia_nao_util`.
 */

export interface LinhaDiaNaoUtil {
  data: string;
  recorrente?: boolean | null;
  mes_recorrente?: number | null;
  dia_recorrente?: number | null;
}

/** Filtro `.or()` do PostgREST: recorrentes (qualquer ano) ou com data dentro do período. */
export function filtroDiasNaoUteis(inicio: string, fim: string): string {
  return `recorrente.eq.true,and(data.gte.${inicio},data.lte.${fim})`;
}

/** Primeiro e último dia (AAAA-MM-DD) do mês. */
export function limitesDoMes(ano: number, mes: number): { inicio: string; fim: string } {
  const mm = String(mes).padStart(2, "0");
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return { inicio: `${ano}-${mm}-01`, fim: `${ano}-${mm}-${String(ultimo).padStart(2, "0")}` };
}

function bissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/**
 * Leva cada dia não útil para as datas do período: o recorrente aparece uma vez por ano em que cai no período, com
 * `data` trocada; o de data única fica só se estiver no período. Quando o mesmo dia aparece duas vezes, vale o
 * cadastro de data única (é o mais específico).
 */
export function projetarDiasNaoUteis<T extends LinhaDiaNaoUtil>(linhas: T[], inicio: string, fim: string): T[] {
  const porData = new Map<string, { linha: T; unica: boolean }>();
  const guardar = (linha: T, unica: boolean) => {
    const atual = porData.get(linha.data);
    if (!atual || (unica && !atual.unica)) porData.set(linha.data, { linha, unica });
  };

  const anoIni = Number(inicio.slice(0, 4));
  const anoFim = Number(fim.slice(0, 4));
  for (const linha of linhas) {
    if (!linha.recorrente) {
      if (linha.data >= inicio && linha.data <= fim) guardar(linha, true);
      continue;
    }
    const [, mesData, diaData] = linha.data.split("-").map(Number);
    const mes = linha.mes_recorrente ?? mesData;
    const dia = linha.dia_recorrente ?? diaData;
    if (!mes || !dia) continue;
    for (let ano = anoIni; ano <= anoFim; ano++) {
      const d = mes === 2 && dia === 29 && !bissexto(ano) ? 28 : dia;
      const data = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (data >= inicio && data <= fim) guardar({ ...linha, data }, false);
    }
  }
  return [...porData.values()].map((v) => v.linha).sort((a, b) => a.data.localeCompare(b.data));
}
