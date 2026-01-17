import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  ClipboardList,
  Printer,
  UserCheck,
  Pencil,
  Trash2,
  RotateCcw,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdicionarParticipanteDialog } from "./AdicionarParticipanteDialog";
import { EnviarConvitesDialog } from "./EnviarConvitesDialog";
import { GestaoParticipantesTab } from "./GestaoParticipantesTab";
import { AtaReuniaoTab } from "./AtaReuniaoTab";
import { RelatoriosReuniaoDialog } from "./RelatoriosReuniaoDialog";
import { EditarReuniaoDialog } from "./EditarReuniaoDialog";
import { ExcluirReuniaoDialog } from "./ExcluirReuniaoDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusReuniao = "agendada" | "em_andamento" | "realizada" | "cancelada" | "adiada" | "confirmada";

interface ReuniaoDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniaoId?: string;
  onUpdate: () => void;
}

const statusConfig: Record<StatusReuniao, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  agendada: { label: "Agendada", variant: "secondary" },
  confirmada: { label: "Confirmada", variant: "secondary" },
  em_andamento: { label: "Em andamento", variant: "default" },
  realizada: { label: "Realizada", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  adiada: { label: "Adiada", variant: "outline" },
};

export function ReuniaoDetailSheet({ open, onOpenChange, reuniaoId, onUpdate }: ReuniaoDetailSheetProps) {
  const navigate = useNavigate();
  const [addParticipanteOpen, setAddParticipanteOpen] = useState(false);
  const [enviarConvitesOpen, setEnviarConvitesOpen] = useState(false);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [excluirOpen, setExcluirOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: reuniao, isLoading } = useQuery({
    queryKey: ["reuniao", reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return null;
      const { data, error } = await supabase
        .from("reunioes")
        .select("*")
        .eq("id", reuniaoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!reuniaoId && open,
  });

  const { data: participantes = [] } = useQuery({
    queryKey: ["participantes", reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return [];
      const { data, error } = await supabase
        .from("participantes_reuniao")
        .select(`
          *,
          servidor:servidor_id(id, nome_completo, foto_url, email_pessoal, telefone_celular)
        `)
        .eq("reuniao_id", reuniaoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!reuniaoId && open,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: StatusReuniao) => {
      const { error } = await supabase
        .from("reunioes")
        .update({ status: newStatus })
        .eq("id", reuniaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reuniao", reuniaoId] });
      onUpdate();
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const copyLink = () => {
    if (reuniao?.link_virtual) {
      navigator.clipboard.writeText(reuniao.link_virtual);
      toast.success("Link copiado!");
    }
  };

  if (!reuniaoId) return null;

  // Stats para badge
  const presentes = participantes.filter(p => p.status === "presente").length;
  const confirmados = participantes.filter(p => p.status === "confirmado").length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reuniao ? (
            <>
              {/* Header */}
              <SheetHeader className="p-4 pb-0 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <SheetTitle className="text-left flex-1">{reuniao.titulo}</SheetTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[reuniao.status as StatusReuniao]?.variant || "secondary"}>
                      {statusConfig[reuniao.status as StatusReuniao]?.label || reuniao.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditarOpen(true)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar Reunião
                        </DropdownMenuItem>
                        {reuniao.status === "agendada" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate("em_andamento")}
                              className="text-green-600 focus:text-green-600"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Reunião
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate("cancelada")}
                              className="text-orange-600 focus:text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar Reunião
                            </DropdownMenuItem>
                          </>
                        )}
                        {reuniao.status === "em_andamento" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate("realizada")}
                              className="text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Finalizar Reunião
                            </DropdownMenuItem>
                          </>
                        )}
                        {(reuniao.status === "cancelada" || reuniao.status === "adiada") && (
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate("agendada")}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reativar Reunião
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setExcluirOpen(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Reunião
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {reuniao.observacoes && (
                  <SheetDescription className="text-left">
                    {reuniao.observacoes}
                  </SheetDescription>
                )}
              </SheetHeader>

              {/* Info cards */}
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium text-sm">
                        {format(new Date(reuniao.data_reuniao + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horário</p>
                      <p className="font-medium text-sm">
                        {reuniao.hora_inicio}{reuniao.hora_fim ? ` - ${reuniao.hora_fim}` : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Local/Link */}
              {(reuniao.local || reuniao.link_virtual) && (
                <div className="px-4 pb-3 space-y-2">
                  {reuniao.local && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{reuniao.local}</span>
                    </div>
                  )}
                  {reuniao.link_virtual && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={reuniao.link_virtual} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate flex-1"
                      >
                        Acessar reunião virtual
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Tabs */}
              <Tabs defaultValue="participantes" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-3 grid grid-cols-3">
                  <TabsTrigger value="participantes" className="text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Participantes</span>
                    {participantes.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {reuniao.status === "em_andamento" || reuniao.status === "realizada" 
                          ? `${presentes}/${participantes.length}` 
                          : `${confirmados}/${participantes.length}`
                        }
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pauta" className="text-sm">
                    <FileText className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Pauta</span>
                  </TabsTrigger>
                  <TabsTrigger value="ata" className="text-sm">
                    <ClipboardList className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Ata</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="participantes" className="flex-1 overflow-auto px-4 pb-4 mt-3">
                  <GestaoParticipantesTab
                    participantes={participantes}
                    reuniaoId={reuniaoId}
                    statusReuniao={reuniao.status}
                    reuniao={reuniao}
                    onAddParticipante={() => setAddParticipanteOpen(true)}
                    onEnviarConvites={() => setEnviarConvitesOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="pauta" className="flex-1 overflow-auto px-4 pb-4 mt-3">
                  {reuniao.pauta ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{reuniao.pauta}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma pauta definida</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ata" className="flex-1 overflow-auto px-4 pb-4 mt-3">
                  <AtaReuniaoTab
                    reuniaoId={reuniaoId}
                    ataConteudo={reuniao.ata_conteudo}
                    ataAprovada={reuniao.ata_aprovada}
                    statusReuniao={reuniao.status}
                    pauta={reuniao.pauta}
                  />
                </TabsContent>
              </Tabs>

              {/* Footer Actions - apenas para ações secundárias */}
              {reuniao.status === "em_andamento" && (
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/admin/reunioes/${reuniaoId}/checkin`);
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check-in de Participantes
                    </Button>
                  </div>
                </div>
              )}
              {(reuniao.status === "realizada" || reuniao.status === "cancelada") && (
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setRelatoriosOpen(true)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Relatórios
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AdicionarParticipanteDialog
        open={addParticipanteOpen}
        onOpenChange={setAddParticipanteOpen}
        reuniaoId={reuniaoId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["participantes", reuniaoId] });
          setAddParticipanteOpen(false);
        }}
      />

      <EnviarConvitesDialog
        open={enviarConvitesOpen}
        onOpenChange={setEnviarConvitesOpen}
        reuniaoId={reuniaoId}
        participantes={participantes}
      />

      <RelatoriosReuniaoDialog
        open={relatoriosOpen}
        onOpenChange={setRelatoriosOpen}
        reuniaoId={reuniaoId}
      />

      <EditarReuniaoDialog
        open={editarOpen}
        onOpenChange={setEditarOpen}
        reuniao={reuniao}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["reuniao", reuniaoId] });
          queryClient.invalidateQueries({ queryKey: ["reunioes"] });
          onUpdate();
        }}
      />

      <ExcluirReuniaoDialog
        open={excluirOpen}
        onOpenChange={setExcluirOpen}
        reuniaoId={reuniaoId}
        reuniaoTitulo={reuniao?.titulo || ""}
        onSuccess={() => {
          onOpenChange(false);
          onUpdate();
        }}
      />
    </>
  );
}
