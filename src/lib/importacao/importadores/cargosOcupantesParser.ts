/**
 * LEITOR DA PLANILHA DE OCUPANTES (cargos comissionados) para o cargo e a lotação de cada servidor
 *
 * A planilha que o RH mantém dos ocupantes atuais tem uma linha por pessoa, com as colunas CARGO, CODIGO (símbolo:
 * SUBSIDIO, CNES-II, CDS-I…), VALOR, NOME DO OCUPANTE, MUNIC. e LOCAL ("DIRAF/NUCLEO DE PESSOAL", "PRESIDENCIA").
 * Não traz CPF: o servidor é achado pelo nome entre os já cadastrados (entrada 1, arquivo da Seplan). Grafia
 * diferente ("SOUSA" × "SOUZA") casa pelo nome mais parecido só quando não há dúvida, e vira aviso para conferir.
 * A lotação é casada com a estrutura organizacional pelo nome (a parte depois da "/") ou pela sigla.
 *
 * Sem acesso ao banco: recebe os servidores e as unidades já buscados e devolve linhas e problemas; a RPC
 * `rh_importar_cargos_ocupantes` confere tudo de novo e grava.
 */

import { mapearColunas, paraTexto } from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

export interface ServidorParaCasar {
  id: string;
  nome: string;
}

export interface UnidadeParaCasar {
  id: string;
  nome: string;
  sigla: string | null;
}

export interface LinhaOcupante {
  /** Linha no Excel (cabeçalho = 1) */
  linhaPlanilha: number;
  cargo: string;
  simbolo: string | null;
  nomePlanilha: string;
  municipio: string | null;
  local: string | null;
  servidorId: string | null;
  servidorNome: string | null;
  /** 1 = nome igual; menor que 1 = casado por semelhança */
  semelhanca: number | null;
  unidadeId: string | null;
  unidadeNome: string | null;
}

type Campo = "cargo" | "simbolo" | "valor" | "nome" | "municipio" | "local";

const SINONIMOS: Record<string, Campo> = {
  cargo: "cargo",
  codigo: "simbolo",
  simbolo: "simbolo",
  valor: "valor",
  nome_do_ocupante: "nome",
  ocupante: "nome",
  nome: "nome",
  munic: "municipio",
  municipio: "municipio",
  local: "local",
  lotacao: "local",
};

/** Semelhança mínima para casar um nome escrito diferente, e a folga mínima para o segundo mais parecido. */
export const SEMELHANCA_MINIMA = 0.72;
export const FOLGA_MINIMA = 0.15;

/** "José  de Souza-Lima" → "JOSE DE SOUZA LIMA": sem acento, só letras e um espaço entre as palavras. */
export function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, " ")
    .trim();
}

/** 1 − distância de Levenshtein / tamanho do maior (1 = iguais). */
export function semelhanca(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      atual.push(Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
    }
    anterior = atual;
  }
  return 1 - anterior[b.length] / Math.max(a.length, b.length);
}

/** Aba "ativos" quando existir (a "inativos" é histórico); senão a primeira. */
function escolherAba(abas: Record<string, unknown[][]>): [string, unknown[][]] {
  const nomes = Object.keys(abas);
  const nome = nomes.find((n) => normalizarNome(n) === "ATIVOS") ?? nomes[0];
  if (!nome) throw new Error("A planilha não tem nenhuma aba.");
  return [nome, abas[nome]];
}

