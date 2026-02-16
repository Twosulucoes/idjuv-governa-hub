/**
 * SEÇÃO DE ATOS ADMINISTRATIVOS DO SERVIDOR (READ-ONLY)
 * 
 * Exibe todos os atos administrativos vinculados ao servidor:
 * portarias, decretos, memorandos, resoluções, etc.
 * 
 * @version 3.0.0
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
  Scale,
  ScrollText,
  Gavel,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { 
  STATUS_PORTARIA_LABELS, 
  STATUS_PORTARIA_COLORS,
  TIPO_PORTARIA_LABELS 
} from "@/types/portaria";

// Labels para tipo_documento (enum da tabela documentos)
const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  portaria: "Portaria",
  resolucao: "Resolução",
  instrucao_normativa: "Instrução Normativa",
  ordem_servico: "Ordem de Serviço",
  comunicado: "Comunicado",
  decreto: "Decreto",
  lei: "Lei",
  outro: "Outro",
};

const TIPO_DOCUMENTO_ICONS: Record<string, React.ReactNode> = {
  portaria: <FileText className="h-4 w-4" />,
  decreto: <Gavel className="h-4 w-4" />,
  resolucao: <Scale className="h-4 w-4" />,
  lei: <ScrollText className="h-4 w-4" />,
  instrucao_normativa: <FileCheck className="h-4 w-4" />,
  ordem_servico: <FileText className="h-4 w-4" />,
  comunicado: <FileText className="h-4 w-4" />,
  outro: <FileText className="h-4 w-4" />,
};

const TIPO_DOCUMENTO_COLORS: Record<string, string> = {
  portaria: "bg-primary/10 text-primary border-primary/20",
  decreto: "bg-amber-100 text-amber-800 border-amber-200",
  resolucao: "bg-violet-100 text-violet-800 border-violet-200",
  lei: "bg-emerald-100 text-emerald-800 border-emerald-200",
  instrucao_normativa: "bg-sky-100 text-sky-800 border-sky-200",
  ordem_servico: "bg-slate-100 text-slate-700 border-slate-200",
  comunicado: "bg-orange-100 text-orange-700 border-orange-200",
  outro: "bg-muted text-muted-foreground border-border",
};

interface AtosAdministrativosSectionProps {
  servidorId: string;
  servidorNome: string;
}

export function AtosAdministrativosSection({ 
  servidorId, 
}: AtosAdministrativosSectionProps) {
  // Buscar TODOS os atos administrativos vinculados ao servidor
  const { data: atos = [], isLoading } = useQuery({
    queryKey: ["atos-administrativos-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
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
            <ScrollText className="h-5 w-5 text-primary" />
            Atos Administrativos
          </CardTitle>
          <Link to="/gabinete/portarias">
            <Button variant="ghost" size="sm" className="gap-1">
              Central de Atos
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {atos.length === 0 ? (
          <div className="text-center py-6">
            <ScrollText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum ato administrativo vinculado a este servidor.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Portarias, decretos, memorandos e outros atos são cadastrados pela Central do Gabinete.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {atos.map((ato) => {
              const statusColor = STATUS_PORTARIA_COLORS[ato.status as keyof typeof STATUS_PORTARIA_COLORS] || 'bg-muted text-muted-foreground';
              const tipoLabel = TIPO_DOCUMENTO_LABELS[ato.tipo] || ato.tipo;
              const tipoColor = TIPO_DOCUMENTO_COLORS[ato.tipo] || TIPO_DOCUMENTO_COLORS.outro;
              
              return (
                <div 
                  key={ato.id} 
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${tipoColor}`}>
                          {TIPO_DOCUMENTO_ICONS[ato.tipo] || TIPO_DOCUMENTO_ICONS.outro}
                          <span className="ml-1">{tipoLabel}</span>
                        </Badge>
                        <span className="font-medium">
                          nº {ato.numero}
                        </span>
                        {ato.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {TIPO_PORTARIA_LABELS[ato.categoria as keyof typeof TIPO_PORTARIA_LABELS] || ato.categoria}
                          </Badge>
                        )}
                        <Badge className={statusColor}>
                          {getStatusIcon(ato.status)}
                          <span className="ml-1">
                            {STATUS_PORTARIA_LABELS[ato.status as keyof typeof STATUS_PORTARIA_LABELS] || ato.status}
                          </span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {ato.ementa || ato.titulo}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(ato.data_documento), "dd/MM/yyyy")}
                        </span>
                        {ato.doe_numero && (
                          <span>DOE: {ato.doe_numero}</span>
                        )}
                        {ato.cargo?.sigla && (
                          <span>{ato.cargo.sigla}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <Link to={`/gabinete/portarias?id=${ato.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {atos.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {atos.length} ato(s) encontrado(s)
            </span>
            <Link to="/gabinete/portarias">
              <Button variant="outline" size="sm">
                Ver todos na Central
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
