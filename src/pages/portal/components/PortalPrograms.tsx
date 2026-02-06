/**
 * PortalPrograms - Seção de programas do portal
 */

import { motion } from "framer-motion";
import { ArrowRight, Trophy, Heart, Award, Building2, Calendar, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import illustrationBolsa from "@/assets/portal/illustration-bolsa-atleta.jpg";
import illustrationYouth from "@/assets/portal/illustration-youth.jpg";

interface ProgramCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  image?: string;
  color: string;
  delay: number;
  featured?: boolean;
}

function ProgramCard({ title, description, icon: Icon, image, color, delay, featured }: ProgramCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`group relative rounded-2xl overflow-hidden ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <div className={`h-full ${featured ? 'min-h-[400px]' : 'min-h-[280px]'} bg-card border border-border p-6 flex flex-col justify-between hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10`}>
        {/* Background Gradient */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${color} group-hover:opacity-40 transition-opacity`} />
        
        {/* Image for featured cards */}
        {image && featured && (
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity">
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative z-10">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-xl ${color.replace('bg-', 'bg-')}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
          </div>

          {/* Title */}
          <h3 className={`font-bold mb-2 text-foreground group-hover:text-primary transition-colors ${featured ? 'text-2xl' : 'text-lg'}`}>
            {title}
          </h3>

          {/* Description */}
          <p className={`text-muted-foreground leading-relaxed ${featured ? 'text-base' : 'text-sm'}`}>
            {description}
          </p>
        </div>

        {/* CTA */}
        <div className="relative z-10 mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto text-primary hover:text-primary/80 group/btn"
          >
            Saiba mais
            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function PortalPrograms() {
  const programs = [
    {
      title: "Bolsa Atleta",
      description: "Programa de incentivo financeiro para atletas de alto rendimento do estado de Roraima, apoiando talentos em diversas modalidades esportivas para competições nacionais e internacionais.",
      icon: Trophy,
      image: illustrationBolsa,
      color: "bg-amber-500",
      featured: true,
    },
    {
      title: "Juventude Cidadã",
      description: "Formação integral e inclusão social para jovens através de atividades esportivas, culturais e educacionais.",
      icon: Heart,
      image: illustrationYouth,
      color: "bg-rose-500",
      featured: true,
    },
    {
      title: "Federações Esportivas",
      description: "Apoio técnico e financeiro às federações estaduais de diversas modalidades.",
      icon: Award,
      color: "bg-blue-500",
    },
    {
      title: "Espaços Esportivos",
      description: "Gestão e manutenção de arenas, ginásios e centros esportivos públicos.",
      icon: Building2,
      color: "bg-emerald-500",
    },
    {
      title: "Eventos Esportivos",
      description: "Organização do calendário esportivo estadual com competições e festivais.",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      title: "Capacitação",
      description: "Cursos e treinamentos para profissionais do esporte e gestores esportivos.",
      icon: GraduationCap,
      color: "bg-teal-500",
    },
  ];

  return (
    <section id="programas" className="py-20 px-4 bg-muted/30 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4 border border-accent/20">
            O que fazemos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Nossos Programas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Iniciativas que transformam vidas através do esporte, cultura e desenvolvimento da juventude
          </p>
        </motion.div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <ProgramCard
              key={program.title}
              {...program}
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
          <Button size="lg" className="rounded-full px-8">
            Ver Todos os Programas
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
