/**
 * Hook para gerenciar Publicações Oficiais da Transparência (tabela publicacoes_lai)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PublicacaoOficial {
  id: string;
  categoria: string;
  subcategoria: string | null;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  periodo_referencia: string | null;
  ano_referencia: number | null;
  mes_referencia: number | null;
  publicado: boolean;
  data_publicacao: string | null;
  ordem_exibicao: number;
  destaque: boolean;
  created_at: string;
  updated_at: string;
}

const BUCKET = "transparencia-publicacoes";

function extrairPathArquivo(arquivoUrl: string): string | null {
  const marcador = `/object/public/${BUCKET}/`;
  const idx = arquivoUrl.indexOf(marcador);
  if (idx === -1) return null;
  return arquivoUrl.slice(idx + marcador.length);
}

export async function uploadArquivoPublicacao(file: File) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("Arquivo muito grande. Máximo 10MB");
  }

  const fileName = `${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return { arquivo_url: urlData.publicUrl, arquivo_nome: file.name };
}

export function useTransparenciaPublicacoes() {
  const queryClient = useQueryClient();

  const { data: publicacoes = [], isLoading, error } = useQuery({
    queryKey: ["transparencia-publicacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publicacoes_lai" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PublicacaoOficial[];
    },
  });

  const createPublicacao = useMutation({
    mutationFn: async (input: Partial<PublicacaoOficial>) => {
      const { data, error } = await supabase
        .from("publicacoes_lai" as any)
        .insert({
          categoria: input.categoria || "Outro",
          subcategoria: input.subcategoria || null,
          titulo: input.titulo || "Nova publicação",
          descricao: input.descricao || null,
          arquivo_url: input.arquivo_url || null,
          arquivo_nome: input.arquivo_nome || null,
          destaque: input.destaque || false,
          publicado: input.publicado || false,
          data_publicacao: input.publicado ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicacaoOficial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes-publicas"] });
      toast.success("Publicação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar publicação: " + error.message);
    },
  });

  const updatePublicacao = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PublicacaoOficial> & { id: string }) => {
      const { data, error } = await supabase
        .from("publicacoes_lai" as any)
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicacaoOficial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes-publicas"] });
      toast.success("Publicação atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deletePublicacao = useMutation({
    mutationFn: async (publicacao: PublicacaoOficial) => {
      if (publicacao.arquivo_url) {
        const path = extrairPathArquivo(publicacao.arquivo_url);
        if (path) {
          await supabase.storage.from(BUCKET).remove([path]);
        }
      }

      const { error } = await supabase
        .from("publicacoes_lai" as any)
        .delete()
        .eq("id", publicacao.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes-publicas"] });
      toast.success("Publicação excluída!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const publicarPublicacao = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("publicacoes_lai" as any)
        .update({
          publicado: true,
          data_publicacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicacaoOficial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes-publicas"] });
      toast.success("Publicação enviada para o ar!");
    },
    onError: (error: any) => {
      toast.error("Erro ao publicar: " + error.message);
    },
  });

  const despublicarPublicacao = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("publicacoes_lai" as any)
        .update({
          publicado: false,
          data_publicacao: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicacaoOficial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transparencia-publicacoes-publicas"] });
      toast.success("Publicação retirada do ar.");
    },
    onError: (error: any) => {
      toast.error("Erro ao despublicar: " + error.message);
    },
  });

  return {
    publicacoes,
    isLoading,
    error,
    createPublicacao,
    updatePublicacao,
    deletePublicacao,
    publicarPublicacao,
    despublicarPublicacao,
  };
}

// Hook público (sem autenticação) para a página de Transparência
export function useTransparenciaPublicacoesPublicas() {
  const { data: publicacoes = [], isLoading, error } = useQuery({
    queryKey: ["transparencia-publicacoes-publicas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publicacoes_lai" as any)
        .select("id, categoria, subcategoria, titulo, descricao, arquivo_url, arquivo_nome, data_publicacao, destaque, ordem_exibicao")
        .eq("publicado", true)
        .order("destaque", { ascending: false })
        .order("ordem_exibicao", { ascending: true })
        .order("data_publicacao", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Pick<
        PublicacaoOficial,
        "id" | "categoria" | "subcategoria" | "titulo" | "descricao" | "arquivo_url" | "arquivo_nome" | "data_publicacao" | "destaque" | "ordem_exibicao"
      >[];
    },
  });

  return { publicacoes, isLoading, error };
}
