/**
 * InstagramFeed - Componente para exibir feed do Instagram
 * 
 * Nota: A API oficial do Instagram requer aprovação do Facebook.
 * Este componente usa um embed do Instagram ou dados mockados para preview.
 * Para produção, será necessário configurar a API oficial.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, ExternalLink, Heart, MessageCircle, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

// Posts de exemplo - serão substituídos por dados reais da API
const MOCK_POSTS: InstagramPost[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1461896836934- voices-0c0e05b7-9eb1-4e3a-b9cb-8e0e8c36c3c8?w=400",
    caption: "Abertas as inscrições para as Seleções Estudantis 2026! 🏆 #IDJUV #Esporte",
    likes: 245,
    comments: 18,
    permalink: "#"
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400",
    caption: "Jogos Escolares de Roraima em grande estilo! 🎯 #JER2026",
    likes: 189,
    comments: 12,
    permalink: "#"
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400",
    caption: "Atletas roraimenses brilhando nas competições nacionais! 🌟 #TalentoRR",
    likes: 312,
    comments: 24,
    permalink: "#"
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400",
    caption: "Treinamento intensivo no Ginásio Hélio Campos 💪 #PreparaçãoTotal",
    likes: 156,
    comments: 9,
    permalink: "#"
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
    caption: "Basquete 3x3 nas seletivas estaduais! 🏀 #Basket3x3",
    likes: 278,
    comments: 21,
    permalink: "#"
  },
  {
    id: "6",
    imageUrl: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400",
    caption: "Esports em ascensão! Torneio estadual de e-games 🎮 #EsportsRR",
    likes: 423,
    comments: 45,
    permalink: "#"
  },
];

export function InstagramFeed({ 
  username, 
  posts = MOCK_POSTS,
  className,
  maxPosts = 6
}: InstagramFeedProps) {
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

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
            Acompanhe as últimas novidades, eventos e conquistas do esporte roraimense
          </p>
        </motion.div>

        {/* Grid de Posts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayPosts.map((post, index) => (
            <motion.a
              key={post.id}
              href={post.permalink}
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
