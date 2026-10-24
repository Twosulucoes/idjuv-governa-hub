/**
 * PARSER: planilha de acompanhamento dos processos de contratação → linhas da RPC `importar_processos_planilha`
 *
 * Função pura (sem arquivo nem banco), testada em processosPlanilhaParser.test.ts. Lê a aba "Processos" (uma linha
 * por processo; o cabeçalho é achado pela coluna "Nº do processo SEI", depois do título) e, se houver, a aba
 * "Andamento" (uma linha por movimentação). Traduz fase e forma de contratação para as listas do sistema; rótulo
 * desconhecido é erro da linha, não palpite. A RPC confere tudo de novo.
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§6)
 */

import { PADRAO_NUMERO_SEI, type EtapaProcesso, type ModalidadeLicitacao } from "@/types/processos";
import { normalizarCabecalho, paraDataIso, paraTexto } from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

export interface AndamentoPlanilha {
  data: string | null;
  etapa: EtapaProcesso;
  setor: string | null;
  situacao: string;
}

/** Linha no formato do contrato front ↔ RPC (datas AAAA-MM-DD; vazio = null). */
export interface LinhaProcessoContrato {
  indice: number;
  numero_processo: string;
  ano: number | null;
  objeto: string;
  objeto_resumido: string | null;
  modalidade: ModalidadeLicitacao | null;
  etapa: EtapaProcesso;
  setor_atual: string | null;
  situacao_atual: string | null;
  atualizado_em: string | null;
  valor_estimado: number | null;
  valor_estimado_obs: string | null;
  andamentos: AndamentoPlanilha[];
}

/** Linha lida: contrato + número da linha no Excel (só para mensagens; não vai ao banco). */
export interface LinhaProcessoPlanilha extends LinhaProcessoContrato {
  linhaPlanilha?: number;
}

export const ABA_PROCESSOS = "Processos";
export const ABA_ANDAMENTO = "Andamento";

type Campo =
  | "numero"
  | "ano"
  | "objeto_resumido"
  | "forma"
  | "fase"
  | "setor"
  | "situacao"
  | "data"
  | "valor"
  | "valor_obs"
  | "objeto";

/** Cabeçalhos aceitos (já normalizados) → campo. */
const SINONIMOS: Record<string, Campo> = {
  n_do_processo_sei: "numero",
  numero_do_processo: "numero",
  numero_do_processo_sei: "numero",
  processo_sei: "numero",
  ano: "ano",
  objeto_resumo: "objeto_resumido",
  objeto_resumido: "objeto_resumido",
  forma_de_contratacao: "forma",
  modalidade: "forma",
  fase_atual: "fase",
  fase: "fase",
  etapa: "fase",
  setor_atual: "setor",
  setor: "setor",
  situacao_atual_detalhe: "situacao",
  situacao_atual: "situacao",
  situacao_texto_livre: "situacao",
  situacao: "situacao",
  status_atual: "situacao",
  data_da_ultima_atualizacao: "data",
  data_ultima_atualizacao: "data",
  data: "data",
  valor_estimado_r: "valor",
  valor_estimado: "valor",
  observacao_do_valor: "valor_obs",
  objeto_completo_texto_original: "objeto",
  objeto_completo: "objeto",
  objeto_da_contratacao: "objeto",
  objeto: "objeto",
};

/** Texto sem acento, minúsculo e com espaços simples, para comparar rótulos. */
const simplificar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Fase da planilha → etapa (pelo começo do rótulo; a planilha acrescenta detalhes entre parênteses). */
const FASES: [string, EtapaProcesso][] = [
  ["abertura", "abertura"],
  ["dfd", "dfd"],
  ["documento de formalizacao", "dfd"],
  ["etp", "etp"],
  ["estudo tecnico", "etp"],
  ["tr", "tr"],
  ["termo de referencia", "tr"],
  ["cotacao", "cotacao"],
  ["pesquisa de precos", "cotacao"],
  ["levantamento tecnico", "levantamento_tecnico"],
  ["instrucao da adesao", "instrucao_adesao"],
  ["analise juridica", "analise_juridica"],
  ["selecao", "selecao"],
  ["licitacao", "selecao"],
  ["edital", "selecao"],
  ["contrato", "contrato"],
  ["contratado", "contrato"],
  ["execucao", "execucao"],
  ["encerrado", "encerrado"],
  ["concluido", "encerrado"],
  ["cancelado", "cancelado"],
  ["arquivado", "cancelado"],
];

export function etapaDoRotulo(rotulo: string): EtapaProcesso | undefined {
  const t = simplificar(rotulo);
  if (!t) return undefined;
  // "tr" e "etp" só valem como palavra inteira (senão "tramitação" viraria TR)
  return FASES.find(([inicio]) => t === inicio || t.startsWith(`${inicio} `) || t.startsWith(`${inicio}:`) || (inicio.length > 3 && t.startsWith(inicio)))?.[1];
}

