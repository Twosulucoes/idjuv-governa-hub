/**
 * PARSER: relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN → linhas da RPC `importar_peds_fiplan`
 *
 * Função pura (sem arquivo nem banco), testada em pedsFiplanParser.test.ts. O relatório traz o título, os critérios
 * ("*Exercício igual a 2026", "cdUnidadeOrcamentaria igual a 17302"), o cabeçalho (que começa em "Exercício" e tem
 * "Nº PED") e uma linha por PED ou documento de estorno. Valores e datas vêm como texto ("4.251.000,00", "26/02/2026").
 * O "Nº Processo" do FIPLAN (000885/26-92) é o nº SEI abreviado: vira 17302.000885/2026.92 com a UO da linha.
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§10)
 */

import { normalizarCabecalho, paraDataIso, paraTexto } from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";
import { processoSei } from "./empenhosFip614Parser";

/** Linha no formato do contrato front ↔ RPC (mais a linha da planilha, para as mensagens). */
export interface LinhaPedFiplan {
  indice: number;
  numero: string;
  numero_estorno: string | null;
  empenho_numero: string | null;
  processo_fiplan: string | null;
  processo_sei: string | null;
  valor: number;
  situacao: string;
  estorno: boolean;
  data_solicitacao: string | null;
  data_criacao: string | null;
  data_autorizacao: string | null;
  tipo_empenho: string | null;
  dotacao: string | null;
  licitacao: string | null;
  historico: string | null;
  credor_codigo: string | null;
  credor_nome: string | null;
  linhaPlanilha: number;
}

export const SITUACAO_AUTORIZADO = "Pedido (PED) autorizado";
const SITUACAO_ESTORNO = "Documento de Estorno";
const RE_NUMERO = /^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$/;

/** Cabeçalho normalizado → campo */
const COLUNAS = {
  exercicio: "exercicio",
  n_ped: "numero",
  n_ped_estorno_estornado: "numero_estorno",
  n_emp: "empenho_numero",
  n_processo: "processo_fiplan",
  valor_ped: "valor",
  situacao: "situacao",
  uo: "uo",
  data_solicitacao: "data_solicitacao",
  data_criacao: "data_criacao",
  data_autorizacao: "data_autorizacao",
  tipo_empenho: "tipo_empenho",
  dotacao_orcamentaria: "dotacao",
  licitacao: "licitacao",
  historico: "historico",
  credor: "credor_codigo",
  nome_do_credor: "credor_nome",
} as const;
type Campo = (typeof COLUNAS)[keyof typeof COLUNAS];

/** "4.251.000,00" → 4251000; número já numérico passa direto; texto inválido → NaN. */
export function paraValorBR(valor: unknown): number {
  if (typeof valor === "number") return valor;
  const texto = paraTexto(valor).replace(/\s/g, "");
  if (!/^-?[\d.]+(,\d+)?$/.test(texto)) return Number.NaN;
  return Number(texto.replace(/\./g, "").replace(",", "."));
}

const ouNulo = (texto: string) => (texto === "" ? null : texto);

