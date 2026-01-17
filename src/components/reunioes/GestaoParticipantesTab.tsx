import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  MoreVertical,
  Send,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Phone,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type StatusParticipante = "pendente" | "confirmado" | "recusado" | "ausente" | "presente";

interface Participante {
  id: string;
  status: StatusParticipante;
  nome_externo?: string | null;
  email_externo?: string | null;
  telefone_externo?: string | null;
  cargo_funcao?: string | null;
  instituicao_externa?: string | null;
  data_confirmacao?: string | null;
  data_assinatura?: string | null;
  assinatura_presenca?: boolean | null;
  justificativa_ausencia?: string | null;
  convite_enviado?: boolean | null;
  convite_enviado_em?: string | null;
  convite_canal?: string | null;
  servidor?: {
    id: string;
    nome_completo: string;
    foto_url?: string | null;
  } | null;
}

interface Reuniao {
  id: string;
  titulo: string;
  data_reuniao: string;
  hora_inicio: string;
  local?: string | null;
}

interface GestaoParticipantesTabProps {
  participantes: Participante[];
  reuniaoId: string;
  statusReuniao: string;
  reuniao?: Reuniao;
  onAddParticipante: () => void;
  onEnviarConvites: () => void;
}

const statusConfig: Record<StatusParticipante, { 
  label: string; 
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  pendente: { 
    label: "Pendente", 
    icon: <Clock className="h-3 w-3" />,
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
  confirmado: { 
    label: "Confirmado", 
    icon: <CheckCircle className="h-3 w-3" />,
    color: "text-green-700",
    bgColor: "bg-green-100"
  },
  recusado: { 
    label: "Recusado", 
    icon: <XCircle className="h-3 w-3" />,
    color: "text-red-700",
    bgColor: "bg-red-100"
  },
  ausente: { 
    label: "Ausente", 
    icon: <UserX className="h-3 w-3" />,
    color: "text-orange-700",
    bgColor: "bg-orange-100"
  },
  presente: { 
    label: "Presente", 
    icon: <UserCheck className="h-3 w-3" />,
    color: "text-blue-700",
    bgColor: "bg-blue-100"
  },
};

export function GestaoParticipantesTab({
  participantes,
  reuniaoId,
  statusReuniao,
  reuniao,
  onAddParticipante,
  onEnviarConvites,
}: GestaoParticipantesTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participanteToDelete, setParticipanteToDelete] = useState<string | null>(null);
  const [justificativaDialogOpen, setJustificativaDialogOpen] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [participanteJustificativa, setParticipanteJustificativa] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const isReuniaoAtiva = statusReuniao === "agendada" || statusReuniao === "em_andamento";

  // Função para abrir WhatsApp (apenas abre, não marca como enviado)
  const handleAbrirWhatsApp = (p: Participante) => {
    const telefone = p.telefone_externo || (p.servidor as any)?.telefone_celular;
    if (!telefone) {
      toast.error("Participante sem telefone cadastrado");
      return;
    }

    // Formatar telefone
    let telefoneFormatado = telefone.replace(/\D/g, "");
    if (!telefoneFormatado.startsWith("55")) {
      telefoneFormatado = "55" + telefoneFormatado;
    }

    // Montar mensagem simples
    const nome = getName(p);
    const dataFormatada = reuniao?.data_reuniao 
      ? new Date(reuniao.data_reuniao + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
      : "";
    const hora = reuniao?.hora_inicio?.substring(0, 5) || "";
    
    const mensagem = `Olá ${nome}! Você está convidado(a) para a reunião "${reuniao?.titulo || ""}"${dataFormatada ? ` no dia ${dataFormatada}` : ""}${hora ? ` às ${hora}` : ""}${reuniao?.local ? ` - Local: ${reuniao.local}` : ""}.`;

    const linkWhatsApp = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
    
    // Abre IMEDIATAMENTE (sem await antes) para evitar bloqueio de popup
    const win = window.open(linkWhatsApp, "_blank", "noopener,noreferrer");
    if (!win) {
      toast.error("Popup bloqueado! Permita popups para este site.");
    }
  };

  // Função para marcar convite como enviado manualmente
  const handleMarcarConviteEnviado = async (p: Participante, canal: "whatsapp" | "email" = "whatsapp") => {
    const { error } = await supabase
      .from("participantes_reuniao")
      .update({
        convite_enviado: true,
        convite_enviado_em: new Date().toISOString(),
        convite_canal: canal,
      })
      .eq("id", p.id);

    if (error) {
      toast.error("Erro ao marcar convite: " + error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["participantes", reuniaoId] });
    toast.success("Convite marcado como enviado!");
  };

  // Função para desmarcar convite
  const handleDesmarcarConvite = async (p: Participante) => {
    const { error } = await supabase
      .from("participantes_reuniao")
      .update({
        convite_enviado: false,
        convite_enviado_em: null,
        convite_canal: null,
      })
      .eq("id", p.id);

    if (error) {
      toast.error("Erro ao desmarcar convite: " + error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["participantes", reuniaoId] });
    toast.success("Convite desmarcado!");
  };

  // Stats
  const stats = {
    total: participantes.length,
    pendentes: participantes.filter(p => p.status === "pendente").length,
    confirmados: participantes.filter(p => p.status === "confirmado").length,
    recusados: participantes.filter(p => p.status === "recusado").length,
    presentes: participantes.filter(p => p.status === "presente").length,
    ausentes: participantes.filter(p => p.status === "ausente").length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status, justificativa }: { ids: string[]; status: StatusParticipante; justificativa?: string }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "confirmado") {
        updateData.data_confirmacao = new Date().toISOString();
      }
      if (status === "presente") {
        updateData.assinatura_presenca = true;
        updateData.data_assinatura = new Date().toISOString();
      }
      if (status === "ausente" && justificativa) {
        updateData.justificativa_ausencia = justificativa;
      }

      const { error } = await supabase
        .from("participantes_reuniao")
        .update(updateData)
        .in("id", ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participantes", reuniaoId] });
      setSelectedIds([]);
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("participantes_reuniao")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participantes", reuniaoId] });
      toast.success("Participante removido!");
      setDeleteDialogOpen(false);
      setParticipanteToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === participantes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participantes.map((p) => p.id));
    }
  };

  const handleBatchStatus = (status: StatusParticipante) => {
    if (status === "ausente") {
      setJustificativaDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ ids: selectedIds, status });
    }
  };

  const handleConfirmJustificativa = () => {
    if (participanteJustificativa) {
      updateStatusMutation.mutate({ 
        ids: [participanteJustificativa], 
        status: "ausente", 
        justificativa 
      });
    } else {
      updateStatusMutation.mutate({ 
        ids: selectedIds, 
        status: "ausente", 
        justificativa 
      });
    }
    setJustificativaDialogOpen(false);
    setJustificativa("");
    setParticipanteJustificativa(null);
  };

  const handleSingleStatus = (id: string, status: StatusParticipante) => {
    if (status === "ausente") {
      setParticipanteJustificativa(id);
      setJustificativaDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ ids: [id], status });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getName = (p: Participante) => p.nome_externo || p.servidor?.nome_completo || "Sem nome";

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-100">
          <p className="text-lg font-bold text-green-700">{stats.confirmados}</p>
          <p className="text-xs text-green-700">Confirmados</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-100">
          <p className="text-lg font-bold text-blue-700">{stats.presentes}</p>
          <p className="text-xs text-blue-700">Presentes</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isReuniaoAtiva && participantes.length > 0 && (
            <Checkbox
              checked={selectedIds.length === participantes.length && participantes.length > 0}
              onCheckedChange={handleToggleAll}
              aria-label="Selecionar todos"
            />
          )}
          <span className="text-sm text-muted-foreground">
            {selectedIds.length > 0 
              ? `${selectedIds.length} selecionado(s)` 
              : `${participantes.length} participante(s)`
            }
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isReuniaoAtiva && (
            <Button size="sm" variant="outline" onClick={onAddParticipante}>
              <UserPlus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Batch Actions */}
      {selectedIds.length > 0 && isReuniaoAtiva && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium mr-2">Ações em lote:</span>
          {statusReuniao === "agendada" && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleBatchStatus("confirmado")}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchStatus("recusado")}>
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Recusar
              </Button>
            </>
          )}
          {statusReuniao === "em_andamento" && (
            <>
              <Button size="sm" variant="default" onClick={() => handleBatchStatus("presente")}>
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                Presente
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchStatus("ausente")}>
                <UserX className="h-3.5 w-3.5 mr-1" />
                Ausente
              </Button>
            </>
          )}
        </div>
      )}

      {/* Enviar convites */}
      {statusReuniao === "agendada" && stats.pendentes > 0 && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onEnviarConvites}
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar Convites ({stats.pendentes} pendentes)
        </Button>
      )}

      {/* Lista de Participantes */}
      {participantes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum participante adicionado</p>
          {isReuniaoAtiva && (
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={onAddParticipante}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Participantes
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {participantes.map((p) => {
            const config = statusConfig[p.status as StatusParticipante] || statusConfig.pendente;
            const isSelected = selectedIds.includes(p.id);
            
            return (
              <Card 
                key={p.id} 
                className={`transition-colors ${isSelected ? "ring-2 ring-primary/50" : ""}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {isReuniaoAtiva && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(p.id)}
                        aria-label={`Selecionar ${getName(p)}`}
                      />
                    )}
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.servidor?.foto_url || undefined} />
                      <AvatarFallback className="text-sm">
                        {getInitials(getName(p))}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {getName(p)}
                        </p>
                        {!p.servidor && (
                          <Badge variant="outline" className="text-xs">
                            Externo
                          </Badge>
                        )}
                        {p.convite_enviado && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`flex items-center justify-center h-5 w-5 rounded-full ${
                                  p.convite_canal === "whatsapp" 
                                    ? "bg-green-100 text-green-600" 
                                    : "bg-blue-100 text-blue-600"
                                }`}>
                                  {p.convite_canal === "whatsapp" ? (
                                    <MessageSquare className="h-3 w-3" />
                                  ) : (
                                    <Mail className="h-3 w-3" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Convite enviado via {p.convite_canal === "whatsapp" ? "WhatsApp" : "E-mail"}</p>
                                {p.convite_enviado_em && (
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(p.convite_enviado_em).toLocaleString("pt-BR")}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {p.email_externo && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {p.email_externo}
                          </span>
                        )}
                        {p.instituicao_externa && (
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3" />
                            {p.instituicao_externa}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge className={`${config.bgColor} ${config.color} border-0 gap-1`}>
                      {config.icon}
                      {config.label}
                    </Badge>

                    {isReuniaoAtiva && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusReuniao === "agendada" && (
                            <>
                              <DropdownMenuItem onClick={() => handleSingleStatus(p.id, "confirmado")}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Marcar como Confirmado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSingleStatus(p.id, "recusado")}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Marcar como Recusado
                              </DropdownMenuItem>
                            </>
                          )}
                          {statusReuniao === "em_andamento" && (
                            <>
                              <DropdownMenuItem onClick={() => handleSingleStatus(p.id, "presente")}>
                                <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                                Registrar Presença
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSingleStatus(p.id, "ausente")}>
                                <UserX className="h-4 w-4 mr-2 text-orange-600" />
                                Registrar Ausência
                              </DropdownMenuItem>
                            </>
                          )}
                          {statusReuniao === "agendada" && (
                            <>
                              <DropdownMenuSeparator />
                              {(p.telefone_externo || (p.servidor as any)?.telefone_celular) && (
                                <DropdownMenuItem onClick={() => handleAbrirWhatsApp(p)}>
                                  <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                                  Abrir WhatsApp
                                </DropdownMenuItem>
                              )}
                              {!p.convite_enviado ? (
                                <DropdownMenuItem onClick={() => handleMarcarConviteEnviado(p, "whatsapp")}>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                                  Marcar convite como enviado
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleDesmarcarConvite(p)}>
                                  <XCircle className="h-4 w-4 mr-2 text-orange-600" />
                                  Desmarcar convite
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setParticipanteToDelete(p.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Info adicional */}
                  {p.justificativa_ausencia && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Justificativa:</strong> {p.justificativa_ausencia}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover participante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O participante será removido da reunião.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => participanteToDelete && deleteMutation.mutate(participanteToDelete)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Justificativa Dialog */}
      <AlertDialog open={justificativaDialogOpen} onOpenChange={setJustificativaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar ausência</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a justificativa para a ausência (opcional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="justificativa">Justificativa</Label>
            <Textarea
              id="justificativa"
              placeholder="Motivo da ausência..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setJustificativa("");
              setParticipanteJustificativa(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmJustificativa}>
              Confirmar Ausência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
