// Botão "Atualizar agora" dos convênios federais: config do GitHub e quando pedir uma rodada nova da rotina.
// Sem import do Deno: os testes rodam no vitest (regras.test.ts).

/** Intervalo mínimo entre dois pedidos: a rotina leva cerca de 1 minuto e o Transferegov só muda uma vez por dia. */
export const INTERVALO_MINIMO_MS = 5 * 60_000;

export interface ConfigGithub {
  token: string;
  /** dono/repositório, ex.: org/projeto */
  repo: string;
  workflow: string;
  ref: string;
}

/** Lê a configuração; null quando falta o token ou o repositório (o botão ainda não foi configurado). */
export function lerConfigGithub(env: (nome: string) => string | undefined): ConfigGithub | null {
  const token = env("GITHUB_DISPATCH_TOKEN")?.trim() ?? "";
  const repo = env("GITHUB_REPO")?.trim() ?? "";
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return {
    token,
    repo,
    workflow: env("GITHUB_TRANSFEREGOV_WORKFLOW")?.trim() || "transferegov.yml",
    ref: env("GITHUB_TRANSFEREGOV_REF")?.trim() || "main",
  };
}

export interface UltimaRodada {
  status: string;
  created_at: string;
}

export type Decisao = { pode: true } | { pode: false; status: 409 | 429; motivo: string };

/** Decide se dá para pedir uma rodada nova, olhando a última rodada da rotina no GitHub. */
export function podeDisparar(ultima: UltimaRodada | null, agora: Date): Decisao {
  if (!ultima) return { pode: true };
  if (ultima.status !== "completed") {
    return { pode: false, status: 409, motivo: "A atualização já está rodando. Espere cerca de 1 minuto." };
  }
  const passou = agora.getTime() - Date.parse(ultima.created_at);
  if (Number.isFinite(passou) && passou < INTERVALO_MINIMO_MS) {
    const minutos = Math.max(1, Math.ceil((INTERVALO_MINIMO_MS - passou) / 60_000));
    return {
      pode: false,
      status: 429,
      motivo: `A última atualização foi há pouco. Tente de novo em ${minutos} minuto${minutos === 1 ? "" : "s"}.`,
    };
  }
  return { pode: true };
}
