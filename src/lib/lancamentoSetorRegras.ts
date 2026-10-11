/**
 * Regras puras do lançamento por setor (sem DOM nem Supabase), usadas pelas telas da fase 1:
 * designação como fundamento, quem está sem fundamento, agrupamento do relatório "quem seria bloqueado" e
 * normalização das respostas das RPCs. A decisão de verdade é do banco (fundamento_lancamento); aqui é só exibição.
 */

import type { Designacao } from "@/types/designacao";
import {
  VIAS_NEGADAS,
  type FundamentoLancamento,
  type LinhaSaneamento,
  type ModoRegraLancamento,
  type ViaFundamento,
} from "@/types/lancamentoSetor";

/**
 * Módulos em que o banco já checa o fundamento (fase 1: só as tabelas do RH, no trigger zz_fixar_autoria). Nos demais,
 * o modo gravado em regra_lancamento ainda não tem efeito; a tela não deixa trocá-lo nem mostra o aviso.
 */
export const MODULOS_COM_REGRA_NO_BANCO: readonly string[] = ["rh"];

export const moduloTemRegraNoBanco = (modulo: string) => MODULOS_COM_REGRA_NO_BANCO.includes(modulo);

/** Data de hoje (yyyy-MM-dd) no fuso do navegador. */
export function hojeISO(d = new Date()): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// ============================================================================
// Designação como fundamento
// ============================================================================

export interface AvaliacaoDesignacao {
  vale: boolean;
  /** O que falta para valer (vazio quando vale). */
  faltas: string[];
}

/**
 * Designação só vale como fundamento de lançamento quando está aprovada, vigente na data (início até hoje e fim
 * vazio ou a partir de hoje) e tem o número e a data do ato. Mesmo critério da função do banco.
 */
export function avaliarDesignacaoComoFundamento(
  d: Pick<Designacao, "status" | "data_inicio" | "data_fim" | "ato_numero" | "ato_data" | "ativo">,
  hoje = hojeISO(),
): AvaliacaoDesignacao {
  const faltas: string[] = [];
  if (d.ativo === false) faltas.push("designação desativada");
  if (d.status !== "aprovada") {
    faltas.push(
      d.status === "pendente"
        ? "aprovação (está pendente)"
        : d.status === "rejeitada"
          ? "aprovação (foi rejeitada)"
          : "estar vigente (foi encerrada)",
    );
  }
  const inicio = (d.data_inicio ?? "").slice(0, 10);
  const fim = d.data_fim ? d.data_fim.slice(0, 10) : null;
  if (d.status === "aprovada") {
    if (inicio && inicio > hoje) faltas.push("começar (início no futuro)");
    if (fim && fim < hoje) faltas.push("estar vigente (período terminou)");
  }
  if (!d.ato_numero?.trim()) faltas.push("número do ato");
  if (!d.ato_data) faltas.push("data do ato");
  return { vale: faltas.length === 0, faltas };
}

// ============================================================================
// Fundamentos do login
// ============================================================================

export const viaNegada = (via: string | null | undefined): boolean =>
  !!via && (VIAS_NEGADAS as string[]).includes(via);

/**
 * Sem fundamento no módulo: a via diz "negado_*" ou, sem via, o banco disse que não é permitido. No modo registrar o
 * banco pode responder `permitido = true` (não bloqueia), então a via é o que conta.
 */
export function semFundamento(f: Pick<FundamentoLancamento, "via" | "permitido"> | null | undefined): boolean {
  if (!f) return false;
  if (f.via) return viaNegada(f.via);
  return f.permitido === false;
}

const MODOS = new Set<string>(["desligado", "registrar", "exigir"]);

