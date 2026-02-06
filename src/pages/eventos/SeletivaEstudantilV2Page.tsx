/**
 * Hot Site V2 - Seletiva das Seleções Estudantis 2026
 * Versão minimalista com tipografia bold e design P&B
 */

import { motion } from "framer-motion";
import { SeletivaHeaderV2 } from "./components/SeletivaHeaderV2";
import { SeletivaFooterV2 } from "./components/SeletivaFooterV2";
import { SeletivaRegulamentoV2 } from "./components/SeletivaRegulamentoV2";
import { ModalidadePoster } from "./components/ModalidadePoster";
import { DotsIndicator, CornerDecoration, ParallelLines } from "./components/DecorativeElements";
import { SeletivaGaleria } from "./components/SeletivaGaleria";
import { SeletivaResultados } from "./components/SeletivaResultados";

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
    <div className="min-h-screen bg-zinc-100">
      <SeletivaHeaderV2 />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden">
        {/* Decorações de canto */}
        <CornerDecoration 
          position="top-left" 
          className="absolute top-20 left-4 text-zinc-300 opacity-50 hidden md:block" 
        />
        <CornerDecoration 
          position="top-right" 
          className="absolute top-20 right-4 text-zinc-300 opacity-50 hidden md:block" 
        />
        
        <div className="container mx-auto max-w-5xl text-center">
          {/* Dots Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DotsIndicator total={5} active={0} className="mb-12" />
          </motion.div>

          {/* Título Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <p className="text-lg md:text-xl font-bold tracking-[0.3em] uppercase text-zinc-500 mb-4">
              SELETIVA DAS
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[0.4em] uppercase text-zinc-900 mb-4">
              SELEÇÕES
            </h1>
            <p className="text-3xl md:text-4xl lg:text-5xl font-black tracking-[0.3em] uppercase text-zinc-900">
              ESTUDANTIS
            </p>
          </motion.div>

          {/* Linhas decorativas */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <ParallelLines className="w-32 text-zinc-400" />
          </motion.div>

          {/* Data e Categoria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8"
          >
            <div className="px-6 py-3 bg-zinc-900 rounded-full">
              <span className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-white">
                19/FEV a 01/MAR
              </span>
            </div>
            <div className="h-px w-12 bg-zinc-400 hidden md:block" />
            <div className="px-6 py-3 border-2 border-zinc-900 rounded-full">
              <span className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-zinc-900">
                15 a 17 ANOS
              </span>
            </div>
          </motion.div>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-lg tracking-[0.1em] uppercase text-zinc-500 max-w-2xl mx-auto"
          >
            Jogos da Juventude 2026 — Representando Roraima
          </motion.p>
        </div>
      </section>

      {/* Seção de Modalidades */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-[0.25em] uppercase text-zinc-900 mb-4">
              MODALIDADES
            </h2>
            <p className="text-lg tracking-[0.1em] uppercase text-zinc-500">
              Calendário completo das seletivas
            </p>
          </motion.div>

          <div className="space-y-8">
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
