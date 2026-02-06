/**
 * SeletivaEstudantilPage - Hot site para Seletiva das Seleções Estudantis
 * Jogos da Juventude 2025
 */

import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Trophy, Instagram, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { FaixaBrasil } from "@/components/ui/FaixaBrasil";
import { Link } from "react-router-dom";

// Dados das modalidades
const modalidades = [
  {
    id: "handebol",
    nome: "HANDEBOL",
    categoria: "15 a 17 anos",
    cor: "from-blue-600 to-blue-800",
    corAccent: "bg-blue-600",
    icon: "🤾‍♂️",
    seletivas: [
      {
        genero: "MASCULINO",
        data: "19 de Fevereiro",
        horario: "08h30",
        local: "Ginásio Hélio da Costa Campos",
        endereco: "R. Pres. Juscelino Kubitscheck, 848, Canarinho"
      },
      {
        genero: "FEMININO",
        data: "20 de Fevereiro",
        horario: "08h30",
        local: "Ginásio Hélio da Costa Campos",
        endereco: "R. Pres. Juscelino Kubitscheck, 848, Canarinho"
      }
    ]
  },
  {
    id: "basquete",
    nome: "BASQUETE",
    categoria: "15 a 17 anos",
    cor: "from-orange-500 to-orange-700",
    corAccent: "bg-orange-500",
    icon: "🏀",
    seletivas: [
      {
        genero: "FEMININO",
        data: "21 de Fevereiro",
        horario: "08h30",
        local: "Ginásio Hélio da Costa Campos",
        endereco: "R. Pres. Juscelino Kubitscheck, 848, Canarinho"
      },
      {
        genero: "MASCULINO",
        data: "Visita Técnica",
        horario: "",
        local: "Treinamento das Escolas",
        endereco: ""
      }
    ]
  },
  {
    id: "volei",
    nome: "VÔLEI",
    categoria: "15 a 17 anos",
    cor: "from-purple-600 to-purple-800",
    corAccent: "bg-purple-600",
    icon: "🏐",
    seletivas: [
      {
        genero: "FEMININO",
        data: "28 de Fevereiro",
        horario: "08h30",
        local: "Ginásio Hélio da Costa Campos",
        endereco: "R. Pres. Juscelino Kubitscheck, 848, Canarinho"
      },
      {
        genero: "MASCULINO",
        data: "28 de Fevereiro",
        horario: "15h",
        local: "Ginásio Hélio da Costa Campos",
        endereco: "R. Pres. Juscelino Kubitscheck, 848, Canarinho"
      }
    ]
  },
  {
    id: "futsal",
    nome: "FUTSAL",
    categoria: "15 a 17 anos",
    cor: "from-green-600 to-green-800",
    corAccent: "bg-green-600",
    icon: "⚽",
    seletivas: [
      {
        genero: "FEMININO",
        data: "28 de Fevereiro",
        horario: "08h30",
        local: "Escola Antonio Ferreira de Sousa",
        endereco: "Rua Reinaldo Neves, 558, Jardim Floresta"
      },
      {
        genero: "MASCULINO",
        data: "01 de Março",
        horario: "08h30",
        local: "Ginásio Hélio da Costa Campos",
        endereco: "R. Pres. Juscelino Kubitscheck, 848, Canarinho"
      }
    ]
  }
];

