/**
 * Hook para gerenciar galeria de fotos das Seleções Estudantis
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FotoGaleria {
  id: string;
  titulo: string;
  descricao: string | null;
  foto_url: string;
  foto_thumbnail_url: string | null;
  modalidade: string | null;
  naipe: string | null;
  evento: string;
  data_evento: string | null;
  fotografo: string | null;
  ordem: number | null;
  destaque: boolean | null;
  status: "pendente" | "publicado" | "arquivado";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type FotoInput = Omit<FotoGaleria, "id" | "created_at" | "updated_at">;

export function useGaleriaSelecoes() {
  const queryClient = useQueryClient();

  const { data: fotos = [], isLoading, error } = useQuery({
    queryKey: ["galeria-selecoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galeria_eventos_esportivos")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FotoGaleria[];
    },
  });

  const createFoto = useMutation({
    mutationFn: async (input: Partial<FotoInput>) => {
      const { data, error } = await supabase
        .from("galeria_eventos_esportivos")
        .insert({
          titulo: input.titulo || "Foto sem título",
          descricao: input.descricao || null,
          foto_url: input.foto_url || "",
          foto_thumbnail_url: input.foto_thumbnail_url || null,
          modalidade: input.modalidade || null,
          naipe: input.naipe || null,
          evento: input.evento || "selecoes-2026",
          data_evento: input.data_evento || null,
          fotografo: input.fotografo || null,
          ordem: input.ordem || 0,
          destaque: input.destaque || false,
          status: input.status || "pendente",
          created_by: input.created_by || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galeria-selecoes"] });
      toast.success("Foto adicionada!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar foto: " + error.message);
    },
  });

  const updateFoto = useMutation({
    mutationFn: async ({ id, ...input }: Partial<FotoInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("galeria_eventos_esportivos")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galeria-selecoes"] });
      toast.success("Foto atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteFoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("galeria_eventos_esportivos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galeria-selecoes"] });
      toast.success("Foto excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  return {
    fotos,
    isLoading,
    error,
    createFoto,
    updateFoto,
    deleteFoto,
  };
}
