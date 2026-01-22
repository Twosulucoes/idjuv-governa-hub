// ============================================
// PÁGINA DE GESTÃO DE DEMANDAS ASCOM
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlayCircle,
  Send,
  Eye
} from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useDemandasAscom } from '@/hooks/useDemandasAscom';
import {
  DemandaAscom,
  StatusDemandaAscom,
  STATUS_DEMANDA_LABELS,
  STATUS_DEMANDA_COLORS,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_COLORS,
  CategoriaDemandasAscom
} from '@/types/ascom';

// Ícones por status
const STATUS_ICONS: Record<StatusDemandaAscom, React.ReactNode> = {
  rascunho: <FileText className="h-4 w-4" />,
  enviada: <Send className="h-4 w-4" />,
  em_analise: <Eye className="h-4 w-4" />,
  aguardando_autorizacao: <Clock className="h-4 w-4" />,
  aprovada: <CheckCircle className="h-4 w-4" />,
  em_execucao: <PlayCircle className="h-4 w-4" />,
  concluida: <CheckCircle className="h-4 w-4" />,
  indeferida: <XCircle className="h-4 w-4" />,
  cancelada: <AlertCircle className="h-4 w-4" />
};

export default function GestaoDemandasAscomPage() {
  const navigate = useNavigate();
  const { demandas, loading, fetchDemandas } = useDemandasAscom();
  
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [visualizacao, setVisualizacao] = useState<'lista' | 'kanban'>('lista');
  const [tabAtiva, setTabAtiva] = useState<string>('todas');

  useEffect(() => {
    fetchDemandas();
  }, [fetchDemandas]);

  // Filtrar demandas
  const demandasFiltradas = demandas.filter(d => {
    const matchBusca = !busca || 
      d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      d.numero_demanda?.toLowerCase().includes(busca.toLowerCase()) ||
      d.nome_responsavel.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = categoriaFiltro === 'todas' || d.categoria === categoriaFiltro;
    
    const matchTab = tabAtiva === 'todas' || 
      (tabAtiva === 'pendentes' && ['enviada', 'em_analise', 'aguardando_autorizacao'].includes(d.status)) ||
      (tabAtiva === 'em_execucao' && ['aprovada', 'em_execucao'].includes(d.status)) ||
      (tabAtiva === 'concluidas' && d.status === 'concluida') ||
      (tabAtiva === 'arquivadas' && ['indeferida', 'cancelada'].includes(d.status));
    
    return matchBusca && matchCategoria && matchTab;
  });

  // Contadores por status
  const contadores = {
    todas: demandas.length,
    pendentes: demandas.filter(d => ['enviada', 'em_analise', 'aguardando_autorizacao'].includes(d.status)).length,
    em_execucao: demandas.filter(d => ['aprovada', 'em_execucao'].includes(d.status)).length,
    concluidas: demandas.filter(d => d.status === 'concluida').length,
    arquivadas: demandas.filter(d => ['indeferida', 'cancelada'].includes(d.status)).length
  };

  // Colunas do Kanban
  const KANBAN_COLUMNS: StatusDemandaAscom[] = [
    'enviada',
    'em_analise',
    'aguardando_autorizacao',
    'aprovada',
    'em_execucao',
    'concluida'
  ];

  const getDemandasPorStatus = (status: StatusDemandaAscom) => 
    demandasFiltradas.filter(d => d.status === status);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Demandas ASCOM</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de comunicação institucional
            </p>
          </div>
          <Button onClick={() => navigate('/admin/ascom/demandas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Demanda
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setTabAtiva('todas')}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{contadores.todas}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/50 border-yellow-200" onClick={() => setTabAtiva('pendentes')}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{contadores.pendentes}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/50 border-purple-200" onClick={() => setTabAtiva('em_execucao')}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{contadores.em_execucao}</div>
              <div className="text-sm text-muted-foreground">Em Execução</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/50 border-green-200" onClick={() => setTabAtiva('concluidas')}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{contadores.concluidas}</div>
              <div className="text-sm text-muted-foreground">Concluídas</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/50 border-gray-200" onClick={() => setTabAtiva('arquivadas')}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-500">{contadores.arquivadas}</div>
              <div className="text-sm text-muted-foreground">Arquivadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, número ou responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIA_DEMANDA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={visualizacao === 'lista' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setVisualizacao('lista')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={visualizacao === 'kanban' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setVisualizacao('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList>
            <TabsTrigger value="todas">Todas ({contadores.todas})</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes ({contadores.pendentes})</TabsTrigger>
            <TabsTrigger value="em_execucao">Em Execução ({contadores.em_execucao})</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas ({contadores.concluidas})</TabsTrigger>
            <TabsTrigger value="arquivadas">Arquivadas ({contadores.arquivadas})</TabsTrigger>
          </TabsList>

          <TabsContent value={tabAtiva} className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : visualizacao === 'lista' ? (
              // Visualização em Lista
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demandasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhuma demanda encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      demandasFiltradas.map((demanda) => (
                        <TableRow 
                          key={demanda.id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => navigate(`/admin/ascom/demandas/${demanda.id}`)}
                        >
                          <TableCell className="font-mono text-sm">
                            {demanda.numero_demanda}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[250px] truncate font-medium">
                              {demanda.titulo}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {TIPO_DEMANDA_LABELS[demanda.tipo]}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CATEGORIA_DEMANDA_LABELS[demanda.categoria]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{demanda.nome_responsavel}</div>
                            <div className="text-xs text-muted-foreground">
                              {demanda.unidade_solicitante?.sigla}
                            </div>
                          </TableCell>
                          <TableCell>
                            {demanda.prazo_entrega ? (
                              <span className={
                                new Date(demanda.prazo_entrega) < new Date() && 
                                !['concluida', 'cancelada', 'indeferida'].includes(demanda.status)
                                  ? 'text-red-600 font-medium'
                                  : ''
                              }>
                                {format(new Date(demanda.prazo_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORIDADE_DEMANDA_COLORS[demanda.prioridade]}>
                              {PRIORIDADE_DEMANDA_LABELS[demanda.prioridade]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_DEMANDA_COLORS[demanda.status]}>
                              {STATUS_ICONS[demanda.status]}
                              <span className="ml-1">{STATUS_DEMANDA_LABELS[demanda.status]}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              // Visualização Kanban
              <div className="flex gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map((status) => {
                  const itens = getDemandasPorStatus(status);
                  return (
                    <div 
                      key={status} 
                      className="flex-shrink-0 w-[300px] bg-muted/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={STATUS_DEMANDA_COLORS[status]}>
                          {STATUS_ICONS[status]}
                          <span className="ml-1">{STATUS_DEMANDA_LABELS[status]}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">({itens.length})</span>
                      </div>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-2 pr-2">
                          {itens.map((demanda) => (
                            <Card 
                              key={demanda.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => navigate(`/admin/ascom/demandas/${demanda.id}`)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {demanda.numero_demanda}
                                  </span>
                                  <Badge className={`text-xs ${PRIORIDADE_DEMANDA_COLORS[demanda.prioridade]}`}>
                                    {PRIORIDADE_DEMANDA_LABELS[demanda.prioridade]}
                                  </Badge>
                                </div>
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                  {demanda.titulo}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {TIPO_DEMANDA_LABELS[demanda.tipo]}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{demanda.unidade_solicitante?.sigla || 'N/A'}</span>
                                  {demanda.prazo_entrega && (
                                    <span className={
                                      new Date(demanda.prazo_entrega) < new Date() ? 'text-red-600' : ''
                                    }>
                                      {format(new Date(demanda.prazo_entrega), 'dd/MM', { locale: ptBR })}
                                    </span>
                                  )}
                                </div>
                                {demanda.requer_autorizacao_presidencia && (
                                  <Badge variant="outline" className="mt-2 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Requer autorização
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          {itens.length === 0 && (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              Nenhuma demanda
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
