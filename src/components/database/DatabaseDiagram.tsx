import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TableInfo, RelationshipInfo, CATEGORY_COLORS } from '@/hooks/useDatabaseSchema';
import { TableNode } from './TableNode';

interface DatabaseDiagramProps {
  tables: TableInfo[];
  relationships: RelationshipInfo[];
  selectedCategory: string | null;
  onTableClick: (tableName: string) => void;
}

const nodeTypes = {
  tableNode: TableNode,
};

export function DatabaseDiagram({ 
  tables, 
  relationships, 
  selectedCategory,
  onTableClick 
}: DatabaseDiagramProps) {
  // Filtrar tabelas por categoria se selecionada
  const filteredTables = useMemo(() => {
    if (!selectedCategory) return tables;
    return tables.filter(t => t.category === selectedCategory);
  }, [tables, selectedCategory]);

  const filteredTableNames = new Set(filteredTables.map(t => t.name));

  // Criar nós para cada tabela
  const initialNodes: Node[] = useMemo(() => {
    const categoryGroups: Record<string, TableInfo[]> = {};
    
    filteredTables.forEach(table => {
      if (!categoryGroups[table.category]) {
        categoryGroups[table.category] = [];
      }
      categoryGroups[table.category].push(table);
    });

    const nodes: Node[] = [];
    let categoryY = 0;

    Object.entries(categoryGroups).forEach(([category, categoryTables]) => {
      const sortedTables = [...categoryTables].sort((a, b) => b.rowCount - a.rowCount);
      
      sortedTables.forEach((table, index) => {
        const x = (index % 4) * 280;
        const y = categoryY + Math.floor(index / 4) * 140;
        
        nodes.push({
          id: table.name,
          type: 'tableNode',
          position: { x, y },
          data: {
            label: table.name,
            rowCount: table.rowCount,
            category: table.category,
            columns: table.columns,
            color: CATEGORY_COLORS[table.category] || CATEGORY_COLORS['Outros'],
            onClick: () => onTableClick(table.name),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });

      categoryY += Math.ceil(categoryTables.length / 4) * 140 + 80;
    });

    return nodes;
  }, [filteredTables, onTableClick]);

  // Criar arestas para relacionamentos
  const initialEdges: Edge[] = useMemo(() => {
    return relationships
      .filter(rel => 
        filteredTableNames.has(rel.sourceTable) && 
        filteredTableNames.has(rel.targetTable)
      )
      .map((rel, index) => ({
        id: `${rel.sourceTable}-${rel.sourceColumn}-${rel.targetTable}-${index}`,
        source: rel.sourceTable,
        target: rel.targetTable,
        type: 'smoothstep',
        animated: rel.type === 'implicit',
        style: { 
          stroke: rel.exists ? '#94a3b8' : '#ef4444',
          strokeWidth: 1.5,
          opacity: 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: rel.exists ? '#94a3b8' : '#ef4444',
        },
        label: rel.sourceColumn.replace('_id', ''),
        labelStyle: { 
          fontSize: 10, 
          fill: '#64748b',
        },
        labelBgStyle: { 
          fill: 'hsl(var(--background))', 
          fillOpacity: 0.8,
        },
      }));
  }, [relationships, filteredTableNames]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Atualizar quando mudar as props
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onTableClick(node.id);
  }, [onTableClick]);

  return (
    <div className="h-[600px] w-full border rounded-lg bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className="bg-background border" />
        <MiniMap 
          nodeColor={(node) => node.data?.color || '#6b7280'}
          className="bg-background border"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
