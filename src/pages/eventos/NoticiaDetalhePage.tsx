/**
 * Página de Detalhes da Notícia - Seletivas Estudantis
 */

import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Trophy, GraduationCap, Newspaper, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShareButtons } from "@/components/social/ShareButtons";

interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  categoria: string;
  imagem_destaque_url: string | null;
  data_publicacao: string | null;
  autor_nome: string | null;
}

// Notícia de exemplo para fallback
const noticiaExemplo: Noticia = {
  id: "1",
  titulo: "Jogos da Juventude 2026: Roraima prepara suas seleções",
  slug: "jogos-juventude-2026-roraima",
  resumo: "O Estado de Roraima inicia processo seletivo para formar as equipes que representarão o estado nos Jogos da Juventude.",
  conteudo: `
    <p>O Instituto de Desenvolvimento da Juventude e Esportes de Roraima (IDJuv) anunciou o início do processo seletivo para formar as equipes que representarão o estado nos Jogos da Juventude 2026, a maior competição escolar do país organizada pelo Comitê Olímpico do Brasil (COB).</p>
    
    <h3>Modalidades Disponíveis</h3>
    <p>As seletivas acontecerão para as seguintes modalidades:</p>
    <ul>
      <li>Futsal (Masculino e Feminino)</li>
      <li>Handebol (Masculino e Feminino)</li>
      <li>Basquetebol (Masculino e Feminino)</li>
      <li>Voleibol (Masculino e Feminino)</li>
    </ul>
    
    <h3>Requisitos para Participação</h3>
    <p>Para participar das seletivas, os atletas devem:</p>
    <ul>
      <li>Ter entre 15 e 17 anos completos no ano da competição</li>
      <li>Estar regularmente matriculado em instituição de ensino de Roraima</li>
      <li>Apresentar documentação completa (RG, comprovante de matrícula, autorização dos pais)</li>
    </ul>
    
    <h3>Local e Datas</h3>
    <p>Todas as seletivas acontecerão no Ginásio Poliesportivo Hélio Campos, localizado na R. Pres. Juscelino Kubitscheck, 848, Canarinho, Boa Vista - RR.</p>
    
    <p>As datas específicas para cada modalidade serão divulgadas em breve neste site.</p>
  `,
  categoria: "jogos-juventude",
  imagem_destaque_url: null,
  data_publicacao: "2026-02-05T10:00:00Z",
  autor_nome: "IDJuv - Diretoria de Esportes",
};

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
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoticiaDetalhePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: noticia, isLoading } = useQuery({
    queryKey: ["cms-noticia-detalhe", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_conteudos")
        .select("id, titulo, slug, resumo, conteudo, conteudo_html, categoria, imagem_destaque_url, data_publicacao, autor_nome")
        .eq("slug", slug)
        .eq("status", "publicado")
        .eq("tipo", "noticia")
        .maybeSingle();

      if (error) throw error;
      // Usar conteudo_html se disponível, senão conteudo
      if (data) {
        return {
          ...data,
          conteudo: data.conteudo_html || data.conteudo
        } as Noticia;
      }
      return null;
    },
    enabled: !!slug,
  });

  // Usa notícia do banco ou exemplo
  const displayNoticia = noticia || noticiaExemplo;
  const Icon = getCategoriaIcon(displayNoticia.categoria);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
      {/* Header com imagem */}
      <div className="relative h-[40vh] md:h-[50vh] bg-zinc-900">
        {displayNoticia.imagem_destaque_url ? (
          <img
            src={displayNoticia.imagem_destaque_url}
            alt={displayNoticia.titulo}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Navegação */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
            onClick={() => navigate("/programas/selecoes")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Título sobre a imagem */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Badge Categoria */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Icon className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold tracking-wider uppercase text-white">
                  {getCategoriaLabel(displayNoticia.categoria)}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black tracking-wide uppercase text-white leading-tight">
                {displayNoticia.titulo}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-700"
        >
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-4 h-4" />
            {formatDate(displayNoticia.data_publicacao)}
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            {formatTime(displayNoticia.data_publicacao)}
          </div>
          {displayNoticia.autor_nome && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <User className="w-4 h-4" />
              {displayNoticia.autor_nome}
            </div>
          )}
          <div className="ml-auto">
            <ShareButtons 
              url={shareUrl}
              title={displayNoticia.titulo}
              description={displayNoticia.resumo || ""}
              size="sm"
            />
          </div>
        </motion.div>

        {/* Resumo */}
        {displayNoticia.resumo && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8 font-medium"
          >
            {displayNoticia.resumo}
          </motion.p>
        )}

        {/* Conteúdo principal */}
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-zinc dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-wide prose-headings:uppercase
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-li:text-zinc-600 dark:prose-li:text-zinc-300
            prose-ul:my-4 prose-li:my-1"
          dangerouslySetInnerHTML={{ __html: displayNoticia.conteudo || "" }}
        />

        {/* Aviso de exemplo */}
        {!noticia && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-12 italic"
          >
            * Notícia de exemplo. O conteúdo real será exibido quando publicado via CMS.
          </motion.p>
        )}

        {/* Botão voltar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-700"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/programas/selecoes")}
            className="rounded-full px-6 font-bold tracking-wide"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Seletivas
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
