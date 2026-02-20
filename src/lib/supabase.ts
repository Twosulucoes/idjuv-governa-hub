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
    // ID do projeto Lovable Cloud correto
    const CURRENT_PROJECT_ID = 'qvbhejhcktcaftiamksd';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove chaves de auth legadas
      if (key === 'idjuv-external-auth') {
        keysToRemove.push(key);
      }

      // Remove chaves de versões antigas do @App
      if (key.startsWith('@App:')) {
        keysToRemove.push(key);
      }

      // Remove tokens de outros projetos Supabase (sb-* que NÃO são do projeto atual)
      if (key.startsWith('sb-') && !key.includes(CURRENT_PROJECT_ID)) {
        keysToRemove.push(key);
        console.log('[Supabase] Token de projeto externo removido:', key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log('[Supabase] Chaves limpas:', keysToRemove);
    }
  } catch (e) {
    console.warn('[Supabase] Erro ao limpar sessões:', e);
  }
};

export { supabase as supabaseExternal };
