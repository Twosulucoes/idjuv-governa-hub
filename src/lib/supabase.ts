/**
 * Cliente Supabase ÚNICO do sistema
 * 
 * Este cliente conecta ao Supabase PRÓPRIO do usuário.
 * Suporta dois formatos de variáveis de ambiente:
 * - VITE_SUPABASE_EXTERNAL_URL + VITE_SUPABASE_EXTERNAL_KEY (preferido)
 * - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (fallback)
 * 
 * IMPORTANTE: Este é o ÚNICO cliente Supabase do sistema.
 * O cliente nativo do Lovable NÃO é utilizado.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tenta ler variáveis com prefixo VITE_ primeiro, depois NEXT_PUBLIC_
const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_EXTERNAL_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_EXTERNAL_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  '';

// Storage key separada para evitar conflito com cliente antigo
const STORAGE_KEY = 'idjuv-external-auth';

// Flag para verificar se está configurado
const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Log de status
if (!isConfigured) {
  console.warn(
    '[IDJUV] ⚠️ Supabase externo não configurado.\n' +
    'Configure os secrets:\n' +
    '- VITE_SUPABASE_EXTERNAL_URL\n' +
    '- VITE_SUPABASE_EXTERNAL_KEY\n' +
    'O sistema usará o cliente Lovable Cloud como fallback.'
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
let supabase: SupabaseClient;

if (isConfigured) {
  // Usa cliente externo
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storageKey: STORAGE_KEY,
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // Fallback para Lovable Cloud
  const LOVABLE_URL = import.meta.env.VITE_SUPABASE_URL;
  const LOVABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  supabase = createClient(LOVABLE_URL || '', LOVABLE_KEY || '', {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export { supabase };

/**
 * Verifica se o cliente externo está configurado
 */
export const isSupabaseConfigured = (): boolean => isConfigured;

/**
 * Retorna informações sobre a conexão (sem expor chaves)
 */
export const getConnectionInfo = () => ({
  configured: isConfigured,
  url: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null,
  mode: isConfigured ? 'external' : 'lovable-cloud',
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
