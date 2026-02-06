/**
 * CONTEXTO DE MENU INSTITUCIONAL
 * 
 * Gerencia estado do menu e integração com RBAC + Módulos
 * Filtra itens baseado em permissões do AuthContext E módulos do usuário
 * 
 * @version 2.0.0
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  menuConfig, 
  DASHBOARD_ITEM,
  type MenuItem, 
  type MenuSection,
  type PermissaoInstitucional 
} from '@/config/menu.config';
import { getModuleForMenuSection, type Modulo } from '@/shared/config/modules.config';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';

// ================================
// TIPOS
// ================================

export interface MenuItemFiltered extends MenuItem {
  children?: MenuItemFiltered[];
}

export interface MenuSectionFiltered extends Omit<MenuSection, 'items'> {
  items: MenuItemFiltered[];
}

interface MenuContextType {
  // Menu filtrado por permissões e módulos
  sections: MenuSectionFiltered[];
  dashboard: MenuItem;
  
  // Estado do menu
  isLoading: boolean;
  isSidebarOpen: boolean;
  isMobileDrawerOpen: boolean;
  
  // Seções/itens abertos
  openSections: string[];
  openItems: string[];
  
  // Favoritos
  favorites: string[];
  
  // Ações
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleSection: (sectionId: string) => void;
  toggleItem: (itemId: string) => void;
  toggleFavorite: (itemId: string) => void;
  
  // Helpers
  isActive: (route?: string) => boolean;
  hasPermission: (permission?: PermissaoInstitucional) => boolean;
  hasModuleAccess: (modulo: Modulo) => boolean;
  getQuickAccessItems: () => MenuItemFiltered[];
  getFavoriteItems: () => MenuItemFiltered[];
}

const FAVORITES_STORAGE_KEY = 'menu-favorites-v3';

// ================================
// CONTEXTO
// ================================

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// ================================
// PROVIDER
// ================================

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isLoading: authLoading, isAuthenticated, isSuperAdmin, hasPermission: authHasPermission } = useAuth();
  const { modulosAutorizados, loading: modulosLoading, temAcessoModulo } = useModulosUsuario();
  
  // Estado local
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // Ignora erros de parsing
    }
  }, []);

  // Fechar drawer mobile ao navegar
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Auto-expandir seção ativa
  useEffect(() => {
    const currentPath = location.pathname;
    
    menuConfig.forEach(section => {
      const hasActiveItem = section.items.some(item => {
        if (item.route?.split('?')[0] === currentPath) return true;
        return item.children?.some(child => child.route?.split('?')[0] === currentPath);
      });
      
      if (hasActiveItem && !openSections.includes(section.id)) {
        setOpenSections(prev => [...prev, section.id]);
      }
      
      // Auto-expandir submenus
      section.items.forEach(item => {
        if (item.children?.some(child => child.route?.split('?')[0] === currentPath)) {
          if (!openItems.includes(item.id)) {
            setOpenItems(prev => [...prev, item.id]);
          }
        }
      });
    });
  }, [location.pathname]);

  // ================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ================================

  const hasPermission = useCallback((permission?: PermissaoInstitucional): boolean => {
    // Sem permissão definida = acessível a todos autenticados
    if (!permission) return isAuthenticated;
    
    // Super admin tem acesso total
    if (isSuperAdmin) return true;
    
    // Verificar via AuthContext
    return authHasPermission(permission);
  }, [isAuthenticated, isSuperAdmin, authHasPermission]);

  const hasModuleAccess = useCallback((modulo: Modulo): boolean => {
    // Super admin tem acesso total
    if (isSuperAdmin) return true;
    
    return temAcessoModulo(modulo);
  }, [isSuperAdmin, temAcessoModulo]);

  // ================================
  // FILTRAGEM DO MENU
  // ================================

  const sections = useMemo((): MenuSectionFiltered[] => {
    if (authLoading || modulosLoading) return [];

    const filterItem = (item: MenuItem): MenuItemFiltered | null => {
      // Item com filhos
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children
          .map(filterItem)
          .filter((child): child is MenuItemFiltered => child !== null);
        
        // Se nenhum filho visível, oculta o pai
        if (filteredChildren.length === 0) return null;
        
        return { ...item, children: filteredChildren };
      }
      
      // Item simples - verifica permissão
      if (!hasPermission(item.permission)) return null;
      
      return { ...item };
    };

    const result: MenuSectionFiltered[] = [];

    for (const section of menuConfig) {
      // Verificar se a seção está mapeada a um módulo
      const moduloDaSecao = getModuleForMenuSection(section.id);
      
      // Se mapeada a um módulo, verificar acesso
      if (moduloDaSecao && !hasModuleAccess(moduloDaSecao)) {
        continue; // Pular seção inteira se não tem acesso ao módulo
      }
      
      const filteredItems = section.items
        .map(filterItem)
        .filter((item): item is MenuItemFiltered => item !== null);
      
      if (filteredItems.length > 0) {
        result.push({ ...section, items: filteredItems });
      }
    }

    // Ordenar por prioridade
    return result.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [authLoading, modulosLoading, hasPermission, hasModuleAccess]);

  // ================================
  // HELPERS
  // ================================

  const isActive = useCallback((route?: string): boolean => {
    if (!route) return false;
    const cleanRoute = route.split('?')[0];
    return location.pathname === cleanRoute || location.pathname.startsWith(cleanRoute + '/');
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(prev => !prev);
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setOpenItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const getQuickAccessItems = useCallback((): MenuItemFiltered[] => {
    const items: MenuItemFiltered[] = [];
    
    for (const section of sections) {
      for (const item of section.items) {
        if (item.priority && item.priority <= 4 && item.route) {
          items.push(item);
        }
        // Também procura em children
        if (item.children) {
          for (const child of item.children) {
            if (child.priority && child.priority <= 4 && child.route) {
              items.push(child);
            }
          }
        }
      }
    }
    
    return items.sort((a, b) => (a.priority || 99) - (b.priority || 99)).slice(0, 4);
  }, [sections]);

  const getFavoriteItems = useCallback((): MenuItemFiltered[] => {
    const items: MenuItemFiltered[] = [];
    
    const collectFavorites = (menuItems: MenuItemFiltered[]) => {
      for (const item of menuItems) {
        if (favorites.includes(item.id) && item.route) {
          items.push(item);
        }
        if (item.children) {
          collectFavorites(item.children);
        }
      }
    };
    
    for (const section of sections) {
      collectFavorites(section.items);
    }
    
    return items.slice(0, 4);
  }, [sections, favorites]);

  // ================================
  // VALOR DO CONTEXTO
  // ================================

  const value: MenuContextType = {
    sections,
    dashboard: DASHBOARD_ITEM,
    isLoading: authLoading || modulosLoading,
    isSidebarOpen,
    isMobileDrawerOpen,
    openSections,
    openItems,
    favorites,
    toggleSidebar,
    setSidebarOpen: setIsSidebarOpen,
    toggleMobileDrawer,
    setMobileDrawerOpen: setIsMobileDrawerOpen,
    toggleSection,
    toggleItem,
    toggleFavorite,
    isActive,
    hasPermission,
    hasModuleAccess,
    getQuickAccessItems,
    getFavoriteItems,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

// ================================
// HOOK
// ================================

export function useMenu(): MenuContextType {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu deve ser usado dentro de MenuProvider');
  }
  return context;
}