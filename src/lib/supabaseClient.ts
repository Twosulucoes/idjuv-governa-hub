/**
 * Helper para obter o cliente Supabase correto
 * 
 * Usa o cliente externo se configurado, senão usa o cliente padrão.
 * Isso permite uma transição suave entre ambientes.
 */

import { supabaseExternal, isExternalSupabaseConfigured } from '@/lib/supabaseExternal';
import { supabase as supabaseDefault } from '@/integrations/supabase/client';

/**
 * Retorna o cliente Supabase ativo (externo se configurado, senão padrão)
 */
export function getActiveSupabaseClient() {
  return isExternalSupabaseConfigured() ? supabaseExternal : supabaseDefault;
}

/**
 * Verifica se está usando o cliente externo
 */
export function isUsingExternalClient(): boolean {
  return isExternalSupabaseConfigured();
}
