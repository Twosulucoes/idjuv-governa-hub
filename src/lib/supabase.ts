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
  const keysToRemove = [
    'idjuv-external-auth',
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignora erro
    }
  });
  
  console.log('[IDJUV] Sessões antigas removidas');
};

// Exportar como alias para compatibilidade
export { supabase as supabaseExternal };
