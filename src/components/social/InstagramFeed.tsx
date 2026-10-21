/**
 * InstagramFeed - Componente para exibir feed do Instagram
 * 
 * Nota: A API oficial do Instagram requer aprovação do Facebook. Sem posts
 * reais (prop `posts`), a seção mostra só o convite para seguir o perfil —
 * nada de post de exemplo, que pareceria publicação da instituição.
 */

import { useState } from "react";
import { urlSegura } from "@/lib/urlSegura";
import { motion } from "framer-motion";
import { Instagram, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIdentidade } from "@/core/tenant";

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  permalink: string;
}

interface InstagramFeedProps {
  username: string;
  posts?: InstagramPost[];
  className?: string;
  maxPosts?: number;
}

export function InstagramFeed({ 
  username, 
  posts = [],
  className,
  maxPosts = 6
}: InstagramFeedProps) {
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  const { nomeCurto } = useIdentidade();
  const displayPosts = posts.slice(0, maxPosts);

  return (
    <section className={cn("py-16", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground mb-4">
            <Instagram className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">@{username}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Siga-nos no Instagram
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Acompanhe as últimas novidades, eventos e conquistas do {nomeCurto}
          </p>
        </motion.div>

        {/* Grid de Posts (só com posts reais) */}
        {displayPosts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayPosts.map((post, index) => (
            <motion.a
              key={post.id}
              href={urlSegura(post.permalink) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onMouseEnter={() => setHoveredPost(post.id)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              {/* Imagem */}
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <span className="sr-only"> (abre em nova aba)</span>

              {/* Overlay com métricas */}
              <div aria-hidden="true" className={cn(
                "absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 group-focus-visible:opacity-100",
                hoveredPost === post.id ? "opacity-100" : "opacity-0"
              )}>
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Heart className="w-5 h-5 fill-white" />
                    <span className="font-medium">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.comments}</span>
                  </div>
                </div>
              </div>

              {/* Gradiente Instagram no hover */}
              <div aria-hidden="true" className={cn(
                "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-focus-visible:scale-x-100",
                hoveredPost === post.id ? "scale-x-100" : "scale-x-0"
              )} />
            </motion.a>
          ))}
        </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button
            asChild
            size="lg"
            className="min-h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full"
          >
            <a 
              href={`https://instagram.com/${username}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Instagram className="w-5 h-5 mr-2" aria-hidden="true" />
              Seguir @{username}
              <span className="sr-only"> (abre em nova aba)</span>
              <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
