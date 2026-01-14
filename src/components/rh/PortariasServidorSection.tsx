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
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import { RegistrarPublicacaoDialog } from "@/components/portarias/RegistrarPublicacaoDialog";
import { 
  STATUS_PORTARIA_LABELS, 
  STATUS_PORTARIA_COLORS,
  TIPO_PORTARIA_LABELS 
} from "@/types/portaria";
import { useEnviarParaAssinatura, useRegistrarAssinatura } from "@/hooks/usePortarias";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PortariasServidorSectionProps {
  servidorId: string;
  servidorNome: string;
}

export function PortariasServidorSection({ servidorId, servidorNome }: PortariasServidorSectionProps) {
  const queryClient = useQueryClient();
  const [selectedPortaria, setSelectedPortaria] = useState<any>(null);
  const [showPublicacaoDialog, setShowPublicacaoDialog] = useState(false);
  const [showAssinaturaDialog, setShowAssinaturaDialog] = useState(false);
  const [assinaturaData, setAssinaturaData] = useState({
    assinado_por: '',
    data_assinatura: new Date().toISOString().split('T')[0],
  });

  const enviarAssinatura = useEnviarParaAssinatura();
  const registrarAssinatura = useRegistrarAssinatura();

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

  const handleEnviarAssinatura = async (portaria: any) => {
    try {
      await enviarAssinatura.mutateAsync(portaria.id);
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
      toast.success('Portaria enviada para assinatura!');
    } catch (err) {
      toast.error('Erro ao enviar para assinatura');
    }
  };

  const handleRegistrarAssinatura = async () => {
    if (!selectedPortaria || !assinaturaData.assinado_por) return;
    
    try {
      await registrarAssinatura.mutateAsync({
        id: selectedPortaria.id,
        assinado_por: assinaturaData.assinado_por,
        data_assinatura: assinaturaData.data_assinatura,
      });
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
      setShowAssinaturaDialog(false);
      setSelectedPortaria(null);
      toast.success('Assinatura registrada com sucesso!');
    } catch (err) {
      toast.error('Erro ao registrar assinatura');
    }
  };

  const handlePublicacaoSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
    setShowPublicacaoDialog(false);
    setSelectedPortaria(null);
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Portarias do Servidor
            </CardTitle>
            <Link to="/rh/portarias">
              <Button variant="ghost" size="sm" className="gap-1">
                Central de Portarias
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
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
                      
                      <div className="flex flex-col gap-2">
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
      <Dialog open={showAssinaturaDialog} onOpenChange={setShowAssinaturaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Assinatura</DialogTitle>
            <DialogDescription>
              Portaria nº {selectedPortaria?.numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assinado_por">Assinado por</Label>
              <Input
                id="assinado_por"
                placeholder="Nome do signatário"
                value={assinaturaData.assinado_por}
                onChange={(e) => setAssinaturaData(prev => ({ ...prev, assinado_por: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_assinatura">Data da Assinatura</Label>
              <Input
                id="data_assinatura"
                type="date"
                value={assinaturaData.data_assinatura}
                onChange={(e) => setAssinaturaData(prev => ({ ...prev, data_assinatura: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssinaturaDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRegistrarAssinatura}
              disabled={!assinaturaData.assinado_por || registrarAssinatura.isPending}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Publicação */}
      {selectedPortaria && (
        <RegistrarPublicacaoDialog
          open={showPublicacaoDialog}
          onOpenChange={setShowPublicacaoDialog}
          portaria={selectedPortaria}
          onSuccess={handlePublicacaoSuccess}
        />
      )}
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
