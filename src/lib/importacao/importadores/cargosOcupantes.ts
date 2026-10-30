/**
 * IMPORTADOR: planilha de ocupantes dos cargos comissionados → provimento (cargo) e lotação de cada servidor
 *
 * Segunda etapa da carga inicial do RH, depois do arquivo da Seplan (servidoresSigrh.ts): a planilha não tem CPF,
 * então o servidor é achado pelo nome entre os já cadastrados e a lotação pela estrutura organizacional, aqui no
 * navegador (cargosOcupantesParser.ts). A RPC `rh_importar_cargos_ocupantes` acha o cargo pelo nome e símbolo do
 * quadro de vagas, pega a data de nomeação na portaria da Central de Portarias (sem portaria: 1º de janeiro do ano,
 * marcada "a conferir") e grava tudo ou nada (migração 20261115090000).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { lerAbas } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import {
  lerOcupantes,
  paraContratoOcupante,
  type LinhaOcupante,
  type ServidorParaCasar,
} from "./cargosOcupantesParser";

const PAGINA = 1000;

/** Todos os servidores cadastrados (id e nome), em páginas: a API devolve no máximo 1000 por vez. */
async function buscarServidores(): Promise<ServidorParaCasar[]> {
  const todos: ServidorParaCasar[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supabase
      .from("servidores")
      .select("id, nome_completo")
      .order("id")
      .range(de, de + PAGINA - 1);
    if (error) throw error;
    todos.push(...(data ?? []).map((s) => ({ id: s.id, nome: s.nome_completo })));
    if (!data || data.length < PAGINA) return todos;
  }
}

export const importadorCargosOcupantes: Importador<LinhaOcupante> = {
  id: "cargos_ocupantes",
  titulo: "Cargo e lotação pela planilha de ocupantes",
  descricao:
    "Nomeia cada servidor já cadastrado no cargo comissionado que ocupa hoje e registra a lotação, pela planilha de ocupantes do RH.",
  modulo: "rh",
  permissao: "rh.servidores.importar",
  local: { rota: "/rh/servidores?importador=cargos_ocupantes", caminho: "RH → Servidores → Importar → Cargo e lotação" },
  aceita: ".xlsx,.xls,.csv",
  instrucoes:
    "Use a planilha de ocupantes dos cargos comissionados (aba \"ativos\"), com as colunas CARGO, CODIGO (símbolo), " +
    "NOME DO OCUPANTE, MUNIC. e LOCAL. Antes, importe o Quadro de vagas (Cargos → Quadro de vagas) com a mesma " +
    "planilha e os servidores pelo arquivo da Seplan (Importar → Servidores do SIGRH). O servidor é achado pelo nome; nome " +
    "escrito diferente aparece como aviso para conferir. A data de nomeação vem da portaria de nomeação cadastrada na " +
    "Central de Portarias; sem ela, fica 1º de janeiro do ano, marcada \"a conferir\".",
  colunas: [
    { id: "nome", rotulo: "Na planilha", valor: (l) => l.nomePlanilha },
    {
      id: "servidor",
      rotulo: "Servidor no cadastro",
      valor: (l) =>
        l.servidorNome
          ? l.semelhanca !== null && l.semelhanca < 1
            ? `${l.servidorNome} (parecido, ${Math.round(l.semelhanca * 100)}%)`
            : l.servidorNome
          : "não encontrado",
    },
    { id: "cargo", rotulo: "Cargo", valor: (l) => [l.cargo, l.simbolo].filter(Boolean).join(" – ") },
    { id: "lotacao", rotulo: "Lotação", valor: (l) => l.unidadeNome ?? (l.local ? `${l.local} (fora da estrutura)` : "—") },
    { id: "municipio", rotulo: "Município", valor: (l) => l.municipio ?? "—" },
  ],
  rotulosCampos: {
    cargo: "Cargo",
    unidade: "Lotação",
    data_nomeacao: "Data de nomeação",
    vaga: "Vaga",
  },
  identificarLinha: (l) => `Linha ${l.linhaPlanilha} (${l.nomePlanilha})`,

  async ler(arquivo) {
    const [abas, servidores, unidades] = await Promise.all([
      lerAbas(arquivo),
      buscarServidores(),
      supabase.from("estrutura_organizacional").select("id, nome, sigla").eq("ativo", true),
    ]);
    if (unidades.error) throw unidades.error;
    if (servidores.length === 0) {
      throw new Error("Nenhum servidor cadastrado: importe antes o arquivo da Seplan (RH → Servidores → Importar → Servidores do SIGRH).");
    }
    return lerOcupantes(abas, servidores, unidades.data ?? []);
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("rh_importar_cargos_ocupantes", {
      p_linhas: leitura.linhas.map(paraContratoOcupante) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho } as unknown as Json,
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/pages/rh/GestaoServidoresPage.tsx e dos hooks de servidores, provimentos e vagas (src/hooks/)
  invalidar: [
    ["servidores-rh"], ["servidores-gestao"], ["servidores-situacao"], ["provimentos"], ["quadro-vagas"], ["cargos-vagos"],
    ["historico-lotacoes"], ["estatisticas-lotacao"],
  ],
};
