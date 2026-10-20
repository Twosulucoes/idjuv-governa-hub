/**
 * Arquivos da folha: remessa CNAB 240 e eventos do eSocial (onda E3 do RH,
 * spec docs/superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md).
 *
 * Contrato com o banco (migração 20261011010000_rh_cnab_esocial_integridade.sql e a seguinte, 20261011010100):
 *  - remessa e eventos do eSocial só entram com a folha fechada (o banco recusa com erro claro; a tela já desabilita);
 *  - o número da remessa é atribuído pelo banco no INSERT (lido com `.select()`; o front não calcula MAX+1);
 *  - o arquivo da remessa vai para o bucket privado `remessas-cnab` (`<remessa_id>.rem`) e a remessa guarda
 *    `arquivo_path` e `arquivo_sha256`; "baixar de novo" serve o arquivo guardado, conferido pelo hash;
 *  - sem DELETE pela API: remessa é cancelada com motivo (RPC `cancelar_remessa`); evento do eSocial não se exclui;
 *  - guardar o arquivo (bucket e colunas), baixá-lo de novo e cancelar exigem o módulo rh e
 *    `financeiro.folha.processar` (a tela desabilita para quem não tem);
 *  - remessa de servidores (líquido das fichas) ou de pensão alimentícia (beneficiários das pensões descontadas,
 *    migração 20261020090000): o banco soma cada tipo pela sua regra e guarda `tipo_credito`; uma ativa por folha,
 *    conta e tipo; o número parte de `contas_autarquia.nsa_inicial` quando ele é maior;
 *  - índice único (folha, evento, servidor) em `eventos_esocial`, fora os com status 'erro'/'rejeitado': gerar de
 *    novo não duplica (conflito 23505).
 * Os eventos do eSocial são rascunho: nada é transmitido por este sistema (onda G).
 */

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { getTenantSnapshotOuNulo } from "@/core/tenant";
import { BANCOS } from "@/types/rh";
import { calcularSha256 } from "@/lib/filaFotosOffline";
import { descreverErroBanco } from "@/lib/folhaFichaRegras";
import { buscarTodasPaginas } from "@/hooks/useRelatoriosRH";
import {
  arquivoCNAB,
  downloadCNAB,
  gerarCNAB240,
  separarDigito,
  validarRemessaCNAB,
  type DadosEmpresa,
  type DadosFavorecido,
  type EnderecoPagador,
} from "@/lib/cnabGenerator";
import { downloadXml } from "@/lib/esocialXmlGenerator";
import { isoLocal } from "@/lib/bancario/dataCredito";
import { creditosPensao, PREFIXO_ITEM_PENSAO, type FichaComPensao, type PensaoCadastro } from "@/lib/bancario/pensaoRemessa";
import { MSG_FALHA_REGISTRO, registrarEvento, useRegistrarEvento } from "@/hooks/useTrilhaAuditoria";

const db = supabase;

export const BUCKET_REMESSAS_CNAB = "remessas-cnab";

export const MSG_REMESSA_ATIVA =
  "Já existe remessa ativa deste tipo (servidores ou pensão) desta folha nesta conta; cancele-a antes de gerar outra.";

export type TipoCreditoRemessa = "servidores" | "pensao";

export const ROTULO_TIPO_CREDITO: Record<TipoCreditoRemessa, string> = {
  servidores: "Servidores",
  pensao: "Pensão alimentícia",
};

/**
 * Mensagem do banco para a tela: o texto do RAISE das regras da E3 passa como veio (RHE01 folha não fechada, RHE02
 * campo fixo, RHE03 cancelamento, 22023 valor inválido e o 42501 das funções, que diz a permissão que falta); a
 * recusa da RLS, duplicidade, obrigatório e chave estrangeira viram o texto fixo de `descreverErroBanco` (sem DETAIL).
 * A recusa da regra de lançamento por setor (RHS01, modo exigir) vai para `descreverErroBanco` (mensagem + HINT).
 * Com `contexto = "arquivo_remessa"` (envio do arquivo e UPDATE de arquivo_path/arquivo_sha256), P0002 e 42501 ganham
 * texto próprio. Duplicidade do índice remessas_bancarias_folha_conta_ativa_uidx: `MSG_REMESSA_ATIVA`.
 */
