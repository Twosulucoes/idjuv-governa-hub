/**
 * Regras puras das alterações do contrato (C2): o valor e o fim que elas dão (a mesma conta do gatilho
 * contratos_preparar, para a tela mostrar antes de gravar), o quadro da aba Alterações, os avisos dos limites da Lei
 * 14.133 (o sistema avisa, não trava) e o texto de cada alteração.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (§4, C2).
 */

import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { diasAte } from "@/lib/contratos/vigencia";
import {
  rotuloMotivoApostilamento,
  rotuloMotivoRescisao,
  type Contrato,
  type ContratoAlteracao,
  type EspecieAlteracao,
} from "@/types/contratos";

type ContratoBase = Pick<Contrato, "valor_inicial" | "data_inicio" | "data_fim" | "prorrogavel" | "prazo_maximo_meses" | "reforma">;
type Alteracao = Pick<
  ContratoAlteracao,
  | "id"
  | "especie"
  | "numero"
  | "altera_prazo"
  | "altera_valor"
  | "altera_objeto"
  | "motivo"
  | "valor_acrescimo"
  | "valor_supressao"
  | "valor_variacao"
  | "percentual"
  | "indice"
  | "nova_data_fim"
  | "data_inicio"
  | "data_retomada"
  | "data_assinatura"
  | "descricao"
  | "created_at"
>;

const centavos = (v: number) => Math.round(v * 100) / 100;
const soma = (lista: Alteracao[], f: (a: Alteracao) => number) => centavos(lista.reduce((t, a) => t + f(a), 0));
const percentual = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** Valor inicial + acréscimos − supressões ± variações (apostilamentos e situação anterior). */
export function valorCalculado(valorInicial: number, alteracoes: Alteracao[]): number {
  return centavos(Number(valorInicial) + soma(alteracoes, (a) => Number(a.valor_acrescimo) - Number(a.valor_supressao) + Number(a.valor_variacao)));
}

/**
 * Fim atual: a data da rescisão; senão a nova data da última alteração (pela assinatura, e a situação anterior conta
 * como a mais antiga); senão o fim original. Mesma ordem do banco.
 */
export function fimCalculado(contrato: Pick<ContratoBase, "data_fim">, alteracoes: Alteracao[]): string {
  const rescisao = alteracoes.find((a) => a.especie === "rescisao");
  if (rescisao?.data_inicio) return rescisao.data_inicio;
  const comData = alteracoes.filter((a) => a.nova_data_fim);
  comData.sort((a, b) =>
    Number(a.especie === "partida") - Number(b.especie === "partida")
    || (b.data_assinatura ?? "").localeCompare(a.data_assinatura ?? "")
    || b.created_at.localeCompare(a.created_at)
    || (b.nova_data_fim ?? "").localeCompare(a.nova_data_fim ?? ""));
  return comData[0]?.nova_data_fim ?? contrato.data_fim;
}

function somarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}

const diaAnterior = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Último dia em que o contrato pode estar vigente: início + prazo máximo − 1 dia. Nulo sem prorrogação ou sem prazo. */
export function limiteProrrogacao(c: Pick<ContratoBase, "data_inicio" | "prorrogavel" | "prazo_maximo_meses">): string | null {
  if (!c.prorrogavel || !c.prazo_maximo_meses) return null;
  return diaAnterior(somarMeses(c.data_inicio, c.prazo_maximo_meses));
}

export interface ResumoAlteracoes {
  valorInicial: number;
  acrescimos: number;
  supressoes: number;
  /** Variações dos apostilamentos (reajuste e repactuação, com sinal). */
  reajustes: number;
  /** Diferença que já vinha antes do sistema (situação anterior). */
  anterior: number;
  valorAtual: number;
  /** Base do art. 125: valor inicial + reajustes. */
  valorInicialAtualizado: number;
  percentualAcrescimo: number;
  percentualSupressao: number;
  limitePercentual: 25 | 50;
  passouLimiteAcrescimo: boolean;
  passouLimiteSupressao: boolean;
  fimOriginal: string;
  fimAtual: string;
  limiteProrrogacao: string | null;
  passouPrazoMaximo: boolean;
  rescisao: Alteracao | null;
  suspensaoAberta: Alteracao | null;
}

