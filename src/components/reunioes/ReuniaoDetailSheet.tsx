import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  FileText,
  Send,
  UserPlus,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdicionarParticipanteDialog } from "./AdicionarParticipanteDialog";
import { EnviarConvitesDialog } from "./EnviarConvitesDialog";

type StatusReuniao = "agendada" | "em_andamento" | "realizada" | "cancelada" | "adiada" | "confirmada";
type StatusParticipante = "pendente" | "confirmado" | "recusado" | "ausente" | "presente";

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

const statusParticipanteConfig: Record<StatusParticipante, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "text-muted-foreground" },
  confirmado: { label: "Confirmado", color: "text-green-600" },
  recusado: { label: "Recusado", color: "text-red-600" },
  ausente: { label: "Ausente", color: "text-orange-600" },
  presente: { label: "Presente", color: "text-blue-600" },
};

export function ReuniaoDetailSheet({ open, onOpenChange, reuniaoId, onUpdate }: ReuniaoDetailSheetProps) {
  const [addParticipanteOpen, setAddParticipanteOpen] = useState(false);
  const [enviarConvitesOpen, setEnviarConvitesOpen] = useState(false);
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

  const { data: participantes } = useQuery({
    queryKey: ["participantes", reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return [];
      const { data, error } = await supabase
        .from("participantes_reuniao")
        .select(`
          *,
          servidor:servidor_id(id, nome_completo)
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
                  <SheetTitle className="text-left">{reuniao.titulo}</SheetTitle>
                  <Badge variant={statusConfig[reuniao.status as StatusReuniao]?.variant || "secondary"}>
                    {statusConfig[reuniao.status as StatusReuniao]?.label || reuniao.status}
                  </Badge>
                </div>
                {reuniao.objetivo && (
                  <SheetDescription className="text-left">
                    {reuniao.objetivo}
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
                        {format(new Date(reuniao.data_reuniao), "dd/MM/yyyy", { locale: ptBR })}
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
                <TabsList className="mx-4 mt-3 grid grid-cols-2">
                  <TabsTrigger value="participantes" className="text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    Participantes
                  </TabsTrigger>
                  <TabsTrigger value="pauta" className="text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Pauta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="participantes" className="flex-1 overflow-auto px-4 pb-4 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      {participantes?.length || 0} participante(s)
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setAddParticipanteOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {participantes?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum participante adicionado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {participantes?.map((p: any) => (
                        <Card key={p.id}>
                          <CardContent className="p-3 flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">
                                {p.nome_externo?.[0] || p.servidor?.nome_completo?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {p.nome_externo || p.servidor?.nome_completo || "Sem nome"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {p.email_externo || p.cargo_externo || ""}
                              </p>
                            </div>
                            <span className={`text-xs font-medium ${statusParticipanteConfig[p.status as StatusParticipante]?.color}`}>
                              {statusParticipanteConfig[p.status as StatusParticipante]?.label}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
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
              </Tabs>

              {/* Footer Actions */}
              <div className="p-4 border-t bg-muted/30 space-y-3">
                {participantes && participantes.length > 0 && reuniao.status === "agendada" && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setEnviarConvitesOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Convites
                  </Button>
                )}
                
                <div className="flex gap-2">
                  {reuniao.status === "agendada" && (
                    <>
                      <Button 
                        className="flex-1"
                        onClick={() => updateStatusMutation.mutate("em_andamento")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => updateStatusMutation.mutate("cancelada")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {reuniao.status === "em_andamento" && (
                    <Button 
                      className="flex-1"
                      onClick={() => updateStatusMutation.mutate("realizada")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar Reunião
                    </Button>
                  )}
                </div>
              </div>
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
        participantes={participantes || []}
      />
    </>
  );
}