function ModalidadeCard({ modalidade, index }: { modalidade: typeof modalidades[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group"
    >
      <div className="relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
        {/* Header com gradiente */}
        <div className={`relative h-32 bg-gradient-to-br ${modalidade.cor} p-6 overflow-hidden`}>
          {/* Decorative elements */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
          
          {/* Sport icon */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-30 group-hover:opacity-50 transition-opacity">
            {modalidade.icon}
          </div>
          
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white mb-2">
              {modalidade.categoria}
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-wider">
              {modalidade.nome}
            </h3>
          </div>
        </div>

        {/* Seletivas */}
        <div className="p-6 space-y-6">
          {modalidade.seletivas.map((seletiva, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="relative"
            >
              {idx > 0 && <div className="absolute -top-3 left-0 right-0 h-px bg-border" />}
              
              <div className="flex items-start gap-4">
                <div className={`w-1 h-full min-h-[80px] ${modalidade.corAccent} rounded-full`} />
                
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-foreground tracking-wide mb-3">
                    {seletiva.genero}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {seletiva.data}
                        {seletiva.horario && `, ${seletiva.horario}`}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium block">{seletiva.local}</span>
                        {seletiva.endereco && (
                          <span className="text-xs text-muted-foreground/70">{seletiva.endereco}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SeletivaEstudantilPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <FaixaBrasil />
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIdjuv variant="auto" className="h-10" />
          </Link>
          
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/p/DUYrGrvkfl1/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="hidden sm:inline">@idjuv.rr</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
        
        {/* Elementos decorativos */}
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        
        {/* Linhas decorativas estilo cards */}
        <div className="absolute top-40 right-20 w-32 h-32 border-2 border-foreground/10 rounded-3xl rotate-12 hidden lg:block" />
        <div className="absolute bottom-40 left-20 w-24 h-24 border-2 border-foreground/10 rounded-2xl -rotate-12 hidden lg:block" />
        <div className="absolute top-1/2 right-10 w-px h-40 bg-gradient-to-b from-transparent via-foreground/20 to-transparent hidden lg:block" />
        
        {/* Silhuetas de atletas */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="text-[400px] font-black tracking-tighter">
            ⚽🏀🏐🤾
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8"
            >
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Jogos da Juventude 2025</span>
            </motion.div>

            {/* Título principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="block text-sm md:text-base font-bold tracking-[0.5em] text-muted-foreground mb-4">
                SELETIVA DAS
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tight mb-4">
                SELEÇÕES
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  ESTUDANTIS
                </span>
              </h1>
            </motion.div>

            {/* Descrição */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              Essa é a oportunidade para jovens atletas mostrarem seu talento e 
              representarem o esporte estudantil de Roraima com dedicação e espírito de equipe.
            </motion.p>

            {/* Info cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">19/Fev a 01/Mar</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">15 a 17 anos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">4 Modalidades</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col items-center gap-4"
            >
              <Button
                size="lg"
                className="rounded-full px-8 text-lg group"
                onClick={() => document.getElementById('modalidades')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Cronograma
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-8"
              >
                <ChevronDown className="w-6 h-6 text-muted-foreground" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Modalidades Section */}
      <section id="modalidades" className="py-20 px-4 bg-muted/30 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              Confira as datas
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              Cronograma das Seletivas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fique atento às datas, horários e locais das seletivas de cada modalidade
            </p>
          </motion.div>

          {/* Grid de modalidades */}
          <div className="grid md:grid-cols-2 gap-8">
            {modalidades.map((modalidade, index) => (
              <ModalidadeCard key={modalidade.id} modalidade={modalidade} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Informações Importantes
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Quem pode participar?",
                description: "Estudantes de 15 a 17 anos regularmente matriculados em escolas de Roraima."
              },
              {
                icon: Trophy,
                title: "O que é a seletiva?",
                description: "Processo para formar as seleções que representarão Roraima nos Jogos da Juventude."
              },
              {
                icon: MapPin,
                title: "Onde acontece?",
                description: "Principalmente no Ginásio Hélio da Costa Campos e escolas parceiras."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-card border border-border rounded-2xl text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Acompanhe nas Redes Sociais
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Siga o IDJuv para mais informações e atualizações sobre o evento
            </p>
            <a
              href="https://www.instagram.com/p/DUYrGrvkfl1/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="secondary" className="rounded-full px-8 text-lg">
                <Instagram className="mr-2 w-5 h-5" />
                @idjuv.rr
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <LogoIdjuv variant="auto" className="h-12" />
              <div className="h-8 w-px bg-border" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium block">Diretoria de Esporte</span>
                <span>IDJuv - Governo de Roraima</span>
              </div>
            </div>
            
            <div className="text-center md:text-right text-sm text-muted-foreground">
              <p>Instituto de Desporto, Juventude e Lazer de Roraima</p>
              <p className="text-xs mt-1">© 2025 - Todos os direitos reservados</p>
            </div>
          </div>
        </div>
        <FaixaBrasil className="mt-6" />
      </footer>
    </div>
  );
}
