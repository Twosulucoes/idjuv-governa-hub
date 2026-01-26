/**
 * Cliente Supabase ÚNICO do sistema
 * 
 * Este cliente conecta ao Supabase PRÓPRIO do usuário.
 * Usa as variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
 * 
 * IMPORTANTE: Este é o ÚNICO cliente Supabase do sistema.
 * O cliente nativo do Lovable NÃO é utilizado.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis do Supabase próprio (configuradas nos secrets)
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Storage key separada para evitar conflito com cliente antigo
const STORAGE_KEY = 'idjuv-external-auth';

// Validação para garantir que as variáveis estão configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[IDJUV] ⚠️ Variáveis de ambiente não configuradas!\n' +
    'Configure os secrets:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
  );
}

/**
 * Cliente Supabase único do sistema
 * 
 * Uso:
 * import { supabase } from '@/lib/supabase';
 * 
 * const { data } = await supabase.from('tabela').select('*');
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      storageKey: STORAGE_KEY,
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Verifica se o cliente está configurado corretamente
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

/**
 * Retorna informações sobre a conexão (sem expor chaves)
 */
export const getConnectionInfo = () => ({
  configured: isSupabaseConfigured(),
  url: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null,
});

/**
 * Limpa sessões antigas/corrompidas
 * Útil quando há erros de refresh token
 */
export const clearOldSessions = () => {
  // Remove chaves antigas do Lovable Cloud
  const keysToRemove = [
    'sb-tewgloptmijuaychoxnq-auth-token',
    'supabase.auth.token',
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
