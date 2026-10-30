/**
 * Contratos (entregas C1 e C2): lista, ficha, itens, responsáveis, alterações, providência do vencimento e histórico.
 * A planilha entra pelo importador aberto na lista de contratos (src/lib/importacao/importadores/contratosPlanilha.ts).
 * Migrações 20261104090000 e 20261114090000. Ler: módulo Compras ou Contratos. Cadastrar: `contratos.criar`; alterar:
 * `contratos.editar`; apagar só rascunho, com editar (gatilho contratos_conferir_permissao). Alteração (aditivo,
 * apostilamento, suspensão, rescisão) só com `contratos.editar`; o banco recalcula o valor atual, o fim e a situação.
 * O servidor chega pela RPC estreita contrato_buscar_servidores, porque quem tem Contratos não lê o RH.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type {
  ContratadoResumo,
  ContratoAlteracao,
  ContratoFicha,
  ContratoLista,
  ContratoResponsavel,
  ItemContrato,
  RegistroHistorico,
} from '@/types/contratos';
import type { ServidorParaPassagem } from '@/types/passagens';

export type ContratoInput = TablesInsert<'contratos'> & { id?: string };
export type ItemInput = Pick<
  TablesInsert<'itens_contrato'>,
  'contrato_id' | 'numero_item' | 'descricao' | 'unidade_medida' | 'quantidade' | 'valor_unitario'
> & { id?: string };
export type DesignacaoInput = Pick<
  TablesInsert<'contrato_responsaveis'>,
  'contrato_id' | 'servidor_id' | 'papel' | 'portaria_numero' | 'portaria_documento_sei' | 'portaria_data' | 'data_inicio' | 'observacoes'
>;
export type EncerramentoInput = Pick<TablesUpdate<'contrato_responsaveis'>, 'data_fim' | 'motivo_saida'> & { id: string; contrato_id: string };
export type AlteracaoInput = Omit<TablesInsert<'contrato_alteracoes'>, 'created_at' | 'created_by' | 'updated_at' | 'updated_by'> & { id?: string };
export type RetomadaInput = Pick<TablesUpdate<'contrato_alteracoes'>, 'data_retomada' | 'documento_retomada_sei'> & { id: string; contrato_id: string };
export type ProvidenciaInput = Pick<TablesUpdate<'contratos'>, 'renovacao_providencia' | 'renovacao_processo_sei' | 'renovacao_observacao'> & { id: string };

const CHAVE = 'contratos';
/** Teto da lista numa leitura (o PostgREST corta em 1000); a tela avisa quando chega nele. */
export const LIMITE_LISTA = 1000;

function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string; details?: string };
  const texto = `${erro?.message ?? ''} ${erro?.details ?? ''}`;
  if (erro?.code === '23505') {
    if (texto.includes('contratos_numero_ano_key')) return 'Já existe contrato com este número neste ano.';
    if (texto.includes('gestor_ativo')) return 'O contrato já tem um gestor ativo. Encerre a designação dele antes.';
    if (texto.includes('papel_ativo')) return 'Este servidor já está designado neste papel.';
    if (texto.includes('cpf_cnpj')) return 'Já existe contratado com este CPF ou CNPJ.';
    if (texto.includes('uq_contrato_alteracoes_numero')) return 'Já existe alteração desta espécie com este número.';
    if (texto.includes('uq_contrato_alteracoes_rescisao')) return 'O contrato já tem uma rescisão registrada.';
    if (texto.includes('uq_contrato_alteracoes_partida')) return 'O contrato já tem a situação anterior ao sistema.';
    if (texto.includes('uq_contrato_alteracoes_suspensao_aberta')) return 'Já há uma suspensão em aberto: registre a retomada dela antes.';
    return 'Registro repetido.';
  }
  if (erro?.code === '42501') {
    return erro.message && !erro.message.includes('row-level security')
      ? erro.message
      : 'Você não tem permissão para esta ação em Contratos.';
  }
  if (erro?.code === '23514') {
    if (texto.includes('saida_check')) return 'Informe o motivo da saída.';
    if (texto.includes('periodo_check')) return 'O fim da designação não pode ser antes do início.';
    if (texto.includes('vigencia_check')) return 'O fim da vigência não pode ser antes do início.';
    if (texto.includes('alteracoes_aditivo_check')) {
      return 'No aditivo, marque o que ele muda (prazo pede o novo fim; valor pede o acréscimo ou a supressão) e informe a assinatura.';
    }
    if (texto.includes('alteracoes_apostilamento_check')) {
      return 'No apostilamento, informe o motivo e a assinatura; diferença de valor só no reajuste, na repactuação e em "outro".';
    }
    if (texto.includes('alteracoes_valores_check')) {
      return 'Acréscimo e supressão só no termo aditivo; diferença de valor só no apostilamento e na situação anterior.';
    }
    if (texto.includes('alteracoes_suspensao_check')) return 'Informe o início da suspensão; a retomada não pode ser antes dele.';
    if (texto.includes('alteracoes_rescisao_check')) return 'Na rescisão, informe a data e a forma.';
    if (texto.includes('alteracoes_partida_check')) return 'A situação anterior precisa de uma diferença de valor ou de um fim.';
    if (texto.includes('alteracoes_percentual_check')) return 'Percentual só no reajuste ou na repactuação, entre -100% e 1000%.';
    if (texto.includes('alteracoes_numero_check')) return 'Informe o número (de 1 a 999).';
    if (texto.includes('valores_check')) return 'Os valores não podem ser negativos.';
    if (texto.includes('textos_check') || texto.includes('renovacao_')) return 'Algum texto passou do tamanho máximo.';
    return 'Algum campo está fora do permitido.';
  }
  if (erro?.code === '23503') return 'Este registro está ligado a outro e não pode ser apagado.';
  if (erro?.code === '22001') return 'Algum campo passou do tamanho máximo.';
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

