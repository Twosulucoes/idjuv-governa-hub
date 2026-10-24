/**
 * Passagens aéreas do módulo Contratos: pedidos (um por processo SEI), passageiros, trechos, cotações, beneficiários
 * e o contrato da agência. Migração 20261031090000; leitura com `contratos.passagens.visualizar`, escrita com
 * `contratos.passagens.editar`. O servidor e as viagens do RH chegam só pelas RPCs estreitas
 * (passagem_buscar_servidores, passagem_viagens_servidor), porque quem tem passagens não lê o RH.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type {
  ContratoPassagens,
  PassagemBeneficiario,
  PassagemHistorico,
  PassagemPedido,
  PedidoCompleto,
  PedidoResumo,
  ServidorParaPassagem,
  ViagemDoServidor,
} from '@/types/passagens';

export type PedidoInput = Omit<TablesInsert<'passagem_pedidos'>, 'situacao'> & { id?: string };
export type BeneficiarioInput = TablesInsert<'passagem_beneficiarios'> & { id?: string };
export type PassageiroInput = Pick<TablesInsert<'passagem_passageiros'>, 'pedido_id' | 'servidor_id' | 'beneficiario_id' | 'viagem_id' | 'observacoes'> & { id?: string };
export type TrechoInput = Pick<TablesInsert<'passagem_trechos'>, 'passageiro_id' | 'ordem' | 'origem' | 'destino' | 'data_voo' | 'observacoes'> & { id?: string };
export type TrechoAlteracao = TablesUpdate<'passagem_trechos'> & { id: string };
export type CotacaoInput = Pick<TablesInsert<'passagem_cotacoes'>, 'trecho_id' | 'companhia' | 'voo' | 'partida' | 'chegada' | 'valor' | 'observacoes'>;
export type SituacaoInput = Pick<TablesUpdate<'passagem_pedidos'>, 'situacao' | 'aprovacao_documento_sei' | 'aprovacao_data' | 'cancelamento_motivo'> & { id: string };
export type ContratoInput = Pick<
  TablesInsert<'contratos'>,
  'numero_contrato' | 'ano' | 'fornecedor_id' | 'objeto' | 'objeto_resumido' | 'valor_inicial' | 'data_assinatura' | 'data_inicio' | 'data_fim'
>;

const CHAVE = 'passagens-pedidos';
const CHAVE_BENEF = 'passagens-beneficiarios';

function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string; details?: string };
  const texto = `${erro?.message ?? ''} ${erro?.details ?? ''}`;
  if (erro?.code === '23505') {
    if (texto.includes('numero_sei')) return 'Já existe pedido com este processo SEI.';
    if (texto.includes('cpf')) return 'Já existe beneficiário com este CPF.';
    if (texto.includes('passageiros')) return 'Esta pessoa já é passageira deste pedido.';
    if (texto.includes('escolhida')) return 'Este trecho já tem uma cotação escolhida.';
    return 'Registro repetido.';
  }
  if (erro?.code === '42501') return erro.message?.includes('emitido') ? erro.message : 'Você não tem permissão para editar passagens.';
  if (erro?.code === '23514') return 'Faltam dados obrigatórios para esta situação.';
  return erro?.message || 'Erro inesperado.';
}

function useAvisos() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return {
    qc,
    ok: (titulo: string) => toast({ title: titulo }),
    falha: (titulo: string) => (e: unknown) => toast({ title: titulo, description: mensagemErro(e), variant: 'destructive' }),
  };
}

// ---------------------------------------------------------------------------- pedidos
const SELECT_RESUMO =
  '*, passageiros:passagem_passageiros(id, nome, trechos:passagem_trechos(id, situacao, localizador, valor_emissao, valor_multa, valor_reembolso))';

export function usePedidos() {
  return useQuery({
    queryKey: [CHAVE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passagem_pedidos')
        .select(SELECT_RESUMO)
        .order('data_pedido', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PedidoResumo[];
    },
  });
}

export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: ['passagem-pedido', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passagem_pedidos')
        .select('*, passageiros:passagem_passageiros(*, trechos:passagem_trechos(*, cotacoes:passagem_cotacoes(*)))')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const pedido = data as unknown as PedidoCompleto;
      pedido.passageiros.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''));
      for (const p of pedido.passageiros) {
        p.trechos.sort((a, b) => a.ordem - b.ordem || a.data_voo.localeCompare(b.data_voo));
        for (const t of p.trechos) t.cotacoes.sort((a, b) => Number(a.valor) - Number(b.valor));
      }
      return pedido;
    },
  });
}

export function useHistoricoPedido(id: string | undefined) {
  return useQuery({
    queryKey: ['passagem-historico', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passagem_historico')
        .select('*')
        .eq('pedido_id', id!)
        .order('feito_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PassagemHistorico[];
    },
  });
}

/** Invalida a lista, a ficha e a trilha do pedido. */
function invalidarPedido(qc: ReturnType<typeof useQueryClient>, pedidoId: string) {
  qc.invalidateQueries({ queryKey: [CHAVE] });
  qc.invalidateQueries({ queryKey: ['passagem-pedido', pedidoId] });
  qc.invalidateQueries({ queryKey: ['passagem-historico', pedidoId] });
}

