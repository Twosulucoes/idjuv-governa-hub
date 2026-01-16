import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnidadeOrganizacional, Lotacao } from '@/types/organograma';
import { useToast } from '@/hooks/use-toast';

interface ComposicaoCargo {
  unidade_id: string;
  cargo_id: string;
  quantidade_vagas: number;
  cargo: {
    id: string;
    nome: string;
    sigla: string;
  };
}

interface ServidorPorCargo {
  servidor_id: string;
  servidor_nome: string;
  cargo_id: string;
  cargo_nome: string;
  cargo_sigla: string;
  unidade_id: string;
}

export function useOrganograma() {
  const [unidades, setUnidades] = useState<UnidadeOrganizacional[]>([]);
  const [lotacoes, setLotacoes] = useState<Lotacao[]>([]);
  const [composicaoCargos, setComposicaoCargos] = useState<ComposicaoCargo[]>([]);
  const [servidoresPorCargo, setServidoresPorCargo] = useState<ServidorPorCargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnidades = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estrutura_organizacional')
        .select(`
          *,
          servidor_responsavel:profiles!estrutura_organizacional_servidor_responsavel_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('ativo', true)
        .order('nivel')
        .order('ordem')
        .order('nome');

      if (error) throw error;
      
      // Cast the data properly
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as UnidadeOrganizacional['tipo'],
        servidor_responsavel: item.servidor_responsavel as UnidadeOrganizacional['servidor_responsavel']
      }));
      
      setUnidades(typedData);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro ao carregar organograma',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchLotacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lotacoes')
        .select(`
          *,
          servidor:servidores!lotacoes_servidor_id_fkey(
            id,
            nome_completo,
            foto_url,
            email_institucional
          ),
          cargo:cargos(
            id,
            nome,
            sigla,
            categoria
          )
        `)
        .eq('ativo', true);

      if (error) throw error;
      
      // Cast the data properly - map servidores fields to expected interface
      const typedData = (data || []).map(item => {
        const servidorData = item.servidor as { id: string; nome_completo: string; foto_url?: string; email_institucional?: string } | null;
        return {
          ...item,
          servidor: servidorData ? {
            id: servidorData.id,
            full_name: servidorData.nome_completo,
            avatar_url: servidorData.foto_url,
            email: servidorData.email_institucional
          } : undefined,
          cargo: item.cargo as Lotacao['cargo']
        };
      });
      
      setLotacoes(typedData);
    } catch (err: any) {
      console.error('Erro ao carregar lotações:', err);
    }
  }, []);

  // Buscar composição de cargos por unidade
  const fetchComposicaoCargos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('composicao_cargos')
        .select(`
          unidade_id,
          cargo_id,
          quantidade_vagas,
          cargo:cargos(
            id,
            nome,
            sigla
          )
        `);

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        cargo: item.cargo as ComposicaoCargo['cargo']
      }));
      
      setComposicaoCargos(typedData);
    } catch (err: any) {
      console.error('Erro ao carregar composição de cargos:', err);
    }
  }, []);

  // Buscar servidores vinculados por cargo (para o organograma)
  const fetchServidoresPorCargo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lotacoes')
        .select(`
          servidor_id,
          cargo_id,
          servidor:servidores!lotacoes_servidor_id_fkey(
            nome_completo
          ),
          cargo:cargos(
            id,
            nome,
            sigla
          )
        `)
        .eq('ativo', true);

      if (error) throw error;
      
      // Mapear para estrutura simplificada
      const typedData = (data || []).map(item => {
        const servidorData = item.servidor as { nome_completo: string } | null;
        const cargoData = item.cargo as { id: string; nome: string; sigla: string } | null;
        return {
          servidor_id: item.servidor_id,
          servidor_nome: servidorData?.nome_completo || '',
          cargo_id: item.cargo_id || '',
          cargo_nome: cargoData?.nome || '',
          cargo_sigla: cargoData?.sigla || '',
          unidade_id: ''
        };
      });
      
      setServidoresPorCargo(typedData);
    } catch (err: any) {
      console.error('Erro ao carregar servidores por cargo:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnidades();
    fetchLotacoes();
    fetchComposicaoCargos();
    fetchServidoresPorCargo();
  }, [fetchUnidades, fetchLotacoes, fetchComposicaoCargos, fetchServidoresPorCargo]);

  // Construir árvore hierárquica
  const buildTree = useCallback((items: UnidadeOrganizacional[], parentId: string | null = null): UnidadeOrganizacional[] => {
    return items
      .filter(item => item.superior_id === parentId)
      .map(item => ({
        ...item,
        subordinados: buildTree(items, item.id),
      }));
  }, []);

  const arvoreHierarquica = buildTree(unidades, null);

  // Obter lotações de uma unidade
  const getLotacoesByUnidade = useCallback((unidadeId: string) => {
    return lotacoes.filter(l => l.unidade_id === unidadeId);
  }, [lotacoes]);

  // Obter servidores LOTADOS diretamente na unidade (não pelo cargo)
  const getServidoresByUnidadeCargo = useCallback((unidadeId: string): { nome: string; cargo: string }[] => {
    // CORRETO: Buscar servidores que estão LOTADOS nesta unidade
    const lotacoesUnidade = lotacoes.filter(l => l.unidade_id === unidadeId);
    
    return lotacoesUnidade.map(l => ({
      nome: l.servidor?.full_name || '',
      cargo: l.cargo?.nome || l.cargo?.sigla || '-'
    })).filter(s => s.nome);
  }, [lotacoes]);

  // Contar servidores em uma unidade (incluindo subordinados)
  const contarServidores = useCallback((unidadeId: string, incluirSubordinados = false): number => {
    let count = lotacoes.filter(l => l.unidade_id === unidadeId).length;
    
    if (incluirSubordinados) {
      const subordinados = unidades.filter(u => u.superior_id === unidadeId);
      subordinados.forEach(sub => {
        count += contarServidores(sub.id, true);
      });
    }
    
    return count;
  }, [lotacoes, unidades]);

  // NOVO: Contar servidores por cargo vinculado
  const contarServidoresPorCargo = useCallback((unidadeId: string): number => {
    const servidores = getServidoresByUnidadeCargo(unidadeId);
    return servidores.length;
  }, [getServidoresByUnidadeCargo]);

  // Atualizar hierarquia (superior_id)
  const atualizarHierarquia = useCallback(async (
    unidadeId: string, 
    novoSuperiorId: string | null
  ): Promise<boolean> => {
    try {
      // Calcular novo nível baseado no superior
      let novoNivel = 1;
      if (novoSuperiorId) {
        const superior = unidades.find(u => u.id === novoSuperiorId);
        novoNivel = (superior?.nivel || 0) + 1;
      }

      const { error } = await supabase
        .from('estrutura_organizacional')
        .update({ 
          superior_id: novoSuperiorId,
          nivel: novoNivel,
          updated_at: new Date().toISOString()
        })
        .eq('id', unidadeId);

      if (error) throw error;

      // Atualizar níveis dos subordinados recursivamente
      const atualizarNiveisSubordinados = async (parentId: string, parentNivel: number) => {
        const subordinados = unidades.filter(u => u.superior_id === parentId);
        for (const sub of subordinados) {
          await supabase
            .from('estrutura_organizacional')
            .update({ nivel: parentNivel + 1 })
            .eq('id', sub.id);
          await atualizarNiveisSubordinados(sub.id, parentNivel + 1);
        }
      };

      await atualizarNiveisSubordinados(unidadeId, novoNivel);
      await fetchUnidades();
      
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar hierarquia',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [unidades, fetchUnidades, toast]);

  // Verificar se criaria ciclo
  const verificarCiclo = useCallback((unidadeId: string, novoSuperiorId: string): boolean => {
    if (unidadeId === novoSuperiorId) return true;
    
    // Verificar se novoSuperior é descendente de unidade
    const verificarDescendentes = (parentId: string): boolean => {
      const filhos = unidades.filter(u => u.superior_id === parentId);
      for (const filho of filhos) {
        if (filho.id === novoSuperiorId) return true;
        if (verificarDescendentes(filho.id)) return true;
      }
      return false;
    };
    
    return verificarDescendentes(unidadeId);
  }, [unidades]);

  return {
    unidades,
    lotacoes,
    composicaoCargos,
    loading,
    error,
    arvoreHierarquica,
    getLotacoesByUnidade,
    getServidoresByUnidadeCargo,
    contarServidores,
    contarServidoresPorCargo,
    refetch: fetchUnidades,
    atualizarHierarquia,
    verificarCiclo,
  };
}
