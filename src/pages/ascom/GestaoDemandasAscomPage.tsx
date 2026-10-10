// ============================================
// PÁGINA DE GESTÃO DE DEMANDAS ASCOM
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  PlayCircle,
  Eye
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from '@/components/design-system';

import { useDemandasAscom } from '@/hooks/useDemandasAscom';
import {
  DemandaAscom,
  StatusDemandaAscom,
  PrioridadeDemandaAscom,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
} from '@/types/ascom';

// Situação da demanda → rótulo (caixa de frase) e tom do StatusBadge
const STATUS_DEMANDA: Record<StatusDemandaAscom, { label: string; tom: TomStatus }> = {
  rascunho: { label: 'Rascunho', tom: 'neutro' },
  enviada: { label: 'Enviada', tom: 'pendente' },
  em_analise: { label: 'Em análise', tom: 'andamento' },
  aguardando_autorizacao: { label: 'Aguardando autorização', tom: 'pendente' },
  aprovada: { label: 'Aprovada', tom: 'sucesso' },
  em_execucao: { label: 'Em execução', tom: 'andamento' },
  concluida: { label: 'Concluída', tom: 'sucesso' },
  indeferida: { label: 'Indeferida', tom: 'erro' },
  cancelada: { label: 'Cancelada', tom: 'erro' },
};

const PRIORIDADE_DEMANDA: Record<PrioridadeDemandaAscom, { label: string; tom: TomStatus }> = {
  baixa: { label: 'Baixa', tom: 'neutro' },
  normal: { label: 'Normal', tom: 'andamento' },
  alta: { label: 'Alta', tom: 'pendente' },
  urgente: { label: 'Urgente', tom: 'destaque' },
};

const statusDemanda = (s: string | null | undefined) =>
  STATUS_DEMANDA[s as StatusDemandaAscom] ?? { label: s ?? 'Sem situação', tom: 'neutro' as TomStatus };
const prioridadeDemanda = (p: string | null | undefined) =>
  PRIORIDADE_DEMANDA[p as PrioridadeDemandaAscom] ?? { label: p ?? 'Sem prioridade', tom: 'neutro' as TomStatus };