export function mensagemErroBanco(erro: unknown, contexto?: "arquivo_remessa"): string {
  const e = (erro && typeof erro === "object" ? erro : null) as { code?: string; message?: string } | null;
  // Erro do Storage (StorageError/StorageApiError): sem código do Postgres; a mensagem é do serviço (bucket, policy)
  if (e && "__isStorageError" in e && e.message) {
    if (contexto === "arquivo_remessa" && /row-level security|unauthorized|403/i.test(e.message)) {
      return (
        "O armazenamento recusou o arquivo: é preciso a permissão de processar a folha e a remessa tem de ser sua, " +
        "gerada há menos de 1 hora e ainda sem arquivo."
      );
    }
    return e.message;
  }
  if (e?.code === "23505" && /folha_conta_ativa/i.test(e.message ?? "")) return MSG_REMESSA_ATIVA;
  if (contexto === "arquivo_remessa" && e?.code === "P0002") {
    return "O banco não encontrou no armazenamento o arquivo enviado por você para esta remessa; ele não foi ligado à remessa.";
  }
  if (contexto === "arquivo_remessa" && e?.code === "42501") {
    return "Só quem gerou a remessa, com a permissão de processar a folha, pode guardar o arquivo dela.";
  }
  const tratados = ["23505", "23502", "23503", "PGRST116", "RHS01"];
  const recusaRls = e?.code === "42501" && /row-level security/i.test(e.message ?? "");
  if (e?.message && e.code && !tratados.includes(e.code) && !recusaRls) return e.message;
  return descreverErroBanco(erro);
}

const doisDigitos = (n: number) => n.toString().padStart(2, "0");

function carimbo(d = new Date()): string {
  return (
    d.getFullYear().toString() +
    doisDigitos(d.getMonth() + 1) +
    doisDigitos(d.getDate()) +
    doisDigitos(d.getHours()) +
    doisDigitos(d.getMinutes()) +
    doisDigitos(d.getSeconds())
  );
}

// ============================================================================
// Remessa CNAB 240
// ============================================================================

/** Remessa com as colunas da E3 (`arquivo_path`, `arquivo_sha256`). */
export interface RemessaComArquivo {
  id: string;
  folha_id: string;
  numero_remessa: number;
  nome_arquivo: string;
  status: string | null;
  tipo_credito?: string | null;
  arquivo_path?: string | null;
  arquivo_sha256?: string | null;
  motivo_cancelamento?: string | null;
}

/** Fichas da folha para a remessa, uma página (com o endereço do servidor para o segmento B). */
const consultaFichasRemessa = (folhaId: string, de: number, ate: number) =>
  supabase
    .from("fichas_financeiras")
    .select(
      `*, servidor:servidores(id, nome_completo, cpf, matricula, endereco_logradouro, endereco_numero,
       endereco_complemento, endereco_bairro, endereco_cidade, endereco_cep, endereco_uf)`,
    )
    .eq("folha_id", folhaId)
    .order("id")
    .range(de, ate);

export type FichaRemessa = NonNullable<Awaited<ReturnType<typeof consultaFichasRemessa>>["data"]>[number];

/**
 * Leitura incompleta da folha: menos fichas do que `folhas_pagamento.quantidade_servidores` (a RLS esconde as fichas
 * de outros servidores de quem não tem permissão de lê-las) ou nenhuma. Devolve a explicação, ou null se está completa.
 */
export function faltaFichas(lidas: number, quantidadeServidores: number | null | undefined): string | null {
  if (lidas === 0) return "Nenhuma ficha financeira lida desta folha: não há o que gerar.";
  if (quantidadeServidores && lidas < quantidadeServidores) {
    return (
      `Só ${lidas} de ${quantidadeServidores} fichas desta folha puderam ser lidas (seu acesso não alcança todas, ` +
      "ou a folha mudou). O arquivo sairia incompleto e não será gerado."
    );
  }
  return null;
}

/**
 * Contas ativas, configuração e todas as fichas da folha (paginadas; a tela filtra líquido > 0 e confere a contagem
 * com `quantidade_servidores`).
 */
export function useDadosRemessaCNAB(folhaId: string, habilitado: boolean) {
  const contas = useQuery({
    // Sob ['contas-autarquia'] para pegar a invalidação de useSaveContaAutarquia/useDeleteContaAutarquia
    queryKey: ["contas-autarquia", "ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_autarquia")
        .select(`*, banco:bancos_cnab(id, codigo_banco, nome)`)
        .eq("ativo", true)
        .order("descricao");
      if (error) throw error;
      return data;
    },
    enabled: habilitado,
  });

  const config = useQuery({
    queryKey: ["config-autarquia"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_autarquia").select("*").eq("ativo", true).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: habilitado,
  });

  const fichas = useQuery({
    queryKey: ["fichas-para-remessa", folhaId],
    queryFn: () => buscarTodasPaginas<FichaRemessa>((de, ate) => consultaFichasRemessa(folhaId, de, ate)),
    enabled: habilitado,
  });

  return { contas, config, fichas };
}

