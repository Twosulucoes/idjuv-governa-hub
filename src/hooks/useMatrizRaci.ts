/**
 * Matriz RACI cadastrada no banco (`matriz_raci_papeis`, `matriz_raci_processos`,
 * `matriz_raci_atribuicoes`). Leitura pelo módulo de governança (RLS por módulo).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TipoPapelRaci = Database["public"]["Enums"]["tipo_papel_raci"];

export interface PapelRaci {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
}

export interface ProcessoRaci {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  modulo_sistema: string | null;
}

export interface AtribuicaoRaci {
  id: string;
  processo_id: string;
  papel_id: string;
  tipo_papel: TipoPapelRaci;
  etapa_processo: string | null;
}

export interface MatrizRaci {
  papeis: PapelRaci[];
  processos: ProcessoRaci[];
  atribuicoes: AtribuicaoRaci[];
}

export function useMatrizRaci() {
  return useQuery({
    queryKey: ["matriz-raci"],
    queryFn: async (): Promise<MatrizRaci> => {
      const [papeis, processos, atribuicoes] = await Promise.all([
        supabase
          .from("matriz_raci_papeis")
          .select("id, codigo, nome, descricao")
          .eq("ativo", true)
          .order("codigo"),
        supabase
          .from("matriz_raci_processos")
          .select("id, codigo, nome, descricao, modulo_sistema")
          .eq("ativo", true)
          .order("modulo_sistema")
          .order("codigo"),
        supabase
          .from("matriz_raci_atribuicoes")
          .select("id, processo_id, papel_id, tipo_papel, etapa_processo")
          .eq("ativo", true)
          .order("created_at"),
      ]);
      if (papeis.error) throw papeis.error;
      if (processos.error) throw processos.error;
      if (atribuicoes.error) throw atribuicoes.error;
      return {
        papeis: papeis.data ?? [],
        processos: processos.data ?? [],
        atribuicoes: atribuicoes.data ?? [],
      };
    },
  });
}
