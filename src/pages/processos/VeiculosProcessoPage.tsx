import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  FileText, 
  Search, 
  Plus, 
  Calendar, 
  Fuel,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Download,
  MapPin,
  User
} from 'lucide-react';

const veiculos = [
  {
    id: 'VEH-001',
    placa: 'QXA-1234',
    modelo: 'Toyota Hilux SW4',
    ano: 2023,
    tipo: 'SUV',
    combustivel: 'Diesel',
    km: 25340,
    status: 'disponivel',
    proximaRevisao: '2025-02-15',
    responsavel: 'Coordenação Geral'
  },
  {
    id: 'VEH-002',
    placa: 'QXB-5678',
    modelo: 'Fiat Strada',
    ano: 2022,
    tipo: 'Picape',
    combustivel: 'Flex',
    km: 45230,
    status: 'em_uso',
    proximaRevisao: '2025-01-20',
    responsavel: 'Diretoria de Esportes'
  },
  {
    id: 'VEH-003',
    placa: 'QXC-9012',
    modelo: 'VW Voyage',
    ano: 2021,
    tipo: 'Sedan',
    combustivel: 'Flex',
    km: 62150,
    status: 'manutencao',
    proximaRevisao: '2025-01-10',
    responsavel: 'Diretoria Administrativa'
  },
  {
    id: 'VEH-004',
    placa: 'QXD-3456',
    modelo: 'Renault Master',
    ano: 2023,
    tipo: 'Van',
    combustivel: 'Diesel',
    km: 18900,
    status: 'disponivel',
    proximaRevisao: '2025-03-01',
    responsavel: 'Coordenação de Eventos'
  },
];

const abastecimentos = [
  { data: '2024-12-20', veiculo: 'QXA-1234', litros: 65, valor: 390.00, km: 25340 },
  { data: '2024-12-18', veiculo: 'QXB-5678', litros: 45, valor: 247.50, km: 45230 },
  { data: '2024-12-15', veiculo: 'QXD-3456', litros: 80, valor: 480.00, km: 18900 },
  { data: '2024-12-12', veiculo: 'QXA-1234', litros: 60, valor: 360.00, km: 24800 },
];

const VeiculosProcessoPage: React.FC = () => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const veiculosFiltrados = veiculos.filter(v => {
    const matchBusca = v.placa.toLowerCase().includes(busca.toLowerCase()) ||
                       v.modelo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      disponivel: { label: 'Disponível', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      em_uso: { label: 'Em Uso', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      manutencao: { label: 'Manutenção', variant: 'destructive', icon: <Wrench className="h-3 w-3" /> },
      reservado: { label: 'Reservado', variant: 'outline', icon: <Calendar className="h-3 w-3" /> }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline', icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/processos" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Processos
          </Link>
          <span>/</span>
          <span className="text-foreground">Veículos</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Car className="h-8 w-8 text-primary" />
              Gestão de Veículos
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de frota, abastecimentos e manutenções
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Fuel className="mr-2 h-4 w-4" />
              Novo Abastecimento
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Veículo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="frota" className="space-y-6">
          <TabsList>
            <TabsTrigger value="frota">Frota</TabsTrigger>
            <TabsTrigger value="abastecimentos">Abastecimentos</TabsTrigger>
            <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
            <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          </TabsList>

          {/* Frota */}
          <TabsContent value="frota" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por placa ou modelo..."
                      className="pl-10"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['todos', 'disponivel', 'em_uso', 'manutencao'].map((status) => (
                      <Button 
                        key={status}
                        variant={filtroStatus === status ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFiltroStatus(status)}
                      >
                        {status === 'todos' ? 'Todos' : 
                         status === 'disponivel' ? 'Disponíveis' :
                         status === 'em_uso' ? 'Em Uso' : 'Manutenção'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{veiculos.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Veículos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {veiculos.filter(v => v.status === 'disponivel').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Disponíveis</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {veiculos.filter(v => v.status === 'em_uso').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Em Uso</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {veiculos.filter(v => v.status === 'manutencao').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Em Manutenção</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Veículos */}
            <div className="grid md:grid-cols-2 gap-4">
              {veiculosFiltrados.map((veiculo) => (
                <Card key={veiculo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold text-foreground">{veiculo.placa}</span>
                          {getStatusBadge(veiculo.status)}
                        </div>
                        <p className="text-muted-foreground">{veiculo.modelo} - {veiculo.ano}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Fuel className="h-4 w-4" />
                        <span>{veiculo.combustivel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{veiculo.km.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        <span>Revisão: {formatDate(veiculo.proximaRevisao)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="truncate">{veiculo.responsavel}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        Detalhes
                      </Button>
                      {veiculo.status === 'disponivel' && (
                        <Button size="sm" className="flex-1">
                          Reservar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Abastecimentos */}
          <TabsContent value="abastecimentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Abastecimentos</CardTitle>
                <CardDescription>
                  Registro de todos os abastecimentos da frota
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abastecimentos.map((abast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Fuel className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{abast.veiculo}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(abast.data)} • {abast.litros}L • {abast.km.toLocaleString()} km
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(abast.valor)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manutenção */}
          <TabsContent value="manutencao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manutenções Programadas</CardTitle>
                <CardDescription>
                  Próximas revisões e manutenções preventivas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {veiculos
                    .sort((a, b) => new Date(a.proximaRevisao).getTime() - new Date(b.proximaRevisao).getTime())
                    .map((veiculo) => {
                      const diasParaRevisao = Math.ceil(
                        (new Date(veiculo.proximaRevisao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const urgente = diasParaRevisao <= 30;
                      
                      return (
                        <div 
                          key={veiculo.id} 
                          className={`flex items-center justify-between p-4 border rounded-lg ${
                            urgente ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${urgente ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-muted'}`}>
                              <Wrench className={`h-5 w-5 ${urgente ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <div className="font-medium">{veiculo.placa} - {veiculo.modelo}</div>
                              <div className="text-sm text-muted-foreground">
                                Próxima revisão: {formatDate(veiculo.proximaRevisao)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {urgente && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Em {diasParaRevisao} dias
                              </Badge>
                            )}
                            <Button variant="outline" size="sm">
                              Agendar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitações */}
          <TabsContent value="solicitacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Veículos</CardTitle>
                <CardDescription>
                  Gerencie as solicitações de uso de veículos
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma solicitação pendente</h3>
                <p className="text-muted-foreground mb-4">
                  As solicitações de veículos aparecerão aqui
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Solicitação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default VeiculosProcessoPage;
