import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ModuleLayout } from "@/components/layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganograma } from '@/hooks/useOrganograma';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  Search,
  Save,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Users
} from 'lucide-react';
import { LABELS_UNIDADE, TipoUnidade, UnidadeOrganizacional } from '@/types/organograma';

type FormData = {
  nome: string;
  sigla: string;
  tipo: TipoUnidade;
  superior_id: string;
  descricao: string;
  telefone: string;
  ramal: string;
  email: string;
  localizacao: string;
  lei_criacao_numero: string;
};

const initialFormData: FormData = {
  nome: '',
  sigla: '',
  tipo: 'departamento',
  superior_id: '',
  descricao: '',
  telefone: '',
  ramal: '',
  email: '',
  localizacao: '',
  lei_criacao_numero: '',
};

// Validação de email simples
const isValidEmail = (email: string) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function GestaoOrganogramaPage() {
  const { unidades, lotacoes, loading, refetch, contarServidores } = useOrganograma();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeOrganizacional | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UnidadeOrganizacional | null>(null);
  const { toast } = useToast();

  const filteredUnidades = unidades.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.sigla?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingUnidade(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (unidade: UnidadeOrganizacional) => {
    setEditingUnidade(unidade);
    setFormData({
      nome: unidade.nome,
      sigla: unidade.sigla || '',
      tipo: unidade.tipo,
      superior_id: unidade.superior_id || '',
      descricao: unidade.descricao || '',
      telefone: unidade.telefone || '',
      ramal: unidade.ramal || '',
      email: unidade.email || '',
      localizacao: unidade.localizacao || '',
      lei_criacao_numero: unidade.lei_criacao_numero || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const nome = formData.nome.trim();
    const sigla = formData.sigla.trim();
    const email = formData.email.trim();

    if (!nome || !formData.tipo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e tipo da unidade.',
        variant: 'destructive',
      });
      return;
    }

    if (email && !isValidEmail(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const superiorUnidade = unidades.find(u => u.id === formData.superior_id);
      const nivel = superiorUnidade ? superiorUnidade.nivel + 1 : 1;

      const dataToSave = {
        nome,
        sigla: sigla || null,
        tipo: formData.tipo as "presidencia" | "diretoria" | "departamento" | "setor" | "divisao" | "secao" | "coordenacao" | "assessoria" | "nucleo",
        nivel,
        superior_id: formData.superior_id || null,
        descricao: formData.descricao.trim() || null,
        telefone: formData.telefone.trim() || null,
        ramal: formData.ramal.trim() || null,
        email: email || null,
        localizacao: formData.localizacao.trim() || null,
        lei_criacao_numero: formData.lei_criacao_numero.trim() || null,
      };

      if (editingUnidade) {
        const { error } = await supabase
          .from('estrutura_organizacional')
          .update(dataToSave)
          .eq('id', editingUnidade.id);

        if (error) throw error;
        toast({ title: 'Unidade atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('estrutura_organizacional')
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: 'Unidade criada com sucesso!' });
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    // Verificar se tem subordinados
    const subordinados = unidades.filter(u => u.superior_id === deleteTarget.id);
    if (subordinados.length > 0) {
      toast({
        title: 'Não é possível desativar',
        description: `Esta unidade possui ${subordinados.length} unidade(s) subordinada(s). Remova-as primeiro.`,
        variant: 'destructive',
      });
      setDeleteTarget(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('estrutura_organizacional')
        .update({ ativo: false })
        .eq('id', deleteTarget.id);

      if (error) throw error;
      toast({ title: 'Unidade desativada com sucesso!' });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao desativar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Construir hierarquia para exibição em árvore
  const renderUnidadeTree = (parentId: string | null = null, level = 0): JSX.Element[] => {
    return filteredUnidades
      .filter(u => u.superior_id === parentId)
      .map(unidade => {
        const servidoresCount = contarServidores(unidade.id, false);
        return (
          <div key={unidade.id}>
            <div 
              className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg group"
              style={{ marginLeft: level * 24 }}
            >
              <div className="flex items-center gap-3">
                {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{unidade.nome}</span>
                    {unidade.sigla && (
                      <span className="text-xs font-mono text-muted-foreground">({unidade.sigla})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {LABELS_UNIDADE[unidade.tipo]}
                    </Badge>
                    {servidoresCount > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {servidoresCount}
                      </span>
                    )}
                    {unidade.servidor_responsavel && (
                      <span className="text-xs text-muted-foreground">
                        • {unidade.servidor_responsavel.full_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(unidade)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(unidade)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {renderUnidadeTree(unidade.id, level + 1)}
          </div>
        );
      });
  };

  return (
    <ModuleLayout module="governanca">
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/organograma" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Organograma
          </Link>
          <span>/</span>
          <span className="text-foreground">Gestão</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão do Organograma</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as unidades organizacionais do IDJUV
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{unidades.length}</p>
              <p className="text-xs text-muted-foreground">Total de Unidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{unidades.filter(u => u.tipo === 'diretoria').length}</p>
              <p className="text-xs text-muted-foreground">Diretorias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{unidades.filter(u => u.tipo === 'coordenacao').length}</p>
              <p className="text-xs text-muted-foreground">Coordenações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{lotacoes.length}</p>
              <p className="text-xs text-muted-foreground">Servidores Lotados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unidades" className="space-y-6">
          <TabsList>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
            <TabsTrigger value="cargos">Cargos</TabsTrigger>
          </TabsList>

          <TabsContent value="unidades">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Unidades Organizacionais</CardTitle>
                    <CardDescription>
                      {filteredUnidades.length} de {unidades.length} unidades
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar unidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      maxLength={100}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUnidades.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma unidade encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {renderUnidadeTree()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cargos">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Cargos</CardTitle>
                <CardDescription>
                  Acesse a página de gestão de cargos para gerenciar os cargos do IDJUV.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/cargos">
                    <Building2 className="h-4 w-4 mr-2" />
                    Gerenciar Cargos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUnidade ? 'Editar Unidade' : 'Nova Unidade Organizacional'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da unidade organizacional.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome da unidade"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla</Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData(prev => ({ ...prev, sigla: e.target.value.toUpperCase() }))}
                    placeholder="Ex: DIRAF"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as TipoUnidade }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LABELS_UNIDADE).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="superior">Unidade Superior</Label>
                  <Select
                    value={formData.superior_id || "__none__"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, superior_id: value === "__none__" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma (raiz)</SelectItem>
                      {unidades
                        .filter(u => u.id !== editingUnidade?.id)
                        .map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.sigla ? `${u.sigla} - ` : ''}{u.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição / Competências</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição das competências da unidade"
                  rows={3}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.descricao.length}/2000
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(95) 3621-0000"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ramal">Ramal</Label>
                  <Input
                    id="ramal"
                    value={formData.ramal}
                    onChange={(e) => setFormData(prev => ({ ...prev, ramal: e.target.value }))}
                    placeholder="1234"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="unidade@idjuv.rr.gov.br"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                    placeholder="Sala 101, Bloco A"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lei">Lei de Criação</Label>
                  <Input
                    id="lei"
                    value={formData.lei_criacao_numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, lei_criacao_numero: e.target.value }))}
                    placeholder="Lei nº 000/0000"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de exclusão */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Desativar Unidade
              </AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente desativar a unidade <strong>"{deleteTarget?.nome}"</strong>?
                {deleteTarget?.sigla && <> ({deleteTarget.sigla})</>}
                <br /><br />
                A unidade será marcada como inativa e não aparecerá mais no organograma.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleLayout>
  );
}
