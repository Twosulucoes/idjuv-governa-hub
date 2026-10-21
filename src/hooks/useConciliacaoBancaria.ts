/**
 * Conciliação bancária do Financeiro (spec docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md,
 * etapas 2 a 4): movimentos lidos dos arquivos do banco, conciliação manual com pagamentos, reenvio de recusados
 * pelo Gestão MAX e leitura das APIs do Banco do Brasil (Edge Function `bb-api`).
 *
 * A permissão é conferida de novo no banco (RLS e RPCs): a tela é só UX.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getTenantSnapshotOuNulo } from "@/core/tenant";
import { comIdentidadeDoCliente } from "@/lib/identidadeConfigAutarquia";
import { calcularSha256 } from "@/lib/importacao/arquivo";
import {
  gerarGestaoMaxCnab240,
  nomeArquivoGestaoMax,
  validarRemessaGestaoMax,
  type PagadorGestaoMax,
  type RemessaGestaoMax,
} from "@/lib/bancario/gestaoMaxCnab240";
import {
  gerarObn600Remessa,
  nomeArquivoObn600,
  validarRemessaObn600,
  type RemessaObn600,
} from "@/lib/bancario/obn600Remessa";
import type {
  ContaPagadora,
  ContaPagadoraObn,
  FiltroSituacaoMovimento,
  LancamentoExtrato,
  MovimentoBancario,
  PagamentoParaRemessa,
  RemessaBancaria,
  RemessaObnRegistrada,
  RemessaRegistrada,
  ResultadoExtratoBB,
  ResultadoValidacaoConta,
  StatusApiBB,
} from "@/types/conciliacaoBancaria";

const db = supabase;

const CAMPOS_MOVIMENTO = "*, pagamento:fin_pagamentos(id, numero, status)";
const TAMANHO_PAGINA = 1000;

/** Mensagem legível de erro do banco ou da Edge Function (sem DETAIL nem dado pessoal). */
export async function mensagemErro(e: unknown): Promise<string> {
  const ctx = (e as { context?: unknown })?.context;
  if (ctx instanceof Response) {
    try {
      const corpo = (await ctx.clone().json()) as { error?: string; mensagem?: string; message?: string };
      const msg = corpo.mensagem ?? corpo.error ?? corpo.message;
      if (msg) return String(msg);
    } catch {
      // corpo não é JSON: cai na mensagem genérica
    }
  }
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Erro inesperado.";
}

// ===========================================
// MOVIMENTOS BANCÁRIOS
// ===========================================

/**
 * Movimentos do exercício (data do pagamento no ano; sem data, a data do arquivo), do mais recente para o
 * mais antigo. Lê em páginas para não truncar no limite da API.
 */
export function useMovimentosBancarios(exercicio: number, situacao: FiltroSituacaoMovimento = "todos") {
  return useQuery({
    queryKey: ["fin_movimentos_bancarios", exercicio, situacao],
    queryFn: async () => {
      const inicio = `${exercicio}-01-01`;
      const fim = `${exercicio}-12-31`;
      const todos: MovimentoBancario[] = [];
      for (let de = 0; ; de += TAMANHO_PAGINA) {
        let q = db
          .from("fin_movimentos_bancarios")
          .select(CAMPOS_MOVIMENTO)
          .or(
            `and(data_pagamento.gte.${inicio},data_pagamento.lte.${fim}),` +
              `and(data_pagamento.is.null,data_arquivo.gte.${inicio},data_arquivo.lte.${fim})`,
          )
          .order("data_pagamento", { ascending: false, nullsFirst: false })
          .order("id")
          .range(de, de + TAMANHO_PAGINA - 1);
        if (situacao === "sem_pagamento") q = q.is("pagamento_id", null);
        else if (situacao !== "todos") q = q.eq("situacao", situacao);
        const { data, error } = await q;
        if (error) throw error;
        const pagina = (data ?? []) as unknown as MovimentoBancario[];
        todos.push(...pagina);
        if (pagina.length < TAMANHO_PAGINA) break;
      }
      return comNomeDeQuemCorrigiu(todos);
    },
  });
}

