import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Clock, User, FileText, AlertTriangle } from "lucide-react";
import {
  AgendaUnidade,
  StatusAgenda,
  STATUS_AGENDA_LABELS,
  STATUS_AGENDA_COLORS,
  getTipoEventoLabel,
} from "@/types/unidadesLocais";
import { SEI_PATTERN, SEI_PLACEHOLDER } from "@/types/instituicoes";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgendaDayDetailProps {
  selectedDate: Date;
  reservas: AgendaUnidade[];
  chefeAtualId?: string;
  onStatusUpdated: () => void;
}

export function AgendaDayDetail({
  selectedDate,
  reservas,
  chefeAtualId,
  onStatusUpdated,
}: AgendaDayDetailProps) {
  const [approveDialog, setApproveDialog] = useState<AgendaUnidade | null>(null);
  const [rejectDialog, setRejectDialog] = useState<AgendaUnidade | null>(null);
  const [seiNumber, setSeiNumber] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [updating, setUpdating] = useState(false);

  async function handleApprove() {
    if (!approveDialog) return;
    if (!SEI_PATTERN.test(seiNumber)) {
      toast.error("Número do processo SEI inválido. Use o formato: " + SEI_PLACEHOLDER);
      return;
    }

    setUpdating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("agenda_unidade")
        .update({
          status: "aprovado" as any,
          numero_processo_sei: seiNumber,
          aprovador_id: chefeAtualId,
          data_aprovacao: new Date().toISOString(),
          updated_by: userData.user?.id,
        })
        .eq("id", approveDialog.id);

      if (error) throw error;
      toast.success("Reserva aprovada com sucesso!");
      setApproveDialog(null);
      setSeiNumber("");
      onStatusUpdated();
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar reserva");
    } finally {
      setUpdating(false);
    }
  }

  async function handleReject() {
    if (!rejectDialog) return;
    if (!rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição.");
      return;
    }

    setUpdating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("agenda_unidade")
        .update({
          status: "rejeitado" as any,
          motivo_rejeicao: rejectReason.trim(),
          aprovador_id: chefeAtualId,
          data_aprovacao: new Date().toISOString(),
          updated_by: userData.user?.id,
        })
        .eq("id", rejectDialog.id);

      if (error) throw error;
      toast.success("Reserva rejeitada.");
      setRejectDialog(null);
      setRejectReason("");
      onStatusUpdated();
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar reserva");
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel(reserva: AgendaUnidade) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("agenda_unidade")
        .update({
          status: "cancelado" as any,
          updated_by: userData.user?.id,
        })
        .eq("id", reserva.id);

      if (error) throw error;
      toast.success("Reserva cancelada.");
      onStatusUpdated();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar");
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reservas em {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            <Badge variant="outline" className="ml-auto">
              {reservas.length} reserva{reservas.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma reserva para este dia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{reserva.titulo}</h4>
                        <Badge className={STATUS_AGENDA_COLORS[reserva.status]}>
                          {STATUS_AGENDA_LABELS[reserva.status]}
                        </Badge>
                      </div>

                      <div className="mt-2 grid gap-1.5 text-sm">
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {format(parseISO(reserva.data_inicio), "dd/MM HH:mm")} →{" "}
                          {format(parseISO(reserva.data_fim), "dd/MM HH:mm")}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{reserva.solicitante_nome}</span>
                          {reserva.solicitante_documento && (
                            <span className="text-muted-foreground">
                              ({reserva.solicitante_documento})
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Tipo:</span>{" "}
                          {getTipoEventoLabel(reserva.tipo_uso)}
                        </p>
                        {(reserva as any).modalidades_esportivas?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {((reserva as any).modalidades_esportivas as string[]).map((m) => (
                              <Badge key={m} variant="outline" className="text-xs">
                                {m}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {(reserva as any).numero_processo_sei && (
                          <p className="text-xs text-muted-foreground">
                            <FileText className="inline h-3 w-3 mr-1" />
                            SEI: {(reserva as any).numero_processo_sei}
                          </p>
                        )}
                        {reserva.motivo_rejeicao && (
                          <div className="mt-1 p-2 bg-destructive/10 rounded text-destructive text-xs flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span><strong>Motivo:</strong> {reserva.motivo_rejeicao}</span>
                          </div>
                        )}
                        {reserva.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {reserva.observacoes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    {reserva.status === "solicitado" && chefeAtualId && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90 text-success-foreground"
                          onClick={() => setApproveDialog(reserva)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectDialog(reserva)}
                        >
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    )}
                    {(reserva.status === "solicitado" || reserva.status === "aprovado") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground shrink-0"
                        onClick={() => handleCancel(reserva)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprovação com SEI */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Reserva</DialogTitle>
            <DialogDescription>
              Informe o número do processo SEI para concluir a aprovação de "
              {approveDialog?.titulo}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nº do Processo SEI *</Label>
              <Input
                value={seiNumber}
                onChange={(e) => setSeiNumber(e.target.value)}
                placeholder={SEI_PLACEHOLDER}
                maxLength={21}
              />
              <p className="text-xs text-muted-foreground">
                Formato: {SEI_PLACEHOLDER}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)} disabled={updating}>
              Cancelar
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleApprove}
              disabled={updating}
            >
              {updating ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição com Motivo */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Reserva</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para "{rejectDialog?.titulo}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)} disabled={updating}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={updating}>
              {updating ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
