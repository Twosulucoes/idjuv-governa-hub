/**
 * Seção de Galeria de Fotos - Seletivas Estudantis
 */

import { motion } from "framer-motion";
import { Camera, ImageIcon } from "lucide-react";

// TODO: Substituir por fotos reais do evento
const fotos: { id: string; url: string; legenda: string }[] = [];

export function SeletivaGaleria() {
  const temFotos = fotos.length > 0;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            Registro Visual
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Galeria de Fotos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Acompanhe os melhores momentos das seletivas
          </p>
        </motion.div>

        {temFotos ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto, index) => (
              <motion.div
                key={foto.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square rounded-2xl overflow-hidden bg-card border border-border group cursor-pointer"
              >
                <img
                  src={foto.url}
                  alt={foto.legenda}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border border-dashed rounded-3xl p-12 md:p-16 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              Fotos em Breve!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Durante as seletivas, registraremos os melhores momentos dos atletas em ação. 
              Volte aqui para conferir a galeria completa!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center"
                >
                  <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
