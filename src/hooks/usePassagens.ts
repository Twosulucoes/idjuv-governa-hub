/**
 * Passagens aéreas do módulo Contratos: pedidos (um por processo SEI), passageiros, trechos, cotações, beneficiários
 * e o contrato da agência. Migração 20261031090000; leitura com `contratos.passagens.visualizar`, escrita com
 * `contratos.passagens.editar`. O servidor e as viagens do RH chegam só pelas RPCs estreitas
 * (passagem_buscar_servidores, passagem_viagens_servidor), porque quem tem passagens não lê o RH.
 * Prestação de contas (migração 20261101090000): entregas e dispensas no pedido e no passageiro, anexos no bucket
 * privado `passagens` (`<pedido>/<passageiro ou "pedido">/<uuid>-<nome>`, baixados por URL assinada de 60 s), prazo
 * em module_settings (contratos) e a situação do relatório do RH por passagem_relatorio_rh.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { CHAVE_PRAZO, lerPrazo } from '@/lib/passagens/prestacao';
import { abrirArquivoPrivado } from '@/lib/storageArquivos';
import type {
  ContratoPassagens,
  PassagemAnexo,
  PassagemBeneficiario,
  PassagemCotacao,
  PassagemHistorico,
  PassagemPedido,
  PedidoCompleto,
  PedidoParaPendencias,
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
export type PrestacaoPassageiroInput = Pick<
  TablesUpdate<'passagem_passageiros'>,
  'embarque_entregue_em' | 'relatorio_entregue_em' | 'relatorio_documento_sei' | 'prestacao_dispensada' | 'prestacao_dispensa_motivo'
> & { id: string };
export type PrestacaoPedidoInput = Pick<
  TablesUpdate<'passagem_pedidos'>,
  'prestacao_contas' | 'prestacao_dispensa_motivo' | 'responsavel_passageiro_id' | 'relatorio_evento_entregue_em' | 'relatorio_evento_documento_sei'
>;
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
  if (erro?.code === '42501') {
    return erro.message?.includes('emitido') || erro.message?.includes('concluído') || erro.message?.includes('anexo')
      ? erro.message
      : 'Você não tem permissão para editar passagens.';
  }
  if (erro?.code === '23514') {
    if (texto.includes('dispensa_check')) return 'Escreva o motivo da dispensa.';
    if (texto.includes('Prestação de contas em aberto')) return erro.message!;
    return 'Faltam dados obrigatórios para esta situação.';
  }
  if (erro?.code === '22023' && erro.message) return erro.message;
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
      // os anexos do passageiro saem em cascata no banco; os arquivos, aqui
      const anexos = await supabase.from('passagem_anexos').select('caminho').eq('passageiro_id', id);
      if (anexos.error) throw anexos.error;
      const { error } = await supabase.from('passagem_passageiros').delete().eq('id', id);
      if (error) throw error;
      const caminhos = anexos.data.map((a) => a.caminho);
      if (caminhos.length) {
        const arquivos = await supabase.storage.from(BUCKET_PASSAGENS).remove(caminhos);
        if (arquivos.error) throw new Error('O passageiro saiu do pedido, mas os arquivos dele não foram apagados. Avise o suporte.');
      }
    },
    onSuccess: () => {
      invalidarPedido(qc, pedidoId);
      qc.invalidateQueries({ queryKey: ['passagem-anexos', pedidoId] });
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

/** Apaga a cotação; se era a escolhida, o trecho ainda não emitido volta a "a cotar" sem o voo dela. */
export function useRemoverCotacao(pedidoId: string) {
  const { qc, falha } = useAvisos();
  return useMutation({
    mutationFn: async (c: Pick<PassagemCotacao, 'id' | 'trecho_id' | 'escolhida'>) => {
      const { error } = await supabase.from('passagem_cotacoes').delete().eq('id', c.id);
      if (error) throw error;
      if (c.escolhida) {
        const trecho = await supabase
          .from('passagem_trechos')
          .update({ situacao: 'a_cotar', companhia: null, voo: null, partida: null, chegada: null })
          .eq('id', c.trecho_id)
          .eq('situacao', 'cotado');
        if (trecho.error) throw trecho.error;
      }
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
        .in('situacao', ['a_cotar', 'cotado']);
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
      qc.invalidateQueries({ queryKey: [CHAVE] }); // o banco recopia o nome nos pedidos
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
        .eq('controla_passagens', true)
        .order('ano', { ascending: false })
        .order('numero_contrato');
      if (error) throw error;
      return (data ?? []) as unknown as ContratoPassagens[];
    },
  });
}

