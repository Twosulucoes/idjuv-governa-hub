import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, Loader2, Download, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TermoCessao,
  AgendaUnidade,
  STATUS_TERMO_LABELS,
} from "@/types/unidadesLocais";
import { generateTermoCessao } from "@/lib/pdfTermoCessao";

interface TermosCessaoTabProps {
  unidadeId: string;
  chefeNomeacaoId?: string;
}

export function TermosCessaoTab({ unidadeId, chefeNomeacaoId }: TermosCessaoTabProps) {
  const [termos, setTermos] = useState<TermoCessao[]>([]);
  const [reservasAprovadas, setReservasAprovadas] = useState<AgendaUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<string>("");

  useEffect(() => {
    loadTermos();
    loadReservasAprovadas();
  }, [unidadeId]);

  async function loadTermos() {
    try {
      const { data, error } = await supabase
        .from("termos_cessao")
        .select(`
          *,
          agenda:agenda_unidade(*)
        `)
        .eq("unidade_local_id", unidadeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTermos(data as any);
    } catch (error) {
      console.error("Erro ao carregar termos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadReservasAprovadas() {
    try {
      // Buscar reservas aprovadas que ainda não têm termo
      const { data: termosExistentes } = await supabase
        .from("termos_cessao")
        .select("agenda_id")
        .eq("unidade_local_id", unidadeId);

      const agendaIdsComTermo = termosExistentes?.map((t) => t.agenda_id) || [];

      const { data, error } = await supabase
        .from("agenda_unidade")
        .select("*")
        .eq("unidade_local_id", unidadeId)
        .eq("status", "aprovado")
        .not("id", "in", `(${agendaIdsComTermo.join(",") || "00000000-0000-0000-0000-000000000000"})`)
        .order("data_inicio");

      if (error) throw error;
      setReservasAprovadas(data as AgendaUnidade[]);
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
    }
  }

  async function handleGerarTermo() {
    if (!selectedReserva) {
      toast.error("Selecione uma reserva");
      return;
    }

    setSaving(true);
    try {
      const reserva = reservasAprovadas.find((r) => r.id === selectedReserva);
      if (!reserva) throw new Error("Reserva não encontrada");

      const { data: userData } = await supabase.auth.getUser();

      // Gerar número do termo
      const ano = new Date().getFullYear();
      const { count } = await supabase
        .from("termos_cessao")
        .select("*", { count: "exact", head: true })
        .eq("ano", ano);

      const numeroTermo = String((count || 0) + 1).padStart(3, "0");

      const { error } = await supabase.from("termos_cessao").insert({
        agenda_id: reserva.id,
        unidade_local_id: unidadeId,
        numero_termo: numeroTermo,
        ano,
        cessionario_nome: reserva.solicitante_nome,
        cessionario_documento: reserva.solicitante_documento,
        cessionario_telefone: reserva.solicitante_telefone,
        finalidade: reserva.tipo_uso,
        periodo_inicio: reserva.data_inicio,
        periodo_fim: reserva.data_fim,
        chefe_responsavel_id: chefeNomeacaoId || null,
        status: "emitido",
        data_emissao: new Date().toISOString(),
        created_by: userData.user?.id,
      });

      if (error) throw error;

      toast.success("Termo de cessão gerado com sucesso!");
      setShowForm(false);
      setSelectedReserva("");
      loadTermos();
      loadReservasAprovadas();
    } catch (error: any) {
      console.error("Erro ao gerar termo:", error);
      toast.error(error.message || "Erro ao gerar termo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPDF(termo: TermoCessao) {
    try {
      // Buscar dados completos
      const { data: unidade } = await supabase
        .from("unidades_locais")
        .select("*")
        .eq("id", unidadeId)
        .single();

      let chefeNome = "";
      if (termo.chefe_responsavel_id) {
        const { data: nomeacao } = await supabase
          .from("nomeacoes_chefe_unidade")
          .select(`
            *,
            servidor:servidores(nome_completo)
          `)
          .eq("id", termo.chefe_responsavel_id)
          .single();
        chefeNome = (nomeacao as any)?.servidor?.nome_completo || "";
      }

      await generateTermoCessao({
        numero: `${termo.numero_termo}/${termo.ano}`,
        unidade: unidade?.nome_unidade || "",
        municipio: unidade?.municipio || "",
        cessionario: termo.cessionario_nome,
        cessionarioDocumento: termo.cessionario_documento || "",
        finalidade: termo.finalidade,
        periodoInicio: format(parseISO(termo.periodo_inicio), "dd/MM/yyyy HH:mm"),
        periodoFim: format(parseISO(termo.periodo_fim), "dd/MM/yyyy HH:mm"),
        chefeResponsavel: chefeNome,
        dataEmissao: termo.data_emissao ? format(parseISO(termo.data_emissao), "dd/MM/yyyy") : "",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-warning text-warning-foreground",
      emitido: "bg-info text-info-foreground",
      assinado: "bg-success text-success-foreground",
      cancelado: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Termos de Cessão
        </h3>
        <Button onClick={() => setShowForm(true)} disabled={reservasAprovadas.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Gerar Termo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : termos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum termo de cessão emitido
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Termo</TableHead>
                  <TableHead>Cessionário</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termos.map((termo) => (
                  <TableRow key={termo.id}>
                    <TableCell className="font-medium">
                      {termo.numero_termo}/{termo.ano}
                    </TableCell>
                    <TableCell>{termo.cessionario_nome}</TableCell>
                    <TableCell>{termo.finalidade}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(parseISO(termo.periodo_inicio), "dd/MM/yyyy HH:mm")}</p>
                        <p className="text-muted-foreground">
                          até {format(parseISO(termo.periodo_fim), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(termo.status)}>
                        {STATUS_TERMO_LABELS[termo.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadPDF(termo)}
                        title="Baixar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Geração de Termo */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Termo de Cessão</DialogTitle>
            <DialogDescription>
              Selecione uma reserva aprovada para gerar o termo de cessão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reserva Aprovada *</label>
              <Select value={selectedReserva} onValueChange={setSelectedReserva}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma reserva" />
                </SelectTrigger>
                <SelectContent>
                  {reservasAprovadas.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhuma reserva aprovada disponível
                    </SelectItem>
                  ) : (
                    reservasAprovadas.map((reserva) => (
                      <SelectItem key={reserva.id} value={reserva.id}>
                        {reserva.titulo} - {reserva.solicitante_nome} (
                        {format(parseISO(reserva.data_inicio), "dd/MM/yyyy")})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedReserva && (
              <Card>
                <CardContent className="pt-4">
                  {(() => {
                    const reserva = reservasAprovadas.find((r) => r.id === selectedReserva);
                    if (!reserva) return null;
                    return (
                      <div className="space-y-2 text-sm">
                        <p><strong>Evento:</strong> {reserva.titulo}</p>
                        <p><strong>Solicitante:</strong> {reserva.solicitante_nome}</p>
                        <p><strong>Tipo:</strong> {reserva.tipo_uso}</p>
                        <p>
                          <strong>Período:</strong>{" "}
                          {format(parseISO(reserva.data_inicio), "dd/MM/yyyy HH:mm")} a{" "}
                          {format(parseISO(reserva.data_fim), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setSelectedReserva("");
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleGerarTermo} disabled={saving || !selectedReserva}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Termo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