/** Preenche `corrigido_por_nome` a partir de `profiles` (sem nome legível, fica null e a tela mostra "—"). */
async function comNomeDeQuemCorrigiu(movimentos: MovimentoBancario[]): Promise<MovimentoBancario[]> {
  const ids = [...new Set(movimentos.map((m) => m.corrigido_por).filter((id): id is string => !!id))];
  if (!ids.length) return movimentos;
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const nomes = new Map((data ?? []).map((p) => [p.id, p.full_name]));
  return movimentos.map((m) => (m.corrigido_por ? { ...m, corrigido_por_nome: nomes.get(m.corrigido_por) ?? null } : m));
}

/** Histórico bancário de um pagamento (remessa, retorno, reenvio). */
export function useMovimentosDoPagamento(pagamentoId: string | undefined) {
  return useQuery({
    queryKey: ["fin_movimentos_bancarios", "pagamento", pagamentoId],
    enabled: !!pagamentoId,
    queryFn: async () => {
      const { data, error } = await db
        .from("fin_movimentos_bancarios")
        .select(CAMPOS_MOVIMENTO)
        .eq("pagamento_id", pagamentoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MovimentoBancario[];
    },
  });
}

export interface PagamentoCandidato {
  id: string;
  numero: string;
  data_pagamento: string;
  valor_bruto: number;
  valor_liquido: number;
  status: string;
  fornecedor: { razao_social: string } | null;
}

/**
 * Pagamentos de um exercício para a conciliação manual (a tela ordena pelos de valor igual ao do movimento).
 * O exercício é o ano do movimento, não o escolhido na tela.
 */
export function usePagamentosParaConciliar(exercicio: number | null, habilitado: boolean) {
  return useQuery({
    queryKey: ["fin_pagamentos", exercicio, "conciliacao"],
    enabled: habilitado && !!exercicio,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_pagamentos")
        .select("id, numero, data_pagamento, valor_bruto, valor_liquido, status, fornecedor:fornecedores(razao_social)")
        .eq("exercicio", exercicio!)
        .neq("status", "cancelado")
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PagamentoCandidato[];
    },
  });
}

export function useConciliarMovimento() {
  const queryClient = useQueryClient();
  return useMutation({
    /**
     * `pagamentoId` null desvincula. A RPC recusa trocar um vínculo existente (desvincular antes) e exige
     * justificativa quando o valor líquido do pagamento não confere com o do movimento.
     */
    mutationFn: async ({
      movimentoId,
      pagamentoId,
      justificativa,
    }: {
      movimentoId: string;
      pagamentoId: string | null;
      justificativa?: string | null;
    }) => {
      const { error } = await supabase.rpc("conciliar_movimento_bancario", {
        p_movimento_id: movimentoId,
        p_pagamento_id: pagamentoId,
        p_justificativa: justificativa?.trim() || null,
      });
      if (error) throw error;
      return { desvinculou: pagamentoId === null };
    },
    onSuccess: async (r) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fin_movimentos_bancarios"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_pagamentos"] }),
      ]);
      toast.success(r.desvinculou ? "Movimento desvinculado do pagamento" : "Movimento conciliado com o pagamento");
    },
    onError: async (e) => toast.error("Não foi possível salvar a conciliação", { description: await mensagemErro(e) }),
  });
}

// ===========================================
// REENVIO DE RECUSADOS (Gestão MAX)
// ===========================================

/** Contas pagadoras ativas com convênio de pagamento (o convênio identifica o arquivo no Gestão MAX). */
export function useContasPagadoras() {
  return useQuery({
    queryKey: ["contas-autarquia", "convenio-pagamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_autarquia")
        .select(
          "id, descricao, agencia, agencia_digito, conta, conta_digito, convenio_pagamento, uso_principal, banco:bancos_cnab(codigo_banco, nome)",
        )
        .eq("ativo", true)
        .not("convenio_pagamento", "is", null)
        .order("descricao");
      if (error) throw error;
      return ((data ?? []) as unknown as ContaPagadora[]).filter((c) => (c.convenio_pagamento ?? "").trim());
    },
  });
}

export interface DadosPagador {
  cnpj: string;
  nome: string;
  endereco: PagadorGestaoMax["endereco"];
}

/**
 * CNPJ, nome e endereço do pagador: os da Configuração do cliente (`comIdentidadeDoCliente`), com o que estiver
 * vazio lá completado por `config_autarquia`; sem linha na Folha, o perfil do tenant.
 */
