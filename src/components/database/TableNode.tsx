import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, CircleDot } from 'lucide-react';

interface TableNodeProps {
  data: {
    label: string;
    rowCount: number;
    category: string;
    color: string;
    onClick: () => void;
  };
}

export const TableNode = memo(function TableNode({ data }: TableNodeProps) {
  const isEmpty = data.rowCount === 0;
  
  return (
    <div
      className="px-3 py-2 rounded-lg border-2 bg-background shadow-md cursor-pointer transition-all hover:shadow-lg hover:scale-105 min-w-[180px]"
      style={{ borderColor: data.color }}
      onClick={data.onClick}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-muted-foreground !w-2 !h-2"
      />
      
      <div className="flex items-center gap-2 mb-1">
        <Database 
          className="h-4 w-4 flex-shrink-0" 
          style={{ color: data.color }} 
        />
        <span className="font-medium text-sm truncate flex-1">
          {data.label}
        </span>
        <CircleDot 
          className={`h-3 w-3 flex-shrink-0 ${isEmpty ? 'text-amber-500' : 'text-emerald-500'}`}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{data.category}</span>
        <span className={`font-mono ${isEmpty ? 'text-amber-500' : ''}`}>
          {data.rowCount.toLocaleString('pt-BR')} reg.
        </span>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-muted-foreground !w-2 !h-2"
      />
    </div>
  );
});
