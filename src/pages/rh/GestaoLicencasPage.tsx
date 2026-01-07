import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  FileText,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Building2,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  TipoAfastamento,
  TipoLicenca,
  AFASTAMENTO_LABELS,
  LICENCA_LABELS,
} from '@/types/rh';

// Status labels and colors
const STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  encerrada: 'Encerrada',
  prorrogada: 'Prorrogada',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  ativa: 'bg-warning/20 text-warning border-warning/30',
  encerrada: 'bg-success/20 text-success border-success/30',
  prorrogada: 'bg-info/20 text-info border-info/30',
  cancelada: 'bg-destructive/20 text-destructive border-destructive/30',
};

interface LicencaFormData {
  servidor_id: string;
  tipo_afastamento: TipoAfastamento;
  tipo_licenca?: TipoLicenca | null;
  data_inicio: string;
  data_fim?: string;
  dias_afastamento?: number;
  portaria_numero?: string;
  portaria_data?: string;
  portaria_url?: string;
  documento_comprobatorio_url?: string;
  cid?: string;
  medico_nome?: string;
  crm?: string;
  orgao_destino?: string;
  onus_origem?: boolean;
  status?: string;
  fundamentacao_legal?: string;
  observacoes?: string;
}

const emptyFormData: LicencaFormData = {
  servidor_id: '',
  tipo_afastamento: 'licenca',
  tipo_licenca: null,
  data_inicio: '',
  data_fim: '',
  dias_afastamento: undefined,
  portaria_numero: '',
  portaria_data: '',
  portaria_url: '',
  documento_comprobatorio_url: '',
  cid: '',
  medico_nome: '',
  crm: '',
  orgao_destino: '',
  onus_origem: true,
  status: 'ativa',
  fundamentacao_legal: '',
  observacoes: '',
};