export function useDadosPagador() {
  return useQuery({
    queryKey: ["config-autarquia"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_autarquia").select("*").eq("ativo", true).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    select: (linha): DadosPagador => {
      const tenant = getTenantSnapshotOuNulo();
      // Razão social, CNPJ e endereço: os da Configuração do cliente
      const config = comIdentidadeDoCliente(linha, tenant);
      const temEndereco = !!config?.endereco_logradouro?.trim();
      const t = tenant?.endereco;
      return {
        cnpj: config?.cnpj ?? tenant?.legal?.cnpj ?? "",
        nome: config?.razao_social ?? tenant?.identidade.nomeOficial ?? "",
        endereco: temEndereco
          ? {
              logradouro: config?.endereco_logradouro ?? "",
              numero: config?.endereco_numero ?? "",
              complemento: config?.endereco_complemento ?? "",
              cidade: config?.endereco_cidade ?? "",
              cep: config?.endereco_cep ?? "",
              uf: config?.endereco_uf ?? "",
            }
          : {
              logradouro: t?.logradouro ?? "",
              numero: t?.numero ?? "",
              complemento: t?.complemento ?? "",
              cidade: t?.cidade ?? "",
              cep: t?.cep ?? "",
              uf: t?.uf ?? "",
            },
      };
    },
  });
}

export interface ContaCorrigidaInput {
  banco: string;
  agencia: string;
  agencia_dv: string;
  conta: string;
  conta_dv: string;
  justificativa: string;
  /** "Conta confere" na Validação de Contas do BB (exigido para banco 001, ou justificativa com 15+ caracteres) */
  validado_bb: boolean;
}

/** Grava a conta corrigida de um recusado (`corrigir_conta_movimento`); o reenvio usa esta conta. */
export function useCorrigirContaMovimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ movimentoId, dados }: { movimentoId: string; dados: ContaCorrigidaInput }) => {
      const { error } = await supabase.rpc("corrigir_conta_movimento", {
        p_movimento_id: movimentoId,
        p_banco: dados.banco,
        p_agencia: dados.agencia,
        p_agencia_dv: dados.agencia_dv,
        p_conta: dados.conta,
        p_conta_dv: dados.conta_dv,
        p_justificativa: dados.justificativa.trim(),
        p_validado_bb: dados.validado_bb,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fin_movimentos_bancarios"] });
      toast.success("Conta corrigida para o reenvio");
    },
    onError: async (e) => toast.error("Não foi possível corrigir a conta", { description: await mensagemErro(e) }),
  });
}

