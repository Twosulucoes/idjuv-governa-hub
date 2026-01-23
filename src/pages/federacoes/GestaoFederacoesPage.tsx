import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Instagram,
  MapPin,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';

import { CentralRelatoriosFederacoesDialog } from '@/components/federacoes/CentralRelatoriosFederacoesDialog';
import { EditarFederacaoDialog } from '@/components/federacoes/EditarFederacaoDialog';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface Federacao {
  id: string;
  nome: string;
  sigla: string;
  cnpj?: string | null;
  data_criacao: string;
  endereco: string;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  telefone: string;
  email: string;
  instagram: string | null;
  facebook?: string | null;
  mandato_inicio: string;
  mandato_fim: string;
  presidente_nome: string;
  presidente_nascimento: string;
  presidente_telefone: string;
  presidente_email: string;
  presidente_endereco: string | null;
  presidente_endereco_logradouro?: string | null;
  presidente_endereco_numero?: string | null;
  presidente_endereco_bairro?: string | null;
  presidente_instagram: string | null;
  presidente_facebook?: string | null;
  vice_presidente_nome: string;
  vice_presidente_telefone: string;
  vice_presidente_data_nascimento?: string | null;
  vice_presidente_instagram?: string | null;
  vice_presidente_facebook?: string | null;
  diretor_tecnico_nome: string;
  diretor_tecnico_telefone: string;
  diretor_tecnico_data_nascimento?: string | null;
  diretor_tecnico_instagram?: string | null;
  diretor_tecnico_facebook?: string | null;
  status: 'em_analise' | 'ativo' | 'inativo' | 'rejeitado';
  observacoes_internas: string | null;
  data_analise: string | null;
  created_at: string;
}

