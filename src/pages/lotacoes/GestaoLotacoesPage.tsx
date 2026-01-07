import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Users, 
  Building2, 
  Briefcase,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  FileOutput
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MemorandoLotacaoDialog } from "@/components/lotacoes/MemorandoLotacaoDialog";

type Lotacao = {
  id: string;
  servidor_id: string;
  unidade_id: string;
  cargo_id: string | null;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  tipo_movimentacao: string | null;
  documento_referencia: string | null;
  observacao: string | null;
  servidor?: {
    id: string;
    full_name: string;
    email: string;
  };
  unidade?: {
    id: string;
    nome: string;
    sigla: string | null;
  };
  cargo?: {
    id: string;
    nome: string;
    sigla: string | null;
  };
};

type LotacaoFormData = {
  servidor_id: string;
  unidade_id: string;
  cargo_id: string;
  data_inicio: string;
  data_fim: string;
  tipo_movimentacao: string;
  documento_referencia: string;
  observacao: string;
};

const TIPOS_MOVIMENTACAO = [
  { value: 'nomeacao', label: 'Nomeação' },
  { value: 'designacao', label: 'Designação' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'redistribuicao', label: 'Redistribuição' },
  { value: 'cessao', label: 'Cessão' },
  { value: 'remocao', label: 'Remoção' },
];

