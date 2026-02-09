/**
 * PortalEsports - Seção de E-Sports e Tecnologia para Juventude
 */

import { motion } from "framer-motion";
import { Gamepad2, Laptop, Wifi, Trophy, Users, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PortalEsports() {
  const features = [
    {
      icon: Gamepad2,
      title: "Competições de E-Sports",
      description: "Torneios oficiais de games competitivos com premiação e apoio institucional.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Laptop,
      title: "Inclusão Digital",
      description: "Acesso à tecnologia e capacitação em informática para jovens.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Trophy,
      title: "Apoio a Atletas Digitais",
      description: "Programa de fomento para jogadores profissionais roraimenses.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Users,
      title: "Comunidades Gamer",
      description: "Suporte a comunidades e organizações de e-sports no estado.",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  const games = [
    "League of Legends",
    "Valorant", 
    "Free Fire",
    "CS2",
    "FIFA",
    "Fortnite",
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Glowing Orbs */}
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Novo Foco Institucional
            </span>
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              E-Sports
            </span>
            {" "}& Tecnologia
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Conectando a juventude roraimense ao futuro através dos esportes eletrônicos e da inclusão digital
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Visual Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-white/10 p-8">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 opacity-50" />
              
              <div className="relative">
                {/* Icon */}
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30"
                  animate={{ 
                    boxShadow: [
                      "0 20px 50px -15px rgba(168, 85, 247, 0.3)",
                      "0 20px 50px -15px rgba(236, 72, 153, 0.5)",
                      "0 20px 50px -15px rgba(168, 85, 247, 0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Gamepad2 className="w-10 h-10 text-white" />
                </motion.div>

                <h3 className="text-2xl font-bold text-foreground text-center mb-4">
                  Modalidades Apoiadas
                </h3>

                {/* Games Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {games.map((game, index) => (
                    <motion.div
                      key={game}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="bg-white/10 hover:bg-white/20 text-foreground border-white/20 transition-colors"
                      >
                        {game}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      500+
                    </div>
                    <div className="text-xs text-muted-foreground">Jogadores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
                      12
                    </div>
                    <div className="text-xs text-muted-foreground">Torneios/Ano</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                      R$ 50k
                    </div>
                    <div className="text-xs text-muted-foreground">Premiação</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button 
            size="lg" 
            className="rounded-full px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30 group"
          >
            <Gamepad2 className="mr-2 w-5 h-5" />
            Participe dos Torneios
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