/** Lê a aba de ocupantes; cabeçalho na primeira linha que tenha CARGO e o nome do ocupante. */
export function interpretarOcupantes(abas: Record<string, unknown[][]>): {
  aba: string;
  linhas: Omit<LinhaOcupante, "servidorId" | "servidorNome" | "semelhanca" | "unidadeId" | "unidadeNome">[];
  problemas: ProblemaLeitura[];
} {
  const [aba, celulas] = escolherAba(abas);
  const iCab = celulas.findIndex((linha) => {
    const campos = mapearColunas(Object.fromEntries(linha.map((c, i) => [paraTexto(c), i])), SINONIMOS);
    return campos.cargo !== undefined && campos.nome !== undefined;
  });
  if (iCab < 0) {
    throw new Error(`A aba "${aba}" não tem as colunas CARGO e NOME DO OCUPANTE. Use a planilha de ocupantes dos cargos comissionados.`);
  }
  const posicoes = mapearColunas(Object.fromEntries(celulas[iCab].map((c, i) => [paraTexto(c), i])), SINONIMOS) as
    Partial<Record<Campo, number>>;
  const valor = (linha: unknown[], c: Campo) => (posicoes[c] === undefined ? "" : paraTexto(linha[posicoes[c]!]));

  const problemas: ProblemaLeitura[] = [];
  const linhas: ReturnType<typeof interpretarOcupantes>["linhas"] = [];
  celulas.slice(iCab + 1).forEach((linha, i) => {
    const nome = valor(linha, "nome").replace(/\s+/g, " ");
    const cargo = valor(linha, "cargo").replace(/\s+/g, " ");
    if (!nome && !cargo) return;
    const linhaPlanilha = iCab + i + 2;
    if (!nome || !cargo) {
      problemas.push({ gravidade: "aviso", mensagem: `Linha ${linhaPlanilha}: sem ${nome ? "cargo" : "nome do ocupante"}; ignorada.` });
      return;
    }
    linhas.push({
      linhaPlanilha,
      cargo,
      simbolo: valor(linha, "simbolo").toUpperCase() || null,
      nomePlanilha: nome,
      municipio: valor(linha, "municipio") || null,
      local: valor(linha, "local").replace(/\s+/g, " ") || null,
    });
  });
  if (linhas.length === 0) throw new Error(`A aba "${aba}" não tem nenhum ocupante.`);
  return { aba, linhas, problemas };
}

/** Sem espaço: "DEGESTAO" e "DE GESTAO" ficam iguais (a planilha tem palavras grudadas). */
const compacto = (texto: string) => normalizarNome(texto).replace(/ /g, "");

/** Unidade da coluna LOCAL: sigla igual, nome igual (parte depois da "/") ou nome quase igual e sem empate. */
export function casarUnidade(local: string, unidades: UnidadeParaCasar[]): UnidadeParaCasar | null {
  const inteiro = compacto(local);
  const nome = compacto(local.includes("/") ? local.slice(local.lastIndexOf("/") + 1) : local);
  if (!nome) return null;
  const porSigla = unidades.filter((u) => u.sigla && compacto(u.sigla) === inteiro);
  if (porSigla.length === 1) return porSigla[0];
  const iguais = unidades.filter((u) => compacto(u.nome) === nome);
  if (iguais.length === 1) return iguais[0];
  if (iguais.length > 1) return null;
  const notas = unidades
    .map((u) => ({ u, nota: semelhanca(nome, compacto(u.nome)) }))
    .sort((a, b) => b.nota - a.nota);
  const [primeiro, segundo] = notas;
  if (primeiro && primeiro.nota >= 0.85 && (!segundo || primeiro.nota - segundo.nota >= 0.05)) return primeiro.u;
  // nome abreviado na planilha ("Divisão Administrativa e Patrimonial" para "… e Gestão Patrimonial"): todas as
  // palavras dela estão no nome cadastrado, e só numa unidade
  const palavras = palavrasDoNome(local.includes("/") ? local.slice(local.lastIndexOf("/") + 1) : local);
  if (palavras.length >= 3) {
    const contem = unidades.filter((u) => {
      const doNome = new Set(palavrasDoNome(u.nome));
      return palavras.every((p) => doNome.has(p));
    });
    if (contem.length === 1) return contem[0];
  }
  return null;
}

const LIGACOES = new Set(["DE", "DA", "DO", "DAS", "DOS", "E", "A", "AS", "O", "OS"]);
const palavrasDoNome = (texto: string) => normalizarNome(texto).split(" ").filter((p) => p && !LIGACOES.has(p));

