import { useState } from "react";
import { AdminLayout } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MoreVertical,
  Eye,
  Check,
  X,
  FileDown,
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { usePreCadastros } from "@/hooks/usePreCadastro";
import { gerarPdfMiniCurriculo } from "@/lib/pdfMiniCurriculo";
import { formatCPF } from "@/lib/formatters";
import type { PreCadastro, StatusPreCadastro } from "@/types/preCadastro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConversaoServidorDialog } from "@/components/curriculo/ConversaoServidorDialog";

const STATUS_CONFIG: Record<
  StatusPreCadastro,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  enviado: { label: "Enviado", variant: "default" },
  aprovado: { label: "Aprovado", variant: "outline" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
  convertido: { label: "Convertido", variant: "outline" },
};

export default function GestaoPreCadastrosPage() {
  const { preCadastros, isLoading, aprovar, rejeitar, converter, isConverting } = usePreCadastros();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusPreCadastro | "todos">("todos");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    data: PreCadastro | null;
  }>({ open: false, data: null });
  const [conversaoDialog, setConversaoDialog] = useState<{
    open: boolean;
    data: PreCadastro | null;
  }>({ open: false, data: null });

  const filteredData = preCadastros?.filter((p) => {
    const matchesSearch =
      p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf?.includes(searchTerm) ||
      p.codigo_acesso?.includes(searchTerm.toUpperCase());
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAprovar = async (id: string) => {
    await aprovar(id);
  };

  const handleRejeitar = async () => {
    if (rejectDialog.id) {
      await rejeitar({ id: rejectDialog.id, observacoes: rejectReason });
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
    }
  };

  const handleDownloadPdf = (data: PreCadastro) => {
    const doc = gerarPdfMiniCurriculo(data);
    doc.save(`pre-cadastro-${data.codigo_acesso}.pdf`);
  };

  const stats = {
    total: preCadastros?.length || 0,
    enviados: preCadastros?.filter((p) => p.status === "enviado").length || 0,
    aprovados: preCadastros?.filter((p) => p.status === "aprovado").length || 0,
    rejeitados: preCadastros?.filter((p) => p.status === "rejeitado").length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Pré-Cadastros</h1>
            <p className="text-muted-foreground">
              Gerencie os pré-cadastros de candidatos a servidor
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.enviados}</p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.aprovados}</p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejeitados}</p>
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(["todos", "enviado", "aprovado", "rejeitado", "rascunho"] as const).map(
                  (status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "todos" ? "Todos" : STATUS_CONFIG[status].label}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Envio</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum pré-cadastro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {p.codigo_acesso}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{p.nome_completo}</TableCell>
                      <TableCell>{formatCPF(p.cpf)}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[p.status as StatusPreCadastro].variant}>
                          {STATUS_CONFIG[p.status as StatusPreCadastro].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.data_envio
                          ? format(new Date(p.data_envio), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDetailDialog({ open: true, data: p })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(p)}>
                              <FileDown className="h-4 w-4 mr-2" />
                              Baixar PDF
                            </DropdownMenuItem>
                            {p.status === "enviado" && (
                              <>
                                <DropdownMenuItem onClick={() => handleAprovar(p.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setRejectDialog({ open: true, id: p.id })
                                  }
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {p.status === "aprovado" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConversaoDialog({ open: true, data: p })
                                }
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Converter em Servidor
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ open, id: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Pré-Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O candidato poderá ver esta observação.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, id: null })}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejeitar}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog({ open, data: null })}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pré-Cadastro</DialogTitle>
            <DialogDescription>
              Código: {detailDialog.data?.codigo_acesso}
            </DialogDescription>
          </DialogHeader>

          {detailDialog.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{detailDialog.data.nome_completo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{formatCPF(detailDialog.data.cpf)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-mail:</span>
                  <p className="font-medium">{detailDialog.data.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">
                    {detailDialog.data.telefone_celular || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Escolaridade:</span>
                  <p className="font-medium">
                    {detailDialog.data.escolaridade || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Formação:</span>
                  <p className="font-medium">
                    {detailDialog.data.formacao_academica || "-"}
                  </p>
                </div>
              </div>

              {detailDialog.data.habilidades &&
                detailDialog.data.habilidades.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Habilidades:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailDialog.data.habilidades.map((h) => (
                        <Badge key={h} variant="secondary" className="text-xs">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => detailDialog.data && handleDownloadPdf(detailDialog.data)}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Conversão */}
      <ConversaoServidorDialog
        open={conversaoDialog.open}
        onOpenChange={(open) => setConversaoDialog({ open, data: null })}
        preCadastro={conversaoDialog.data}
        onConverter={converter}
        isConverting={isConverting}
      />
    </AdminLayout>
  );
}
