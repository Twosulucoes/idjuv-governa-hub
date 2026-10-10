/**
 * Hot Site V2 - Seletiva das Seleções Estudantis 2026
 * Versão minimalista com tipografia bold, design P&B e suporte a dark mode
 */

import { motion } from "framer-motion";
import { SeletivaHeaderV2 } from "./components/SeletivaHeaderV2";
import { SeletivaFooterV2 } from "./components/SeletivaFooterV2";
import { SeletivaRegulamentoV2 } from "./components/SeletivaRegulamentoV2";
import { ModalidadePoster } from "./components/ModalidadePoster";
import { DotsIndicator } from "./components/DecorativeElements";
import { SeletivaGaleria } from "./components/SeletivaGaleria";
import { SeletivaResultados } from "./components/SeletivaResultados";
import { SeletivaNoticiasV2 } from "./components/SeletivaNoticiasV2";
import { SeletivaContatosV2 } from "./components/SeletivaContatosV2";
import { SeletivaCountdownCTA } from "./components/SeletivaCountdownCTA";
import heroImage from "@/assets/hero-4-modalidades.jpg";
import { SkipLink } from "@/components/design-system";

// Dados das modalidades
const modalidades = [
  {
    modalidade: "VOLEIBOL",
    categoria: "15 A 17 ANOS",
    sport: "volei" as const,
    naipes: [
      {
        naipe: "FEMININO" as const,
        data: "28 DE FEVEREIRO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      },
      {
        naipe: "MASCULINO" as const,
        data: "01 DE MARÇO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      }
    ]
  },
  {
    modalidade: "FUTSAL",
    categoria: "15 A 17 ANOS",
    sport: "futsal" as const,
    naipes: [
      {
        naipe: "MASCULINO" as const,
        data: "07 DE MARÇO",
        horario: "08H",
        local: "ESCOLA EST. PROF. ANTÔNIO FERREIRA",
        endereco: "Rua Reinaldo Neves, 558 - Jardim Floresta, Boa Vista - RR"
      },
      {
        naipe: "FEMININO" as const,
        data: "08 DE MARÇO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      }
    ]
  },
  {
    modalidade: "BASQUETEBOL",
    categoria: "15 A 17 ANOS",
    sport: "basquete" as const,
    naipes: [
      {
        naipe: "MASCULINO" as const,
        data: "14 DE MARÇO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      },
      {
        naipe: "FEMININO" as const,
        data: "15 DE MARÇO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      }
    ]
  },
  {
    modalidade: "HANDEBOL",
    categoria: "15 A 17 ANOS",
    sport: "handebol" as const,
    naipes: [
      {
        naipe: "MASCULINO" as const,
        data: "21 DE MARÇO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      },
      {
        naipe: "FEMININO" as const,
        data: "22 DE MARÇO",
        horario: "08H",
        local: "GINÁSIO POLIESPORTIVO HÉLIO CAMPOS",
        endereco: "Rua Presidente Juscelino Kubitscheck, 848 - Canarinho, Boa Vista - RR"
      }
    ]
  }
];

export default function SeletivaEstudantilV2Page() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <SkipLink />
      <SeletivaHeaderV2 />

      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
      {/* Hero Section com Imagem */}
      <section className="relative pt-20 pb-8 md:pt-24 md:pb-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 to-background" />
        
        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          {/* Dots Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <DotsIndicator total={4} active={0} className="justify-start" />
          </motion.div>

          {/* Título e Imagem lado a lado */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Texto */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                SELETIVA DAS
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[0.15em] uppercase text-foreground leading-none mb-4">
                SELEÇÕES<br />
                <span className="text-muted-foreground">ESTUDANTIS</span>
              </h1>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="px-4 py-2 bg-foreground rounded-full">
                  <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-background">
                    19/FEV a 01/MAR
                  </span>
                </div>
                <div className="px-4 py-2 border-2 border-foreground rounded-full">
                  <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-foreground">
                    15 a 17 ANOS
                  </span>
                </div>
              </div>

              <p className="mt-6 text-base tracking-[0.05em] uppercase text-muted-foreground">
                Jogos da Juventude 2026 — Representando Roraima
              </p>
            </motion.div>

            {/* Imagem Hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Atletas das 4 modalidades: Handebol, Vôlei, Basquete e Futsal em ação" 
                  className="w-full h-auto object-cover aspect-square md:aspect-video grayscale"
                />
                {/* Overlay sutil */}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              
              {/* Labels das modalidades */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2">
                {["HANDEBOL", "VÔLEI", "BASQUETE", "FUTSAL"].map((mod, i) => (
                  <motion.span
                    key={mod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="px-3 py-1.5 bg-foreground text-background text-xs font-bold tracking-wider rounded-full shadow-md"
                  >
                    {mod}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA de Inscrição com Countdown */}
      <SeletivaCountdownCTA />

      {/* Seção de Modalidades */}
      <section className="py-16 px-4 bg-card transition-colors">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-[0.2em] uppercase text-foreground mb-3">
              MODALIDADES
            </h2>
            <p className="text-base tracking-[0.1em] uppercase text-muted-foreground">
              Calendário completo das seletivas
            </p>
          </motion.div>

          <div className="space-y-6">
            {modalidades.map((mod, index) => (
              <ModalidadePoster
                key={mod.modalidade}
                modalidade={mod.modalidade}
                categoria={mod.categoria}
                naipes={mod.naipes}
                sport={mod.sport}
                index={index}
                total={modalidades.length}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Regulamento */}
      <SeletivaRegulamentoV2 />

      {/* Notícias */}
      <SeletivaNoticiasV2 />

      {/* Galeria */}
      <SeletivaGaleria />

      {/* Resultados */}
      <SeletivaResultados />

      {/* Contatos e Links Oficiais */}
      <SeletivaContatosV2 />
      </main>

      {/* Footer */}
      <SeletivaFooterV2 />
    </div>
  );
}
