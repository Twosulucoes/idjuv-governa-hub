/**
 * FRONTEND PÚBLICO - PÁGINA DE GALERIAS
 * Lista de galerias de fotos publicadas
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
  Search, 
  Calendar, 
  Camera,
  Image as ImageIcon,
  Images
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface GaleriaPublica {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  imagem_capa_url: string | null;
  categoria: string | null;
  data_publicacao: string | null;
  created_at: string;
  fotos_count?: number;
}

export default function GaleriasPublicasPage() {
  const [busca, setBusca] = useState("");

  // Buscar galerias publicadas
  const { data: galerias = [], isLoading } = useQuery({
    queryKey: ["galerias-publicas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_galerias" as any)
        .select("*")
        .eq("status", "publicado")
        .order("data_publicacao", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as GaleriaPublica[];
    },
  });

  // Filtrar por busca
  const galeriasFiltradas = galerias.filter(g =>
    g.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    g.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Galerias de Fotos
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Confira os registros fotográficos dos eventos e ações esportivas de Roraima
            </p>
            
            {/* Barra de busca */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar galerias..."
                className="pl-10"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lista de Galerias */}
      <section className="py-12 container mx-auto px-4">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
        ) : galeriasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Images className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma galeria encontrada</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {galeriasFiltradas.map((galeria) => (
              <motion.div key={galeria.id} variants={itemVariants}>
                <Link to={`/galerias/${galeria.slug}`}>
                  <Card className="overflow-hidden group h-full hover:shadow-lg transition-all">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {galeria.imagem_capa_url ? (
                        <img
                          src={galeria.imagem_capa_url}
                          alt={galeria.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {/* Overlay com ícone */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      {galeria.categoria && (
                        <Badge className="absolute top-3 left-3">
                          {galeria.categoria}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {galeria.titulo}
                      </h3>
                      {galeria.descricao && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
                          {galeria.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(galeria.data_publicacao || galeria.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
