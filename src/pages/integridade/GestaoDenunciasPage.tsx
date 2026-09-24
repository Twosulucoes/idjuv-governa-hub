import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  MessageSquare,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAtualizarDenuncia, useDenuncias } from "@/hooks/useDenuncias";
import { labelTipoDenuncia, type Denuncia, type StatusDenuncia } from "@/types/integridade";

function resumoDenuncia(descricao: string, tamanho = 90): string {
  if (descricao.length <= tamanho) return descricao;
  return `${descricao.slice(0, tamanho).trim()}…`;
}

const statusConfig: Record<StatusDenuncia, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Search },
  em_investigacao: { label: "Em Investigação", color: "bg-purple-100 text-purple-800 border-purple-200", icon: AlertTriangle },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  arquivada: { label: "Arquivada", color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle }
};

const GestaoDenunciasPage = () => {
  const { toast } = useToast();
  const { data: denuncias = [], isLoading, isError } = useDenuncias();
  const atualizarDenuncia = useAtualizarDenuncia();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<StatusDenuncia>("pendente");
  const [parecer, setParecer] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Calculate stats
  const stats = {
    total: denuncias.length,
    pendentes: denuncias.filter(d => d.status === "pendente").length,
    emAndamento: denuncias.filter(d => ["em_analise", "em_investigacao"].includes(d.status)).length,
    concluidas: denuncias.filter(d => d.status === "concluida").length,
    arquivadas: denuncias.filter(d => d.status === "arquivada").length
  };

  // Filter denuncias
  const filteredDenuncias = denuncias.filter(d => {
    const termo = searchTerm.toLowerCase();
    const matchesSearch = d.protocolo.toLowerCase().includes(termo) ||
                         d.descricao.toLowerCase().includes(termo) ||
                         labelTipoDenuncia(d.tipo).toLowerCase().includes(termo);
    const matchesStatus = statusFilter === "todos" || d.status === statusFilter;
    const matchesTipo = tipoFilter === "todos" || d.tipo === tipoFilter;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const tiposUnicos = [...new Set(denuncias.map(d => d.tipo))];

  const handleViewDetails = (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setNewStatus(denuncia.status);
    setParecer(denuncia.parecer || "");
    setResponsavel(denuncia.responsavel || "");
    setIsUpdateOpen(true);
  };

  const saveStatusUpdate = () => {
    if (!selectedDenuncia) return;

    atualizarDenuncia.mutate(
      { id: selectedDenuncia.id, status: newStatus, parecer, responsavel },
      {
        onSuccess: () => {
          setIsUpdateOpen(false);
          toast({
            title: "Status atualizado",
            description: `Denúncia ${selectedDenuncia.protocolo} atualizada com sucesso.`
          });
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar",
            description: error instanceof Error ? error.message : "Tente novamente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <ModuleLayout module="integridade">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestão de Denúncias</h1>
              <p className="text-muted-foreground mt-1">Acompanhamento e tratamento de denúncias recebidas</p>
            </div>
          </div>
        </div>

      {/* Stats Dashboard */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/5 to-background">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendentes}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/5 to-background">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.emAndamento}</p>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/5 to-background">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.concluidas}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-500/5 to-background">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.arquivadas}</p>
                  <p className="text-xs text-muted-foreground">Arquivadas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters and Table */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Lista de Denúncias
                  </CardTitle>
                  <CardDescription>Gerencie e acompanhe o status das denúncias</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por protocolo, resumo..."
                      className="pl-9 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="arquivada">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {tiposUnicos.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{labelTipoDenuncia(tipo)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Protocolo</TableHead>
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Resumo</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Anônima</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Carregando denúncias...
                        </TableCell>
                      </TableRow>
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-destructive">
                          Não foi possível carregar as denúncias. Verifique sua permissão de acesso.
                        </TableCell>
                      </TableRow>
                    ) : filteredDenuncias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma denúncia encontrada com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDenuncias.map((denuncia) => {
                        const StatusIcon = statusConfig[denuncia.status].icon;
                        return (
                          <TableRow key={denuncia.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-medium text-primary">
                              {denuncia.protocolo}
                            </TableCell>
                            <TableCell>{labelTipoDenuncia(denuncia.tipo)}</TableCell>
                            <TableCell className="max-w-xs truncate">{resumoDenuncia(denuncia.descricao)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(denuncia.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${statusConfig[denuncia.status].color} flex items-center gap-1 w-fit`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[denuncia.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {denuncia.anonima ? (
                                <Badge variant="secondary">Sim</Badge>
                              ) : (
                                <Badge variant="outline">Não</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewDetails(denuncia)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUpdateStatus(denuncia)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes da Denúncia
            </DialogTitle>
            <DialogDescription>
              Protocolo: {selectedDenuncia?.protocolo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDenuncia && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{labelTipoDenuncia(selectedDenuncia.tipo)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`${statusConfig[selectedDenuncia.status].color} mt-1`}
                  >
                    {statusConfig[selectedDenuncia.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Registro</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedDenuncia.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Denúncia Anônima</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedDenuncia.anonima ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              {!selectedDenuncia.anonima && (selectedDenuncia.nome_denunciante || selectedDenuncia.email_denunciante) && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  {selectedDenuncia.nome_denunciante && (
                    <div>
                      <p className="text-sm text-muted-foreground">Denunciante</p>
                      <p className="font-medium">{selectedDenuncia.nome_denunciante}</p>
                    </div>
                  )}
                  {selectedDenuncia.email_denunciante && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contato</p>
                      <p className="font-medium">{selectedDenuncia.email_denunciante}{selectedDenuncia.telefone_denunciante ? ` · ${selectedDenuncia.telefone_denunciante}` : ""}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição Detalhada</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedDenuncia.descricao}</p>
              </div>

              {selectedDenuncia.envolvidos && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Envolvidos</p>
                  <p className="font-medium">{selectedDenuncia.envolvidos}</p>
                </div>
              )}

              {selectedDenuncia.local_ocorrencia && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Localização</p>
                  <p className="font-medium">{selectedDenuncia.local_ocorrencia}</p>
                </div>
              )}

              {selectedDenuncia.data_ocorrencia && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data/Período da Ocorrência</p>
                  <p className="font-medium">{selectedDenuncia.data_ocorrencia}</p>
                </div>
              )}

              {selectedDenuncia.evidencias && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Evidências relatadas</p>
                  <p className="font-medium">{selectedDenuncia.evidencias}</p>
                </div>
              )}

              {selectedDenuncia.parecer && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Parecer</p>
                  <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    {selectedDenuncia.parecer}
                  </p>
                  {selectedDenuncia.responsavel && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Responsável: {selectedDenuncia.responsavel}
                    </p>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-4">
                Última atualização: {new Date(selectedDenuncia.updated_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>
              Atualize o status e adicione um parecer para a denúncia {selectedDenuncia?.protocolo}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Novo Status</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as StatusDenuncia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="arquivada">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Parecer / Observações</label>
              <Textarea
                placeholder="Adicione observações sobre o andamento ou conclusão..."
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Responsável pela apuração</label>
              <Input
                placeholder="Ex: Comissão de Ética, Ouvidoria..."
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveStatusUpdate} disabled={atualizarDenuncia.isPending}>
              {atualizarDenuncia.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ModuleLayout>
  );
};

export default GestaoDenunciasPage;
