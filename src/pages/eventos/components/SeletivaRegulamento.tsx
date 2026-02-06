/**
 * Seção de Regulamento - Seletivas Estudantis
 */

import { motion } from "framer-motion";
import { FileText, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SeletivaRegulamento() {
  // TODO: Substituir por link real do regulamento quando disponível
  const regulamentoDisponivel = false;
  const linkRegulamento = "#";

  return (
    <section className="py-16 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="inline-block px-4 py-1.5 bg-amber-500/10 rounded-full text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">
            Documento Oficial
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Regulamento da Seletiva
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Confira todas as regras, critérios de avaliação e requisitos para participar das seletivas
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" />
          </div>

          {regulamentoDisponivel ? (
            <>
              <h3 className="text-xl font-bold text-foreground mb-4">
                Regulamento Oficial 2025
              </h3>
              <p className="text-muted-foreground mb-6">
                Documento em PDF com todas as informações necessárias para sua participação.
              </p>
              <a href={linkRegulamento} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="rounded-full px-8">
                  <Download className="mr-2 w-5 h-5" />
                  Baixar Regulamento
                </Button>
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-foreground">
                  Em Breve
                </h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                O regulamento oficial está sendo finalizado e será disponibilizado em breve. 
                Fique atento às nossas redes sociais para mais atualizações!
              </p>
              <Button size="lg" variant="outline" className="rounded-full px-8" disabled>
                <Download className="mr-2 w-5 h-5" />
                Aguardando Publicação
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
