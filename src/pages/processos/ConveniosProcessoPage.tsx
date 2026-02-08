import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Handshake, 
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
  Filter
} from 'lucide-react';

const convenios = [
  {
    id: 'CONV-2024-001',
    titulo: 'Parceria para Jogos Escolares 2024',
    entidade: 'Secretaria de Educação - SEED',
    tipo: 'Convênio',
    valor: 250000,
    dataInicio: '2024-01-15',
    dataFim: '2024-12-31',
    status: 'vigente',
    percentualExecutado: 75
  },
  {
    id: 'CONV-2024-002',
    titulo: 'Programa Bolsa Atleta Municipal',
    entidade: 'Prefeitura de Boa Vista',
    tipo: 'Termo de Cooperação',
    valor: 180000,
    dataInicio: '2024-03-01',
    dataFim: '2025-02-28',
    status: 'vigente',
    percentualExecutado: 45
  },
  {
    id: 'CONV-2023-015',
    titulo: 'Centro de Treinamento Esportivo',
    entidade: 'Ministério do Esporte',
    tipo: 'Convênio Federal',
    valor: 500000,
    dataInicio: '2023-06-01',
    dataFim: '2024-05-31',
    status: 'prestacao_contas',
    percentualExecutado: 100
  },
  {
    id: 'CONV-2024-003',
    titulo: 'Festival de Esportes da Juventude',
    entidade: 'Secretaria de Estado de Esporte e Lazer',
    tipo: 'Acordo de Cooperação',
    valor: 75000,
    dataInicio: '2024-08-01',
    dataFim: '2024-11-30',
    status: 'encerrado',
    percentualExecutado: 100
  },
];

const etapasFluxo = [
  { numero: 1, titulo: 'Proposta/Plano de Trabalho', descricao: 'Elaboração da proposta técnica e plano de trabalho detalhado' },
  { numero: 2, titulo: 'Análise Jurídica', descricao: 'Parecer jurídico sobre viabilidade e conformidade legal' },
  { numero: 3, titulo: 'Aprovação Técnica', descricao: 'Análise técnica e aprovação do plano de trabalho' },
  { numero: 4, titulo: 'Celebração', descricao: 'Assinatura do termo e publicação no DOE' },
  { numero: 5, titulo: 'Execução', descricao: 'Execução das atividades previstas no plano' },
  { numero: 6, titulo: 'Prestação de Contas', descricao: 'Prestação de contas parcial e final' },
];

const ConveniosProcessoPage: React.FC = () => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const conveniosFiltrados = convenios.filter(conv => {
    const matchBusca = conv.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       conv.entidade.toLowerCase().includes(busca.toLowerCase()) ||
                       conv.id.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || conv.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      vigente: { label: 'Vigente', variant: 'default' },
      prestacao_contas: { label: 'Prestação de Contas', variant: 'secondary' },
      encerrado: { label: 'Encerrado', variant: 'outline' },
      suspenso: { label: 'Suspenso', variant: 'destructive' }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <ModuleLayout module="compras">
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/processos" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Processos
          </Link>
          <span>/</span>
          <span className="text-foreground">Convênios e Parcerias</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Handshake className="h-8 w-8 text-primary" />
              Convênios e Parcerias
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão de convênios, termos de cooperação e parcerias institucionais
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Convênio
          </Button>
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lista">Lista de Convênios</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo do Processo</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          {/* Lista de Convênios */}
          <TabsContent value="lista" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, entidade ou número..."
                      className="pl-10"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={filtroStatus === 'todos' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFiltroStatus('todos')}
                    >
                      Todos
                    </Button>
                    <Button 
                      variant={filtroStatus === 'vigente' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFiltroStatus('vigente')}
                    >
                      Vigentes
                    </Button>
                    <Button 
                      variant={filtroStatus === 'prestacao_contas' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFiltroStatus('prestacao_contas')}
                    >
                      Prestação de Contas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{convenios.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {convenios.filter(c => c.status === 'vigente').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Vigentes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {convenios.filter(c => c.status === 'prestacao_contas').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Prest. Contas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {formatCurrency(convenios.reduce((acc, c) => acc + c.valor, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista */}
            <div className="space-y-4">
              {conveniosFiltrados.map((convenio) => (
                <Card key={convenio.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-muted-foreground">{convenio.id}</span>
                          {getStatusBadge(convenio.status)}
                          <Badge variant="outline">{convenio.tipo}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{convenio.titulo}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {convenio.entidade}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(convenio.dataInicio)} - {formatDate(convenio.dataFim)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(convenio.valor)}
                        </div>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Execução</span>
                            <span>{convenio.percentualExecutado}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${convenio.percentualExecutado}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
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
                <CardTitle>Fluxo de Convênios e Parcerias</CardTitle>
                <CardDescription>
                  Etapas do processo de celebração e execução de convênios
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

          {/* Documentos */}
          <TabsContent value="documentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos e Modelos</CardTitle>
                <CardDescription>
                  Modelos de documentos para convênios e parcerias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Modelo de Plano de Trabalho',
                    'Minuta de Convênio',
                    'Termo de Cooperação Técnica',
                    'Acordo de Cooperação',
                    'Relatório de Execução',
                    'Prestação de Contas Final',
                    'Termo Aditivo',
                    'Termo de Rescisão'
                  ].map((doc) => (
                    <div key={doc} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{doc}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
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

export default ConveniosProcessoPage;
