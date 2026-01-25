/**
 * Cliente Supabase conectado ao Supabase PRÓPRIO do usuário.
 * 
 * Este cliente usa as variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
 * 
 * Para operações que devem usar o Supabase externo,
 * importe este cliente em vez do cliente padrão.
 */

import { createClient } from '@supabase/supabase-js';

// Variáveis do Supabase próprio (configuradas nos secrets)
const EXTERNAL_SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Validação para garantir que as variáveis estão configuradas
if (!EXTERNAL_SUPABASE_URL || !EXTERNAL_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase Externo] Variáveis de ambiente não configuradas. ' +
    'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY nos secrets.'
  );
}

/**
 * Cliente do Supabase externo (seu próprio projeto Supabase)
 * 
 * Uso:
 * import { supabaseExternal } from '@/lib/supabaseExternal';
 * 
 * const { data } = await supabaseExternal.from('tabela').select('*');
 */
export const supabaseExternal = createClient(
  EXTERNAL_SUPABASE_URL || '',
  EXTERNAL_SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Verifica se o cliente externo está configurado corretamente
 */
export const isExternalSupabaseConfigured = (): boolean => {
  return Boolean(EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_ANON_KEY);
};

/**
 * Retorna informações sobre a conexão externa (sem expor chaves)
 */
export const getExternalConnectionInfo = () => ({
  configured: isExternalSupabaseConfigured(),
  url: EXTERNAL_SUPABASE_URL ? new URL(EXTERNAL_SUPABASE_URL).hostname : null,
});