/** Arquivos de reenvio gerados (confirmados e reservas pendentes), do mais recente para o mais antigo. */
export function useRemessasBancarias() {
  return useQuery({
    queryKey: ["fin_remessas_bancarias"],
    queryFn: async () => {
      const { data, error } = await db
        .from("fin_remessas_bancarias")
        .select("id, layout, nsa, convenio, data_geracao, quantidade, valor_total, arquivo_sha256, created_at")
        .order("data_geracao", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as RemessaBancaria[];
    },
  });
}

export interface GerarRemessaInput {
  conta: ContaPagadora;
  pagador: DadosPagador;
  /** Movimentos recusados a reenviar; o servidor monta os créditos (com a conta corrigida) e os totais */
  movimentoIds: string[];
  /** Data do crédito (YYYY-MM-DD) */
  dataPagamento: string;
  servicoCreditoBB: "98" | "30";
  /** Menor NSA aceito (para continuar a numeração do Gestão MAX); null segue a do sistema */
  nsaMinimo: number | null;
}

/** Erro depois da reserva do NSA: a tela oferece cancelar a reserva (`cancelar_remessa_bancaria`). */
export class ErroRemessaReservada extends Error {
  constructor(
    message: string,
    readonly remessaId: string,
    readonly nsa: number,
  ) {
    super(message);
    this.name = "ErroRemessaReservada";
  }
}

function baixarArquivo(conteudo: Blob, nome: string) {
  const url = URL.createObjectURL(conteudo);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Monta o CNAB 240 só a partir do retrato devolvido pelo banco (créditos, conta, NSA, data/hora de geração) e
 * dos dados do pagador. A hora vem de `data_geracao` (no fuso do navegador): o mesmo retrato gera o mesmo arquivo.
 */
async function montarArquivo(remessa: RemessaRegistrada, pagador: DadosPagador, servicoCreditoBB: "98" | "30") {
  const dataGeracao = new Date(remessa.data_geracao);
  const dados: RemessaGestaoMax = {
    pagador: {
      cnpj: pagador.cnpj,
      nome: pagador.nome,
      convenio: remessa.convenio,
      agencia: remessa.agencia,
      agenciaDigito: remessa.agencia_digito ?? "",
      conta: remessa.conta,
      contaDigito: remessa.conta_digito ?? "",
      endereco: pagador.endereco,
    },
    nsa: remessa.nsa,
    dataGeracao,
    creditos: (remessa.creditos ?? []).map((c) => ({
      nome: c.nome ?? "",
      documento: c.documento ?? "",
      banco: c.banco ?? "",
      agencia: c.agencia ?? "",
      agencia_dv: c.agencia_dv ?? "",
      conta: c.conta ?? "",
      conta_dv: c.conta_dv ?? "",
      valor: Number(c.valor),
      data: remessa.data_pagamento,
      seu_numero: c.seu_numero ?? "",
    })),
    servicoCreditoBB,
  };
  const faltas = validarRemessaGestaoMax(dados);
  if (faltas.length) throw new Error(`Faltam dados para o arquivo: ${faltas.join("; ")}.`);
  const arquivo = gerarGestaoMaxCnab240(dados);
  const blob = new Blob([arquivo.conteudo], { type: "text/plain" });
  return {
    blob,
    sha256: await calcularSha256(blob),
    nome: nomeArquivoGestaoMax(remessa.convenio, dataGeracao, remessa.nsa),
    quantidade: arquivo.quantidade,
  };
}

/**
 * Reserva o NSA e os créditos no banco (`registrar_remessa_bancaria`), gera o CNAB 240 do Gestão MAX a partir do
 * retrato devolvido, confirma com o SHA-256 (`confirmar_remessa_bancaria`) e só então baixa o arquivo: o usuário
 * nunca recebe um arquivo que o sistema não registrou. Falha depois da reserva vira `ErroRemessaReservada`, para a
 * tela oferecer o cancelamento da reserva.
 */
export function useGerarRemessaGestaoMax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GerarRemessaInput) => {
      const { data, error } = await supabase.rpc("registrar_remessa_bancaria", {
        p_conta_autarquia_id: input.conta.id,
        p_layout: "gestao_max_cnab240",
        p_movimentos: input.movimentoIds,
        p_data_pagamento: input.dataPagamento,
        p_nsa_minimo: input.nsaMinimo,
        p_tipo_servico: input.servicoCreditoBB,
      });
      if (error) throw error;
      const remessa = data as unknown as RemessaRegistrada;

      try {
        const arquivo = await montarArquivo(remessa, input.pagador, remessa.tipo_servico);
        const { error: erroConfirmar } = await supabase.rpc("confirmar_remessa_bancaria", {
          p_id: remessa.id,
          p_sha256: arquivo.sha256,
        });
        if (erroConfirmar) throw erroConfirmar;
        baixarArquivo(arquivo.blob, arquivo.nome);
        return { nome: arquivo.nome, nsa: remessa.nsa, quantidade: arquivo.quantidade };
      } catch (e) {
        throw new ErroRemessaReservada(await mensagemErro(e), remessa.id, remessa.nsa);
      }
    },
    onSuccess: async (r) => {
      toast.success(`Arquivo ${r.nome} gerado`, {
        description: `${r.quantidade} crédito(s), NSA ${r.nsa}. Envie o arquivo pelo Gestão MAX.`,
      });
    },
    onError: async (e) => toast.error("O arquivo não foi gerado", { description: await mensagemErro(e) }),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fin_movimentos_bancarios"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_remessas_bancarias"] }),
      ]);
    },
  });
}

/** Libera uma reserva não confirmada (`cancelar_remessa_bancaria`): os créditos voltam a poder ser reenviados. */
export function useCancelarRemessaBancaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (remessaId: string) => {
      const { error } = await supabase.rpc("cancelar_remessa_bancaria", { p_id: remessaId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fin_movimentos_bancarios"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_pagamentos"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_remessas_bancarias"] }),
      ]);
      toast.success("Reserva cancelada", { description: "Os créditos voltam a poder ser reenviados." });
    },
    onError: async (e) => toast.error("Não foi possível cancelar a reserva", { description: await mensagemErro(e) }),
  });
}

