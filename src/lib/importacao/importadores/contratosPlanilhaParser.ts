/**
 * PARSER: planilha dos contratos vigentes → linhas da RPC `contratos_importar_planilha`
 *
 * Função pura (sem arquivo nem banco), testada em contratosPlanilhaParser.test.ts. Uma linha por contrato, na
 * primeira aba (cabeçalho na linha 1, como no modelo). Traduz tipo, situação e "sim/não" para os valores do sistema;
 * rótulo desconhecido é erro da linha, não palpite. A RPC confere tudo de novo e só completa contrato que já existe.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (C1, importar planilha)
 */

import { SITUACOES_CONTRATO, TIPOS_CONTRATO } from "@/types/contratos";
import {
  cabecalhosIgnorados,
  campoDoCabecalho,
  linhaVazia,
  mapearColunas,
  paraDataIso,
  paraTexto,
  type PlanilhaLida,
} from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";
import { paraValor } from "./processosPlanilhaParser";

export type CampoPlanilha =
  | "numero"
  | "ano"
  | "processo_sei"
  | "numero_pncp"
  | "documento"
  | "razao_social"
  | "objeto"
  | "objeto_resumido"
  | "tipo_contrato"
  | "fundamento_legal"
  | "valor_inicial"
  | "valor_atual"
  | "data_assinatura"
  | "data_inicio"
  | "data_fim"
  | "situacao"
  | "setor_sigla"
  | "natureza_despesa"
  | "prorrogavel"
  | "prazo_maximo_meses"
  | "gestor_matricula"
  | "fiscal_tecnico_matricula"
  | "fiscal_administrativo_matricula"
  | "portaria_numero"
  | "portaria_data"
  | "data_publicacao_doe"
  | "numero_doe";

/** Cabeçalho de cada coluna no modelo, na ordem em que sai. */
export const CABECALHOS_MODELO: Record<CampoPlanilha, string> = {
  numero: "Nº do contrato",
  ano: "Ano",
  processo_sei: "Processo SEI",
  numero_pncp: "Nº no PNCP",
  documento: "CNPJ ou CPF do contratado",
  razao_social: "Razão social do contratado",
  objeto: "Objeto",
  objeto_resumido: "Objeto (resumo)",
  tipo_contrato: "Tipo",
  fundamento_legal: "Modalidade e fundamento",
  valor_inicial: "Valor inicial (R$)",
  valor_atual: "Valor atual (R$)",
  data_assinatura: "Data da assinatura",
  data_inicio: "Início da vigência",
  data_fim: "Fim da vigência",
  situacao: "Situação",
  setor_sigla: "Setor que pediu (sigla)",
  natureza_despesa: "Natureza da despesa",
  prorrogavel: "Prorrogável (sim ou não)",
  prazo_maximo_meses: "Prazo máximo (meses)",
  gestor_matricula: "Matrícula do gestor",
  fiscal_tecnico_matricula: "Matrícula do fiscal técnico",
  fiscal_administrativo_matricula: "Matrícula do fiscal administrativo",
  portaria_numero: "Portaria de designação (nº)",
  portaria_data: "Data da portaria",
  data_publicacao_doe: "Publicação no DOE (data)",
  numero_doe: "Nº do DOE",
};

