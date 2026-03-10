/**
 * Hook para gerenciar vínculos múltiplos de um servidor
 * Usa a nova tabela vinculos_servidor (1:N)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipos
export type TipoVinculoServidor =
  | "efetivo"
  | "comissionado"
  | "cedido_entrada"
  | "requisitado"
  | "federal"
  | "temporario"
  | "estagiario";

export type OrigemVinculo =
  | "idjuv"
  | "estado_rr"
  | "federal"
  | "municipal"
  | "outro_orgao";

export interface VinculoServidor {
  id: string;
  servidor_id: string;
  tipo: TipoVinculoServidor;
  origem: OrigemVinculo;
  orgao_nome?: string;
  cargo_id?: string;
  unidade_id?: string;
  funcao_exercida?: string;
  onus?: "origem" | "destino" | "compartilhado";
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  ato_tipo?: string;
  ato_numero?: string;
  ato_data?: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  ato_url?: string;
  remuneracao_bruta?: number;
  gratificacoes?: number;
  observacoes?: string;
  created_at?: string;
  // Joins
  cargo?: { id: string; nome: string; sigla?: string };
  unidade?: { id: string; nome: string; sigla?: string };
}

export interface ServidorTipoDerivado {
  servidor_id: string;
  nome_completo: string;
  matricula?: string;
  tipo_derivado: string;
  total_vinculos_ativos: number;
  tipos_ativos: string[] | null;
}

// Labels para exibição
export const TIPO_VINCULO_LABELS: Record<TipoVinculoServidor, string> = {
  efetivo: "Efetivo",
  comissionado: "Comissionado",
  cedido_entrada: "Cedido (Entrada)",
  requisitado: "Requisitado",
  federal: "Federal",
  temporario: "Temporário",
  estagiario: "Estagiário",
};

export const TIPO_DERIVADO_LABELS: Record<string, string> = {
  efetivo: "Efetivo",
  comissionado: "Comissionado",
  efetivo_comissionado: "Efetivo + Comissionado",
  cedido_entrada: "Cedido (Entrada)",
  cedido_comissionado: "Cedido + Comissionado",
  federal: "Federal",
  federal_comissionado: "Federal + Comissionado",
  requisitado: "Requisitado",
  nao_classificado: "Não classificado",
};

export const TIPO_DERIVADO_COLORS: Record<string, string> = {
  efetivo: "bg-success/20 text-success border-success/30",
  comissionado: "bg-primary/20 text-primary border-primary/30",
  efetivo_comissionado: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  cedido_entrada: "bg-info/20 text-info border-info/30",
  cedido_comissionado: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
  federal: "bg-violet-500/20 text-violet-600 border-violet-500/30",
  federal_comissionado: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  requisitado: "bg-warning/20 text-warning border-warning/30",
  nao_classificado: "bg-muted text-muted-foreground border-muted",
};

export const ORIGEM_LABELS: Record<OrigemVinculo, string> = {
  idjuv: "IDJuv",
  estado_rr: "Estado de Roraima",
  federal: "Federal",
  municipal: "Municipal",
  outro_orgao: "Outro Órgão",
};

// Hook: Buscar vínculos de um servidor
export function useVinculosServidor(servidorId?: string) {
  return useQuery({
    queryKey: ["vinculos-servidor", servidorId],
    enabled: !!servidorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vinculos_servidor")
        .select("*")
        .eq("servidor_id", servidorId!)
        .order("ativo", { ascending: false })
        .order("data_inicio", { ascending: false });
      if (error) throw error;

      // Buscar cargos e unidades
      const cargoIds = [...new Set((data || []).map(v => v.cargo_id).filter(Boolean))];
      const unidadeIds = [...new Set((data || []).map(v => v.unidade_id).filter(Boolean))];

      const [cargos, unidades] = await Promise.all([
        cargoIds.length > 0
          ? supabase.from("cargos").select("id, nome, sigla").in("id", cargoIds).then(r => r.data || [])
          : Promise.resolve([]),
        unidadeIds.length > 0
          ? supabase.from("estrutura_organizacional").select("id, nome, sigla").in("id", unidadeIds).then(r => r.data || [])
          : Promise.resolve([]),
      ]);

      const cargosMap = new Map(cargos.map((c: any) => [c.id, c]));
      const unidadesMap = new Map(unidades.map((u: any) => [u.id, u]));

      return (data || []).map(v => ({
        ...v,
        cargo: v.cargo_id ? cargosMap.get(v.cargo_id) : undefined,
        unidade: v.unidade_id ? unidadesMap.get(v.unidade_id) : undefined,
      })) as VinculoServidor[];
    },
  });
}

// Hook: Buscar tipos derivados para listagem
export function useServidoresTipoDerivado() {
  return useQuery({
    queryKey: ["servidores-tipo-derivado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_servidor_tipo_derivado")
        .select("*");
      if (error) throw error;
      return (data || []) as ServidorTipoDerivado[];
    },
  });
}

// Mutations
export function useVinculoMutations(servidorId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vinculos-servidor", servidorId] });
    queryClient.invalidateQueries({ queryKey: ["servidores-tipo-derivado"] });
    queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
  };

  const criar = useMutation({
    mutationFn: async (vinculo: Omit<VinculoServidor, "id" | "created_at" | "cargo" | "unidade">) => {
      const { data, error } = await supabase
        .from("vinculos_servidor")
        .insert(vinculo as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Vínculo criado com sucesso");
      invalidate();
    },
    onError: (err: any) => toast.error("Erro ao criar vínculo: " + err.message),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VinculoServidor> & { id: string }) => {
      const { cargo, unidade, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from("vinculos_servidor")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Vínculo atualizado");
      invalidate();
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message),
  });

  const encerrar = useMutation({
    mutationFn: async ({ id, dataFim }: { id: string; dataFim: string }) => {
      const { error } = await supabase
        .from("vinculos_servidor")
        .update({ ativo: false, data_fim: dataFim })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo encerrado");
      invalidate();
    },
    onError: (err: any) => toast.error("Erro ao encerrar: " + err.message),
  });

  return { criar, atualizar, encerrar };
}
