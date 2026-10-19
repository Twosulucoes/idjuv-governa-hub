/**
 * PARSER: planilha "Consultar ..." do FIPLAN → linhas da RPC `importar_classificadores_fiplan`
 *
 * Função pura (sem arquivo nem banco), testada em classificadoresFiplanParser.test.ts. O FIPLAN exporta todas as
 * consultas no mesmo formato: título "Consultar <tabela>", os critérios ("*Exercício igual a 2026"), o cabeçalho e
 * as linhas (com o cabeçalho repetido quando a planilha continua). A tabela é reconhecida pelo título.
 * Spec: docs/superpowers/specs/2026-10-19-classificadores-fiplan-design.md
 */

import { normalizarCabecalho, paraTexto } from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

export type TipoClassificador = "funcao" | "programa" | "elemento" | "subelemento" | "fonte" | "finalidade_pagamento";

/** Linha no formato do contrato front ↔ RPC. */
export interface LinhaClassificador {
  codigo: string;
  nome: string;
  nome_resumido: string | null;
  ativo: boolean;
  /** Demais colunas da planilha (cabeçalho normalizado → texto), sem as vazias */
  atributos: Record<string, string>;
}

interface Tabela {
  titulo: string;
  /** Dígitos de cada parte do código, para célula que o Excel guardou como número (30 → "030") */
  digitos: number[];
  /** Colunas (cabeçalho normalizado) que formam o código, unidas por "." */
  codigo: string[];
  nome: string;
  padrao: RegExp;
}

export const TABELAS_FIPLAN: Record<TipoClassificador, Tabela> = {
  funcao: { titulo: "Função de Governo", digitos: [2], codigo: ["codigo_da_funcao"], nome: "nome_da_funcao", padrao: /^\d{2}$/ },
  programa: { titulo: "Programa de Governo", digitos: [3], codigo: ["programa"], nome: "nome_do_programa", padrao: /^\d{3}$/ },
  elemento: { titulo: "Elemento de Despesa", digitos: [2], codigo: ["codigo"], nome: "nome_do_elemento_de_despesa", padrao: /^\d{2}$/ },
  subelemento: {
    titulo: "Subelemento da Despesa",
    digitos: [2, 2],
    codigo: ["elemento", "subelemento"],
    nome: "nome_subelemento",
    padrao: /^\d{2}\.\d{2}$/,
  },
  fonte: { titulo: "Fonte de Recurso", digitos: [0], codigo: ["fonte"], nome: "nome_da_fonte_de_recurso", padrao: /^\d\.\d{3}$/ },
  finalidade_pagamento: {
    titulo: "Finalidade de Pagamento",
    digitos: [0],
    codigo: ["codigo_da_finalidade_de_pagamento"],
    nome: "nome_da_finalidade_de_pagamento",
    padrao: /^\d{1,4}$/,
  },
};

/** Colunas que não vão para `atributos`: já têm campo próprio ou podem ser dado pessoal (LGPD; a RPC filtra igual). */
const FORA_DOS_ATRIBUTOS = new Set(["exercicio", "nome_resumido", "situacao"]);
const DADO_PESSOAL = /respons|cpf|e_?mail|telefone|celular|matricula/i;

const PREFIXO_TITULO = "consultar_";

/** Tipo da tabela pelo título da consulta ("Consultar Fonte de Recurso" → fonte). */
export function tipoPeloTitulo(titulo: string): TipoClassificador | undefined {
  const normal = normalizarCabecalho(titulo);
  if (!normal.startsWith(PREFIXO_TITULO)) return undefined;
  const resto = normal.slice(PREFIXO_TITULO.length);
  return (Object.keys(TABELAS_FIPLAN) as TipoClassificador[]).find((t) => normalizarCabecalho(TABELAS_FIPLAN[t].titulo) === resto);
}

const textoDaLinha = (linha: unknown[]) => linha.map((c) => paraTexto(c));

/** Parte do código: texto como veio; número (célula tipada pelo Excel) volta ao formato do FIPLAN. */
function parteDoCodigo(tipo: TipoClassificador, celula: unknown, digitos: number): string {
  if (typeof celula !== "number") return paraTexto(celula);
  if (tipo === "fonte") return celula.toFixed(3);
  return digitos ? String(celula).padStart(digitos, "0") : String(celula);
}

