/**
 * Helper para obter o cliente Supabase
 * 
 * MIGRADO: Usa apenas o Supabase próprio do usuário.
 * O cliente Lovable Cloud não é mais utilizado.
 */

import { supabase, isSupabaseConfigured, supabaseExternal } from '@/lib/supabase';

/**
 * Retorna o cliente Supabase ativo (sempre o próprio)
 */
export function getActiveSupabaseClient() {
  return supabase;
}

/**
 * Verifica se está usando cliente externo (sempre true agora)
 */
export function isUsingExternalClient(): boolean {
  return isSupabaseConfigured();
}

// Re-exporta para compatibilidade com código antigo
export { supabase, supabaseExternal, isSupabaseConfigured };
