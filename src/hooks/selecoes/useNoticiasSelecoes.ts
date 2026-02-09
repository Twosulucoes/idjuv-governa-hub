/**
 * Hook para gerenciar notícias das Seleções Estudantis
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NoticiaSelecao {
  id: string;
  titulo: string;
  slug: string;
  subtitulo: string | null;
  conteudo: string;
  resumo: string | null;
  imagem_destaque_url: string | null;
  imagem_destaque_alt: string | null;
  categoria: string;
  tags: string[] | null;
  evento_relacionado: string | null;
  autor_id: string | null;
  autor_nome: string | null;
  status: "rascunho" | "publicado" | "arquivado";
  destaque: boolean | null;
  data_publicacao: string | null;
  visualizacoes: number | null;
  created_at: string;
  updated_at: string;
}

export type NoticiaInput = Omit<NoticiaSelecao, "id" | "created_at" | "updated_at" | "visualizacoes">;

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function useNoticiasSelecoes() {
  const queryClient = useQueryClient();

  const { data: noticias = [], isLoading, error } = useQuery({
    queryKey: ["noticias-selecoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("noticias_eventos_esportivos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NoticiaSelecao[];
    },
  });

  const createNoticia = useMutation({
    mutationFn: async (input: Partial<NoticiaInput>) => {
      const slug = input.slug || gerarSlug(input.titulo || "noticia");
      
      const { data, error } = await supabase
        .from("noticias_eventos_esportivos")
        .insert({
          titulo: input.titulo || "Nova Notícia",
          slug,
          subtitulo: input.subtitulo || null,
          conteudo: input.conteudo || "",
          resumo: input.resumo || null,
          imagem_destaque_url: input.imagem_destaque_url || null,
          imagem_destaque_alt: input.imagem_destaque_alt || null,
          categoria: input.categoria || "jogos-juventude",
          tags: input.tags || [],
          evento_relacionado: input.evento_relacionado || "selecoes-2026",
          autor_id: input.autor_id || null,
          autor_nome: input.autor_nome || null,
          status: input.status || "rascunho",
          destaque: input.destaque || false,
          data_publicacao: input.data_publicacao || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noticias-selecoes"] });
      toast.success("Notícia criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar notícia: " + error.message);
    },
  });

  const updateNoticia = useMutation({
    mutationFn: async ({ id, ...input }: Partial<NoticiaInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("noticias_eventos_esportivos")
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
      queryClient.invalidateQueries({ queryKey: ["noticias-selecoes"] });
      toast.success("Notícia atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteNoticia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("noticias_eventos_esportivos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noticias-selecoes"] });
      toast.success("Notícia excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  return {
    noticias,
    isLoading,
    error,
    createNoticia,
    updateNoticia,
    deleteNoticia,
  };
}
