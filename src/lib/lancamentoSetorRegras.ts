/**
 * Regras puras do lançamento por setor (sem DOM nem Supabase), usadas pelas telas da fase 1:
 * designação como fundamento, quem está sem fundamento, agrupamento do relatório "quem seria bloqueado" e
 * normalização das respostas das RPCs. A decisão de verdade é do banco (fundamento_lancamento); aqui é só exibição.
 */

import type { Designacao } from "@/types/designacao";
import type { SetorModulo } from "@/types/lancamentoSetor";
import {
  VIAS_NEGADAS,
  type AtoFundamento,
  type FundamentoLancamento,
  type LinhaSaneamento,
  type ModoRegraLancamento,
  type ProblemaSaneamento,
  type ViaFundamento,
} from "@/types/lancamentoSetor";

/**
 * Módulos em que o banco já checa o fundamento (fase 1: só as tabelas do RH, no trigger zz_exigir_setor). Nos demais,
 * o modo gravado em regra_lancamento ainda não tem efeito; a tela não deixa trocá-lo nem mostra o aviso.
 */
export const MODULOS_COM_REGRA_NO_BANCO: readonly string[] = ["rh"];

export const moduloTemRegraNoBanco = (modulo: string) => MODULOS_COM_REGRA_NO_BANCO.includes(modulo);

/** Data (yyyy-MM-dd) no fuso local do navegador, nunca em UTC (toISOString viraria o dia à noite). */
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

/** Unidade da estrutura com o superior (para subir a hierarquia). */
export interface UnidadeHierarquia {
  id: string;
  superior_id: string | null;
}

/**
 * Módulos em que a unidade é setor ativo: ela própria cadastrada, ou uma superior cadastrada com as subordinadas.
 * Mesmo critério do banco (unidade_e_superiores + setores_modulo).
 */
export function modulosDaUnidade(
  unidadeId: string | null | undefined,
  setores: Pick<SetorModulo, "modulo" | "unidade_id" | "inclui_subordinadas" | "ativo">[],
  unidades: UnidadeHierarquia[],
): string[] {
  if (!unidadeId) return [];
  const superior = new Map(unidades.map((u) => [u.id, u.superior_id]));
  const modulos = new Set<string>();
  const vistos = new Set<string>();
  for (let atual: string | null | undefined = unidadeId, nivel = 0; atual && !vistos.has(atual); nivel += 1) {
    vistos.add(atual);
    for (const s of setores) {
      if (s.ativo && s.unidade_id === atual && (nivel === 0 || s.inclui_subordinadas)) modulos.add(s.modulo);
    }
    atual = superior.get(atual) ?? null;
  }
  return [...modulos];
}

export interface ContextoDesignacao {
  /** Módulos cujo setor ativo contém a unidade de destino; null enquanto setores e estrutura carregam. */
  modulosDoDestino: string[] | null;
  /** Servidor vinculado ao perfil que aprovou (vazio quando a RLS de profiles não deixa ler). */
  aprovadorServidorId?: string | null;
}

/**
 * Designação só vale como fundamento de lançamento quando está aprovada, vigente na data (início até hoje e fim
 * vazio ou a partir de hoje), tem o número e a data do ato, foi aprovada por alguém registrado em aprovado_por que
 * não é o próprio servidor nem quem a criou, e o destino é setor ativo de algum módulo. Mesmo critério do banco;
 * a tela só explica.
 */
export function avaliarDesignacaoComoFundamento(
  d: Pick<
    Designacao,
    "status" | "data_inicio" | "data_fim" | "ato_numero" | "ato_data" | "ativo" | "aprovado_por" | "created_by" | "servidor_id"
  >,
  ctx: ContextoDesignacao,
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
    if (!d.aprovado_por) faltas.push("aprovador registrado");
    else if (d.created_by && d.aprovado_por === d.created_by) faltas.push("aprovação por outra pessoa (quem criou aprovou)");
    else if (ctx.aprovadorServidorId && ctx.aprovadorServidorId === d.servidor_id) {
      faltas.push("aprovação por outra pessoa (o próprio servidor aprovou)");
    }
  }
  if (!d.ato_numero?.trim()) faltas.push("número do ato");
  if (!d.ato_data) faltas.push("data do ato");
  if (ctx.modulosDoDestino && ctx.modulosDoDestino.length === 0) faltas.push("destino ser setor de algum módulo");
  return { vale: faltas.length === 0 && ctx.modulosDoDestino !== null, faltas };
}

// ============================================================================
// Fundamentos do login
// ============================================================================

