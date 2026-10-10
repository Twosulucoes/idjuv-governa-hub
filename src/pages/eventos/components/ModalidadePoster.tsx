/**
 * Card estilo Poster para Modalidades - V2
 * Design baseado nos cards de referência com suporte a dark mode
 */

import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { DotsIndicator } from "./DecorativeElements";
import { SportIcon } from "./SportIcon";
import { Logo } from "@/components/ui/Logo";
import { getMarcaAssets, useIdentidade } from '@/core/tenant';

// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).
const { entidadeSuperiorLight: logoGoverno } = getMarcaAssets();

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
  const { nomeCurto } = useIdentidade();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-muted rounded-2xl p-6 md:p-8 relative overflow-hidden border border-border hover:shadow-lg transition-all"
    >
      {/* Dots Indicator */}
      <div className="mb-6">
        <DotsIndicator total={total} active={index} />
      </div>

      {/* Layout Principal */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Ícone da Modalidade */}
        <SportIcon sport={sport} size="md" className="flex-shrink-0" />
        
        {/* Título e Categoria */}
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[0.15em] uppercase text-foreground leading-tight">
            {modalidade}
          </h3>
          <p className="text-sm md:text-base font-bold tracking-[0.1em] uppercase text-muted-foreground">
            {categoria}
          </p>
        </div>
      </div>

      {/* Naipes */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {naipes.map((naipe) => (
          <div 
            key={naipe.naipe} 
            className="bg-background rounded-xl p-4 border border-border"
          >
            <h4 className="text-lg font-bold tracking-[0.15em] uppercase text-foreground mb-3 pb-2 border-b border-border">
              {naipe.naipe}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <span className="text-base font-semibold tracking-wide uppercase text-foreground/80">
                  {naipe.data}, {naipe.horario}
                </span>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-bold tracking-wide text-foreground">
                    {naipe.local}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {naipe.endereco}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer simples */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
          Diretoria de Esporte • {nomeCurto}
        </p>
      </div>
    </motion.div>
  );
}
