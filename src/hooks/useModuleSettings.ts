/**
 * HOOK PARA CONFIGURAÇÕES DE MÓDULOS
 * 
 * Carrega as configurações de módulos (enabled, features desabilitadas)
 * do banco de dados e fornece helpers para verificar status.
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Modulo } from '@/shared/config/modules.config';

interface ModuleSettingsData {
  module_code: string;
  enabled: boolean;
  features: string[]; // IDs of DISABLED features
}

let cachedSettings: ModuleSettingsData[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

export function useModuleSettings() {
  const [settings, setSettings] = useState<ModuleSettingsData[]>(cachedSettings || []);
  const [loading, setLoading] = useState(!cachedSettings);

  const fetchSettings = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedSettings && now - cacheTimestamp < CACHE_TTL) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('module_settings')
        .select('module_code, enabled, features');

      if (data) {
        const parsed: ModuleSettingsData[] = (data as any[]).map(row => ({
          module_code: row.module_code,
          enabled: row.enabled,
          features: Array.isArray(row.features) ? row.features : [],
        }));
        cachedSettings = parsed;
        cacheTimestamp = Date.now();
        setSettings(parsed);
      }
    } catch (error) {
      console.error('[useModuleSettings] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /** Check if a module is globally enabled */
  const isModuleEnabled = useCallback((moduleCode: Modulo): boolean => {
    const s = settings.find(m => m.module_code === moduleCode);
    return s?.enabled ?? true; // Default enabled if not in DB
  }, [settings]);

  /** Check if a specific feature (menu item id) is disabled */
  const isFeatureDisabled = useCallback((moduleCode: Modulo, featureId: string): boolean => {
    const s = settings.find(m => m.module_code === moduleCode);
    if (!s) return false;
    return s.features.includes(featureId);
  }, [settings]);

  /** Get list of disabled feature IDs for a module */
  const getDisabledFeatures = useCallback((moduleCode: Modulo): string[] => {
    const s = settings.find(m => m.module_code === moduleCode);
    return s?.features || [];
  }, [settings]);

  /** Invalidate cache and refetch */
  const invalidate = useCallback(() => {
    cachedSettings = null;
    cacheTimestamp = 0;
    fetchSettings(true);
  }, [fetchSettings]);

  return {
    settings,
    loading,
    isModuleEnabled,
    isFeatureDisabled,
    getDisabledFeatures,
    invalidate,
  };
}
