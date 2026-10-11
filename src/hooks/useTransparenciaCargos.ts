/**
 * Quadro público de cargos comissionados (Portal da Transparência).
 *
 * Lê a RPC pública `transparencia_cargos_publicos` (migração 20261010234000), executável por `anon`:
 * as tabelas de cargos e servidores continuam fechadas e o banco devolve só o que a LAI torna público
 * (cargo, símbolo, vencimento, unidade, vagas e o nome do ocupante). Indicação, CPF, matrícula e
 * contato nunca saem do servidor. Substitui os antigos public/data/cargos.json e cargos.csv.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Linha devolvida pela RPC (uma por vaga); fora dos tipos gerados. */
export interface VagaCargoPublico {
  cargo_id: string;
  cargo: string;
  simbolo: string | null;
  categoria: string | null;
  natureza: string | null;
  nivel_hierarquico: number | null;
  vencimento: number | null;
  lei_criacao_numero: string | null;
  lei_criacao_data: string | null;
  unidade_id: string | null;
  unidade: string | null;
  unidade_sigla: string | null;
  unidade_superior: string | null;
  diretoria: string | null;
  diretoria_tipo: string | null;
  vaga: number;
  vagas_previstas: number;
  vagas_ocupadas: number;
  ocupante: string | null;
  atualizado_em: string | null;
}

export function useTransparenciaCargos() {
  return useQuery({
    queryKey: ["transparencia-cargos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("transparencia_cargos_publicos" as never);
      if (error) throw error;
      return (data as unknown as VagaCargoPublico[] | null) ?? [];
    },
  });
}
