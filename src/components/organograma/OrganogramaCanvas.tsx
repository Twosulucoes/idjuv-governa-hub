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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { UnidadeOrganizacional } from '@/types/organograma';
import UnidadeNode from './UnidadeNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  RefreshCw,
  LayoutGrid
} from 'lucide-react';

const nodeTypes = {
  unidade: UnidadeNode,
};

interface OrganogramaCanvasProps {
  unidades: UnidadeOrganizacional[];
  contarServidores: (unidadeId: string, incluirSub?: boolean) => number;
  onSelectUnidade: (unidade: UnidadeOrganizacional | null) => void;
  selectedUnidade?: UnidadeOrganizacional | null;
}

function OrganogramaCanvasInner({
  unidades,
  contarServidores,
  onSelectUnidade,
  selectedUnidade,
}: OrganogramaCanvasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  return (
    <div className="w-full h-[600px] bg-muted/20 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        {/* Painel de controles superior */}
        <Panel position="top-left" className="flex gap-2 p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-background"
            />
          </div>
        </Panel>

        <Panel position="top-right" className="flex gap-2 p-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <LayoutGrid className="h-4 w-4 mr-1" />
            Expandir
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Colapsar
          </Button>
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
  );
}

export default function OrganogramaCanvas(props: OrganogramaCanvasProps) {
  return (
    <ReactFlowProvider>
      <OrganogramaCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