const prazoVencido = (d: DemandaAscom) =>
  !!d.prazo_entrega &&
  new Date(d.prazo_entrega) < new Date() &&
  !['concluida', 'cancelada', 'indeferida'].includes(d.status);

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

  // Cartões de resumo: clicar seleciona a aba correspondente
  const resumos: { tab: string; rotulo: string; valor: number; icone: LucideIcon }[] = [
    { tab: 'todas', rotulo: 'Total', valor: contadores.todas, icone: FileText },
    { tab: 'pendentes', rotulo: 'Pendentes', valor: contadores.pendentes, icone: Clock },
    { tab: 'em_execucao', rotulo: 'Em execução', valor: contadores.em_execucao, icone: PlayCircle },
    { tab: 'concluidas', rotulo: 'Concluídas', valor: contadores.concluidas, icone: CheckCircle },
    { tab: 'arquivadas', rotulo: 'Arquivadas', valor: contadores.arquivadas, icone: Archive },
  ];

  const colunas: ColunaTabela<DemandaAscom>[] = [
    {
      id: 'numero',
      cabecalho: 'Número',
      celula: (d) => <span className="font-mono text-body">{d.numero_demanda}</span>,
      ordenarPor: (d) => d.numero_demanda,
    },
    {
      id: 'titulo',
      cabecalho: 'Título',
      mobile: 'titulo',
      celula: (d) => (
        <>
          <div className="max-w-[250px] truncate font-medium">{d.titulo}</div>
          <div className="text-caption text-muted-foreground">{TIPO_DEMANDA_LABELS[d.tipo]}</div>
        </>
      ),
      ordenarPor: (d) => d.titulo,
    },
    {
      id: 'categoria',
      cabecalho: 'Categoria',
      celula: (d) => <Badge variant="outline">{CATEGORIA_DEMANDA_LABELS[d.categoria]}</Badge>,
      ordenarPor: (d) => CATEGORIA_DEMANDA_LABELS[d.categoria],
    },
    {
      id: 'solicitante',
      cabecalho: 'Solicitante',
      celula: (d) => (
        <>
          <div className="text-body">{d.nome_responsavel}</div>
          <div className="text-caption text-muted-foreground">{d.unidade_solicitante?.sigla}</div>
        </>
      ),
      ordenarPor: (d) => d.nome_responsavel,
    },
    {
      id: 'prazo',
      cabecalho: 'Prazo',
      celula: (d) =>
        d.prazo_entrega ? (
          <span className={prazoVencido(d) ? 'text-destructive font-medium' : ''}>
            {format(new Date(d.prazo_entrega), 'dd/MM/yyyy', { locale: ptBR })}
            {prazoVencido(d) && <span className="text-caption"> (vencido)</span>}
          </span>
        ) : '-',
      ordenarPor: (d) => (d.prazo_entrega ? new Date(d.prazo_entrega) : null),
    },
    {
      id: 'prioridade',
      cabecalho: 'Prioridade',
      celula: (d) => {
        const p = prioridadeDemanda(d.prioridade);
        return <StatusBadge tom={p.tom}>{p.label}</StatusBadge>;
      },
      ordenarPor: (d) => ['baixa', 'normal', 'alta', 'urgente'].indexOf(d.prioridade),
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (d) => {
        const st = statusDemanda(d.status);
        return <StatusBadge tom={st.tom}>{st.label}</StatusBadge>;
      },
      ordenarPor: (d) => statusDemanda(d.status).label,
    },
  ];

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Comunicação', href: '/comunicacao' }, { rotulo: 'Demandas' }]}
          titulo="Gestão de demandas ASCOM"
          descricao="Gerencie as solicitações de comunicação institucional"
          acoes={
            <Button onClick={() => navigate('/ascom/demandas/nova')}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Nova demanda
            </Button>
          }
        />

        {/* Cards de Resumo (clique seleciona a aba) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {resumos.map((r) => (
            // Botão cobrindo o cartão: evita <div> dentro de <button> e mantém o cartão inteiro clicável.
            <div
              key={r.tab}
              className={`relative rounded-lg transition-all ${tabAtiva === r.tab ? 'ring-2 ring-primary' : ''}`}
            >
              <KpiCard rotulo={r.rotulo} valor={r.valor} icone={r.icone} carregando={loading} className="h-full" />
              <button
                type="button"
                aria-pressed={tabAtiva === r.tab}
                aria-label={loading ? `Mostrar demandas: ${r.rotulo}` : `Mostrar demandas: ${r.rotulo} (${r.valor})`}
                className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setTabAtiva(r.tab)}
              />
            </div>
          ))}
        </div>

        {/* Filtros (valem para lista e kanban) */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por título, número ou responsável..."
              aria-label="Buscar demandas por título, número ou responsável"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIA_DEMANDA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2" role="group" aria-label="Modo de visualização">
            <Button
              variant={visualizacao === 'lista' ? 'default' : 'outline'}
              size="icon"
              aria-label="Ver em lista"
              aria-pressed={visualizacao === 'lista'}
              onClick={() => setVisualizacao('lista')}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={visualizacao === 'kanban' ? 'default' : 'outline'}
              size="icon"
              aria-label="Ver em quadro kanban"
              aria-pressed={visualizacao === 'kanban'}
              onClick={() => setVisualizacao('kanban')}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList>
            <TabsTrigger value="todas">Todas ({contadores.todas})</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes ({contadores.pendentes})</TabsTrigger>
            <TabsTrigger value="em_execucao">Em execução ({contadores.em_execucao})</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas ({contadores.concluidas})</TabsTrigger>
            <TabsTrigger value="arquivadas">Arquivadas ({contadores.arquivadas})</TabsTrigger>
          </TabsList>

          <TabsContent value={tabAtiva} className="mt-4">
            {visualizacao === 'lista' ? (
              // Visualização em Lista
              <DataTable
                rotulo="Demandas ASCOM"
                dados={demandasFiltradas}
                colunas={colunas}
                chaveLinha={(d) => d.id}
                carregando={loading}
                vazio={{ icone: FileText, titulo: 'Nenhuma demanda encontrada' }}
                aoClicarLinha={(d) => navigate(`/ascom/demandas/${d.id}`)}
                acoesLinha={(d) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Ver demanda ${d.numero_demanda ?? d.titulo}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/ascom/demandas/${d.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              />
            ) : loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
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
                        <StatusBadge tom={statusDemanda(status).tom}>{statusDemanda(status).label}</StatusBadge>
                        <span className="text-body text-muted-foreground">({itens.length})</span>
                      </div>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-2 pr-2">
                          {itens.map((demanda) => {
                            const prioridade = prioridadeDemanda(demanda.prioridade);
                            const atrasada = prazoVencido(demanda);
                            return (
                            <Card 
                              key={demanda.id}
                              className="relative hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="text-caption font-mono text-muted-foreground">
                                    {demanda.numero_demanda}
                                  </span>
                                  <StatusBadge tom={prioridade.tom} icone={false}>
                                    {prioridade.label}
                                  </StatusBadge>
                                </div>
                                <h4 className="font-medium text-body line-clamp-2 mb-1">
                                  {/* Botão cobrindo o cartão: o cartão inteiro abre a demanda */}
                                  <button
                                    type="button"
                                    className="text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                                    onClick={() => navigate(`/ascom/demandas/${demanda.id}`)}
                                  >
                                    {demanda.titulo}
                                  </button>
                                </h4>
                                <p className="text-caption text-muted-foreground mb-2">
                                  {TIPO_DEMANDA_LABELS[demanda.tipo]}
                                </p>
                                <div className="flex items-center justify-between text-caption text-muted-foreground">
                                  <span>{demanda.unidade_solicitante?.sigla || 'N/A'}</span>
                                  {demanda.prazo_entrega && (
                                    <span className={atrasada ? 'text-destructive' : ''}>
                                      {format(new Date(demanda.prazo_entrega), 'dd/MM', { locale: ptBR })}
                                      {atrasada && <span className="sr-only"> (prazo vencido)</span>}
                                    </span>
                                  )}
                                </div>
                                {demanda.requer_autorizacao_presidencia && (
                                  <Badge variant="outline" className="mt-2 text-caption">
                                    <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                                    Requer autorização
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                            );
                          })}
                          {itens.length === 0 && (
                            <div className="text-center py-8 text-body text-muted-foreground">
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
    </ModuleLayout>
  );
}
