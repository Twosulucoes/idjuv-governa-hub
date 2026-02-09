/**
 * PortalInfrastructure - Seção de infraestrutura esportiva
 */

import { motion } from "framer-motion";
import { MapPin, Users, Calendar, ArrowRight, Building2, Trophy, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InfraCardProps {
  title: string;
  description: string;
  location: string;
  capacity?: string;
  image: string;
  features: string[];
  delay: number;
  featured?: boolean;
}

function InfraCard({ title, description, location, capacity, image, features, delay, featured }: InfraCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`group ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className={`relative h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 ${
        featured ? 'min-h-[450px]' : 'min-h-[320px]'
      }`}>
        {/* Image Background */}
        <div className="absolute inset-0">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          {/* Badge */}
          <div className="mb-auto">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              <Building2 className="w-3 h-3 mr-1" />
              Espaço Esportivo
            </Badge>
          </div>

          {/* Info */}
          <div>
            <h3 className={`font-bold text-white mb-2 group-hover:text-primary-foreground transition-colors ${
              featured ? 'text-2xl md:text-3xl' : 'text-xl'
            }`}>
              {title}
            </h3>
            
            <p className={`text-white/80 mb-4 ${featured ? 'text-base' : 'text-sm line-clamp-2'}`}>
              {description}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
              {capacity && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {capacity}
                </span>
              )}
            </div>

            {/* Features */}
            {featured && features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {features.map((feature) => (
                  <Badge 
                    key={feature} 
                    variant="secondary" 
                    className="bg-white/10 text-white border-white/20 text-xs"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            )}

            {/* CTA */}
            <Button 
              variant="secondary"
              size={featured ? "default" : "sm"}
              className="group/btn bg-white/20 backdrop-blur-sm hover:bg-white hover:text-primary border-white/30"
            >
              Saiba mais
              <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PortalInfrastructure() {
  const infrastructure = [
    {
      title: "Estádio Flamarion Vasconcelos (Canarinho)",
      description: "Principal arena de futebol do estado, sede de grandes competições estaduais e nacionais. Estrutura completa para eventos esportivos de grande porte.",
      location: "Boa Vista - RR",
      capacity: "10.000 lugares",
      image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format",
      features: ["Futebol Profissional", "Pista de Atletismo", "Iluminação LED", "Vestiários"],
      featured: true,
    },
    {
      title: "Ginásio Hélio Campos",
      description: "Complexo poliesportivo coberto para modalidades indoor como basquete, vôlei, futsal e artes marciais.",
      location: "Boa Vista - RR",
      capacity: "3.500 lugares",
      image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&auto=format",
      features: ["Quadra Poliesportiva", "Ar Condicionado"],
      featured: false,
    },
    {
      title: "Praças Esportivas",
      description: "Rede de praças com quadras poliesportivas distribuídas pelos bairros e municípios do estado.",
      location: "Diversos municípios",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format",
      features: ["Acesso Gratuito", "Iluminação Noturna"],
      featured: false,
    },
    {
      title: "Centro de Treinamento",
      description: "Estrutura dedicada à preparação de atletas de alto rendimento com equipamentos modernos.",
      location: "Parque Anauá - Boa Vista",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format",
      features: ["Academia", "Fisioterapia", "Nutrição"],
      featured: false,
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4 border border-emerald-500/20">
            <Dumbbell className="w-4 h-4 inline mr-2" />
            Espaços sob nossa gestão
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Infraestrutura Esportiva
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Gestão de espaços esportivos públicos que promovem a prática esportiva em todo o estado de Roraima
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {infrastructure.map((item, index) => (
            <InfraCard
              key={item.title}
              {...item}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="outline" className="rounded-full px-8 group">
            <Calendar className="mr-2 w-5 h-5" />
            Agendar Uso de Espaço
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
