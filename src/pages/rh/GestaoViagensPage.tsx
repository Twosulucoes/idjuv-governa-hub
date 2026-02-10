import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Plus, 
  Search, 
  Plane,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Viagem = {
  id: string;
  servidor_id: string;
  data_saida: string;
  data_retorno: string;
  destino_cidade: string;
  destino_uf: string;
  finalidade: string;
  portaria_numero?: string;
  quantidade_diarias?: number;
  valor_diaria?: number;
  valor_total?: number;
  status: string;
  relatorio_apresentado: boolean;
  tipo_onus?: string;
  numero_sei_diarias?: string;
  workflow_diraf_status?: string;
  workflow_diraf_solicitado_em?: string;
  workflow_diraf_concluido_em?: string;
  workflow_diraf_observacoes?: string;
  servidor?: {
    id: string;
    nome_completo: string;
  };
};

const STATUS_VIAGEM = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'autorizada', label: 'Autorizada' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

const WORKFLOW_DIRAF_STATUS = [
  { value: 'pendente', label: 'Pendente', color: 'bg-muted text-muted-foreground' },
  { value: 'solicitado', label: 'Solicitado à DIRAF', color: 'bg-warning/20 text-warning' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-info/20 text-info' },
  { value: 'concluido', label: 'Concluído', color: 'bg-success/20 text-success' },
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function GestaoViagensPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    servidor_id: '',
    data_saida: '',
    data_retorno: '',
    destino_cidade: '',
    destino_uf: '',
    finalidade: '',
    justificativa: '',
    portaria_numero: '',
    portaria_data: '',
    tipo_onus: 'com_onus',
    quantidade_diarias: '',
    valor_diaria: '',
    meio_transporte: '',
    observacoes: '',
  });

  const [workflowData, setWorkflowData] = useState({
    status: '',
    numero_sei: '',
    observacoes: '',
  });

  // Fetch viagens
  const { data: viagens = [], isLoading } = useQuery({
    queryKey: ["viagens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens_diarias")
        .select(`
          *,
          servidor:servidores!viagens_diarias_servidor_id_fkey(id, nome_completo)
        `)
        .order("data_saida", { ascending: false });
      if (error) throw error;
      return data as Viagem[];
    },
  });

  // Fetch servidores
  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const isSemOnus = data.tipo_onus === 'sem_onus';
      const valorTotal = isSemOnus ? 0 : (parseFloat(data.quantidade_diarias) * parseFloat(data.valor_diaria) || 0);
      
      const insertData: any = {
        servidor_id: data.servidor_id,
        data_saida: data.data_saida,
        data_retorno: data.data_retorno,
        destino_cidade: data.destino_cidade,
        destino_uf: data.destino_uf,
        finalidade: data.finalidade,
        justificativa: data.justificativa || null,
        portaria_numero: data.portaria_numero || null,
        portaria_data: data.portaria_data || null,
        tipo_onus: data.tipo_onus,
        quantidade_diarias: isSemOnus ? null : (parseFloat(data.quantidade_diarias) || null),
        valor_diaria: isSemOnus ? null : (parseFloat(data.valor_diaria) || null),
        valor_total: isSemOnus ? null : (valorTotal || null),
        meio_transporte: data.meio_transporte || null,
        observacoes: data.observacoes || null,
        status: 'solicitada',
        workflow_diraf_status: isSemOnus ? null : 'pendente',
      };

      const { error } = await supabase
        .from("viagens_diarias")
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      const isSemOnusLocal = formData.tipo_onus === 'sem_onus';
      toast.success(
        isSemOnusLocal
          ? "Viagem cadastrada (sem ônus - sem diárias)!" 
          : "Viagem cadastrada! Notificação enviada à DIRAF para abertura de processo."
      );
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("viagens_diarias")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Update workflow DIRAF mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof workflowData }) => {
      const updateData: any = {
        workflow_diraf_status: data.status,
        workflow_diraf_observacoes: data.observacoes || null,
      };
      if (data.numero_sei) {
        updateData.numero_sei_diarias = data.numero_sei;
      }
      if (data.status === 'solicitado') {
        updateData.workflow_diraf_solicitado_em = new Date().toISOString();
      }
      if (data.status === 'concluido') {
        updateData.workflow_diraf_concluido_em = new Date().toISOString();
        if (!data.numero_sei) {
          throw new Error("O número do processo SEI é obrigatório para concluir o workflow.");
        }
      }
      const { error } = await supabase
        .from("viagens_diarias")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      toast.success("Workflow DIRAF atualizado!");
      setIsWorkflowOpen(false);
      setSelectedViagem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar workflow");
    },
  });

  const resetForm = () => {
    setFormData({
      servidor_id: '',
      data_saida: '',
      data_retorno: '',
      destino_cidade: '',
      destino_uf: '',
      finalidade: '',
      justificativa: '',
      portaria_numero: '',
      portaria_data: '',
      tipo_onus: 'com_onus',
      quantidade_diarias: '',
      valor_diaria: '',
      meio_transporte: '',
      observacoes: '',
    });
    setSelectedViagem(null);
  };

  const handleSubmit = () => {
    if (!formData.servidor_id || !formData.data_saida || !formData.data_retorno || !formData.destino_cidade || !formData.destino_uf || !formData.finalidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleOpenWorkflow = (viagem: Viagem) => {
    setSelectedViagem(viagem);
    setWorkflowData({
      status: viagem.workflow_diraf_status || 'pendente',
      numero_sei: viagem.numero_sei_diarias || '',
      observacoes: viagem.workflow_diraf_observacoes || '',
    });
    setIsWorkflowOpen(true);
  };

  // Filtros
  const filteredViagens = viagens.filter((v) => {
    const matchesSearch = 
      v.servidor?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.destino_cidade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy");
  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-success/20 text-success';
      case 'em_andamento': return 'bg-warning/20 text-warning';
      case 'autorizada': return 'bg-info/20 text-info';
      case 'cancelada': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getWorkflowIcon = (status?: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'em_andamento': case 'solicitado': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isSemOnus = formData.tipo_onus === 'sem_onus';

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
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

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Viagem
            </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredViagens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma viagem encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredViagens.map((viagem) => (
                    <TableRow key={viagem.id}>
                      <TableCell>
                        <p className="font-medium">{viagem.servidor?.nome_completo || '-'}</p>
                      </TableCell>
                      <TableCell>
                        {viagem.destino_cidade}/{viagem.destino_uf}
                      </TableCell>
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
                            <span className="ml-1">
                              {WORKFLOW_DIRAF_STATUS.find(w => w.value === viagem.workflow_diraf_status)?.label || 'Pendente'}
                            </span>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={viagem.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ id: viagem.id, status: v })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <Badge className={getStatusColor(viagem.status)}>
                              {STATUS_VIAGEM.find(s => s.value === viagem.status)?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_VIAGEM.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Form Dialog - Nova Viagem */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Nova Viagem
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Servidor *</Label>
                  <Select value={formData.servidor_id} onValueChange={(v) => setFormData(p => ({ ...p, servidor_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o servidor" />
                    </SelectTrigger>
                    <SelectContent>
                      {servidores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Saída *</Label>
                    <Input
                      type="date"
                      value={formData.data_saida}
                      onChange={(e) => setFormData(p => ({ ...p, data_saida: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Data de Retorno *</Label>
                    <Input
                      type="date"
                      value={formData.data_retorno}
                      onChange={(e) => setFormData(p => ({ ...p, data_retorno: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Cidade *</Label>
                    <Input
                      value={formData.destino_cidade}
                      onChange={(e) => setFormData(p => ({ ...p, destino_cidade: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>UF *</Label>
                    <Select value={formData.destino_uf} onValueChange={(v) => setFormData(p => ({ ...p, destino_uf: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Finalidade *</Label>
                  <Textarea
                    value={formData.finalidade}
                    onChange={(e) => setFormData(p => ({ ...p, finalidade: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número da Portaria</Label>
                    <Input
                      value={formData.portaria_numero}
                      onChange={(e) => setFormData(p => ({ ...p, portaria_numero: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Data da Portaria</Label>
                    <Input
                      type="date"
                      value={formData.portaria_data}
                      onChange={(e) => setFormData(p => ({ ...p, portaria_data: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Tipo de Ônus */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <Label className="text-base font-semibold mb-3 block">Tipo de Ônus *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, tipo_onus: 'sem_onus', quantidade_diarias: '', valor_diaria: '' }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSemOnus 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <p className="font-semibold text-foreground">Sem Ônus</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Não gera diárias nem custos financeiros
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, tipo_onus: 'com_onus' }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        !isSemOnus 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <p className="font-semibold text-foreground">Com Ônus</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gera diárias — processo DIRAF obrigatório
                      </p>
                    </button>
                  </div>
                </div>

                {/* Alerta COM ÔNUS */}
                {!isSemOnus && (
                  <Alert className="border-warning/50 bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertTitle className="text-warning">Viagem com Ônus</AlertTitle>
                    <AlertDescription className="text-sm">
                      Ao cadastrar, será enviada notificação automática à <strong>DIRAF</strong> para abertura 
                      de processo SEI de pagamento de diárias. O número do SEI será vinculado a esta viagem ao ser informado.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Diárias - só aparece COM ÔNUS */}
                {!isSemOnus && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantidade de Diárias</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.quantidade_diarias}
                        onChange={(e) => setFormData(p => ({ ...p, quantidade_diarias: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Valor da Diária (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_diaria}
                        onChange={(e) => setFormData(p => ({ ...p, valor_diaria: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Meio de Transporte</Label>
                  <Input
                    value={formData.meio_transporte}
                    onChange={(e) => setFormData(p => ({ ...p, meio_transporte: e.target.value }))}
                    placeholder="Ex: Aéreo, Terrestre, Veículo oficial..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                    <p><strong>Destino:</strong> {selectedViagem.destino_cidade}/{selectedViagem.destino_uf}</p>
                    <p><strong>Período:</strong> {formatDate(selectedViagem.data_saida)} a {formatDate(selectedViagem.data_retorno)}</p>
                    <p><strong>Diárias:</strong> {selectedViagem.quantidade_diarias || '-'} × {formatCurrency(selectedViagem.valor_diaria)} = <strong>{formatCurrency(selectedViagem.valor_total)}</strong></p>
                  </div>

                  {/* Timeline do workflow */}
                  <div className="space-y-2">
                    <Label>Status do Workflow</Label>
                    <Select value={workflowData.status} onValueChange={(v) => setWorkflowData(p => ({ ...p, status: v }))}>
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
                  onClick={() => selectedViagem && updateWorkflowMutation.mutate({ id: selectedViagem.id, data: workflowData })}
                  disabled={updateWorkflowMutation.isPending}
                >
                  {updateWorkflowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
