/**
 * Seção de Regulamento V2 - Seletivas Estudantis
 * Com texto de exemplo e botão de download
 */

import { motion } from "framer-motion";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const regulamentoSections = [
  {
    titulo: "1. OBJETIVO",
    conteudo: "A Seletiva das Seleções Estudantis tem como objetivo identificar e selecionar atletas estudantis para representar o Estado de Roraima nos Jogos da Juventude 2026."
  },
  {
    titulo: "2. PARTICIPAÇÃO",
    conteudo: "Podem participar estudantes regularmente matriculados em instituições de ensino do Estado de Roraima, com idade entre 15 e 17 anos completos no ano da competição."
  },
  {
    titulo: "3. MODALIDADES",
    conteudo: "Futsal (Masculino e Feminino), Handebol (Masculino e Feminino), Basquete (Masculino e Feminino) e Vôlei (Masculino e Feminino)."
  },
  {
    titulo: "4. DOCUMENTAÇÃO NECESSÁRIA",
    itens: [
      "Documento de identificação com foto",
      "Declaração de matrícula escolar",
      "Autorização dos pais ou responsáveis (para menores)",
      "Atestado médico de aptidão física"
    ]
  },
  {
    titulo: "5. CRITÉRIOS DE SELEÇÃO",
    conteudo: "Os atletas serão avaliados por comissão técnica designada pelo IDJuv, considerando habilidades técnicas, táticas e comportamentais."
  }
];

export function SeletivaRegulamentoV2() {
  // TODO: Substituir por link real do regulamento quando disponível
  const regulamentoDisponivel = true;
  const linkRegulamento = "#";

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black tracking-[0.2em] uppercase text-zinc-900 mb-4">
            REGULAMENTO
          </h2>
          <p className="text-lg tracking-[0.1em] uppercase text-zinc-500">
            Seletiva 2026
          </p>
        </motion.div>

        {/* Conteúdo do Regulamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-100 rounded-2xl p-8 md:p-12 mb-8"
        >
          <div className="space-y-8">
            {regulamentoSections.map((section, index) => (
              <motion.div
                key={section.titulo}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <h3 className="text-lg font-bold tracking-[0.15em] uppercase text-zinc-900 mb-3">
                  {section.titulo}
                </h3>
                
                {section.conteudo && (
                  <p className="text-zinc-600 leading-relaxed">
                    {section.conteudo}
                  </p>
                )}
                
                {section.itens && (
                  <ul className="space-y-2 mt-2">
                    {section.itens.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Botão de Download */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-4 p-6 bg-zinc-900 rounded-2xl">
            <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center">
              <FileText className="w-7 h-7 text-zinc-300" />
            </div>
            <div className="text-left">
              <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 mb-1">
                Documento Oficial
              </p>
              <p className="text-sm font-bold tracking-wide text-white">
                Regulamento Completo (PDF)
              </p>
            </div>
            {regulamentoDisponivel ? (
              <a href={linkRegulamento} target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="ml-4 bg-white text-zinc-900 hover:bg-zinc-200 rounded-full px-6 font-bold tracking-wide"
                >
                  <Download className="mr-2 w-5 h-5" />
                  BAIXAR
                </Button>
              </a>
            ) : (
              <Button 
                size="lg" 
                variant="outline" 
                className="ml-4 border-zinc-600 text-zinc-400 rounded-full px-6" 
                disabled
              >
                EM BREVE
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
