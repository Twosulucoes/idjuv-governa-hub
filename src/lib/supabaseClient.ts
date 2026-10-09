/**
 * Helper para obter o cliente Supabase
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Retorna o cliente Supabase ativo (definido por VITE_SUPABASE_URL)
 */
export function getActiveSupabaseClient() {
  return supabase;
}

/**
 * Verifica se está usando cliente externo
 */
export function isUsingExternalClient(): boolean {
  return false;
}

// Re-exporta para compatibilidade
export { supabase, isSupabaseConfigured };
export const supabaseExternal = supabase;
