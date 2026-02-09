/**
 * Hook para gerenciar galerias do CMS
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CMSGaleria {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  destino: string;
  categoria: string | null;
  status: "rascunho" | "publicado" | "arquivado";
  imagem_capa_url: string | null;
  autor_id: string | null;
  autor_nome: string | null;
  data_publicacao: string | null;
  visualizacoes: number;
  created_at: string;
  updated_at: string;
}

export interface CMSGaleriaFoto {
  id: string;
  galeria_id: string;
  url: string;
  thumbnail_url: string | null;
  titulo: string | null;
  legenda: string | null;
  ordem: number;
  created_at: string;
}

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function useCMSGalerias(options?: { destino?: string; status?: string }) {
  const queryClient = useQueryClient();

  const queryKey = ["cms-galerias", options?.destino, options?.status];

  const { data: galerias = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("cms_galerias" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.destino) {
        query = query.eq("destino", options.destino);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CMSGaleria[];
    },
  });

  const createGaleria = useMutation({
    mutationFn: async (input: Partial<CMSGaleria>) => {
      const slug = input.slug || gerarSlug(input.titulo || "galeria");
      
      const { data, error } = await supabase
        .from("cms_galerias" as any)
        .insert({
          titulo: input.titulo || "Nova Galeria",
          slug,
          descricao: input.descricao || null,
          destino: input.destino || "portal_noticias",
          categoria: input.categoria || null,
          status: input.status || "rascunho",
          imagem_capa_url: input.imagem_capa_url || null,
          autor_nome: input.autor_nome || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CMSGaleria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-galerias"] });
      toast.success("Galeria criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar galeria: " + error.message);
    },
  });

  const updateGaleria = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CMSGaleria> & { id: string }) => {
      const { data, error } = await supabase
        .from("cms_galerias" as any)
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CMSGaleria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-galerias"] });
      toast.success("Galeria atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteGaleria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cms_galerias" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-galerias"] });
      toast.success("Galeria excluída!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const publicarGaleria = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("cms_galerias" as any)
        .update({
          status: "publicado",
          data_publicacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CMSGaleria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-galerias"] });
      toast.success("Galeria publicada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao publicar: " + error.message);
    },
  });

  return {
    galerias,
    isLoading,
    error,
    createGaleria,
    updateGaleria,
    deleteGaleria,
    publicarGaleria,
  };
}

// Hook para fotos de uma galeria
export function useCMSGaleriaFotos(galeriaId: string | null) {
  const queryClient = useQueryClient();

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ["cms-galeria-fotos", galeriaId],
    queryFn: async () => {
      if (!galeriaId) return [];
      
      const { data, error } = await supabase
        .from("cms_galeria_fotos" as any)
        .select("*")
        .eq("galeria_id", galeriaId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as CMSGaleriaFoto[];
    },
    enabled: !!galeriaId,
  });

  const syncFotos = useMutation({
    mutationFn: async ({ galeriaId, fotos }: { galeriaId: string; fotos: Omit<CMSGaleriaFoto, "id" | "galeria_id" | "created_at">[] }) => {
      // Deletar fotos existentes
      await supabase
        .from("cms_galeria_fotos" as any)
        .delete()
        .eq("galeria_id", galeriaId);

      // Inserir novas fotos
      if (fotos.length > 0) {
        const { error } = await supabase
          .from("cms_galeria_fotos" as any)
          .insert(
            fotos.map((f, i) => ({
              galeria_id: galeriaId,
              url: f.url,
              thumbnail_url: f.thumbnail_url || f.url,
              titulo: f.titulo || null,
              legenda: f.legenda || null,
              ordem: i,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-galeria-fotos"] });
      toast.success("Fotos atualizadas!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar fotos: " + error.message);
    },
  });

  return {
    fotos,
    isLoading,
    syncFotos,
  };
}
