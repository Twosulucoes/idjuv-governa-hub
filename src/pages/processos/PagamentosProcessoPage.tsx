import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  FileText, 
  Search, 
  Plus, 
  Calendar, 
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

const pagamentos = [
  {
    id: 'PAG-2024-0156',
    descricao: 'Nota Fiscal nº 12345 - Material Esportivo',
    fornecedor: 'Esportes Brasil LTDA',
    valor: 15680.00,
    dataVencimento: '2024-12-28',
    dataPagamento: null,
    status: 'pendente',
    tipo: 'fornecedor',
    processo: 'PROC-2024-089'
  },
  {
    id: 'PAG-2024-0155',
    descricao: 'Diárias - Viagem Manaus',
    fornecedor: 'João Silva Santos',
    valor: 2400.00,
    dataVencimento: '2024-12-25',
    dataPagamento: '2024-12-23',
    status: 'pago',
    tipo: 'diarias',
    processo: 'PROC-2024-095'
  },
  {
    id: 'PAG-2024-0154',
    descricao: 'Contrato de Manutenção Predial',
    fornecedor: 'Construmais Serviços',
    valor: 8500.00,
    dataVencimento: '2024-12-30',
    dataPagamento: null,
    status: 'em_analise',
    tipo: 'contrato',
    processo: 'PROC-2024-078'
  },
  {
    id: 'PAG-2024-0153',
    descricao: 'Ressarcimento Evento Esportivo',
    fornecedor: 'Maria Oliveira',
    valor: 890.00,
    dataVencimento: '2024-12-20',
    dataPagamento: null,
    status: 'atrasado',
    tipo: 'ressarcimento',
    processo: 'PROC-2024-102'
  },
];

const resumoMensal = {
  totalPago: 156780.00,
  totalPendente: 45890.00,
  totalAtrasado: 12350.00,
  quantidadePagamentos: 45
};

const etapasFluxo = [
  { numero: 1, titulo: 'Recebimento da Demanda', descricao: 'Nota fiscal ou solicitação de pagamento' },
  { numero: 2, titulo: 'Conferência Documental', descricao: 'Verificação de documentos e atesto' },
  { numero: 3, titulo: 'Empenho', descricao: 'Verificação de disponibilidade orçamentária' },
  { numero: 4, titulo: 'Liquidação', descricao: 'Reconhecimento da despesa' },
  { numero: 5, titulo: 'Ordenação', descricao: 'Autorização do ordenador de despesas' },
  { numero: 6, titulo: 'Pagamento', descricao: 'Efetivação do pagamento bancário' },
];

const PagamentosProcessoPage: React.FC = () => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const pagamentosFiltrados = pagamentos.filter(pag => {
    const matchBusca = pag.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                       pag.fornecedor.toLowerCase().includes(busca.toLowerCase()) ||
                       pag.id.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || pag.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pago: { label: 'Pago', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      pendente: { label: 'Pendente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      em_analise: { label: 'Em Análise', variant: 'outline', icon: <Eye className="h-3 w-3" /> },
      atrasado: { label: 'Atrasado', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline', icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const tipoConfig: Record<string, string> = {
      fornecedor: 'Fornecedor',
      diarias: 'Diárias',
      contrato: 'Contrato',
      ressarcimento: 'Ressarcimento'
    };
    return <Badge variant="outline">{tipoConfig[tipo] || tipo}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <ModuleLayout module="financeiro">
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/processos" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Processos
          </Link>
          <span>/</span>
          <span className="text-foreground">Pagamentos</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Gestão de Pagamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de pagamentos, notas fiscais e liquidações
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pagamento
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pago (Mês)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(resumoMensal.totalPago)}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(resumoMensal.totalPendente)}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Atrasado</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(resumoMensal.totalAtrasado)}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pagamentos (Mês)</p>
                  <p className="text-2xl font-bold text-primary">{resumoMensal.quantidadePagamentos}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lista">Lista de Pagamentos</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo do Processo</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Lista de Pagamentos */}
          <TabsContent value="lista" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição, fornecedor ou número..."
                      className="pl-10"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['todos', 'pendente', 'em_analise', 'pago', 'atrasado'].map((status) => (
                      <Button 
                        key={status}
                        variant={filtroStatus === status ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFiltroStatus(status)}
                      >
                        {status === 'todos' ? 'Todos' : 
                         status === 'pendente' ? 'Pendentes' :
                         status === 'em_analise' ? 'Em Análise' :
                         status === 'pago' ? 'Pagos' : 'Atrasados'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista */}
            <div className="space-y-4">
              {pagamentosFiltrados.map((pagamento) => (
                <Card key={pagamento.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-muted-foreground">{pagamento.id}</span>
                          {getStatusBadge(pagamento.status)}
                          {getTipoBadge(pagamento.tipo)}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{pagamento.descricao}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {pagamento.fornecedor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Venc: {formatDate(pagamento.dataVencimento)}
                          </span>
                          {pagamento.dataPagamento && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Pago: {formatDate(pagamento.dataPagamento)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(pagamento.valor)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Processo: {pagamento.processo}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                          {pagamento.status === 'pendente' && (
                            <Button size="sm">
                              Processar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Fluxo do Processo */}
          <TabsContent value="fluxo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Pagamentos</CardTitle>
                <CardDescription>
                  Etapas do processo de pagamento conforme legislação vigente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {etapasFluxo.map((etapa, index) => (
                    <div key={etapa.numero} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {etapa.numero}
                        </div>
                        {index < etapasFluxo.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <h4 className="font-semibold text-foreground">{etapa.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Pagamentos</CardTitle>
                <CardDescription>
                  Gere relatórios e extratos de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { titulo: 'Extrato Mensal de Pagamentos', desc: 'Todos os pagamentos do mês atual' },
                    { titulo: 'Relatório de Pagamentos Pendentes', desc: 'Lista de pagamentos aguardando processamento' },
                    { titulo: 'Relatório de Pagamentos Atrasados', desc: 'Pagamentos vencidos não processados' },
                    { titulo: 'Demonstrativo por Fornecedor', desc: 'Pagamentos agrupados por fornecedor' },
                    { titulo: 'Relatório Orçamentário', desc: 'Execução orçamentária de pagamentos' },
                    { titulo: 'Histórico Anual', desc: 'Todos os pagamentos do exercício' }
                  ].map((relatorio) => (
                    <div key={relatorio.titulo} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-foreground">{relatorio.titulo}</div>
                        <div className="text-sm text-muted-foreground">{relatorio.desc}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Gerar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default PagamentosProcessoPage;
