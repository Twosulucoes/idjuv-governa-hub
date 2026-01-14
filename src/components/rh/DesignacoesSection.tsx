import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { useDesignacaoServidor } from "@/hooks/useDesignacoes";
import { STATUS_DESIGNACAO_LABELS, STATUS_DESIGNACAO_COLORS, type StatusDesignacao } from "@/types/designacao";

interface DesignacoesSectionProps {
  servidorId: string;
}

export function DesignacoesSection({ servidorId }: DesignacoesSectionProps) {
  const { data: designacoes = [], isLoading } = useDesignacaoServidor(servidorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Designações Temporárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (designacoes.length === 0) {
    return null; // Não mostrar seção se não houver designações
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Designações Temporárias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {designacoes.map((designacao) => {
            const status = designacao.status as StatusDesignacao;
            const isAtiva = status === 'aprovada';
            
            return (
              <div key={designacao.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-2 top-2 w-4 h-4 rounded-full border-2 ${
                  isAtiva 
                    ? "bg-primary border-primary" 
                    : status === 'encerrada'
                    ? "bg-muted border-muted-foreground/30"
                    : status === 'pendente'
                    ? "bg-warning border-warning"
                    : "bg-destructive border-destructive"
                }`} />
                
                <div className={`p-4 rounded-lg border ${
                  isAtiva 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/30 border-border"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">
                          {designacao.unidade_origem?.sigla || designacao.unidade_origem?.nome || "—"}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {designacao.unidade_destino?.sigla || designacao.unidade_destino?.nome || "—"}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={STATUS_DESIGNACAO_COLORS[status]}
                        >
                          {STATUS_DESIGNACAO_LABELS[status]}
                        </Badge>
                      </div>
                      
                      {designacao.justificativa && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {designacao.justificativa}
                        </p>
                      )}
                      
                      {designacao.ato_numero && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {designacao.ato_tipo || "Portaria"} nº {designacao.ato_numero}
                          {designacao.ato_data && ` de ${format(new Date(designacao.ato_data), "dd/MM/yyyy")}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(designacao.data_inicio), "dd/MM/yyyy")}
                      </div>
                      {designacao.data_fim && (
                        <div className="text-xs">
                          até {format(new Date(designacao.data_fim), "dd/MM/yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