/** Descontos de pensão das fichas da folha, uma página (as fichas sem pensão vêm com a lista vazia). */
const consultaFichasPensao = (folhaId: string, de: number, ate: number) =>
  supabase
    .from("fichas_financeiras")
    .select("id, servidor_id, itens:itens_ficha_financeira(id, descricao, tipo, valor)")
    .eq("folha_id", folhaId)
    .eq("itens.tipo", "desconto")
    .like("itens.descricao", `${PREFIXO_ITEM_PENSAO}%`)
    .order("id")
    .range(de, ate);

const consultaPensoes = (de: number, ate: number) =>
  supabase
    .from("pensoes_alimenticias")
    .select("id, servidor_id, beneficiario_nome, beneficiario_cpf, banco_codigo, banco_agencia, banco_conta, banco_tipo_conta")
    .order("id")
    .range(de, ate);

/**
 * Para a remessa de pensão: os descontos de pensão da folha e o cadastro das pensões (banco do beneficiário). Ler as
 * pensões exige `rh.contracheques.visualizar` ou `financeiro.folha.processar` (RLS).
 */
export function useDadosRemessaPensao(folhaId: string, habilitado: boolean) {
  const fichas = useQuery({
    queryKey: ["fichas-pensao-remessa", folhaId],
    queryFn: () => buscarTodasPaginas<FichaComPensao>((de, ate) => consultaFichasPensao(folhaId, de, ate)),
    enabled: habilitado,
  });
  const pensoes = useQuery({
    queryKey: ["pensoes-alimenticias", "remessa"],
    queryFn: () => buscarTodasPaginas<PensaoCadastro>(consultaPensoes),
    enabled: habilitado,
  });
  return { fichas, pensoes };
}

type DadosRemessa = ReturnType<typeof useDadosRemessaCNAB>;
type ContaRemessa = NonNullable<DadosRemessa["contas"]["data"]>[number];
type ConfigRemessa = NonNullable<DadosRemessa["config"]["data"]>;

/** Ficha com o mínimo para entrar na remessa (código do banco, agência e conta). */
export const fichaTemBanco = (f: Pick<FichaRemessa, "banco_codigo" | "banco_agencia" | "banco_conta">) =>
  !!(f.banco_codigo && f.banco_agencia && f.banco_conta);

/**
 * Endereço do pagador: o de `config_autarquia` (Configurações da Folha); se o logradouro não estiver lá, o do perfil
 * do tenant inteiro (sem misturar as duas fontes).
 */
function enderecoPagador(config: ConfigRemessa): EnderecoPagador {
  if (config.endereco_logradouro?.trim()) {
    return {
      logradouro: config.endereco_logradouro,
      numero: config.endereco_numero ?? "",
      complemento: config.endereco_complemento ?? "",
      cidade: config.endereco_cidade ?? "",
      cep: config.endereco_cep ?? "",
      uf: config.endereco_uf ?? "",
    };
  }
  const t = getTenantSnapshotOuNulo()?.endereco;
  return {
    logradouro: t?.logradouro ?? "",
    numero: t?.numero ?? "",
    complemento: t?.complemento ?? "",
    cidade: t?.cidade ?? "",
    cep: t?.cep ?? "",
    uf: t?.uf ?? "",
  };
}

/** Pagador da remessa: instituição (Configurações da Folha) e conta de débito (Bancos e Contas). */
function montarEmpresa(config: ConfigRemessa, conta: ContaRemessa): DadosEmpresa {
  const banco = conta.banco as { codigo_banco?: string | null; nome?: string | null } | null;
  const codigoBanco = banco?.codigo_banco ?? "";
  const agencia = separarDigito(conta.agencia);
  const contaPg = separarDigito(conta.conta);

  return {
    cnpj: config.cnpj ?? "",
    razaoSocial: config.razao_social ?? "",
    banco: codigoBanco,
    nomeBanco: banco?.nome || BANCOS.find((b) => b.codigo === codigoBanco)?.nome || "",
    agencia: agencia.numero,
    agenciaDigito: conta.agencia_digito?.trim() || agencia.digito,
    conta: contaPg.numero,
    contaDigito: conta.conta_digito?.trim() || contaPg.digito,
    convenio: conta.convenio_pagamento || "",
    endereco: enderecoPagador(config),
  };
}

