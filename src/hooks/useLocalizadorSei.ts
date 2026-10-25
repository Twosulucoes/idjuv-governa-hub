/**
 * Localizador de processos do SEI: a busca única pelo nº (qualquer formato) ou por palavras e a lista de parados, sobre
 * as RPCs `localizar_processos_sei` e `processos_parados` (migração 20261102090000). As duas são SECURITY INVOKER:
 * cada fonte vem com a RLS dela, então a pessoa só acha o que já veria no módulo. `origem` chega como texto e é
 * estreitada para as oito fontes de `ORIGENS`.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { termoBuscavel } from '@/lib/processos/numeroSei';
import type { RegistroLocalizado } from '@/lib/processos/localizador';
import { DIAS_PARA_PARADO } from '@/lib/compras/evolucaoProcesso';

export type ProcessoParado = Omit<RegistroLocalizado, 'ref' | 'valor'> & { dias: number };

/** O valor só depois de `atraso` ms sem mudar (a busca não dispara a cada tecla). */
function useValorAtrasado<T>(valor: T, atraso: number): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(t);
  }, [valor, atraso]);
  return atrasado;
}

export function useLocalizarProcessos(termo: string) {
  const termoAtrasado = useValorAtrasado(termo.trim(), 300);
  const consulta = useQuery({
    queryKey: ['localizar_processos_sei', termoAtrasado],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('localizar_processos_sei', { p_termo: termoAtrasado, p_limite: 100 });
      if (error) throw new Error(error.message);
      return (data ?? []) as RegistroLocalizado[];
    },
    enabled: termoBuscavel(termoAtrasado),
  });
  return { ...consulta, termoBuscado: termoAtrasado, digitando: termo.trim() !== termoAtrasado };
}

export function useProcessosParados(dias: number = DIAS_PARA_PARADO) {
  return useQuery({
    queryKey: ['processos_parados', dias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('processos_parados', { p_dias: dias });
      if (error) throw new Error(error.message);
      return (data ?? []) as ProcessoParado[];
    },
  });
}
