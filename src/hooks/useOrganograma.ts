import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnidadeOrganizacional, Lotacao } from '@/types/organograma';
import { useToast } from '@/hooks/use-toast';

export function useOrganograma() {
  const [unidades, setUnidades] = useState<UnidadeOrganizacional[]>([]);
  const [lotacoes, setLotacoes] = useState<Lotacao[]>([]);
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
          servidor:profiles!lotacoes_servidor_id_fkey(
            id,
            full_name,
            avatar_url,
            email
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
      
      // Cast the data properly
      const typedData = (data || []).map(item => ({
        ...item,
        servidor: item.servidor as Lotacao['servidor'],
        cargo: item.cargo as Lotacao['cargo']
      }));
      
      setLotacoes(typedData);
    } catch (err: any) {
      console.error('Erro ao carregar lotações:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnidades();
    fetchLotacoes();
  }, [fetchUnidades, fetchLotacoes]);

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
    loading,
    error,
    arvoreHierarquica,
    getLotacoesByUnidade,
    contarServidores,
    refetch: fetchUnidades,
    atualizarHierarquia,
    verificarCiclo,
  };
}
