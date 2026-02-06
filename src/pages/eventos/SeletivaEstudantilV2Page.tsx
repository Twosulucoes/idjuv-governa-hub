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
import heroImage from "@/assets/hero-4-modalidades.jpg";

// Dados das modalidades
const modalidades = [
  {
    modalidade: "FUTSAL",
    categoria: "15 A 17 ANOS",
    sport: "futsal" as const,
    naipes: [
      {
        naipe: "FEMININO" as const,
        data: "19 DE FEVEREIRO",
        horario: "08H",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      },
      {
        naipe: "MASCULINO" as const,
        data: "19 DE FEVEREIRO",
        horario: "14H",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      }
    ]
  },
  {
    modalidade: "HANDEBOL",
    categoria: "15 A 17 ANOS",
    sport: "handebol" as const,
    naipes: [
      {
        naipe: "FEMININO" as const,
        data: "21 DE FEVEREIRO",
        horario: "08H",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      },
      {
        naipe: "MASCULINO" as const,
        data: "21 DE FEVEREIRO",
        horario: "14H",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      }
    ]
  },
  {
    modalidade: "BASQUETE",
    categoria: "15 A 17 ANOS",
    sport: "basquete" as const,
    naipes: [
      {
        naipe: "FEMININO" as const,
        data: "26 DE FEVEREIRO",
        horario: "08H30",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      },
      {
        naipe: "MASCULINO" as const,
        data: "26 DE FEVEREIRO",
        horario: "15H",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      }
    ]
  },
  {
    modalidade: "VÔLEI",
    categoria: "15 A 17 ANOS",
    sport: "volei" as const,
    naipes: [
      {
        naipe: "FEMININO" as const,
        data: "28 DE FEVEREIRO",
        horario: "08H30",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      },
      {
        naipe: "MASCULINO" as const,
        data: "28 DE FEVEREIRO",
        horario: "15H",
        local: "GINÁSIO HÉLIO DA COSTA CAMPOS",
        endereco: "R. Pres. Juscelino Kubitscheck, N/N, Boa Vista - RR"
      }
    ]
  }
];

export default function SeletivaEstudantilV2Page() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300">
      <SeletivaHeaderV2 />
      
      {/* Hero Section com Imagem */}
      <section className="relative pt-20 pb-8 md:pt-24 md:pb-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-200/50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-900" />
        
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
              <p className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-zinc-500 dark:text-zinc-400 mb-2">
                SELETIVA DAS
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[0.15em] uppercase text-zinc-900 dark:text-zinc-100 leading-none mb-4">
                SELEÇÕES<br />
                <span className="text-zinc-600 dark:text-zinc-300">ESTUDANTIS</span>
              </h1>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 rounded-full">
                  <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-white dark:text-zinc-900">
                    19/FEV a 01/MAR
                  </span>
                </div>
                <div className="px-4 py-2 border-2 border-zinc-900 dark:border-zinc-100 rounded-full">
                  <span className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-zinc-900 dark:text-zinc-100">
                    15 a 17 ANOS
                  </span>
                </div>
              </div>

              <p className="mt-6 text-sm md:text-base tracking-[0.05em] uppercase text-zinc-600 dark:text-zinc-400">
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
                  alt="Atletas das 4 modalidades: Futsal, Handebol, Basquete e Vôlei" 
                  className="w-full h-auto object-cover"
                />
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 to-transparent" />
              </div>
              
              {/* Labels das modalidades */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {["FUTSAL", "HANDEBOL", "BASQUETE", "VÔLEI"].map((mod, i) => (
                  <motion.span
                    key={mod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold tracking-wider rounded-full"
                  >
                    {mod}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seção de Modalidades */}
      <section className="py-16 px-4 bg-white dark:bg-zinc-800 transition-colors">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-[0.2em] uppercase text-zinc-900 dark:text-zinc-100 mb-3">
              MODALIDADES
            </h2>
            <p className="text-base tracking-[0.1em] uppercase text-zinc-500 dark:text-zinc-400">
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

      {/* Galeria */}
      <SeletivaGaleria />

      {/* Resultados */}
      <SeletivaResultados />

      {/* Footer */}
      <SeletivaFooterV2 />
    </div>
  );
}