/**
 * "Baixar novamente": lê o retrato (`obter_remessa_bancaria`), gera o arquivo de novo e só baixa se o SHA-256 for o
 * registrado, usando o tipo de pagamento BB (98/30) gravado na reserva. Se não bater (dados do pagador mudaram,
 * por exemplo), avisa e não baixa. A OBN600 sai só do retrato (não usa os dados do pagador).
 */
export function useBaixarRemessaNovamente() {
  return useMutation({
    mutationFn: async ({ remessaId, pagador }: { remessaId: string; pagador: DadosPagador | undefined }) => {
      const { data, error } = await supabase.rpc("obter_remessa_bancaria", { p_id: remessaId });
      if (error) throw error;
      const lida = data as unknown as RemessaRegistrada | RemessaObnRegistrada;
      if (!lida?.arquivo_sha256) throw new Error("Esta remessa não foi confirmada: não há arquivo registrado.");
      let arquivo: { blob: Blob; sha256: string; nome: string };
      if (lida.layout === "obn600") {
        arquivo = await montarArquivoObn600(lida as RemessaObnRegistrada);
      } else {
        if (!pagador) throw new Error("Dados do pagador não carregados.");
        const remessa = lida as RemessaRegistrada;
        arquivo = await montarArquivo(remessa, pagador, remessa.tipo_servico);
      }
      if (arquivo.sha256 === lida.arquivo_sha256) {
        baixarArquivo(arquivo.blob, arquivo.nome);
        return arquivo.nome;
      }
      throw new Error(
        "O arquivo gerado de novo não confere com o registrado (os dados do pagador ou da conta mudaram desde a " +
          "geração). Nada foi baixado.",
      );
    },
    onSuccess: (nome) => toast.success(`Arquivo ${nome} baixado`, { description: "Conferido com o registrado." }),
    onError: async (e) => toast.error("Não foi possível baixar de novo", { description: await mensagemErro(e) }),
  });
}

// ===========================================
// REMESSA OBN600 (ordens bancárias dos pagamentos)
// ===========================================

/** Contas pagadoras ativas com código do cliente, UG e gestão do OBN600. */
export function useContasPagadorasObn() {
  return useQuery({
    queryKey: ["contas-autarquia", "obn600"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_autarquia")
        .select("id, descricao, agencia, agencia_digito, conta, conta_digito, obn_codigo_cliente, obn_unidade_gestora, obn_gestao")
        .eq("ativo", true)
        .not("obn_codigo_cliente", "is", null)
        .order("descricao");
      if (error) throw error;
      return ((data ?? []) as unknown as ContaPagadoraObn[]).filter(
        (c) => c.obn_codigo_cliente?.trim() && c.obn_unidade_gestora?.trim() && c.obn_gestao?.trim(),
      );
    },
  });
}

/** Pagamentos programados ou autorizados do exercício que ainda não saíram numa remessa OBN600. */
export function usePagamentosParaRemessa(exercicio: number) {
  return useQuery({
    queryKey: ["fin_pagamentos", exercicio, "remessa_obn600"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_pagamentos")
        .select(
          "id, numero, exercicio, data_pagamento, valor_liquido, status, banco_favorecido, agencia_favorecido, " +
            "conta_favorecido, remessa_bancaria_id, " +
            "fornecedor:fornecedores(razao_social, cpf_cnpj, banco_codigo, agencia, conta)",
        )
        .eq("exercicio", exercicio)
        .in("status", ["programado", "autorizado"])
        .eq("estornado", false)
        .is("remessa_bancaria_id", null)
        .order("data_pagamento", { ascending: true })
        .order("numero");
      if (error) throw error;
      return (data ?? []) as unknown as PagamentoParaRemessa[];
    },
  });
}

