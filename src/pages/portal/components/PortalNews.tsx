/**
 * PortalNews - Seção de notícias do portal
 * Consome dados do CMS centralizado (cms_conteudos)
 */

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, ChevronRight, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import arenaImage from "@/assets/portal/arena-complex.jpg";

interface NoticiaPortal {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  categoria: string | null;
  imagem_destaque_url: string | null;
  data_publicacao: string | null;
  destaque: boolean | null;
}

interface NewsCardProps {
  noticia: NoticiaPortal;
  featured?: boolean;
  delay: number;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  return format(new Date(dateString), "dd MMM yyyy", { locale: ptBR });
}

function NewsCard({ noticia, featured, delay }: NewsCardProps) {
  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="md:col-span-2 group cursor-pointer"
      >
        <Link to={`/noticias-portal/${noticia.slug}`}>
          <div className="relative h-[400px] rounded-2xl overflow-hidden">
            <img 
              src={noticia.imagem_destaque_url || arenaImage} 
              alt={noticia.titulo} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              {noticia.categoria && (
                <Badge className="bg-primary text-primary-foreground mb-4">{noticia.categoria}</Badge>
              )}
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-primary-foreground transition-colors">
                {noticia.titulo}
              </h3>
              {noticia.resumo && (
                <p className="text-white/80 mb-4 line-clamp-2">{noticia.resumo}</p>
              )}
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(noticia.data_publicacao)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  3 min
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group cursor-pointer"
    >
      <Link to={`/noticias-portal/${noticia.slug}`}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          {/* Image */}
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
            {noticia.imagem_destaque_url ? (
              <img 
                src={noticia.imagem_destaque_url} 
                alt={noticia.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChevronRight className="w-8 h-8 text-primary" />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-5">
            {noticia.categoria && (
              <Badge variant="secondary" className="mb-3 text-xs">{noticia.categoria}</Badge>
            )}
            <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {noticia.titulo}
            </h3>
            {noticia.resumo && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{noticia.resumo}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(noticia.data_publicacao)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                3 min
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function PortalNews() {
  const { data: noticias = [], isLoading } = useQuery({
    queryKey: ["cms-noticias-portal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_conteudos")
        .select("id, titulo, slug, resumo, categoria, imagem_destaque_url, data_publicacao, destaque")
        .eq("status", "publicado")
        .eq("tipo", "noticia")
        .eq("destino", "portal_noticias")
        .order("data_publicacao", { ascending: false })
        .limit(4);

      if (error) throw error;
      return (data || []) as NoticiaPortal[];
    },
  });

  // Encontrar destaque ou usar primeira notícia
  const noticiaDestaque = noticias.find(n => n.destaque) || noticias[0];
  const outrasNoticias = noticias.filter(n => n.id !== noticiaDestaque?.id).slice(0, 3);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Fique por dentro
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Últimas Notícias
            </h2>
          </div>
          <Button variant="ghost" className="self-start md:self-auto group" asChild>
            <Link to="/noticias-portal">
              Ver todas as notícias
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>

        {/* News Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`${i === 0 ? 'md:col-span-2' : ''} animate-pulse`}>
                <div className={`${i === 0 ? 'h-[400px]' : 'aspect-video'} bg-muted rounded-2xl`} />
                {i !== 0 && (
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : noticias.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma notícia publicada ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              As notícias aparecerão aqui quando forem publicadas pelo CMS
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {noticiaDestaque && (
              <NewsCard noticia={noticiaDestaque} featured delay={0} />
            )}
            {outrasNoticias.map((noticia, index) => (
              <NewsCard
                key={noticia.id}
                noticia={noticia}
                delay={(index + 1) * 0.1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