/** Contratos já cadastrados que ainda não são da agência (para marcar um deles em vez de cadastrar de novo). */
export function useOutrosContratos(habilitado: boolean) {
  return useQuery({
    queryKey: ['passagens-outros-contratos'],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('id, numero_contrato, ano, objeto_resumido, fornecedor:fornecedores(razao_social, nome_fantasia)')
        .eq('controla_passagens', false)
        .order('ano', { ascending: false })
        .order('numero_contrato');
      if (error) throw error;
      return (data ?? []) as unknown as Pick<ContratoPassagens, 'id' | 'numero_contrato' | 'ano' | 'objeto_resumido' | 'fornecedor'>[];
    },
  });
}

export function useMarcarContratoPassagens() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contratos').update({ controla_passagens: true }).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passagens-contratos'] });
      qc.invalidateQueries({ queryKey: ['passagens-outros-contratos'] });
      ok('Contrato ligado às passagens');
    },
    onError: falha('Não foi possível usar o contrato'),
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
        .insert({ ...dados, valor_atual: dados.valor_inicial, status: 'vigente', controla_passagens: true })
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

// ---------------------------------------------------------------------------- prestação de contas
export const BUCKET_PASSAGENS = 'passagens';
const CHAVE_PRAZO_Q = 'passagens-prazo-prestacao';
const CHAVE_PENDENCIAS = 'passagens-pendencias';

/** Prazo da prestação (dias depois do retorno), em module_settings.settings do módulo contratos. */
export function usePrazoPrestacao() {
  return useQuery({
    queryKey: [CHAVE_PRAZO_Q],
    queryFn: async () => {
      const { data, error } = await supabase.from('module_settings').select('settings').eq('module_code', 'contratos').maybeSingle();
      if (error) throw error;
      return lerPrazo(data?.settings);
    },
  });
}

/** Só o papel admin grava module_settings (RLS catalogo_admin). Mantém as outras chaves de `settings`. */
export function useSalvarPrazoPrestacao() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (dias: number) => {
      const { data, error } = await supabase.from('module_settings').select('id, settings').eq('module_code', 'contratos').maybeSingle();
      if (error) throw error;
      const atual = data?.settings && typeof data.settings === 'object' && !Array.isArray(data.settings) ? data.settings : {};
      const settings = { ...atual, [CHAVE_PRAZO]: dias } as Json;
      const { error: e2 } = data
        ? await supabase.from('module_settings').update({ settings }).eq('id', data.id)
        : await supabase.from('module_settings').insert({ module_code: 'contratos', enabled: true, settings });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE_PRAZO_Q] });
      ok('Prazo atualizado');
    },
    onError: falha('Não foi possível mudar o prazo'),
  });
}

/** Relatório de viagem apresentado no RH, por passageiro servidor com viagem ligada (só a situação). */
export function useRelatorioRh(passageiroIds: string[]) {
  const ids = [...passageiroIds].sort();
  return useQuery({
    queryKey: ['passagens-relatorio-rh', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('passagem_relatorio_rh', { _passageiro_ids: ids });
      if (error) throw error;
      const mapa: Record<string, boolean> = {};
      for (const r of data ?? []) mapa[r.passageiro_id] = !!r.relatorio_apresentado;
      return mapa;
    },
  });
}

function invalidarPrestacao(qc: ReturnType<typeof useQueryClient>, pedidoId: string) {
  invalidarPedido(qc, pedidoId);
  qc.invalidateQueries({ queryKey: [CHAVE_PENDENCIAS] });
}

export function useSalvarPrestacaoPassageiro(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: PrestacaoPassageiroInput) => {
      const { error } = await supabase.from('passagem_passageiros').update(dados).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPrestacao(qc, pedidoId);
      ok('Prestação de contas atualizada');
    },
    onError: falha('Não foi possível salvar a prestação de contas'),
  });
}

