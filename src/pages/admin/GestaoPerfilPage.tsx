// ============================================
// PÁGINA DE ADMINISTRAÇÃO DE PERFIS (NOVO RBAC)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useAdminPerfis } from '@/hooks/useAdminPerfis';
import { NIVEL_PERFIL_CORES, NIVEL_PERFIL_LABELS } from '@/types/rbac';
import type { Perfil } from '@/types/rbac';
import { 
  Shield, 
  Plus, 
  Pencil, 
  Trash2, 
  Lock,
  Key,
  Users,
  Info,
  Loader2,
  Search,
} from 'lucide-react';

interface PerfilFormData {
  nome: string;
  descricao: string;
  nivel: 'sistema' | 'organizacional' | 'operacional';
  nivel_hierarquia: number;
  perfil_pai_id: string | null;
  ativo: boolean;
  cor: string;
}

const initialFormData: PerfilFormData = {
  nome: '',
  descricao: '',
  nivel: 'operacional',
  nivel_hierarquia: 10,
  perfil_pai_id: null,
  ativo: true,
  cor: '#6b7280',
};

export default function GestaoPerfilPage() {
  const navigate = useNavigate();
  const { perfis, loading, saving, criarPerfil, atualizarPerfil, excluirPerfil } = useAdminPerfis();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [perfilToDelete, setPerfilToDelete] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState<PerfilFormData>(initialFormData);

  // Filtrar perfis
  const perfisFiltrados = perfis.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingPerfil(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (perfil: Perfil) => {
    if (perfil.is_sistema) return;
    setEditingPerfil(perfil);
    setFormData({
      nome: perfil.nome,
      descricao: perfil.descricao || '',
      nivel: perfil.nivel,
      nivel_hierarquia: perfil.nivel_hierarquia,
      perfil_pai_id: perfil.perfil_pai_id,
      ativo: perfil.ativo,
      cor: perfil.cor || '#6b7280',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPerfil) {
        await atualizarPerfil(editingPerfil.id, formData);
      } else {
        await criarPerfil(formData);
      }
      setDialogOpen(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!perfilToDelete) return;
    try {
      await excluirPerfil(perfilToDelete.id);
      setDeleteDialogOpen(false);
      setPerfilToDelete(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleGerenciarPermissoes = (perfil: Perfil) => {
    navigate(`/admin/perfis/${perfil.id}/permissoes`);
  };

  return (
    <AdminLayout 
      title="Administração de Perfis" 
      description="Gerencie os perfis institucionais de acesso ao sistema"
    >
      <div className="space-y-6">
        {/* Aviso institucional */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Perfis controlam permissões.</strong> Usuários herdam acesso ao sistema através dos perfis associados a eles.
            Permissões não podem ser atribuídas diretamente aos usuários.
          </AlertDescription>
        </Alert>

        {/* Header com busca e ação */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar perfil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Perfil
          </Button>
        </div>

        {/* Lista de perfis */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : perfisFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchTerm ? 'Nenhum perfil encontrado.' : 'Nenhum perfil cadastrado.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {perfisFiltrados.map((perfil) => (
              <Card 
                key={perfil.id} 
                className={`transition-all hover:shadow-md ${!perfil.ativo ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shrink-0" 
                        style={{ backgroundColor: perfil.cor || '#6b7280' }}
                      />
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {perfil.nome}
                          {perfil.is_sistema && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {perfil.descricao || 'Sem descrição'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={NIVEL_PERFIL_CORES[perfil.nivel]} variant="secondary">
                      {NIVEL_PERFIL_LABELS[perfil.nivel]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Nível {perfil.nivel_hierarquia}
                    </Badge>
                    {!perfil.ativo && (
                      <Badge variant="secondary" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGerenciarPermissoes(perfil)}
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Permissões
                    </Button>
                    {!perfil.is_sistema && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(perfil)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setPerfilToDelete(perfil);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingPerfil ? 'Editar Perfil' : 'Novo Perfil'}
              </DialogTitle>
              <DialogDescription>
                {editingPerfil 
                  ? 'Atualize as informações do perfil institucional'
                  : 'Crie um novo perfil de acesso para o sistema'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Perfil *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Coordenador de RH"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva as responsabilidades deste perfil..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nivel">Nível</Label>
                  <Select
                    value={formData.nivel}
                    onValueChange={(value: 'sistema' | 'organizacional' | 'operacional') => 
                      setFormData(prev => ({ ...prev, nivel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sistema">Sistema</SelectItem>
                      <SelectItem value="organizacional">Organizacional</SelectItem>
                      <SelectItem value="operacional">Operacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hierarquia">Hierarquia (1-100)</Label>
                  <Input
                    id="hierarquia"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.nivel_hierarquia}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      nivel_hierarquia: parseInt(e.target.value) || 10 
                    }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pai">Herda de (Perfil Pai)</Label>
                <Select
                  value={formData.perfil_pai_id || 'none'}
                  onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      perfil_pai_id: value === 'none' ? null : value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil pai (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Perfil raiz)</SelectItem>
                    {perfis
                      .filter(p => p.id !== editingPerfil?.id && p.ativo)
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="flex items-center justify-between pt-6">
                  <Label htmlFor="ativo">Ativo</Label>
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.nome}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o perfil "{perfilToDelete?.nome}"?
                Esta ação não pode ser desfeita e todas as permissões associadas serão removidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
