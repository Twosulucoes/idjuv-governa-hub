/**
 * SEÇÃO DE PORTARIAS DO SERVIDOR (READ-ONLY)
 * 
 * Exibe as portarias vinculadas ao servidor em modo consulta.
 * Todas as ações de criação/edição devem ser feitas na Central de Portarias (Gabinete).
 * 
 * @version 2.0.0
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  PenLine,
  Newspaper,
  Send,
  ExternalLink,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { 
  STATUS_PORTARIA_LABELS, 
  STATUS_PORTARIA_COLORS,
  TIPO_PORTARIA_LABELS 
} from "@/types/portaria";

interface PortariasServidorSectionProps {
  servidorId: string;
  servidorNome: string;
  servidorCpf?: string;
  cargoAtualId?: string;
  unidadeAtualId?: string;
  dataAdmissao?: string;
}

export function PortariasServidorSection({ 
  servidorId, 
}: PortariasServidorSectionProps) {
  // Buscar portarias vinculadas ao servidor (da tabela documentos)
  const { data: portarias = [], isLoading } = useQuery({
    queryKey: ["portarias-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
        .eq("tipo", "portaria")
        .contains("servidores_ids", [servidorId])
        .order("data_documento", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'minuta': return <FileText className="h-4 w-4" />;
      case 'aguardando_assinatura': return <PenLine className="h-4 w-4" />;
      case 'assinado': return <CheckCircle2 className="h-4 w-4" />;
      case 'aguardando_publicacao': return <Send className="h-4 w-4" />;
      case 'publicado': return <Newspaper className="h-4 w-4" />;
      case 'vigente': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Portarias do Servidor
          </CardTitle>
          <Link to="/gabinete/portarias">
            <Button variant="ghost" size="sm" className="gap-1">
              Central de Portarias
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {portarias.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma portaria vinculada a este servidor.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Portarias são cadastradas pela Central de Portarias do Gabinete.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {portarias.map((portaria) => {
              const statusColor = STATUS_PORTARIA_COLORS[portaria.status as keyof typeof STATUS_PORTARIA_COLORS] || 'bg-muted text-muted-foreground';
              
              return (
                <div 
                  key={portaria.id} 
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">
                          Portaria nº {portaria.numero}
                        </span>
                        {portaria.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {TIPO_PORTARIA_LABELS[portaria.categoria as keyof typeof TIPO_PORTARIA_LABELS] || portaria.categoria}
                          </Badge>
                        )}
                        <Badge className={statusColor}>
                          {getStatusIcon(portaria.status)}
                          <span className="ml-1">
                            {STATUS_PORTARIA_LABELS[portaria.status as keyof typeof STATUS_PORTARIA_LABELS] || portaria.status}
                          </span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {portaria.ementa || portaria.titulo}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(portaria.data_documento), "dd/MM/yyyy")}
                        </span>
                        {portaria.doe_numero && (
                          <span>DOE: {portaria.doe_numero}</span>
                        )}
                        {portaria.cargo?.sigla && (
                          <span>{portaria.cargo.sigla}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <Link to={`/gabinete/portarias?id=${portaria.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {portarias.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {portarias.length} portaria(s) encontrada(s)
            </span>
            <Link to="/gabinete/portarias">
              <Button variant="outline" size="sm">
                Ver todas na Central
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