/** Monta pagador e favorecidos e lista o que falta no cadastro (vazio = pode gerar). */
export function montarDadosRemessa(
  config: ConfigRemessa,
  conta: ContaRemessa,
  fichas: FichaRemessa[],
  dataCredito: Date,
): { empresa: DadosEmpresa; favorecidos: DadosFavorecido[]; faltas: string[] } {
  const empresa = montarEmpresa(config, conta);
  const favorecidos: DadosFavorecido[] = fichas.filter(fichaTemBanco).map((f) => {
    const ag = separarDigito(f.banco_agencia);
    const cc = separarDigito(f.banco_conta);
    const s = f.servidor;
    return {
      nome: s?.nome_completo || "",
      cpf: s?.cpf || "",
      banco: f.banco_codigo || "",
      agencia: ag.numero,
      agenciaDigito: ag.digito,
      conta: cc.numero,
      contaDigito: cc.digito,
      tipoConta: (f.banco_tipo_conta === "poupanca" ? "CP" : "CC") as "CC" | "CP",
      valor: f.valor_liquido || 0,
      dataCredito,
      identificador: f.id.substring(0, 20),
      endereco: s
        ? {
            logradouro: s.endereco_logradouro ?? "",
            numero: s.endereco_numero ?? "",
            complemento: s.endereco_complemento ?? "",
            bairro: s.endereco_bairro ?? "",
            cidade: s.endereco_cidade ?? "",
            cep: s.endereco_cep ?? "",
            uf: s.endereco_uf ?? "",
          }
        : undefined,
    };
  });

  return { empresa, favorecidos, faltas: validarRemessaCNAB(empresa, favorecidos) };
}

/**
 * Remessa de pensão: um crédito por desconto de pensão da folha, com o banco do cadastro da pensão. Beneficiário sem
 * banco ou sem cadastro fica fora (a tela avisa); cadastro em dobro impede gerar.
 */
export function montarRemessaPensao(
  config: ConfigRemessa,
  conta: ContaRemessa,
  fichas: FichaComPensao[],
  pensoes: PensaoCadastro[],
  dataCredito: Date,
): { empresa: DadosEmpresa; favorecidos: DadosFavorecido[]; faltas: string[]; semBanco: string[]; semCadastro: string[] } {
  const empresa = montarEmpresa(config, conta);
  const c = creditosPensao(fichas, pensoes, dataCredito);
  const faltas = validarRemessaCNAB(empresa, c.favorecidos, { quem: "beneficiário(s)", dadosDaFicha: false });
  if (c.duplicados.length) {
    faltas.push(
      `pensão cadastrada mais de uma vez para o mesmo servidor e beneficiário: ${c.duplicados.join(", ")}. ` +
        "Deixe um cadastro com banco por beneficiário (Pensões alimentícias do servidor).",
    );
  }
  return { empresa, favorecidos: c.favorecidos, faltas, semBanco: c.semBanco, semCadastro: c.semCadastro };
}

export type ResultadoRemessa =
  | { ok: true; numero: number; nomeArquivo: string; quantidade: number; valorTotal: number }
  | { ok: false; mensagem: string };

interface ParamsGerarRemessa {
  folhaId: string;
  contaId: string;
  tipoCredito: TipoCreditoRemessa;
  competenciaAno: number;
  competenciaMes: number;
  empresa: DadosEmpresa;
  favorecidos: DadosFavorecido[];
}

/**
 * Gera, guarda e entrega a remessa, nesta ordem: INSERT (número do banco) → arquivo com esse número → sha256 →
 * upload no bucket privado → UPDATE de arquivo_path/arquivo_sha256 → registro na trilha (com remessa_id e número) →
 * download. Se o upload ou o UPDATE falhar, o arquivo não é entregue e a remessa sem arquivo é cancelada (melhor
 * esforço). Sem registro na trilha, o arquivo fica guardado mas não é entregue (baixa-se pela aba, com registro).
 * O banco calcula valor_total e quantidade_registros pelas fichas no INSERT; lidos de volta, têm de bater com o arquivo
 * (senão cancela, sem subir nem entregar). Uma remessa ativa por folha e conta (23505 → `MSG_REMESSA_ATIVA`).
 */
