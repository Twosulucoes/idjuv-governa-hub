/**
 * Hook para gerenciar conteúdos do CMS centralizado
 * Usado pelo módulo de Comunicação para gerenciar conteúdo de todo o portal
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipos baseados nos enums do banco
export type CMSDestino = 
  | "portal_home"
  | "portal_noticias"
  | "portal_eventos"
  | "portal_programas"
  | "selecoes_estudantis"
  | "jogos_escolares"
  | "esports"
  | "institucional"
  | "transparencia"
  | "redes_sociais";

export type CMSTipoConteudo = 
  | "noticia"
  | "comunicado"
  | "banner"
  | "destaque"
  | "evento"
  | "galeria"
  | "video"
  | "documento";

export type CMSStatus = "rascunho" | "revisao" | "aprovado" | "publicado" | "arquivado";

export interface CMSConteudo {
  id: string;
  titulo: string;
  slug: string;
  subtitulo: string | null;
  resumo: string | null;
  conteudo: string | null;
  conteudo_html: string | null;
  tipo: CMSTipoConteudo;
  destino: CMSDestino;
  categoria: string | null;
  tags: string[] | null;
  imagem_destaque_url: string | null;
  imagem_destaque_alt: string | null;
  video_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: CMSStatus;
  destaque: boolean | null;
  ordem: number | null;
  data_publicacao: string | null;
  data_expiracao: string | null;
  autor_id: string | null;
  autor_nome: string | null;
  revisor_id: string | null;
  revisor_nome: string | null;
  aprovador_id: string | null;
  data_aprovacao: string | null;
  visualizacoes: number | null;
  created_at: string;
  updated_at: string;
}

export type CMSConteudoInput = Omit<CMSConteudo, "id" | "created_at" | "updated_at" | "visualizacoes">;

// Labels para destinos
export const DESTINO_LABELS: Record<CMSDestino, string> = {
  portal_home: "Portal - Home",
  portal_noticias: "Portal - Notícias",
  portal_eventos: "Portal - Eventos",
  portal_programas: "Portal - Programas",
  selecoes_estudantis: "Seleções Estudantis",
  jogos_escolares: "Jogos Escolares",
  esports: "eSports",
  institucional: "Institucional",
  transparencia: "Transparência",
  redes_sociais: "Redes Sociais",
};

// Labels para tipos
export const TIPO_LABELS: Record<CMSTipoConteudo, string> = {
  noticia: "Notícia",
  comunicado: "Comunicado",
  banner: "Banner",
  destaque: "Destaque",
  evento: "Evento",
  galeria: "Galeria",
  video: "Vídeo",
  documento: "Documento",
};

// Labels para status
export const STATUS_LABELS: Record<CMSStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em Revisão",
  aprovado: "Aprovado",
  publicado: "Publicado",
  arquivado: "Arquivado",
};

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

interface UseCMSConteudosOptions {
  destino?: CMSDestino;
  tipo?: CMSTipoConteudo;
  status?: CMSStatus;
  apenasPublicados?: boolean;
}

export function useCMSConteudos(options?: UseCMSConteudosOptions) {
  const queryClient = useQueryClient();

  const queryKey = ["cms-conteudos", options?.destino, options?.tipo, options?.status, options?.apenasPublicados];

  const { data: conteudos = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("cms_conteudos")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.destino) {
        query = query.eq("destino", options.destino);
      }
      if (options?.tipo) {
        query = query.eq("tipo", options.tipo);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.apenasPublicados) {
        query = query.eq("status", "publicado");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CMSConteudo[];
    },
  });

  const createConteudo = useMutation({
    mutationFn: async (input: Partial<CMSConteudoInput>) => {
      const slug = input.slug || gerarSlug(input.titulo || "conteudo");
      
      const { data, error } = await supabase
        .from("cms_conteudos")
        .insert({
          titulo: input.titulo || "Novo Conteúdo",
          slug,
          subtitulo: input.subtitulo || null,
          resumo: input.resumo || null,
          conteudo: input.conteudo || null,
          conteudo_html: input.conteudo_html || null,
          tipo: input.tipo || "noticia",
          destino: input.destino || "portal_noticias",
          categoria: input.categoria || null,
          tags: input.tags || [],
          imagem_destaque_url: input.imagem_destaque_url || null,
          imagem_destaque_alt: input.imagem_destaque_alt || null,
          video_url: input.video_url || null,
          meta_title: input.meta_title || null,
          meta_description: input.meta_description || null,
          status: input.status || "rascunho",
          destaque: input.destaque || false,
          ordem: input.ordem || 0,
          data_publicacao: input.data_publicacao || null,
          data_expiracao: input.data_expiracao || null,
          autor_id: input.autor_id || null,
          autor_nome: input.autor_nome || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-conteudos"] });
      toast.success("Conteúdo criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar conteúdo: " + error.message);
    },
  });

  const updateConteudo = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CMSConteudoInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("cms_conteudos")
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
      queryClient.invalidateQueries({ queryKey: ["cms-conteudos"] });
      toast.success("Conteúdo atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteConteudo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cms_conteudos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-conteudos"] });
      toast.success("Conteúdo excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const publicarConteudo = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("cms_conteudos")
        .update({
          status: "publicado",
          data_publicacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-conteudos"] });
      toast.success("Conteúdo publicado!");
    },
    onError: (error) => {
      toast.error("Erro ao publicar: " + error.message);
    },
  });

  const despublicarConteudo = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("cms_conteudos")
        .update({
          status: "rascunho",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-conteudos"] });
      toast.success("Conteúdo despublicado!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  return {
    conteudos,
    isLoading,
    error,
    createConteudo,
    updateConteudo,
    deleteConteudo,
    publicarConteudo,
    despublicarConteudo,
  };
}

// Hook para categorias
export function useCMSCategorias() {
  const queryClient = useQueryClient();

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["cms-categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_categorias")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return { categorias, isLoading };
}
