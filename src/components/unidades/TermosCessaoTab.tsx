import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Plus, FileText, Loader2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  TermoCessao,
  STATUS_TERMO_LABELS,
  STATUS_TERMO_COLORS,
} from "@/types/unidadesLocais";
import {
  useTermosCessao,
  useReservasSemTermo,
  useRegistrarTermoCessao,
  useAtualizarRegistroSeiTermo,
} from "@/hooks/useTermosCessao";
import {
  CAMPOS_SEI_VAZIOS,
  type CamposSei,
  numeroTermoExibicao,
  registroSeiTermoSchema,
} from "@/lib/registroSei";
import { CamposAtoSei } from "@/components/unidades/CamposAtoSei";

interface TermosCessaoTabProps {
  unidadeId: string;
  chefeNomeacaoId?: string;
}

const dataBR = (d?: string | null) => (d ? format(parseISO(d), "dd/MM/yyyy") : "");

// O termo de cessão é feito no SEI: aqui se registra o termo da reserva e se acompanha o ciclo
// (processo SEI, número, assinatura e DOE). Sem número do SEI, o termo fica "Aguardando SEI".
export function TermosCessaoTab({ unidadeId, chefeNomeacaoId }: TermosCessaoTabProps) {
  const { data: termos = [], isLoading } = useTermosCessao(unidadeId);
  const { data: reservasAprovadas = [] } = useReservasSemTermo(unidadeId);
  const registrar = useRegistrarTermoCessao();
  const atualizar = useAtualizarRegistroSeiTermo();

  const [showForm, setShowForm] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<string>("");
  const [sei, setSei] = useState<CamposSei>(CAMPOS_SEI_VAZIOS);

  const [editando, setEditando] = useState<TermoCessao | null>(null);
  const [seiEdicao, setSeiEdicao] = useState<CamposSei>(CAMPOS_SEI_VAZIOS);
  const [cancelado, setCancelado] = useState(false);

  function fecharRegistro() {
    setShowForm(false);
    setSelectedReserva("");
    setSei(CAMPOS_SEI_VAZIOS);
  }

  function abrirEdicao(termo: TermoCessao) {
    setEditando(termo);
    setSeiEdicao({
      processoSei: termo.processo_sei || "",
      numero: termo.numero_termo || "",
      dataAssinatura: termo.data_assinatura || "",
      doeNumero: termo.doe_numero || "",
      doeData: termo.doe_data || "",
    });
    setCancelado(termo.status === "cancelado");
  }

  async function handleRegistrarTermo() {
    const reserva = reservasAprovadas.find((r) => r.id === selectedReserva);
    if (!reserva) {
      toast.error("Selecione uma reserva");
      return;
    }
    const validacao = registroSeiTermoSchema.safeParse({ ...sei, cancelado: false });
    if (!validacao.success) {
      toast.error(validacao.error.issues[0]?.message || "Verifique os campos do SEI");
      return;
    }
    try {
      await registrar.mutateAsync({ reserva, unidadeId, chefeNomeacaoId, sei: validacao.data });
      toast.success(
        validacao.data.numero
          ? "Termo de cessão registrado com o número do SEI."
          : "Termo de cessão registrado como aguardando SEI.",
      );
      fecharRegistro();
    } catch (error) {
      console.error("Erro ao registrar termo:", error);
      toast.error((error as { message?: string })?.message || "Erro ao registrar termo");
    }
  }

  async function handleSalvarEdicao() {
    if (!editando) return;
    const validacao = registroSeiTermoSchema.safeParse({ ...seiEdicao, cancelado });
    if (!validacao.success) {
      toast.error(validacao.error.issues[0]?.message || "Verifique os campos do SEI");
      return;
    }
    try {
      await atualizar.mutateAsync({ termo: editando, sei: validacao.data });
      toast.success("Registro do SEI atualizado.");
      setEditando(null);
    } catch (error) {
      console.error("Erro ao atualizar termo:", error);
      toast.error((error as { message?: string })?.message || "Erro ao atualizar termo");
    }
  }

  const reservaSelecionada = reservasAprovadas.find((r) => r.id === selectedReserva);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Termos de Cessão
        </h3>
        <Button onClick={() => setShowForm(true)} disabled={reservasAprovadas.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Termo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : termos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum termo de cessão registrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Termo</TableHead>
                  <TableHead>SEI</TableHead>
                  <TableHead>Cessionário</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termos.map((termo) => {
                  const numero = numeroTermoExibicao(termo.numero_termo, termo.ano);
                  return (
                    <TableRow key={termo.id}>
                      <TableCell className="font-medium">
                        {numero ?? <span className="text-muted-foreground italic">aguardando SEI</span>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {termo.processo_sei ? (
                            <p>Proc. {termo.processo_sei}</p>
                          ) : (
                            <p className="text-muted-foreground italic">sem processo SEI</p>
                          )}
                          {termo.data_assinatura && (
                            <p className="text-muted-foreground">Assinado em {dataBR(termo.data_assinatura)}</p>
                          )}
                          {termo.doe_numero && (
                            <p className="text-muted-foreground">
                              DOE nº {termo.doe_numero}
                              {termo.doe_data && ` de ${dataBR(termo.doe_data)}`}
                            </p>
                          )}
                        </div>
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
                        <Badge className={STATUS_TERMO_COLORS[termo.status] || "bg-muted"}>
                          {STATUS_TERMO_LABELS[termo.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEdicao(termo)}
                          aria-label="Editar registro do SEI"
                          title="Editar registro do SEI"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de registro do termo */}
      <Dialog open={showForm} onOpenChange={(aberto) => (aberto ? setShowForm(true) : fecharRegistro())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Termo de Cessão</DialogTitle>
            <DialogDescription>
              O termo é feito e assinado no SEI. Selecione a reserva aprovada e, se já houver, informe o
              processo e o número do SEI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reserva Aprovada *</Label>
              <Select value={selectedReserva} onValueChange={setSelectedReserva}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma reserva" />
                </SelectTrigger>
                <SelectContent>
                  {reservasAprovadas.length === 0 ? (
                    <SelectItem value="none" disabled>
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

            {reservaSelecionada && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Evento:</strong> {reservaSelecionada.titulo}</p>
                    <p><strong>Solicitante:</strong> {reservaSelecionada.solicitante_nome}</p>
                    <p><strong>Tipo:</strong> {reservaSelecionada.tipo_uso}</p>
                    <p>
                      <strong>Período:</strong>{" "}
                      {format(parseISO(reservaSelecionada.data_inicio), "dd/MM/yyyy HH:mm")} a{" "}
                      {format(parseISO(reservaSelecionada.data_fim), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <CamposAtoSei
              valores={sei}
              onChange={setSei}
              rotuloNumero="Número do termo no SEI"
              idPrefixo="termo-novo"
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={fecharRegistro} disabled={registrar.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarTermo} disabled={registrar.isPending || !selectedReserva}>
                {registrar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Termo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição do registro do SEI */}
      <Dialog open={!!editando} onOpenChange={(aberto) => !aberto && setEditando(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registro do SEI do termo</DialogTitle>
            <DialogDescription>
              {editando?.cessionario_nome} — {editando?.finalidade}. A etapa segue o que já aconteceu no SEI:
              sem número, aguardando SEI; numerado, aguardando assinatura; com a data da assinatura, assinado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editando && !editando.processo_sei && editando.numero_termo && (
              <p className="text-xs text-muted-foreground">
                Registro anterior ao SEI: o número {numeroTermoExibicao(editando.numero_termo, editando.ano)} foi
                gerado pelo sistema. Substitua pelo número que o termo recebeu no SEI.
              </p>
            )}
            <CamposAtoSei
              valores={seiEdicao}
              onChange={setSeiEdicao}
              rotuloNumero="Número do termo no SEI"
              idPrefixo="termo-edicao"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="termo-cancelado"
                checked={cancelado}
                onCheckedChange={(v) => setCancelado(v === true)}
              />
              <Label htmlFor="termo-cancelado">Termo cancelado</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditando(null)} disabled={atualizar.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarEdicao} disabled={atualizar.isPending}>
                {atualizar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