export function useGerarRemessaCNAB() {
  const queryClient = useQueryClient();
  const { registrarAntes } = useRegistrarEvento();

  return useCallback(
    async (p: ParamsGerarRemessa): Promise<ResultadoRemessa> => {
      const quantidade = p.favorecidos.length;
      // Soma em centavos inteiros, como no trailer do arquivo
      const valorTotal = p.favorecidos.reduce((soma, f) => soma + Math.round(f.valor * 100), 0) / 100;
      const prefixo = p.tipoCredito === "pensao" ? "CNAB240_PENSAO" : "CNAB240";
      const nomeArquivo = `${prefixo}_${p.competenciaAno}${doisDigitos(p.competenciaMes)}_${carimbo()}.REM`;
      const dataCredito = p.favorecidos[0]?.dataCredito;

      // INSERT: o número vem do banco
      const { data: criada, error: erroInsert } = await db
        .from("remessas_bancarias")
        .insert({
          folha_id: p.folhaId,
          conta_autarquia_id: p.contaId,
          tipo_credito: p.tipoCredito,
          nome_arquivo: nomeArquivo,
          layout: "CNAB240",
          quantidade_registros: quantidade,
          valor_total: valorTotal,
          status: "gerada",
          // numero_remessa é NOT NULL sem default no tipo gerado, mas quem preenche é o trigger do banco
        } as TablesInsert<"remessas_bancarias">)
        .select("id, numero_remessa, valor_total, quantidade_registros")
        .single();
      if (erroInsert || !criada) return { ok: false, mensagem: mensagemErroBanco(erroInsert) };
      const remessa = criada as {
        id: string;
        numero_remessa: number;
        valor_total: number | string | null;
        quantidade_registros: number | null;
      };

      const cancelarSemArquivo = async (motivo: string) => {
        const { error } = await db.rpc("cancelar_remessa", { p_remessa_id: remessa.id, p_motivo: motivo });
        if (error) console.error("cancelar_remessa (remessa sem arquivo) falhou:", error);
        return !error;
      };

      // O banco calcula valor e quantidade pelas fichas da folha (servidores: líquido > 0 com banco, agência e conta;
      // pensão: descontos de pensão cujo beneficiário tem banco, agência e conta no cadastro). Divergiu do
      // arquivo montado aqui (fichas mudaram, leitura diferente): não sobe nem entrega, cancela e mostra a diferença.
      const centavosBanco = Math.round(Number(remessa.valor_total ?? 0) * 100);
      const centavosArquivo = Math.round(valorTotal * 100);
      const qtdBanco = Number(remessa.quantidade_registros ?? 0);
      if (centavosBanco !== centavosArquivo || qtdBanco !== quantidade) {
        const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const diferenca =
          `banco: ${qtdBanco} pagamento(s), ${fmt(centavosBanco)}; arquivo: ${quantidade} pagamento(s), ` +
          `${fmt(centavosArquivo)}`;
        const cancelada = await cancelarSemArquivo(`Valor ou quantidade divergente do arquivo (${diferenca}).`.slice(0, 500));
        queryClient.invalidateQueries({ queryKey: ["remessas-bancarias", p.folhaId] });
        return {
          ok: false,
          mensagem:
            `O total calculado pelo banco não confere com o arquivo (${diferenca}). O arquivo não foi guardado nem ` +
            `entregue; a remessa nº ${remessa.numero_remessa} ${cancelada ? "foi cancelada" : "ficou sem arquivo: cancele-a na aba Remessas"}. ` +
            "Atualize a tela e gere de novo.",
        };
      }

      let blob: Blob;
      let sha256: string;
      try {
        blob = arquivoCNAB(
          gerarCNAB240({
            empresa: p.empresa,
            favorecidos: p.favorecidos,
            numeroRemessa: remessa.numero_remessa,
            dataGeracao: new Date(),
          }),
        );
        sha256 = await calcularSha256(blob);
      } catch (erro) {
        const motivo = erro instanceof Error ? erro.message : "Falha ao montar o arquivo.";
        const cancelada = await cancelarSemArquivo(`Arquivo não gerado: ${motivo}`.slice(0, 500));
        queryClient.invalidateQueries({ queryKey: ["remessas-bancarias", p.folhaId] });
        return {
          ok: false,
          mensagem: `${motivo} A remessa nº ${remessa.numero_remessa} ${cancelada ? "foi cancelada" : "ficou sem arquivo: cancele-a na aba Remessas"}.`,
        };
      }

      const caminho = `${remessa.id}.rem`;
      const falhaGuarda = async (etapa: string, erro: unknown) => {
        console.error(`Remessa ${remessa.id}: ${etapa} falhou:`, erro);
        const cancelada = await cancelarSemArquivo(`Arquivo não guardado (${etapa}).`);
        queryClient.invalidateQueries({ queryKey: ["remessas-bancarias", p.folhaId] });
        return {
          ok: false as const,
          mensagem:
            `Não foi possível guardar o arquivo da remessa nº ${remessa.numero_remessa} (${etapa}): ${mensagemErroBanco(erro, "arquivo_remessa")} ` +
            `O arquivo não foi entregue; ${cancelada ? "a remessa foi cancelada. Gere de novo." : "cancele a remessa na aba Remessas e gere de novo."}`,
        };
      };

      const { error: erroUpload } = await supabase.storage
        .from(BUCKET_REMESSAS_CNAB)
        .upload(caminho, blob, { contentType: "text/plain", upsert: false });
      if (erroUpload) return falhaGuarda("envio ao armazenamento", erroUpload);

      const { data: atualizada, error: erroUpdate } = await db
        .from("remessas_bancarias")
        .update({ arquivo_path: caminho, arquivo_sha256: sha256 })
        .eq("id", remessa.id)
        .select("id");
      if (erroUpdate || !atualizada?.length) return falhaGuarda("registro do arquivo na remessa", erroUpdate);
      queryClient.invalidateQueries({ queryKey: ["remessas-bancarias", p.folhaId] });

      // Trilha: depois do INSERT (com o número) e antes de entregar; sem registro, não entrega
      const registrado = await registrarAntes({
        acao: "download",
        entidade: "arquivo_cnab",
        entidadeId: p.folhaId,
        descricao:
          `Remessa CNAB 240 nº ${remessa.numero_remessa} (${ROTULO_TIPO_CREDITO[p.tipoCredito].toLowerCase()}) ` +
          `gerada (${nomeArquivo})`,
        metadados: {
          folha_id: p.folhaId,
          remessa_id: remessa.id,
          numero_remessa: remessa.numero_remessa,
          conta_autarquia_id: p.contaId,
          tipo_credito: p.tipoCredito,
          data_credito: dataCredito ? isoLocal(dataCredito) : null,
          nome_arquivo: nomeArquivo,
          quantidade_registros: quantidade,
          valor_total: valorTotal,
          sha256,
          layout: "CNAB240",
        },
      });
      if (!registrado) {
        return {
          ok: false,
          mensagem:
            `A remessa nº ${remessa.numero_remessa} foi gerada e o arquivo está guardado, mas o registro na trilha falhou: ` +
            "o arquivo não foi entregue. Baixe-o pela aba Remessas.",
        };
      }

      downloadCNAB(blob, nomeArquivo);
      return { ok: true, numero: remessa.numero_remessa, nomeArquivo, quantidade, valorTotal };
    },
    [queryClient, registrarAntes],
  );
}