/** Aceita a resposta da RPC como lista de linhas, um objeto por módulo ou uma linha só. */
export function normalizarFundamentos(dados: unknown): FundamentoLancamento[] {
  let linhas: unknown[] = [];
  if (Array.isArray(dados)) linhas = dados;
  else if (dados && typeof dados === "object") {
    const obj = dados as Record<string, unknown>;
    linhas = "modulo" in obj ? [obj] : Object.entries(obj).map(([modulo, v]) => ({ modulo, ...(v as object) }));
  }
  return linhas
    .filter((l): l is Record<string, unknown> => !!l && typeof l === "object" && typeof (l as { modulo?: unknown }).modulo === "string")
    .map((l) => ({
      modulo: l.modulo as string,
      modo: (MODOS.has(String(l.modo)) ? l.modo : "desligado") as ModoRegraLancamento,
      permitido: typeof l.permitido === "boolean" ? l.permitido : null,
      via: typeof l.via === "string" ? l.via : null,
      unidade_id: typeof l.unidade_id === "string" ? l.unidade_id : null,
      ato: l.ato ?? null,
    }));
}

/** Ato de designação/comissão para exibir (texto ou objeto com tipo, número e data). */
export function descreverAto(ato: unknown): string | null {
  if (!ato) return null;
  if (typeof ato === "string") return ato;
  if (typeof ato === "object") {
    const a = ato as Record<string, unknown>;
    const partes = [a.ato_tipo ?? a.tipo, a.ato_numero ?? a.numero ? `nº ${a.ato_numero ?? a.numero}` : null]
      .filter(Boolean)
      .join(" ");
    const data = (a.ato_data ?? a.data) as string | undefined;
    const texto = [partes, data ? `de ${formatarDataISO(data)}` : null].filter(Boolean).join(" ");
    return texto || null;
  }
  return String(ato);
}

/** yyyy-MM-dd → dd/MM/yyyy, sem passar por Date (sem deslocamento de fuso). */
export function formatarDataISO(data: string | null | undefined): string {
  if (!data) return "—";
  const [a, m, d] = data.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : data;
}

// ============================================================================
// Relatório "quem seria bloqueado"
// ============================================================================

/** Linha mínima da trilha usada no agrupamento (subconjunto de LinhaTrilha). */
export interface LinhaBloqueio {
  timestamp: string;
  user_id: string | null;
  servidor_id: string | null;
  servidor_nome: string | null;
  servidor_matricula: string | null;
  usuario_nome?: string | null;
  entity_type: string | null;
  module_name: string | null;
  via?: string | null;
}

export interface GrupoBloqueio {
  chave: string;
  user_id: string | null;
  servidor_id: string | null;
  servidor_nome: string | null;
  servidor_matricula: string | null;
  usuario_nome: string | null;
  modulo: string | null;
  tabela: string | null;
  via: ViaFundamento | string | null;
  quantidade: number;
  ultima: string;
}

/** Agrupa por responsável (servidor, ou usuário sem servidor), tabela e motivo, do mais recente para o mais antigo. */
export function agruparBloqueios(linhas: LinhaBloqueio[]): GrupoBloqueio[] {
  const grupos = new Map<string, GrupoBloqueio>();
  for (const l of linhas) {
    const quem = l.servidor_id ? `s:${l.servidor_id}` : `u:${l.user_id ?? "?"}`;
    const chave = `${quem}|${l.module_name ?? ""}|${l.entity_type ?? ""}|${l.via ?? ""}`;
    const g = grupos.get(chave);
    if (g) {
      g.quantidade += 1;
      if (l.timestamp > g.ultima) g.ultima = l.timestamp;
    } else {
      grupos.set(chave, {
        chave,
        user_id: l.user_id,
        servidor_id: l.servidor_id,
        servidor_nome: l.servidor_nome,
        servidor_matricula: l.servidor_matricula,
        usuario_nome: l.usuario_nome ?? null,
        modulo: l.module_name,
        tabela: l.entity_type,
        via: l.via ?? null,
        quantidade: 1,
        ultima: l.timestamp,
      });
    }
  }
  return [...grupos.values()].sort((a, b) => b.ultima.localeCompare(a.ultima));
}

export interface ResumoBloqueioModulo {
  gravacoes: number;
  /** Responsáveis distintos (servidor ou, sem servidor, usuário). */
  responsaveis: number;
}

