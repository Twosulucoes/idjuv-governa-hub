import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  PenTool,
  CheckSquare,
  FileUp,
  Newspaper,
  BadgeCheck,
  XCircle,
  MoreHorizontal,
  Eye,
  Download,
  Send,
  FileSignature,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  STATUS_PORTARIA_LABELS,
  STATUS_PORTARIA_COLORS,
  StatusPortaria,
  Portaria,
} from '@/types/portaria';
import {
  useEnviarParaAssinatura,
  useEnviarParaPublicacao,
} from '@/hooks/usePortarias';

interface PortariaKanbanProps {
  portarias: Portaria[];
  isLoading?: boolean;
  onView?: (portaria: Portaria) => void;
  onEdit?: (portaria: Portaria) => void;
  onDelete?: (portaria: Portaria) => void;
  onGeneratePdf?: (portaria: Portaria) => void;
}

const KANBAN_COLUMNS: StatusPortaria[] = [
  'minuta',
  'aguardando_assinatura',
  'assinado',
  'aguardando_publicacao',
  'publicado',
  'vigente',
];

const STATUS_ICONS: Record<StatusPortaria, React.ReactNode> = {
  minuta: <FileText className="h-4 w-4" />,
  aguardando_assinatura: <PenTool className="h-4 w-4" />,
  assinado: <CheckSquare className="h-4 w-4" />,
  aguardando_publicacao: <FileUp className="h-4 w-4" />,
  publicado: <Newspaper className="h-4 w-4" />,
  vigente: <BadgeCheck className="h-4 w-4" />,
  revogado: <XCircle className="h-4 w-4" />,
};

export function PortariaKanban({
  portarias,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onGeneratePdf,
}: PortariaKanbanProps) {
  const enviarParaAssinatura = useEnviarParaAssinatura();
  const enviarParaPublicacao = useEnviarParaPublicacao();

  const getPortariasByStatus = (status: StatusPortaria) => {
    return portarias.filter((p) => p.status === status);
  };

  const handleEnviarAssinatura = async (portaria: Portaria) => {
    await enviarParaAssinatura.mutateAsync(portaria.id);
  };

  const handleEnviarPublicacao = async (portaria: Portaria) => {
    await enviarParaPublicacao.mutateAsync(portaria.id);
  };

  const getServidoresCount = (portaria: Portaria) => {
    return portaria.servidores_ids?.length || 0;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 gap-4">
        {KANBAN_COLUMNS.map((status) => (
          <div key={status} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-6 gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const columnPortarias = getPortariasByStatus(status);
          
          return (
            <div key={status} className="min-w-[200px]">
              <div
                className={cn(
                  'flex items-center gap-2 p-2 rounded-t-lg border-b-2',
                  STATUS_PORTARIA_COLORS[status]
                )}
              >
                {STATUS_ICONS[status]}
                <span className="text-sm font-medium">
                  {STATUS_PORTARIA_LABELS[status]}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnPortarias.length}
                </Badge>
              </div>
              
              <ScrollArea className="h-[calc(100vh-320px)] bg-muted/30 rounded-b-lg p-2">
                <div className="space-y-2">
                  {columnPortarias.map((portaria) => {
                    const servidoresCount = getServidoresCount(portaria);
                    
                    return (
                      <Card
                        key={portaria.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onView?.(portaria)}
                      >
                        <CardHeader className="p-3 pb-1">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xs font-bold text-primary">
                              {portaria.numero}
                            </CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onView?.(portaria)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onGeneratePdf?.(portaria)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Gerar PDF
                                </DropdownMenuItem>
                                {(status === 'minuta' || status === 'aguardando_assinatura') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onEdit?.(portaria)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {status === 'minuta' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEnviarAssinatura(portaria);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Enviar para Assinatura
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(portaria);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                                {status === 'assinado' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEnviarPublicacao(portaria);
                                      }}
                                    >
                                      <FileSignature className="h-4 w-4 mr-2" />
                                      Enviar para Publicação
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {portaria.titulo}
                          </p>
                          {portaria.ementa && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1 italic">
                              {portaria.ementa}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(portaria.data_documento), 'dd/MM/yy', {
                                locale: ptBR,
                              })}
                            </span>
                            <div className="flex items-center gap-1">
                              {servidoresCount > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                      <Users className="h-3 w-3" />
                                      {servidoresCount}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {servidoresCount} servidor(es) vinculado(s)
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {portaria.categoria && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {portaria.categoria}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {columnPortarias.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Nenhuma portaria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