/** Monta o OBN600 só a partir do retrato devolvido pelo banco; a hora vem de `data_geracao` (fuso do navegador). */
async function montarArquivoObn600(remessa: RemessaObnRegistrada) {
  const dataGeracao = new Date(remessa.data_geracao);
  const dados: RemessaObn600 = {
    pagador: {
      codigoCliente: remessa.convenio,
      unidadeGestora: remessa.parametros?.unidade_gestora ?? "",
      gestao: remessa.parametros?.gestao ?? "",
      agencia: remessa.agencia,
      agenciaDigito: remessa.agencia_digito ?? "",
      conta: remessa.conta,
      contaDigito: remessa.conta_digito ?? "",
    },
    sequencial: remessa.nsa,
    dataGeracao,
    ordens: (remessa.creditos ?? []).map((o) => ({
      relacao: o.relacao,
      numeroOb: o.numero_ob,
      data: remessa.data_pagamento,
      nome: o.nome ?? "",
      documento: o.documento ?? "",
      banco: o.banco ?? "",
      agencia: o.agencia ?? "",
      agencia_dv: o.agencia_dv ?? "",
      conta: o.conta ?? "",
      conta_dv: o.conta_dv ?? "",
      valor: Number(o.valor),
      endereco: o.endereco,
      municipio: o.municipio,
      cep: o.cep,
      uf: o.uf,
    })),
  };
  const faltas = validarRemessaObn600(dados);
  if (faltas.length) throw new Error(`Faltam dados para o arquivo: ${faltas.join("; ")}.`);
  const arquivo = gerarObn600Remessa(dados);
  // Arquivo do banco em Latin-1: o texto já sai só em ASCII (sem acento), então os bytes são os mesmos
  const blob = new Blob([arquivo.conteudo], { type: "text/plain" });
  return {
    blob,
    sha256: await calcularSha256(blob),
    nome: nomeArquivoObn600(dataGeracao, remessa.nsa),
    quantidade: arquivo.quantidade,
    valorTotalCentavos: arquivo.valorTotalCentavos,
  };
}

export interface GerarRemessaObnInput {
  contaId: string;
  pagamentoIds: string[];
  /** Data das OBs (YYYY-MM-DD) */
  dataPagamento: string;
  /** Nº da primeira remessa desta conta (continua a numeração de hoje); null segue a do sistema */
  sequencialMinimo: number | null;
}

/**
 * Reserva o nº da remessa e os pagamentos (`registrar_remessa_obn600`), gera o OBN600 a partir do retrato,
 * confirma com o SHA-256 (`confirmar_remessa_bancaria`, que grava o nº da OB em cada pagamento) e só então baixa o
 * arquivo. Falha depois da reserva vira `ErroRemessaReservada`, para a tela oferecer o cancelamento.
 */
export function useGerarRemessaObn600() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GerarRemessaObnInput) => {
      const { data, error } = await supabase.rpc("registrar_remessa_obn600", {
        p_conta_autarquia_id: input.contaId,
        p_pagamentos: input.pagamentoIds,
        p_data_pagamento: input.dataPagamento,
        p_sequencial_minimo: input.sequencialMinimo ?? undefined,
      });
      if (error) throw error;
      const remessa = data as unknown as RemessaObnRegistrada;

      try {
        const arquivo = await montarArquivoObn600(remessa);
        const { error: erroConfirmar } = await supabase.rpc("confirmar_remessa_bancaria", {
          p_id: remessa.id,
          p_sha256: arquivo.sha256,
        });
        if (erroConfirmar) throw erroConfirmar;
        baixarArquivo(arquivo.blob, arquivo.nome);
        return { nome: arquivo.nome, nsa: remessa.nsa, quantidade: arquivo.quantidade };
      } catch (e) {
        throw new ErroRemessaReservada(await mensagemErro(e), remessa.id, remessa.nsa);
      }
    },
    onSuccess: async (r) => {
      toast.success(`Arquivo ${r.nome} gerado`, {
        description: `${r.quantidade} ordem(ns) bancária(s), remessa nº ${r.nsa}. Envie o arquivo ao banco.`,
      });
    },
    onError: async (e) => toast.error("O arquivo não foi gerado", { description: await mensagemErro(e) }),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fin_pagamentos"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_remessas_bancarias"] }),
      ]);
    },
  });
}

// ===========================================
// BANCO DO BRASIL (Edge Function bb-api, só leitura)
// ===========================================

async function chamarBB<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("bb-api", { body: corpo });
  if (error) throw error;
  return data as T;
}