/** Totais por módulo: gravações sem fundamento e quantos responsáveis distintos. */
export function resumirBloqueiosPorModulo(linhas: LinhaBloqueio[]): Map<string, ResumoBloqueioModulo> {
  const quem = new Map<string, Set<string>>();
  const total = new Map<string, number>();
  for (const l of linhas) {
    const modulo = l.module_name ?? "";
    total.set(modulo, (total.get(modulo) ?? 0) + 1);
    const conjunto = quem.get(modulo) ?? new Set<string>();
    conjunto.add(l.servidor_id ? `s:${l.servidor_id}` : `u:${l.user_id ?? "?"}`);
    quem.set(modulo, conjunto);
  }
  const resumo = new Map<string, ResumoBloqueioModulo>();
  total.forEach((gravacoes, modulo) => resumo.set(modulo, { gravacoes, responsaveis: quem.get(modulo)?.size ?? 0 }));
  return resumo;
}

// ============================================================================
// Saneamento
// ============================================================================

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

// Colunas booleanas que a RPC pode devolver para cada problema.
const PROBLEMAS_BOOLEANOS: Record<string, string> = {
  sem_login: "sem_login",
  sem_login_vinculado: "sem_login",
  sem_usuario: "sem_login",
  sem_lotacao: "sem_lotacao",
  sem_lotacao_vigente: "sem_lotacao",
  lotacao_divergente: "lotacao_divergente",
};

/** Linhas de `saneamento_lancamento()` no formato da tela (o problema pode vir em texto, lista ou colunas booleanas). */
export function normalizarSaneamento(dados: unknown): LinhaSaneamento[] {
  if (!Array.isArray(dados)) return [];
  return dados
    .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
    .map((l) => {
      const problemas = new Set<string>();
      const bruto = l.problemas ?? l.problema ?? l.motivo ?? l.pendencia ?? l.tipo;
      if (Array.isArray(bruto)) bruto.forEach((p) => typeof p === "string" && problemas.add(p));
      else if (typeof bruto === "string") problemas.add(bruto);
      Object.entries(PROBLEMAS_BOOLEANOS).forEach(([coluna, problema]) => {
        if (l[coluna] === true) problemas.add(problema);
      });
      return {
        servidor_id: String(l.servidor_id ?? l.id ?? ""),
        nome: texto(l.nome_completo) ?? texto(l.servidor_nome) ?? texto(l.nome) ?? "—",
        matricula: texto(l.matricula) ?? texto(l.servidor_matricula),
        problemas: [...problemas],
        detalhe: texto(l.detalhe) ?? texto(l.observacao),
      };
    });
}

// ============================================================================
// Comissão como fundamento
// ============================================================================

/** Comissão vale como fundamento quando está ativa, vigente na data e com número e data do ato. */
export function avaliarComissaoComoFundamento(
  c: { status: string; data_inicio: string; data_fim: string | null; ato_numero: string | null; ato_data: string | null },
  hoje = hojeISO(),
): AvaliacaoDesignacao {
  const faltas: string[] = [];
  if (c.status !== "ativa") faltas.push("estar ativa (foi encerrada)");
  const inicio = (c.data_inicio ?? "").slice(0, 10);
  const fim = c.data_fim ? c.data_fim.slice(0, 10) : null;
  if (inicio && inicio > hoje) faltas.push("começar (início no futuro)");
  if (fim && fim < hoje) faltas.push("estar vigente (período terminou)");
  if (!c.ato_numero?.trim()) faltas.push("número do ato");
  if (!c.ato_data) faltas.push("data do ato");
  return { vale: faltas.length === 0, faltas };
}

/** Participação vigente na data (início até hoje e fim vazio ou a partir de hoje). */
export function vigenteEm(inicio: string | null | undefined, fim: string | null | undefined, hoje = hojeISO()): boolean {
  const i = (inicio ?? "").slice(0, 10);
  const f = fim ? fim.slice(0, 10) : null;
  return (!i || i <= hoje) && (!f || f >= hoje);
}