/** Forma de contratação → modalidade; `null` = a definir (vazio, "A definir..." ou "Contratado (...)"). */
const FORMAS: [string, ModalidadeLicitacao][] = [
  ["pregao eletronico", "pregao_eletronico"],
  ["pregao presencial", "pregao_presencial"],
  ["pregao", "pregao_eletronico"],
  ["concorrencia", "concorrencia"],
  ["concurso", "concurso"],
  ["leilao", "leilao"],
  ["dialogo competitivo", "dialogo_competitivo"],
  ["dispensa", "dispensa"],
  ["inexigibilidade", "inexigibilidade"],
  ["contratacao direta (fornecedor exclusivo)", "inexigibilidade"],
  ["adesao", "adesao_ata"],
];

export function modalidadeDoRotulo(rotulo: string): ModalidadeLicitacao | null | undefined {
  const t = simplificar(rotulo);
  if (!t || t.startsWith("a definir") || t.startsWith("contratado")) return null;
  return FORMAS.find(([inicio]) => t.startsWith(inicio))?.[1];
}

/** Valor em número; aceita número da célula ou texto "R$ 1.481.909,45". Sem número = null. */
export function paraValor(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) && valor >= 0 ? Math.round(valor * 100) / 100 : null;
  const texto = paraTexto(valor).replace(/R\$\s*:?/gi, "").trim();
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(texto)) return null;
  return Number(texto.replace(/\./g, "").replace(",", "."));
}

/** Acha a linha do cabeçalho (a que tem a coluna do nº SEI) e devolve o índice de cada campo. */
function acharCabecalho(linhas: unknown[][]): { linha: number; colunas: Partial<Record<Campo, number>> } | null {
  for (let i = 0; i < Math.min(linhas.length, 20); i++) {
    const colunas: Partial<Record<Campo, number>> = {};
    linhas[i].forEach((celula, c) => {
      const chave = normalizarCabecalho(paraTexto(celula));
      const campo = Object.prototype.hasOwnProperty.call(SINONIMOS, chave) ? SINONIMOS[chave] : undefined;
      if (campo && colunas[campo] === undefined) colunas[campo] = c;
    });
    if (colunas.numero !== undefined) return { linha: i, colunas };
  }
  return null;
}

const celula = (linha: unknown[], col: number | undefined) => (col === undefined ? "" : linha[col]);
const texto = (linha: unknown[], col: number | undefined) => paraTexto(celula(linha, col)).replace(/\s+/g, " ");

/** Achar a aba sem diferenciar maiúsculas e acentos. */
function aba(abas: Record<string, unknown[][]>, nome: string): unknown[][] | undefined {
  const chave = Object.keys(abas).find((k) => simplificar(k) === simplificar(nome));
  return chave ? abas[chave] : undefined;
}

