// ============================================
// COMPONENTE DE LISTA/CRUD DE PERFIS
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { usePerfis } from '@/hooks/usePerfis';
import type { Perfil } from '@/types/perfis';
import { NIVEL_PERFIL_LABELS, NIVEL_PERFIL_CORES } from '@/types/perfis';
import { 
  Shield, 
  Plus, 
  Pencil, 
  Trash2, 
  Lock,
  ChevronRight,
  Users
} from 'lucide-react';

interface PerfilFormData {
  nome: string;
  descricao: string;
  nivel: 'sistema' | 'organizacional' | 'operacional';
  nivel_hierarquia: number;
  perfil_pai_id: string | null;
  ativo: boolean;
  cor: string;
  icone: string;
}

const initialFormData: PerfilFormData = {
  nome: '',
  descricao: '',
  nivel: 'operacional',
  nivel_hierarquia: 10,
  perfil_pai_id: null,
  ativo: true,
  cor: '#6b7280',
  icone: 'Shield'
};

interface GestaoPerfilListaProps {
  onPerfilSelect?: (perfil: Perfil) => void;
  selectedPerfilId?: string;
}

export function GestaoPerfilLista({ onPerfilSelect, selectedPerfilId }: GestaoPerfilListaProps) {
  const { perfis, loading, criarPerfil, atualizarPerfil, excluirPerfil, construirArvore } = usePerfis();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [perfilToDelete, setPerfilToDelete] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState<PerfilFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingPerfil(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (perfil: Perfil) => {
    setEditingPerfil(perfil);
    setFormData({
      nome: perfil.nome,
      descricao: perfil.descricao || '',
      nivel: perfil.nivel,
      nivel_hierarquia: perfil.nivel_hierarquia,
      perfil_pai_id: perfil.perfil_pai_id,
      ativo: perfil.ativo,
      cor: perfil.cor || '#6b7280',
      icone: perfil.icone || 'Shield'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingPerfil) {
        await atualizarPerfil(editingPerfil.id, formData);
      } else {
        await criarPerfil({
          ...formData,
          is_sistema: false
        });
      }
      setDialogOpen(false);
    } catch (err) {
      // Error handled by hook
    } finally {
      setSaving(false);
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

  const renderPerfilCard = (perfil: Perfil, depth: number = 0) => {
    const isSelected = selectedPerfilId === perfil.id;
    const filhos = perfis.filter(p => p.perfil_pai_id === perfil.id);

    return (
      <div key={perfil.id} style={{ marginLeft: depth * 16 }}>
        <Card 
          className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
            isSelected ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onPerfilSelect?.(perfil)}
        >
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {depth > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: perfil.cor || '#6b7280' }}
                />
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {perfil.nome}
                    {perfil.is_sistema && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {perfil.descricao || 'Sem descrição'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={NIVEL_PERFIL_CORES[perfil.nivel]} variant="secondary">
                  {NIVEL_PERFIL_LABELS[perfil.nivel]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Nível {perfil.nivel_hierarquia}
                </Badge>
                {!perfil.is_sistema && (
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(perfil); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setPerfilToDelete(perfil);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
        {filhos.map(filho => renderPerfilCard(filho, depth + 1))}
      </div>
    );
  };

  const arvore = construirArvore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Perfis do Sistema</h3>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-1">
          {arvore.map(perfil => renderPerfilCard(perfil, 0))}
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
                ? 'Atualize as informações do perfil'
                : 'Crie um novo perfil de acesso para o sistema'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
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
                    .filter(p => p.id !== editingPerfil?.id)
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

              <div className="flex items-center justify-between">
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default GestaoPerfilLista;
