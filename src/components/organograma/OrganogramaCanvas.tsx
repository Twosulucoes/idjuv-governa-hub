import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  MarkerType,
  ReactFlowProvider,
  Connection,
  addEdge,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { UnidadeOrganizacional } from '@/types/organograma';
import UnidadeNode from './UnidadeNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  RefreshCw,
  LayoutGrid,
  Link2,
  Link2Off,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const nodeTypes = {
  unidade: UnidadeNode,
};

interface OrganogramaCanvasProps {
  unidades: UnidadeOrganizacional[];
  contarServidores: (unidadeId: string, incluirSub?: boolean) => number;
  onSelectUnidade: (unidade: UnidadeOrganizacional | null) => void;
  selectedUnidade?: UnidadeOrganizacional | null;
  editMode?: boolean;
  onEditModeChange?: (editing: boolean) => void;
  onUpdateHierarchy?: (unidadeId: string, novoSuperiorId: string | null) => Promise<boolean>;
  onVerifyCycle?: (unidadeId: string, novoSuperiorId: string) => boolean;
}

function OrganogramaCanvasInner({
  unidades,
  contarServidores,
  onSelectUnidade,
  selectedUnidade,
  editMode = false,
  onEditModeChange,
  onUpdateHierarchy,
  onVerifyCycle,
}: OrganogramaCanvasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  // Inicializar todos os nós como expandidos
  useEffect(() => {
    const allIds = new Set(unidades.map(u => u.id));
    setExpandedNodes(allIds);
  }, [unidades]);

  // Toggle expansão
  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        // Colapsar: remover este e todos os descendentes
        const removeDescendants = (parentId: string) => {
          newSet.delete(parentId);
          unidades.filter(u => u.superior_id === parentId).forEach(child => {
            removeDescendants(child.id);
          });
        };
        removeDescendants(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, [unidades]);

  // Filtrar unidades visíveis
  const visibleUnidades = useMemo(() => {
    if (!searchTerm) {
      // Mostrar baseado na expansão
      return unidades.filter(u => {
        if (!u.superior_id) return true; // Raiz sempre visível
        // Verificar se todos os ancestrais estão expandidos
        let parent = unidades.find(p => p.id === u.superior_id);
        while (parent) {
          if (!expandedNodes.has(parent.id)) return false;
          parent = unidades.find(p => p.id === parent?.superior_id);
        }
        return true;
      });
    }
    
    // Filtrar por busca
    const searchLower = searchTerm.toLowerCase();
    return unidades.filter(u => 
      u.nome.toLowerCase().includes(searchLower) ||
      u.sigla?.toLowerCase().includes(searchLower) ||
      u.servidor_responsavel?.full_name?.toLowerCase().includes(searchLower)
    );
  }, [unidades, searchTerm, expandedNodes]);

  // Gerar nós e arestas
  useEffect(() => {
    const HORIZONTAL_SPACING = 320;
    const VERTICAL_SPACING = 180;

    // Agrupar por nível
    const niveis: Record<number, UnidadeOrganizacional[]> = {};
    visibleUnidades.forEach(u => {
      if (!niveis[u.nivel]) niveis[u.nivel] = [];
      niveis[u.nivel].push(u);
    });

    // Posicionar nós
    const newNodes: Node[] = [];
    const positions: Record<string, { x: number; y: number }> = {};

    Object.keys(niveis).sort((a, b) => Number(a) - Number(b)).forEach((nivelStr) => {
      const nivel = Number(nivelStr);
      const unidadesNivel = niveis[nivel];
      const totalWidth = (unidadesNivel.length - 1) * HORIZONTAL_SPACING;
      const startX = -totalWidth / 2;

      unidadesNivel.forEach((unidade, index) => {
        const x = startX + index * HORIZONTAL_SPACING;
        const y = (nivel - 1) * VERTICAL_SPACING;
        
        positions[unidade.id] = { x, y };
        
        const hasChildren = unidades.some(u => u.superior_id === unidade.id);
        
        newNodes.push({
          id: unidade.id,
          type: 'unidade',
          position: { x, y },
          data: {
            unidade,
            servidoresCount: contarServidores(unidade.id, false),
            isExpanded: expandedNodes.has(unidade.id),
            hasChildren,
            onToggleExpand: toggleExpand,
            onSelect: onSelectUnidade,
          },
          selected: selectedUnidade?.id === unidade.id,
        });
      });
    });

    // Gerar arestas
    const newEdges: Edge[] = visibleUnidades
      .filter(u => u.superior_id && positions[u.superior_id])
      .map(u => ({
        id: `${u.superior_id}-${u.id}`,
        source: u.superior_id!,
        target: u.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--muted-foreground))',
          width: 20,
          height: 20,
        },
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [visibleUnidades, expandedNodes, contarServidores, toggleExpand, onSelectUnidade, selectedUnidade, unidades, setNodes, setEdges]);

  // Expandir tudo
  const expandAll = () => {
    setExpandedNodes(new Set(unidades.map(u => u.id)));
  };

  // Colapsar tudo
  const collapseAll = () => {
    const roots = unidades.filter(u => !u.superior_id).map(u => u.id);
    setExpandedNodes(new Set(roots));
  };

  // Handler para conexão no modo edição
  const onConnect = useCallback((connection: Connection) => {
    if (!editMode || !connection.source || !connection.target) return;
    
    // target se tornará subordinado de source
    const sourceUnidade = unidades.find(u => u.id === connection.source);
    const targetUnidade = unidades.find(u => u.id === connection.target);
    
    if (!sourceUnidade || !targetUnidade) return;
    
    // Verificar se criaria ciclo
    if (onVerifyCycle && onVerifyCycle(connection.source, connection.target)) {
      toast({
        title: 'Conexão inválida',
        description: 'Esta conexão criaria um ciclo na hierarquia.',
        variant: 'destructive',
      });
      return;
    }
    
    // Abrir confirmação
    setPendingConnection({ 
      source: connection.source, 
      target: connection.target 
    });
  }, [editMode, unidades, onVerifyCycle, toast]);

  // Confirmar conexão
  const confirmConnection = async () => {
    if (!pendingConnection || !onUpdateHierarchy) return;
    
    const success = await onUpdateHierarchy(pendingConnection.target, pendingConnection.source);
    
    if (success) {
      toast({
        title: 'Hierarquia atualizada',
        description: 'A conexão foi salva com sucesso.',
      });
    }
    
    setPendingConnection(null);
  };

  // Handler para deletar aresta
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (!editMode) return;
    
    // Mostrar confirmação para remover conexão
    const targetUnidade = unidades.find(u => u.id === edge.target);
    if (targetUnidade) {
      setPendingConnection({ source: '', target: edge.target });
    }
  }, [editMode, unidades]);

  // Remover conexão (tornar raiz)
  const removeConnection = async () => {
    if (!pendingConnection || !onUpdateHierarchy) return;
    
    const success = await onUpdateHierarchy(pendingConnection.target, null);
    
    if (success) {
      toast({
        title: 'Conexão removida',
        description: 'A unidade agora é uma raiz.',
      });
    }
    
    setPendingConnection(null);
  };

  // Nome das unidades para o diálogo
  const sourceUnidade = pendingConnection?.source 
    ? unidades.find(u => u.id === pendingConnection.source) 
    : null;
  const targetUnidade = pendingConnection?.target 
    ? unidades.find(u => u.id === pendingConnection.target) 
    : null;

  return (
    <>
      <AlertDialog open={!!pendingConnection} onOpenChange={() => setPendingConnection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingConnection?.source ? 'Confirmar nova hierarquia' : 'Remover conexão'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConnection?.source ? (
                <>
                  Deseja que <strong>{targetUnidade?.nome}</strong> seja subordinada a{' '}
                  <strong>{sourceUnidade?.nome}</strong>?
                </>
              ) : (
                <>
                  Deseja remover a conexão de <strong>{targetUnidade?.nome}</strong>?
                  <br />
                  A unidade se tornará uma raiz independente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={pendingConnection?.source ? confirmConnection : removeConnection}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className={`w-full h-[600px] rounded-lg border ${editMode ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : 'bg-muted/20'}`}>
        <ReactFlow
          nodes={nodes.map(n => ({ 
            ...n, 
            data: { ...n.data, editMode } 
          }))}
          edges={edges.map(e => ({
            ...e,
            style: { 
              ...e.style, 
              stroke: editMode ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              strokeWidth: editMode ? 3 : 2,
              cursor: editMode ? 'pointer' : 'default',
            },
            animated: editMode,
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
          connectionLineStyle={{ stroke: 'hsl(var(--primary))', strokeWidth: 3 }}
          connectionMode={editMode ? 'loose' as any : 'strict' as any}
          edgesUpdatable={editMode}
          edgesFocusable={editMode}
          nodesDraggable={!editMode}
          nodesConnectable={editMode}
        >
          {/* Modo edição banner */}
          {editMode && (
            <Panel position="top-center" className="p-2">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                <Link2 className="h-4 w-4" />
                <span className="font-medium">Modo Edição de Ligações</span>
                <span className="text-primary-foreground/80 text-sm ml-2">
                  Arraste entre os pontos para conectar
                </span>
              </div>
            </Panel>
          )}

          {/* Painel de controles superior */}
          <Panel position="top-left" className="flex gap-2 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-background"
                disabled={editMode}
              />
            </div>
          </Panel>

          <Panel position="top-right" className="flex gap-2 p-2">
            {!editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={expandAll}>
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Expandir
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Colapsar
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => onEditModeChange?.(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Sair do Modo Edição
              </Button>
            )}
          </Panel>

          {/* Controles de zoom */}
          <Controls 
            showZoom
            showFitView
            showInteractive={false}
            className="bg-background border shadow-md"
          />

          {/* Minimapa */}
          <MiniMap 
            nodeColor={(node) => {
              const unidade = node.data?.unidade as UnidadeOrganizacional;
              if (!unidade) return '#888';
              switch (unidade.tipo) {
                case 'presidencia': return 'hsl(var(--primary))';
                case 'diretoria': return 'hsl(var(--secondary))';
                case 'departamento': return 'hsl(var(--accent))';
                default: return 'hsl(var(--muted-foreground))';
              }
            }}
            className="bg-background border"
            maskColor="rgba(0,0,0,0.1)"
          />

          {/* Background */}
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
    </>
  );
}

export default function OrganogramaCanvas(props: OrganogramaCanvasProps) {
  return (
    <ReactFlowProvider>
      <OrganogramaCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