export const viaNegada = (via: string | null | undefined): boolean =>
  !!via && (VIAS_NEGADAS as string[]).includes(via);

const MODOS = new Set<string>(["desligado", "registrar", "exigir"]);
const textoOuNulo = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

/** Linhas de meus_fundamentos_lancamento() (uma por módulo) no tipo da tela. */
export function normalizarFundamentos(dados: unknown): FundamentoLancamento[] {
  if (!Array.isArray(dados)) return [];
  return (dados as Record<string, unknown>[])
    .filter((l) => l && typeof l.modulo === "string")
    .map((l) => {
      const modo = (MODOS.has(String(l.modo)) ? l.modo : "desligado") as ModoRegraLancamento;
      const permitido = l.permitido === true;
      return {
        modulo: l.modulo as string,
        modo,
        permitido,
        bloqueado: typeof l.bloqueado === "boolean" ? l.bloqueado : modo === "exigir" && !permitido,
        via: textoOuNulo(l.via),
        unidade_id: textoOuNulo(l.unidade_id),
        unidade_nome: textoOuNulo(l.unidade_nome),
        lotacao_id: textoOuNulo(l.lotacao_id),
        cessao_id: textoOuNulo(l.cessao_id),
        designacao_id: textoOuNulo(l.designacao_id),
        comissao_id: textoOuNulo(l.comissao_id),
        ato: l.ato && typeof l.ato === "object" ? (l.ato as AtoFundamento) : null,
      };
    });
}

/** Ato `{tipo, numero, data, doe_numero, doe_data}` para exibir: "Portaria nº 12/2026 de 01/02/2026 (DOE nº 345)". */
export function descreverAto(ato: unknown): string | null {
  if (!ato || typeof ato !== "object") return null;
  const a = ato as AtoFundamento;
  const partes = [
    a.tipo ?? (a.numero ? "Ato" : null),
    a.numero ? `nº ${a.numero}` : null,
    a.data ? `de ${formatarDataISO(a.data)}` : null,
    a.doe_numero ? `(DOE nº ${a.doe_numero}${a.doe_data ? ` de ${formatarDataISO(a.doe_data)}` : ""})` : null,
  ].filter(Boolean);
  return partes.length ? partes.join(" ") : null;
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
  /** fundamento->>em_cascata: gravação disparada por outra (trigger/FK), sem checagem própria. */
  em_cascata?: string | null;
}

/** Linhas que contam no relatório: as em cascata levam o fundamento de quem disparou e não são checadas. */
export const semCascata = <T extends Pick<LinhaBloqueio, "em_cascata">>(linhas: T[]): T[] =>
  linhas.filter((l) => l.em_cascata !== "true");

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

const PROBLEMAS = new Set<string>(["sem_login", "sem_lotacao", "lotacao_divergente", "fundamento_autoconcedido"]);

/** Linhas de saneamento_lancamento() no tipo da tela (problemas fora da lista conhecida são ignorados). */
export function normalizarSaneamento(dados: unknown): LinhaSaneamento[] {
  if (!Array.isArray(dados)) return [];
  return (dados as Record<string, unknown>[])
    .filter((l) => l && typeof l.servidor_id === "string")
    .map((l) => ({
      servidor_id: l.servidor_id as string,
      nome: textoOuNulo(l.nome) ?? "—",
      matricula: textoOuNulo(l.matricula),
      situacao: textoOuNulo(l.situacao),
      tem_login: l.tem_login === true,
      login_ativo: typeof l.login_ativo === "boolean" ? l.login_ativo : null,
      lotacao_unidade_id: textoOuNulo(l.lotacao_unidade_id),
      lotacao_unidade_nome: textoOuNulo(l.lotacao_unidade_nome),
      unidade_atual_id: textoOuNulo(l.unidade_atual_id),
      unidade_atual_nome: textoOuNulo(l.unidade_atual_nome),
      problemas: (Array.isArray(l.problemas) ? l.problemas : []).filter((p): p is ProblemaSaneamento =>
        PROBLEMAS.has(String(p)),
      ),
    }));
}

// ============================================================================
// Vigência
// ============================================================================

/** Participação vigente na data (início até hoje e fim vazio ou a partir de hoje). */
export function vigenteEm(inicio: string | null | undefined, fim: string | null | undefined, hoje = hojeISO()): boolean {
  const i = (inicio ?? "").slice(0, 10);
  const f = fim ? fim.slice(0, 10) : null;
  return (!i || i <= hoje) && (!f || f >= hoje);
}
