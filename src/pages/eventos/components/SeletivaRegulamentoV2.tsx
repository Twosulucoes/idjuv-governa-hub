/**
 * Seção de Regulamento V2 - Seletivas Estudantis
 * Regulamento completo estruturado com accordions colapsáveis e botão de download
 */

import { motion } from "framer-motion";
import { FileText, Download, Calendar, Users, Trophy, FileCheck, ClipboardCheck, AlertCircle, Scale, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  titulo: "REGULAMENTO OFICIAL",
  subtitulo: "Seletiva das Seleções Estudantis 2026",
  secoes: [
    {
      numero: "01",
      titulo: "OBJETIVO",
      icon: Trophy,
      conteudo: "A Seletiva das Seleções Estudantis tem como objetivo identificar, avaliar e selecionar atletas estudantis do Estado de Roraima para compor as delegações que representarão o estado nos Jogos da Juventude 2026, competição de âmbito nacional organizada pelo Comitê Olímpico do Brasil."
    },
    {
      numero: "02",
      titulo: "PARTICIPAÇÃO",
      icon: Users,
      conteudo: "Podem participar estudantes regularmente matriculados em instituições de ensino públicas ou privadas do Estado de Roraima, com idade entre 15 (quinze) e 17 (dezessete) anos completos no ano da competição nacional (2026). É obrigatória a apresentação de documentação comprobatória de matrícula escolar vigente."
    },
    {
      numero: "03",
      titulo: "MODALIDADES",
      icon: Trophy,
      lista: [
        "Futsal — Masculino e Feminino",
        "Handebol — Masculino e Feminino",
        "Basquetebol — Masculino e Feminino",
        "Voleibol — Masculino e Feminino"
      ]
    },
    {
      numero: "04",
      titulo: "PERÍODO E LOCAL",
      icon: Calendar,
      conteudo: "As seletivas serão realizadas entre os dias 19 de fevereiro e 01 de março de 2026, no Ginásio Poliesportivo Hélio da Costa Campos, localizado na Rua Presidente Juscelino Kubitscheck, S/N, Canarinho, Boa Vista - RR. Os horários específicos de cada modalidade e naipe estão detalhados no cronograma oficial."
    },
    {
      numero: "05",
      titulo: "DOCUMENTAÇÃO NECESSÁRIA",
      icon: FileCheck,
      lista: [
        "Documento de identidade oficial com foto (RG ou CNH)",
        "Declaração de matrícula escolar atualizada (2026)",
        "Autorização dos pais ou responsáveis legais (menores de 18 anos)",
        "Atestado médico de aptidão física (emitido nos últimos 90 dias)",
        "02 fotos 3x4 recentes",
        "Comprovante de residência no Estado de Roraima"
      ]
    },
    {
      numero: "06",
      titulo: "CRITÉRIOS DE SELEÇÃO",
      icon: ClipboardCheck,
      conteudo: "Os atletas serão avaliados por comissão técnica designada pelo Instituto de Desporto e Juventude de Roraima (IDJuv), considerando os seguintes aspectos:",
      lista: [
        "Habilidades técnicas específicas da modalidade",
        "Capacidade tática e leitura de jogo",
        "Condicionamento físico adequado à categoria",
        "Comportamento e disciplina esportiva",
        "Potencial de desenvolvimento e evolução"
      ]
    },
    {
      numero: "07",
      titulo: "DISPOSIÇÕES GERAIS",
      icon: AlertCircle,
      lista: [
        "A inscrição é gratuita e deve ser realizada no local da seletiva",
        "Atletas que já representam seleções de outros estados estão impedidos de participar",
        "O não comparecimento no dia e horário designados implica em eliminação automática",
        "A comissão técnica tem autonomia total nas decisões de seleção",
        "Os casos omissos serão resolvidos pela Diretoria de Esporte do IDJuv"
      ]
    },
    {
      numero: "08",
      titulo: "FUNDAMENTAÇÃO LEGAL",
      icon: Scale,
      conteudo: "Este regulamento está fundamentado na Lei Estadual nº XXX/XXXX, que dispõe sobre a política estadual de esporte e lazer, e nas diretrizes estabelecidas pelo Comitê Olímpico do Brasil para os Jogos da Juventude 2026."
    }
  ]
};

export function SeletivaRegulamentoV2() {
  // TODO: Substituir por link real do regulamento quando disponível
  const regulamentoDisponivel = true;
  const linkRegulamento = "#";

  return (
    <section className="py-20 px-4 bg-zinc-100 dark:bg-zinc-900 transition-colors">
      <div className="container mx-auto max-w-5xl">
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

        {/* Conteúdo do Regulamento com Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {regulamentoCompleto.secoes.map((secao) => {
              const IconComponent = secao.icon;
              return (
                <AccordionItem
                  key={secao.numero}
                  value={secao.numero}
                  className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline [&[data-state=open]>div>.chevron]:rotate-180">
                    <div className="flex items-center gap-4 md:gap-6 flex-1">
                      {/* Número da seção */}
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                        <span className="text-lg md:text-xl font-black text-white dark:text-zinc-900">
                          {secao.numero}
                        </span>
                      </div>

                      {/* Título */}
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <IconComponent className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hidden md:block" />
                        <h3 className="text-base md:text-lg font-bold tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100">
                          {secao.titulo}
                        </h3>
                      </div>

                      {/* Chevron customizado */}
                      <ChevronDown className="chevron w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 shrink-0" />
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6">
                    <div className="pl-16 md:pl-20 border-l-2 border-zinc-200 dark:border-zinc-700 ml-6 md:ml-7">
                      {secao.conteudo && (
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                          {secao.conteudo}
                        </p>
                      )}

                      {secao.lista && (
                        <ul className="space-y-2">
                          {secao.lista.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 mt-2 flex-shrink-0" />
                              <span className="text-zinc-600 dark:text-zinc-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Botão de Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="bg-zinc-900 dark:bg-zinc-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center">
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
                  Versão oficial para impressão e consulta
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
