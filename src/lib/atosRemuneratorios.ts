/**
 * Atos remuneratórios (migração 20261020100000): a lei, o decreto ou a instrução normativa que muda valores da folha,
 * com o que muda (vencimento ou subsídio do cargo, valor da rubrica, parâmetro da folha). Regras puras da tela; quem
 * aplica, grava o valor anterior e cuida da vigência é a RPC `aplicar_ato_remuneratorio`.
 */

export const TIPOS_ATO = {
  lei: "Lei",
  lei_complementar: "Lei Complementar",
  decreto: "Decreto",
  portaria: "Portaria",
  resolucao: "Resolução",
  instrucao_normativa: "Instrução Normativa",
  outro: "Outro",
} as const;

export type TipoAto = keyof typeof TIPOS_ATO;

export type AlvoItemAto = "cargo" | "rubrica" | "parametro";

export const ROTULO_ALVO: Record<AlvoItemAto, string> = {
  cargo: "Vencimento/subsídio do cargo",
  rubrica: "Valor da rubrica",
  parametro: "Parâmetro da folha",
};

/** "Lei nº 2.301/2026" */
export function identificacaoAto(a: { tipo_ato: string; numero: string }): string {
  const tipo = TIPOS_ATO[a.tipo_ato as TipoAto] ?? a.tipo_ato;
  return `${tipo} nº ${a.numero}`;
}

/** Valor reajustado pelo percentual, em centavos arredondados (6,5 = 6,5%). */
export function valorReajustado(valor: number, percentual: number): number {
  // valor × (100 + p) já é o valor novo em centavos
  return Math.round(valor * (100 + percentual)) / 100;
}

export interface CargoParaReajuste {
  id: string;
  vencimento_base: number | null;
}

/**
 * Itens de um reajuste geral: um por cargo com vencimento, com o valor novo pelo percentual. Cargo já presente no ato
 * fica de fora (o banco recusa o mesmo alvo duas vezes no ato); cargo sem vencimento também.
 */
export function itensPorPercentual(
  cargos: CargoParaReajuste[],
  percentual: number,
  jaNoAto: ReadonlySet<string> = new Set(),
): { cargo_id: string; valor_novo: number }[] {
  return cargos
    .filter((c) => (c.vencimento_base ?? 0) > 0 && !jaNoAto.has(c.id))
    .map((c) => ({ cargo_id: c.id, valor_novo: valorReajustado(c.vencimento_base ?? 0, percentual) }));
}

/**
 * Aviso da vigência antes de aplicar: retroativa a uma folha já fechada (as diferenças não são calculadas) ou no
 * meio do mês (a competência sai com o valor novo inteiro e marcada para conferência). Datas `yyyy-MM-dd`.
 */
export function avisosVigencia(vigencia: string, ultimaFolhaFechada?: { ano: number; mes: number } | null): string[] {
  const avisos: string[] = [];
  const [ano, mes, dia] = vigencia.split("-").map(Number);
  if (!ano || !mes || !dia) return avisos;
  if (ultimaFolhaFechada && ano * 12 + mes <= ultimaFolhaFechada.ano * 12 + ultimaFolhaFechada.mes) {
    avisos.push(
      `A vigência começa numa competência já fechada (${String(ultimaFolhaFechada.mes).padStart(2, "0")}/` +
        `${ultimaFolhaFechada.ano} ou antes): as diferenças desses meses não são calculadas; lance-as na próxima folha.`,
    );
  }
  if (dia > 1) {
    avisos.push(
      "A vigência começa depois do dia 1: a folha desse mês sai com o valor novo inteiro e marcada para conferência.",
    );
  }
  return avisos;
}