const statusConfig = {
  em_analise: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ativo: { label: 'Ativa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  inativo: { label: 'Inativa', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  rejeitado: { label: 'Rejeitada', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function GestaoFederacoesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedFederacao, setSelectedFederacao] = useState<Federacao | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; federacao: Federacao | null }>({
    open: false,
    action: '',
    federacao: null,
  });
  const [observacoes, setObservacoes] = useState('');
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFederacao, setEditingFederacao] = useState<Federacao | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFederacao, setDeletingFederacao] = useState<Federacao | null>(null);

  const { data: federacoes = [], isLoading } = useQuery({
    queryKey: ['federacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('federacoes_esportivas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Federacao[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: string; status: string; observacoes?: string }) => {
      const { error } = await supabase
        .from('federacoes_esportivas')
        .update({
          status,
          observacoes_internas: observacoes || null,
          data_analise: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federacoes'] });
      toast.success('Status atualizado com sucesso!');
      setConfirmDialog({ open: false, action: '', federacao: null });
      setObservacoes('');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('federacoes_esportivas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federacoes'] });
      toast.success('Federação excluída com sucesso!');
      setDeleteDialogOpen(false);
      setDeletingFederacao(null);
      setSheetOpen(false);
    },
    onError: () => {
      toast.error('Erro ao excluir federação');
    },
  });

  const filteredFederacoes = federacoes.filter((fed) => {
    const matchesSearch = 
      fed.nome.toLowerCase().includes(search.toLowerCase()) ||
      fed.sigla.toLowerCase().includes(search.toLowerCase()) ||
      fed.presidente_nome.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || fed.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: federacoes.length,
    emAnalise: federacoes.filter((f) => f.status === 'em_analise').length,
    ativas: federacoes.filter((f) => f.status === 'ativo').length,
    inativas: federacoes.filter((f) => f.status === 'inativo').length,
  };

  const handleViewDetails = (federacao: Federacao) => {
    setSelectedFederacao(federacao);
    setSheetOpen(true);
  };

  const handleStatusChange = (action: string, federacao: Federacao) => {
    setConfirmDialog({ open: true, action, federacao });
  };

  const confirmStatusChange = () => {
    if (!confirmDialog.federacao) return;
    
    updateStatusMutation.mutate({
      id: confirmDialog.federacao.id,
      status: confirmDialog.action,
      observacoes,
    });
  };

  const handleEdit = (federacao: Federacao) => {
    setEditingFederacao(federacao);
    setEditDialogOpen(true);
    setSheetOpen(false);
  };

  const handleDelete = (federacao: Federacao) => {
    setDeletingFederacao(federacao);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingFederacao) return;
    deleteMutation.mutate(deletingFederacao.id);
  };

  const formatCNPJ = (cnpj: string | null | undefined) => {
    if (!cnpj) return '-';
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length !== 14) return cnpj;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleaned}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Federações Esportivas</h1>
            <p className="text-muted-foreground">Gerencie as federações vinculadas ao IDJuv</p>
          </div>
          <Button onClick={() => setRelatoriosOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Central de Relatórios
          </Button>
        </div>

        {/* Central de Relatórios Dialog */}
        <CentralRelatoriosFederacoesDialog
          open={relatoriosOpen}
          onOpenChange={setRelatoriosOpen}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.emAnalise}</div>
              <div className="text-sm text-muted-foreground">Em Análise</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
              <div className="text-sm text-muted-foreground">Ativas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">{stats.inativas}</div>
              <div className="text-sm text-muted-foreground">Inativas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, sigla ou presidente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="ativo">Ativas</SelectItem>
              <SelectItem value="inativo">Inativas</SelectItem>
              <SelectItem value="rejeitado">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Federação</TableHead>
                  <TableHead className="hidden md:table-cell">Presidente</TableHead>
                  <TableHead className="hidden lg:table-cell">Mandato</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredFederacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma federação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFederacoes.map((fed) => {
                    const StatusIcon = statusConfig[fed.status].icon;
                    return (
                      <TableRow key={fed.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{fed.sigla}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {fed.nome}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">{fed.presidente_nome}</div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            {formatDate(fed.mandato_inicio)} - {formatDate(fed.mandato_fim)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[fed.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[fed.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(fed)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedFederacao && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedFederacao.sigla}
                  </SheetTitle>
                  <SheetDescription>{selectedFederacao.nome}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <Badge className={statusConfig[selectedFederacao.status].color}>
                      {statusConfig[selectedFederacao.status].label}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Cadastro: {formatDate(selectedFederacao.created_at)}
                    </div>
                  </div>

                  {/* Ações de Status */}
                  {selectedFederacao.status === 'em_analise' && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleStatusChange('ativo', selectedFederacao)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleStatusChange('rejeitado', selectedFederacao)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {selectedFederacao.status === 'ativo' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusChange('inativo', selectedFederacao)}
                    >
                      Inativar Federação
                    </Button>
                  )}

                  {selectedFederacao.status === 'inativo' && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange('ativo', selectedFederacao)}
                    >
                      Reativar Federação
                    </Button>
                  )}

                  {/* Botões de Edição e Exclusão */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(selectedFederacao)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar Dados
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedFederacao)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Dados da Federação */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Dados da Federação
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedFederacao.cnpj && (
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <span>CNPJ: {formatCNPJ(selectedFederacao.cnpj)}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>Criada em {formatDate(selectedFederacao.data_criacao)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{selectedFederacao.endereco}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={formatPhone(selectedFederacao.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedFederacao.telefone}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedFederacao.email}`} className="text-primary hover:underline">
                          {selectedFederacao.email}
                        </a>
                      </div>
                      {selectedFederacao.instagram && (
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedFederacao.instagram}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Mandato */}
                  <div>
                    <h4 className="font-semibold mb-3">Mandato Atual</h4>
                    <p className="text-sm">
                      {formatDate(selectedFederacao.mandato_inicio)} até {formatDate(selectedFederacao.mandato_fim)}
                    </p>
                  </div>

                  <Separator />

                  {/* Presidente */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Presidente
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium">{selectedFederacao.presidente_nome}</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Nascimento: {formatDate(selectedFederacao.presidente_nascimento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={formatPhone(selectedFederacao.presidente_telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedFederacao.presidente_telefone}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedFederacao.presidente_email}`} className="text-primary hover:underline">
                          {selectedFederacao.presidente_email}
                        </a>
                      </div>
                      {selectedFederacao.presidente_endereco && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <span>{selectedFederacao.presidente_endereco}</span>
                        </div>
                      )}
                      {selectedFederacao.presidente_instagram && (
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedFederacao.presidente_instagram}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Outros Dirigentes */}
                  <div>
                    <h4 className="font-semibold mb-3">Outros Dirigentes</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium">Vice-Presidente</div>
                        <div className="text-sm">{selectedFederacao.vice_presidente_nome}</div>
                        <a
                          href={formatPhone(selectedFederacao.vice_presidente_telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedFederacao.vice_presidente_telefone}
                        </a>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Diretor Técnico</div>
                        <div className="text-sm">{selectedFederacao.diretor_tecnico_nome}</div>
                        <a
                          href={formatPhone(selectedFederacao.diretor_tecnico_telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedFederacao.diretor_tecnico_telefone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {selectedFederacao.observacoes_internas && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Observações Internas</h4>
                        <p className="text-sm text-muted-foreground">{selectedFederacao.observacoes_internas}</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.action === 'ativo' && 'Aprovar Federação'}
                {confirmDialog.action === 'rejeitado' && 'Rejeitar Federação'}
                {confirmDialog.action === 'inativo' && 'Inativar Federação'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.action === 'ativo' && 
                  `Confirma a aprovação de ${confirmDialog.federacao?.sigla}? A federação será considerada ativa no sistema.`}
                {confirmDialog.action === 'rejeitado' && 
                  `Confirma a rejeição de ${confirmDialog.federacao?.sigla}?`}
                {confirmDialog.action === 'inativo' && 
                  `Confirma a inativação de ${confirmDialog.federacao?.sigla}?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4">
              <Textarea
                placeholder="Observações (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setObservacoes('')}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                className={confirmDialog.action === 'rejeitado' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirm Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Federação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a federação <strong>{deletingFederacao?.sigla}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <EditarFederacaoDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          federacao={editingFederacao}
        />
      </div>
    </AdminLayout>
  );
}