/**
 * "Baixar de novo": lê o arquivo guardado (download autenticado do Storage), confere o sha256 gravado na remessa,
 * registra o download e entrega. Hash divergente: registra a divergência na trilha e não entrega. Remessa cancelada
 * não é entregue. Lança Error com mensagem pronta para a tela.
 */
export function useBaixarRemessaGuardada() {
  const { registrarAntes } = useRegistrarEvento();

  return useCallback(
    async (r: RemessaComArquivo): Promise<boolean> => {
      if (r.status === "cancelada") {
        throw new Error("Remessa cancelada: o arquivo não é entregue. Não envie ao banco.");
      }
      if (!r.arquivo_path || !r.arquivo_sha256) {
        throw new Error("Arquivo não guardado: esta remessa foi gerada antes do arquivo passar a ser guardado.");
      }
      const { data: blob, error } = await supabase.storage.from(BUCKET_REMESSAS_CNAB).download(r.arquivo_path);
      if (error || !blob) {
        console.error("Download da remessa guardada falhou:", error);
        throw new Error(`Não foi possível baixar o arquivo guardado da remessa: ${mensagemErroBanco(error)}`);
      }
      const esperado = r.arquivo_sha256.toLowerCase();
      const obtido = await calcularSha256(blob);
      if (obtido !== esperado) {
        // Divergência vai para a trilha (melhor esforço) e o arquivo não sai
        try {
          await registrarEvento({
            acao: "download",
            entidade: "remessas_bancarias",
            entidadeId: r.id,
            descricao: `Remessa CNAB 240 nº ${r.numero_remessa}: arquivo guardado com hash divergente, não entregue`,
            metadados: { folha_id: r.folha_id, remessa_id: r.id, hash_divergente: true, esperado, obtido },
          });
        } catch (erro) {
          console.error("registrar_evento (hash divergente) falhou:", erro);
        }
        throw new Error("O arquivo guardado não confere com o hash registrado na remessa. Ele não foi entregue.");
      }

      const registrado = await registrarAntes({
        acao: "download",
        entidade: "remessas_bancarias",
        entidadeId: r.id,
        descricao: `Remessa CNAB 240 nº ${r.numero_remessa} baixada de novo (arquivo guardado)`,
        metadados: { folha_id: r.folha_id, remessa_id: r.id, numero_remessa: r.numero_remessa, sha256: obtido },
      });
      if (!registrado) return false;

      downloadCNAB(blob, r.nome_arquivo || `${r.id}.REM`);
      return true;
    },
    [registrarAntes],
  );
}

