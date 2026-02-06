/**
 * Seção de Notícias V2 - Seletivas Estudantis
 * Feed de notícias sobre Jogos da Juventude e Jogos Escolares
 */

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Newspaper, Trophy, GraduationCap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Noticia {
  id: string;
  titulo: string;
  resumo: string | null;
  categoria: string;
  imagem_destaque_url: string | null;
  data_publicacao: string | null;
  destaque: boolean;
}

// Dados de exemplo enquanto não há notícias no banco
const noticiasExemplo: Noticia[] = [
  {
    id: "1",
    titulo: "Jogos da Juventude 2026: Roraima prepara suas seleções",
    resumo: "O Estado de Roraima inicia processo seletivo para formar as equipes que representarão o estado nos Jogos da Juventude, maior competição escolar do país organizada pelo COB.",
    categoria: "jogos-juventude",
    imagem_destaque_url: null,
    data_publicacao: "2026-02-05T10:00:00Z",
    destaque: true,
  },
  {
    id: "2",
    titulo: "Calendário dos Jogos Escolares Brasileiros divulgado",
    resumo: "A CBDE divulgou o calendário oficial dos Jogos Escolares Brasileiros 2026. Confira as datas e prepare-se para as competições.",
    categoria: "jogos-escolares",
    imagem_destaque_url: null,
    data_publicacao: "2026-02-03T14:00:00Z",
    destaque: false,
  },
  {
    id: "3",
    titulo: "Inscrições abertas para seletivas de Futsal e Handebol",
    resumo: "Estudantes de 15 a 17 anos podem se inscrever para as seletivas que acontecerão em fevereiro no Ginásio Hélio Campos.",
    categoria: "seletivas",
    imagem_destaque_url: null,
    data_publicacao: "2026-02-01T09:00:00Z",
    destaque: false,
  },
];

function getCategoriaIcon(categoria: string) {
  switch (categoria) {
    case "jogos-juventude":
      return Trophy;
    case "jogos-escolares":
      return GraduationCap;
    default:
      return Newspaper;
  }
}

function getCategoriaLabel(categoria: string) {
  switch (categoria) {
    case "jogos-juventude":
      return "Jogos da Juventude";
    case "jogos-escolares":
      return "Jogos Escolares";
    case "seletivas":
      return "Seletivas";
    case "resultados":
      return "Resultados";
    case "convocacoes":
      return "Convocações";
    default:
      return "Geral";
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(".", "").toUpperCase();
}

export function SeletivaNoticiasV2() {
  const navigate = useNavigate();
  
  const { data: noticias, isLoading } = useQuery({
    queryKey: ["noticias-eventos-esportivos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("noticias_eventos_esportivos")
        .select("id, titulo, slug, resumo, categoria, imagem_destaque_url, data_publicacao, destaque")
        .eq("status", "publicado")
        .order("data_publicacao", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as (Noticia & { slug: string })[];
    },
  });

  // Use notícias do banco ou exemplos se vazio
  const displayNoticias = noticias && noticias.length > 0 ? noticias : noticiasExemplo.map(n => ({ ...n, slug: `noticia-${n.id}` }));
  const noticiaDestaque = displayNoticias.find((n) => n.destaque) || displayNoticias[0];
  const outrasNoticias = displayNoticias.filter((n) => n.id !== noticiaDestaque?.id).slice(0, 3);

  const handleNoticiaClick = (slug: string) => {
    navigate(`/selecoes-v2/noticia/${slug}`);
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-zinc-800 transition-colors">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 rounded-full mb-4">
              <Newspaper className="w-4 h-4 text-white dark:text-zinc-900" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white dark:text-zinc-900">
                Fique Atualizado
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100">
              ÚLTIMAS NOTÍCIAS
            </h2>
            <p className="mt-2 text-sm tracking-[0.05em] uppercase text-zinc-500 dark:text-zinc-400">
              Jogos da Juventude & Jogos Escolares
            </p>
          </div>

          <Button
            variant="outline"
            className="self-start md:self-auto rounded-full px-6 font-bold tracking-wide border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
          >
            VER TODAS
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>

        {/* Grid de Notícias */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Notícia em Destaque */}
          {noticiaDestaque && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => handleNoticiaClick(noticiaDestaque.slug)}
              className="lg:row-span-2 group cursor-pointer"
            >
              <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-zinc-900 dark:bg-zinc-700">
                {noticiaDestaque.imagem_destaque_url ? (
                  <img
                    src={noticiaDestaque.imagem_destaque_url}
                    alt={noticiaDestaque.titulo}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  {/* Badge Categoria */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    {(() => {
                      const Icon = getCategoriaIcon(noticiaDestaque.categoria);
                      return <Icon className="w-3.5 h-3.5 text-white" />;
                    })()}
                    <span className="text-xs font-bold tracking-wider uppercase text-white">
                      {getCategoriaLabel(noticiaDestaque.categoria)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-black tracking-wide uppercase text-white mb-3 group-hover:text-zinc-200 transition-colors leading-tight">
                    {noticiaDestaque.titulo}
                  </h3>
                  
                  {noticiaDestaque.resumo && (
                    <p className="text-sm text-white/80 line-clamp-2 mb-4">
                      {noticiaDestaque.resumo}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(noticiaDestaque.data_publicacao)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.article>
          )}

          {/* Outras Notícias */}
          <div className="flex flex-col gap-4">
            {outrasNoticias.map((noticia, index) => {
              const Icon = getCategoriaIcon(noticia.categoria);
              
              return (
                <motion.article
                  key={noticia.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNoticiaClick(noticia.slug)}
                  className="group cursor-pointer"
                >
                  <div className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all">
                    {/* Thumbnail ou Ícone */}
                    <div className="w-20 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {noticia.imagem_destaque_url ? (
                        <img
                          src={noticia.imagem_destaque_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 dark:text-zinc-400">
                        {getCategoriaLabel(noticia.categoria)}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 mt-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                        {noticia.titulo}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(noticia.data_publicacao)}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Aviso quando usando dados de exemplo */}
        {(!noticias || noticias.length === 0) && !isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-8 italic"
          >
            * Notícias de exemplo. O conteúdo real será exibido quando publicado via CMS.
          </motion.p>
        )}
      </div>
    </section>
  );
}