export function resumoAlteracoes(c: ContratoBase, alteracoes: Alteracao[]): ResumoAlteracoes {
  const valorInicial = Number(c.valor_inicial);
  const acrescimos = soma(alteracoes, (a) => Number(a.valor_acrescimo));
  const supressoes = soma(alteracoes, (a) => Number(a.valor_supressao));
  const reajustes = soma(alteracoes.filter((a) => a.especie === "apostilamento"), (a) => Number(a.valor_variacao));
  const anterior = soma(alteracoes.filter((a) => a.especie === "partida"), (a) => Number(a.valor_variacao));
  const base = centavos(valorInicial + reajustes);
  const limite = c.reforma ? 50 : 25;
  const pct = (v: number) => (base > 0 ? centavos((v / base) * 100) : 0);
  const fimAtual = fimCalculado(c, alteracoes);
  const maximo = limiteProrrogacao(c);
  return {
    valorInicial,
    acrescimos,
    supressoes,
    reajustes,
    anterior,
    valorAtual: valorCalculado(valorInicial, alteracoes),
    valorInicialAtualizado: base,
    percentualAcrescimo: pct(acrescimos),
    percentualSupressao: pct(supressoes),
    limitePercentual: limite,
    passouLimiteAcrescimo: acrescimos > centavos((base * limite) / 100),
    passouLimiteSupressao: supressoes > centavos(base / 4),
    fimOriginal: c.data_fim,
    fimAtual,
    limiteProrrogacao: maximo,
    passouPrazoMaximo: !!maximo && fimAtual > maximo,
    rescisao: alteracoes.find((a) => a.especie === "rescisao") ?? null,
    suspensaoAberta: alteracoes.find((a) => a.especie === "suspensao" && !a.data_retomada) ?? null,
  };
}

/** Como ficam o valor e o fim com a alteração nova (sem id) ou corrigida (mesmo id), antes de gravar. */
export function simularAlteracao(c: ContratoBase, alteracoes: Alteracao[], alteracao: Alteracao): ResumoAlteracoes {
  const outras = alteracoes.filter((a) => !alteracao.id || a.id !== alteracao.id);
  return resumoAlteracoes(c, [...outras, alteracao]);
}

/** Avisos em vermelho da aba e do formulário: limites do art. 125, prazo máximo e cadastro incoerente. */
export function avisosLimites(c: ContratoBase, alteracoes: Alteracao[], resumo = resumoAlteracoes(c, alteracoes)): string[] {
  const avisos: string[] = [];
  const lei = "(art. 125 da Lei 14.133)";
  if (resumo.passouLimiteAcrescimo) {
    avisos.push(`Os acréscimos somam ${percentual(resumo.percentualAcrescimo)} do valor inicial atualizado; o limite é ${resumo.limitePercentual}% ${lei}.`);
  }
  if (resumo.passouLimiteSupressao) {
    avisos.push(`As supressões somam ${percentual(resumo.percentualSupressao)} do valor inicial atualizado; o limite é 25% ${lei}.`);
  }
  if (resumo.passouPrazoMaximo && resumo.limiteProrrogacao) {
    avisos.push(
      `A vigência vai até ${formatDateBR(resumo.fimAtual)}, depois do prazo máximo de ${c.prazo_maximo_meses} meses (até ${formatDateBR(resumo.limiteProrrogacao)}).`,
    );
  }
  if (!c.prorrogavel && alteracoes.some((a) => a.especie === "aditivo" && a.altera_prazo)) {
    avisos.push("O contrato está cadastrado como não prorrogável, mas tem aditivo de prazo: confira o cadastro.");
  }
  return avisos;
}

/** "2º termo aditivo", "1º apostilamento", "Suspensão"... */
export function tituloAlteracao(a: Pick<Alteracao, "especie" | "numero">): string {
  switch (a.especie) {
    case "aditivo":
      return `${a.numero}º termo aditivo`;
    case "apostilamento":
      return `${a.numero}º apostilamento`;
    case "suspensao":
      return "Suspensão";
    case "rescisao":
      return "Rescisão";
    default:
      return "Situação anterior ao sistema";
  }
}

