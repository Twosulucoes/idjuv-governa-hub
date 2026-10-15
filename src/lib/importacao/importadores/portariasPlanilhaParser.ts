/**
 * PARSER: planilha de portarias → linhas do contrato da RPC `importar_portarias_planilha`
 *
 * Função pura (sem arquivo nem banco), testada em portariasPlanilhaParser.test.ts. Valida o que dá para
 * validar no navegador (formato, obrigatórios, datas, repetidos no arquivo); a RPC confere tudo de novo,
 * inclusive matrículas e o que já existe no banco. Regras: docs/superpowers/specs/2026-10-15-importacao-portarias-planilha-design.md
 */

import type { CategoriaPortaria, StatusPortaria } from "@/types/portaria";
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

export type StatusImportavel = Extract<StatusPortaria, "aguardando_assinatura" | "assinado" | "publicado" | "vigente">;

/** Linha no formato do contrato front ↔ RPC (datas AAAA-MM-DD; vazio = null). */
export interface LinhaPortariaContrato {
  indice: number;
  numero: string;
  data_documento: string | null;
  categoria: CategoriaPortaria | null;
  ementa: string | null;
  processo_sei: string | null;
  status: StatusImportavel | null;
  /** true quando a coluna Situação veio preenchida; false quando o parser aplicou o padrão */
  status_informado: boolean;
  assinado_por: string | null;
  data_assinatura: string | null;
  doe_numero: string | null;
  doe_data: string | null;
  data_vigencia_inicio: string | null;
  data_vigencia_fim: string | null;
  matriculas: string[];
  observacoes: string | null;
}

/** Linha lida: contrato + número da linha no Excel (só para mensagens; não vai ao banco). */
export interface LinhaPortariaPlanilha extends LinhaPortariaContrato {
  linhaPlanilha?: number;
}

export type CampoPlanilha =
  | "numero"
  | "data_documento"
  | "categoria"
  | "ementa"
  | "processo_sei"
  | "situacao"
  | "assinado_por"
  | "data_assinatura"
  | "doe_numero"
  | "doe_data"
  | "data_vigencia_inicio"
  | "data_vigencia_fim"
  | "matriculas"
  | "observacoes";

/** Cabeçalho do modelo (o que o usuário vê) por campo. */
export const CABECALHOS_MODELO: Record<CampoPlanilha, string> = {
  numero: "Número",
  data_documento: "Data da portaria",
  categoria: "Categoria",
  ementa: "Ementa",
  processo_sei: "Processo SEI",
  situacao: "Situação",
  assinado_por: "Assinado por",
  data_assinatura: "Data da assinatura",
  doe_numero: "Nº DOE",
  doe_data: "Data DOE",
  data_vigencia_inicio: "Início da vigência",
  data_vigencia_fim: "Fim da vigência",
  matriculas: "Matrículas",
  observacoes: "Observações",
};

/** Cabeçalho normalizado (normalizarCabecalho) → campo. Inclui os do modelo e variações comuns. */
export const SINONIMOS_PORTARIAS: Record<string, CampoPlanilha> = {
  numero: "numero",
  n: "numero",
  no: "numero",
  numero_da_portaria: "numero",
  n_da_portaria: "numero",
  portaria: "numero",
  data_da_portaria: "data_documento",
  data_portaria: "data_documento",
  data_documento: "data_documento",
  data: "data_documento",
  categoria: "categoria",
  tipo: "categoria",
  tipo_de_portaria: "categoria",
  ementa: "ementa",
  assunto: "ementa",
  processo_sei: "processo_sei",
  processo: "processo_sei",
  sei: "processo_sei",
  situacao: "situacao",
  status: "situacao",
  assinado_por: "assinado_por",
  assinante: "assinado_por",
  data_da_assinatura: "data_assinatura",
  data_assinatura: "data_assinatura",
  n_doe: "doe_numero",
  no_doe: "doe_numero",
  numero_doe: "doe_numero",
  numero_do_doe: "doe_numero",
  doe_numero: "doe_numero",
  doe: "doe_numero",
  data_doe: "doe_data",
  data_do_doe: "doe_data",
  doe_data: "doe_data",
  data_da_publicacao: "doe_data",
  data_publicacao: "doe_data",
  inicio_da_vigencia: "data_vigencia_inicio",
  inicio_vigencia: "data_vigencia_inicio",
  vigencia_inicio: "data_vigencia_inicio",
  data_vigencia_inicio: "data_vigencia_inicio",
  fim_da_vigencia: "data_vigencia_fim",
  fim_vigencia: "data_vigencia_fim",
  vigencia_fim: "data_vigencia_fim",
  data_vigencia_fim: "data_vigencia_fim",
  matriculas: "matriculas",
  matricula: "matriculas",
  observacoes: "observacoes",
  observacao: "observacoes",
  obs: "observacoes",
};

