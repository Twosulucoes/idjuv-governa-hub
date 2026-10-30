/**
 * Regras da tela Diárias (FIP 002 do FIPLAN): prazo da prestação de contas e totais.
 * O servidor tem 10 dias depois do retorno para prestar contas (informado pelo Financeiro em 30/10/2026).
 * Spec: docs/superpowers/specs/2026-10-30-diarias-fiplan-design.md
 */

export const PRAZO_PRESTACAO_DIAS = 10;

export type SituacaoPrestacao = "prestou" | "no_prazo" | "atrasada" | "sem_retorno";

export interface DiariaParaRegra {
  valor_empenhado: number | string;
  prestou_contas: boolean;
  data_retorno: string | null;
  servidor_id?: string | null;
  credor_codigo?: string | null;
  credor_nome?: string;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/** Dias inteiros entre o retorno (AAAA-MM-DD) e hoje; negativo se a viagem ainda não acabou. */
export function diasDesdeRetorno(retorno: string | null, hoje: Date): number | null {
  if (!retorno) return null;
  const [a, m, d] = retorno.split("-").map(Number);
  const inicioHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((inicioHoje - Date.UTC(a, m - 1, d)) / DIA_MS);
}

/** Prestou, no prazo (até 10 dias do retorno), atrasada ou sem data de retorno. */
export function situacaoPrestacao(diaria: DiariaParaRegra, hoje: Date): SituacaoPrestacao {
  if (diaria.prestou_contas) return "prestou";
  const dias = diasDesdeRetorno(diaria.data_retorno, hoje);
  if (dias === null) return "sem_retorno";
  return dias > PRAZO_PRESTACAO_DIAS ? "atrasada" : "no_prazo";
}

/** Texto e tom do selo da prestação de contas (tela Diárias e ficha do servidor). */
export function seloPrestacao(
  diaria: DiariaParaRegra,
  hoje: Date,
): { texto: string; tom: "sucesso" | "erro" | "pendente" | "neutro" } {
  const situacao = situacaoPrestacao(diaria, hoje);
  const dias = diasDesdeRetorno(diaria.data_retorno, hoje);
  if (situacao === "prestou") return { texto: "Prestou contas", tom: "sucesso" };
  if (situacao === "atrasada") return { texto: `Atrasada: voltou há ${dias} dias`, tom: "erro" };
  if (situacao === "no_prazo") {
    return {
      texto: dias !== null && dias >= 0 ? `No prazo: voltou há ${dias} dia${dias === 1 ? "" : "s"}` : "Viagem em curso",
      tom: "pendente",
    };
  }
  return { texto: "Sem data de retorno", tom: "neutro" };
}

export interface ResumoDiarias {
  quantidade: number;
  valor: number;
  servidores: number;
  pendentes: number;
  valorPendente: number;
  atrasadas: number;
}

export function resumirDiarias(diarias: DiariaParaRegra[], hoje: Date): ResumoDiarias {
  const valor = (d: DiariaParaRegra) => Number(d.valor_empenhado) || 0;
  const pendentes = diarias.filter((d) => !d.prestou_contas);
  return {
    quantidade: diarias.length,
    valor: diarias.reduce((s, d) => s + valor(d), 0),
    servidores: new Set(diarias.map((d) => d.servidor_id ?? d.credor_codigo ?? d.credor_nome)).size,
    pendentes: pendentes.length,
    valorPendente: pendentes.reduce((s, d) => s + valor(d), 0),
    atrasadas: pendentes.filter((d) => situacaoPrestacao(d, hoje) === "atrasada").length,
  };
}
