/**
 * Acompanhamento de processos do SEI: modelos, lista, checklist e ações (RPCs wf_*).
 *
 * As tabelas/view/RPCs novas ainda não estão em src/integrations/supabase/types.ts (gerado), então o acesso passa
 * por `db`, um alias sem tipos usado SÓ neste arquivo. Os formatos de retorno vêm de @/types/workflow.
 * Toda escrita é por RPC (as tabelas do processo não têm policy de INSERT/UPDATE); o sigilo vale pela RLS.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  EtapaModelo,
  ItemChecklistModelo,
  ModeloProcesso,
  ModeloProcessoCompleto,
  NivelAcessoSigiloso,
  NivelSigilo,
  ProcessoAcompanhamento,
  RespostaChecklist,
  SituacaoPrazo,
} from '@/types/workflow';

// Único ponto de cast do arquivo (ver cabeçalho).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const CHAVE = 'wf-acompanhamento';

export interface FiltrosAcompanhamento {
  escopo: 'minha_unidade' | 'todos';
  modeloCodigo?: string;
  etapa?: number;
  unidadeId?: string;
  situacaoPrazo?: SituacaoPrazo;
  busca?: string;
}

/** Remove o que quebra a sintaxe do filtro .or() do PostgREST (vírgula, parênteses, %) e curingas/aspas/barras. */
export function escaparBusca(termo: string): string {
  return termo.replace(/[,()%*"\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Mensagem para o usuário a partir do erro de uma RPC (42501/22023 trazem texto em português do banco). */
export function mensagemErroProcesso(erro: unknown): string {
  const e = erro as { code?: string; message?: string } | null;
  if (e?.code === '40001') return 'O processo foi alterado por outra pessoa; recarregue a página e tente de novo.';
  return e?.message || 'Não foi possível concluir a operação.';
}

// ========================
// MODELOS
// ========================

export function useModelosProcesso() {
  return useQuery({
    queryKey: [CHAVE, 'modelos'],
    queryFn: async () => {
      const { data, error } = await db
        .from('processo_modelos')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return (data ?? []) as ModeloProcesso[];
    },
  });
}

export function useModeloProcesso(codigo: string) {
  return useQuery({
    queryKey: [CHAVE, 'modelo', codigo],
    enabled: !!codigo,
    queryFn: async (): Promise<ModeloProcessoCompleto | null> => {
      const { data: modelo, error } = await db
        .from('processo_modelos')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();
      if (error) throw error;
      if (!modelo) return null;
      const [etapas, checklist] = await Promise.all([
        db.from('processo_modelo_etapas').select('*').eq('modelo_id', modelo.id).order('ordem'),
        db.from('processo_modelo_checklist').select('*').eq('modelo_id', modelo.id).order('etapa_ordem').order('codigo'),
      ]);
      if (etapas.error) throw etapas.error;
      if (checklist.error) throw checklist.error;
      return {
        ...(modelo as ModeloProcesso),
        etapas: (etapas.data ?? []) as EtapaModelo[],
        checklist: (checklist.data ?? []) as ItemChecklistModelo[],
      };
    },
  });
}

// ========================
// LISTA E DETALHE
// ========================

/** Unidade da lotação ativa do usuário logado (profiles.servidor_id -> lotacoes). Nulo = sem lotação. */
function useUnidadeDoUsuario() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [CHAVE, 'minha-unidade', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<string | null> => {
      const { data: perfil, error: e1 } = await supabase
        .from('profiles')
        .select('servidor_id')
        .eq('id', user!.id)
        .maybeSingle();
      if (e1) throw e1;
      if (!perfil?.servidor_id) return null;
      const { data: lotacao, error: e2 } = await supabase
        .from('lotacoes')
        .select('unidade_id')
        .eq('servidor_id', perfil.servidor_id)
        .eq('ativo', true)
        .order('data_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (e2) throw e2;
      return lotacao?.unidade_id ?? null;
    },
  });
}

/**
 * Lista da view v_processos_acompanhamento. Escopo "minha_unidade": processos cuja unidade atual é a da lotação
 * vigente do usuário; sem lotação, `semLotacao` fica true e a lista vem vazia (a tela mostra o aviso).
 */
export function useProcessosAcompanhamento(filtros: FiltrosAcompanhamento) {
  const unidade = useUnidadeDoUsuario();
  const precisaUnidade = filtros.escopo === 'minha_unidade';
  const semLotacao = precisaUnidade && unidade.isSuccess && !unidade.data;

  const consulta = useQuery({
    queryKey: [CHAVE, 'lista', filtros, unidade.data ?? null],
    enabled: !precisaUnidade || (unidade.isSuccess && !!unidade.data),
    queryFn: async () => {
      let q = db.from('v_processos_acompanhamento').select('*').order('created_at', { ascending: false });
      if (precisaUnidade) q = q.eq('unidade_atual_id', unidade.data);
      if (filtros.modeloCodigo) q = q.eq('modelo_codigo', filtros.modeloCodigo);
      if (filtros.etapa) q = q.eq('etapa_atual_ordem', filtros.etapa);
      if (filtros.unidadeId) q = q.eq('unidade_atual_id', filtros.unidadeId);
      if (filtros.situacaoPrazo) q = q.eq('situacao_prazo', filtros.situacaoPrazo);
      const termo = filtros.busca ? escaparBusca(filtros.busca) : '';
      if (termo) {
        q = q.or(
          `assunto.ilike.%${termo}%,interessado_nome.ilike.%${termo}%,numero_sei.ilike.%${termo}%,numero_processo.ilike.%${termo}%`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProcessoAcompanhamento[];
    },
  });

  return {
    ...consulta,
    data: semLotacao ? ([] as ProcessoAcompanhamento[]) : consulta.data,
    isLoading: consulta.isLoading || (precisaUnidade && unidade.isLoading),
    semLotacao,
  };
}

export function useProcessoAcompanhamento(id: string) {
  return useQuery({
    queryKey: [CHAVE, 'processo', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from('v_processos_acompanhamento').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProcessoAcompanhamento | null;
    },
  });
}

/** Respostas já gravadas do checklist do processo (os itens vêm do modelo, em useModeloProcesso). */
export function useChecklistProcesso(id: string) {
  return useQuery({
    queryKey: [CHAVE, 'checklist', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from('processo_checklist_respostas').select('*').eq('processo_id', id);
      if (error) throw error;
      return (data ?? []) as RespostaChecklist[];
    },
  });
}

// ========================
// AÇÕES (RPCs)
// ========================

/** Fábrica de mutação: chama a RPC, invalida o acompanhamento e mostra a mensagem do servidor em caso de erro. */
function criarMutacaoRpc<V, R = void>(
  rpc: string,
  parametros: (v: V) => Record<string, unknown>,
  sucesso?: string,
) {
  return function useMutacaoRpc() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (v: V) => {
        const { data, error } = await db.rpc(rpc, parametros(v));
        if (error) throw error;
        return data as R;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [CHAVE] });
        if (sucesso) toast.success(sucesso);
      },
      onError: (erro) => {
        // 40001: outra pessoa mexeu; recarrega os dados para a tela não ficar defasada
        if ((erro as { code?: string })?.code === '40001') qc.invalidateQueries({ queryKey: [CHAVE] });
        toast.error(mensagemErroProcesso(erro));
      },
    });
  };
}

