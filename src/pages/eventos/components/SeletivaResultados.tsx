/**
 * Seção de Resultados - Seletivas Estudantis
 * Exibe os atletas selecionados por modalidade e naipe
 */

import { motion } from "framer-motion";
import { Trophy, Users, Medal, Star, Clock } from "lucide-react";

// Estrutura para os resultados (será preenchida após as seletivas)
interface AtletaSelecionado {
  nome: string;
  escola?: string;
  posicao?: string;
}

interface ResultadoModalidade {
  modalidade: string;
  icon: string;
  cor: string;
  masculino: AtletaSelecionado[];
  feminino: AtletaSelecionado[];
}

// TODO: Preencher com os atletas selecionados
const resultados: ResultadoModalidade[] = [
  {
    modalidade: "HANDEBOL",
    icon: "🤾‍♂️",
    cor: "from-blue-600 to-blue-800",
    masculino: [],
    feminino: []
  },
  {
    modalidade: "BASQUETE",
    icon: "🏀",
    cor: "from-orange-500 to-orange-700",
    masculino: [],
    feminino: []
  },
  {
    modalidade: "VÔLEI",
    icon: "🏐",
    cor: "from-purple-600 to-purple-800",
    masculino: [],
    feminino: []
  },
  {
    modalidade: "FUTSAL",
    icon: "⚽",
    cor: "from-green-600 to-green-800",
    masculino: [],
    feminino: []
  }
];

function ResultadoCard({ resultado, index }: { resultado: ResultadoModalidade; index: number }) {
  const temResultados = resultado.masculino.length > 0 || resultado.feminino.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${resultado.cor} p-6 text-white`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{resultado.icon}</span>
          <div>
            <h3 className="text-2xl font-black tracking-wide">{resultado.modalidade}</h3>
            <p className="text-white/80 text-sm">Atletas Selecionados</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {temResultados ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Masculino */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-foreground">Masculino</h4>
              </div>
              <ul className="space-y-2">
                {resultado.masculino.map((atleta, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Medal className="w-4 h-4 text-amber-500" />
                    <span className="text-foreground">{atleta.nome}</span>
                    {atleta.escola && (
                      <span className="text-muted-foreground">- {atleta.escola}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feminino */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-pink-600" />
                </div>
                <h4 className="font-bold text-foreground">Feminino</h4>
              </div>
              <ul className="space-y-2">
                {resultado.feminino.map((atleta, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Medal className="w-4 h-4 text-amber-500" />
                    <span className="text-foreground">{atleta.nome}</span>
                    {atleta.escola && (
                      <span className="text-muted-foreground">- {atleta.escola}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Aguardando Seletiva</h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Os resultados serão divulgados após a realização da seletiva. Participe e mostre seu talento!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SeletivaResultados() {
  const temAlgumResultado = resultados.some(r => r.masculino.length > 0 || r.feminino.length > 0);

  return (
    <section className="py-20 px-4 bg-background" id="resultados">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 rounded-full text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">
            <Trophy className="w-4 h-4" />
            Selecionados
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            Resultados das Seletivas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {temAlgumResultado 
              ? "Confira os atletas selecionados para representar Roraima nos Jogos da Juventude 2025"
              : "Em breve, divulgaremos aqui os atletas selecionados para representar Roraima nos Jogos da Juventude 2025"
            }
          </p>
        </motion.div>

        {/* Mensagem de incentivo */}
        {!temAlgumResultado && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-12 p-6 md:p-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-3xl text-center"
          >
            <div className="flex justify-center gap-2 mb-4">
              <Star className="w-6 h-6 text-amber-500" />
              <Star className="w-6 h-6 text-amber-500" />
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              Seja um dos Selecionados!
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Participe das seletivas e tenha a chance de representar o esporte estudantil de Roraima. 
              Mostre sua dedicação, talento e espírito de equipe. Sua jornada começa aqui!
            </p>
          </motion.div>
        )}

        {/* Grid de resultados */}
        <div className="grid md:grid-cols-2 gap-6">
          {resultados.map((resultado, index) => (
            <ResultadoCard key={resultado.modalidade} resultado={resultado} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
