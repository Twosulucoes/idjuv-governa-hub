/**
 * Seção de Regulamento V2 - Seletivas Estudantis
 * Regulamento em formato de carrossel moderno e dinâmico
 */

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Trophy, 
  ClipboardCheck, 
  ChevronLeft, 
  ChevronRight,
  Target,
  UserCheck,
  Layers,
  FormInput,
  FileCheck,
  MapPin,
  Dumbbell,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import type { LucideIcon } from "lucide-react";

interface SecaoRegulamento {
  numero: string;
  titulo: string;
  icon: LucideIcon;
  conteudo?: string;
  lista?: string[];
  destaque?: string;
}

const regulamentoCompleto: {
  titulo: string;
  subtitulo: string;
  secoes: SecaoRegulamento[];
} = {
  titulo: "RESUMO DO REGULAMENTO",
  subtitulo: "Seletiva das Seleções Escolares de Roraima 2026",
  secoes: [
    {
      numero: "01",
      titulo: "TÍTULO E OBJETIVO",
      icon: Trophy,
      destaque: "Seletiva das Seleções Escolares de Roraima 2026",
      conteudo: "O IDJUV torna público o processo para formar as seleções estaduais que representarão Roraima nos Jogos da Juventude (COB) e outras competições oficiais."
    },
    {
      numero: "02",
      titulo: "QUEM PODE PARTICIPAR?",
      icon: UserCheck,
      destaque: "Estudante-Atleta: 15 a 17 anos",
      conteudo: "Estudantes nascidos em 2009, 2010 e 2011. É obrigatório estar regularmente matriculado e com frequência comprovada em escolas das redes pública ou privada."
    },
    {
      numero: "03",
      titulo: "MODALIDADES CONTEMPLADAS",
      icon: Target,
      conteudo: "O processo seletivo abrange as seguintes modalidades coletivas (masculino e feminino):",
      lista: [
        "Futsal",
        "Voleibol",
        "Basquetebol",
        "Handebol"
      ]
    },
    {
      numero: "04",
      titulo: "AS TRÊS ETAPAS DE SELEÇÃO",
      icon: Layers,
      lista: [
        "I Etapa (Pré-Seleção): Avaliação técnica inicial para formar um grupo ampliado",
        "II Etapa (Atleta Talento): Identificação de destaques durante os JER's 2026",
        "III Etapa (Seleção Final): Definição do grupo definitivo que representará o Estado"
      ]
    },
    {
      numero: "05",
      titulo: "INSCRIÇÕES ONLINE",
      icon: FormInput,
      destaque: "Período: 09 a 13 de fevereiro de 2026",
      conteudo: "As inscrições devem ser feitas exclusivamente pelo link oficial divulgado pelo IDJUV: idjuv.online/selecoes"
    },
    {
      numero: "06",
      titulo: "DOCUMENTAÇÃO NECESSÁRIA",
      icon: FileCheck,
      conteudo: "Para participar, o atleta deve apresentar:",
      lista: [
        "Documento oficial original com foto no ato da avaliação",
        "Termo de Autorização assinado pelos pais ou responsáveis (anexado na inscrição para menores)"
      ]
    },
    {
      numero: "07",
      titulo: "CRONOGRAMA – VOLEIBOL E FUTSAL",
      icon: Calendar,
      conteudo: "Local: Ginásio Hélio Campos e Escola Prof. Antônio Ferreira",
      lista: [
        "Voleibol: 28/02 (Fem) e 01/03 (Masc)",
        "Futsal: 07/03 (Masc) e 08/03 (Fem)"
      ]
    },
    {
      numero: "08",
      titulo: "CRONOGRAMA – BASQUETE E HANDEBOL",
      icon: Calendar,
      conteudo: "Local: Ginásio Hélio Campos • Horário inicial: 08:00h",
      lista: [
        "Basquetebol: 14/03 (Masc) e 15/03 (Fem)",
        "Handebol: 21/03 (Masc) e 22/03 (Fem)"
      ]
    },
    {
      numero: "09",
      titulo: "CRITÉRIOS DE AVALIAÇÃO",
      icon: ClipboardCheck,
      conteudo: "A Comissão de Seleção avaliará de forma técnica e objetiva:",
      lista: [
        "Fundamentos técnicos e desempenho tático",
        "Capacidade física, disciplina e comportamento esportivo",
        "Potencial de desenvolvimento"
      ]
    },
    {
      numero: "10",
      titulo: "ABRANGÊNCIA ESTADUAL",
      icon: MapPin,
      conteudo: "O processo garante a participação de estudantes dos 15 municípios de Roraima. A seleção baseia-se exclusivamente no mérito esportivo e desempenho técnico, sem cotas por município."
    },
    {
      numero: "11",
      titulo: "TREINAMENTOS E PREPARAÇÃO",
      icon: Dumbbell,
      conteudo: "Os atletas pré-selecionados passarão por treinamentos para:",
      lista: [
        "Aprimoramento físico e tático",
        "Padronização de sistemas de jogo para competições nacionais"
      ]
    },
    {
      numero: "12",
      titulo: "CANAIS OFICIAIS DE INFORMAÇÃO",
      icon: Globe,
      conteudo: "Fique por dentro de todos os editais e resultados:",
      lista: [
        "🌐 idjuv.online/selecoes",
        "📧 Dúvidas: idjuv.diesp@gmail.com"
      ]
    }
  ]
};

const REGULAMENTO_PDF_URL = "/docs/regulamento-seletiva-2026.pdf";

export function SeletivaRegulamentoV2() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "center",
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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
                        {secao.destaque && (
                          <p className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                            {secao.destaque}
                          </p>
                        )}

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
                  Regulamento Nº 001/2026 – IDJUV
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Seletiva da Seleção Coletiva • PDF Oficial
                </p>
              </div>
            </div>

            <a href={REGULAMENTO_PDF_URL} target="_blank" rel="noopener noreferrer" download>
              <Button 
                size="lg" 
                className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full px-8 font-bold tracking-wide shadow-lg"
              >
                <Download className="mr-2 w-5 h-5" />
                BAIXAR PDF
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Nota de rodapé */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-zinc-500 dark:text-zinc-500 mt-8"
        >
          Este regulamento pode sofrer alterações. Consulte sempre a versão mais atualizada em idjuv.online/selecoes
        </motion.p>
      </div>
    </section>
  );
}