/** [CHAVE] cobre lista, itens, responsáveis, alterações, histórico e Vencimentos. */
const invalidarContrato = (qc: ReturnType<typeof useQueryClient>, id?: string) => {
  qc.invalidateQueries({ queryKey: [CHAVE] });
  qc.invalidateQueries({ queryKey: ['contratos-dashboard-stats'] });
  qc.invalidateQueries({ queryKey: ['contratos-meus-vencimentos'] });
  qc.invalidateQueries({ queryKey: ['passagens-contratos'] });
  if (id) qc.invalidateQueries({ queryKey: ['contrato', id] });
};

// ---------------------------------------------------------------------------- lista e ficha
const SELECT_LISTA =
  'id, numero_contrato, ano, processo_sei, objeto, objeto_resumido, tipo_contrato, status, valor_inicial, valor_atual, '
  + 'data_inicio, data_fim, data_fim_atual, controla_passagens, unidade_demandante_id, '
  + 'fornecedor:fornecedores(id, razao_social, nome_fantasia, cpf_cnpj), '
  + 'unidade:estrutura_organizacional!contratos_unidade_demandante_id_fkey(sigla, nome), '
  + 'responsaveis:contrato_responsaveis(papel, nome, servidor_id, data_fim)';

export function useContratosLista() {
  return useQuery({
    queryKey: [CHAVE, 'lista'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select(SELECT_LISTA)
        .order('ano', { ascending: false })
        .order('numero_contrato', { ascending: false })
        .range(0, LIMITE_LISTA - 1);
      if (error) throw error;
      return (data ?? []) as unknown as ContratoLista[];
    },
  });
}

export function useContrato(id: string | undefined) {
  return useQuery({
    queryKey: ['contrato', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select(
          '*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cpf_cnpj), '
          + 'unidade:estrutura_organizacional!contratos_unidade_demandante_id_fkey(id, sigla, nome)',
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ContratoFicha | null;
    },
  });
}

export function useSalvarContrato() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: ContratoInput) => {
      if (id) {
        const { error } = await supabase.from('contratos').update(dados).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('contratos').insert(dados).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id, vars) => {
      invalidarContrato(qc, id);
      ok(vars.id ? 'Contrato atualizado' : 'Contrato cadastrado');
    },
    onError: falha('Não foi possível salvar o contrato'),
  });
}

export function useExcluirContrato() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('contratos').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) throw { code: '42501', message: 'Só quem pode editar contratos apaga um rascunho.' };
    },
    onSuccess: () => {
      invalidarContrato(qc);
      ok('Rascunho apagado');
    },
    onError: falha('Não foi possível apagar'),
  });
}

