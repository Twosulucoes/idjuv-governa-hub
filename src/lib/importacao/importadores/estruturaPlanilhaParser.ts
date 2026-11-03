/**
 * PARSER: planilha da estrutura organizacional → linhas da RPC `governanca_importar_estrutura`
 *
 * Função pura (sem arquivo nem banco), testada em estruturaPlanilhaParser.test.ts. Uma linha por unidade, com a
 * sigla da unidade a que ela responde. A leitura fica na ordem da planilha (o assistente casa resultado e linha pela
 * posição); no envio, `ordemDeEnvio` põe o superior antes do subordinado, para que a RPC ache o superior que acabou
 * de ser criado na mesma importação, e cada linha leva o seu índice. Sigla repetida, superior em ciclo e tipo desconhecido são erros da linha;
 * superior que não está na planilha é procurado no cadastro pela RPC.
 */

import { LABELS_UNIDADE, type TipoUnidade } from "@/types/organograma";
import {
  cabecalhosIgnorados,
  campoDoCabecalho,
  linhaVazia,
  mapearColunas,
  normalizarCabecalho,
  paraDataIso,
  paraTexto,
  type LinhaPlanilha,
} from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

/** Linha no formato do contrato front ↔ RPC (datas AAAA-MM-DD; vazio = null). */
export interface LinhaEstruturaContrato {
  indice: number;
  sigla: string;
  nome: string;
  tipo: TipoUnidade;
  superior_sigla: string | null;
  descricao: string | null;
  lei_criacao_numero: string | null;
  lei_criacao_data: string | null;
}

/** Linha lida: contrato + número da linha no Excel (só para mensagens; não vai ao banco). */
export interface LinhaEstruturaPlanilha extends LinhaEstruturaContrato {
  linhaPlanilha?: number;
}

export type CampoPlanilha = "sigla" | "nome" | "tipo" | "superior" | "descricao" | "lei_numero" | "lei_data";

/** Cabeçalhos do modelo, na ordem das colunas. */
export const CABECALHOS_MODELO: Record<CampoPlanilha, string> = {
  sigla: "Sigla",
  nome: "Nome da unidade",
  tipo: "Tipo",
  superior: "Responde a (sigla)",
  descricao: "Descrição",
  lei_numero: "Lei de criação",
  lei_data: "Data da lei",
};

/** Cabeçalhos aceitos (já normalizados) → campo. */
const SINONIMOS: Record<string, CampoPlanilha> = {
  sigla: "sigla",
  nome_da_unidade: "nome",
  nome: "nome",
  unidade: "nome",
  tipo: "tipo",
  tipo_da_unidade: "tipo",
  responde_a_sigla: "superior",
  responde_a: "superior",
  superior: "superior",
  sigla_do_superior: "superior",
  unidade_superior: "superior",
  descricao: "descricao",
  lei_de_criacao: "lei_numero",
  lei: "lei_numero",
  lei_numero: "lei_numero",
  data_da_lei: "lei_data",
  lei_data: "lei_data",
};

export const LIMITE_LINHAS = 500;

/** "Divisão", "divisao", "DIVISAO" → divisao. */
const TIPOS: Record<string, TipoUnidade> = Object.fromEntries(
  (Object.entries(LABELS_UNIDADE) as [TipoUnidade, string][]).flatMap(([valor, rotulo]) => [
    [normalizarCabecalho(rotulo), valor],
    [valor, valor],
  ]),
);

const chave = (sigla: string) => sigla.toUpperCase();

