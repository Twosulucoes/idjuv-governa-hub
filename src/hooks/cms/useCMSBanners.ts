/**
 * Hook para gerenciar banners do CMS
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CMSDestino } from "./useCMSConteudos";

export interface CMSBanner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  imagem_mobile_url: string | null;
  link_url: string | null;
  link_texto: string | null;
  link_externo: boolean | null;
  destino: CMSDestino;
  posicao: string | null;
  ativo: boolean | null;
  ordem: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CMSBannerInput = Omit<CMSBanner, "id" | "created_at" | "updated_at">;

export const POSICAO_LABELS: Record<string, string> = {
  hero: "Hero (Principal)",
  sidebar: "Barra Lateral",
  footer: "Rodapé",
  popup: "Pop-up",
  inline: "Dentro do Conteúdo",
};

interface UseCMSBannersOptions {
  destino?: CMSDestino;
  posicao?: string;
  apenasAtivos?: boolean;
}

export function useCMSBanners(options?: UseCMSBannersOptions) {
  const queryClient = useQueryClient();

  const queryKey = ["cms-banners", options?.destino, options?.posicao, options?.apenasAtivos];

  const { data: banners = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("cms_banners")
        .select("*")
        .order("ordem", { ascending: true });

      if (options?.destino) {
        query = query.eq("destino", options.destino);
      }
      if (options?.posicao) {
        query = query.eq("posicao", options.posicao);
      }
      if (options?.apenasAtivos) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CMSBanner[];
    },
  });

  const createBanner = useMutation({
    mutationFn: async (input: Partial<CMSBannerInput>) => {
      const { data, error } = await supabase
        .from("cms_banners")
        .insert({
          titulo: input.titulo || "Novo Banner",
          subtitulo: input.subtitulo || null,
          imagem_url: input.imagem_url || "",
          imagem_mobile_url: input.imagem_mobile_url || null,
          link_url: input.link_url || null,
          link_texto: input.link_texto || null,
          link_externo: input.link_externo || false,
          destino: input.destino || "portal_home",
          posicao: input.posicao || "hero",
          ativo: input.ativo ?? true,
          ordem: input.ordem || 0,
          data_inicio: input.data_inicio || null,
          data_fim: input.data_fim || null,
          created_by: input.created_by || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      toast.success("Banner criado!");
    },
    onError: (error) => {
      toast.error("Erro ao criar banner: " + error.message);
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CMSBannerInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("cms_banners")
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
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      toast.success("Banner atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cms_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      toast.success("Banner excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("cms_banners")
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      toast.success(data.ativo ? "Banner ativado!" : "Banner desativado!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  return {
    banners,
    isLoading,
    error,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBanner,
  };
}
