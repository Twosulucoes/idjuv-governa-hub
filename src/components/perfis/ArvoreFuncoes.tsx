// ============================================
// COMPONENTE DE ÁRVORE DE FUNÇÕES DO SISTEMA
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFuncoesSistema } from '@/hooks/useFuncoesSistema';
import type { FuncaoSistema, FuncaoArvore } from '@/types/perfis';
import { MODULO_LABELS, TIPO_ACAO_LABELS } from '@/types/perfis';
import { 
  Key, 
  Plus, 
  Pencil, 
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Eye,
  PlusCircle,
  Edit,
  Trash,
  CheckCircle,
  Download
} from 'lucide-react';

const ICONES_ACAO: Record<string, React.ElementType> = {
  'visualizar': Eye,
  'criar': PlusCircle,
  'editar': Edit,
  'excluir': Trash,
  'aprovar': CheckCircle,
  'exportar': Download
};

interface FuncaoNodeProps {
  funcao: FuncaoArvore;
  depth: number;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onEdit?: (funcao: FuncaoSistema) => void;
  onDelete?: (funcao: FuncaoSistema) => void;
  selectable?: boolean;
}

function FuncaoNode({ 
  funcao, 
  depth, 
  selectedIds, 
  onToggleSelect, 
  onEdit,
  onDelete,
  selectable = false 
}: FuncaoNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = funcao.filhos.length > 0;
  const isSelected = selectedIds?.has(funcao.id);
  const IconeAcao = ICONES_ACAO[funcao.tipo_acao] || FileText;

  return (
    <div className="select-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div 
          className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors ${
            isSelected ? 'bg-primary/10' : ''
          }`}
          style={{ paddingLeft: depth * 16 + 8 }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-5" />
          )}

          {selectable && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(funcao.id)}
              className="mr-1"
            />
          )}

          {hasChildren ? (
            isOpen ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />
          ) : (
            <IconeAcao className="h-4 w-4 text-muted-foreground" />
          )}

          <span className="flex-1 text-sm">{funcao.nome}</span>

          <Badge variant="outline" className="text-[10px] h-5">
            {funcao.codigo}
          </Badge>

          {funcao.tipo_acao && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {TIPO_ACAO_LABELS[funcao.tipo_acao] || funcao.tipo_acao}
            </Badge>
          )}

          {!selectable && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onEdit?.(funcao); }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete?.(funcao); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {funcao.filhos.map(filho => (
              <FuncaoNode
                key={filho.id}
                funcao={filho}
                depth={depth + 1}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={selectable}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

interface ArvoreFuncoesProps {
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectable?: boolean;
  showActions?: boolean;
}

export function ArvoreFuncoes({ 
  selectedIds = new Set(), 
  onToggleSelect,
  selectable = false,
  showActions = true
}: ArvoreFuncoesProps) {
  const { funcoes, loading, agruparPorModulo, criarFuncao, atualizarFuncao, excluirFuncao, construirArvore } = useFuncoesSistema();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState<FuncaoSistema | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    modulo: 'rh',
    submodulo: '',
    tipo_acao: 'visualizar',
    funcao_pai_id: null as string | null,
    rota: '',
    icone: '',
    ordem: 0,
    ativo: true
  });

  const handleSave = async () => {
    try {
      if (editingFuncao) {
        await atualizarFuncao(editingFuncao.id, formData);
      } else {
        await criarFuncao(formData);
      }
      setDialogOpen(false);
      setEditingFuncao(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleEdit = (funcao: FuncaoSistema) => {
    setEditingFuncao(funcao);
    setFormData({
      codigo: funcao.codigo,
      nome: funcao.nome,
      descricao: funcao.descricao || '',
      modulo: funcao.modulo,
      submodulo: funcao.submodulo || '',
      tipo_acao: funcao.tipo_acao,
      funcao_pai_id: funcao.funcao_pai_id,
      rota: funcao.rota || '',
      icone: funcao.icone || '',
      ordem: funcao.ordem,
      ativo: funcao.ativo
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingFuncao(null);
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      modulo: 'rh',
      submodulo: '',
      tipo_acao: 'visualizar',
      funcao_pai_id: null,
      rota: '',
      icone: '',
      ordem: 0,
      ativo: true
    });
    setDialogOpen(true);
  };

  const gruposPorModulo = agruparPorModulo();
  const arvore = construirArvore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Funções do Sistema</h3>
        </div>
        {showActions && (
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Função
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              {Object.entries(gruposPorModulo).map(([modulo, funcoesModulo]) => (
                <Collapsible key={modulo} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-2 rounded-md hover:bg-accent/50 font-medium">
                    <ChevronDown className="h-4 w-4" />
                    <Folder className="h-4 w-4 text-primary" />
                    <span>{MODULO_LABELS[modulo] || modulo}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {funcoesModulo.reduce((acc, f) => acc + 1 + (f.filhos?.length || 0), 0)}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4">
                    {funcoesModulo.map(funcao => (
                      <FuncaoNode
                        key={funcao.id}
                        funcao={funcao}
                        depth={1}
                        selectedIds={selectedIds}
                        onToggleSelect={onToggleSelect}
                        onEdit={showActions ? handleEdit : undefined}
                        onDelete={showActions ? (f) => excluirFuncao(f.id) : undefined}
                        selectable={selectable}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criar/Editar Função */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFuncao ? 'Editar Função' : 'Nova Função'}
            </DialogTitle>
            <DialogDescription>
              {editingFuncao 
                ? 'Atualize as informações da função'
                : 'Cadastre uma nova função no sistema'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="rh.servidores.criar"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Criar Servidor"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Módulo</Label>
                <Select
                  value={formData.modulo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, modulo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODULO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Submódulo</Label>
                <Input
                  value={formData.submodulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, submodulo: e.target.value }))}
                  placeholder="servidores"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tipo de Ação</Label>
                <Select
                  value={formData.tipo_acao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_acao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_ACAO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Função Pai</Label>
              <Select
                value={formData.funcao_pai_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  funcao_pai_id: value === 'none' ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                  {funcoes
                    .filter(f => f.id !== editingFuncao?.id)
                    .map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.codigo} - {f.nome}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <Label>Ativo</Label>
                <Switch
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
            <Button onClick={handleSave} disabled={!formData.codigo || !formData.nome}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArvoreFuncoes;
