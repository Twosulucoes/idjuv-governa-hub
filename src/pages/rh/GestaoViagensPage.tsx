import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Plane,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  Ban,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useViagens,
  useServidoresParaViagem,
  useAtualizarStatusViagem,
  useCancelarViagem,
  useExcluirViagem,
  useAtualizarWorkflowDiraf,
  SemPermissaoError,
  formatarDataViagem,
} from "@/hooks/useViagens";
import { ViagemFormDialog } from "@/components/rh/viagens/ViagemFormDialog";
import { CancelarViagemDialog } from "@/components/rh/viagens/CancelarViagemDialog";
import {
  STATUS_VIAGEM,
  descreverDestino,
  podeCancelar,
  podeEditarRegistro,
  podeExcluir,
  statusPermitidos,
} from "@/lib/diariasRegras";
import {
  VIAGEM_STATUS_LABELS,
  WORKFLOW_DIRAF_LABELS,
  type StatusViagemDiaria,
  type ViagemDiariaComServidor,
  type WorkflowDirafStatus,
} from "@/types/rh";

const WORKFLOW_DIRAF_STATUS: { value: WorkflowDirafStatus; label: string }[] = (
  Object.keys(WORKFLOW_DIRAF_LABELS) as WorkflowDirafStatus[]
).map((value) => ({ value, label: WORKFLOW_DIRAF_LABELS[value] }));

interface WorkflowFormData {
  status: WorkflowDirafStatus;
  numero_sei: string;
  observacoes: string;
}

