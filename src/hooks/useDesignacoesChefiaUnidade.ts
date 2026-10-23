import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NomeacaoChefeUnidade, TipoAtoNomeacao } from '@/types/unidadesLocais';
import { textoOuNulo, type RegistroSei } from '@/lib/registroSei';

// O ato de designação é feito no SEI; aqui só se registra e acompanha o ciclo (processo SEI, número, assinatura, DOE).
const CHAVE = 'designacoes-chefia-unidade';

export type DesignacaoChefia = NomeacaoChefeUnidade & {
  unidade?: { id: string; nome_unidade: string; municipio: string } | null;
};

export interface UnidadeLocalAtiva {
  id: string;
  nome_unidade: string;
  municipio: string;
}

/** Campos do ato no SEI (o tipo do ato e a data de publicação entram junto). */
export type RegistroSeiDesignacao = RegistroSei & { tipoAto: TipoAtoNomeacao; dataPublicacao?: string };

function colunasSei(v: RegistroSeiDesignacao) {
  return {
    ato_nomeacao_tipo: v.tipoAto,
    processo_sei: textoOuNulo(v.processoSei),
    ato_numero: textoOuNulo(v.numero),
    ato_data_assinatura: textoOuNulo(v.dataAssinatura),
    ato_data_publicacao: textoOuNulo(v.dataPublicacao),
    ato_doe_numero: textoOuNulo(v.doeNumero),
    ato_doe_data: textoOuNulo(v.doeData),
  };
}

/** Designações de chefia de unidade local do servidor, mais recentes primeiro. */
export function useDesignacoesChefiaServidor(servidorId: string) {
  return useQuery({
    queryKey: [CHAVE, servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomeacoes_chefe_unidade')
        .select('*, unidade:unidades_locais!nomeacoes_chefe_unidade_unidade_local_id_fkey(id, nome_unidade, municipio)')
        .eq('servidor_id', servidorId)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DesignacaoChefia[];
    },
    enabled: !!servidorId,
  });
}

/** Unidades locais ativas, para escolher onde o servidor é designado chefe. */
export function useUnidadesLocaisAtivas() {
  return useQuery({
    queryKey: [CHAVE, 'unidades-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades_locais')
        .select('id, nome_unidade, municipio')
        .eq('status', 'ativa')
        .order('nome_unidade');
      if (error) throw error;
      return (data || []) as UnidadeLocalAtiva[];
    },
  });
}

interface RegistrarDesignacao {
  servidorId: string;
  unidadeId: string;
  dataInicio: string;
  observacoes: string;
  sei: RegistroSeiDesignacao;
}

/** Registra a designação; o chefe anterior da unidade é encerrado pelo banco (trigger encerrar_nomeacao_anterior). */
export function useRegistrarDesignacaoChefia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ servidorId, unidadeId, dataInicio, observacoes, sei }: RegistrarDesignacao) => {
      const { error } = await supabase.from('nomeacoes_chefe_unidade').insert({
        unidade_local_id: unidadeId,
        servidor_id: servidorId,
        cargo: 'Chefe de Unidade Local',
        data_inicio: dataInicio,
        status: 'ativo',
        observacoes: textoOuNulo(observacoes),
        ...colunasSei(sei),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}

/** Atualiza o registro do SEI de uma designação (processo, número, assinatura, publicação e DOE). */
export function useAtualizarRegistroSeiDesignacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sei }: { id: string; sei: RegistroSeiDesignacao }) => {
      const { error } = await supabase.from('nomeacoes_chefe_unidade').update(colunasSei(sei)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}