/** Mesmos rótulos da tela de registro (NovaPortariaSimplificada). */
export const CATEGORIAS_PORTARIA: { value: CategoriaPortaria; label: string }[] = [
  { value: "pessoal", label: "Pessoal (Genérica)" },
  { value: "nomeacao", label: "Nomeação" },
  { value: "exoneracao", label: "Exoneração" },
  { value: "designacao", label: "Designação" },
  { value: "dispensa", label: "Dispensa" },
  { value: "ferias", label: "Férias" },
  { value: "licenca", label: "Licença" },
  { value: "cessao", label: "Cessão" },
  { value: "delegacao", label: "Delegação" },
  { value: "estruturante", label: "Estruturante" },
  { value: "normativa", label: "Normativa" },
];

/** Categorias que tratam de servidores: matrícula vazia vira aviso. */
const CATEGORIAS_PESSOAL = new Set<CategoriaPortaria>([
  "pessoal",
  "nomeacao",
  "exoneracao",
  "designacao",
  "dispensa",
  "cessao",
]);

const CATEGORIA_POR_TEXTO = new Map<string, CategoriaPortaria>();
for (const c of CATEGORIAS_PORTARIA) {
  CATEGORIA_POR_TEXTO.set(c.value, c.value);
  CATEGORIA_POR_TEXTO.set(normalizarCabecalho(c.label), c.value);
}
CATEGORIA_POR_TEXTO.set("generica", "pessoal");

export const ROTULO_STATUS_IMPORTAVEL: Record<StatusImportavel, string> = {
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinada",
  publicado: "Publicada",
  vigente: "Vigente",
};

const STATUS_POR_TEXTO: Record<string, StatusImportavel> = {
  aguardando_assinatura: "aguardando_assinatura",
  assinada: "assinado",
  assinado: "assinado",
  publicada: "publicado",
  publicado: "publicado",
  vigente: "vigente",
};

export const LIMITE_LINHAS = 2000;
const LIMITE_EMENTA = 2000;
const LIMITE_PROCESSO = 60;

export interface OpcoesParser {
  /** Data de hoje (AAAA-MM-DD) para recusar data futura; padrão: hoje no fuso local */
  hoje?: string;
}

function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "1/2026" → "001/2026". Devolve `null` quando não está no formato NNN/AAAA. */
export function normalizarNumeroPortaria(texto: string): string | null {
  const limpo = texto
    .trim()
    .replace(/^(portaria\s*)?(n[º°o.]?\s*)?/i, "")
    .replace(/\s+/g, "");
  const m = limpo.match(/^(\d{1,6})\/(\d{4})$/);
  if (!m || Number(m[1]) === 0) return null;
  return `${m[1].padStart(3, "0")}/${m[2]}`;
}