export function interpretarClassificadoresFiplan(
  linhasPlanilha: unknown[][],
  anoAtual = new Date().getFullYear(),
): ResultadoLeitura<LinhaClassificador> {
  const problemas: ProblemaLeitura[] = [];
  const vazio = (mensagem: string): ResultadoLeitura<LinhaClassificador> => ({
    linhas: [],
    problemas: [{ gravidade: "erro", mensagem }],
    cabecalho: {},
    parametros: {},
  });

  const textos = linhasPlanilha.map(textoDaLinha);
  const titulo = textos.flat().find((c) => normalizarCabecalho(c).startsWith(PREFIXO_TITULO)) ?? "";
  const tipo = tipoPeloTitulo(titulo);
  if (!tipo) {
    const lista = Object.values(TABELAS_FIPLAN).map((t) => t.titulo).join(", ");
    return vazio(
      titulo
        ? `"${titulo}" não é uma das tabelas aceitas (${lista}).`
        : `Não achei o título "Consultar ..." do FIPLAN. Exporte pelo FIPLAN uma destas consultas: ${lista}.`,
    );
  }
  const tabela = TABELAS_FIPLAN[tipo];

  const indiceCabecalho = textos.findIndex((l) => {
    const normal = l.map(normalizarCabecalho);
    return tabela.codigo.every((c) => normal.includes(c)) && normal.includes(tabela.nome);
  });
  if (indiceCabecalho < 0) return vazio(`A planilha "${titulo}" não tem as colunas esperadas (${tabela.nome}).`);
  const cabecalhos = textos[indiceCabecalho].map(normalizarCabecalho);
  const coluna = (nome: string) => cabecalhos.indexOf(nome);

  // Exercício: o do filtro da consulta ou, sem ele, o da coluna Exercício
  const filtro = textos.slice(0, indiceCabecalho).flat().map((c) => c.match(/exerc[ií]cio igual a (\d{4})/i)).find(Boolean);
  const exercicios = new Set<string>();
  if (filtro) exercicios.add(filtro[1]);
  const colExercicio = coluna("exercicio");

  const linhas: LinhaClassificador[] = [];
  const vistos = new Map<string, number>();
  for (let i = indiceCabecalho + 1; i < textos.length; i++) {
    const valores = textos[i];
    if (valores.every((v) => v === "")) continue;
    const normal = valores.map(normalizarCabecalho);
    // Cabeçalho repetido (continuação) e o aviso "Continua na próxima planilha..."
    if (tabela.codigo.every((c) => normal[coluna(c)] === c)) continue;
    if (normal.some((v) => v.startsWith("continua_na_pr"))) continue;
    // Título e critérios de novo (a consulta continua em outra aba)
    const primeira = valores.find((v) => v !== "") ?? "";
    if (normalizarCabecalho(primeira).startsWith(PREFIXO_TITULO) || /^crit|^\*/i.test(primeira)) {
      const outro = primeira.match(/exerc[ií]cio igual a (\d{4})/i);
      if (outro) exercicios.add(outro[1]);
      continue;
    }

    const linhaExcel = i + 1;
    if (colExercicio >= 0 && valores[colExercicio]) exercicios.add(valores[colExercicio]);
    const codigo = tabela.codigo.map((c, k) => parteDoCodigo(tipo, linhasPlanilha[i][coluna(c)], tabela.digitos[k])).join(".");
    const nome = valores[coluna(tabela.nome)] ?? "";
    if (!tabela.padrao.test(codigo) || !nome) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaExcel}: código "${codigo}" ou nome fora do padrão.` });
      continue;
    }
    const anterior = vistos.get(codigo);
    if (anterior !== undefined) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaExcel}: código ${codigo} repetido (já na linha ${anterior}).` });
      continue;
    }
    vistos.set(codigo, linhaExcel);

    const atributos: Record<string, string> = {};
    cabecalhos.forEach((cab, k) => {
      if (!cab || FORA_DOS_ATRIBUTOS.has(cab) || DADO_PESSOAL.test(cab) || tabela.codigo.includes(cab) || cab === tabela.nome) return;
      if (valores[k]) atributos[cab] = valores[k].slice(0, 300);
    });
    const celula = (nomeColuna: string) => (coluna(nomeColuna) >= 0 ? valores[coluna(nomeColuna)] ?? "" : "");
    linhas.push({
      codigo,
      nome: nome.slice(0, 500),
      nome_resumido: celula("nome_resumido").slice(0, 200) || null,
      ativo: normalizarCabecalho(celula("situacao")) !== "inativo",
      atributos,
    });
  }

  if (exercicios.size > 1) {
    return vazio(`A planilha mistura exercícios (${[...exercicios].join(", ")}). Exporte um exercício por vez.`);
  }
  // Finalidade de pagamento não tem coluna Exercício: sem o filtro, vale o ano corrente (com aviso)
  let exercicio = Number([...exercicios][0]);
  if (!exercicio) {
    exercicio = anoAtual;
    problemas.push({ gravidade: "aviso", mensagem: `A planilha não diz o exercício; será gravada como ${anoAtual}.` });
  }
  if (linhas.length === 0 && !problemas.some((p) => p.gravidade === "erro")) {
    problemas.push({ gravidade: "erro", mensagem: "A planilha não tem nenhuma linha." });
  }

  return {
    linhas,
    problemas,
    cabecalho: { Tabela: tabela.titulo, Exercício: String(exercicio), Linhas: String(linhas.length) },
    parametros: { tipo, exercicio },
  };
}
