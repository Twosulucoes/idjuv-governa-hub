import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Eye,
  Download,
  MoreHorizontal,
  Send,
  FileSignature,
  Newspaper,
  XCircle,
  ArrowUpDown,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  STATUS_PORTARIA_LABELS,
  STATUS_PORTARIA_COLORS,
  Portaria,
} from '@/types/portaria';
import {
  useEnviarParaAssinatura,
  useEnviarParaPublicacao,
  useRevogarPortaria,
} from '@/hooks/usePortarias';

interface PortariaTableProps {
  portarias: Portaria[];
  isLoading?: boolean;
  onView?: (portaria: Portaria) => void;
  onEdit?: (portaria: Portaria) => void;
  onDelete?: (portaria: Portaria) => void;
  onGeneratePdf?: (portaria: Portaria) => void;
  onRegistrarPublicacao?: (portaria: Portaria) => void;
  onRegistrarAssinatura?: (portaria: Portaria) => void;
}

export function PortariaTable({
  portarias,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onGeneratePdf,
  onRegistrarPublicacao,
  onRegistrarAssinatura,
}: PortariaTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const enviarParaAssinatura = useEnviarParaAssinatura();
  const enviarParaPublicacao = useEnviarParaPublicacao();
  const revogarPortaria = useRevogarPortaria();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(portarias.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedPortarias = [...portarias].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key as keyof Portaria];
    const bValue = b[sortConfig.key as keyof Portaria];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === portarias.length && portarias.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-28">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('numero')}
              >
                Número
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-28">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('categoria')}
              >
                Categoria
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-28">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('data_documento')}
              >
                Data
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-40">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => handleSort('status')}
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-24">DOE</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPortarias.map((portaria) => (
            <TableRow
              key={portaria.id}
              className="cursor-pointer"
              onClick={() => onView?.(portaria)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(portaria.id)}
                  onCheckedChange={(checked) =>
                    handleSelectOne(portaria.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="font-mono text-sm font-medium">
                {portaria.numero}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{portaria.titulo}</p>
                  {portaria.ementa && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {portaria.ementa}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {portaria.categoria && (
                  <Badge variant="outline" className="capitalize text-xs">
                    {portaria.categoria}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(portaria.data_documento), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn('text-xs', STATUS_PORTARIA_COLORS[portaria.status])}
                >
                  {STATUS_PORTARIA_LABELS[portaria.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {portaria.doe_numero ? (
                  <span>
                    {portaria.doe_numero}
                    {portaria.doe_data && (
                      <span className="block text-xs">
                        {format(new Date(portaria.doe_data), 'dd/MM/yy')}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">-</span>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(portaria)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    {(portaria.status === 'minuta' || portaria.status === 'aguardando_assinatura') && (
                      <DropdownMenuItem onClick={() => onEdit?.(portaria)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onGeneratePdf?.(portaria)}>
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {portaria.status === 'minuta' && (
                      <DropdownMenuItem
                        onClick={() => enviarParaAssinatura.mutate(portaria.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar para Assinatura
                      </DropdownMenuItem>
                    )}
                    
                    {portaria.status === 'aguardando_assinatura' && (
                      <DropdownMenuItem
                        onClick={() => onRegistrarAssinatura?.(portaria)}
                      >
                        <FileSignature className="h-4 w-4 mr-2" />
                        Registrar Assinatura
                      </DropdownMenuItem>
                    )}
                    
                    {portaria.status === 'assinado' && (
                      <DropdownMenuItem
                        onClick={() => enviarParaPublicacao.mutate(portaria.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar para Publicação
                      </DropdownMenuItem>
                    )}
                    
                    {portaria.status === 'aguardando_publicacao' && (
                      <DropdownMenuItem
                        onClick={() => onRegistrarPublicacao?.(portaria)}
                      >
                        <Newspaper className="h-4 w-4 mr-2" />
                        Registrar Publicação
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete?.(portaria)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                    
                    {!['revogado', 'minuta'].includes(portaria.status) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            revogarPortaria.mutate({ id: portaria.id })
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Revogar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          
          {sortedPortarias.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center">
                <p className="text-muted-foreground">Nenhuma portaria encontrada</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
