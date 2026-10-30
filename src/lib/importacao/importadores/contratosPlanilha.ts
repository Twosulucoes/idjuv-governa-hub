/**
 * IMPORTADOR: planilha dos contratos vigentes → contratos + contrato_responsaveis (+ fornecedores novos)
 *
 * Uma linha por contrato, no modelo baixado pelo próprio assistente. A RPC `contratos_importar_planilha` confere o
 * módulo e a permissão `contratos.criar`, cadastra o contratado que falta (pelo CNPJ/CPF), designa gestor e fiscais
 * pela matrícula e grava tudo ou nada. Contrato que já existe (nº + ano) só tem os campos vazios completados, o que
 * exige também `contratos.editar`; designar gestor e fiscais pela matrícula basta `contratos.criar`. Nada é apagado.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (C1)
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/formatters";
import { SITUACOES_CONTRATO, TIPOS_CONTRATO } from "@/types/contratos";
import { baixarModeloPlanilha, lerPrimeiraAba } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import {
  CABECALHOS_MODELO,
  interpretarContratosPlanilha,
  paraContrato,
  type CampoPlanilha,
  type LinhaContratoPlanilha,
} from "./contratosPlanilhaParser";

const NOME_MODELO = "modelo_contratos.xlsx";
const dataBR = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");

const CAMPOS_MODELO = Object.keys(CABECALHOS_MODELO) as CampoPlanilha[];
const exemplo = (valores: Partial<Record<CampoPlanilha, string>>) => CAMPOS_MODELO.map((campo) => valores[campo] ?? "");

export const importadorContratosPlanilha: Importador<LinhaContratoPlanilha> = {
  id: "contratos_planilha",
  titulo: "Contratos (planilha)",
  descricao: "Carga dos contratos vigentes: número, contratado, objeto, valores, vigência, setor, gestor e fiscais.",
  modulo: "contratos",
  permissao: "contratos.criar",
  local: { rota: "/contratos/lista?importador=contratos_planilha", caminho: "Contratos → Contratos" },
  aceita: ".xlsx,.xls,.csv",
  instrucoes:
    'Use o modelo abaixo (aba "Contratos"; exemplos e listas na aba "Como preencher"). O contratado que não estiver ' +
    "cadastrado entra pelo CNPJ ou CPF; gestor e fiscais, pela matrícula. Contrato que já existe só tem os campos " +
    "vazios completados; nada é apagado.",
  colunas: [
    { id: "contrato", rotulo: "Contrato", valor: (l) => `${l.numero}/${l.ano ?? "?"}` },
    { id: "contratado", rotulo: "Contratado", valor: (l) => l.razao_social ?? l.documento ?? "" },
    { id: "objeto", rotulo: "Objeto", valor: (l) => l.objeto_resumido ?? l.objeto ?? "" },
    { id: "valor", rotulo: "Valor inicial", valor: (l) => (l.valor_inicial === null ? "" : formatCurrency(l.valor_inicial)), alinhamento: "direita" },
    { id: "vigencia", rotulo: "Vigência", valor: (l) => [dataBR(l.data_inicio), dataBR(l.data_fim)].filter(Boolean).join(" a ") },
    { id: "gestor", rotulo: "Gestor (matrícula)", valor: (l) => l.gestor_matricula ?? "" },
  ],
  rotulosCampos: {
    processo_sei: "Processo SEI",
    numero_pncp: "Nº no PNCP",
    objeto_resumido: "Objeto (resumo)",
    tipo_contrato: "Tipo",
    fundamento_legal: "Modalidade e fundamento",
    natureza_despesa: "Natureza da despesa",
    prazo_maximo_meses: "Prazo máximo (meses)",
    data_publicacao_doe: "Publicação no DOE",
    numero_doe: "Nº do DOE",
    unidade_demandante_id: "Setor que pediu",
    gestor: "Gestor",
    fiscal_tecnico: "Fiscal técnico",
    fiscal_administrativo: "Fiscal administrativo",
  },
  identificarLinha: (l) => `Linha ${l.linhaPlanilha ?? l.indice + 1} (${l.numero}/${l.ano ?? "?"})`,
  modelo: {
    nomeArquivo: NOME_MODELO,
    gerar: () =>
      baixarModeloPlanilha(NOME_MODELO, [
        {
          nome: "Contratos",
          linhas: [CAMPOS_MODELO.map((c) => CABECALHOS_MODELO[c])],
          colunasTexto: [
            CABECALHOS_MODELO.numero,
            CABECALHOS_MODELO.processo_sei,
            CABECALHOS_MODELO.documento,
            CABECALHOS_MODELO.gestor_matricula,
            CABECALHOS_MODELO.fiscal_tecnico_matricula,
            CABECALHOS_MODELO.fiscal_administrativo_matricula,
            CABECALHOS_MODELO.natureza_despesa,
          ],
        },
        {
          nome: "Como preencher",
          linhas: [
            CAMPOS_MODELO.map((c) => CABECALHOS_MODELO[c]),
            exemplo({
              numero: "01",
              ano: "2026",
              processo_sei: "17302.000123/2025.11",
              documento: "00.000.000/0001-91",
              razao_social: "Empresa Exemplo Ltda",
              objeto: "Prestação de serviços contínuos de limpeza e conservação",
              objeto_resumido: "Limpeza e conservação",
              tipo_contrato: "Serviço contínuo",
              fundamento_legal: "Pregão eletrônico 05/2025, Lei 14.133/2021",
              valor_inicial: "120000,00",
              data_assinatura: "02/01/2026",
              data_inicio: "02/01/2026",
              data_fim: "01/01/2027",
              situacao: "Vigente",
              setor_sigla: "DIRAF",
              natureza_despesa: "3.3.90.37",
              prorrogavel: "Sim",
              prazo_maximo_meses: "120",
              gestor_matricula: "12345",
              fiscal_tecnico_matricula: "67890",
              portaria_numero: "Portaria 10/2026",
              portaria_data: "05/01/2026",
            }),
            [],
            ["Tipo (use um destes)", "Situação (use uma destas)"],
            ...Array.from({ length: Math.max(TIPOS_CONTRATO.length, SITUACOES_CONTRATO.length) }, (_, i) => [
              TIPOS_CONTRATO[i]?.label ?? "",
              SITUACOES_CONTRATO[i]?.label ?? "",
            ]),
          ],
        },
      ]),
  },

  async ler(arquivo) {
    return interpretarContratosPlanilha(await lerPrimeiraAba(arquivo));
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("contratos_importar_planilha", {
      p_linhas: leitura.linhas.map(paraContrato) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useContratos.ts e do painel do módulo
  invalidar: [["contratos"], ["contrato"], ["contratos-dashboard-stats"]],
};
