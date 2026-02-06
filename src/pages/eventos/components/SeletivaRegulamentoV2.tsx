/**
 * Seção de Regulamento V2 - Seletivas Estudantis
 * Regulamento em formato de carrossel moderno e dinâmico
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Calendar, Users, Trophy, FileCheck, ClipboardCheck, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import type { LucideIcon } from "lucide-react";

interface SecaoRegulamento {
  numero: string;
  titulo: string;
  icon: LucideIcon;
  conteudo?: string;
  lista?: string[];
}

const regulamentoCompleto: {
  titulo: string;
  subtitulo: string;
  secoes: SecaoRegulamento[];
} = {
  titulo: "RESUMO DO REGULAMENTO",
  subtitulo: "Seletiva das Seleções Estudantis 2026",
  secoes: [
    {
      numero: "01",
      titulo: "OBJETIVO",
      icon: Trophy,
      conteudo: "Selecionar atletas estudantis de Roraima para representar o estado nos Jogos da Juventude 2026."
    },
    {
      numero: "02",
      titulo: "QUEM PODE PARTICIPAR",
      icon: Users,
      conteudo: "Estudantes de 15 a 17 anos, matriculados em escolas públicas ou privadas de Roraima."
    },
    {
      numero: "03",
      titulo: "MODALIDADES",
      icon: Trophy,
      lista: [
        "Futsal",
        "Handebol",
        "Basquetebol",
        "Voleibol"
      ]
    },
    {
      numero: "04",
      titulo: "QUANDO E ONDE",
      icon: Calendar,
      conteudo: "De 19/02 a 01/03/2026, no Ginásio Hélio Campos (Canarinho), Boa Vista - RR."
    },
    {
      numero: "05",
      titulo: "CONVOCAÇÃO",
      icon: FileCheck,
      conteudo: "A lista dos convocados será publicada no site em até 5 dias após o evento. O número de convocados para a fase de treinamento será o dobro das vagas finais."
    },
    {
      numero: "06",
      titulo: "FASE DE TREINAMENTO",
      icon: ClipboardCheck,
      conteudo: "Os atletas convocados passarão por treinamentos, onde ao final serão selecionados os representantes que viajarão para os Jogos da Juventude."
    }
  ]
};

export function SeletivaRegulamentoV2() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "center",
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const regulamentoDisponivel = true;
  const linkRegulamento = "#";

  return (
    <section className="py-20 px-4 bg-zinc-100 dark:bg-zinc-900 transition-colors overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 rounded-full mb-6">
            <FileText className="w-4 h-4 text-white dark:text-zinc-900" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white dark:text-zinc-900">
              Documento Oficial
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[0.15em] uppercase text-zinc-900 dark:text-zinc-100 mb-3">
            {regulamentoCompleto.titulo}
          </h2>
          <p className="text-lg tracking-[0.1em] uppercase text-zinc-500 dark:text-zinc-400">
            {regulamentoCompleto.subtitulo}
          </p>
        </motion.div>

        {/* Carrossel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Navegação Desktop */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-lg hover:scale-110 transition-transform -translate-x-6"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-lg hover:scale-110 transition-transform translate-x-6"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Embla Viewport */}
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {regulamentoCompleto.secoes.map((secao, index) => {
                const IconComponent = secao.icon;
                const isActive = index === selectedIndex;
                
                return (
                  <div 
                    key={secao.numero} 
                    className="flex-[0_0_90%] md:flex-[0_0_65%] lg:flex-[0_0_55%] min-w-0 px-2 md:px-4"
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1 : 0.92,
                        opacity: isActive ? 1 : 0.5,
                      }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl h-full min-h-[340px] md:min-h-[360px] flex flex-col overflow-hidden"
                    >
                      {/* Header do Card */}
                      <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-lg md:text-xl font-black text-white dark:text-zinc-900">
                            {secao.numero}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase text-zinc-500 dark:text-zinc-400">
                              Seção {secao.numero}
                            </span>
                          </div>
                          <h3 className="text-base md:text-xl font-black tracking-[0.05em] md:tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100 leading-tight">
                            {secao.titulo}
                          </h3>
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 overflow-y-auto">
                        {secao.conteudo && (
                          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
                            {secao.conteudo}
                          </p>
                        )}

                        {secao.lista && (
                          <ul className="space-y-1.5 md:space-y-2">
                            {secao.lista.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 md:gap-3">
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 mt-1.5 md:mt-2 flex-shrink-0" />
                                <span className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Footer com indicador de progresso */}
                      <div className="mt-4 pt-3 md:pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500">
                            {index + 1} de {regulamentoCompleto.secoes.length}
                          </span>
                          <div className="flex gap-0.5 md:gap-1">
                            {regulamentoCompleto.secoes.map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  i === index 
                                    ? "w-4 md:w-6 bg-zinc-900 dark:bg-zinc-100" 
                                    : "w-1 bg-zinc-300 dark:bg-zinc-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navegação Mobile */}
          <div className="flex justify-center gap-4 mt-6 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="w-12 h-12 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="w-12 h-12 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {regulamentoCompleto.secoes.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === selectedIndex 
                    ? "bg-zinc-900 dark:bg-zinc-100 scale-125" 
                    : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
                }`}
                aria-label={`Ir para seção ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Botão de Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="bg-zinc-900 dark:bg-zinc-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center">
                <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
              </div>
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 mb-1">
                  Download Disponível
                </p>
                <p className="text-lg font-bold tracking-wide text-white dark:text-zinc-900">
                  Regulamento Completo (PDF)
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Versão oficial para impressão
                </p>
              </div>
            </div>

            {regulamentoDisponivel ? (
              <a href={linkRegulamento} target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full px-8 font-bold tracking-wide shadow-lg"
                >
                  <Download className="mr-2 w-5 h-5" />
                  BAIXAR PDF
                </Button>
              </a>
            ) : (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-zinc-600 text-zinc-400 rounded-full px-8" 
                disabled
              >
                EM BREVE
              </Button>
            )}
          </div>
        </motion.div>

        {/* Nota de rodapé */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-zinc-500 dark:text-zinc-500 mt-8"
        >
          Este regulamento pode sofrer alterações. Consulte sempre a versão mais atualizada.
        </motion.p>
      </div>
    </section>
  );
}
