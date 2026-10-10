/**
 * FRONTEND PÚBLICO - PÁGINA INDIVIDUAL DE GALERIA
 * Visualização completa de uma galeria com lightbox
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
  Download,
  Share2,
  Camera,
  Images
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, SkipLink } from "@/components/design-system";

interface GaleriaCompleta {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  imagem_capa_url: string | null;
  categoria: string | null;
  data_publicacao: string | null;
  created_at: string;
}

interface FotoGaleria {
  id: string;
  url: string;
  thumbnail_url: string | null;
  titulo: string | null;
  legenda: string | null;
  ordem: number;
}

export default function GaleriaPage() {
  const { slug } = useParams();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fotoAtual, setFotoAtual] = useState(0);

  // Buscar galeria pelo slug
  const { data: galeria, isLoading: loadingGaleria } = useQuery({
    queryKey: ["galeria", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_galerias" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .single();

      if (error) throw error;
      return data as unknown as GaleriaCompleta;
    },
    enabled: !!slug,
  });

  // Buscar fotos da galeria
  const { data: fotos = [], isLoading: loadingFotos } = useQuery({
    queryKey: ["galeria-fotos", galeria?.id],
    queryFn: async () => {
      if (!galeria?.id) return [];
      
      const { data, error } = await supabase
        .from("cms_galeria_fotos" as any)
        .select("*")
        .eq("galeria_id", galeria.id)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FotoGaleria[];
    },
    enabled: !!galeria?.id,
  });

  const isLoading = loadingGaleria || loadingFotos;

  const openLightbox = (index: number) => {
    setFotoAtual(index);
    setLightboxOpen(true);
  };

  const nextFoto = () => {
    setFotoAtual((prev) => (prev + 1) % fotos.length);
  };

  const prevFoto = () => {
    setFotoAtual((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextFoto();
    if (e.key === "ArrowLeft") prevFoto();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  if (isLoading) {
    return (
      <>
      <SkipLink />
      <main id="conteudo" tabIndex={-1} aria-busy="true" className="min-h-screen bg-background focus:outline-none">
        <div className="container mx-auto px-4 py-8">
          <h1 className="sr-only">Carregando galeria</h1>
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </main>
      </>
    );
  }

  if (!galeria) {
    return (
      <>
      <SkipLink />
      <main id="conteudo" tabIndex={-1} className="min-h-screen bg-background flex items-center justify-center px-4 focus:outline-none">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Galeria não encontrada</h1>
          <p className="text-base text-muted-foreground mb-6">
            A galeria que você procura não existe ou foi removida.
          </p>
          <Button asChild className="min-h-11">
            <Link to="/galerias">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Voltar para galerias
            </Link>
          </Button>
        </div>
      </main>
      </>
    );
  }

  return (
    <>
    <SkipLink />
    <main id="conteudo" tabIndex={-1} className="min-h-screen bg-background focus:outline-none">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-1">
          <nav aria-label="Você está em" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="inline-flex min-h-11 items-center hover:text-foreground">Início</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link to="/galerias" className="inline-flex min-h-11 items-center hover:text-foreground">Galerias</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span aria-current="page" className="text-foreground truncate max-w-[200px]">{galeria.titulo}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Voltar */}
          <Link to="/galerias" className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Voltar para galerias
          </Link>

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {galeria.categoria && (
                  <Badge variant="default">{galeria.categoria}</Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Camera className="h-3 w-3" aria-hidden="true" />
                  {fotos.length} fotos
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                {galeria.titulo}
              </h1>
              {galeria.descricao && (
                <p className="text-lg text-muted-foreground">
                  {galeria.descricao}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {format(new Date(galeria.data_publicacao || galeria.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button variant="outline" className="min-h-11" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Copiar link
            </Button>
          </div>

          {/* Grid de Fotos */}
          {fotos.length === 0 ? (
            <EmptyState
              icone={Images}
              titulo="Nenhuma foto nesta galeria"
              descricao="As fotos ainda não foram publicadas."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {fotos.map((foto, index) => (
                <motion.button
                  type="button"
                  key={foto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative block aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Ampliar ${foto.titulo || `foto ${index + 1}`}`}
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={foto.thumbnail_url || foto.url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </span>
                  {foto.titulo && (
                    <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                      <span className="block text-white text-sm font-medium truncate">{foto.titulo}</span>
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">
            {fotos[fotoAtual]?.titulo || `Foto ${fotoAtual + 1} de ${fotos.length}`}
          </DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Botão Fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 h-11 w-11 text-white hover:bg-white/20"
              aria-label="Fechar"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </Button>

            {/* Navegação */}
            {fotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                  aria-label="Foto anterior"
                  onClick={prevFoto}
                >
                  <ChevronLeft className="h-8 w-8" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                  aria-label="Próxima foto"
                  onClick={nextFoto}
                >
                  <ChevronRight className="h-8 w-8" aria-hidden="true" />
                </Button>
              </>
            )}

            {/* Imagem */}
            <AnimatePresence mode="wait">
              <motion.div
                key={fotoAtual}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-8 max-h-[95vh]"
              >
                <img
                  src={fotos[fotoAtual]?.url}
                  alt={fotos[fotoAtual]?.titulo || `Foto ${fotoAtual + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded"
                />
                {(fotos[fotoAtual]?.titulo || fotos[fotoAtual]?.legenda) && (
                  <div className="mt-4 text-center text-white">
                    {fotos[fotoAtual]?.titulo && (
                      <p className="font-semibold">{fotos[fotoAtual]?.titulo}</p>
                    )}
                    {fotos[fotoAtual]?.legenda && (
                      <p className="text-sm text-white/70 mt-1">{fotos[fotoAtual]?.legenda}</p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Contador */}
            <div aria-live="polite" className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {fotoAtual + 1} / {fotos.length}
            </div>

            {/* Thumbnails */}
            {fotos.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2">
                {fotos.map((foto, index) => (
                  <button
                    type="button"
                    key={foto.id}
                    aria-label={`Ver foto ${index + 1}`}
                    aria-current={index === fotoAtual ? "true" : undefined}
                    onClick={() => setFotoAtual(index)}
                    className={cn(
                      "w-16 h-16 rounded overflow-hidden flex-shrink-0 transition-all",
                      index === fotoAtual ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"
                    )}
                  >
                    <img
                      src={foto.thumbnail_url || foto.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
    </>
  );
}