export default function GestaoViagensPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viagemEmEdicao, setViagemEmEdicao] = useState<ViagemDiariaComServidor | null>(null);
  const [viagemParaCancelar, setViagemParaCancelar] = useState<ViagemDiariaComServidor | null>(null);
  const [viagemParaExcluir, setViagemParaExcluir] = useState<ViagemDiariaComServidor | null>(null);
  const [selectedViagem, setSelectedViagem] = useState<ViagemDiariaComServidor | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { isSuperAdmin, hasAnyPermission } = useAuth();
  // Barreira de UX: a RLS de `viagens_diarias` continua por módulo (rh | financeiro).
  const podeCriar = hasAnyPermission(["rh.viagens.criar", "rh.viagens.gerenciar"]);
  const podeEditar = hasAnyPermission(["rh.viagens.editar", "rh.viagens.gerenciar"]);
  const podeWorkflow = hasAnyPermission(["rh.viagens.gerenciar", "financeiro.diarias.gerenciar"]);

  const [workflowData, setWorkflowData] = useState<WorkflowFormData>({
    status: 'pendente',
    numero_sei: '',
    observacoes: '',
  });

  const { data: viagens = [], isLoading } = useViagens();
  const { data: servidores = [] } = useServidoresParaViagem();
  const atualizarStatus = useAtualizarStatusViagem();
  const cancelar = useCancelarViagem();
  const excluir = useExcluirViagem();
  const atualizarWorkflow = useAtualizarWorkflowDiraf();

  const abrirNovo = () => {
    setViagemEmEdicao(null);
    setIsFormOpen(true);
  };

  const abrirEdicao = (v: ViagemDiariaComServidor) => {
    setViagemEmEdicao(v);
    setIsFormOpen(true);
  };

  const mudarStatus = (v: ViagemDiariaComServidor, status: StatusViagemDiaria) => {
    if (status === v.status) return;
    // Cancelar exige motivo: passa pelo diálogo próprio.
    if (status === "cancelada") {
      setViagemParaCancelar(v);
      return;
    }
    atualizarStatus.mutate(
      { id: v.id, status },
      {
        onSuccess: () => toast.success("Status atualizado!"),
        onError: (error) => toast.error(`Erro: ${error.message}`),
      },
    );
  };

  const confirmarCancelamento = (motivo: string) => {
    if (!viagemParaCancelar) return;
    cancelar.mutate(
      { id: viagemParaCancelar.id, motivo, observacoesAtuais: viagemParaCancelar.observacoes },
      {
        onSuccess: () => toast.success("Viagem cancelada."),
        onError: (error) => toast.error(`Erro ao cancelar: ${error.message}`),
        onSettled: () => setViagemParaCancelar(null),
      },
    );
  };

  const confirmarExclusao = () => {
    if (!viagemParaExcluir) return;
    excluir.mutate(
      { id: viagemParaExcluir.id, servidorId: viagemParaExcluir.servidor_id },
      {
        onSuccess: () => toast.success("Registro de viagem excluído."),
        onError: (error) => {
          if (error instanceof SemPermissaoError) {
            toast.error(error.message);
          } else {
            toast.error(`Erro ao excluir: ${error.message}`);
          }
        },
        onSettled: () => setViagemParaExcluir(null),
      },
    );
  };

  const handleOpenWorkflow = (viagem: ViagemDiariaComServidor) => {
    setSelectedViagem(viagem);
    setWorkflowData({
      status: viagem.workflow_diraf_status || 'pendente',
      numero_sei: viagem.numero_sei_diarias || '',
      observacoes: viagem.workflow_diraf_observacoes || '',
    });
    setIsWorkflowOpen(true);
  };

  const salvarWorkflow = () => {
    if (!selectedViagem) return;
    atualizarWorkflow.mutate(
      {
        id: selectedViagem.id,
        status: workflowData.status,
        numeroSei: workflowData.numero_sei,
        observacoes: workflowData.observacoes,
      },
      {
        onSuccess: () => {
          toast.success("Workflow DIRAF atualizado!");
          setIsWorkflowOpen(false);
          setSelectedViagem(null);
        },
        onError: (error) => toast.error(error.message || "Erro ao atualizar workflow"),
      },
    );
  };

  // Filtros
  const filteredViagens = viagens.filter((v) => {
    const matchesSearch =
      v.servidor?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.destino_cidade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = formatarDataViagem;
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'concluida': return 'bg-success/20 text-success';
      case 'em_andamento': return 'bg-warning/20 text-warning';
      case 'autorizada': return 'bg-info/20 text-info';
      case 'cancelada': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getWorkflowIcon = (status?: string | null) => {
    switch (status) {
      case 'concluido': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'em_andamento': case 'solicitado': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
      <ModuleLayout module="rh">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Plane className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Viagens e Diárias</h1>
                <p className="text-muted-foreground">
                  Cadastro e controle de viagens a serviço
                </p>
              </div>
            </div>

            {podeCriar && (
              <Button onClick={abrirNovo}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Viagem
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {STATUS_VIAGEM.slice(0, 4).map(({ value, label }) => {
              const count = viagens.filter(v => v.status === value).length;
              return (
                <Card key={value}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por servidor ou destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_VIAGEM.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead className="text-center">Ônus</TableHead>
                  <TableHead className="text-center">Diárias</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">SEI Diárias</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredViagens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhuma viagem encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredViagens.map((viagem) => {
                    const editavel = podeEditarRegistro(viagem.status);
                    const cancelavel = podeEditar && podeCancelar(viagem);
                    const excluivel = podeExcluir(viagem, isSuperAdmin);
                    const permitidos = statusPermitidos(viagem.status);
                    const workflowLabel = WORKFLOW_DIRAF_STATUS.find(w => w.value === viagem.workflow_diraf_status)?.label || 'Pendente';
                    return (
                    <TableRow key={viagem.id}>
                      <TableCell>
                        <p className="font-medium">{viagem.servidor?.nome_completo || '-'}</p>
                      </TableCell>
                      <TableCell>{descreverDestino(viagem)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(viagem.data_saida)}</p>
                          <p className="text-muted-foreground">a {formatDate(viagem.data_retorno)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[200px] truncate">{viagem.finalidade}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={viagem.tipo_onus === 'sem_onus' ? 'bg-muted text-muted-foreground' : 'bg-warning/20 text-warning'}>
                          {viagem.tipo_onus === 'sem_onus' ? 'Sem Ônus' : 'Com Ônus'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {viagem.tipo_onus === 'sem_onus' ? '-' : (viagem.quantidade_diarias || '-')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {viagem.tipo_onus === 'sem_onus' ? '-' : formatCurrency(viagem.valor_total)}
                      </TableCell>
                      <TableCell className="text-center">
                        {viagem.tipo_onus === 'sem_onus' ? (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        ) : !podeWorkflow ? (
                          <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            {getWorkflowIcon(viagem.workflow_diraf_status)}
                            {viagem.numero_sei_diarias || workflowLabel}
                          </span>
                        ) : viagem.numero_sei_diarias ? (
                          <button
                            onClick={() => handleOpenWorkflow(viagem)}
                            className="flex items-center gap-1 text-xs font-medium text-success hover:underline mx-auto"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {viagem.numero_sei_diarias}
                          </button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleOpenWorkflow(viagem)}
                          >
                            {getWorkflowIcon(viagem.workflow_diraf_status)}
                            <span className="ml-1">{workflowLabel}</span>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={viagem.status ?? "solicitada"}
                          onValueChange={(v) => mudarStatus(viagem, v as StatusViagemDiaria)}
                          disabled={!podeEditar}
                        >
                          <SelectTrigger className="w-[140px]">
                            <Badge className={getStatusColor(viagem.status)}>
                              {viagem.status ? VIAGEM_STATUS_LABELS[viagem.status] : VIAGEM_STATUS_LABELS.solicitada}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_VIAGEM.map(s => (
                              <SelectItem key={s.value} value={s.value} disabled={!permitidos.includes(s.value)}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {podeEditar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar viagem"
                              title={editavel ? "Editar" : "Edição não permitida neste status"}
                              disabled={!editavel}
                              onClick={() => abrirEdicao(viagem)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {podeEditar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Cancelar viagem"
                              title={cancelavel ? "Cancelar viagem" : "Só viagens solicitadas ou autorizadas podem ser canceladas"}
                              disabled={!cancelavel}
                              onClick={() => setViagemParaCancelar(viagem)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {excluivel && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Excluir viagem definitivamente"
                              title="Excluir definitivamente"
                              onClick={() => setViagemParaExcluir(viagem)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Form Dialog (criar/editar) */}
          <ViagemFormDialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setViagemEmEdicao(null);
            }}
            servidores={servidores}
            viagem={viagemEmEdicao}
          />

          {/* Cancelamento com motivo */}
          <CancelarViagemDialog
            viagem={viagemParaCancelar}
            onOpenChange={(open) => !open && setViagemParaCancelar(null)}
            onConfirmar={confirmarCancelamento}
            pendente={cancelar.isPending}
          />

          {/* Confirmação de exclusão (só super admin, viagem solicitada sem SEI/portaria) */}
          <AlertDialog open={!!viagemParaExcluir} onOpenChange={(open) => !open && setViagemParaExcluir(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir registro de viagem?</AlertDialogTitle>
                <AlertDialogDescription>
                  {viagemParaExcluir && (
                    <>
                      Viagem de <strong>{viagemParaExcluir.servidor?.nome_completo}</strong> para{" "}
                      {descreverDestino(viagemParaExcluir)}, de{" "}
                      {formatDate(viagemParaExcluir.data_saida)} a {formatDate(viagemParaExcluir.data_retorno)}, será
                      removida definitivamente. Prefira cancelar o registro para manter o histórico.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={excluir.isPending}>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    confirmarExclusao();
                  }}
                  disabled={excluir.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {excluir.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Workflow DIRAF Dialog */}
          <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Workflow DIRAF — Diárias
                </DialogTitle>
              </DialogHeader>

              {selectedViagem && (
                <div className="space-y-4">
                  {/* Info da viagem */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                    <p><strong>Servidor:</strong> {selectedViagem.servidor?.nome_completo}</p>
                    <p><strong>Destino:</strong> {descreverDestino(selectedViagem)}</p>
                    <p><strong>Período:</strong> {formatDate(selectedViagem.data_saida)} a {formatDate(selectedViagem.data_retorno)}</p>
                    <p><strong>Diárias:</strong> {selectedViagem.quantidade_diarias || '-'} × {formatCurrency(selectedViagem.valor_diaria)} = <strong>{formatCurrency(selectedViagem.valor_total)}</strong></p>
                  </div>

                  {/* Timeline do workflow */}
                  <div className="space-y-2">
                    <Label>Status do Workflow</Label>
                    <Select value={workflowData.status} onValueChange={(v) => setWorkflowData(p => ({ ...p, status: v as WorkflowDirafStatus }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKFLOW_DIRAF_STATUS.map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número SEI - obrigatório para concluir */}
                  <div>
                    <Label className={workflowData.status === 'concluido' ? 'text-foreground font-semibold' : ''}>
                      Nº do Processo SEI {workflowData.status === 'concluido' && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      value={workflowData.numero_sei}
                      onChange={(e) => setWorkflowData(p => ({ ...p, numero_sei: e.target.value }))}
                      placeholder="Ex: 0001234-56.2026.8.00.0000"
                    />
                    {workflowData.status === 'concluido' && !workflowData.numero_sei && (
                      <p className="text-xs text-destructive mt-1">Obrigatório para concluir o workflow</p>
                    )}
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={workflowData.observacoes}
                      onChange={(e) => setWorkflowData(p => ({ ...p, observacoes: e.target.value }))}
                      placeholder="Informações adicionais sobre o processo..."
                    />
                  </div>

                  {/* Timestamps */}
                  {selectedViagem.workflow_diraf_solicitado_em && (
                    <p className="text-xs text-muted-foreground">
                      Solicitado em: {format(new Date(selectedViagem.workflow_diraf_solicitado_em), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {selectedViagem.workflow_diraf_concluido_em && (
                    <p className="text-xs text-muted-foreground">
                      Concluído em: {format(new Date(selectedViagem.workflow_diraf_concluido_em), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsWorkflowOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={salvarWorkflow}
                  disabled={atualizarWorkflow.isPending}
                >
                  {atualizarWorkflow.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModuleLayout>
  );
}
