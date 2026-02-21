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
    const ASSESSORIA_HORIZONTAL_OFFSET = 400; // Offset para assessorias ficarem ao lado

    // Separar Presidência, Assessorias (nível 1 coordenação) e demais unidades
    const presidencia = visibleUnidades.find(u => u.tipo === 'presidencia');
    const assessorias = visibleUnidades.filter(u => 
      u.nivel === 1 && 
      u.tipo === 'coordenacao' && 
      u.superior_id === presidencia?.id
    );
    const diretorias = visibleUnidades.filter(u => 
      u.nivel === 2 && 
      u.tipo === 'diretoria'
    );
    const demaisUnidades = visibleUnidades.filter(u => 
      u.tipo !== 'presidencia' && 
      !(u.nivel === 1 && u.tipo === 'coordenacao' && u.superior_id === presidencia?.id) &&
      u.nivel > 2
    );

    // Posicionar nós
    const newNodes: Node[] = [];
    const positions: Record<string, { x: number; y: number }> = {};

    // 1. Presidência no centro-topo
    if (presidencia) {
      const presX = 0;
      const presY = 0;
      positions[presidencia.id] = { x: presX, y: presY };
      
      const hasChildren = unidades.some(u => u.superior_id === presidencia.id);
      newNodes.push({
        id: presidencia.id,
        type: 'unidade',
        position: { x: presX, y: presY },
        data: {
          unidade: presidencia,
          servidoresCount: contarServidores(presidencia.id, false),
          isExpanded: expandedNodes.has(presidencia.id),
          hasChildren,
          onToggleExpand: toggleExpand,
          onSelect: onSelectUnidade,
        },
        selected: selectedUnidade?.id === presidencia.id,
      });
    }

    // 2. Assessorias ao lado direito da Presidência (Nível 1)
    if (assessorias.length > 0) {
      const assessoriaStartX = ASSESSORIA_HORIZONTAL_OFFSET;
      const assessoriaSpacing = 140; // Espaçamento vertical entre assessorias

      assessorias.forEach((assessoria, index) => {
        const x = assessoriaStartX;
        const y = -((assessorias.length - 1) * assessoriaSpacing / 2) + (index * assessoriaSpacing);
        
        positions[assessoria.id] = { x, y };
        
        const hasChildren = unidades.some(u => u.superior_id === assessoria.id);
        newNodes.push({
          id: assessoria.id,
          type: 'unidade',
          position: { x, y },
          data: {
            unidade: assessoria,
            servidoresCount: contarServidores(assessoria.id, false),
            isExpanded: expandedNodes.has(assessoria.id),
            hasChildren,
            onToggleExpand: toggleExpand,
            onSelect: onSelectUnidade,
          },
          selected: selectedUnidade?.id === assessoria.id,
        });
      });
    }

    // 3. Diretorias abaixo da Presidência (Nível 2)
    if (diretorias.length > 0) {
      const totalWidthDir = (diretorias.length - 1) * HORIZONTAL_SPACING;
      const startXDir = -totalWidthDir / 2;
      
      diretorias.forEach((diretoria, index) => {
        const x = startXDir + index * HORIZONTAL_SPACING;
        const y = VERTICAL_SPACING; // Uma linha abaixo da Presidência
        
        positions[diretoria.id] = { x, y };
        
        const hasChildren = unidades.some(u => u.superior_id === diretoria.id);
        newNodes.push({
          id: diretoria.id,
          type: 'unidade',
          position: { x, y },
          data: {
            unidade: diretoria,
            servidoresCount: contarServidores(diretoria.id, false),
            isExpanded: expandedNodes.has(diretoria.id),
            hasChildren,
            onToggleExpand: toggleExpand,
            onSelect: onSelectUnidade,
          },
          selected: selectedUnidade?.id === diretoria.id,
        });
      });
    }

    // 4. Demais unidades (níveis 3+) agrupadas por superior
    const niveisRestantes: Record<number, UnidadeOrganizacional[]> = {};
    demaisUnidades.forEach(u => {
      if (!niveisRestantes[u.nivel]) niveisRestantes[u.nivel] = [];
      niveisRestantes[u.nivel].push(u);
    });

    Object.keys(niveisRestantes).sort((a, b) => Number(a) - Number(b)).forEach((nivelStr) => {
      const nivel = Number(nivelStr);
      const unidadesNivel = niveisRestantes[nivel];
      
      // Agrupar por superior para melhor posicionamento
      const porSuperior: Record<string, UnidadeOrganizacional[]> = {};
      unidadesNivel.forEach(u => {
        if (u.superior_id) {
          if (!porSuperior[u.superior_id]) porSuperior[u.superior_id] = [];
          porSuperior[u.superior_id].push(u);
        }
      });

      Object.entries(porSuperior).forEach(([superiorId, filhos]) => {
        const superiorPos = positions[superiorId];
        if (!superiorPos) return;

        const totalWidth = (filhos.length - 1) * HORIZONTAL_SPACING;
        const startX = superiorPos.x - totalWidth / 2;

        filhos.forEach((unidade, index) => {
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
    });

    // Gerar arestas
    const newEdges: Edge[] = visibleUnidades
      .filter(u => u.superior_id && positions[u.superior_id])
      .map(u => {
        // Arestas para assessorias usam estilo diferente (horizontal)
        const isAssessoria = assessorias.some(a => a.id === u.id);
        
        return {
          id: `${u.superior_id}-${u.id}`,
          source: u.superior_id!,
          target: u.id,
          type: isAssessoria ? 'straight' : 'smoothstep',
          animated: false,
          style: { 
            stroke: isAssessoria ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))', 
            strokeWidth: 2,
            strokeDasharray: isAssessoria ? '5,5' : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isAssessoria ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))',
            width: 20,
            height: 20,
          },
        };
      });

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
                maxLength={100}
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
