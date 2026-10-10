/**
 * Busca de bem patrimonial por código (número de tombamento, QR ou plaqueta antiga).
 *
 * A busca roda no servidor (RPC `patrimonio_buscar_bem_por_codigo`, sujeita à RLS),
 * que normaliza o código (trim + maiúsculas) e devolve até 5 bens ordenados pelo
 * melhor casamento: número de tombamento, depois codigo_qr, depois patrimonio_anterior.
 * Este hook devolve só o primeiro (melhor) resultado.
 */

import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BemEncontrado = Tables<"bens_patrimoniais">;

/**
 * Versão sem estado (para uso fora de componentes, ex.: dentro de mutations).
 * Devolve o melhor resultado ou null; lança se a RPC falhar.
 */
export async function buscarBemPorCodigo(codigo: string): Promise<BemEncontrado | null> {
  const valor = codigo.trim();
  if (!valor) return null;
  // RPC ainda não está no types.ts gerado: cast no padrão do repo.
  const { data, error } = await supabase.rpc(
    "patrimonio_buscar_bem_por_codigo" as never,
    { p_codigo: valor } as never,
  );
  if (error) throw error;
  const lista = (data ?? []) as unknown as BemEncontrado[];
  return lista[0] ?? null;
}

export function useBuscarBemPorCodigo(): {
  buscar: (codigo: string) => Promise<BemEncontrado | null>;
  buscando: boolean;
} {
  const [buscando, setBuscando] = useState(false);

  const buscar = useCallback(async (codigo: string): Promise<BemEncontrado | null> => {
    const valor = codigo.trim();
    if (!valor) return null;

    setBuscando(true);
    try {
      return await buscarBemPorCodigo(valor);
    } finally {
      setBuscando(false);
    }
  }, []);

  return { buscar, buscando };
}
