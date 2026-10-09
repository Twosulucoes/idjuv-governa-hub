import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Loader2,
  Pencil,
  Sun,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useFerias,
  useServidoresParaFerias,
  useAtualizarStatusFerias,
  useExcluirFerias,
  SemPermissaoExcluirError,
} from "@/hooks/useFerias";
import { FeriasFormDialog } from "@/components/rh/ferias/FeriasFormDialog";
import { camposEditaveisPorStatus, podeExcluir, statusPermitidos } from "@/lib/feriasRegras";
import {
  FERIAS_STATUS_LABELS,
  type FeriasServidorComServidor,
  type StatusFeriasServidor,
} from "@/types/rh";

const STATUS_FERIAS = (Object.keys(FERIAS_STATUS_LABELS) as StatusFeriasServidor[]).map((value) => ({
  value,
  label: FERIAS_STATUS_LABELS[value],
}));

export default function GestaoFeriasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [feriasEmEdicao, setFeriasEmEdicao] = useState<FeriasServidorComServidor | null>(null);
  const [feriasParaExcluir, setFeriasParaExcluir] = useState<FeriasServidorComServidor | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { isSuperAdmin, hasPermission, hasAnyPermission } = useAuth();
  const podeCriar = isSuperAdmin || hasAnyPermission(["rh.ferias.criar", "rh.ferias.gerenciar"]);
  const podeEditar = isSuperAdmin || hasAnyPermission(["rh.ferias.editar", "rh.ferias.gerenciar"]);
  const isAdmin = isSuperAdmin || hasPermission("admin");

  const { data: ferias = [], isLoading } = useFerias();
  const { data: servidores = [] } = useServidoresParaFerias();
  const atualizarStatus = useAtualizarStatusFerias();
  const excluir = useExcluirFerias();

  const abrirNovo = () => {
    setFeriasEmEdicao(null);
    setIsFormOpen(true);
  };

  const abrirEdicao = (f: FeriasServidorComServidor) => {
    setFeriasEmEdicao(f);
    setIsFormOpen(true);
  };

  const mudarStatus = (f: FeriasServidorComServidor, status: StatusFeriasServidor) => {
    if (status === f.status) return;
    if (f.status === "em_gozo" && status === "cancelada") {
      toast.error("Férias em gozo não podem ser canceladas: registre como interrompida.");
      return;
    }
    atualizarStatus.mutate(
      { id: f.id, status },
      {
        onSuccess: () => toast.success("Status atualizado!"),
        onError: (error) => toast.error(`Erro: ${error.message}`),
      },
    );
  };

  const confirmarExclusao = () => {
    if (!feriasParaExcluir) return;
    excluir.mutate(
      { id: feriasParaExcluir.id, servidorId: feriasParaExcluir.servidor_id },
      {
        onSuccess: () => toast.success("Registro de férias excluído."),
        onError: (error) => {
          if (error instanceof SemPermissaoExcluirError) {
            toast.error("Sem permissão para excluir; cancele o registro.");
          } else {
            toast.error(`Erro ao excluir: ${error.message}`);
          }
        },
        onSettled: () => setFeriasParaExcluir(null),
      },
    );
  };

  const filteredFerias = ferias.filter((f) => {
    const matchesSearch = f.servidor?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-success/20 text-success';
      case 'em_gozo': return 'bg-warning/20 text-warning';
      case 'programada': return 'bg-info/20 text-info';
      case 'cancelada': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Stats
  const totalProgramadas = ferias.filter(f => f.status === 'programada').length;
  const totalEmGozo = ferias.filter(f => f.status === 'em_gozo').length;
  const totalConcluidas = ferias.filter(f => f.status === 'concluida').length;

  return (
    <ProtectedRoute requiredModule="rh">
      <ModuleLayout module="rh">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Sun className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Férias</h1>
                <p className="text-muted-foreground">
                  Controle de férias dos servidores
                </p>
              </div>
            </div>

            {podeCriar && (
              <Button onClick={abrirNovo}>
                <Plus className="h-4 w-4 mr-2" />
                Programar Férias
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Programadas</p>
                <p className="text-2xl font-bold">{totalProgramadas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Em Gozo</p>
                <p className="text-2xl font-bold">{totalEmGozo}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{totalConcluidas}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por servidor..."
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
                {STATUS_FERIAS.map(s => (
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
                  <TableHead>Período Aquisitivo</TableHead>
                  <TableHead>Período de Gozo</TableHead>
                  <TableHead className="text-center">Dias</TableHead>
                  <TableHead className="text-center">Parcela</TableHead>
                  <TableHead className="text-center">Abono</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredFerias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum registro de férias encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFerias.map((f) => {
                    const editavel = podeEditar && camposEditaveisPorStatus(f.status) !== "nenhum";
                    const excluivel = isAdmin && podeExcluir(f.status);
                    const permitidos = statusPermitidos(f.status);
                    return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <p className="font-medium">{f.servidor?.nome_completo || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(f.periodo_aquisitivo_inicio)} a {formatDate(f.periodo_aquisitivo_fim)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(f.data_inicio)} a {formatDate(f.data_fim)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{f.dias_gozados}</TableCell>
                      <TableCell className="text-center">{f.parcela ?? 1}/{f.total_parcelas ?? 1}</TableCell>
                      <TableCell className="text-center">
                        {f.abono_pecuniario ? (
                          <Badge variant="secondary">{f.dias_abono} dias</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={f.status}
                          onValueChange={(v) => mudarStatus(f, v as StatusFeriasServidor)}
                          disabled={!podeEditar}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge className={getStatusColor(f.status)}>
                              {FERIAS_STATUS_LABELS[f.status] ?? f.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_FERIAS.map(s => (
                              <SelectItem key={s.value} value={s.value} disabled={!permitidos.includes(s.value)}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={editavel ? "Editar" : "Edição não permitida neste status"}
                            disabled={!editavel}
                            onClick={() => abrirEdicao(f)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={excluivel ? "Excluir" : "Só férias programadas ou canceladas podem ser excluídas"}
                              disabled={!excluivel}
                              onClick={() => setFeriasParaExcluir(f)}
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
          <FeriasFormDialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setFeriasEmEdicao(null);
            }}
            servidores={servidores}
            ferias={feriasEmEdicao}
          />

          {/* Confirmação de exclusão */}
          <AlertDialog open={!!feriasParaExcluir} onOpenChange={(open) => !open && setFeriasParaExcluir(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir registro de férias?</AlertDialogTitle>
                <AlertDialogDescription>
                  {feriasParaExcluir && (
                    <>
                      Férias de <strong>{feriasParaExcluir.servidor?.nome_completo}</strong> de{" "}
                      {formatDate(feriasParaExcluir.data_inicio)} a {formatDate(feriasParaExcluir.data_fim)} serão
                      removidas definitivamente. Prefira cancelar o registro para manter o histórico.
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
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
