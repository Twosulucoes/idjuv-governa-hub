/**
 * FRONTEND PÚBLICO - PÁGINA INDIVIDUAL DE NOTÍCIA
 * Visualização completa de uma notícia
 */

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Tag,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface NoticiaCompleta {
  id: string;
  titulo: string;
  slug: string;
  subtitulo: string | null;
  resumo: string | null;
  conteudo: string | null;
  conteudo_html: string | null;
  imagem_destaque_url: string | null;
  imagem_destaque_alt: string | null;
  categoria: string | null;
  tags: string[] | null;
  autor_nome: string | null;
  data_publicacao: string | null;
  created_at: string;
  visualizacoes: number;
}

export default function NoticiaPage() {
  const { slug } = useParams();

  // Buscar notícia pelo slug
  const { data: noticia, isLoading, error } = useQuery({
    queryKey: ["noticia", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_conteudos" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .single();

      if (error) throw error;
      return data as unknown as NoticiaCompleta;
    },
    enabled: !!slug,
  });

  // Buscar notícias relacionadas
  const { data: relacionadas = [] } = useQuery({
    queryKey: ["noticias-relacionadas", noticia?.categoria],
    queryFn: async () => {
      if (!noticia?.categoria) return [];
      
      const { data, error } = await supabase
        .from("cms_conteudos" as any)
        .select("id, titulo, slug, imagem_destaque_url, data_publicacao")
        .eq("status", "publicado")
        .eq("tipo", "noticia")
        .eq("categoria", noticia.categoria)
        .neq("id", noticia.id)
        .order("data_publicacao", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as unknown as NoticiaCompleta[];
    },
    enabled: !!noticia?.categoria,
  });

  // Converter markdown para HTML
  const convertToHtml = (markdown: string): string => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="my-6"><img src="$2" alt="$1" class="w-full rounded-lg" /><figcaption class="text-sm text-muted-foreground mt-2 text-center">$1</figcaption></figure>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-6">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, '<br />');
  };

  // Compartilhar
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  
  const handleShare = async (platform: string) => {
    const title = noticia?.titulo || "";
    const url = shareUrl;

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
      return;
    }

    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="aspect-video w-full rounded-lg mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Notícia não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A notícia que você procura não existe ou foi removida.
          </p>
          <Link to="/noticias">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Notícias
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/noticias" className="hover:text-foreground">Notícias</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate max-w-[200px]">{noticia.titulo}</span>
          </nav>
        </div>
      </div>

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Voltar */}
          <Link to="/noticias" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Notícias
          </Link>

          {/* Categoria e Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {noticia.categoria && (
              <Badge variant="default">{noticia.categoria}</Badge>
            )}
            {noticia.tags?.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          {/* Título */}
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            {noticia.titulo}
          </h1>

          {/* Subtítulo */}
          {noticia.subtitulo && (
            <p className="text-xl text-muted-foreground mb-6">
              {noticia.subtitulo}
            </p>
          )}

          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(noticia.data_publicacao || noticia.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            {noticia.autor_nome && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {noticia.autor_nome}
              </span>
            )}
          </div>

          <Separator className="mb-8" />

          {/* Imagem de Destaque */}
          {noticia.imagem_destaque_url && (
            <figure className="mb-8">
              <img
                src={noticia.imagem_destaque_url}
                alt={noticia.imagem_destaque_alt || noticia.titulo}
                className="w-full rounded-lg"
              />
              {noticia.imagem_destaque_alt && (
                <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                  {noticia.imagem_destaque_alt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Conteúdo */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="my-4">${convertToHtml(noticia.conteudo || "")}</p>` 
            }}
          />

          <Separator className="my-8" />

          {/* Compartilhar */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar:
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("facebook")}
                title="Compartilhar no Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("twitter")}
                title="Compartilhar no Twitter"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("linkedin")}
                title="Compartilhar no LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("copy")}
                title="Copiar link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Notícias Relacionadas */}
        {relacionadas.length > 0 && (
          <section className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">Notícias Relacionadas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relacionadas.map((rel: any) => (
                <Link key={rel.id} to={`/noticias/${rel.slug}`}>
                  <Card className="overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex">
                      <div className="w-32 h-24 flex-shrink-0 bg-muted">
                        {rel.imagem_destaque_url ? (
                          <img
                            src={rel.imagem_destaque_url}
                            alt={rel.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 flex-1">
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {rel.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(rel.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