/** Cancela a remessa (sem DELETE pela API): RPC `cancelar_remessa` com motivo obrigatório. */
export function useCancelarRemessa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: { remessaId: string; folhaId: string; motivo: string }) => {
      const { error } = await db.rpc("cancelar_remessa", { p_remessa_id: p.remessaId, p_motivo: p.motivo.trim() });
      if (error) throw error;
    },
    onSuccess: (_, p) => {
      queryClient.invalidateQueries({ queryKey: ["remessas-bancarias", p.folhaId] });
      toast.success("Remessa cancelada.");
    },
    onError: (e: unknown) => {
      toast.error(mensagemErroBanco(e));
    },
  });
}

// ============================================================================
// eSocial (rascunho, não transmitido)
// ============================================================================

/** Fichas da folha com servidor e itens, uma página. */
const consultaFichasESocial = (folhaId: string, de: number, ate: number) =>
  supabase
    .from("fichas_financeiras")
    .select(`*, servidor:servidores(id, nome_completo, cpf, pis_pasep, matricula), itens:itens_ficha_financeira(*)`)
    .eq("folha_id", folhaId)
    .order("id")
    .range(de, ate);

export type FichaESocial = NonNullable<Awaited<ReturnType<typeof consultaFichasESocial>>["data"]>[number];

/** Todas as fichas da folha (paginadas) com servidor e itens, para os eventos S-1200/S-1210. */
export function useFichasESocial(folhaId: string, habilitado: boolean) {
  return useQuery({
    queryKey: ["fichas-esocial", folhaId],
    queryFn: () => buscarTodasPaginas<FichaESocial>((de, ate) => consultaFichasESocial(folhaId, de, ate)),
    enabled: habilitado,
  });
}

/** Dia de pagamento da configuração de fechamento ativa (a padrão primeiro); nulo se não houver. */
export function useDiaPagamentoFolha(habilitado: boolean) {
  return useQuery({
    queryKey: ["config-fechamento-folha", "dia-pagamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_fechamento_folha")
        .select("dia_pagamento, padrao")
        .eq("ativo", true)
        .order("padrao", { ascending: false, nullsFirst: false })
        .limit(1);
      if (error) throw error;
      return data?.[0]?.dia_pagamento ?? null;
    },
    enabled: habilitado,
  });
}

/** Feriados cadastrados (RH), para a data de crédito da remessa cair em dia útil. */
export function useFeriadosRemessa(habilitado: boolean) {
  return useQuery({
    queryKey: ["feriados", "remessa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feriados").select("data, recorrente, ativo");
      if (error) throw error;
      return data ?? [];
    },
    enabled: habilitado,
  });
}