export interface AbrirProcessoInput {
  modeloCodigo: string;
  assunto: string;
  descricao?: string;
  interessadoTipo: 'interno' | 'externo';
  interessadoNome: string;
  interessadoDocumento?: string;
  sigilo?: NivelSigilo;
  numeroSei?: string;
}

/** Devolve o id do processo criado. */
export const useAbrirProcesso = criarMutacaoRpc<AbrirProcessoInput, string>(
  'wf_abrir_processo',
  (v) => ({
    p_modelo_codigo: v.modeloCodigo,
    p_assunto: v.assunto,
    p_descricao: v.descricao ?? null,
    p_interessado_tipo: v.interessadoTipo,
    p_interessado_nome: v.interessadoNome,
    p_interessado_documento: v.interessadoDocumento ?? null,
    p_sigilo: v.sigilo ?? 'publico',
    p_numero_sei: v.numeroSei ?? null,
  }),
  'Processo aberto.',
);

export const useMarcarItem = criarMutacaoRpc<{
  processoId: string;
  itemCodigo: string;
  marcado: boolean;
  observacao?: string;
}>('wf_marcar_item', (v) => ({
  p_processo_id: v.processoId,
  p_item_codigo: v.itemCodigo,
  p_marcado: v.marcado,
  p_observacao: v.observacao ?? null,
}));

export const useAvancarEtapa = criarMutacaoRpc<{ processoId: string; etapaEsperada: number; observacao?: string }>(
  'wf_avancar_etapa',
  (v) => ({ p_processo_id: v.processoId, p_etapa_esperada: v.etapaEsperada, p_observacao: v.observacao ?? null }),
  'Processo avançou de etapa.',
);

export const useDevolverEtapa = criarMutacaoRpc<{
  processoId: string;
  etapaEsperada: number;
  paraOrdem: number;
  motivo: string;
}>(
  'wf_devolver_etapa',
  (v) => ({
    p_processo_id: v.processoId,
    p_etapa_esperada: v.etapaEsperada,
    p_para_ordem: v.paraOrdem,
    p_motivo: v.motivo,
  }),
  'Processo devolvido.',
);

type AcaoComMotivo = { processoId: string; motivo?: string };
const comMotivo = (v: AcaoComMotivo) => ({ p_processo_id: v.processoId, p_motivo: v.motivo ?? null });

export const useSuspenderProcesso = criarMutacaoRpc<AcaoComMotivo>('wf_suspender', comMotivo, 'Processo suspenso.');
export const useReativarProcesso = criarMutacaoRpc<AcaoComMotivo>('wf_reativar', comMotivo, 'Processo reativado.');
export const useConcluirProcesso = criarMutacaoRpc<AcaoComMotivo>('wf_concluir', comMotivo, 'Processo concluído.');
export const useArquivarProcesso = criarMutacaoRpc<AcaoComMotivo>('wf_arquivar', comMotivo, 'Processo arquivado.');

export const useAtualizarNumeroSei = criarMutacaoRpc<{ processoId: string; numeroSei: string | null }>(
  'wf_atualizar_numero_sei',
  (v) => ({ p_processo_id: v.processoId, p_numero_sei: v.numeroSei }),
  'Número SEI atualizado.',
);

export const useConcederAcesso = criarMutacaoRpc<{
  processoId: string;
  usuarioId: string;
  nivel: NivelAcessoSigiloso;
  motivo?: string;
}>(
  'wf_conceder_acesso',
  (v) => ({
    p_processo_id: v.processoId,
    p_usuario_id: v.usuarioId,
    p_nivel: v.nivel,
    p_motivo: v.motivo ?? null,
  }),
  'Acesso concedido.',
);

export const useRevogarAcesso = criarMutacaoRpc<{ processoId: string; usuarioId: string }>(
  'wf_revogar_acesso',
  (v) => ({ p_processo_id: v.processoId, p_usuario_id: v.usuarioId }),
  'Acesso revogado.',
);