/** Interpreta as linhas lidas da primeira aba (ver `lerPrimeiraAba`). */
export function interpretarPortariasPlanilha(
  cabecalhos: string[],
  brutas: LinhaPlanilha[],
  opcoes: OpcoesParser = {},
): ResultadoLeitura<LinhaPortariaPlanilha> {
  const hoje = opcoes.hoje ?? hojeLocal();
  const problemas: ProblemaLeitura[] = [];
  const linhas: LinhaPortariaPlanilha[] = [];

  const campos = new Set(cabecalhos.map((c) => campoDoCabecalho(c, SINONIMOS_PORTARIAS)).filter(Boolean));
  const faltando = (["numero", "data_documento", "categoria"] as const).filter((c) => !campos.has(c));
  if (faltando.length > 0) {
    problemas.push({
      gravidade: "erro",
      mensagem: `Faltam as colunas: ${faltando.map((c) => CABECALHOS_MODELO[c]).join(", ")}. Use o modelo.`,
    });
  }
  const ignorados = cabecalhosIgnorados(cabecalhos, SINONIMOS_PORTARIAS);
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

  const primeiraLinhaDoNumero = new Map<string, number | undefined>();
  let comObservacoes = false;

  preenchidas.forEach((bruta, indice) => {
    const v = mapearColunas(bruta.valores, SINONIMOS_PORTARIAS);
    const onde = bruta.numeroLinha ? `Linha ${bruta.numeroLinha}` : `Linha ${indice + 2}`;
    const erro = (mensagem: string) => problemas.push({ gravidade: "erro", linha: indice, mensagem: `${onde}: ${mensagem}` });
    const aviso = (mensagem: string) => problemas.push({ gravidade: "aviso", linha: indice, mensagem: `${onde}: ${mensagem}` });
    const texto = (campo: CampoPlanilha) => paraTexto(v[campo]) || null;
    const data = (campo: CampoPlanilha): string | null => {
      const iso = paraDataIso(v[campo]);
      if (iso === undefined) {
        erro(`"${CABECALHOS_MODELO[campo]}" não é uma data válida (use dd/mm/aaaa).`);
        return null;
      }
      return iso;
    };

    // Número
    const numeroBruto = v.numero;
    const numeroTexto = paraTexto(numeroBruto);
    let numero = "";
    if (!numeroTexto) {
      erro("o número da portaria é obrigatório.");
    } else if (/pendente/i.test(numeroTexto)) {
      erro(`"${numeroTexto}" é uma pendência sem número; só se importa portaria já numerada.`);
    } else {
      const normalizado = typeof numeroBruto === "number" ? null : normalizarNumeroPortaria(numeroTexto);
      if (!normalizado) {
        erro(`número "${numeroTexto}" fora do formato NNN/AAAA (ex.: 001/2026). Formate a coluna como texto no Excel.`);
      } else {
        numero = normalizado;
        if (primeiraLinhaDoNumero.has(normalizado)) {
          const anterior = primeiraLinhaDoNumero.get(normalizado);
          erro(`a portaria ${normalizado} aparece repetida${anterior ? ` (já está na linha ${anterior})` : ""}.`);
        } else {
          primeiraLinhaDoNumero.set(normalizado, bruta.numeroLinha);
        }
      }
    }

    // Data da portaria
    const dataDocumento = data("data_documento");
    if (paraTexto(v.data_documento) === "") erro("a data da portaria é obrigatória.");
    else if (dataDocumento && dataDocumento > hoje) erro("a data da portaria está no futuro.");

    // Categoria
    const categoriaTexto = paraTexto(v.categoria);
    let categoria: CategoriaPortaria | null = null;
    if (!categoriaTexto) {
      erro("a categoria é obrigatória.");
    } else {
      categoria = CATEGORIA_POR_TEXTO.get(normalizarCabecalho(categoriaTexto)) ?? null;
      if (!categoria) {
        erro(`categoria "${categoriaTexto}" desconhecida. Use: ${CATEGORIAS_PORTARIA.map((c) => c.label).join(", ")}.`);
      }
    }

    // Textos livres
    const ementa = texto("ementa");
    if (ementa && ementa.length > LIMITE_EMENTA) erro(`a ementa passa de ${LIMITE_EMENTA} caracteres.`);
    const processoSei = texto("processo_sei");
    if (processoSei && processoSei.length > LIMITE_PROCESSO) erro(`o processo SEI passa de ${LIMITE_PROCESSO} caracteres.`);
    const observacoes = texto("observacoes");
    if (observacoes) comObservacoes = true;

    // DOE
    const doeNumero = texto("doe_numero");
    const doeData = data("doe_data");
    const temDataDoe = paraTexto(v.doe_data) !== "";
    if (!!doeNumero !== temDataDoe) erro("informe o Nº DOE e a Data DOE juntos.");
    if (doeData && dataDocumento && doeData < dataDocumento) erro("a Data DOE é anterior à data da portaria.");

    // Situação
    const situacaoTexto = paraTexto(v.situacao);
    let status: StatusImportavel | null = null;
    if (!situacaoTexto) {
      status = doeNumero && temDataDoe ? "publicado" : "aguardando_assinatura";
    } else {
      const chave = normalizarCabecalho(situacaoTexto);
      if (chave.startsWith("revogad")) {
        erro("portaria revogada não se importa; registre a revogação na tela da portaria.");
      } else {
        status = Object.prototype.hasOwnProperty.call(STATUS_POR_TEXTO, chave) ? STATUS_POR_TEXTO[chave] : null;
        if (!status) {
          erro(
            `situação "${situacaoTexto}" desconhecida. Use: ${Object.values(ROTULO_STATUS_IMPORTAVEL).join(", ")}.`,
          );
        }
      }
    }

    // Assinatura
    const assinadoPor = texto("assinado_por");
    const dataAssinatura = data("data_assinatura");
    if (status === "assinado" && (!assinadoPor || !paraTexto(v.data_assinatura))) {
      erro("situação Assinada exige \"Assinado por\" e \"Data da assinatura\".");
    }
    if ((status === "publicado" || status === "vigente") && !(doeNumero && temDataDoe)) {
      erro(`situação ${ROTULO_STATUS_IMPORTAVEL[status]} exige o Nº DOE e a Data DOE.`);
    }

    // Vigência
    const inicio = data("data_vigencia_inicio");
    const fim = data("data_vigencia_fim");
    if (status === "vigente" && !paraTexto(v.data_vigencia_inicio)) erro("situação Vigente exige o início da vigência.");
    if (inicio && fim && fim < inicio) erro("o fim da vigência é anterior ao início.");

    // Matrículas
    const matriculas: string[] = [];
    for (const parte of paraTexto(v.matriculas).split(";")) {
      const m = parte.trim();
      if (!m) continue;
      if (/[,\s]/.test(m)) {
        erro(`matrícula "${m}" com vírgula ou espaço; separe as matrículas por ";".`);
        continue;
      }
      if (!matriculas.includes(m)) matriculas.push(m);
    }
    if (categoria && CATEGORIAS_PESSOAL.has(categoria) && matriculas.length === 0) {
      aviso("portaria de pessoal sem matrícula; nenhum servidor será vinculado.");
    }

    linhas.push({
      indice,
      linhaPlanilha: bruta.numeroLinha,
      numero,
      data_documento: dataDocumento,
      categoria,
      ementa,
      processo_sei: processoSei,
      status,
      status_informado: situacaoTexto !== "",
      assinado_por: assinadoPor,
      data_assinatura: dataAssinatura,
      doe_numero: doeNumero,
      doe_data: doeData,
      data_vigencia_inicio: inicio,
      data_vigencia_fim: fim,
      matriculas,
      observacoes,
    });
  });

  if (comObservacoes) {
    problemas.push({
      gravidade: "aviso",
      mensagem: "Há observações preenchidas: confira que não têm CPF, endereço ou outro dado pessoal.",
    });
  }

  const cabecalho: Record<string, string> = { Portarias: String(linhas.length) };
  return { linhas, problemas, cabecalho, parametros: {} };
}

/** Só os campos do contrato (sem `linhaPlanilha`), na ordem do envio. */
export function paraContrato(linha: LinhaPortariaPlanilha): LinhaPortariaContrato {
  const { linhaPlanilha: _linhaPlanilha, ...contrato } = linha;
  return contrato;
}
