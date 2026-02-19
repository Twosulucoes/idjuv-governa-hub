/**
 * Cliente Supabase - Lovable Cloud
 * CORREÇÃO: clearOldSessions não apaga mais a sessão ativa.
 */

import { supabase as lovableSupabase } from '@/integrations/supabase/client';

export const supabase = lovableSupabase;

export const isSupabaseConfigured = (): boolean => true;

export const getConnectionInfo = () => ({
  configured: true,
  url: 'lovable-cloud',
  mode: 'lovable-cloud',
});

/**
 * Limpa APENAS sessões antigas/corrompidas.
 *
 * ✅ CORREÇÃO: A versão anterior apagava TODAS as chaves `sb-*`, incluindo
 * o token de sessão ativo que o Supabase acabara de criar durante o signIn.
 * Isso causava perda de sessão em race conditions.
 *
 * Agora limpamos apenas:
 * - Chaves de auth de apps diferentes (idjuv-external-auth)
 * - Chaves de outras origens (não do cliente atual)
 *
 * O Supabase gerencia o próprio storage de sessão — não interferir.
 */
export const clearOldSessions = () => {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove APENAS chaves de auth externo e chaves de outros apps
      // NÃO remove sb-* pois o Supabase precisa delas para manter a sessão
      if (key === 'idjuv-external-auth') {
        keysToRemove.push(key);
      }

      // Remove chaves de versões antigas do @App (estado paralelo que causava bugs)
      if (key.startsWith('@App:')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log('[Supabase] Chaves legadas removidas:', keysToRemove);
    }
  } catch (e) {
    console.warn('[Supabase] Erro ao limpar sessões:', e);
  }
};

export { supabase as supabaseExternal };
