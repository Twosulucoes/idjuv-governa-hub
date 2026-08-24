/**
 * Cliente Supabase
 * CORREÇÃO: clearOldSessions não apaga mais a sessão ativa.
 */

import { supabase as lovableSupabase } from '@/integrations/supabase/client';

export const supabase = lovableSupabase;

export const isSupabaseConfigured = (): boolean => true;

export const getConnectionInfo = () => ({
  configured: true,
  url: import.meta.env.VITE_SUPABASE_URL ?? 'não configurado',
  mode: 'supabase',
});

/**
 * Ref do projeto Supabase atual, usado para reconhecer a chave de sessão
 * própria (`sb-<ref>-auth-token`) em `clearOldSessions`. Prioriza
 * VITE_SUPABASE_PROJECT_ID; se ausente, deriva do subdomínio de
 * VITE_SUPABASE_URL — nunca hardcoded, para não quebrar login depois de
 * trocar de projeto/instância (Lovable Cloud, Supabase próprio, self-hosted).
 */
const getCurrentProjectRef = (): string | null => {
  const explicit = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (explicit) return explicit;

  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return null;
  }
};

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
    const currentProjectRef = getCurrentProjectRef();

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

      // Remove tokens de outros projetos Supabase (sb-* que NÃO são do projeto
      // atual). Sem o ref do projeto atual (env não configurado), não dá para
      // distinguir "token externo" de "token próprio" com segurança — melhor
      // não remover nada do que apagar a sessão que acabou de ser criada.
      if (currentProjectRef && key.startsWith('sb-') && !key.includes(currentProjectRef)) {
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