/** Cabeçalhos aceitos (já normalizados por `normalizarCabecalho`) → campo. */
export const SINONIMOS_CONTRATOS: Record<string, CampoPlanilha> = {
  n_do_contrato: "numero",
  numero_do_contrato: "numero",
  contrato: "numero",
  numero: "numero",
  ano: "ano",
  processo_sei: "processo_sei",
  n_do_processo_sei: "processo_sei",
  numero_sei: "processo_sei",
  n_no_pncp: "numero_pncp",
  numero_pncp: "numero_pncp",
  pncp: "numero_pncp",
  cnpj_ou_cpf_do_contratado: "documento",
  cnpj_cpf: "documento",
  cnpj: "documento",
  cpf_cnpj: "documento",
  razao_social_do_contratado: "razao_social",
  razao_social: "razao_social",
  contratado: "razao_social",
  objeto: "objeto",
  objeto_resumo: "objeto_resumido",
  objeto_resumido: "objeto_resumido",
  tipo: "tipo_contrato",
  tipo_de_contrato: "tipo_contrato",
  modalidade_e_fundamento: "fundamento_legal",
  fundamento_legal: "fundamento_legal",
  modalidade: "fundamento_legal",
  valor_inicial_r: "valor_inicial",
  valor_inicial: "valor_inicial",
  valor_atual_r: "valor_atual",
  valor_atual: "valor_atual",
  data_da_assinatura: "data_assinatura",
  assinatura: "data_assinatura",
  inicio_da_vigencia: "data_inicio",
  inicio: "data_inicio",
  fim_da_vigencia: "data_fim",
  fim: "data_fim",
  vigencia_ate: "data_fim",
  situacao: "situacao",
  status: "situacao",
  setor_que_pediu_sigla: "setor_sigla",
  setor_demandante: "setor_sigla",
  setor: "setor_sigla",
  natureza_da_despesa: "natureza_despesa",
  natureza: "natureza_despesa",
  prorrogavel_sim_ou_nao: "prorrogavel",
  prorrogavel: "prorrogavel",
  prazo_maximo_meses: "prazo_maximo_meses",
  matricula_do_gestor: "gestor_matricula",
  matricula_do_fiscal_tecnico: "fiscal_tecnico_matricula",
  matricula_do_fiscal: "fiscal_tecnico_matricula",
  matricula_do_fiscal_administrativo: "fiscal_administrativo_matricula",
  portaria_de_designacao_n: "portaria_numero",
  portaria_de_designacao: "portaria_numero",
  portaria: "portaria_numero",
  data_da_portaria: "portaria_data",
  publicacao_no_doe_data: "data_publicacao_doe",
  data_do_doe: "data_publicacao_doe",
  n_do_doe: "numero_doe",
  numero_do_doe: "numero_doe",
};

/** Linha no formato do contrato front ↔ RPC (datas AAAA-MM-DD; vazio = null). */
export interface LinhaContratoContrato {
  indice: number;
  numero: string;
  ano: number | null;
  processo_sei: string | null;
  numero_pncp: string | null;
  documento: string | null;
  razao_social: string | null;
  objeto: string | null;
  objeto_resumido: string | null;
  tipo_contrato: string | null;
  fundamento_legal: string | null;
  valor_inicial: number | null;
  valor_atual: number | null;
  data_assinatura: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  situacao: string | null;
  setor_sigla: string | null;
  natureza_despesa: string | null;
  prorrogavel: boolean | null;
  prazo_maximo_meses: number | null;
  gestor_matricula: string | null;
  fiscal_tecnico_matricula: string | null;
  fiscal_administrativo_matricula: string | null;
  portaria_numero: string | null;
  portaria_data: string | null;
  data_publicacao_doe: string | null;
  numero_doe: string | null;
}

/** Linha lida: contrato + número da linha no Excel (só para mensagens; não vai ao banco). */
export interface LinhaContratoPlanilha extends LinhaContratoContrato {
  linhaPlanilha?: number;
}

const simplificar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Rótulo ou código de uma lista do sistema → código (sem acento nem caixa). Vazio = null; desconhecido = undefined. */
function daLista(lista: readonly { value: string; label: string }[], texto: string): string | null | undefined {
  const t = simplificar(texto);
  if (!t) return null;
  return lista.find((x) => simplificar(x.label) === t || x.value === t.replace(/ /g, "_"))?.value;
}

const SIM = new Set(["sim", "s", "x", "true", "verdadeiro", "1"]);
const NAO = new Set(["nao", "n", "false", "falso", "0"]);

export function paraSimNao(texto: string): boolean | null | undefined {
  const t = simplificar(texto);
  if (!t) return null;
  if (SIM.has(t)) return true;
  if (NAO.has(t)) return false;
  return undefined;
}

