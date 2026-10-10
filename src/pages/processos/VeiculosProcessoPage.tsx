import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, KpiCard, PageHeader, StatusBadge, type TomStatus } from '@/components/design-system';
import { cn } from '@/lib/utils';
import { 
  Car, 
  Search, 
  Plus, 
  Fuel,
  Wrench,
  CheckCircle2,
  Clock,
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

// Situação do veículo → rótulo e tom do selo (status nunca só por cor)
const SITUACAO_VEICULO: Record<string, { label: string; tom: TomStatus }> = {
  disponivel: { label: 'Disponível', tom: 'sucesso' },
  em_uso: { label: 'Em uso', tom: 'andamento' },
  manutencao: { label: 'Manutenção', tom: 'pendente' },
  reservado: { label: 'Reservado', tom: 'neutro' }
};

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
    const config = SITUACAO_VEICULO[status] || { label: status, tom: 'neutro' as TomStatus };
    return <StatusBadge tom={config.tom}>{config.label}</StatusBadge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Processos', href: '/processos' }, { rotulo: 'Veículos' }]}
          titulo="Gestão de veículos"
          descricao="Controle de frota, abastecimentos e manutenções"
          acoes={
            <>
              <Button variant="outline">
                <Fuel className="h-4 w-4" aria-hidden="true" />
                Novo abastecimento
              </Button>
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Solicitar veículo
              </Button>
            </>
          }
        />

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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      placeholder="Buscar por placa ou modelo..."
                      aria-label="Buscar veículos por placa ou modelo"
                      className="pl-10"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por situação">
                    {['todos', 'disponivel', 'em_uso', 'manutencao'].map((status) => (
                      <Button 
                        key={status}
                        variant={filtroStatus === status ? 'default' : 'outline'} 
                        size="sm"
                        aria-pressed={filtroStatus === status}
                        onClick={() => setFiltroStatus(status)}
                      >
                        {status === 'todos' ? 'Todos' : 
                         status === 'disponivel' ? 'Disponíveis' :
                         status === 'em_uso' ? 'Em uso' : 'Manutenção'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard rotulo="Total de veículos" valor={veiculos.length} icone={Car} />
              <KpiCard rotulo="Disponíveis" valor={veiculos.filter(v => v.status === 'disponivel').length} icone={CheckCircle2} />
              <KpiCard rotulo="Em uso" valor={veiculos.filter(v => v.status === 'em_uso').length} icone={Clock} />
              <KpiCard rotulo="Em manutenção" valor={veiculos.filter(v => v.status === 'manutencao').length} icone={Wrench} />
            </div>

            {/* Lista de Veículos */}
            {veiculosFiltrados.length === 0 && (
              <Card>
                <EmptyState
                  icone={Car}
                  titulo="Nenhum veículo encontrado"
                  descricao="Ajuste a busca ou o filtro de situação."
                />
              </Card>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {veiculosFiltrados.map((veiculo) => (
                <Card key={veiculo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-2xl font-bold text-foreground">{veiculo.placa}</h2>
                          {getStatusBadge(veiculo.status)}
                        </div>
                        <p className="text-muted-foreground">{veiculo.modelo} - {veiculo.ano}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Car className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Fuel className="h-4 w-4" aria-hidden="true" />
                        <span>{veiculo.combustivel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span>{veiculo.km.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wrench className="h-4 w-4" aria-hidden="true" />
                        <span>Revisão: {formatDate(veiculo.proximaRevisao)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span className="truncate">{veiculo.responsavel}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1" aria-label={`Ver detalhes do veículo ${veiculo.placa}`}>
                        Detalhes
                      </Button>
                      {veiculo.status === 'disponivel' && (
                        <Button size="sm" className="flex-1" aria-label={`Reservar o veículo ${veiculo.placa}`}>
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
                <CardTitle>Histórico de abastecimentos</CardTitle>
                <CardDescription>
                  Registro de todos os abastecimentos da frota
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abastecimentos.map((abast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Fuel className="h-5 w-5 text-primary" aria-hidden="true" />
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
                <CardTitle>Manutenções programadas</CardTitle>
                <CardDescription>
                  Próximas revisões e manutenções preventivas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...veiculos]
                    .sort((a, b) => new Date(a.proximaRevisao).getTime() - new Date(b.proximaRevisao).getTime())
                    .map((veiculo) => {
                      const diasParaRevisao = Math.ceil(
                        (new Date(veiculo.proximaRevisao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const urgente = diasParaRevisao <= 30;
                      
                      return (
                        <div 
                          key={veiculo.id} 
                          className={cn(
                            'flex items-center justify-between p-4 border rounded-lg',
                            urgente ? 'border-warning bg-warning/10' : 'border-border'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn('p-2 rounded-lg', urgente ? 'bg-warning/15' : 'bg-muted')}>
                              <Wrench className={cn('h-5 w-5', urgente ? 'text-warning' : 'text-muted-foreground')} aria-hidden="true" />
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
                              <StatusBadge tom={diasParaRevisao < 0 ? 'erro' : 'pendente'}>
                                {diasParaRevisao < 0
                                  ? `Atrasada há ${-diasParaRevisao} ${diasParaRevisao === -1 ? 'dia' : 'dias'}`
                                  : `Em ${diasParaRevisao} ${diasParaRevisao === 1 ? 'dia' : 'dias'}`}
                              </StatusBadge>
                            )}
                            <Button variant="outline" size="sm" aria-label={`Agendar revisão do veículo ${veiculo.placa}`}>
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
                <CardTitle>Solicitações de veículos</CardTitle>
                <CardDescription>
                  Gerencie as solicitações de uso de veículos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icone={Car}
                  titulo="Nenhuma solicitação pendente"
                  descricao="As solicitações de veículos aparecerão aqui"
                  acao={
                    <Button variant="outline">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Nova solicitação
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default VeiculosProcessoPage;