export function interpretarPedsFiplan(linhas: unknown[][]): ResultadoLeitura<LinhaPedFiplan> {
  const problemas: ProblemaLeitura[] = [];
  const saida: LinhaPedFiplan[] = [];
  const vazio = (mensagem: string): ResultadoLeitura<LinhaPedFiplan> => ({
    linhas: [],
    problemas: [{ gravidade: "erro", mensagem }],
    cabecalho: {},
    parametros: {},
  });

  if (!linhas.some((l) => l.some((c) => /pedido de empenho/i.test(paraTexto(c))))) {
    return vazio('Este arquivo não é o relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN.');
  }

  let exercicio: number | null = null;
  for (const l of linhas) {
    const m = l.map(paraTexto).join(" ").match(/exerc[ií]cio igual a (\d{4})/i);
    if (m) {
      exercicio = Number(m[1]);
      break;
    }
  }

  let mapa: (Campo | undefined)[] | null = null;
  let campos = 0;
  linhas.forEach((celulas, i) => {
    const textos = celulas.map(paraTexto);
    const normalizados = textos.map(normalizarCabecalho);
    // Cabeçalho (também quando se repete no meio do relatório)
    if (normalizados.includes("n_ped") && normalizados.includes("situacao")) {
      mapa = normalizados.map((c) => (Object.prototype.hasOwnProperty.call(COLUNAS, c) ? COLUNAS[c as keyof typeof COLUNAS] : undefined));
      return;
    }
    if (!mapa) return;
    const v: Partial<Record<Campo, string>> = {};
    mapa.forEach((campo, j) => {
      if (campo && v[campo] === undefined) v[campo] = textos[j] ?? "";
    });
    if (!v.numero) return;
    const linhaPlanilha = i + 1;
    const numero = v.numero;
    if (!RE_NUMERO.test(numero)) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha}: nº do PED "${numero}" fora do padrão.` });
      return;
    }
    const valor = paraValorBR(v.valor);
    if (!Number.isFinite(valor) || valor < 0) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha} (PED ${numero}): valor "${v.valor ?? ""}" inválido.` });
      return;
    }
    const situacao = v.situacao ?? "";
    if (!situacao) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha} (PED ${numero}): sem situação.` });
      return;
    }
    const linhaExercicio = Number(v.exercicio);
    if (exercicio === null && Number.isInteger(linhaExercicio) && linhaExercicio > 2000) exercicio = linhaExercicio;
    const data = (campo: Campo) => {
      const d = paraDataIso(v[campo]);
      if (d === undefined) {
        problemas.push({ gravidade: "aviso", mensagem: `Linha ${linhaPlanilha} (PED ${numero}): data "${v[campo]}" ignorada.` });
        return null;
      }
      return d;
    };
    const processo = ouNulo(v.processo_fiplan ?? "");
    saida.push({
      indice: saida.length,
      numero,
      numero_estorno: ouNulo(v.numero_estorno ?? ""),
      empenho_numero: ouNulo(v.empenho_numero ?? ""),
      processo_fiplan: processo,
      processo_sei: processo ? processoSei(processo, v.uo ?? "") : null,
      valor,
      situacao,
      estorno: situacao === SITUACAO_ESTORNO,
      data_solicitacao: data("data_solicitacao"),
      data_criacao: data("data_criacao"),
      data_autorizacao: data("data_autorizacao"),
      tipo_empenho: ouNulo(v.tipo_empenho ?? ""),
      dotacao: ouNulo(v.dotacao ?? ""),
      licitacao: ouNulo(v.licitacao ?? ""),
      historico: ouNulo(v.historico ?? ""),
      credor_codigo: ouNulo(v.credor_codigo ?? ""),
      credor_nome: ouNulo(v.credor_nome ?? ""),
      linhaPlanilha,
    });
    campos++;
  });

  if (!mapa) return vazio('Não achei o cabeçalho do relatório (a linha com "Nº PED" e "Situação").');
  if (campos === 0 && problemas.length === 0) return vazio("O relatório não tem nenhum PED.");
  if (exercicio === null) {
    problemas.push({ gravidade: "erro", mensagem: "Não achei o exercício do relatório (critério \"Exercício igual a\")." });
  }

  const autorizados = saida.filter((l) => !l.estorno && l.situacao === SITUACAO_AUTORIZADO);
  const total = autorizados.reduce((s, l) => s + l.valor, 0);
  return {
    linhas: saida,
    problemas,
    cabecalho: {
      Exercício: exercicio === null ? "" : String(exercicio),
      "PEDs no arquivo": String(new Set(saida.map((l) => l.numero)).size),
      "PEDs autorizados sem empenho": `${autorizados.length} (${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`,
    },
    parametros: { exercicio },
  };
}

/** Linha no formato que a RPC recebe (sem a linha da planilha). */
export function paraContratoPed({ linhaPlanilha: _linha, ...resto }: LinhaPedFiplan) {
  return resto;
}
