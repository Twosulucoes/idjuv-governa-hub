/**
 * Cliente Supabase - Lovable Cloud
 * 
 * Este arquivo exporta o cliente do Lovable Cloud como padrão.
 */

import { supabase as lovableSupabase } from '@/integrations/supabase/client';

// Usa o cliente do Lovable Cloud
export const supabase = lovableSupabase;

/**
 * Verifica se está configurado (sempre true com Lovable Cloud)
 */
export const isSupabaseConfigured = (): boolean => true;

/**
 * Retorna informações sobre a conexão
 */
export const getConnectionInfo = () => ({
  configured: true,
  url: 'lovable-cloud',
  mode: 'lovable-cloud',
});

/**
 * Limpa sessões antigas/corrompidas
 */
export const clearOldSessions = () => {
  try {
    // Remove todas as chaves do Supabase/auth do localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') ||
        key.includes('supabase') ||
        key === 'idjuv-external-auth'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[IDJUV] Sessões antigas removidas:', keysToRemove.length);
  } catch (e) {
    console.warn('[IDJUV] Erro ao limpar sessões:', e);
  }
};

// Exportar como alias para compatibilidade
export { supabase as supabaseExternal };
