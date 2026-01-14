import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  MapPin,
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  StopCircle,
} from "lucide-react";
import { format } from "date-fns";
import { DesignacaoForm } from "@/components/rh/DesignacaoForm";
import { 
  useDesignacoes, 
  useAprovarDesignacao, 
  useRejeitarDesignacao,
  useEncerrarDesignacao 
} from "@/hooks/useDesignacoes";
import { 
  STATUS_DESIGNACAO_LABELS, 
  STATUS_DESIGNACAO_COLORS,
  type StatusDesignacao 
} from "@/types/designacao";

export default function GestaoDesignacoesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isEncerrarOpen, setIsEncerrarOpen] = useState(false);
  const [selectedDesignacao, setSelectedDesignacao] = useState<any>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [dataEncerramento, setDataEncerramento] = useState(new Date().toISOString().split("T")[0]);

  const { data: designacoes = [], isLoading } = useDesignacoes();
  const aprovarMutation = useAprovarDesignacao();
  const rejeitarMutation = useRejeitarDesignacao();
  const encerrarMutation = useEncerrarDesignacao();

  // Fetch unidades para filtro
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-filtro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Filtrar designações
  const filteredDesignacoes = designacoes.filter((d) => {
    const matchesSearch = 
      d.servidor?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.servidor?.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.unidade_origem?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.unidade_destino?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || d.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalPendentes = designacoes.filter(d => d.status === "pendente").length;
  const totalAprovadas = designacoes.filter(d => d.status === "aprovada").length;
  const totalEncerradas = designacoes.filter(d => d.status === "encerrada").length;

  const handleAprovar = async (designacaoId: string) => {
    await aprovarMutation.mutateAsync(designacaoId);
  };

  const handleRejeitar = async () => {
    if (!selectedDesignacao || !motivoRejeicao) return;
    await rejeitarMutation.mutateAsync({ 
      designacaoId: selectedDesignacao.id, 
      motivo: motivoRejeicao 
    });
    setIsRejectOpen(false);
    setMotivoRejeicao("");
    setSelectedDesignacao(null);
  };

  const handleEncerrar = async () => {
    if (!selectedDesignacao) return;
    await encerrarMutation.mutateAsync({ 
      designacaoId: selectedDesignacao.id, 
      dataFim: dataEncerramento 
    });
    setIsEncerrarOpen(false);
    setSelectedDesignacao(null);
  };

  const openRejectDialog = (designacao: any) => {
    setSelectedDesignacao(designacao);
    setMotivoRejeicao("");
    setIsRejectOpen(true);
  };

  const openEncerrarDialog = (designacao: any) => {
    setSelectedDesignacao(designacao);
    setDataEncerramento(new Date().toISOString().split("T")[0]);
    setIsEncerrarOpen(true);
  };

  const getStatusBadge = (status: StatusDesignacao) => {
    return (
      <Badge className={STATUS_DESIGNACAO_COLORS[status]}>
        {STATUS_DESIGNACAO_LABELS[status]}
      </Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Designações</h1>
                <p className="text-muted-foreground">
                  Gerencie designações temporárias de servidores para outras unidades
                </p>
              </div>
            </div>

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Designação
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("pendente")}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{totalPendentes}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("aprovada")}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas (Aprovadas)</p>
                  <p className="text-2xl font-bold">{totalAprovadas}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("encerrada")}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-muted rounded-lg">
                  <StopCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Encerradas</p>
                  <p className="text-2xl font-bold">{totalEncerradas}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por servidor ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovada">Aprovadas</SelectItem>
                <SelectItem value="rejeitada">Rejeitadas</SelectItem>
                <SelectItem value="encerrada">Encerradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Origem → Destino</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredDesignacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma designação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDesignacoes.map((designacao) => (
                    <TableRow key={designacao.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{designacao.servidor?.nome_completo || 'N/A'}</p>
                          {designacao.servidor?.matricula && (
                            <p className="text-sm text-muted-foreground">Mat: {designacao.servidor.matricula}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{designacao.unidade_origem?.sigla || designacao.unidade_origem?.nome}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-medium text-primary">
                              {designacao.unidade_destino?.sigla || designacao.unidade_destino?.nome}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(designacao.data_inicio), 'dd/MM/yyyy')}</span>
                          {designacao.data_fim && (
                            <>
                              <span className="text-muted-foreground">até</span>
                              <span>{format(new Date(designacao.data_fim), 'dd/MM/yyyy')}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(designacao.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {designacao.status === "pendente" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAprovar(designacao.id)}
                                disabled={aprovarMutation.isPending}
                                className="text-success hover:text-success hover:bg-success/10"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRejectDialog(designacao)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {designacao.status === "aprovada" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEncerrarDialog(designacao)}
                              className="text-muted-foreground"
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              Encerrar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Form Dialog */}
          <DesignacaoForm 
            open={isFormOpen} 
            onOpenChange={setIsFormOpen} 
          />

          {/* Reject Dialog */}
          <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejeitar Designação</DialogTitle>
                <DialogDescription>
                  Informe o motivo da rejeição da designação.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Motivo da Rejeição *</Label>
                  <Textarea
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    placeholder="Descreva o motivo da rejeição..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejeitar}
                  disabled={!motivoRejeicao || rejeitarMutation.isPending}
                >
                  Confirmar Rejeição
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Encerrar Dialog */}
          <Dialog open={isEncerrarOpen} onOpenChange={setIsEncerrarOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Encerrar Designação</DialogTitle>
                <DialogDescription>
                  Informe a data de encerramento da designação.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Data de Encerramento</Label>
                  <Input
                    type="date"
                    value={dataEncerramento}
                    onChange={(e) => setDataEncerramento(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEncerrarOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleEncerrar}
                  disabled={encerrarMutation.isPending}
                >
                  Confirmar Encerramento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