/** Data (yyyy-MM-dd) do dia de pagamento dentro do mês da competência, limitada ao último dia do mês. */
export function dataPagamentoNaCompetencia(ano: number, mes: number, dia: number | null | undefined): string {
  if (!dia || dia < 1) return "";
  const ultimo = new Date(ano, mes, 0).getDate();
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(Math.min(dia, ultimo))}`;
}

/**
 * Nome do XML: sempre marcado como rascunho não transmitido e identificado pelo id do evento (nunca pelo nome do
 * servidor: o nome do arquivo aparece em pasta de download, e-mail e log).
 */
export function nomeArquivoEventoESocial(tipo: string, idEvento: string | null | undefined, ano: number, mes: number) {
  const id = (idEvento ?? "").replace(/[^A-Za-z0-9]+/g, "").slice(0, 40) || "sem-id";
  return `RASCUNHO_NAO_TRANSMITIDO_${tipo}_${ano}-${doisDigitos(mes)}_${id}.xml`;
}

export interface EventoParaGravar {
  tipo: string;
  servidorId: string | null;
  idEvento: string;
  json: string;
  xml: string;
  erros: string[];
}

/** Evento já gravado, lido do banco (conflito do índice único ou lista da folha). */
export interface EventoExistente {
  id: string;
  tipo_evento: string;
  servidor_id: string | null;
  id_evento: string | null;
  payload_xml: string | null;
  payload: unknown;
}

export type ResultadoGravacaoEvento =
  | { situacao: "gravado" }
  | { situacao: "existente"; existente: EventoExistente | null }
  | { situacao: "erro"; mensagem: string };

const chaveEvento = (tipo: string, servidorId: string | null) => `${tipo}|${servidorId ?? ""}`;

/**
 * Grava os eventos um a um, conferindo o erro de cada um. Conflito do índice único (23505) = o evento já existe:
 * devolve o gravado, para a tela oferecer baixar o existente em vez de duplicar.
 */
export function useGravarEventosESocial() {
  const queryClient = useQueryClient();

  return useCallback(
    async (
      folhaId: string,
      competencia: { ano: number; mes: number },
      eventos: EventoParaGravar[],
    ): Promise<ResultadoGravacaoEvento[]> => {
      const resultados: ResultadoGravacaoEvento[] = [];
      let houveConflito = false;
      for (const ev of eventos) {
        const { error } = await db.from("eventos_esocial").insert({
          tipo_evento: ev.tipo,
          folha_id: folhaId,
          servidor_id: ev.servidorId,
          competencia_mes: competencia.mes,
          competencia_ano: competencia.ano,
          id_evento: ev.idEvento,
          payload: JSON.parse(ev.json),
          payload_xml: ev.xml,
          status: ev.erros.length > 0 ? "erro" : "pendente",
          mensagem_retorno: ev.erros.length > 0 ? ev.erros.join("; ").slice(0, 2000) : null,
        });
        if (!error) resultados.push({ situacao: "gravado" });
        else if (error.code === "23505") {
          houveConflito = true;
          resultados.push({ situacao: "existente", existente: null });
        } else resultados.push({ situacao: "erro", mensagem: mensagemErroBanco(error) });
      }

      if (houveConflito) {
        // Mesmo recorte do índice único: os com 'erro'/'rejeitado' não conflitam.
        const { data, error } = await db
          .from("eventos_esocial")
          .select("id, tipo_evento, servidor_id, id_evento, payload_xml, payload")
          .eq("folha_id", folhaId)
          .not("status", "in", "(erro,rejeitado)");
        if (error) console.error("Leitura dos eventos existentes falhou:", error);
        const porChave = new Map(
          ((data ?? []) as EventoExistente[]).map((e) => [chaveEvento(e.tipo_evento, e.servidor_id), e]),
        );
        eventos.forEach((ev, i) => {
          if (resultados[i].situacao === "existente") {
            resultados[i] = { situacao: "existente", existente: porChave.get(chaveEvento(ev.tipo, ev.servidorId)) ?? null };
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ["eventos-esocial", folhaId] });
      return resultados;
    },
    [queryClient],
  );
}

/** Baixa o XML gravado de um evento da folha (rascunho), registrando antes. */
export function useBaixarEventoESocial() {
  const { registrarAntes } = useRegistrarEvento();
  return useCallback(
    async (
      ev: Pick<EventoExistente, "id" | "tipo_evento" | "id_evento" | "payload_xml"> & {
        folhaId: string;
        ano: number;
        mes: number;
      },
    ): Promise<boolean> => {
      if (!ev.payload_xml) {
        toast.error("Este evento não tem XML gravado.");
        return false;
      }
      const registrado = await registrarAntes({
        acao: "download",
        entidade: "eventos_esocial",
        entidadeId: ev.id,
        descricao: `eSocial ${ev.tipo_evento} (rascunho, não transmitido) baixado da folha`,
        metadados: { folha_id: ev.folhaId, tipo: ev.tipo_evento, id_evento: ev.id_evento, rascunho: true },
      });
      if (!registrado) return false;
      downloadXml(ev.payload_xml, nomeArquivoEventoESocial(ev.tipo_evento, ev.id_evento || ev.id, ev.ano, ev.mes));
      return true;
    },
    [registrarAntes],
  );
}