export function interpretarProcessosPlanilha(abas: Record<string, unknown[][]>): ResultadoLeitura<LinhaProcessoPlanilha> {
  const problemas: ProblemaLeitura[] = [];
  const linhas: LinhaProcessoPlanilha[] = [];
  const vazio = { linhas, problemas, cabecalho: {}, parametros: {} };

  const brutas = aba(abas, ABA_PROCESSOS) ?? Object.values(abas)[0];
  const cab = brutas && acharCabecalho(brutas);
  if (!brutas || !cab) {
    problemas.push({ gravidade: "erro", mensagem: 'Não achei a coluna "Nº do processo SEI" na aba "Processos".' });
    return vazio;
  }
  const { colunas } = cab;
  if (colunas.objeto === undefined && colunas.objeto_resumido === undefined) {
    problemas.push({ gravidade: "erro", mensagem: 'Falta a coluna do objeto ("Objeto completo" ou "Objeto (resumo)").' });
    return vazio;
  }

  const porNumero = new Map<string, LinhaProcessoPlanilha>();
  for (let i = cab.linha + 1; i < brutas.length; i++) {
    const bruta = brutas[i];
    const numeroLinha = i + 1;
    const numero = paraTexto(celula(bruta, colunas.numero)).replace(/\s+/g, "");
    if (!numero) continue; // linha de total ou em branco
    const indice = linhas.length;
    const erro = (mensagem: string) => problemas.push({ gravidade: "erro", mensagem: `Linha ${numeroLinha}: ${mensagem}`, linha: indice });
    const aviso = (mensagem: string) => problemas.push({ gravidade: "aviso", mensagem: `Linha ${numeroLinha}: ${mensagem}`, linha: indice });

    if (!PADRAO_NUMERO_SEI.test(numero)) erro(`nº SEI "${numero}" fora do formato 00000.000000/0000.00.`);
    if (porNumero.has(numero)) erro(`processo ${numero} repetido na planilha.`);

    const resumo = texto(bruta, colunas.objeto_resumido) || null;
    const objeto = texto(bruta, colunas.objeto) || resumo || "";
    if (!objeto) erro("sem objeto.");

    const rotuloFase = texto(bruta, colunas.fase);
    const etapa = rotuloFase ? etapaDoRotulo(rotuloFase) : "abertura";
    if (!etapa) erro(`fase "${rotuloFase}" desconhecida.`);

    const rotuloForma = texto(bruta, colunas.forma);
    const modalidade = modalidadeDoRotulo(rotuloForma);
    if (modalidade === undefined) erro(`forma de contratação "${rotuloForma}" desconhecida.`);

    const data = paraDataIso(celula(bruta, colunas.data));
    if (data === undefined) erro(`data "${texto(bruta, colunas.data)}" inválida.`);

    const anoTexto = texto(bruta, colunas.ano);
    const ano = anoTexto ? Number(anoTexto) : Number(numero.slice(13, 17));
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) erro(`ano "${anoTexto}" inválido.`);

    const valorBruto = celula(bruta, colunas.valor);
    const valor = paraValor(valorBruto);
    let valorObs = texto(bruta, colunas.valor_obs) || null;
    if (valor === null && paraTexto(valorBruto) && !valorObs) valorObs = texto(bruta, colunas.valor);

    const linha: LinhaProcessoPlanilha = {
      indice,
      linhaPlanilha: numeroLinha,
      numero_processo: numero,
      ano: Number.isInteger(ano) ? ano : null,
      objeto,
      objeto_resumido: resumo ? resumo.slice(0, 500) : null,
      modalidade: modalidade ?? null,
      etapa: etapa ?? "abertura",
      setor_atual: texto(bruta, colunas.setor) || null,
      situacao_atual: texto(bruta, colunas.situacao) || null,
      atualizado_em: data ?? null,
      valor_estimado: valor,
      valor_estimado_obs: valorObs,
      andamentos: [],
    };
    if (!data) aviso("sem data da última atualização.");
    linhas.push(linha);
    porNumero.set(numero, linha);
  }

  // Andamento: uma linha por movimentação, ligada pelo nº SEI
  const brutasAnd = aba(abas, ABA_ANDAMENTO);
  const cabAnd = brutasAnd && acharCabecalho(brutasAnd);
  let movimentacoes = 0;
  if (brutasAnd && cabAnd) {
    const c = cabAnd.colunas;
    for (let i = cabAnd.linha + 1; i < brutasAnd.length; i++) {
      const bruta = brutasAnd[i];
      const numero = paraTexto(celula(bruta, c.numero)).replace(/\s+/g, "");
      if (!numero) continue;
      const onde = `Andamento, linha ${i + 1}`;
      const processo = porNumero.get(numero);
      if (!processo) {
        problemas.push({ gravidade: "aviso", mensagem: `${onde}: processo ${numero} não está na aba "Processos"; ignorada.` });
        continue;
      }
      const erro = (mensagem: string) => problemas.push({ gravidade: "erro", mensagem: `${onde}: ${mensagem}`, linha: processo.indice });
      const situacao = texto(bruta, c.situacao);
      const rotuloFase = texto(bruta, c.fase);
      const etapa = rotuloFase ? etapaDoRotulo(rotuloFase) : processo.etapa;
      const data = paraDataIso(celula(bruta, c.data));
      if (!situacao) erro("sem situação.");
      if (!etapa) erro(`fase "${rotuloFase}" desconhecida.`);
      if (data === undefined) erro(`data "${texto(bruta, c.data)}" inválida.`);
      if (situacao && etapa && data !== undefined) {
        processo.andamentos.push({ data, etapa, setor: texto(bruta, c.setor) || null, situacao });
        movimentacoes++;
      }
    }
  }

  // Processo sem movimentação na aba "Andamento": a situação atual vira a primeira movimentação
  for (const linha of linhas) {
    if (linha.andamentos.length === 0 && linha.situacao_atual) {
      linha.andamentos.push({ data: linha.atualizado_em, etapa: linha.etapa, setor: linha.setor_atual, situacao: linha.situacao_atual });
      movimentacoes++;
    }
  }

  if (linhas.length === 0) problemas.push({ gravidade: "erro", mensagem: "Nenhum processo encontrado na planilha." });

  return {
    linhas,
    problemas,
    cabecalho: { Processos: String(linhas.length), Movimentações: String(movimentacoes) },
    parametros: {},
  };
}

/** Linha lida → contrato da RPC (sem o número da linha do Excel). */
export function paraContrato({ linhaPlanilha: _linha, ...contrato }: LinhaProcessoPlanilha): LinhaProcessoContrato {
  return contrato;
}
