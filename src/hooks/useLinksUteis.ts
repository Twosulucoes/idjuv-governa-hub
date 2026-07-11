/**
 * Hook para gerenciar os "Links Úteis" do site público (tabela links_uteis).
 * - useLinksUteis(): uso administrativo (lista tudo + mutations)
 * - useLinksUteisPublicos(): uso público (apenas ativos)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LinkUtil {
  id: string;
  titulo: string;
  url: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useLinksUteis() {
  const queryClient = useQueryClient();

  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ["links-uteis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links_uteis" as any)
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as LinkUtil[];
    },
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["links-uteis"] });
    queryClient.invalidateQueries({ queryKey: ["links-uteis-publicos"] });
  };

  const createLink = useMutation({
    mutationFn: async (input: Partial<LinkUtil>) => {
      const { data, error } = await supabase
        .from("links_uteis" as any)
        .insert({
          titulo: input.titulo || "Novo link",
          url: input.url || "",
          descricao: input.descricao || null,
          ordem: input.ordem ?? 0,
          ativo: input.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as LinkUtil;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Link criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar link: " + error.message);
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, ...input }: Partial<LinkUtil> & { id: string }) => {
      const { data, error } = await supabase
        .from("links_uteis" as any)
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as LinkUtil;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Link atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar link: " + error.message);
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("links_uteis" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Link excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir link: " + error.message);
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("links_uteis" as any)
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as LinkUtil;
    },
    onSuccess: (data) => {
      invalidar();
      toast.success(data.ativo ? `"${data.titulo}" visível no site` : `"${data.titulo}" oculto do site`);
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar visibilidade: " + error.message);
    },
  });

  return { links, isLoading, error, createLink, updateLink, deleteLink, toggleAtivo };
}

// Hook público (sem autenticação) para a página /links-uteis
export function useLinksUteisPublicos() {
  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ["links-uteis-publicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links_uteis" as any)
        .select("id, titulo, url, descricao, ordem")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Pick<LinkUtil, "id" | "titulo" | "url" | "descricao" | "ordem">[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { links, isLoading, error };
}
