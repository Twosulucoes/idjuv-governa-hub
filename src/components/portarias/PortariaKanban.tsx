import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  PenTool,
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
  AlertTriangle,
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
  onRegistrarAssinatura?: (portaria: Portaria) => void;
  onRegistrarPublicacao?: (portaria: Portaria) => void;
}

// Fases essenciais simplificadas
const KANBAN_COLUMNS: { key: string; label: string; statuses: StatusPortaria[]; icon: React.ReactNode; colorClass: string }[] = [
  {
    key: 'elaboracao',
    label: 'Elaboração',
    statuses: ['minuta'],
    icon: <FileText className="h-4 w-4" />,
    colorClass: 'bg-muted text-muted-foreground',
  },
  {
    key: 'assinatura',
    label: 'Assinatura',
    statuses: ['aguardando_assinatura', 'assinado'],
    icon: <PenTool className="h-4 w-4" />,
    colorClass: 'bg-warning/20 text-warning',
  },
  {
    key: 'publicacao',
    label: 'Publicação',
    statuses: ['aguardando_publicacao', 'publicado'],
    icon: <Newspaper className="h-4 w-4" />,
    colorClass: 'bg-info/20 text-info',
  },
  {
    key: 'vigente',
    label: 'Vigente',
    statuses: ['vigente'],
    icon: <BadgeCheck className="h-4 w-4" />,
    colorClass: 'bg-success/20 text-success',
  },
];

function getMissingItems(portaria: Portaria): string[] {
  const missing: string[] = [];
  if (!portaria.doe_numero && !portaria.doe_data) {
    missing.push('DOE');
  }
  if (!portaria.arquivo_url && !portaria.arquivo_assinado_url) {
    missing.push('Anexo');
  }
  return missing;
}

export function PortariaKanban({
  portarias,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onGeneratePdf,
  onRegistrarAssinatura,
  onRegistrarPublicacao,
}: PortariaKanbanProps) {
  const enviarParaAssinatura = useEnviarParaAssinatura();
  const enviarParaPublicacao = useEnviarParaPublicacao();

  const getPortariasByStatuses = (statuses: StatusPortaria[]) => {
    return portarias.filter((p) => statuses.includes(p.status));
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
      <div className="grid grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="space-y-3">
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
      <div className="grid grid-cols-4 gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnPortarias = getPortariasByStatuses(column.statuses);
          
          return (
            <div key={column.key} className="min-w-[220px]">
              <div
                className={cn(
                  'flex items-center gap-2 p-2 rounded-t-lg border-b-2',
                  column.colorClass
                )}
              >
                {column.icon}
                <span className="text-sm font-medium">
                  {column.label}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnPortarias.length}
                </Badge>
              </div>
              
              <ScrollArea className="h-[calc(100vh-320px)] bg-muted/30 rounded-b-lg p-2">
                <div className="space-y-2">
                  {columnPortarias.map((portaria) => {
                    const servidoresCount = getServidoresCount(portaria);
                    const missingItems = getMissingItems(portaria);
                    const hasMissing = missingItems.length > 0;
                    
                    return (
                      <Card
                        key={portaria.id}
                        className={cn(
                          'cursor-pointer hover:shadow-md transition-shadow',
                          hasMissing && 'border-warning/50'
                        )}
                        onClick={() => onView?.(portaria)}
                      >
                        <CardHeader className="p-3 pb-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1.5">
                              <CardTitle className="text-xs font-bold text-primary">
                                {portaria.numero}
                              </CardTitle>
                              {/* Sub-status badge */}
                              {column.statuses.length > 1 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                  {STATUS_PORTARIA_LABELS[portaria.status]}
                                </Badge>
                              )}
                            </div>
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEdit?.(portaria)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {portaria.status === 'minuta' && (
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
                                {portaria.status === 'aguardando_assinatura' && onRegistrarAssinatura && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRegistrarAssinatura(portaria);
                                      }}
                                    >
                                      <FileSignature className="h-4 w-4 mr-2" />
                                      Registrar Assinatura
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {portaria.status === 'assinado' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEnviarPublicacao(portaria);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Enviar para Publicação
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {portaria.status === 'aguardando_publicacao' && onRegistrarPublicacao && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRegistrarPublicacao(portaria);
                                      }}
                                    >
                                      <Newspaper className="h-4 w-4 mr-2" />
                                      Registrar Publicação
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

                          {/* Alerta DOE / Anexo faltando */}
                          {hasMissing && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 mt-2 px-1.5 py-1 rounded bg-warning/10 text-warning text-[10px] font-medium">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  Falta: {missingItems.join(', ')}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Esta portaria está sem: {missingItems.join(' e ')}
                              </TooltipContent>
                            </Tooltip>
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
