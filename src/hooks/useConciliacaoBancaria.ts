/**
 * Conciliação bancária do Financeiro (spec docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md,
 * etapas 2 a 4): movimentos lidos dos arquivos do banco, conciliação manual com pagamentos, reenvio de recusados
 * pelo Gestão MAX e leitura das APIs do Banco do Brasil (Edge Function `bb-api`).
 *
 * As tabelas e RPCs novas (`fin_movimentos_bancarios`, `fin_extrato_lancamentos`, `conciliar_movimento_bancario`,
 * `registrar_remessa_bancaria`, `confirmar_remessa_bancaria`) ainda não estão em types.ts (gerado, não editar):
 * consultas pelo client sem tipagem (`db`), como em useArquivosFolha.ts, e RPC com `as never`.
 * A permissão é conferida de novo no banco (RLS e RPCs): a tela é só UX.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getTenantSnapshotOuNulo } from "@/core/tenant";
import { calcularSha256 } from "@/lib/importacao/arquivo";
import {
  gerarGestaoMaxCnab240,
  nomeArquivoGestaoMax,
  validarRemessaGestaoMax,
  type CreditoGestaoMax,
  type PagadorGestaoMax,
} from "@/lib/bancario/gestaoMaxCnab240";
import type {
  ContaPagadora,
  FiltroSituacaoMovimento,
  LancamentoExtrato,
  MovimentoBancario,
  RemessaRegistrada,
  ResultadoExtratoBB,
  ResultadoValidacaoConta,
  StatusApiBB,
} from "@/types/conciliacaoBancaria";

const db = supabase as unknown as SupabaseClient;

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
        const pagina = (data ?? []) as MovimentoBancario[];
        todos.push(...pagina);
        if (pagina.length < TAMANHO_PAGINA) break;
      }
      return todos;
    },
  });
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
      return (data ?? []) as MovimentoBancario[];
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

/** Pagamentos do exercício para a conciliação manual (a tela ordena pelos de valor igual ao do movimento). */
export function usePagamentosParaConciliar(exercicio: number, habilitado: boolean) {
  return useQuery({
    queryKey: ["fin_pagamentos", exercicio, "conciliacao"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_pagamentos")
        .select("id, numero, data_pagamento, valor_bruto, valor_liquido, status, fornecedor:fornecedores(razao_social)")
        .eq("exercicio", exercicio)
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
    mutationFn: async ({ movimentoId, pagamentoId }: { movimentoId: string; pagamentoId: string }) => {
      const { error } = await supabase.rpc("conciliar_movimento_bancario" as never, {
        p_movimento_id: movimentoId,
        p_pagamento_id: pagamentoId,
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fin_movimentos_bancarios"] }),
        queryClient.invalidateQueries({ queryKey: ["fin_pagamentos"] }),
      ]);
      toast.success("Movimento conciliado com o pagamento");
    },
    onError: async (e) => toast.error("Não foi possível conciliar", { description: await mensagemErro(e) }),
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
 * CNPJ, nome e endereço do pagador: de `config_autarquia` (Configurações da Folha); endereço sem logradouro lá
 * cai no perfil do tenant inteiro, como na remessa da folha.
 */
export function useDadosPagador() {
  return useQuery({
    queryKey: ["config-autarquia"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_autarquia").select("*").eq("ativo", true).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    select: (config): DadosPagador => {
      const tenant = getTenantSnapshotOuNulo();
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

export interface GerarRemessaInput {
  conta: ContaPagadora;
  pagador: DadosPagador;
  /** Movimentos recusados reenviados (na ordem do arquivo) e os créditos já com dados corrigidos */
  movimentos: { id: string; credito: Omit<CreditoGestaoMax, "seu_numero"> & { identificador: string } }[];
  servicoCreditoBB: "98" | "30";
  /** Menor NSA aceito (para continuar a numeração do Gestão MAX); null segue a do sistema */
  nsaMinimo: number | null;
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
 * Reserva o NSA (`registrar_remessa_bancaria`), gera o CNAB 240 do Gestão MAX, confirma com o SHA-256
 * (`confirmar_remessa_bancaria`) e só então baixa o arquivo: o usuário nunca recebe um arquivo que o sistema
 * não registrou. Se algo falhar depois da reserva, a remessa fica sem confirmação e a próxima tentativa do mesmo
 * usuário reaproveita o NSA reservado (regra da RPC).
 */
export function useGerarRemessaGestaoMax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GerarRemessaInput) => {
      const dataGeracao = new Date();
      const valorTotal = input.movimentos.reduce((s, m) => s + Math.round(m.credito.valor * 100), 0) / 100;

      const { data, error } = await supabase.rpc("registrar_remessa_bancaria" as never, {
        p_conta_autarquia_id: input.conta.id,
        p_layout: "gestao_max_cnab240",
        p_quantidade: input.movimentos.length,
        p_valor_total: valorTotal,
        p_movimentos: input.movimentos.map((m) => m.id),
        p_nsa_minimo: input.nsaMinimo,
      } as never);
      if (error) throw error;
      const remessa = data as unknown as RemessaRegistrada;

      // Seu número: o nº da OB/identificador original quando cabe (volta no retorno); senão NSA + sequência
      const creditos: CreditoGestaoMax[] = input.movimentos.map((m, i) => {
        const { identificador, ...credito } = m.credito;
        const seu = /^\d{1,20}$/.test(identificador) ? identificador : `${remessa.nsa}${String(i + 1).padStart(4, "0")}`;
        return { ...credito, seu_numero: seu };
      });
      const dados = {
        pagador: {
          cnpj: input.pagador.cnpj,
          nome: input.pagador.nome,
          convenio: remessa.convenio,
          agencia: remessa.agencia,
          agenciaDigito: remessa.agencia_digito ?? "",
          conta: remessa.conta,
          contaDigito: remessa.conta_digito ?? "",
          endereco: input.pagador.endereco,
        },
        nsa: remessa.nsa,
        dataGeracao,
        creditos,
        servicoCreditoBB: input.servicoCreditoBB,
      };
      const faltas = validarRemessaGestaoMax(dados);
      if (faltas.length) throw new Error(`Faltam dados para o arquivo: ${faltas.join("; ")}.`);

      const arquivo = gerarGestaoMaxCnab240(dados);
      const blob = new Blob([arquivo.conteudo], { type: "text/plain" });
      const sha256 = await calcularSha256(blob);

      const { error: erroConfirmar } = await supabase.rpc("confirmar_remessa_bancaria" as never, {
        p_id: remessa.id,
        p_sha256: sha256,
      } as never);
      if (erroConfirmar) throw erroConfirmar;

      const nome = nomeArquivoGestaoMax(remessa.convenio, dataGeracao, remessa.nsa);
      baixarArquivo(blob, nome);
      return { nome, nsa: remessa.nsa, quantidade: arquivo.quantidade };
    },
    onSuccess: async (r) => {
      await queryClient.invalidateQueries({ queryKey: ["fin_movimentos_bancarios"] });
      toast.success(`Arquivo ${r.nome} gerado`, {
        description: `${r.quantidade} crédito(s), NSA ${r.nsa}. Envie o arquivo pelo Gestão MAX.`,
      });
    },
    onError: async (e) => toast.error("O arquivo não foi gerado", { description: await mensagemErro(e) }),
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

/** Valida agência/conta/CPF-CNPJ no BB (só banco 001). Os dados vão só para a função, não para log. */
export function useValidarContaBB() {
  return useMutation({
    mutationFn: (dados: { agencia: string; conta: string; cpf_cnpj: string }) =>
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