/** Processos de contratação que o usuário enxerga (Compras), para ligar o contrato ao processo de origem. */
export function useProcessosContratacao(habilitado: boolean) {
  return useQuery({
    queryKey: [CHAVE, 'processos-contratacao'],
    enabled: habilitado,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos_licitatorios')
        .select('id, numero_processo, ano, objeto_resumido, objeto')
        .order('ano', { ascending: false })
        .order('numero_processo');
      // sem a permissão de Compras a RLS devolve vazio; erro de rede ainda aparece
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------- contratados
export function useContratados(habilitado = true) {
  return useQuery({
    queryKey: [CHAVE, 'contratados'],
    enabled: habilitado,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, razao_social, nome_fantasia, cpf_cnpj')
        .order('razao_social');
      if (error) throw error;
      return (data ?? []) as ContratadoResumo[];
    },
  });
}

export function useCadastrarContratado() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (dados: { cpf_cnpj: string; razao_social: string; nome_fantasia?: string | null }) => {
      const digitos = dados.cpf_cnpj.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...dados, tipo_pessoa: digitos.length === 14 ? 'PJ' : 'PF' })
        .select('id, razao_social, nome_fantasia, cpf_cnpj')
        .single();
      if (error) throw error;
      return data as ContratadoResumo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE, 'contratados'] });
      qc.invalidateQueries({ queryKey: ['passagens-fornecedores'] });
      ok('Contratado cadastrado');
    },
    onError: falha('Não foi possível cadastrar o contratado'),
  });
}

// ---------------------------------------------------------------------------- itens
export function useItensContrato(contratoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'itens', contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itens_contrato')
        .select('*')
        .eq('contrato_id', contratoId!)
        .order('numero_item');
      if (error) throw error;
      return (data ?? []) as ItemContrato[];
    },
  });
}

export function useSalvarItem() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: ItemInput) => {
      const { error } = id
        ? await supabase.from('itens_contrato').update(dados).eq('id', id)
        : await supabase.from('itens_contrato').insert(dados);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: [CHAVE, 'itens', vars.contrato_id] });
      qc.invalidateQueries({ queryKey: [CHAVE, 'historico', vars.contrato_id] });
      ok(vars.id ? 'Item atualizado' : 'Item incluído');
    },
    onError: falha('Não foi possível salvar o item'),
  });
}

export function useExcluirItem() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id }: { id: string; contrato_id: string }) => {
      const { data, error } = await supabase.from('itens_contrato').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) throw { code: '42501', message: 'Só quem pode editar contratos apaga um item.' };
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: [CHAVE, 'itens', vars.contrato_id] });
      qc.invalidateQueries({ queryKey: [CHAVE, 'historico', vars.contrato_id] });
      ok('Item apagado');
    },
    onError: falha('Não foi possível apagar o item'),
  });
}

// ---------------------------------------------------------------------------- responsáveis
export function useResponsaveisContrato(contratoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'responsaveis', contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_responsaveis')
        .select('*')
        .eq('contrato_id', contratoId!)
        .order('data_fim', { ascending: false, nullsFirst: true })
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContratoResponsavel[];
    },
  });
}

/** Servidores ativos por nome ou matrícula (RPC estreita: só nome, matrícula e cargo). */
export function useBuscarServidoresContrato(termo: string) {
  const t = termo.trim();
  return useQuery({
    queryKey: ['contrato-servidores', t],
    enabled: t.length >= 3,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('contrato_buscar_servidores', { _termo: t });
      if (error) throw error;
      return (data ?? []) as ServidorParaPassagem[];
    },
  });
}

const invalidarResponsaveis = (qc: ReturnType<typeof useQueryClient>, contratoId: string) => {
  qc.invalidateQueries({ queryKey: [CHAVE, 'responsaveis', contratoId] });
  qc.invalidateQueries({ queryKey: [CHAVE, 'historico', contratoId] });
  qc.invalidateQueries({ queryKey: [CHAVE, 'lista'] });
  qc.invalidateQueries({ queryKey: [CHAVE, 'vencimentos'] });
  qc.invalidateQueries({ queryKey: ['contratos-dashboard-stats'] });
  qc.invalidateQueries({ queryKey: ['contratos-meus-vencimentos'] });
};