const juntar = (partes: string[]) =>
  partes.length <= 1 ? (partes[0] ?? "") : `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;

/** Rótulo no meio da frase: só a primeira letra muda ("Reajuste" → "reajuste"; "Administração" fica). */
const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const variacao = (v: number) => (v > 0 ? `soma ${formatCurrency(v)}` : `reduz ${formatCurrency(Math.abs(v))}`);

/** O que a alteração faz, em pedaços: "prorroga até 31/12/2027", "acrescenta R$ 12.000,00"... */
export function efeitosAlteracao(a: Alteracao): string[] {
  const efeitos: string[] = [];
  const v = Number(a.valor_variacao);
  switch (a.especie) {
    case "aditivo":
      if (a.nova_data_fim) efeitos.push(`prorroga até ${formatDateBR(a.nova_data_fim)}`);
      if (Number(a.valor_acrescimo) > 0) efeitos.push(`acrescenta ${formatCurrency(Number(a.valor_acrescimo))}`);
      if (Number(a.valor_supressao) > 0) efeitos.push(`suprime ${formatCurrency(Number(a.valor_supressao))}`);
      if (a.altera_objeto) efeitos.push("altera o objeto");
      break;
    case "apostilamento":
      if (a.motivo === "prorrogacao_suspensao") {
        if (a.nova_data_fim) efeitos.push(`prorroga até ${formatDateBR(a.nova_data_fim)} pelo tempo suspenso`);
      } else if (a.motivo !== "outro") {
        const pct = a.percentual !== null && a.percentual !== undefined ? ` de ${percentual(Number(a.percentual))}` : "";
        const indice = a.indice ? ` (${a.indice})` : "";
        efeitos.push(`${minuscula(rotuloMotivoApostilamento(a.motivo))}${pct}${indice}`);
      }
      if (v !== 0) efeitos.push(variacao(v));
      break;
    case "suspensao":
      efeitos.push(
        a.data_retomada && a.data_inicio
          ? `de ${formatDateBR(a.data_inicio)} a ${formatDateBR(a.data_retomada)} (${diasAte(a.data_retomada, a.data_inicio)} dias)`
          : `desde ${formatDateBR(a.data_inicio)}, em aberto`,
      );
      break;
    case "rescisao":
      efeitos.push(`${minuscula(rotuloMotivoRescisao(a.motivo))}, em ${formatDateBR(a.data_inicio)}`);
      break;
    default:
      if (v !== 0) efeitos.push(variacao(v));
      if (a.nova_data_fim) efeitos.push(`fim em ${formatDateBR(a.nova_data_fim)}`);
  }
  return efeitos;
}

/** Uma linha: "2º termo aditivo: prorroga até 31/12/2027, acrescenta R$ 12.000,00 e altera o objeto". */
export function textoAlteracao(a: Alteracao): string {
  const efeitos = efeitosAlteracao(a);
  const resto = efeitos.length ? juntar(efeitos) : a.descricao.length > 80 ? `${a.descricao.slice(0, 77)}…` : a.descricao;
  return `${tituloAlteracao(a)}: ${resto}`;
}

/** Data do ato: assinatura (aditivo, apostilamento) ou início (suspensão, rescisão). A situação anterior não tem. */
export const dataAlteracao = (a: Pick<Alteracao, "especie" | "data_assinatura" | "data_inicio">) =>
  a.especie === "suspensao" || a.especie === "rescisao" ? a.data_inicio : a.data_assinatura;

/** Linha do tempo: situação anterior primeiro, depois pela data do ato e por quando foi registrada. */
export function ordenarAlteracoes<T extends Alteracao>(lista: T[]): T[] {
  return [...lista].sort((a, b) =>
    Number(b.especie === "partida") - Number(a.especie === "partida")
    || (dataAlteracao(a) ?? "").localeCompare(dataAlteracao(b) ?? "")
    || a.created_at.localeCompare(b.created_at));
}

/** Próximo nº da espécie (1º, 2º...): o maior registrado + 1. */
export function proximoNumero(lista: Pick<Alteracao, "especie" | "numero">[], especie: EspecieAlteracao): number {
  return lista.filter((a) => a.especie === especie).reduce((m, a) => Math.max(m, a.numero ?? 0), 0) + 1;
}
