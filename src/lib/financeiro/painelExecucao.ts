/**
 * Contas do painel do Financeiro (execução orçamentária do exercício).
 *
 * Funções puras sobre as dotações (QDD importado do FIPLAN) e os empenhos (FIP 614).
 * Spec: docs/superpowers/specs/2026-10-23-painel-financeiro-fiplan-design.md
 */

export interface DotacaoPainel {
  /** Código como vier do cadastro, com ou sem pontos (3.3.90.39 ou 33903900) */
  natureza: string | null;
  natureza_nome: string | null;
  /** Ex.: 1.500 */
  fonte: string | null;
  /** Ex.: 2544 - Gestão da Política para a Juventude e Desporto */
  paoe: string | null;
  valor_atual: number | null;
  valor_empenhado: number | null;
  valor_liquidado: number | null;
  valor_pago: number | null;
  valor_bloqueado: number | null;
  valor_reserva: number | null;
  valor_ped: number | null;
}

export interface EmpenhoPainel {
  credor: string | null;
  /** AAAA-MM-DD */
  data_empenho: string;
  saldo_liquidar: number | null;
  saldo_pagar: number | null;
  status: string | null;
}

export interface ResumoExecucao {
  autorizado: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  bloqueado: number;
  /** PED + reserva */
  reservado: number;
  saldoEmpenhar: number;
  /** Percentuais de 0 a 100 sobre o autorizado (0 quando não há autorizado) */
  pctEmpenhado: number;
  pctLiquidado: number;
  pctPago: number;
}

export interface GrupoExecucao {
  grupo: string;
  rotulo: string;
  autorizado: number;
  empenhado: number;
  pago: number;
  saldoEmpenhar: number;
}

export interface AlertaSaldo {
  natureza: string;
  natureza_nome: string | null;
  fonte: string | null;
  paoe: string | null;
  ritmoMensal: number;
  mesesRestantes: number;
  cobertura: number;
  necessidade: number;
  falta: number;
}

export interface CredorFila {
  credor: string;
  aLiquidar: number;
  aPagar: number;
  empenhos: number;
  diasMaisAntigo: number;
}

export interface DespesaElemento {
  /** 6 primeiros dígitos da natureza (ex.: 339039) */
  elemento: string;
  nome: string | null;
  liquidado: number;
  pct: number;
}

export const ROTULOS_GRUPO: Record<string, string> = {
  "1": "Pessoal",
  "2": "Juros",
  "3": "Custeio",
  "4": "Investimento",
  "5": "Inversões",
  "6": "Amortização",
  sem: "Sem natureza",
};

const n = (v: number | null | undefined) => v ?? 0;
const digitos = (natureza: string | null) => (natureza ?? "").replace(/\D/g, "");
const pct = (parte: number, todo: number) => (todo > 0 ? (parte / todo) * 100 : 0);

/** Conta do FIPLAN (FIP 608): autorizado − empenhado − bloqueado − reserva − PED */
const saldoEmpenhar = (d: DotacaoPainel) =>
  n(d.valor_atual) - n(d.valor_empenhado) - n(d.valor_bloqueado) - n(d.valor_reserva) - n(d.valor_ped);

const grupoDe = (d: DotacaoPainel) => {
  const dig = digitos(d.natureza);
  return dig.length >= 2 ? dig[1] : "sem";
};

export function resumirExecucao(dotacoes: DotacaoPainel[]): ResumoExecucao {
  const r = { autorizado: 0, empenhado: 0, liquidado: 0, pago: 0, bloqueado: 0, reservado: 0, saldoEmpenhar: 0 };
  for (const d of dotacoes) {
    r.autorizado += n(d.valor_atual);
    r.empenhado += n(d.valor_empenhado);
    r.liquidado += n(d.valor_liquidado);
    r.pago += n(d.valor_pago);
    r.bloqueado += n(d.valor_bloqueado);
    r.reservado += n(d.valor_ped) + n(d.valor_reserva);
    r.saldoEmpenhar += saldoEmpenhar(d);
  }
  return {
    ...r,
    pctEmpenhado: pct(r.empenhado, r.autorizado),
    pctLiquidado: pct(r.liquidado, r.autorizado),
    pctPago: pct(r.pago, r.autorizado),
  };
}

export function execucaoPorGrupo(dotacoes: DotacaoPainel[]): GrupoExecucao[] {
  const grupos = new Map<string, GrupoExecucao>();
  for (const d of dotacoes) {
    const grupo = grupoDe(d);
    const g = grupos.get(grupo) ?? {
      grupo,
      rotulo: ROTULOS_GRUPO[grupo] ?? `Grupo ${grupo}`,
      autorizado: 0,
      empenhado: 0,
      pago: 0,
      saldoEmpenhar: 0,
    };
    g.autorizado += n(d.valor_atual);
    g.empenhado += n(d.valor_empenhado);
    g.pago += n(d.valor_pago);
    g.saldoEmpenhar += saldoEmpenhar(d);
    grupos.set(grupo, g);
  }
  return [...grupos.values()].sort((a, b) =>
    a.grupo === "sem" ? 1 : b.grupo === "sem" ? -1 : a.grupo.localeCompare(b.grupo),
  );
}

