/**
 * HOOK: useSidebarCollapse
 * 
 * Gerencia o estado de colapso da sidebar com persistência local
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

export function useSidebarCollapse(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return defaultCollapsed;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultCollapsed;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggle = useCallback(() => {
    setIsCollapsed((prev: boolean) => !prev);
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
    setIsCollapsed,
  };
}