/** "01/2026" na coluna do número vira número "01" e ano 2026 (com o ano vazio ou igual ao da coluna Ano). */
export function separarNumeroAno(numero: string, ano: string): { numero: string; ano: number | null } {
  const n = numero.replace(/\s+/g, "");
  const m = n.match(/^(.+)\/(\d{4})$/);
  if (!ano.trim() && m) return { numero: m[1], ano: Number(m[2]) };
  const a = ano.trim() ? Number(ano.trim()) : null;
  if (m && a === Number(m[2])) return { numero: m[1], ano: a };
  return { numero: n, ano: a !== null && Number.isInteger(a) ? a : null };
}

/** Chave do contrato na planilha: "1" e "01" são o mesmo (como na RPC, zeros à esquerda não contam). */
export const chaveContrato = (numero: string, ano: number | null) => `${numero.toLowerCase().replace(/^0+/, "")}/${ano}`;

// Tamanho máximo de cada coluna no banco (contratos e fornecedores)
const LIMITES: Partial<Record<CampoPlanilha, [number, string]>> = {
  numero: [30, "nº do contrato"],
  processo_sei: [60, "processo SEI"],
  numero_pncp: [80, "nº no PNCP"],
  razao_social: [255, "razão social"],
  objeto_resumido: [500, "objeto (resumo)"],
  fundamento_legal: [500, "modalidade e fundamento"],
  natureza_despesa: [30, "natureza da despesa"],
  portaria_numero: [60, "portaria"],
  numero_doe: [20, "nº do DOE"],
};

