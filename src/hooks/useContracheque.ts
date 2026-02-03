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
  
  return useQuery({
    queryKey: ['meus-contracheques', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Buscar servidor vinculado ao usuário
      const { data: servidor, error: servidorError } = await supabase
        .from('servidores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (servidorError) throw servidorError;
      if (!servidor) return [];
      
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
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep)
        `)
        .eq('servidor_id', servidor.id)
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as FichaFinanceiraComServidor[];
    },
    enabled: !!user?.id,
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
        .order('rubrica_codigo', { ascending: true });
      
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
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ fichaId, acao }: { fichaId: string; acao: 'visualizar' | 'imprimir' }) => {
      // Registrar no audit_logs
      const { error } = await supabase.from('audit_logs').insert({
        action: 'view',
        entity_type: 'contracheque',
        entity_id: fichaId,
        user_id: user?.id,
        description: acao === 'imprimir' 
          ? 'Contracheque impresso/baixado' 
          : 'Contracheque visualizado',
        metadata: { acao },
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
  
  return useQuery({
    queryKey: ['servidor-logado', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('servidores')
        .select('id, nome_completo, cpf, matricula')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export type { FichaFinanceiraComServidor, ItemFichaFinanceira };
