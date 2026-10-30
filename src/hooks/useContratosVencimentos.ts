/**
 * Vencimentos de contratos (C2): a tela /contratos/vencimentos e o aviso do sino.
 * A tela lê os contratos (RLS: módulo Compras ou Contratos); o sino usa a RPC contratos_meus_vencimentos (migração
 * 20261113090000), que devolve só nº, objeto resumido e fim dos contratos do gestor e dos fiscais (pelo servidor do
 * perfil) ou de todos para quem tem contratos.editar, porque o servidor designado pode não ter o módulo.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HORIZONTE_DIAS, type ContratoVencimento } from '@/lib/contratos/vencimentos';
import { hojeIso } from '@/lib/contratos/vigencia';

const SELECT_VENCIMENTOS =
  'id, numero_contrato, ano, objeto, objeto_resumido, status, data_inicio, data_fim, data_fim_atual, prorrogavel, '
  + 'prazo_maximo_meses, garantia_tipo, garantia_vencimento, renovacao_providencia, renovacao_processo_sei, '
  + 'renovacao_observacao, renovacao_atualizada_em, '
  + 'fornecedor:fornecedores(id, razao_social, nome_fantasia), '
  + 'responsaveis:contrato_responsaveis(papel, nome, servidor_id, data_fim)';

const somarDias = (iso: string, dias: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);

/** Em vigor (vigente, aditado ou suspenso) que vence em até 120 dias, já venceu ou tem a garantia vencendo. */
export function useVencimentos() {
  return useQuery({
    queryKey: ['contratos', 'vencimentos'],
    queryFn: async () => {
      const limite = somarDias(hojeIso(), HORIZONTE_DIAS);
      const { data, error } = await supabase
        .from('contratos')
        .select(SELECT_VENCIMENTOS)
        .in('status', ['vigente', 'aditado', 'suspenso'])
        .or(`data_fim_atual.lte.${limite},and(data_fim_atual.is.null,data_fim.lte.${limite}),garantia_vencimento.lte.${limite}`)
        .order('data_fim_atual', { ascending: true })
        .range(0, 999);
      if (error) throw error;
      return (data ?? []) as unknown as ContratoVencimento[];
    },
  });
}

export interface MeuVencimento {
  contrato_id: string;
  numero: string;
  objeto: string;
  data_fim_atual: string;
  dias: number;
  papeis: string[];
  abre_ficha: boolean;
}

/** O sino: vai em todas as telas de módulo, então guarda por 5 minutos. */
export function useMeusVencimentos() {
  return useQuery({
    queryKey: ['contratos-meus-vencimentos'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('contratos_meus_vencimentos');
      if (error) throw error;
      return (data ?? []) as MeuVencimento[];
    },
  });
}
