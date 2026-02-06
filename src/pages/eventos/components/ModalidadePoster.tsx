/**
 * Card estilo Poster para Modalidades - V2
 * Design baseado nos cards de referência com tipografia bold
 */

import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { DotsIndicator, AthleteCircle } from "./DecorativeElements";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";

interface NaipeInfo {
  naipe: "FEMININO" | "MASCULINO";
  data: string;
  horario: string;
  local: string;
  endereco: string;
}

interface ModalidadePosterProps {
  modalidade: string;
  categoria: string;
  naipes: NaipeInfo[];
  index: number;
  total: number;
  sport: "futsal" | "handebol" | "basquete" | "volei";
}

export function ModalidadePoster({
  modalidade,
  categoria,
  naipes,
  index,
  total,
  sport
}: ModalidadePosterProps) {
  // Espaçar letras do nome da modalidade
  const modalidadeEspacada = modalidade.split("").join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-zinc-100 rounded-3xl p-8 md:p-12 relative overflow-hidden"
    >
      {/* Dots Indicator */}
      <div className="mb-8">
        <DotsIndicator total={total} active={index} />
      </div>

      {/* Layout Principal */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        {/* Título e Categoria */}
        <div className="flex-1">
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-[0.3em] uppercase text-zinc-900 mb-2">
            {modalidadeEspacada}
          </h3>
          <p className="text-xl md:text-2xl font-bold tracking-[0.2em] uppercase text-zinc-500">
            {categoria}
          </p>
        </div>

        {/* Círculo com Atleta */}
        <div className="w-32 h-32 md:w-40 md:h-40 mx-auto lg:mx-0 flex-shrink-0">
          <AthleteCircle sport={sport} className="w-full h-full" />
        </div>
      </div>

      {/* Naipes */}
      <div className="mt-12 grid md:grid-cols-2 gap-8">
        {naipes.map((naipe) => (
          <div key={naipe.naipe} className="space-y-4">
            <h4 className="text-2xl font-bold tracking-[0.2em] uppercase text-zinc-900 border-b-2 border-zinc-300 pb-2">
              {naipe.naipe}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <span className="text-base font-medium tracking-wide uppercase text-zinc-700">
                  {naipe.data}, {naipe.horario}
                </span>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-bold tracking-wide uppercase text-zinc-900">
                    {naipe.local}
                  </p>
                  <p className="text-sm text-zinc-500 tracking-wide">
                    {naipe.endereco}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Institucional */}
      <div className="mt-12 pt-6 border-t border-zinc-300 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-400">
          Diretoria de Esporte
        </p>
        <div className="flex items-center gap-4">
          <LogoIdjuv variant="light" className="h-8 opacity-60" />
          <img 
            src={logoGoverno} 
            alt="Governo de Roraima" 
            className="h-6 object-contain opacity-60"
          />
        </div>
      </div>
    </motion.div>
  );
}
