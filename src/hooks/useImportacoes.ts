/**
 * Histórico de importações de dados (tabela `importacoes`).
 * A RLS só devolve as importações dos módulos que o usuário acessa.
 */

import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface RegistroImportacao {
  id: string;
  tipo: string;
  modulo: string;
  arquivo_nome: string;
  arquivo_sha256: string;
  arquivo_tamanho: number;
  exercicio: number | null;
  resumo: {
    totais?: Record<string, number>;
    criados?: Record<string, string[]>;
    ausentes?: string[];
  };
  created_by: string | null;
  created_at: string;
  autor?: { full_name: string | null } | null;
}

// `importacoes` ainda não está em types.ts (gerado): consulta sem tipagem do client.
const db = supabase as unknown as SupabaseClient;
const tabela = () => db.from("importacoes");

export function useHistoricoImportacoes(tipo?: string) {
  return useQuery({
    queryKey: ["importacoes", tipo ?? "todas"],
    queryFn: async () => {
      let query = tabela()
        .select("id, tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, created_by, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (tipo) query = query.eq("tipo", tipo);
      const { data, error } = await query;
      if (error) throw error;
      const registros = (data ?? []) as unknown as RegistroImportacao[];

      // Nome de quem importou (profiles; o que a RLS não liberar fica sem nome)
      const ids = [...new Set(registros.map((r) => r.created_by).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: perfis } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const nomes = new Map((perfis ?? []).map((p) => [p.id, p.full_name]));
        registros.forEach((r) => {
          r.autor = r.created_by ? { full_name: nomes.get(r.created_by) ?? null } : null;
        });
      }
      return registros;
    },
  });
}

/** Importação anterior do mesmo arquivo (mesmo hash), se houver. */
export async function buscarImportacaoPorHash(tipo: string, sha256: string) {
  const { data } = await tabela()
    .select("id, created_at")
    .eq("tipo", tipo)
    .eq("arquivo_sha256", sha256)
    .order("created_at", { ascending: false })
    .limit(1);
  return ((data ?? [])[0] as unknown as { id: string; created_at: string } | undefined) ?? null;
}
