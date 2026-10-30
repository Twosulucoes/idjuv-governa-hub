/**
 * IMPORTADOR: planilha de portarias (XLSX, XLS ou CSV) → documentos (portarias)
 *
 * Uma linha por portaria, no modelo baixado pelo próprio assistente. A RPC `importar_portarias_planilha`
 * confere o módulo `gabinete` e a permissão `gabinete.portarias.importar`, cruza as matrículas, roda os
 * gatilhos de validação da portaria e grava tudo ou nada. Nada é apagado e o ciclo de portaria já
 * existente não é percorrido (só campos vazios são preenchidos e servidores somados).
 * Spec: docs/superpowers/specs/2026-10-15-importacao-portarias-planilha-design.md
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { baixarModeloPlanilha, lerPrimeiraAba, type AbaModelo } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import {
  CABECALHOS_MODELO,
  CATEGORIAS_PORTARIA,
  interpretarPortariasPlanilha,
  paraContrato,
  ROTULO_STATUS_IMPORTAVEL,
  type CampoPlanilha,
  type LinhaPortariaPlanilha,
} from "./portariasPlanilhaParser";

const NOME_MODELO = "modelo_portarias.xlsx";

const dataBR = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");
const rotuloCategoria = (c: string | null) => CATEGORIAS_PORTARIA.find((x) => x.value === c)?.label ?? "";

const CAMPOS_MODELO = Object.keys(CABECALHOS_MODELO) as CampoPlanilha[];

/** Linha de exemplo do modelo (dados fictícios), na ordem das colunas. */
const exemplo = (valores: Partial<Record<CampoPlanilha, string>>) => CAMPOS_MODELO.map((campo) => valores[campo] ?? "");

/** Exemplos ficam na aba "Como preencher": a aba "Portarias" é importada e sai só com o cabeçalho. */
const EXEMPLOS_MODELO = [
  exemplo({
    numero: "001/2026",
    data_documento: "10/01/2026",
    categoria: "Nomeação",
    ementa: "Nomeia servidor para cargo em comissão",
    processo_sei: "00000.000000/2026-00",
    situacao: "Publicada",
    doe_numero: "1234",
    doe_data: "12/01/2026",
    matriculas: "1001",
  }),
  exemplo({
    numero: "002/2026",
    data_documento: "15/01/2026",
    categoria: "Designação",
    situacao: "Aguardando assinatura",
    matriculas: "1002;1003",
  }),
];

/** Colunas que o Excel estragaria se ficassem no formato Geral (3/2026 vira data; 0123 perde o zero). */
const COLUNAS_TEXTO = [CABECALHOS_MODELO.numero, CABECALHOS_MODELO.matriculas];

const REGRAS_MODELO: Record<CampoPlanilha, string> = {
  numero: "Obrigatório. NNN/AAAA (ex.: 001/2026). Portaria PENDENTE não entra.",
  data_documento: "Obrigatória. dd/mm/aaaa; não pode ser futura.",
  categoria: `Obrigatória. ${CATEGORIAS_PORTARIA.map((c) => c.label).join(", ")}.`,
  ementa: "Opcional, até 2000 caracteres.",
  processo_sei: "Opcional, até 60 caracteres.",
  situacao: `Opcional: ${Object.values(ROTULO_STATUS_IMPORTAVEL).join(", ")}. Vazia: Publicada se houver DOE.`,
  assinado_por: "Obrigatório se a situação for Assinada.",
  data_assinatura: "Obrigatória se a situação for Assinada.",
  doe_numero: "Junto com a Data DOE; obrigatório se Publicada ou Vigente.",
  doe_data: "Junto com o Nº DOE; não pode ser anterior à data da portaria.",
  data_vigencia_inicio: "Obrigatório se Vigente.",
  data_vigencia_fim: "Opcional; não pode ser anterior ao início.",
  matriculas: "Opcional. Várias separadas por ; (ex.: 1001;1002).",
  observacoes: "Opcional. Não coloque CPF nem outro dado pessoal.",
};