export function useSalvarPrestacaoPedido(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (dados: PrestacaoPedidoInput) => {
      const { error } = await supabase.from('passagem_pedidos').update(dados).eq('id', pedidoId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarPrestacao(qc, pedidoId);
      ok('Prestação de contas atualizada');
    },
    onError: falha('Não foi possível salvar a prestação de contas'),
  });
}

/** Pedidos emitidos com os passageiros e os voos: a tela de Pendências calcula o que falta (prestacao.ts). */
export function usePedidosParaPendencias() {
  return useQuery({
    queryKey: [CHAVE_PENDENCIAS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passagem_pedidos')
        .select(
          'id, numero_sei, evento, solicitante_nome, prestacao_contas, relatorio_evento_entregue_em, '
            + 'passageiros:passagem_passageiros(id, nome, servidor_id, viagem_id, embarque_entregue_em, relatorio_entregue_em, prestacao_dispensada, '
            + 'trechos:passagem_trechos(data_voo, situacao, localizador))',
        )
        .eq('situacao', 'emitido');
      if (error) throw error;
      return (data ?? []) as unknown as PedidoParaPendencias[];
    },
  });
}

// ---------------------------------------------------------------------------- anexos (bucket privado)
export function useAnexosPedido(pedidoId: string | undefined) {
  return useQuery({
    queryKey: ['passagem-anexos', pedidoId],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await supabase.from('passagem_anexos').select('*').eq('pedido_id', pedidoId!).order('created_at');
      if (error) throw error;
      return (data ?? []) as PassagemAnexo[];
    },
  });
}

/** Nome seguro para o caminho no bucket: sem acento, sem barra nem `%`, até 80 caracteres. */
export function nomeParaCaminho(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+/, '')
    .slice(-80);
  return base || 'arquivo';
}

export const TIPOS_ARQUIVO_ANEXO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024;

export function useEnviarAnexo(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ arquivo, tipo, passageiroId }: { arquivo: File; tipo: PassagemAnexo['tipo']; passageiroId: string | null }) => {
      if (!TIPOS_ARQUIVO_ANEXO.includes(arquivo.type)) throw new Error('Envie PDF, JPG, PNG ou WEBP.');
      if (arquivo.size > TAMANHO_MAX_ANEXO) throw new Error('O arquivo passa de 10 MB.');
      const caminho = `${pedidoId}/${passageiroId ?? 'pedido'}/${crypto.randomUUID()}-${nomeParaCaminho(arquivo.name)}`;
      const envio = await supabase.storage.from(BUCKET_PASSAGENS).upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (envio.error) throw new Error('Não foi possível enviar o arquivo. Verifique sua permissão.');
      const { error } = await supabase.from('passagem_anexos').insert({
        pedido_id: pedidoId,
        passageiro_id: passageiroId,
        tipo,
        caminho,
        nome_arquivo: arquivo.name.slice(0, 255),
        tamanho_bytes: arquivo.size,
        mime_type: arquivo.type,
      });
      if (error) {
        await supabase.storage.from(BUCKET_PASSAGENS).remove([caminho]);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passagem-anexos', pedidoId] });
      ok('Arquivo anexado');
    },
    onError: falha('Não foi possível anexar o arquivo'),
  });
}

export function useRemoverAnexo(pedidoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (anexo: Pick<PassagemAnexo, 'id' | 'caminho'>) => {
      // a linha primeiro: o banco recusa apagar anexo de pedido concluído, e aí o arquivo fica
      const { error } = await supabase.from('passagem_anexos').delete().eq('id', anexo.id);
      if (error) throw error;
      const arquivo = await supabase.storage.from(BUCKET_PASSAGENS).remove([anexo.caminho]);
      if (arquivo.error) throw new Error('O anexo saiu da lista, mas o arquivo não foi apagado. Tente de novo mais tarde ou avise o suporte.');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passagem-anexos', pedidoId] });
      ok('Anexo removido');
    },
    onError: falha('Não foi possível remover o anexo'),
  });
}

/** Abre o anexo por URL assinada de 60 s (bucket privado). */
export const abrirAnexo = (caminho: string) => abrirArquivoPrivado(BUCKET_PASSAGENS, caminho, { validadeSegundos: 60 });