export default function GestaoLicencasPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLicenca, setSelectedLicenca] = useState<any>(null);
  const [formData, setFormData] = useState<LicencaFormData>(emptyFormData);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch licenças/afastamentos
  const { data: licencas = [], isLoading } = useQuery({
    queryKey: ['licencas-afastamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licencas_afastamentos')
        .select(`
          *,
          servidor:servidores(id, nome_completo, matricula, cpf, unidade_atual_id, cargo_atual_id,
            cargo:cargos(id, nome),
            unidade:estrutura_organizacional(id, nome, sigla)
          )
        `)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch servidores for select
  const { data: servidores = [] } = useQuery({
    queryKey: ['servidores-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servidores')
        .select('id, nome_completo, matricula, cpf')
        .eq('ativo', true)
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: LicencaFormData) => {
      const { error } = await supabase
        .from('licencas_afastamentos')
        .insert([{
          ...data,
          tipo_licenca: data.tipo_afastamento === 'licenca' ? data.tipo_licenca : null,
          dias_afastamento: data.data_fim && data.data_inicio 
            ? differenceInDays(parseISO(data.data_fim), parseISO(data.data_inicio)) + 1 
            : data.dias_afastamento,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licencas-afastamentos'] });
      toast.success('Licença/Afastamento registrado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar: ' + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LicencaFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('licencas_afastamentos')
        .update({
          ...updateData,
          tipo_licenca: updateData.tipo_afastamento === 'licenca' ? updateData.tipo_licenca : null,
          dias_afastamento: updateData.data_fim && updateData.data_inicio 
            ? differenceInDays(parseISO(updateData.data_fim), parseISO(updateData.data_inicio)) + 1 
            : updateData.dias_afastamento,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licencas-afastamentos'] });
      toast.success('Licença/Afastamento atualizado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('licencas_afastamentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licencas-afastamentos'] });
      toast.success('Registro excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedLicenca(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData(emptyFormData);
    setIsEditing(false);
    setSelectedLicenca(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (licenca: any) => {
    setFormData({
      servidor_id: licenca.servidor_id,
      tipo_afastamento: licenca.tipo_afastamento,
      tipo_licenca: licenca.tipo_licenca,
      data_inicio: licenca.data_inicio,
      data_fim: licenca.data_fim || '',
      dias_afastamento: licenca.dias_afastamento,
      portaria_numero: licenca.portaria_numero || '',
      portaria_data: licenca.portaria_data || '',
      portaria_url: licenca.portaria_url || '',
      documento_comprobatorio_url: licenca.documento_comprobatorio_url || '',
      cid: licenca.cid || '',
      medico_nome: licenca.medico_nome || '',
      crm: licenca.crm || '',
      orgao_destino: licenca.orgao_destino || '',
      onus_origem: licenca.onus_origem ?? true,
      status: licenca.status || 'ativa',
      fundamentacao_legal: licenca.fundamentacao_legal || '',
      observacoes: licenca.observacoes || '',
    });
    setSelectedLicenca(licenca);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleOpenView = (licenca: any) => {
    setSelectedLicenca(licenca);
    setIsViewDialogOpen(true);
  };

  const handleOpenDelete = (licenca: any) => {
    setSelectedLicenca(licenca);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.servidor_id || !formData.tipo_afastamento || !formData.data_inicio) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (isEditing && selectedLicenca) {
      updateMutation.mutate({ ...formData, id: selectedLicenca.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter licenças
  const filteredLicencas = licencas.filter((licenca: any) => {
    const matchesSearch = searchTerm === '' || 
      licenca.servidor?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      licenca.servidor?.cpf?.includes(searchTerm) ||
      licenca.portaria_numero?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || licenca.status === statusFilter;
    const matchesTipo = tipoFilter === 'all' || licenca.tipo_afastamento === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Calculate days automatically
  const calculateDays = (inicio: string, fim: string) => {
    if (inicio && fim) {
      return differenceInDays(parseISO(fim), parseISO(inicio)) + 1;
    }
    return 0;
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <AdminLayout>
        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/rh/servidores')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Gestão de Licenças e Afastamentos
                </h1>
                <p className="text-muted-foreground">
                  Controle de licenças, afastamentos e cessões de servidores
                </p>
              </div>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Licença/Afastamento
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold">
                      {licencas.filter((l: any) => l.status === 'ativa').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Encerrados</p>
                    <p className="text-2xl font-bold">
                      {licencas.filter((l: any) => l.status === 'encerrada').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-info/10">
                    <AlertTriangle className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Licenças</p>
                    <p className="text-2xl font-bold">
                      {licencas.filter((l: any) => l.tipo_afastamento === 'licenca').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cessões</p>
                    <p className="text-2xl font-bold">
                      {licencas.filter((l: any) => l.tipo_afastamento === 'cessao').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CPF ou portaria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {Object.entries(AFASTAMENTO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Portaria</TableHead>
                    <TableHead>Status</TableHead>
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
                  ) : filteredLicencas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLicencas.map((licenca: any) => (
                      <TableRow key={licenca.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{licenca.servidor?.nome_completo}</p>
                            <p className="text-sm text-muted-foreground">
                              {licenca.servidor?.cargo?.nome}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {AFASTAMENTO_LABELS[licenca.tipo_afastamento as TipoAfastamento]}
                            </p>
                            {licenca.tipo_licenca && (
                              <p className="text-sm text-muted-foreground">
                                {LICENCA_LABELS[licenca.tipo_licenca as TipoLicenca]}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(parseISO(licenca.data_inicio), 'dd/MM/yyyy')}</p>
                            {licenca.data_fim && (
                              <p className="text-muted-foreground">
                                até {format(parseISO(licenca.data_fim), 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {licenca.dias_afastamento || '-'}
                        </TableCell>
                        <TableCell>
                          {licenca.portaria_numero ? (
                            <span className="text-sm">
                              {licenca.portaria_numero}
                              {licenca.portaria_data && (
                                <span className="text-muted-foreground">
                                  {' '}({format(parseISO(licenca.portaria_data), 'dd/MM/yyyy')})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={STATUS_COLORS[licenca.status || 'ativa']}
                          >
                            {STATUS_LABELS[licenca.status || 'ativa']}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenView(licenca)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(licenca)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(licenca)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Editar' : 'Nova'} Licença/Afastamento
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do registro de licença ou afastamento
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                  <TabsTrigger value="medico">Dados Médicos</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="servidor_id">Servidor *</Label>
                      <Select
                        value={formData.servidor_id}
                        onValueChange={(value) => setFormData({ ...formData, servidor_id: value })}
                        disabled={isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o servidor" />
                        </SelectTrigger>
                        <SelectContent>
                          {servidores.map((servidor: any) => (
                            <SelectItem key={servidor.id} value={servidor.id}>
                              {servidor.nome_completo} - {servidor.cpf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo_afastamento">Tipo de Afastamento *</Label>
                      <Select
                        value={formData.tipo_afastamento}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          tipo_afastamento: value as TipoAfastamento,
                          tipo_licenca: value === 'licenca' ? formData.tipo_licenca : null
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AFASTAMENTO_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.tipo_afastamento === 'licenca' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tipo_licenca">Tipo de Licença</Label>
                        <Select
                          value={formData.tipo_licenca || ''}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            tipo_licenca: value as TipoLicenca 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de licença" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LICENCA_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.tipo_afastamento === 'cessao' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="orgao_destino">Órgão de Destino</Label>
                          <Input
                            id="orgao_destino"
                            value={formData.orgao_destino}
                            onChange={(e) => setFormData({ ...formData, orgao_destino: e.target.value })}
                            placeholder="Nome do órgão"
                          />
                        </div>
                        <div className="space-y-2 flex items-center gap-2 pt-6">
                          <Checkbox
                            id="onus_origem"
                            checked={formData.onus_origem}
                            onCheckedChange={(checked) => setFormData({ 
                              ...formData, 
                              onus_origem: checked as boolean 
                            })}
                          />
                          <Label htmlFor="onus_origem" className="cursor-pointer">
                            Ônus para o órgão de origem
                          </Label>
                        </div>
                      </>
                    )}

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

                    <div className="space-y-2">
                      <Label htmlFor="dias_afastamento">Dias de Afastamento</Label>
                      <Input
                        id="dias_afastamento"
                        type="number"
                        value={formData.data_fim && formData.data_inicio 
                          ? calculateDays(formData.data_inicio, formData.data_fim)
                          : formData.dias_afastamento || ''
                        }
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          dias_afastamento: parseInt(e.target.value) || undefined 
                        })}
                        disabled={!!(formData.data_inicio && formData.data_fim)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="fundamentacao_legal">Fundamentação Legal</Label>
                      <Input
                        id="fundamentacao_legal"
                        value={formData.fundamentacao_legal}
                        onChange={(e) => setFormData({ ...formData, fundamentacao_legal: e.target.value })}
                        placeholder="Ex: Art. 83 da Lei 8.112/90"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="portaria_numero">Número da Portaria</Label>
                      <Input
                        id="portaria_numero"
                        value={formData.portaria_numero}
                        onChange={(e) => setFormData({ ...formData, portaria_numero: e.target.value })}
                        placeholder="Ex: 123/2024"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portaria_data">Data da Portaria</Label>
                      <Input
                        id="portaria_data"
                        type="date"
                        value={formData.portaria_data}
                        onChange={(e) => setFormData({ ...formData, portaria_data: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="portaria_url">URL da Portaria (PDF)</Label>
                      <Input
                        id="portaria_url"
                        value={formData.portaria_url}
                        onChange={(e) => setFormData({ ...formData, portaria_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="documento_comprobatorio_url">Documento Comprobatório (URL)</Label>
                      <Input
                        id="documento_comprobatorio_url"
                        value={formData.documento_comprobatorio_url}
                        onChange={(e) => setFormData({ ...formData, documento_comprobatorio_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medico" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Preencha apenas para licenças médicas
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="medico_nome">Nome do Médico</Label>
                      <Input
                        id="medico_nome"
                        value={formData.medico_nome}
                        onChange={(e) => setFormData({ ...formData, medico_nome: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crm">CRM</Label>
                      <Input
                        id="crm"
                        value={formData.crm}
                        onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                        placeholder="00000-UF"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cid">CID (Código)</Label>
                      <Input
                        id="cid"
                        value={formData.cid}
                        onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                        placeholder="Ex: J11"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? 'Salvando...' 
                    : isEditing ? 'Salvar Alterações' : 'Registrar'
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Licença/Afastamento</DialogTitle>
              </DialogHeader>
              
              {selectedLicenca && (
                <div className="space-y-6">
                  {/* Servidor Info */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedLicenca.servidor?.nome_completo}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedLicenca.servidor?.cargo?.nome} - {selectedLicenca.servidor?.unidade?.sigla}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {AFASTAMENTO_LABELS[selectedLicenca.tipo_afastamento as TipoAfastamento]}
                      </p>
                    </div>
                    {selectedLicenca.tipo_licenca && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Licença</p>
                        <p className="font-medium">
                          {LICENCA_LABELS[selectedLicenca.tipo_licenca as TipoLicenca]}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Início</p>
                      <p className="font-medium">
                        {format(parseISO(selectedLicenca.data_inicio), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Término</p>
                      <p className="font-medium">
                        {selectedLicenca.data_fim 
                          ? format(parseISO(selectedLicenca.data_fim), 'dd/MM/yyyy')
                          : 'Indeterminado'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dias de Afastamento</p>
                      <p className="font-medium">{selectedLicenca.dias_afastamento || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge 
                        variant="outline" 
                        className={STATUS_COLORS[selectedLicenca.status || 'ativa']}
                      >
                        {STATUS_LABELS[selectedLicenca.status || 'ativa']}
                      </Badge>
                    </div>
                    {selectedLicenca.portaria_numero && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Portaria</p>
                          <p className="font-medium">{selectedLicenca.portaria_numero}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data da Portaria</p>
                          <p className="font-medium">
                            {selectedLicenca.portaria_data 
                              ? format(parseISO(selectedLicenca.portaria_data), 'dd/MM/yyyy')
                              : '-'
                            }
                          </p>
                        </div>
                      </>
                    )}
                    {selectedLicenca.orgao_destino && (
                      <div>
                        <p className="text-sm text-muted-foreground">Órgão de Destino</p>
                        <p className="font-medium">{selectedLicenca.orgao_destino}</p>
                      </div>
                    )}
                    {selectedLicenca.fundamentacao_legal && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Fundamentação Legal</p>
                        <p className="font-medium">{selectedLicenca.fundamentacao_legal}</p>
                      </div>
                    )}
                    {selectedLicenca.medico_nome && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Médico</p>
                          <p className="font-medium">{selectedLicenca.medico_nome}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CRM</p>
                          <p className="font-medium">{selectedLicenca.crm || '-'}</p>
                        </div>
                        {selectedLicenca.cid && (
                          <div>
                            <p className="text-sm text-muted-foreground">CID</p>
                            <p className="font-medium">{selectedLicenca.cid}</p>
                          </div>
                        )}
                      </>
                    )}
                    {selectedLicenca.observacoes && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Observações</p>
                        <p className="font-medium">{selectedLicenca.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este registro de licença/afastamento?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedLicenca && deleteMutation.mutate(selectedLicenca.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
