import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Building2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UnidadeOrganizacional, CORES_UNIDADE, LABELS_UNIDADE } from '@/types/organograma';
import { cn } from '@/lib/utils';

interface UnidadeNodeData {
  unidade: UnidadeOrganizacional;
  servidoresCount: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleExpand?: (id: string) => void;
  onSelect?: (unidade: UnidadeOrganizacional) => void;
}

function UnidadeNode({ data, selected }: NodeProps<UnidadeNodeData>) {
  const { unidade, servidoresCount, isExpanded, hasChildren, onToggleExpand, onSelect } = data;
  const cores = CORES_UNIDADE[unidade.tipo];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(unidade);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.(unidade.id);
  };

  return (
    <div 
      className={cn(
        'relative px-4 py-3 rounded-lg border-2 shadow-md cursor-pointer transition-all duration-200 min-w-[200px] max-w-[280px]',
        'hover:shadow-lg hover:-translate-y-0.5',
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
        'bg-card'
      )}
      style={{ borderColor: `hsl(var(--${unidade.tipo === 'presidencia' ? 'primary' : unidade.tipo === 'diretoria' ? 'secondary' : 'accent'}))` }}
      onClick={handleClick}
    >
      {/* Handle superior */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-background"
      />

      {/* Badge do tipo */}
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant="secondary" 
          className={cn('text-xs', cores.bg, cores.text)}
        >
          {LABELS_UNIDADE[unidade.tipo]}
        </Badge>
        {hasChildren && (
          <button 
            onClick={handleToggle}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Nome e sigla */}
      <div className="mb-2">
        {unidade.sigla && (
          <span className="text-xs font-mono text-muted-foreground">{unidade.sigla}</span>
        )}
        <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
          {unidade.nome}
        </h3>
      </div>

      {/* Responsável */}
      {unidade.servidor_responsavel && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md">
          <Avatar className="h-6 w-6">
            <AvatarImage src={unidade.servidor_responsavel.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {unidade.servidor_responsavel.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate flex-1">
            {unidade.servidor_responsavel.full_name}
          </span>
        </div>
      )}

      {/* Contadores */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{servidoresCount} servidor{servidoresCount !== 1 ? 'es' : ''}</span>
        </div>
        {unidade.telefone && (
          <span className="text-xs">{unidade.ramal || unidade.telefone}</span>
        )}
      </div>

      {/* Handle inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-background"
      />
    </div>
  );
}

export default memo(UnidadeNode);
