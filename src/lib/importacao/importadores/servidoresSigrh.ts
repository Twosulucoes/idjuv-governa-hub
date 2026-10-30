/**
 * IMPORTADOR: arquivo da Seplan (créditos bancários da folha do SIGRH) → cadastro de servidores
 *
 * Carga inicial e atualização mensal do cadastro pelo zip que a Seplan manda todo mês. Dois arquivos do zip entram,
 * um de cada vez: o PDF "Relação de Crédito Bancário — Servidores Ativos" cria/atualiza o servidor pelo CPF (nome,
 * matrícula, conta) e o TXT do banco (CNAB 240) completa o endereço vazio. O leitor (servidoresSigrhParser.ts)
 * confere a soma com o total impresso; a RPC `rh_importar_servidores_sigrh` grava tudo ou nada (migração
 * 20261114090000). Cargo e lotação não vêm no arquivo: entram depois, na ficha ou pela planilha de ocupantes.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { decodificarArquivoBancario } from "@/lib/bancario/comum";
import { lerLinhasPdf } from "../pdfTexto";
import type { Importador, ResultadoBanco } from "../types";
import {
  formatarReais,
  interpretarArquivoBanco,
  interpretarCreditoBancario,
  paraContratoServidorSigrh,
  type LinhaServidorSigrh,
} from "./servidoresSigrhParser";

/** CPF na prévia só com os 3 primeiros e os 2 últimos dígitos */
const cpfMascarado = (cpf: string) => (cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : "—");

const enderecoResumido = (l: LinhaServidorSigrh) =>
  l.endereco ? [l.endereco.logradouro, l.endereco.cidade].filter(Boolean).join(", ") || "—" : "—";

export const importadorServidoresSigrh: Importador<LinhaServidorSigrh> = {
  id: "servidores_sigrh",
  titulo: "Servidores pelo arquivo da Seplan (SIGRH)",
  descricao:
    "Cadastra os servidores que recebem pela folha do SIGRH e mantém a conta bancária em dia; o arquivo do banco completa o endereço.",
  modulo: "rh",
  permissao: "rh.servidores.importar",
  local: { rota: "/rh/servidores?importador=servidores_sigrh", caminho: "RH → Servidores → Importar do SIGRH" },
  aceita: ".pdf,.txt",
  instrucoes:
    "Abra o zip que a Seplan manda todo mês (\"…CreditosBancarios<Mês><Ano> - FOLHA MENSAL\"). Primeiro envie o PDF " +
    "da pasta RelatoriosBancarios que termina em _Fun (\"Relação de Crédito Bancário — Servidores Ativos\"): ele cria " +
    "quem ainda não está cadastrado e atualiza a conta de quem já está. Depois, se quiser o endereço, envie o TXT da " +
    "pasta ArqBancarios que termina em _Fun. Os arquivos que terminam em _Pen são de pensão alimentícia e não entram " +
    "aqui. Cargo, lotação e dados pessoais não vêm no arquivo: confira na ficha de cada servidor.",
  colunas: [
    { id: "nome", rotulo: "Servidor", valor: (l) => l.nome },
    { id: "cpf", rotulo: "CPF", valor: (l) => cpfMascarado(l.cpf) },
    { id: "matricula", rotulo: "Matrícula", valor: (l) => l.matricula ?? "—" },
    {
      id: "conta",
      rotulo: "Banco / agência / conta",
      valor: (l) => [l.bancoCodigo, l.bancoAgencia, l.bancoConta].filter(Boolean).join(" / ") || "—",
    },
    { id: "endereco", rotulo: "Endereço", valor: enderecoResumido },
    {
      id: "proventos",
      rotulo: "Proventos",
      valor: (l) => (l.proventos === null ? "—" : formatarReais(l.proventos)),
      alinhamento: "direita",
    },
    { id: "liquido", rotulo: "Líquido", valor: (l) => formatarReais(l.liquido), alinhamento: "direita" },
  ],
  rotulosCampos: {
    matricula: "Matrícula",
    banco_codigo: "Banco",
    banco_agencia: "Agência",
    banco_conta: "Conta",
    endereco_logradouro: "Logradouro",
    endereco_numero: "Número",
    endereco_complemento: "Complemento",
    endereco_bairro: "Bairro",
    endereco_cidade: "Cidade",
    endereco_uf: "UF",
    endereco_cep: "CEP",
  },
  identificarLinha: (l) => l.nome,

  async ler(arquivo) {
    if (/\.pdf$/i.test(arquivo.name) || arquivo.type === "application/pdf") {
      return interpretarCreditoBancario(await lerLinhasPdf(await arquivo.arrayBuffer()));
    }
    return interpretarArquivoBanco(decodificarArquivoBancario(await arquivo.arrayBuffer()), arquivo.name);
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("rh_importar_servidores_sigrh", {
      p_origem: String(leitura.parametros.origem),
      p_linhas: leitura.linhas.map(paraContratoServidorSigrh) as unknown as Json,
      p_arquivo: {
        nome: arquivo.nome,
        sha256: arquivo.sha256,
        tamanho: arquivo.tamanho,
        ano: leitura.parametros.ano ?? null,
        mes: leitura.parametros.mes ?? null,
      } as unknown as Json,
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/pages/rh/GestaoServidoresPage.tsx e dos hooks de servidores (src/hooks/)
  invalidar: [["servidores-rh"], ["servidores-gestao"], ["servidores-tipo-derivado"], ["servidores-situacao"]],
};