export function useStatusBB() {
  return useQuery({
    queryKey: ["bb-api", "status"],
    queryFn: () => chamarBB<StatusApiBB>({ acao: "status" }),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/**
 * Valida agência/conta no BB (só banco 001). O CPF/CNPJ é lido do movimento pelo servidor: não sai do navegador.
 */
export function useValidarContaBB() {
  return useMutation({
    mutationFn: (dados: { movimento_id: string; banco: string; agencia: string; conta: string }) =>
      chamarBB<ResultadoValidacaoConta>({ acao: "validar-conta", ...dados }),
  });
}

export function useImportarExtratoBB() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { conta_bancaria_id: string; data_inicio: string; data_fim: string }) =>
      chamarBB<ResultadoExtratoBB>({ acao: "extrato", ...dados }),
    onSuccess: async (r) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fin_extrato_lancamentos"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_pagamentos"] }),
      ]);
      toast.success("Extrato importado", {
        description:
          `${r?.recebidos_do_banco ?? 0} lançamento(s) do banco: ${r?.inseridos ?? 0} novo(s), ` +
          `${r?.existentes ?? 0} já importado(s), ${r?.conciliados ?? 0} conciliado(s) com pagamentos.`,
      });
    },
    onError: async (e) => toast.error("Não foi possível importar o extrato", { description: await mensagemErro(e) }),
  });
}

export function useExtratoLancamentos(contaBancariaId: string | undefined, inicio: string, fim: string) {
  return useQuery({
    queryKey: ["fin_extrato_lancamentos", contaBancariaId, inicio, fim],
    enabled: !!contaBancariaId && !!inicio && !!fim,
    queryFn: async () => {
      const { data, error } = await db
        .from("fin_extrato_lancamentos")
        .select("id, conta_bancaria_id, data_lancamento, valor, sinal, descricao, contrapartida_documento, pagamento_id")
        .eq("conta_bancaria_id", contaBancariaId)
        .gte("data_lancamento", inicio)
        .lte("data_lancamento", fim)
        .order("data_lancamento", { ascending: false })
        .limit(TAMANHO_PAGINA);
      if (error) throw error;
      return (data ?? []) as LancamentoExtrato[];
    },
  });
}

/** Extrato ligado a um pagamento (detalhe do pagamento). */
export function useExtratoDoPagamento(pagamentoId: string | undefined) {
  return useQuery({
    queryKey: ["fin_extrato_lancamentos", "pagamento", pagamentoId],
    enabled: !!pagamentoId,
    queryFn: async () => {
      const { data, error } = await db
        .from("fin_extrato_lancamentos")
        .select("id, conta_bancaria_id, data_lancamento, valor, sinal, descricao, contrapartida_documento, pagamento_id")
        .eq("pagamento_id", pagamentoId)
        .order("data_lancamento");
      if (error) throw error;
      return (data ?? []) as LancamentoExtrato[];
    },
  });
}

// ===========================================
// DETALHE DO PAGAMENTO
// ===========================================

export interface PagamentoDetalhe {
  id: string;
  numero: string;
  exercicio: number;
  data_pagamento: string;
  data_efetivacao: string | null;
  status: string;
  forma_pagamento: string;
  valor_bruto: number;
  valor_retencoes: number;
  valor_liquido: number;
  banco_favorecido: string | null;
  agencia_favorecido: string | null;
  conta_favorecido: string | null;
  identificador_transacao: string | null;
  observacoes: string | null;
  empenho: { id: string; numero: string; objeto: string | null } | null;
  liquidacao: { id: string; numero: string } | null;
  conta_bancaria: { id: string; nome_conta: string; banco_nome: string } | null;
  fornecedor: { id: string; razao_social: string } | null;
}

export function usePagamentoDetalhe(id: string | undefined) {
  return useQuery({
    queryKey: ["fin_pagamentos", "detalhe", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_pagamentos")
        .select(
          `id, numero, exercicio, data_pagamento, data_efetivacao, status, forma_pagamento, valor_bruto,
           valor_retencoes, valor_liquido, banco_favorecido, agencia_favorecido, conta_favorecido,
           identificador_transacao, observacoes,
           empenho:fin_empenhos(id, numero, objeto),
           liquidacao:fin_liquidacoes(id, numero),
           conta_bancaria:fin_contas_bancarias(id, nome_conta, banco_nome),
           fornecedor:fornecedores(id, razao_social)`,
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PagamentoDetalhe | null;
    },
  });
}
