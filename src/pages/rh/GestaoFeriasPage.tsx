import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus, 
  Search,
  Calendar,
  Loader2,
  Sun
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Ferias = {
  id: string;
  servidor_id: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_inicio: string;
  data_fim: string;
  dias_gozados: number;
  abono_pecuniario: boolean;
  dias_abono?: number;
  parcela: number;
  total_parcelas: number;
  portaria_numero?: string;
  status: string;
  servidor?: {
    id: string;
    nome_completo: string;
  };
};

const STATUS_FERIAS = [
  { value: 'programada', label: 'Programada' },
  { value: 'em_gozo', label: 'Em Gozo' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'interrompida', label: 'Interrompida' },
  { value: 'cancelada', label: 'Cancelada' },
];

export default function GestaoFeriasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    servidor_id: '',
    periodo_aquisitivo_inicio: '',
    periodo_aquisitivo_fim: '',
    data_inicio: '',
    data_fim: '',
    dias_gozados: '30',
    abono_pecuniario: false,
    dias_abono: '',
    parcela: '1',
    total_parcelas: '1',
    portaria_numero: '',
  });

  // Fetch férias
  const { data: ferias = [], isLoading } = useQuery({
    queryKey: ["ferias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_servidor")
        .select(`
          *,
          servidor:servidores!ferias_servidor_servidor_id_fkey(id, nome_completo)
        `)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Ferias[];
    },
  });

  // Fetch servidores
  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores-ferias"],
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
      const { error } = await supabase.from("ferias_servidor").insert({
        servidor_id: data.servidor_id,
        periodo_aquisitivo_inicio: data.periodo_aquisitivo_inicio,
        periodo_aquisitivo_fim: data.periodo_aquisitivo_fim,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        dias_gozados: parseInt(data.dias_gozados),
        abono_pecuniario: data.abono_pecuniario,
        dias_abono: data.abono_pecuniario ? parseInt(data.dias_abono) : null,
        parcela: parseInt(data.parcela),
        total_parcelas: parseInt(data.total_parcelas),
        portaria_numero: data.portaria_numero || null,
        status: 'programada',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferias"] });
      toast.success("Férias cadastradas com sucesso!");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ferias_servidor")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferias"] });
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      servidor_id: '',
      periodo_aquisitivo_inicio: '',
      periodo_aquisitivo_fim: '',
      data_inicio: '',
      data_fim: '',
      dias_gozados: '30',
      abono_pecuniario: false,
      dias_abono: '',
      parcela: '1',
      total_parcelas: '1',
      portaria_numero: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.servidor_id || !formData.data_inicio || !formData.data_fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
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
    <ProtectedRoute allowedRoles={["admin"]}>
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

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar Férias
            </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredFerias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum registro de férias encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFerias.map((f) => (
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
                      <TableCell className="text-center">{f.parcela}/{f.total_parcelas}</TableCell>
                      <TableCell className="text-center">
                        {f.abono_pecuniario ? (
                          <Badge variant="secondary">{f.dias_abono} dias</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={f.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ id: f.id, status: v })}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge className={getStatusColor(f.status)}>
                              {STATUS_FERIAS.find(s => s.value === f.status)?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_FERIAS.map(s => (
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

          {/* Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-primary" />
                  Programar Férias
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
                    <Label>Início do Período Aquisitivo</Label>
                    <Input
                      type="date"
                      value={formData.periodo_aquisitivo_inicio}
                      onChange={(e) => setFormData(p => ({ ...p, periodo_aquisitivo_inicio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fim do Período Aquisitivo</Label>
                    <Input
                      type="date"
                      value={formData.periodo_aquisitivo_fim}
                      onChange={(e) => setFormData(p => ({ ...p, periodo_aquisitivo_fim: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Início do Gozo *</Label>
                    <Input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData(p => ({ ...p, data_inicio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fim do Gozo *</Label>
                    <Input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData(p => ({ ...p, data_fim: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Dias Gozados</Label>
                    <Input
                      type="number"
                      value={formData.dias_gozados}
                      onChange={(e) => setFormData(p => ({ ...p, dias_gozados: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Parcela</Label>
                    <Input
                      type="number"
                      value={formData.parcela}
                      onChange={(e) => setFormData(p => ({ ...p, parcela: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Total Parcelas</Label>
                    <Input
                      type="number"
                      value={formData.total_parcelas}
                      onChange={(e) => setFormData(p => ({ ...p, total_parcelas: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="abono"
                    checked={formData.abono_pecuniario}
                    onCheckedChange={(v) => setFormData(p => ({ ...p, abono_pecuniario: v as boolean }))}
                  />
                  <Label htmlFor="abono">Abono Pecuniário</Label>
                </div>

                {formData.abono_pecuniario && (
                  <div>
                    <Label>Dias de Abono</Label>
                    <Input
                      type="number"
                      value={formData.dias_abono}
                      onChange={(e) => setFormData(p => ({ ...p, dias_abono: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label>Número da Portaria</Label>
                  <Input
                    value={formData.portaria_numero}
                    onChange={(e) => setFormData(p => ({ ...p, portaria_numero: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
