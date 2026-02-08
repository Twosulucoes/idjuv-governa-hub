/**
 * Página de Auditoria do Workflow - Gestores Escolares
 * /cadastrogestores/auditoria
 */

import { useState, useMemo } from 'react';
import {
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  Download,
  Search,
  Filter,
  Activity,
  FileText,
  Loader2,
} from 'lucide-react';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGestoresAuditoria } from '@/hooks/useGestoresAuditoria';
import { STATUS_GESTOR_CONFIG, type StatusGestor } from '@/types/gestoresEscolares';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACAO_LABELS: Record<string, { label: string; icon: typeof History; color: string }> = {
  criacao: { label: 'Pré-cadastro', icon: FileText, color: 'text-blue-600' },
  assumir_tarefa: { label: 'Tarefa Assumida', icon: User, color: 'text-purple-600' },
  cadastro_cbde: { label: 'Cadastrado CBDE', icon: CheckCircle, color: 'text-indigo-600' },
  contato_realizado: { label: 'Contato Realizado', icon: Activity, color: 'text-cyan-600' },
  confirmacao: { label: 'Confirmação', icon: CheckCircle, color: 'text-green-600' },
  problema: { label: 'Problema', icon: AlertTriangle, color: 'text-red-600' },
  observacao: { label: 'Observação', icon: FileText, color: 'text-gray-600' },
  mudanca_status: { label: 'Mudança Status', icon: ArrowRight, color: 'text-amber-600' },
};

