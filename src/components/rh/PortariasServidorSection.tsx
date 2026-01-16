import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Edit,
  FilePlus2,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import { RegistrarPublicacaoDialog } from "@/components/portarias/RegistrarPublicacaoDialog";
import { RegistrarAssinaturaDialog } from "@/components/portarias/RegistrarAssinaturaDialog";
import { EditarPortariaDialog } from "@/components/portarias/EditarPortariaDialog";
import { RetificarPortariaDialog } from "@/components/portarias/RetificarPortariaDialog";
import { GerarPortariaManualDialog } from "@/components/portarias/GerarPortariaManualDialog";
import { 
  STATUS_PORTARIA_LABELS, 
  STATUS_PORTARIA_COLORS,
  TIPO_PORTARIA_LABELS 
} from "@/types/portaria";
import { useEnviarParaAssinatura } from "@/hooks/usePortarias";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

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
  servidorNome,
  servidorCpf,
  cargoAtualId,
  unidadeAtualId,
  dataAdmissao,
}: PortariasServidorSectionProps) {
  const queryClient = useQueryClient();
  const [selectedPortaria, setSelectedPortaria] = useState<any>(null);
  const [showPublicacaoDialog, setShowPublicacaoDialog] = useState(false);
  const [showAssinaturaDialog, setShowAssinaturaDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showRetificarDialog, setShowRetificarDialog] = useState(false);
  const [showGerarManualDialog, setShowGerarManualDialog] = useState(false);

  const enviarAssinatura = useEnviarParaAssinatura();

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

  const getNextAction = (portaria: any) => {
    switch (portaria.status) {
      case 'minuta':
        return {
          label: 'Enviar p/ Assinatura',
          action: () => handleEnviarAssinatura(portaria),
          variant: 'outline' as const,
        };
      case 'aguardando_assinatura':
        return {
          label: 'Registrar Assinatura',
          action: () => {
            setSelectedPortaria(portaria);
            setShowAssinaturaDialog(true);
          },
          variant: 'outline' as const,
        };
      case 'assinado':
      case 'aguardando_publicacao':
        return {
          label: 'Registrar DOE',
          action: () => {
            setSelectedPortaria(portaria);
            setShowPublicacaoDialog(true);
          },
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  const canEdit = (status: string) => status === 'minuta' || status === 'aguardando_assinatura';
  const canRetify = (status: string) => status === 'publicado' || status === 'vigente';

  const handleEnviarAssinatura = async (portaria: any) => {
    try {
      await enviarAssinatura.mutateAsync(portaria.id);
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
      toast.success('Portaria enviada para assinatura!');
    } catch (err) {
      toast.error('Erro ao enviar para assinatura');
    }
  };

  const handleAssinaturaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
    setShowAssinaturaDialog(false);
    setSelectedPortaria(null);
  };

  const handlePublicacaoSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
    setShowPublicacaoDialog(false);
    setSelectedPortaria(null);
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const hasNomeacaoPortaria = portarias.some(p => p.categoria === 'nomeacao');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Portarias do Servidor
            </CardTitle>
            <div className="flex items-center gap-2">
              {!hasNomeacaoPortaria && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setShowGerarManualDialog(true)}
                >
                  <FilePlus2 className="h-4 w-4" />
                  Gerar Portaria
                </Button>
              )}
              <Link to="/rh/portarias">
                <Button variant="ghost" size="sm" className="gap-1">
                  Central de Portarias
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasNomeacaoPortaria && (
            <div className="mb-4 p-3 rounded-lg border border-warning/50 bg-warning/5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Servidor sem portaria de nomeação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este servidor foi cadastrado antes do sistema de portarias automáticas. 
                  Clique em "Gerar Portaria" para criar a portaria de nomeação retroativa.
                </p>
              </div>
            </div>
          )}

          {portarias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma portaria vinculada a este servidor.</p>
          ) : (
            <div className="space-y-3">
              {portarias.map((portaria) => {
                const nextAction = getNextAction(portaria);
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
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {portaria.ementa || portaria.titulo}
                        </p>
                        
                        {/* Status Workflow */}
                        <div className="flex items-center gap-1 text-xs mb-2">
                          {['minuta', 'aguardando_assinatura', 'assinado', 'publicado', 'vigente'].map((step, idx, arr) => {
                            const isCompleted = getStatusOrder(portaria.status) >= getStatusOrder(step);
                            const isCurrent = portaria.status === step;
                            
                            return (
                              <div key={step} className="flex items-center gap-1">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                                  isCurrent 
                                    ? statusColor 
                                    : isCompleted 
                                      ? 'bg-success/10 text-success' 
                                      : 'bg-muted text-muted-foreground'
                                }`}>
                                  {isCurrent && getStatusIcon(step)}
                                  <span className="hidden sm:inline">
                                    {STATUS_PORTARIA_LABELS[step as keyof typeof STATUS_PORTARIA_LABELS]}
                                  </span>
                                </div>
                                {idx < arr.length - 1 && (
                                  <ChevronRight className={`h-3 w-3 ${isCompleted ? 'text-success' : 'text-muted-foreground/30'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
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
                      
                      <div className="flex items-center gap-2">
                        {nextAction && (
                          <Button 
                            variant={nextAction.variant} 
                            size="sm"
                            onClick={nextAction.action}
                            disabled={enviarAssinatura.isPending}
                          >
                            {nextAction.label}
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(portaria.status) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPortaria(portaria);
                                  setShowEditarDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canRetify(portaria.status) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPortaria(portaria);
                                  setShowRetificarDialog(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Retificar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to="/rh/portarias">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver na Central
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Registrar Assinatura */}
      <RegistrarAssinaturaDialog
        open={showAssinaturaDialog}
        onOpenChange={setShowAssinaturaDialog}
        portaria={selectedPortaria}
        onSuccess={handleAssinaturaSuccess}
      />

      {/* Dialog Registrar Publicação */}
      {selectedPortaria && (
        <RegistrarPublicacaoDialog
          open={showPublicacaoDialog}
          onOpenChange={setShowPublicacaoDialog}
          portaria={selectedPortaria}
          onSuccess={handlePublicacaoSuccess}
        />
      )}

      {/* Dialog Editar Portaria */}
      <EditarPortariaDialog
        open={showEditarDialog}
        onOpenChange={(open) => {
          setShowEditarDialog(open);
          if (!open) setSelectedPortaria(null);
        }}
        portaria={selectedPortaria}
        onSuccess={handleDialogSuccess}
      />

      {/* Dialog Retificar Portaria */}
      {selectedPortaria && (
        <RetificarPortariaDialog
          open={showRetificarDialog}
          onOpenChange={setShowRetificarDialog}
          portariaOriginal={selectedPortaria}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Dialog Gerar Portaria Manual */}
      <GerarPortariaManualDialog
        open={showGerarManualDialog}
        onOpenChange={setShowGerarManualDialog}
        servidor={{
          id: servidorId,
          nome_completo: servidorNome,
          cpf: servidorCpf || "",
          cargo_atual_id: cargoAtualId,
          unidade_atual_id: unidadeAtualId,
          data_admissao: dataAdmissao,
        }}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}

function getStatusOrder(status: string): number {
  const order: Record<string, number> = {
    'minuta': 1,
    'aguardando_assinatura': 2,
    'assinado': 3,
    'aguardando_publicacao': 3.5,
    'publicado': 4,
    'vigente': 5,
    'revogado': 6,
  };
  return order[status] || 0;
}
