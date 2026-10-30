/**
 * IMPORTADOR: planilha de acompanhamento dos processos de contratação → processos_licitatorios + processo_andamentos
 *
 * Abas "Processos" (uma linha por processo) e "Andamento" (uma linha por movimentação no SEI). A RPC
 * `importar_processos_planilha` confere o módulo `compras` e a permissão `compras.processos.editar`, cria o processo
 * novo, só completa campo vazio do que já existe e acrescenta as movimentações que faltam (reimportar não duplica).
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§6)
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { ETAPAS_PROCESSO, FORMAS_CONTRATACAO, rotuloEtapa, rotuloForma } from "@/types/processos";
import { formatCurrency } from "@/lib/formatters";
import { baixarModeloPlanilha, lerAbas } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import {
  ABA_ANDAMENTO,
  ABA_PROCESSOS,
  interpretarProcessosPlanilha,
  paraContrato,
  type LinhaProcessoPlanilha,
} from "./processosPlanilhaParser";

const dataBR = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");

const CABECALHO_PROCESSOS = [
  "Nº do processo SEI", "Ano", "Objeto (resumo)", "Forma de contratação", "Fase atual", "Setor atual",
  "Situação atual (detalhe)", "Data da última atualização", "Valor estimado (R$)", "Observação do valor", "Objeto completo",
];
const CABECALHO_ANDAMENTO = ["Nº do processo SEI", "Data", "Fase", "Setor", "Situação (texto livre)"];

export const importadorProcessosPlanilha: Importador<LinhaProcessoPlanilha> = {
  id: "processos_planilha",
  titulo: "Processos de contratação (planilha)",
  descricao: "Carga da planilha de acompanhamento dos processos: nº SEI, objeto, forma, fase, setor e andamento.",
  modulo: "compras",
  permissao: "compras.processos.editar",
  local: { rota: "/compras/processos?importador=processos_planilha", caminho: "Compras → Processos de contratação" },
  aceita: ".xlsx,.xls",
  instrucoes:
    'Use a planilha com as abas "Processos" e "Andamento" (o modelo abaixo tem as colunas e as listas de fase e de forma). ' +
    "Processo que já existe só tem os campos vazios completados; movimentação repetida não entra de novo.",
  colunas: [
    { id: "numero", rotulo: "Processo SEI", valor: (l) => l.numero_processo },
    { id: "objeto", rotulo: "Objeto", valor: (l) => l.objeto_resumido ?? l.objeto },
    { id: "forma", rotulo: "Forma", valor: (l) => rotuloForma(l.modalidade) },
    { id: "etapa", rotulo: "Fase", valor: (l) => rotuloEtapa(l.etapa) },
    { id: "setor", rotulo: "Setor", valor: (l) => l.setor_atual ?? "" },
    { id: "data", rotulo: "Atualizado em", valor: (l) => dataBR(l.atualizado_em) },
    { id: "valor", rotulo: "Valor estimado", valor: (l) => (l.valor_estimado === null ? "" : formatCurrency(l.valor_estimado)), alinhamento: "direita" },
    { id: "andamentos", rotulo: "Movimentações", valor: (l) => String(l.andamentos.length), alinhamento: "direita" },
  ],
  rotulosCampos: {
    objeto_resumido: "Objeto (resumo)",
    modalidade: "Forma de contratação",
    valor_estimado: "Valor estimado",
    valor_estimado_obs: "Observação do valor",
    setor_atual: "Setor atual",
    andamentos: "Andamento",
  },
  identificarLinha: (l) => (l.linhaPlanilha ? `Linha ${l.linhaPlanilha} (${l.numero_processo})` : l.numero_processo),
  modelo: {
    nomeArquivo: "modelo_processos_contratacao.xlsx",
    gerar: () =>
      baixarModeloPlanilha("modelo_processos_contratacao.xlsx", [
        { nome: ABA_PROCESSOS, linhas: [CABECALHO_PROCESSOS], colunasTexto: ["Nº do processo SEI"] },
        { nome: ABA_ANDAMENTO, linhas: [CABECALHO_ANDAMENTO], colunasTexto: ["Nº do processo SEI"] },
        {
          nome: "Listas",
          linhas: [
            ["Fases", "Formas de contratação"],
            ...ETAPAS_PROCESSO.map((e, i) => [e.label, [...FORMAS_CONTRATACAO.map((f) => f.label), "A definir"][i] ?? ""]),
          ],
        },
      ]),
  },

  async ler(arquivo) {
    return interpretarProcessosPlanilha(await lerAbas(arquivo));
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_processos_planilha", {
      p_linhas: leitura.linhas.map(paraContrato) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useProcessosContratacao.ts
  invalidar: [["processos-contratacao"], ["processo-contratacao"], ["processo-andamentos"]],
};
