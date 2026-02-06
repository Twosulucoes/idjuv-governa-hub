/**
 * PortalNews - Seção de notícias do portal
 */

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import arenaImage from "@/assets/portal/arena-complex.jpg";

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image?: string;
  featured?: boolean;
  delay: number;
}

function NewsCard({ title, excerpt, category, date, readTime, image, featured, delay }: NewsCardProps) {
  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="md:col-span-2 group cursor-pointer"
      >
        <div className="relative h-[400px] rounded-2xl overflow-hidden">
          <img 
            src={image || arenaImage} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <Badge className="bg-primary text-primary-foreground mb-4">{category}</Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-primary-foreground transition-colors">
              {title}
            </h3>
            <p className="text-white/80 mb-4 line-clamp-2">{excerpt}</p>
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readTime}
              </span>
            </div>
          </div>
        </div>
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
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Image Placeholder */}
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronRight className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="p-5">
          <Badge variant="secondary" className="mb-3 text-xs">{category}</Badge>
          <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readTime}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function PortalNews() {
  const news = [
    {
      title: "IDJUV inaugura novo complexo esportivo em Boa Vista",
      excerpt: "Nova estrutura conta com quadras poliesportivas, piscina olímpica e pista de atletismo, beneficiando mais de 5.000 atletas.",
      category: "Infraestrutura",
      date: "05 Fev 2026",
      readTime: "3 min",
      image: arenaImage,
      featured: true,
    },
    {
      title: "Abertas inscrições para o Bolsa Atleta 2026",
      excerpt: "Programa oferece bolsas de até R$ 3.000 para atletas de alto rendimento.",
      category: "Programas",
      date: "03 Fev 2026",
      readTime: "2 min",
    },
    {
      title: "Roraima conquista 15 medalhas nos Jogos da Juventude",
      excerpt: "Delegação roraimense se destaca em diversas modalidades esportivas.",
      category: "Competições",
      date: "01 Fev 2026",
      readTime: "4 min",
    },
    {
      title: "Curso de capacitação para técnicos esportivos",
      excerpt: "Formação gratuita para profissionais do esporte em parceria com o Governo Federal.",
      category: "Capacitação",
      date: "28 Jan 2026",
      readTime: "2 min",
    },
  ];

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
          <Button variant="ghost" className="self-start md:self-auto group">
            Ver todas as notícias
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* News Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <NewsCard
              key={item.title}
              {...item}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
