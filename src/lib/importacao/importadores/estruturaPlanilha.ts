/**
 * IMPORTADOR: planilha da estrutura organizacional → estrutura_organizacional
 *
 * Primeira carga de uma instituição nova (o banco nasce sem unidades, e o quadro de vagas e a lotação dependem
 * delas). Uma linha por unidade, no modelo baixado pelo próprio assistente; a hierarquia vem pela sigla do
 * superior. A RPC `governanca_importar_estrutura` confere a permissão `governanca.estrutura.editar`, cria o que
 * falta e grava tudo ou nada. Unidade que já existe (mesma sigla, ou mesmo nome) só tem os campos vazios
 * completados; nada é apagado nem desativado (migração 20261119090000).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { LABELS_UNIDADE } from "@/types/organograma";
import { baixarModeloPlanilha, lerPrimeiraAba } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import {
  CABECALHOS_MODELO,
  interpretarEstruturaPlanilha,
  ordemDeEnvio,
  paraContrato,
  type CampoPlanilha,
  type LinhaEstruturaPlanilha,
} from "./estruturaPlanilhaParser";

const NOME_MODELO = "modelo_estrutura_organizacional.xlsx";
const CAMPOS_MODELO = Object.keys(CABECALHOS_MODELO) as CampoPlanilha[];
const exemplo = (valores: Partial<Record<CampoPlanilha, string>>) => CAMPOS_MODELO.map((campo) => valores[campo] ?? "");

/** Exemplos (instituição fictícia) ficam na aba "Como preencher": a aba "Estrutura" sai só com o cabeçalho. */
const EXEMPLOS_MODELO = [
  exemplo({ sigla: "PRES", nome: "Presidência", tipo: "Presidência", lei_numero: "1.000/2025", lei_data: "01/01/2025" }),
  exemplo({ sigla: "GAB", nome: "Chefia de Gabinete", tipo: "Assessoria", superior: "PRES" }),
  exemplo({ sigla: "DIRAF", nome: "Diretoria Administrativa e Financeira", tipo: "Diretoria", superior: "PRES" }),
  exemplo({ sigla: "DRH", nome: "Divisão de Recursos Humanos", tipo: "Divisão", superior: "DIRAF" }),
  exemplo({ sigla: "NUP", nome: "Núcleo de Pessoal", tipo: "Núcleo", superior: "DRH" }),
];

const REGRAS_MODELO: Record<CampoPlanilha, string> = {
  sigla: "Obrigatória e única na planilha, até 30 caracteres. É por ela que as outras linhas dizem a quem respondem.",
  nome: "Obrigatório, até 200 caracteres.",
  tipo: `Obrigatório: ${Object.values(LABELS_UNIDADE).join(", ")}.`,
  superior: "Sigla da unidade a que esta responde (na planilha ou já cadastrada). Vazio só para a unidade do topo.",
  descricao: "Opcional.",
  lei_numero: "Opcional (ex.: 1.000/2025).",
  lei_data: "Opcional, dd/mm/aaaa.",
};

export const importadorEstruturaPlanilha: Importador<LinhaEstruturaPlanilha> = {
  id: "estrutura_planilha",
  titulo: "Estrutura organizacional (planilha)",
  descricao: "Cadastra as unidades da instituição (presidência, assessorias, diretorias, divisões, núcleos) de uma vez.",
  modulo: "governanca",
  permissao: "governanca.estrutura.editar",
  local: { rota: "/organograma/gestao?importador=estrutura_planilha", caminho: "Governança → Gestão do organograma" },
  aceita: ".xlsx,.xls,.csv",
  instrucoes:
    'Baixe o modelo e preencha uma linha por unidade, na aba "Estrutura" (regras e exemplos na aba "Como ' +
    'preencher"). Na coluna "Responde a (sigla)" vai a sigla da unidade superior; a ordem das linhas não importa. ' +
    "Unidade que já existe (mesma sigla) só ganha o que estiver vazio; nada é apagado. Para mudar o nome ou o " +
    "superior de uma unidade cadastrada, use o botão de editar da própria unidade.",
  modelo: {
    nomeArquivo: NOME_MODELO,
    gerar: () =>
      baixarModeloPlanilha(NOME_MODELO, [
        {
          nome: "Estrutura",
          linhas: [CAMPOS_MODELO.map((c) => CABECALHOS_MODELO[c])],
          colunasTexto: [CABECALHOS_MODELO.sigla, CABECALHOS_MODELO.superior, CABECALHOS_MODELO.lei_numero],
        },
        {
          nome: "Como preencher",
          linhas: [
            ["Coluna", "Regra"],
            ...CAMPOS_MODELO.map((c) => [CABECALHOS_MODELO[c], REGRAS_MODELO[c]]),
            [],
            ["Exemplo (instituição fictícia; copie para a aba Estrutura só o que for real)"],
            CAMPOS_MODELO.map((c) => CABECALHOS_MODELO[c]),
            ...EXEMPLOS_MODELO,
          ],
        },
      ]),
  },
  colunas: [
    { id: "sigla", rotulo: "Sigla", valor: (l) => l.sigla || "—" },
    { id: "nome", rotulo: "Unidade", valor: (l) => l.nome || "—" },
    { id: "tipo", rotulo: "Tipo", valor: (l) => LABELS_UNIDADE[l.tipo] },
    { id: "superior", rotulo: "Responde a", valor: (l) => l.superior_sigla ?? "—" },
  ],
  rotulosCampos: {
    sigla: "Sigla",
    superior_id: "Responde a",
    descricao: "Descrição",
    lei_criacao_numero: "Lei de criação",
    lei_criacao_data: "Data da lei",
  },
  identificarLinha: (l) => `Linha ${l.linhaPlanilha ?? l.indice + 2} (${l.sigla || "sem sigla"})`,

  async ler(arquivo) {
    const planilha = await lerPrimeiraAba(arquivo);
    return interpretarEstruturaPlanilha(planilha.cabecalhos, planilha.linhas);
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("governanca_importar_estrutura", {
      p_linhas: ordemDeEnvio(leitura.linhas).map(paraContrato) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useOrganograma.ts e das telas que listam unidades
  invalidar: [["organograma"], ["estrutura-organizacional"], ["unidades"]],
};
