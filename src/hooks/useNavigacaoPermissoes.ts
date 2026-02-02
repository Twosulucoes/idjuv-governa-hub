/**
 * Hook para filtrar navegação baseado em permissões RBAC
 * 
 * Combina a configuração de navegação com as permissões do usuário
 * para renderizar apenas os itens autorizados.
 */

import { useMemo } from 'react';
import { usePermissoesUsuario } from './usePermissoesUsuario';
import { 
  navigationConfig, 
  type NavSection, 
  type NavItem,
  NAV_PERMISSAO_MAP 
} from '@/config/navigation.config';

export interface NavItemFiltrado extends NavItem {
  children?: NavItemFiltrado[];
}

export interface NavSectionFiltrada extends Omit<NavSection, 'items'> {
  items: NavItemFiltrado[];
}

interface UseNavigacaoPermissoesReturn {
  secoesFiltradas: NavSectionFiltrada[];
  loading: boolean;
  error: string | null;
  temPermissaoItem: (itemId: string) => boolean;
  totalItensVisiveis: number;
}

/**
 * IDs que são sempre visíveis (não requerem permissão específica)
 */
const ITENS_SEMPRE_VISIVEIS = new Set([
  'dashboard',
]);

export function useNavigacaoPermissoes(): UseNavigacaoPermissoesReturn {
  const { permissoes, loading, error, temPermissao } = usePermissoesUsuario();

  const secoesFiltradas = useMemo(() => {
    if (loading) return [];

    // Fallback: se não há permissões, mostra tudo (para não travar)
    const usarFallback = !permissoes || permissoes.length === 0;

    const itemVisivel = (item: NavItem): boolean => {
      if (usarFallback) return true;
      if (ITENS_SEMPRE_VISIVEIS.has(item.id)) return true;

      // Verifica permissão do item
      if (item.permissao) {
        return temPermissao(item.permissao);
      }

      // Verifica no mapa de permissões
      const codigoPermissao = NAV_PERMISSAO_MAP[item.id];
      if (codigoPermissao) {
        return temPermissao(codigoPermissao);
      }

      // Se tem filhos, verifica se pelo menos um filho é visível
      if (item.children && item.children.length > 0) {
        return item.children.some(child => itemVisivel(child));
      }

      // Se não tem mapeamento, assume visível
      return true;
    };

    const filtrarItem = (item: NavItem): NavItemFiltrado | null => {
      // Se tem filhos, filtra recursivamente
      if (item.children && item.children.length > 0) {
        const filhosFiltrados = item.children
          .map(filtrarItem)
          .filter((f): f is NavItemFiltrado => f !== null);

        if (filhosFiltrados.length === 0) return null;

        return {
          ...item,
          children: filhosFiltrados,
        };
      }

      // Item sem filhos - verifica permissão
      if (!itemVisivel(item)) return null;

      return { ...item };
    };

    const resultado: NavSectionFiltrada[] = [];

    navigationConfig.forEach((section) => {
      // Verifica permissão da seção
      if (section.permissao && !usarFallback) {
        if (!temPermissao(section.permissao)) return;
      }

      const itensFiltrados = section.items
        .map(filtrarItem)
        .filter((item): item is NavItemFiltrado => item !== null);

      if (itensFiltrados.length > 0) {
        resultado.push({
          ...section,
          items: itensFiltrados,
        });
      }
    });

    // Ordena por prioridade
    return resultado.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [permissoes, loading, temPermissao]);

  const temPermissaoItem = (itemId: string): boolean => {
    const codigo = NAV_PERMISSAO_MAP[itemId];
    if (!codigo) return true;
    return temPermissao(codigo);
  };

  const totalItensVisiveis = useMemo(() => {
    let total = 0;
    
    const contarItens = (items: NavItemFiltrado[]) => {
      items.forEach(item => {
        if (item.children) {
          contarItens(item.children);
        } else if (item.href) {
          total++;
        }
      });
    };

    secoesFiltradas.forEach(section => contarItens(section.items));
    
    return total;
  }, [secoesFiltradas]);

  return {
    secoesFiltradas,
    loading,
    error,
    temPermissaoItem,
    totalItensVisiveis,
  };
}
