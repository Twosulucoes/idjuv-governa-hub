/**
 * Evolução do processo de contratação: as etapas do banco (processos_licitatorios.etapa) agrupadas em seis fases, o
 * percentual da fase atual e a linha do tempo com a data em que cada fase começou e quantos dias ficou nela.
 * Só leitura do que já está gravado no andamento (processo_andamentos); nenhuma tramitação acontece aqui, ela é do SEI.
 */

import type { EtapaProcesso } from "@/types/processos";

export interface FaseCompra {
  codigo: string;
  rotulo: string;
  etapas: readonly EtapaProcesso[];
}

/** Fases na ordem do processo. "cancelado" fica fora: não é fase, é o fim antecipado. */
export const FASES_COMPRA: readonly FaseCompra[] = [
  { codigo: "planejamento", rotulo: "Planejamento", etapas: ["abertura", "dfd", "etp", "tr", "cotacao", "levantamento_tecnico"] },
  { codigo: "analise_juridica", rotulo: "Análise jurídica", etapas: ["instrucao_adesao", "analise_juridica"] },
  { codigo: "selecao", rotulo: "Seleção", etapas: ["selecao"] },
  { codigo: "contrato", rotulo: "Contrato", etapas: ["contrato"] },
  { codigo: "execucao", rotulo: "Execução", etapas: ["execucao"] },
  { codigo: "encerrado", rotulo: "Encerrado", etapas: ["encerrado"] },
];

/** Dias sem movimentação a partir dos quais o processo aparece como parado. */
export const DIAS_PARA_PARADO = 15;

type ProcessoBase = { etapa: string | null; atualizado_em: string | null };
type AndamentoBase = { etapa: string; data: string; data_informada: boolean };

export function indiceDaFase(etapa: string | null | undefined): number {
  return FASES_COMPRA.findIndex((f) => (f.etapas as readonly string[]).includes(etapa ?? ""));
}

export function faseDaEtapa(etapa: string | null | undefined): FaseCompra | null {
  return FASES_COMPRA[indiceDaFase(etapa)] ?? null;
}

/** Dias entre duas datas ISO (AAAA-MM-DD), sem fuso. */
function diasEntre(de: string, ate: string): number {
  const utc = (d: string) => {
    const [a, m, dia] = d.slice(0, 10).split("-").map(Number);
    return Date.UTC(a, m - 1, dia);
  };
  return Math.max(0, Math.round((utc(ate) - utc(de)) / 86_400_000));
}

/** Hoje em AAAA-MM-DD pelo relógio local. */
export function hojeISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

/** Última fase alcançada no andamento (para o processo cancelado). */
function ultimaFaseDoAndamento(andamentos: AndamentoBase[]): number {
  const datados = [...andamentos].sort((a, b) => a.data.localeCompare(b.data));
  for (let i = datados.length - 1; i >= 0; i--) {
    const indice = indiceDaFase(datados[i].etapa);
    if (indice >= 0) return indice;
  }
  return -1;
}

export interface Evolucao {
  /** Índice da fase atual em FASES_COMPRA; -1 quando não há fase (cancelado sem andamento, etapa desconhecida). */
  indiceAtual: number;
  fase: FaseCompra | null;
  percentual: number;
  cancelado: boolean;
  parado: boolean;
  diasSemMovimentacao: number | null;
}

/**
 * Evolução para a lista. Percentual = posição da fase ÷ 6 (Seleção, a 3ª, é 50%). Processo cancelado mostra a última
 * fase alcançada no andamento (passe os andamentos quando os tiver); encerrado e cancelado nunca ficam parados.
 */
export function evolucaoDoProcesso(processo: ProcessoBase, hoje: string = hojeISO(), andamentos: AndamentoBase[] = []): Evolucao {
  const cancelado = processo.etapa === "cancelado";
  const indiceAtual = cancelado ? ultimaFaseDoAndamento(andamentos) : indiceDaFase(processo.etapa);
  const diasSemMovimentacao = processo.atualizado_em ? diasEntre(processo.atualizado_em, hoje) : null;
  const terminado = cancelado || processo.etapa === "encerrado";
  return {
    indiceAtual,
    fase: FASES_COMPRA[indiceAtual] ?? null,
    percentual: indiceAtual < 0 ? 0 : Math.round(((indiceAtual + 1) / FASES_COMPRA.length) * 100),
    cancelado,
    parado: !terminado && diasSemMovimentacao !== null && diasSemMovimentacao > DIAS_PARA_PARADO,
    diasSemMovimentacao,
  };
}

export type SituacaoFase = "concluida" | "atual" | "pendente" | "cancelada";

export interface FaseNaLinhaDoTempo {
  fase: FaseCompra;
  situacao: SituacaoFase;
  /** Primeira data informada em que o processo entrou na fase; null se não há andamento datado nela. */
  inicio: string | null;
  /** Dias na fase: até a fase seguinte começar (ou até hoje, na fase atual); null sem início. */
  dias: number | null;
}

/**
 * Linha do tempo das seis fases. Início = primeira entrada datada na fase (numa devolução, conta da primeira vez);
 * fim = início da próxima fase com data, a data do cancelamento, ou hoje na fase atual.
 */
export function linhaDoTempoFases(processo: ProcessoBase, andamentos: AndamentoBase[], hoje: string = hojeISO()): FaseNaLinhaDoTempo[] {
  const evolucao = evolucaoDoProcesso(processo, hoje, andamentos);
  const datados = andamentos.filter((a) => a.data_informada);
  const inicios = FASES_COMPRA.map((_, i) => {
    const datas = datados.filter((a) => indiceDaFase(a.etapa) === i).map((a) => a.data.slice(0, 10)).sort();
    return datas[0] ?? null;
  });
  const dataCancelamento = evolucao.cancelado
    ? (datados.filter((a) => a.etapa === "cancelado").map((a) => a.data.slice(0, 10)).sort()[0] ?? null)
    : null;

  return FASES_COMPRA.map((fase, i) => {
    let situacao: SituacaoFase = "pendente";
    if (i < evolucao.indiceAtual) situacao = "concluida";
    else if (i === evolucao.indiceAtual) situacao = evolucao.cancelado ? "cancelada" : processo.etapa === "encerrado" ? "concluida" : "atual";

    const inicio = situacao === "pendente" ? null : inicios[i];
    let fim: string | null = null;
    if (inicio) {
      const proximo = inicios.slice(i + 1).find((d) => d !== null && d >= inicio) ?? null;
      if (situacao === "atual") fim = hoje;
      else if (situacao === "cancelada") fim = dataCancelamento ?? proximo ?? hoje;
      else fim = proximo;
    }
    return { fase, situacao, inicio, dias: inicio && fim ? diasEntre(inicio, fim) : null };
  });
}