export function interpretarEstruturaPlanilha(
  cabecalhos: string[],
  brutas: LinhaPlanilha[],
): ResultadoLeitura<LinhaEstruturaPlanilha> {
  const problemas: ProblemaLeitura[] = [];
  const lidas: LinhaEstruturaPlanilha[] = [];

  const campos = new Set(cabecalhos.map((c) => campoDoCabecalho(c, SINONIMOS)).filter(Boolean));
  const faltando = (["sigla", "nome", "tipo"] as const).filter((c) => !campos.has(c));
  if (faltando.length > 0) {
    problemas.push({
      gravidade: "erro",
      mensagem: `Faltam as colunas: ${faltando.map((c) => CABECALHOS_MODELO[c]).join(", ")}. Use o modelo.`,
    });
  }
  const ignorados = cabecalhosIgnorados(cabecalhos, SINONIMOS);
  if (ignorados.length > 0) {
    problemas.push({ gravidade: "aviso", mensagem: `Colunas não reconhecidas (ficam de fora): ${ignorados.join(", ")}.` });
  }

  const preenchidas = brutas.filter((b) => !linhaVazia(b.valores));
  if (preenchidas.length === 0) {
    problemas.push({ gravidade: "erro", mensagem: "A planilha não tem nenhuma linha preenchida." });
  }
  if (preenchidas.length > LIMITE_LINHAS) {
    problemas.push({
      gravidade: "erro",
      mensagem: `A planilha tem ${preenchidas.length} linhas; o limite é ${LIMITE_LINHAS} por arquivo. Divida em partes.`,
    });
  }

  const ondeDaLinha = new Map<number, string>();
  const primeiraDaSigla = new Map<string, number>();

  preenchidas.forEach((bruta, indice) => {
    const v = mapearColunas(bruta.valores, SINONIMOS);
    const onde = bruta.numeroLinha ? `Linha ${bruta.numeroLinha}` : `Linha ${indice + 2}`;
    ondeDaLinha.set(indice, onde);
    const erro = (mensagem: string) => problemas.push({ gravidade: "erro", linha: indice, mensagem: `${onde}: ${mensagem}` });
    const texto = (campo: CampoPlanilha) => paraTexto(v[campo]).replace(/\s+/g, " ") || null;

    const sigla = texto("sigla");
    const nome = texto("nome");
    const tipoTexto = texto("tipo");
    const tipo = tipoTexto ? TIPOS[normalizarCabecalho(tipoTexto)] : undefined;
    const superior = texto("superior");

    if (!sigla) erro("informe a sigla.");
    else if (sigla.length > 30) erro(`a sigla "${sigla}" passa de 30 caracteres.`);
    if (!nome) erro("informe o nome da unidade.");
    else if (nome.length > 200) erro("o nome passa de 200 caracteres.");
    if (!tipoTexto) erro("informe o tipo.");
    else if (!tipo) erro(`tipo "${tipoTexto}" desconhecido (use: ${Object.values(LABELS_UNIDADE).join(", ")}).`);
    if (sigla && superior && chave(sigla) === chave(superior)) erro("a unidade não pode responder a ela mesma.");
    if (sigla) {
      const anterior = primeiraDaSigla.get(chave(sigla));
      if (anterior !== undefined) erro(`a sigla "${sigla}" já apareceu na ${ondeDaLinha.get(anterior)}.`);
      else primeiraDaSigla.set(chave(sigla), indice);
    }

    const leiData = paraDataIso(v.lei_data);
    if (leiData === undefined) erro(`"${CABECALHOS_MODELO.lei_data}" não é uma data válida (use dd/mm/aaaa).`);

    lidas.push({
      indice,
      linhaPlanilha: bruta.numeroLinha,
      sigla: sigla ?? "",
      nome: nome ?? "",
      tipo: tipo ?? "setor",
      superior_sigla: superior,
      descricao: texto("descricao"),
      lei_criacao_numero: texto("lei_numero"),
      lei_criacao_data: leiData ?? null,
    });
  });

  // só para achar ciclos: a ordem de envio é calculada de novo no envio
  ordemDeEnvio(lidas, (indice, mensagem) =>
    problemas.push({ gravidade: "erro", linha: indice, mensagem: `${ondeDaLinha.get(indice)}: ${mensagem}` }));
  return { linhas: lidas, problemas, cabecalho: {}, parametros: {} };
}

/**
 * Superior antes do subordinado (quando os dois estão na planilha); fora isso, a ordem da planilha.
 * Superior que forma ciclo dentro da planilha (A responde a B, B responde a A) é erro nas linhas do ciclo.
 */
export function ordemDeEnvio<L extends LinhaEstruturaContrato>(
  linhas: L[],
  aoAcharCiclo: (indice: number, mensagem: string) => void = () => {},
): L[] {
  const porSigla = new Map<string, L>();
  for (const l of linhas) if (l.sigla && !porSigla.has(chave(l.sigla))) porSigla.set(chave(l.sigla), l);

  const saida: L[] = [];
  const estado = new Map<number, "visitando" | "feita">();
  const visitar = (l: L, caminho: L[]) => {
    const atual = estado.get(l.indice);
    if (atual === "feita") return;
    if (atual === "visitando") {
      const ciclo = caminho.slice(caminho.indexOf(l));
      const siglas = ciclo.map((c) => c.sigla).join(" → ");
      for (const c of ciclo) aoAcharCiclo(c.indice, `hierarquia em ciclo (${siglas} → ${l.sigla}).`);
      return;
    }
    estado.set(l.indice, "visitando");
    const superior = l.superior_sigla ? porSigla.get(chave(l.superior_sigla)) : undefined;
    if (superior && superior !== l) visitar(superior, [...caminho, l]);
    estado.set(l.indice, "feita");
    saida.push(l);
  };
  for (const l of linhas) visitar(l, []);
  return saida;
}

/** Linha no formato da RPC (sem o número da linha no Excel). */
export function paraContrato(l: LinhaEstruturaPlanilha): LinhaEstruturaContrato {
  const { linhaPlanilha: _linha, ...contrato } = l;
  return contrato;
}