/**
 * Dotações cujo saldo não cobre o resto do ano no ritmo do que já foi liquidado.
 * Pessoal (vencimentos e obrigações patronais) conta um mês a mais pelo 13º.
 */
export function alertasDeSaldo(
  dotacoes: DotacaoPainel[],
  mesReferencia: number,
  { encerrado = false }: { encerrado?: boolean } = {},
): AlertaSaldo[] {
  // Exercício encerrado não tem mais o que cobrir
  if (encerrado) return [];
  const m = Math.min(12, Math.max(1, Math.trunc(mesReferencia) || 1));
  const alertas: AlertaSaldo[] = [];
  for (const d of dotacoes) {
    const dig = digitos(d.natureza);
    if (dig.length < 6) continue;
    const ritmoMensal = n(d.valor_liquidado) / m;
    if (ritmoMensal <= 0) continue;
    const decimoTerceiro = dig[1] === "1" && ["11", "13"].includes(dig.slice(4, 6)) ? 1 : 0;
    const mesesRestantes = 12 - m + decimoTerceiro;
    const cobertura = saldoEmpenhar(d) + n(d.valor_empenhado) - n(d.valor_liquidado);
    const necessidade = ritmoMensal * mesesRestantes;
    if (cobertura >= necessidade) continue;
    alertas.push({
      natureza: d.natureza as string,
      natureza_nome: d.natureza_nome,
      fonte: d.fonte,
      paoe: d.paoe,
      ritmoMensal,
      mesesRestantes,
      cobertura,
      necessidade,
      falta: necessidade - cobertura,
    });
  }
  return alertas.sort((a, b) => b.falta - a.falta);
}

const DIA_MS = 24 * 60 * 60 * 1000;

/** Empenhos com algo a liquidar ou a pagar, somados por credor (anulados ficam de fora) */
export function filaDePagamento(empenhos: EmpenhoPainel[], hoje: Date): CredorFila[] {
  const credores = new Map<string, CredorFila>();
  for (const e of empenhos) {
    if (e.status === "anulado") continue;
    const aLiquidar = Math.max(0, n(e.saldo_liquidar));
    const aPagar = Math.max(0, n(e.saldo_pagar));
    if (aLiquidar === 0 && aPagar === 0) continue;
    const credor = e.credor?.trim() || "Credor não informado";
    const [ano, mes, dia] = e.data_empenho.split("-").map(Number);
    const dias = Math.max(0, Math.floor((hoje.getTime() - new Date(ano, mes - 1, dia).getTime()) / DIA_MS));
    const c = credores.get(credor) ?? { credor, aLiquidar: 0, aPagar: 0, empenhos: 0, diasMaisAntigo: 0 };
    c.aLiquidar += aLiquidar;
    c.aPagar += aPagar;
    c.empenhos += 1;
    c.diasMaisAntigo = Math.max(c.diasMaisAntigo, dias);
    credores.set(credor, c);
  }
  return [...credores.values()].sort((a, b) => b.aPagar - a.aPagar || b.aLiquidar - a.aLiquidar);
}

/** Elementos de despesa (6 primeiros dígitos) com maior valor liquidado */
export function maioresDespesas(dotacoes: DotacaoPainel[], limite = 5): DespesaElemento[] {
  const elementos = new Map<string, DespesaElemento>();
  let total = 0;
  for (const d of dotacoes) {
    const dig = digitos(d.natureza);
    const liquidado = n(d.valor_liquidado);
    if (dig.length < 6 || liquidado <= 0) continue;
    const elemento = dig.slice(0, 6);
    const e = elementos.get(elemento) ?? { elemento, nome: null, liquidado: 0, pct: 0 };
    e.liquidado += liquidado;
    e.nome = e.nome ?? d.natureza_nome;
    elementos.set(elemento, e);
    total += liquidado;
  }
  return [...elementos.values()]
    .sort((a, b) => b.liquidado - a.liquidado)
    .slice(0, limite)
    .map((e) => ({ ...e, pct: pct(e.liquidado, total) }));
}

/** 31901100 → 3.1.90.11; 33903901 → 3.3.90.39.01 (subelemento 00 some) */
export function formatarNatureza(natureza: string | null): string {
  const dig = digitos(natureza);
  if (dig.length < 6) return natureza?.trim() || "—";
  const partes = [dig[0], dig[1], dig.slice(2, 4), dig.slice(4, 6)];
  const sub = dig.slice(6, 8);
  if (sub && sub !== "00") partes.push(sub);
  return partes.join(".");
}
