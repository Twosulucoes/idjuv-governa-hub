/**
 * FRONTEND PÚBLICO - PÁGINA DE NOTÍCIAS
 * Lista de notícias publicadas para o portal público
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Calendar, 
  User, 
  ChevronRight,
  Newspaper,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { EmptyState, SkipLink } from "@/components/design-system";

interface NoticiaPublica {
  id: string;
  titulo: string;
  slug: string;
  subtitulo: string | null;
  resumo: string | null;
  imagem_destaque_url: string | null;
  categoria: string | null;
  tags: string[] | null;
  autor_nome: string | null;
  data_publicacao: string | null;
  created_at: string;
  destaque: boolean;
}

export default function NoticiasPublicasPage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 12;

  // Buscar notícias publicadas
  const { data, isLoading } = useQuery({
    queryKey: ["noticias-publicas", categoria, pagina],
    queryFn: async () => {
      let query = supabase
        .from("cms_conteudos" as any)
        .select("*")
        .eq("status", "publicado")
        .eq("tipo", "noticia")
        .order("data_publicacao", { ascending: false });

      if (categoria !== "todas") {
        query = query.eq("categoria", categoria);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as NoticiaPublica[];
    },
  });

  const noticias = data || [];
  
  // Filtrar por busca
  const noticiasFiltradas = noticias.filter(n =>
    n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    n.resumo?.toLowerCase().includes(busca.toLowerCase())
  );

  // Paginação
  const totalPaginas = Math.ceil(noticiasFiltradas.length / itensPorPagina);
  const noticiasPaginadas = noticiasFiltradas.slice(
    (pagina - 1) * itensPorPagina,
    pagina * itensPorPagina
  );

  // Notícias em destaque
  const noticiasDestaque = noticias.filter(n => n.destaque).slice(0, 3);

  // Categorias únicas
  const categorias = [...new Set(noticias.map(n => n.categoria).filter(Boolean))];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
    <SkipLink />
    <main id="conteudo" tabIndex={-1} className="min-h-screen bg-background focus:outline-none">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Notícias
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Fique por dentro das últimas novidades do esporte, lazer e juventude de Roraima
            </p>
            
            {/* Barra de busca */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  aria-label="Buscar notícias"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar notícias..."
                  className="h-11 pl-10 text-base"
                />
              </div>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger aria-label="Filtrar por categoria" className="h-11 w-full sm:w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas categorias</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destaques */}
      {noticiasDestaque.length > 0 && (
        <section className="py-12 container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" aria-hidden="true" />
            Destaques
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {noticiasDestaque.map((noticia, index) => (
              <motion.div
                key={noticia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/noticias-portal/${noticia.slug}`}>
                  <Card className="overflow-hidden group h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden">
                      {noticia.imagem_destaque_url ? (
                        <img
                          src={noticia.imagem_destaque_url}
                          alt={noticia.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Newspaper className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                        </div>
                      )}
                      {noticia.categoria && (
                        <Badge className="absolute top-3 left-3">
                          {noticia.categoria}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {noticia.titulo}
                      </h3>
                      {noticia.resumo && (
                        <p className="text-muted-foreground text-base line-clamp-2 mt-2">
                          {noticia.resumo}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {format(new Date(noticia.data_publicacao || noticia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {noticia.autor_nome && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" aria-hidden="true" />
                            {noticia.autor_nome}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de Notícias */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Últimas Notícias</h2>
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : noticiasPaginadas.length === 0 ? (
          <EmptyState
            icone={Newspaper}
            titulo="Nenhuma notícia encontrada"
            descricao={busca || categoria !== "todas" ? "Tente outra busca ou escolha outra categoria." : "Ainda não há notícias publicadas."}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {noticiasPaginadas.map((noticia) => (
              <motion.div key={noticia.id} variants={itemVariants}>
                <Link to={`/noticias-portal/${noticia.slug}`}>
                  <Card className="overflow-hidden group h-full hover:shadow-md transition-shadow">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {noticia.imagem_destaque_url ? (
                        <img
                          src={noticia.imagem_destaque_url}
                          alt={noticia.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {noticia.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {noticia.categoria}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {noticia.titulo}
                      </h3>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {format(new Date(noticia.data_publicacao || noticia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <nav aria-label="Paginação das notícias" className="flex flex-wrap justify-center gap-2 mt-8">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPaginas)].map((_, i) => (
                <Button
                  key={i}
                  variant={pagina === i + 1 ? "default" : "outline"}
                  size="icon"
                  className="h-11 w-11"
                  aria-label={`Página ${i + 1}`}
                  aria-current={pagina === i + 1 ? "page" : undefined}
                  onClick={() => setPagina(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
            >
              Próximo
            </Button>
          </nav>
        )}
      </section>
    </main>
    </>
  );
}