export default function GestaoLotacoesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMemorandoOpen, setIsMemorandoOpen] = useState(false);
  const [selectedLotacao, setSelectedLotacao] = useState<Lotacao | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [filterCargo, setFilterCargo] = useState<string>("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<LotacaoFormData>({
    servidor_id: '',
    unidade_id: '',
    cargo_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    tipo_movimentacao: '',
    documento_referencia: '',
    observacao: '',
  });

  // Fetch lotações
  const { data: lotacoes = [], isLoading } = useQuery({
    queryKey: ["lotacoes", showInactive],
    queryFn: async () => {
      let query = supabase
        .from("lotacoes")
        .select(`
          *,
          servidor:profiles!lotacoes_servidor_id_fkey(id, full_name, email),
          unidade:estrutura_organizacional!lotacoes_unidade_id_fkey(id, nome, sigla),
          cargo:cargos!lotacoes_cargo_id_fkey(id, nome, sigla)
        `)
        .order("data_inicio", { ascending: false });

      if (!showInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lotacao[];
    },
  });

  // Fetch servidores (profiles)
  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nivel")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch cargos
  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla, categoria")
        .eq("ativo", true)
        .order("nivel_hierarquico")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: LotacaoFormData) => {
      const { error } = await supabase.from("lotacoes").insert({
        servidor_id: data.servidor_id,
        unidade_id: data.unidade_id,
        cargo_id: data.cargo_id || null,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        tipo_movimentacao: data.tipo_movimentacao || null,
        documento_referencia: data.documento_referencia || null,
        observacao: data.observacao || null,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Lotação criada com sucesso!");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar lotação: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LotacaoFormData }) => {
      const { error } = await supabase
        .from("lotacoes")
        .update({
          servidor_id: data.servidor_id,
          unidade_id: data.unidade_id,
          cargo_id: data.cargo_id || null,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim || null,
          tipo_movimentacao: data.tipo_movimentacao || null,
          documento_referencia: data.documento_referencia || null,
          observacao: data.observacao || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Lotação atualizada com sucesso!");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar lotação: ${error.message}`);
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const updateData: any = { ativo };
      if (!ativo) {
        updateData.data_fim = new Date().toISOString().split('T')[0];
      }
      const { error } = await supabase
        .from("lotacoes")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success(ativo ? "Lotação reativada!" : "Lotação encerrada!");
      setIsDeleteOpen(false);
      setSelectedLotacao(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      servidor_id: '',
      unidade_id: '',
      cargo_id: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      tipo_movimentacao: '',
      documento_referencia: '',
      observacao: '',
    });
    setSelectedLotacao(null);
  };

  const handleEdit = (lotacao: Lotacao) => {
    setSelectedLotacao(lotacao);
    setFormData({
      servidor_id: lotacao.servidor_id,
      unidade_id: lotacao.unidade_id,
      cargo_id: lotacao.cargo_id || '',
      data_inicio: lotacao.data_inicio,
      data_fim: lotacao.data_fim || '',
      tipo_movimentacao: lotacao.tipo_movimentacao || '',
      documento_referencia: lotacao.documento_referencia || '',
      observacao: lotacao.observacao || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (lotacao: Lotacao) => {
    setSelectedLotacao(lotacao);
    setIsDeleteOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.servidor_id || !formData.unidade_id) {
      toast.error("Servidor e unidade são obrigatórios");
      return;
    }
    
    if (selectedLotacao) {
      updateMutation.mutate({ id: selectedLotacao.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Filtering
  const filteredLotacoes = lotacoes.filter((lot) => {
    const matchesSearch = 
      lot.servidor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.unidade?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.cargo?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnidade = filterUnidade === "all" || lot.unidade_id === filterUnidade;
    const matchesCargo = filterCargo === "all" || lot.cargo_id === filterCargo;
    
    return matchesSearch && matchesUnidade && matchesCargo;
  });

  // Stats
  const totalAtivas = lotacoes.filter(l => l.ativo).length;
  const totalServidores = new Set(lotacoes.filter(l => l.ativo).map(l => l.servidor_id)).size;
  const totalUnidades = new Set(lotacoes.filter(l => l.ativo).map(l => l.unidade_id)).size;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Lotações</h1>
                <p className="text-muted-foreground">
                  Vincule servidores às unidades e cargos
                </p>
              </div>
            </div>

            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Lotação
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lotações Ativas</p>
                  <p className="text-2xl font-bold">{totalAtivas}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Users className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Servidores Lotados</p>
                  <p className="text-2xl font-bold">{totalServidores}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidades com Servidores</p>
                  <p className="text-2xl font-bold">{totalUnidades}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por servidor, unidade ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full lg:w-[250px]">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.sigla || u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCargo} onValueChange={setFilterCargo}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {cargos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.sigla || c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showInactive ? "secondary" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? <UserCheck className="h-4 w-4 mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
              {showInactive ? "Mostrando encerradas" : "Mostrar encerradas"}
            </Button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Movimentação</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLotacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma lotação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLotacoes.map((lotacao) => (
                    <TableRow key={lotacao.id} className={!lotacao.ativo ? "opacity-60" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lotacao.servidor?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{lotacao.servidor?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{lotacao.unidade?.sigla || lotacao.unidade?.nome || 'N/A'}</p>
                            {lotacao.unidade?.sigla && (
                              <p className="text-xs text-muted-foreground">{lotacao.unidade?.nome}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lotacao.cargo ? (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{lotacao.cargo.sigla || lotacao.cargo.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(lotacao.data_inicio), 'dd/MM/yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lotacao.tipo_movimentacao ? (
                          <Badge variant="outline">
                            {TIPOS_MOVIMENTACAO.find(t => t.value === lotacao.tipo_movimentacao)?.label || lotacao.tipo_movimentacao}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={lotacao.ativo ? "default" : "secondary"}>
                          {lotacao.ativo ? "Ativa" : "Encerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {lotacao.ativo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedLotacao(lotacao);
                                setIsMemorandoOpen(true);
                              }}
                              title="Gerar Memorando"
                              className="text-primary hover:text-primary"
                            >
                              <FileOutput className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lotacao)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lotacao)}
                            title={lotacao.ativo ? "Encerrar" : "Reativar"}
                          >
                            {lotacao.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedLotacao ? "Editar Lotação" : "Nova Lotação"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servidor">Servidor *</Label>
                    <Select
                      value={formData.servidor_id}
                      onValueChange={(value) => setFormData({ ...formData, servidor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o servidor" />
                      </SelectTrigger>
                      <SelectContent>
                        {servidores.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name || s.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade *</Label>
                    <Select
                      value={formData.unidade_id}
                      onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Select
                      value={formData.cargo_id}
                      onValueChange={(value) => setFormData({ ...formData, cargo_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.sigla ? `${c.sigla} - ${c.nome}` : c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_movimentacao">Tipo de Movimentação</Label>
                    <Select
                      value={formData.tipo_movimentacao}
                      onValueChange={(value) => setFormData({ ...formData, tipo_movimentacao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_MOVIMENTACAO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Término</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento_referencia">Documento de Referência</Label>
                  <Input
                    id="documento_referencia"
                    placeholder="Ex: Portaria nº 001/2025"
                    value={formData.documento_referencia}
                    onChange={(e) => setFormData({ ...formData, documento_referencia: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacao">Observações</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Observações adicionais..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete/Toggle Confirmation */}
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedLotacao?.ativo ? "Encerrar lotação?" : "Reativar lotação?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedLotacao?.ativo
                    ? `A lotação de ${selectedLotacao?.servidor?.full_name} na unidade ${selectedLotacao?.unidade?.sigla || selectedLotacao?.unidade?.nome} será encerrada.`
                    : `A lotação de ${selectedLotacao?.servidor?.full_name} será reativada.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    selectedLotacao &&
                    toggleStatusMutation.mutate({
                      id: selectedLotacao.id,
                      ativo: !selectedLotacao.ativo,
                    })
                  }
                >
                  {selectedLotacao?.ativo ? "Encerrar" : "Reativar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Memorando Lotação Dialog */}
          <MemorandoLotacaoDialog
            open={isMemorandoOpen}
            onOpenChange={setIsMemorandoOpen}
            lotacao={selectedLotacao}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