export function useSalvarPedido() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: PedidoInput) => {
      const consulta = id
        ? supabase.from('passagem_pedidos').update(dados).eq('id', id)
        : supabase.from('passagem_pedidos').insert(dados);
      const { data, error } = await consulta.select('*').single();
      if (error) throw error;
      return data as PassagemPedido;
    },
    onSuccess: (p) => {
      invalidarPedido(qc, p.id);
      ok('Pedido salvo');
    },
    onError: falha('Não foi possível salvar o pedido'),
  });
}

export function useMudarSituacao() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: SituacaoInput) => {
      const { error } = await supabase.from('passagem_pedidos').update(dados).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      invalidarPedido(qc, id);
      ok('Situação atualizada');
    },
    onError: falha('Não foi possível mudar a situação'),
  });
}

// ---------------------------------------------------------------------------- passageiros, trechos e cotações
export function useSalvarPassageiro(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: PassageiroInput) => {
      const { error } = id
        ? await supabase.from('passagem_passageiros').update(dados).eq('id', id)
        : await supabase.from('passagem_passageiros').insert(dados);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      qc.invalidateQueries({ queryKey: [CHAVE_BENEF] });
      ok('Passageiro salvo');
    },
    onError: falha('Não foi possível salvar o passageiro'),
  });
}

export function useRemoverPassageiro(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('passagem_passageiros').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      ok('Passageiro removido');
    },
    onError: falha('Não foi possível remover o passageiro'),
  });
}

export function useSalvarTrecho(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: TrechoInput) => {
      const { error } = id
        ? await supabase.from('passagem_trechos').update(dados).eq('id', id)
        : await supabase.from('passagem_trechos').insert(dados);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      ok('Trecho salvo');
    },
    onError: falha('Não foi possível salvar o trecho'),
  });
}

/** Emissão, remarcação, cancelamento ou reembolso: grava os campos do bilhete e a nova situação. */
export function useAlterarTrecho(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: TrechoAlteracao) => {
      const { error } = await supabase.from('passagem_trechos').update(dados).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      ok('Trecho atualizado');
    },
    onError: falha('Não foi possível atualizar o trecho'),
  });
}

export function useRemoverTrecho(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('passagem_trechos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      ok('Trecho removido');
    },
    onError: falha('Não foi possível remover o trecho'),
  });
}

export function useSalvarCotacao(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (dados: CotacaoInput) => {
      const { error } = await supabase.from('passagem_cotacoes').insert(dados);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      ok('Cotação registrada');
    },
    onError: falha('Não foi possível registrar a cotação'),
  });
}

export function useRemoverCotacao(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('passagem_cotacoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidarPedido(qc, pedidoId),
    onError: falha('Não foi possível remover a cotação'),
  });
}

