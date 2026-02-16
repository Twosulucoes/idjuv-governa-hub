/**
 * Timeline Unificada da Vida Funcional
 * Exibe historico_funcional cronológico com atos/documentos vinculados inline expandíveis.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  ArrowRight,
  Building2,
  Briefcase,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Newspaper,
  Scale,
  ScrollText,
  Gavel,
  FileCheck,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_PORTARIA_LABELS,
  STATUS_PORTARIA_COLORS,
} from "@/types/portaria";

const TIPO_MOVIMENTACAO_LABELS: Record<string, string> = {
  nomeacao: "Nomeação",
  exoneracao: "Exoneração",
  designacao: "Designação",
  dispensa: "Dispensa",
  transferencia: "Transferência",
  redistribuicao: "Redistribuição",
  cessao: "Cessão",
  requisicao: "Requisição",
  remocao: "Remoção",
  promocao: "Promoção",
  progressao: "Progressão",
  lotacao: "Lotação",
  retorno: "Retorno",
  afastamento: "Afastamento",
  aposentadoria: "Aposentadoria",
  vacancia: "Vacância",
};

const TIPO_MOVIMENTACAO_COLORS: Record<string, string> = {
  nomeacao: "bg-success/10 text-success border-success/20",
  exoneracao: "bg-destructive/10 text-destructive border-destructive/20",
  designacao: "bg-primary/10 text-primary border-primary/20",
  dispensa: "bg-warning/10 text-warning border-warning/20",
  transferencia: "bg-info/10 text-info border-info/20",
  redistribuicao: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  cessao: "bg-warning/10 text-warning border-warning/20",
  requisicao: "bg-info/10 text-info border-info/20",
  remocao: "bg-muted text-muted-foreground border-border",
  promocao: "bg-success/10 text-success border-success/20",
  progressao: "bg-primary/10 text-primary border-primary/20",
  lotacao: "bg-primary/10 text-primary border-primary/20",
  retorno: "bg-info/10 text-info border-info/20",
  afastamento: "bg-warning/10 text-warning border-warning/20",
  aposentadoria: "bg-muted text-muted-foreground border-border",
  vacancia: "bg-destructive/10 text-destructive border-destructive/20",
};

const TIPO_DOC_ICONS: Record<string, React.ReactNode> = {
  portaria: <FileText className="h-3.5 w-3.5" />,
  decreto: <Gavel className="h-3.5 w-3.5" />,
  resolucao: <Scale className="h-3.5 w-3.5" />,
  lei: <ScrollText className="h-3.5 w-3.5" />,
  instrucao_normativa: <FileCheck className="h-3.5 w-3.5" />,
};

const TIPO_DOC_LABELS: Record<string, string> = {
  portaria: "Portaria",
  decreto: "Decreto",
  resolucao: "Resolução",
  lei: "Lei",
  instrucao_normativa: "Instrução Normativa",
  ordem_servico: "Ordem de Serviço",
  comunicado: "Comunicado",
  outro: "Outro",
};

interface VidaFuncionalTimelineProps {
  servidorId: string;
}

export function VidaFuncionalTimeline({ servidorId }: VidaFuncionalTimelineProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Buscar histórico funcional
  const { data: historico = [], isLoading: loadingHistorico } = useQuery({
    queryKey: ["timeline-historico", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_funcional")
        .select(`
          *,
          cargo_anterior:cargos!historico_funcional_cargo_anterior_id_fkey(id, nome, sigla),
          cargo_novo:cargos!historico_funcional_cargo_novo_id_fkey(id, nome, sigla),
          unidade_anterior:estrutura_organizacional!historico_funcional_unidade_anterior_id_fkey(id, nome, sigla),
          unidade_nova:estrutura_organizacional!historico_funcional_unidade_nova_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_evento", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar atos administrativos vinculados ao servidor
  const { data: atos = [] } = useQuery({
    queryKey: ["timeline-atos", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, numero, data_documento, ementa, titulo, status, doe_numero, categoria")
        .contains("servidores_ids", [servidorId])
        .order("data_documento", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Agrupar atos por proximidade de data com movimentações
  const getAtosVinculados = (mov: any) => {
    // Match by portaria_numero or by date proximity (±7 days)
    return atos.filter((ato) => {
      // Match by portaria number
      if (mov.portaria_numero && ato.numero && 
          mov.portaria_numero === ato.numero) {
        return true;
      }
      // Match by date proximity (±7 days)
      if (ato.data_documento && mov.data_evento) {
        const diffMs = Math.abs(
          new Date(ato.data_documento).getTime() - new Date(mov.data_evento).getTime()
        );
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) return true;
      }
      return false;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tipos únicos para filtro
  const tiposUnicos = [...new Set(historico.map((h) => h.tipo))];

  const historicoFiltrado = filtroTipo === "todos"
    ? historico
    : historico.filter((h) => h.tipo === filtroTipo);

  if (loadingHistorico) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Timeline Funcional
          </CardTitle>
          {tiposUnicos.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tiposUnicos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_MOVIMENTACAO_LABELS[tipo] || tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {historicoFiltrado.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma movimentação registrada na timeline.
            </p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

            {historicoFiltrado.map((mov) => {
              const atosVinculados = getAtosVinculados(mov);
              const isExpanded = expandedIds.has(mov.id);
              const temAtos = atosVinculados.length > 0;

              return (
                <div key={mov.id} className="relative pl-12 pb-6">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2 top-2 w-4 h-4 rounded-full border-2 bg-background ${
                      TIPO_MOVIMENTACAO_COLORS[mov.tipo]?.includes("success")
                        ? "border-success"
                        : TIPO_MOVIMENTACAO_COLORS[mov.tipo]?.includes("destructive")
                        ? "border-destructive"
                        : TIPO_MOVIMENTACAO_COLORS[mov.tipo]?.includes("warning")
                        ? "border-warning"
                        : "border-primary"
                    }`}
                  />

                  <div className="rounded-lg border bg-card p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${TIPO_MOVIMENTACAO_COLORS[mov.tipo] || ""}`}
                          >
                            {TIPO_MOVIMENTACAO_LABELS[mov.tipo] || mov.tipo}
                          </Badge>
                          {temAtos && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <FileText className="h-3 w-3" />
                              {atosVinculados.length} ato(s)
                            </Badge>
                          )}
                        </div>

                        {/* Mudança de unidade */}
                        {(mov.unidade_anterior || mov.unidade_nova) && (
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {mov.unidade_anterior?.sigla || mov.unidade_anterior?.nome || "—"}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                              {mov.unidade_nova?.sigla || mov.unidade_nova?.nome || "—"}
                            </span>
                          </div>
                        )}

                        {/* Mudança de cargo */}
                        {(mov.cargo_anterior || mov.cargo_novo) && (
                          <div className="flex items-center gap-2 text-sm mt-0.5">
                            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {mov.cargo_anterior?.sigla || mov.cargo_anterior?.nome || "—"}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                              {mov.cargo_novo?.sigla || mov.cargo_novo?.nome || "—"}
                            </span>
                          </div>
                        )}

                        {mov.descricao && (
                          <p className="text-sm text-muted-foreground mt-2">{mov.descricao}</p>
                        )}

                        {mov.portaria_numero && !temAtos && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Portaria nº {mov.portaria_numero}
                            {mov.portaria_data &&
                              ` de ${format(new Date(mov.portaria_data), "dd/MM/yyyy")}`}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(mov.data_evento), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Atos vinculados expandível */}
                    {temAtos && (
                      <div className="mt-3 pt-3 border-t border-dashed">
                        <button
                          onClick={() => toggleExpand(mov.id)}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline w-full text-left"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {isExpanded
                            ? "Ocultar atos vinculados"
                            : `Ver ${atosVinculados.length} ato(s) vinculado(s)`}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-2">
                            {atosVinculados.map((ato) => {
                              const statusColor =
                                STATUS_PORTARIA_COLORS[
                                  ato.status as keyof typeof STATUS_PORTARIA_COLORS
                                ] || "bg-muted text-muted-foreground";

                              return (
                                <div
                                  key={ato.id}
                                  className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30 border text-sm"
                                >
                                  <span className="text-muted-foreground shrink-0">
                                    {TIPO_DOC_ICONS[ato.tipo] || <FileText className="h-3.5 w-3.5" />}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">
                                      {TIPO_DOC_LABELS[ato.tipo] || ato.tipo} nº {ato.numero}
                                    </span>
                                    {(ato.ementa || ato.titulo) && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {ato.ementa || ato.titulo}
                                      </p>
                                    )}
                                  </div>
                                  <Badge className={`text-[10px] shrink-0 ${statusColor}`}>
                                    {STATUS_PORTARIA_LABELS[
                                      ato.status as keyof typeof STATUS_PORTARIA_LABELS
                                    ] || ato.status}
                                  </Badge>
                                  {ato.doe_numero && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                                      <Newspaper className="h-3 w-3" />
                                      DOE {ato.doe_numero}
                                    </span>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                                    <Link to={`/gabinete/portarias?id=${ato.id}`}>
                                      <Eye className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
