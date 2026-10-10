/**
 * Hook para gestão de contracheques
 * Acesso segmentado: servidor vê apenas os próprios, RH vê todos
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Tipos de retorno
interface FichaFinanceiraComServidor {
  id: string;
  servidor_id: string;
  competencia_ano: number;
  competencia_mes: number;
  cargo_nome: string | null;
  unidade_nome: string | null;
  total_proventos: number | null;
  total_descontos: number | null;
  valor_liquido: number | null;
  base_inss: number | null;
  valor_inss: number | null;
  base_irrf: number | null;
  valor_irrf: number | null;
  quantidade_dependentes: number | null;
  created_at: string | null;
  servidor: {
    id: string;
    nome_completo: string;
    cpf: string | null;
    matricula: string | null;
    pis_pasep: string | null;
  } | null;
}

interface ItemFichaFinanceira {
  id: string;
  ficha_id: string;
  rubrica_id: string | null;
  descricao: string;
  tipo: string;
  referencia: string | null;
  valor: number;
  percentual: number | null;
  base_calculo: number | null;
  ordem: number | null;
}

// Hook para buscar contracheques do servidor logado
export function useMeusContracheques() {
  const { user } = useAuth();
  // Vínculo pelo profiles.servidor_id, a mesma chave da RLS (meu_servidor_id()).
  const servidorId = user?.servidorId;
  
  return useQuery({
    queryKey: ['meus-contracheques', servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      
      // Buscar fichas financeiras do servidor
      const { data, error } = await supabase
        .from('fichas_financeiras')
        .select(`
          id,
          servidor_id,
          competencia_ano,
          competencia_mes,
          cargo_nome,
          unidade_nome,
          total_proventos,
          total_descontos,
          valor_liquido,
          base_inss,
          valor_inss,
          base_irrf,
          valor_irrf,
          quantidade_dependentes,
          created_at,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep),
          folhas_pagamento!inner(status)
        `)
        .eq('servidor_id', servidorId)
        // Só folha fechada vira contracheque: prévia, aberta, em processamento
        // ou reaberta ainda podem mudar e não devem aparecer para o servidor.
        .eq('folhas_pagamento.status', 'fechada')
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as FichaFinanceiraComServidor[];
    },
    enabled: !!servidorId,
  });
}

// Hook para buscar todos os contracheques (RH)
export function useContrachequesRH(filtros?: {
  ano?: number;
  mes?: number;
  servidorId?: string;
  unidade?: string;
}) {
  return useQuery({
    queryKey: ['contracheques-rh', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fichas_financeiras')
        .select(`
          id,
          servidor_id,
          competencia_ano,
          competencia_mes,
          cargo_nome,
          unidade_nome,
          total_proventos,
          total_descontos,
          valor_liquido,
          base_inss,
          valor_inss,
          base_irrf,
          valor_irrf,
          quantidade_dependentes,
          created_at,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep)
        `)
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false });
      
      if (filtros?.ano) {
        query = query.eq('competencia_ano', filtros.ano);
      }
      if (filtros?.mes) {
        query = query.eq('competencia_mes', filtros.mes);
      }
      if (filtros?.servidorId) {
        query = query.eq('servidor_id', filtros.servidorId);
      }
      if (filtros?.unidade) {
        query = query.ilike('unidade_nome', `%${filtros.unidade}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FichaFinanceiraComServidor[];
    },
  });
}

// Hook para buscar um contracheque específico com itens
export function useContrachequeDetalhe(fichaId?: string) {
  return useQuery({
    queryKey: ['contracheque-detalhe', fichaId],
    queryFn: async () => {
      if (!fichaId) return null;
      
      // Buscar ficha financeira
      const { data: ficha, error: fichaError } = await supabase
        .from('fichas_financeiras')
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep, data_nascimento)
        `)
        .eq('id', fichaId)
        .single();
      
      if (fichaError) throw fichaError;
      
      // Buscar itens da ficha
      const { data: itens, error: itensError } = await supabase
        .from('itens_ficha_financeira')
        .select('*')
        .eq('ficha_id', fichaId)
        .order('tipo', { ascending: true })
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('descricao', { ascending: true });
      
      if (itensError) throw itensError;
      
      return {
        ficha: ficha as unknown as FichaFinanceiraComServidor,
        itens: (itens || []) as unknown as ItemFichaFinanceira[],
      };
    },
    enabled: !!fichaId,
  });
}

// Hook para registrar log de acesso ao contracheque
export function useLogAcessoContracheque() {
  return useMutation({
    mutationFn: async ({ fichaId, acao }: { fichaId: string; acao: 'visualizar' | 'imprimir' }) => {
      // Registrar no audit_logs pela RPC: o INSERT direto foi removido e o user_id vem de
      // auth.uid() no servidor (o conteúdo do log continua informado pelo cliente).
      const { error } = await supabase.rpc('log_audit', {
        _action: 'view',
        _entity_type: 'contracheque',
        _entity_id: fichaId,
        _module_name: 'rh',
        _description: acao === 'imprimir'
          ? 'Contracheque impresso/baixado'
          : 'Contracheque visualizado',
        _metadata: { acao },
      });
      
      if (error) {
        console.warn('Não foi possível registrar log de acesso:', error);
      }
    },
    onError: (error) => {
      console.warn('Erro ao registrar log de acesso:', error);
    },
  });
}

// Hook para verificar se usuário é servidor
export function useServidorLogado() {
  const { user } = useAuth();
  // Vínculo pelo profiles.servidor_id, a mesma chave da RLS (meu_servidor_id()).
  const servidorId = user?.servidorId;
  
  return useQuery({
    queryKey: ['servidor-logado', servidorId],
    queryFn: async () => {
      if (!servidorId) return null;
      
      const { data, error } = await supabase
        .from('servidores')
        .select('id, nome_completo, cpf, matricula')
        .eq('id', servidorId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!servidorId,
  });
}

export type { FichaFinanceiraComServidor, ItemFichaFinanceira };