/** Casa cada linha com o servidor (pelo nome) e a unidade (pela coluna LOCAL). */
export function casarOcupantes(
  lidas: ReturnType<typeof interpretarOcupantes>["linhas"],
  servidores: ServidorParaCasar[],
  unidades: UnidadeParaCasar[],
): { linhas: LinhaOcupante[]; problemas: ProblemaLeitura[] } {
  const problemas: ProblemaLeitura[] = [];
  const porNome = new Map<string, ServidorParaCasar[]>();
  for (const s of servidores) {
    const chave = normalizarNome(s.nome);
    porNome.set(chave, [...(porNome.get(chave) ?? []), s]);
  }
  const chaves = [...porNome.keys()];
  const usados = new Map<string, number>();

  const linhas = lidas.map((lida, indice): LinhaOcupante => {
    const nome = normalizarNome(lida.nomePlanilha);
    let servidor: ServidorParaCasar | null = null;
    let nota: number | null = null;
    const iguais = porNome.get(nome) ?? [];
    if (iguais.length > 1) {
      problemas.push({ gravidade: "erro", linha: indice,
        mensagem: `Linha ${lida.linhaPlanilha}: há ${iguais.length} servidores cadastrados com o nome ${lida.nomePlanilha}; junte os cadastros antes.` });
    } else if (iguais.length === 1) {
      servidor = iguais[0];
      nota = 1;
    } else {
      const notas = chaves.map((c) => ({ c, nota: semelhanca(nome, c) })).sort((a, b) => b.nota - a.nota);
      const [primeiro, segundo] = notas;
      const unico = primeiro && (porNome.get(primeiro.c) ?? []).length === 1;
      if (unico && primeiro.nota >= SEMELHANCA_MINIMA && (!segundo || primeiro.nota - segundo.nota >= FOLGA_MINIMA)) {
        servidor = porNome.get(primeiro.c)![0];
        nota = Math.round(primeiro.nota * 100) / 100;
        problemas.push({ gravidade: "aviso", linha: indice,
          mensagem: `Linha ${lida.linhaPlanilha}: "${lida.nomePlanilha}" casou com o cadastro "${servidor.nome}" pelo nome mais parecido. Confira.` });
      } else {
        problemas.push({ gravidade: "erro", linha: indice,
          mensagem: `Linha ${lida.linhaPlanilha}: servidor "${lida.nomePlanilha}" não encontrado no cadastro. Corrija o nome na planilha ou cadastre o servidor antes.` });
      }
    }
    if (servidor) {
      const outra = usados.get(servidor.id);
      if (outra !== undefined) {
        problemas.push({ gravidade: "erro", linha: indice,
          mensagem: `Linha ${lida.linhaPlanilha}: o servidor ${servidor.nome} já está na linha ${outra}; cada pessoa só pode ter um cargo.` });
      } else {
        usados.set(servidor.id, lida.linhaPlanilha);
      }
    }

    const unidade = lida.local ? casarUnidade(lida.local, unidades) : null;
    if (lida.local && !unidade) {
      problemas.push({ gravidade: "aviso", linha: indice,
        mensagem: `Linha ${lida.linhaPlanilha}: a lotação "${lida.local}" não está na estrutura organizacional; entra só o cargo.` });
    }
    return {
      ...lida,
      servidorId: servidor?.id ?? null,
      servidorNome: servidor?.nome ?? null,
      semelhanca: nota,
      unidadeId: unidade?.id ?? null,
      unidadeNome: unidade?.nome ?? null,
    };
  });
  return { linhas, problemas };
}

/** Leitura completa: planilha + casamento, no formato do assistente. */
export function lerOcupantes(
  abas: Record<string, unknown[][]>,
  servidores: ServidorParaCasar[],
  unidades: UnidadeParaCasar[],
): ResultadoLeitura<LinhaOcupante> {
  const lida = interpretarOcupantes(abas);
  const casada = casarOcupantes(lida.linhas, servidores, unidades);
  const porSemelhanca = casada.linhas.filter((l) => l.semelhanca !== null && l.semelhanca < 1).length;
  const semUnidade = casada.linhas.filter((l) => !l.unidadeId).length;
  return {
    linhas: casada.linhas,
    problemas: [...lida.problemas, ...casada.problemas],
    cabecalho: {
      Aba: lida.aba,
      Ocupantes: String(casada.linhas.length),
      "Nome casado por semelhança": String(porSemelhanca),
      "Sem lotação na estrutura": String(semUnidade),
    },
    parametros: {},
  };
}

/** Contrato da linha com a RPC (só ids e textos da planilha; nome do servidor não vai). */
export function paraContratoOcupante(l: LinhaOcupante, indice: number) {
  return {
    indice,
    linha: l.linhaPlanilha,
    servidor_id: l.servidorId,
    cargo: l.cargo,
    simbolo: l.simbolo,
    unidade_id: l.unidadeId,
    municipio: l.municipio,
    local: l.local,
  };
}
