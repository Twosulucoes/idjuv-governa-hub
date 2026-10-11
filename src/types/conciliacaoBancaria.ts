/**
 * Tipos da conciliação bancária (spec docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md,
 * etapas 2 a 4). As tabelas ainda não estão em src/integrations/supabase/types.ts (gerado): os tipos de linha
 * ficam aqui até a regeneração.
 */

import type {
  OrigemArquivoBancario,
  SentidoArquivoBancario,
  SituacaoMovimentoBancario,
  TipoLancamentoBancario,
} from "@/lib/bancario/comum";

export interface MovimentoBancario {
  id: string;
  importacao_id: string | null;
  origem: OrigemArquivoBancario;
  sentido: SentidoArquivoBancario;
  data_arquivo: string | null;
  sequencial_arquivo: number | null;
  tipo_lancamento: TipoLancamentoBancario | string;
  identificador: string;
  favorecido_nome: string | null;
  favorecido_documento: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  valor: number;
  data_pagamento: string | null;
  /** Data real do débito/crédito (retorno) */
  data_efetivacao: string | null;
  codigo_barras: string | null;
  autenticacao: string | null;
  situacao: SituacaoMovimentoBancario;
  codigo_retorno: string | null;
  motivo_recusa: string | null;
  pagamento_id: string | null;
  remessa_id: string | null;
  reenviado_em: string | null;
  /** Conta corrigida para o reenvio (`corrigir_conta_movimento`); o servidor usa esta no arquivo */
  conta_corrigida: ContaCorrigida | null;
  corrigido_por: string | null;
  corrigido_em: string | null;
  historico: unknown;
  created_at: string;
  pagamento?: { id: string; numero: string; status: string } | null;
  /** Nome de quem corrigiu (lido de `profiles` pela tela; não vem da tabela) */
  corrigido_por_nome?: string | null;
}

/** Filtro da aba Movimentos: as três situações e "sem pagamento" (não conciliado). */
export type FiltroSituacaoMovimento = "todos" | SituacaoMovimentoBancario | "sem_pagamento";

/** Conta pagadora (contas_autarquia) com convênio de pagamento. */
export interface ContaPagadora {
  id: string;
  descricao: string;
  agencia: string;
  agencia_digito: string | null;
  conta: string;
  conta_digito: string | null;
  convenio_pagamento: string | null;
  uso_principal: string | null;
  banco: { codigo_banco: string | null; nome: string | null } | null;
}

/** Crédito montado pelo servidor (com a conta corrigida, quando houver). */
export interface CreditoRemessa {
  movimento_id: string;
  pagamento_id: string | null;
  nome: string;
  documento: string;
  banco: string;
  agencia: string;
  agencia_dv: string | null;
  conta: string;
  conta_dv: string | null;
  valor: number;
  seu_numero: string;
}

/**
 * Retrato da remessa devolvido por `registrar_remessa_bancaria` e `obter_remessa_bancaria`: o arquivo é gerado
 * só a partir dele (inclusive data/hora de geração), para o SHA-256 ser reproduzível.
 */
export interface RemessaRegistrada {
  id: string;
  nsa: number;
  convenio: string;
  agencia: string;
  agencia_digito: string | null;
  conta: string;
  conta_digito: string | null;
  data_geracao: string;
  data_pagamento: string;
  /** Tipo de pagamento BB do lote de crédito em conta: 98 (diversos) ou 30 (salários) */
  tipo_servico: "98" | "30";
  creditos: CreditoRemessa[];
  /** Só em `obter_remessa_bancaria` (null = reserva não confirmada) */
  arquivo_sha256?: string | null;
}

/** Linha de `fin_remessas_bancarias` para a lista de arquivos gerados. */
export interface RemessaBancaria {
  id: string;
  layout: string;
  nsa: number;
  convenio: string;
  data_geracao: string;
  quantidade: number;
  valor_total: number;
  arquivo_sha256: string | null;
  created_at: string;
}

/** Conta corrigida de um recusado (`fin_movimentos_bancarios.conta_corrigida`). */
export interface ContaCorrigida {
  banco: string;
  agencia: string;
  agencia_dv: string | null;
  conta: string;
  conta_dv: string | null;
  validado_bb: boolean;
  justificativa: string;
}

export interface LancamentoExtrato {
  id: string;
  conta_bancaria_id: string;
  data_lancamento: string;
  valor: number;
  sinal: "C" | "D";
  descricao: string | null;
  contrapartida_documento: string | null;
  pagamento_id: string | null;
}

/** Teste de obtenção de token de uma API do BB (ação `status`). */
export interface TesteTokenBB {
  ok: boolean;
  erro?: string;
}

/** Resposta da ação `status` da Edge Function `bb-api`: só diz quais segredos existem, nunca os valores. */
export interface StatusApiBB {
  ambiente: string;
  /** Nome do segredo → configurado */
  configurado: Record<string, boolean>;
  mtls_pronto: boolean;
  token: { extrato: TesteTokenBB; validacao: TesteTokenBB };
}

/** Resposta de `validar-conta` (booleanos; 'S'/'N' aceito por compatibilidade com a especificação do BB). */
export interface ResultadoValidacaoConta {
  contaAtiva: boolean | "S" | "N" | null;
  titularConta: boolean | "S" | "N" | null;
}

/** Resposta de `extrato` (totais da RPC `registrar_extrato_bb`). */
export interface ResultadoExtratoBB {
  recebidos_do_banco?: number;
  inseridos?: number;
  existentes?: number;
  conciliados?: number;
}