/** Abas do modelo (separado do download para o teste conferir o conteúdo). */
export function abasModeloPortarias(): AbaModelo[] {
  const cabecalhos = CAMPOS_MODELO.map((campo) => CABECALHOS_MODELO[campo]);
  return [
    { nome: "Portarias", linhas: [cabecalhos], colunasTexto: COLUNAS_TEXTO },
    {
      nome: "Como preencher",
      linhas: [
        ["Coluna", "Regra"],
        ...CAMPOS_MODELO.map((campo) => [CABECALHOS_MODELO[campo], REGRAS_MODELO[campo]]),
        [],
        ["Exemplos (dados fictícios; copie para a aba Portarias só o que for real)"],
        cabecalhos,
        ...EXEMPLOS_MODELO,
      ],
    },
  ];
}

const gerarModelo = () => baixarModeloPlanilha(NOME_MODELO, abasModeloPortarias());

export const importadorPortariasPlanilha: Importador<LinhaPortariaPlanilha> = {
  id: "portarias_planilha",
  titulo: "Portarias (planilha)",
  descricao: "Registra portarias já feitas no SEI a partir de uma planilha, uma linha por portaria.",
  modulo: "gabinete",
  permissao: "gabinete.portarias.importar",
  local: { rota: "/gabinete/portarias?importador=portarias_planilha", caminho: "Gabinete → Central de Portarias" },
  aceita: ".xlsx,.xls,.csv",
  instrucoes:
    "Baixe o modelo e preencha uma linha por portaria. Várias matrículas na mesma portaria vão separadas por \";\". " +
    "O PDF da portaria se anexa depois, na própria portaria. Portarias que já existem só ganham o que estiver " +
    "faltando; nada é apagado.",
  modelo: { nomeArquivo: NOME_MODELO, gerar: gerarModelo },
  colunas: [
    { id: "numero", rotulo: "Número", valor: (l) => l.numero || "—" },
    { id: "data", rotulo: "Data", valor: (l) => dataBR(l.data_documento) },
    { id: "categoria", rotulo: "Categoria", valor: (l) => rotuloCategoria(l.categoria) },
    { id: "situacao", rotulo: "Situação", valor: (l) => (l.status ? ROTULO_STATUS_IMPORTAVEL[l.status] : "") },
    { id: "doe", rotulo: "DOE", valor: (l) => (l.doe_numero ? `${l.doe_numero} de ${dataBR(l.doe_data)}` : "") },
    { id: "matriculas", rotulo: "Matrículas", valor: (l) => l.matriculas.join("; ") },
    { id: "ementa", rotulo: "Ementa", valor: (l) => (l.ementa && l.ementa.length > 60 ? `${l.ementa.slice(0, 60)}…` : l.ementa ?? "") },
  ],
  rotulosCampos: {
    numero: "Número",
    data_documento: "Data",
    categoria: "Categoria",
    status: "Situação",
    assinado_por: "Assinado por",
    data_assinatura: "Data da assinatura",
    processo_sei: "Processo SEI",
    ementa: "Ementa",
    titulo: "Título",
    doe_numero: "Nº DOE",
    doe_data: "Data DOE",
    data_publicacao: "Data DOE",
    data_vigencia_inicio: "Início da vigência",
    data_vigencia_fim: "Fim da vigência",
    servidores_ids: "Servidores",
  },
  identificarLinha: (l) => (l.linhaPlanilha ? `Linha ${l.linhaPlanilha}${l.numero ? ` (${l.numero})` : ""}` : l.numero),

  async ler(arquivo) {
    const planilha = await lerPrimeiraAba(arquivo);
    return interpretarPortariasPlanilha(planilha.cabecalhos, planilha.linhas);
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_portarias_planilha", {
      p_linhas: leitura.linhas.map(paraContrato) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/usePortarias.ts (o prefixo ['portarias'] cobre lista e pendências; 'portarias-servidor'
  // é a seção de portarias da ficha do servidor) e a lista de portarias para vincular ao ato (useGestaoLotacao)
  invalidar: [["portarias"], ["portaria"], ["portarias-servidor"], ["portarias-para-ato"]],
};