/** Marca a cotação escolhida do trecho (desmarca a anterior) e copia o voo para o trecho, que passa a "cotado". */
export function useEscolherCotacao(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ trechoId, cotacaoId }: { trechoId: string; cotacaoId: string }) => {
      const desmarca = await supabase.from('passagem_cotacoes').update({ escolhida: false }).eq('trecho_id', trechoId).eq('escolhida', true);
      if (desmarca.error) throw desmarca.error;
      const { data, error } = await supabase
        .from('passagem_cotacoes')
        .update({ escolhida: true })
        .eq('id', cotacaoId)
        .select('companhia, voo, partida, chegada')
        .single();
      if (error) throw error;
      const trecho = await supabase
        .from('passagem_trechos')
        .update({ situacao: 'cotado', companhia: data.companhia, voo: data.voo, partida: data.partida, chegada: data.chegada })
        .eq('id', trechoId)
        .eq('situacao', 'a_cotar');
      if (trecho.error) throw trecho.error;
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      ok('Cotação escolhida');
    },
    onError: falha('Não foi possível escolher a cotação'),
  });
}

// ---------------------------------------------------------------------------- beneficiários
export function useBeneficiarios() {
  return useQuery({
    queryKey: [CHAVE_BENEF],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passagem_beneficiarios')
        .select('*, viagens:passagem_passageiros(id, pedido:passagem_pedidos(id, numero_sei, evento, data_inicio, situacao))')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as (PassagemBeneficiario & {
        viagens: { id: string; pedido: Pick<PassagemPedido, 'id' | 'numero_sei' | 'evento' | 'data_inicio' | 'situacao'> | null }[];
      })[];
    },
  });
}

export function useSalvarBeneficiario() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: BeneficiarioInput) => {
      const consulta = id
        ? supabase.from('passagem_beneficiarios').update(dados).eq('id', id)
        : supabase.from('passagem_beneficiarios').insert(dados);
      const { data, error } = await consulta.select('*').single();
      if (error) throw error;
      return data as PassagemBeneficiario;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE_BENEF] });
      ok('Beneficiário salvo');
    },
    onError: falha('Não foi possível salvar o beneficiário'),
  });
}

// ---------------------------------------------------------------------------- RH (leitura estreita)
export function useBuscarServidores(termo: string) {
  const t = termo.trim();
  return useQuery({
    queryKey: ['passagem-servidores', t],
    enabled: t.length >= 3,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('passagem_buscar_servidores', { _termo: t });
      if (error) throw error;
      return (data ?? []) as ServidorParaPassagem[];
    },
  });
}

export function useViagensServidor(servidorId: string | null | undefined) {
  return useQuery({
    queryKey: ['passagem-viagens-servidor', servidorId],
    enabled: !!servidorId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('passagem_viagens_servidor', { _servidor_id: servidorId! });
      if (error) throw error;
      return (data ?? []) as ViagemDoServidor[];
    },
  });
}

// ---------------------------------------------------------------------------- contrato da agência
export function useContratosPassagens() {
  return useQuery({
    queryKey: ['passagens-contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('id, numero_contrato, ano, objeto, objeto_resumido, valor_atual, data_inicio, data_fim, data_fim_atual, fornecedor:fornecedores(razao_social, nome_fantasia)')
        .order('ano', { ascending: false })
        .order('numero_contrato');
      if (error) throw error;
      return (data ?? []) as unknown as ContratoPassagens[];
    },
  });
}

export function useFornecedoresContrato() {
  return useQuery({
    queryKey: ['passagens-fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('id, razao_social, nome_fantasia, cpf_cnpj').order('razao_social');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCadastrarContrato() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (dados: ContratoInput) => {
      const { data, error } = await supabase
        .from('contratos')
        .insert({ ...dados, valor_atual: dados.valor_inicial, status: 'vigente' })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passagens-contratos'] });
      ok('Contrato cadastrado');
    },
    onError: falha('Não foi possível cadastrar o contrato'),
  });
}