export function useDesignarResponsavel() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async (dados: DesignacaoInput) => {
      const { error } = await supabase.from('contrato_responsaveis').insert(dados);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      invalidarResponsaveis(qc, vars.contrato_id);
      ok('Designação registrada');
    },
    onError: falha('Não foi possível designar'),
  });
}

export function useEncerrarDesignacao() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, contrato_id: _c, ...dados }: EncerramentoInput) => {
      const { error } = await supabase.from('contrato_responsaveis').update(dados).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      invalidarResponsaveis(qc, vars.contrato_id);
      ok('Designação encerrada');
    },
    onError: falha('Não foi possível encerrar a designação'),
  });
}

// ---------------------------------------------------------------------------- alterações (C2)
export function useAlteracoesContrato(contratoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'alteracoes', contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_alteracoes')
        .select('*')
        .eq('contrato_id', contratoId!)
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as ContratoAlteracao[];
    },
  });
}

/** Sem linha de volta = a RLS barrou (só contratos.editar grava alteração). */
const conferirGravou = (data: unknown[] | null, mensagem: string) => {
  if (!data?.length) throw { code: '42501', message: mensagem };
};

export function useSalvarAlteracao() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: AlteracaoInput) => {
      if (id) {
        const { contrato_id: _c, ...campos } = dados;
        const { data, error } = await supabase.from('contrato_alteracoes').update(campos).eq('id', id).select('id');
        if (error) throw error;
        conferirGravou(data, 'Só quem pode editar contratos corrige uma alteração.');
        return;
      }
      const { error } = await supabase.from('contrato_alteracoes').insert(dados);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      invalidarContrato(qc, vars.contrato_id);
      ok(vars.id ? 'Alteração corrigida' : 'Alteração registrada');
    },
    onError: falha('Não foi possível salvar a alteração'),
  });
}

export function useRegistrarRetomada() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, contrato_id: _c, ...dados }: RetomadaInput) => {
      const { data, error } = await supabase.from('contrato_alteracoes').update(dados).eq('id', id).select('id');
      if (error) throw error;
      conferirGravou(data, 'Só quem pode editar contratos registra a retomada.');
    },
    onSuccess: (_r, vars) => {
      invalidarContrato(qc, vars.contrato_id);
      ok('Retomada registrada');
    },
    onError: falha('Não foi possível registrar a retomada'),
  });
}

export function useExcluirAlteracao() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id }: { id: string; contrato_id: string }) => {
      const { data, error } = await supabase.from('contrato_alteracoes').delete().eq('id', id).select('id');
      if (error) throw error;
      conferirGravou(data, 'Só quem pode editar contratos apaga uma alteração.');
    },
    onSuccess: (_r, vars) => {
      invalidarContrato(qc, vars.contrato_id);
      ok('Alteração apagada');
    },
    onError: falha('Não foi possível apagar a alteração'),
  });
}

/** Providência do vencimento (tela Vencimentos): o banco limpa sozinho quando o fim atual vai para depois. */
export function useSalvarProvidencia() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: ProvidenciaInput) => {
      const { data, error } = await supabase.from('contratos').update(dados).eq('id', id).select('id');
      if (error) throw error;
      conferirGravou(data, 'Só quem pode editar contratos registra a providência.');
    },
    onSuccess: (_r, vars) => {
      invalidarContrato(qc, vars.id);
      ok(vars.renovacao_providencia ? 'Providência registrada' : 'Providência retirada');
    },
    onError: falha('Não foi possível salvar a providência'),
  });
}

// ---------------------------------------------------------------------------- histórico
const TABELAS_HISTORICO = ['contratos', 'itens_contrato', 'contrato_responsaveis', 'contrato_alteracoes'];

export function useHistoricoContrato(contratoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'historico', contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const id = contratoId!;
      const { data, error } = await supabase
        .from('audit_log_licitacoes')
        .select('id, tabela_origem, registro_id, acao, campos_alterados, dados_anteriores, dados_novos, usuario_nome, created_at')
        .in('tabela_origem', TABELAS_HISTORICO)
        .or(`registro_id.eq.${id},dados_novos->>contrato_id.eq.${id},dados_anteriores->>contrato_id.eq.${id}`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as RegistroHistorico[];
    },
  });
}
