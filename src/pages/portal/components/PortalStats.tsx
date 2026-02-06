/**
 * PortalStats - Seção de estatísticas animadas
 */

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Trophy, Users, MapPin, Medal } from "lucide-react";

interface StatItemProps {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  label: string;
  delay: number;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

function StatItem({ icon: Icon, value, suffix, label, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative group"
    >
      <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        
        {/* Value */}
        <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          <AnimatedCounter value={value} suffix={suffix} />
        </div>
        
        {/* Label */}
        <p className="text-muted-foreground font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

export function PortalStats() {
  const stats = [
    { icon: Trophy, value: 45, label: "Federações Parceiras", suffix: "" },
    { icon: Users, value: 12500, label: "Atletas Beneficiados", suffix: "+" },
    { icon: MapPin, value: 15, label: "Municípios Atendidos", suffix: "" },
    { icon: Medal, value: 320, label: "Medalhas Conquistadas", suffix: "+" },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.05)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.05)_0%,transparent_50%)]" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nosso Impacto
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Números que Transformam
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Resultados concretos do nosso compromisso com o desenvolvimento esportivo e social de Roraima
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatItem
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