export default function AuditoriaWorkflowPage() {
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState<string>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [tab, setTab] = useState('timeline');

  const { 
    historico, 
    historicosPorGestor, 
    gestoresComProblemas, 
    metricas, 
    isLoading 
  } = useGestoresAuditoria();

  // Responsáveis únicos
  const responsaveis = useMemo(() => {
    const resp = new Set<string>();
    historico.forEach(h => {
      if (h.responsavel && !h.responsavel.includes('Sistema')) {
        resp.add(h.responsavel);
      }
    });
    return Array.from(resp).sort();
  }, [historico]);

  // Filtrar histórico
  const historicoFiltrado = useMemo(() => {
    return historico.filter(h => {
      if (filtroAcao !== 'todos' && h.acao !== filtroAcao) return false;
      if (filtroResponsavel !== 'todos' && h.responsavel !== filtroResponsavel) return false;
      if (busca) {
        const termo = busca.toLowerCase();
        return (
          h.gestor_nome?.toLowerCase().includes(termo) ||
          h.escola_nome?.toLowerCase().includes(termo) ||
          h.responsavel?.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [historico, filtroAcao, filtroResponsavel, busca]);

  // Exportar auditoria
  const handleExportar = () => {
    const dados = historicoFiltrado.map(h => ({
      'Data/Hora': format(new Date(h.data_acao), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      'Gestor': h.gestor_nome,
      'Escola': h.escola_nome || '',
      'Ação': ACAO_LABELS[h.acao]?.label || h.acao,
      'Status Anterior': h.status_anterior || '-',
      'Status Novo': STATUS_GESTOR_CONFIG[h.status_novo as StatusGestor]?.label || h.status_novo,
      'Responsável': h.responsavel || 'Sistema',
      'Status Atual': STATUS_GESTOR_CONFIG[h.status_atual as StatusGestor]?.label || h.status_atual,
      'Dias no Status': Math.round(h.dias_no_status_atual),
      'Alerta': h.alerta_parado ? 'SIM' : 'NÃO',
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');

    // Aba de métricas
    const metricasSheet = [
      { 'Métrica': 'Total de Ações', 'Valor': metricas.totalAcoes },
      { 'Métrica': 'Gestores com Alerta', 'Valor': metricas.gestoresParados },
      ...Object.entries(metricas.acoesPorTipo).map(([acao, count]) => ({
        'Métrica': `Ações: ${ACAO_LABELS[acao]?.label || acao}`,
        'Valor': count,
      })),
      ...Object.entries(metricas.acoesPorResponsavel).map(([resp, count]) => ({
        'Métrica': `Por: ${resp}`,
        'Valor': count,
      })),
    ];
    const wsMetricas = XLSX.utils.json_to_sheet(metricasSheet);
    XLSX.utils.book_append_sheet(wb, wsMetricas, 'Métricas');

    XLSX.writeFile(wb, `auditoria-workflow-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_GESTOR_CONFIG[status as StatusGestor];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <ModuleLayout module="gestores_escolares">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-amber-500" />
            Auditoria do Workflow
          </h1>
          <p className="text-muted-foreground">
            Histórico completo de ações e identificação de falhas no processamento
          </p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{metricas.totalAcoes}</p>
                  <p className="text-xs text-muted-foreground">Total de Ações</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{Object.keys(metricas.acoesPorResponsavel).length}</p>
                  <p className="text-xs text-muted-foreground">Servidores Atuantes</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {metricas.acoesPorTipo['confirmacao'] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmações</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className={metricas.gestoresParados > 0 ? 'border-amber-500' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${metricas.gestoresParados > 0 ? 'text-amber-600' : ''}`}>
                    {metricas.gestoresParados}
                  </p>
                  <p className="text-xs text-muted-foreground">Parados +48h</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${metricas.gestoresParados > 0 ? 'text-amber-500' : 'text-muted-foreground/50'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por gestor, escola ou responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filtroAcao} onValueChange={setFiltroAcao}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo de Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as ações</SelectItem>
              {Object.entries(ACAO_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {responsaveis.map(resp => (
                <SelectItem key={resp} value={resp}>{resp}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportar}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="por-gestor">Por Gestor</TabsTrigger>
            <TabsTrigger value="problemas">
              Problemas
              {gestoresComProblemas.length > 0 && (
                <Badge variant="destructive" className="ml-2">{gestoresComProblemas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="por-servidor">Por Servidor</TabsTrigger>
          </TabsList>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : historicoFiltrado.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Gestor</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Transição</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status Atual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoFiltrado.slice(0, 100).map((h) => {
                        const acaoConfig = ACAO_LABELS[h.acao] || { label: h.acao, icon: History, color: 'text-gray-600' };
                        const AcaoIcon = acaoConfig.icon;
                        
                        return (
                          <TableRow key={h.historico_id} className={h.alerta_parado ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                            <TableCell className="text-sm">
                              {format(new Date(h.data_acao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{h.gestor_nome}</p>
                                <p className="text-xs text-muted-foreground">{h.escola_nome}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-2 ${acaoConfig.color}`}>
                                <AcaoIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">{acaoConfig.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-xs">
                                {h.status_anterior ? (
                                  <>
                                    <span className="text-muted-foreground">
                                      {STATUS_GESTOR_CONFIG[h.status_anterior as StatusGestor]?.label || h.status_anterior}
                                    </span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span>
                                      {STATUS_GESTOR_CONFIG[h.status_novo as StatusGestor]?.label || h.status_novo}
                                    </span>
                                  </>
                                ) : (
                                  <span>{STATUS_GESTOR_CONFIG[h.status_novo as StatusGestor]?.label || h.status_novo}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {h.responsavel || 'Sistema'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(h.status_atual)}
                                {h.alerta_parado && (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Gestor */}
          <TabsContent value="por-gestor">
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="space-y-2">
                  {historicosPorGestor.map((gestor) => (
                    <AccordionItem key={gestor.gestor_id} value={gestor.gestor_id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-left">{gestor.gestor_nome}</p>
                              <p className="text-xs text-muted-foreground text-left">{gestor.escola_nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(gestor.status_atual)}
                            {gestor.alerta_parado && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                <Clock className="h-3 w-3 mr-1" />
                                {Math.round(gestor.dias_no_status_atual)}d
                              </Badge>
                            )}
                            <Badge variant="secondary">{gestor.acoes.length} ações</Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {gestor.acoes.sort((a, b) => new Date(a.data_acao).getTime() - new Date(b.data_acao).getTime()).map((acao, idx) => {
                            const acaoConfig = ACAO_LABELS[acao.acao] || { label: acao.acao, icon: History, color: 'text-gray-600' };
                            const AcaoIcon = acaoConfig.icon;
                            
                            return (
                              <div key={acao.historico_id} className="flex items-start gap-3 text-sm">
                                <div className="flex flex-col items-center">
                                  <div className={`p-1.5 rounded-full bg-muted ${acaoConfig.color}`}>
                                    <AcaoIcon className="h-3 w-3" />
                                  </div>
                                  {idx < gestor.acoes.length - 1 && <div className="w-px h-6 bg-muted" />}
                                </div>
                                <div className="flex-1 pb-2">
                                  <p className={`font-medium ${acaoConfig.color}`}>{acaoConfig.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(acao.data_acao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    {acao.responsavel && ` • ${acao.responsavel}`}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Problemas */}
          <TabsContent value="problemas">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Gestores com Problemas de Processamento
                </CardTitle>
                <CardDescription>
                  Registros parados há mais de 48h ou com status "problema"
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gestoresComProblemas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>Nenhum problema identificado!</p>
                    <p className="text-sm">Todos os registros estão sendo processados normalmente.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestor</TableHead>
                        <TableHead>Escola</TableHead>
                        <TableHead>Status Atual</TableHead>
                        <TableHead>Dias Parado</TableHead>
                        <TableHead>Última Ação</TableHead>
                        <TableHead>Responsável</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gestoresComProblemas.map((g) => {
                        const ultimaAcao = g.acoes[0];
                        return (
                          <TableRow key={g.gestor_id} className="bg-amber-50 dark:bg-amber-900/10">
                            <TableCell className="font-medium">{g.gestor_nome}</TableCell>
                            <TableCell>{g.escola_nome}</TableCell>
                            <TableCell>{getStatusBadge(g.status_atual)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-amber-600">
                                {Math.round(g.dias_no_status_atual)} dias
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {ultimaAcao && format(new Date(ultimaAcao.data_acao), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ultimaAcao?.responsavel || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Servidor */}
          <TabsContent value="por-servidor">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Ações por Servidor
                </CardTitle>
                <CardDescription>
                  Quantidade de ações realizadas por cada responsável
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(metricas.acoesPorResponsavel).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma ação de servidor registrada.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servidor</TableHead>
                        <TableHead className="text-right">Total de Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(metricas.acoesPorResponsavel)
                        .sort(([, a], [, b]) => b - a)
                        .map(([responsavel, count]) => (
                          <TableRow key={responsavel}>
                            <TableCell className="font-medium">{responsavel}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