/** Interpreta as linhas lidas da primeira aba (ver `lerPrimeiraAba`). */
export function interpretarContratosPlanilha({ cabecalhos, linhas: brutas }: PlanilhaLida): ResultadoLeitura<LinhaContratoPlanilha> {
  const problemas: ProblemaLeitura[] = [];
  const linhas: LinhaContratoPlanilha[] = [];
  const resultado = { linhas, problemas, cabecalho: {}, parametros: {} };

  if (!cabecalhos.some((c) => campoDoCabecalho(c, SINONIMOS_CONTRATOS) === "numero")) {
    problemas.push({ gravidade: "erro", mensagem: 'Não achei a coluna "Nº do contrato". Use o modelo do assistente.' });
    return resultado;
  }
  const ignorados = cabecalhosIgnorados(cabecalhos, SINONIMOS_CONTRATOS);
  if (ignorados.length) {
    problemas.push({ gravidade: "aviso", mensagem: `Colunas ignoradas: ${ignorados.join(", ")}.` });
  }

  const vistos = new Set<string>();
  for (const bruta of brutas) {
    if (linhaVazia(bruta.valores)) continue;
    const c = mapearColunas(bruta.valores, SINONIMOS_CONTRATOS);
    const t = (campo: CampoPlanilha) => paraTexto(c[campo]).replace(/\s+/g, " ").trim();
    const indice = linhas.length;
    const ref = bruta.numeroLinha ? `Linha ${bruta.numeroLinha}` : `Linha ${indice + 1}`;
    const erro = (mensagem: string) => problemas.push({ gravidade: "erro", mensagem: `${ref}: ${mensagem}`, linha: indice });
    const aviso = (mensagem: string) => problemas.push({ gravidade: "aviso", mensagem: `${ref}: ${mensagem}`, linha: indice });

    const { numero, ano } = separarNumeroAno(t("numero"), t("ano"));
    if (!numero) erro("sem o nº do contrato.");
    if (ano === null || ano < 1990 || ano > 2100) erro(`ano "${t("ano")}" inválido.`);
    const chave = chaveContrato(numero, ano);
    if (numero && vistos.has(chave)) erro(`o contrato ${numero}/${ano} aparece duas vezes.`);
    vistos.add(chave);

    const data = (campo: CampoPlanilha, rotulo: string) => {
      const d = paraDataIso(c[campo]);
      if (d === undefined) erro(`${rotulo} "${t(campo)}" não é uma data.`);
      return d ?? null;
    };
    const valor = (campo: CampoPlanilha, rotulo: string) => {
      if (!t(campo)) return null;
      const v = paraValor(c[campo]);
      if (v === null) erro(`${rotulo} "${t(campo)}" não é um valor.`);
      return v;
    };

    for (const [campo, [max, rotulo]] of Object.entries(LIMITES) as [CampoPlanilha, [number, string]][]) {
      const v = campo === "numero" ? numero : t(campo);
      if (v.length > max) erro(`${rotulo} com mais de ${max} caracteres.`);
    }

    const documento = t("documento") || null;
    const digitos = (documento ?? "").replace(/\D/g, "");
    if (documento && digitos.length !== 11 && digitos.length !== 14) erro(`CNPJ ou CPF "${documento}" inválido.`);
    if (!documento) aviso("sem CNPJ ou CPF: só completa contrato que já está cadastrado.");

    const tipo = daLista(TIPOS_CONTRATO, t("tipo_contrato"));
    if (tipo === undefined) erro(`tipo "${t("tipo_contrato")}" desconhecido.`);
    const situacao = daLista(SITUACOES_CONTRATO, t("situacao"));
    if (situacao === undefined) erro(`situação "${t("situacao")}" desconhecida.`);
    const prorrogavel = paraSimNao(t("prorrogavel"));
    if (prorrogavel === undefined) erro(`"Prorrogável" deve ser sim ou não (veio "${t("prorrogavel")}").`);
    const prazoTexto = t("prazo_maximo_meses");
    const prazo = prazoTexto ? Number(prazoTexto) : null;
    if (prazo !== null && (!Number.isInteger(prazo) || prazo < 1 || prazo > 600)) erro(`prazo máximo "${prazoTexto}" inválido.`);

    const inicio = data("data_inicio", "início da vigência");
    const fim = data("data_fim", "fim da vigência");
    if (inicio && fim && fim < inicio) erro("o fim da vigência vem antes do início.");
    const valorInicial = valor("valor_inicial", "valor inicial");
    const valorAtual = valor("valor_atual", "valor atual");
    const matricula = (campo: CampoPlanilha) => paraTexto(c[campo]).replace(/\s+/g, "") || null;

    linhas.push({
      indice,
      linhaPlanilha: bruta.numeroLinha,
      numero,
      ano,
      processo_sei: t("processo_sei") || null,
      numero_pncp: t("numero_pncp") || null,
      documento,
      razao_social: t("razao_social") || null,
      objeto: t("objeto") || t("objeto_resumido") || null,
      objeto_resumido: t("objeto_resumido") || null,
      tipo_contrato: tipo ?? null,
      fundamento_legal: t("fundamento_legal") || null,
      valor_inicial: valorInicial,
      valor_atual: valorAtual,
      data_assinatura: data("data_assinatura", "data da assinatura"),
      data_inicio: inicio,
      data_fim: fim,
      situacao: situacao ?? null,
      setor_sigla: t("setor_sigla") || null,
      natureza_despesa: t("natureza_despesa") || null,
      prorrogavel: prorrogavel ?? null,
      prazo_maximo_meses: prazo !== null && Number.isInteger(prazo) ? prazo : null,
      gestor_matricula: matricula("gestor_matricula"),
      fiscal_tecnico_matricula: matricula("fiscal_tecnico_matricula"),
      fiscal_administrativo_matricula: matricula("fiscal_administrativo_matricula"),
      portaria_numero: t("portaria_numero") || null,
      portaria_data: data("portaria_data", "data da portaria"),
      data_publicacao_doe: data("data_publicacao_doe", "data do DOE"),
      numero_doe: t("numero_doe") || null,
    });
  }
  if (!linhas.length && !problemas.some((p) => p.gravidade === "erro")) {
    problemas.push({ gravidade: "erro", mensagem: "A planilha não tem nenhum contrato preenchido." });
  }
  return resultado;
}

/** Linha para a RPC (sem o número da linha no Excel). */
export function paraContrato({ linhaPlanilha: _l, ...linha }: LinhaContratoPlanilha): LinhaContratoContrato {
  return linha;
}
