import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  MapPin,
  Package,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
  Search,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tipos
interface UnidadeRelatorio {
  id: string;
  codigo_unidade: string;
  nome_unidade: string;
  tipo_unidade: string;
  municipio: string;
  endereco_completo: string | null;
  status: string;
  natureza_uso: string | null;
  diretoria_vinculada: string | null;
  unidade_administrativa: string | null;
  autoridade_autorizadora: string | null;
  capacidade: number | null;
  horario_funcionamento: string | null;
  estrutura_disponivel: string | null;
  areas_disponiveis: string[];
  regras_de_uso: string | null;
  observacoes: string | null;
  fotos: string[];
  documentos: string[];
  created_at: string;
  updated_at: string;
  chefe_atual_id: string | null;
  chefe_atual_nome: string | null;
  chefe_atual_cargo: string | null;
  chefe_ato_numero: string | null;
  chefe_data_inicio: string | null;
  total_patrimonio: number;
  patrimonio_valor_total: number;
  patrimonio_bom_estado: number;
  patrimonio_manutencao: number;
  total_agendamentos: number;
  agendamentos_aprovados: number;
  agendamentos_pendentes: number;
  total_termos_cessao: number;
  termos_vigentes: number;
}

// Labels
const TIPO_UNIDADE_LABELS: Record<string, string> = {
  ginasio: 'Ginásio',
  estadio: 'Estádio',
  parque_aquatico: 'Parque Aquático',
  piscina: 'Piscina',
  complexo: 'Complexo Esportivo',
  quadra: 'Quadra',
  outro: 'Outro'
};

const STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
  manutencao: 'Em Manutenção',
  interditada: 'Interditada'
};

const NATUREZA_LABELS: Record<string, string> = {
  esportivo: 'Esportivo',
  cultural: 'Cultural',
  misto: 'Misto',
  lazer: 'Lazer'
};

const MUNICIPIOS_RORAIMA = [
  'Alto Alegre', 'Amajari', 'Boa Vista', 'Bonfim', 'Cantá',
  'Caracaraí', 'Caroebe', 'Iracema', 'Mucajaí', 'Normandia',
  'Pacaraima', 'Rorainópolis', 'São João da Baliza', 'São Luiz', 'Uiramutã'
];

// Componente de estatísticas
const StatCard = ({ title, value, icon: Icon, description, variant = 'default' }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const variantClasses = {
    default: 'bg-card border-border',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    danger: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
  };

  return (
    <Card className={`${variantClasses[variant]} transition-shadow hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function RelatoriosUnidadesLocaisContent() {
  const [unidades, setUnidades] = useState<UnidadeRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMunicipio, setFilterMunicipio] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNatureza, setFilterNatureza] = useState<string>('all');
  const [filterDiretoria, setFilterDiretoria] = useState<string>('all');
  const [filterComChefe, setFilterComChefe] = useState<boolean | 'all'>('all');
  const [filterComPatrimonio, setFilterComPatrimonio] = useState<boolean | 'all'>('all');
  const [filterComAgendamentos, setFilterComAgendamentos] = useState<boolean | 'all'>('all');
  
  // Colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState({
    codigo: true,
    nome: true,
    tipo: true,
    municipio: true,
    status: true,
    chefe: true,
    patrimonio: true,
    agendamentos: true,
    termos: false,
    diretoria: false,
    capacidade: false,
    natureza: false
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_relatorio_unidades_locais')
        .select('*')
        .order('municipio')
        .order('nome_unidade');

      if (error) throw error;
      setUnidades((data as any[]) || []);
    } catch (error: any) {
      console.error('Erro ao carregar unidades:', error);
      toast.error('Erro ao carregar dados das unidades');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar unidades
  const filteredUnidades = useMemo(() => {
    return unidades.filter(u => {
      // Busca textual
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchSearch = 
          u.nome_unidade?.toLowerCase().includes(search) ||
          u.codigo_unidade?.toLowerCase().includes(search) ||
          u.municipio?.toLowerCase().includes(search) ||
          u.chefe_atual_nome?.toLowerCase().includes(search);
        if (!matchSearch) return false;
      }

      // Filtros de select
      if (filterMunicipio !== 'all' && u.municipio !== filterMunicipio) return false;
      if (filterTipo !== 'all' && u.tipo_unidade !== filterTipo) return false;
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;
      if (filterNatureza !== 'all' && u.natureza_uso !== filterNatureza) return false;
      if (filterDiretoria !== 'all' && u.diretoria_vinculada !== filterDiretoria) return false;

      // Filtros booleanos
      if (filterComChefe === true && !u.chefe_atual_id) return false;
      if (filterComChefe === false && u.chefe_atual_id) return false;
      if (filterComPatrimonio === true && u.total_patrimonio === 0) return false;
      if (filterComPatrimonio === false && u.total_patrimonio > 0) return false;
      if (filterComAgendamentos === true && u.total_agendamentos === 0) return false;
      if (filterComAgendamentos === false && u.total_agendamentos > 0) return false;

      return true;
    });
  }, [unidades, searchTerm, filterMunicipio, filterTipo, filterStatus, filterNatureza, filterDiretoria, filterComChefe, filterComPatrimonio, filterComAgendamentos]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredUnidades.length;
    const ativas = filteredUnidades.filter(u => u.status === 'ativa').length;
    const manutencao = filteredUnidades.filter(u => u.status === 'manutencao').length;
    const interditadas = filteredUnidades.filter(u => u.status === 'interditada').length;
    const comChefe = filteredUnidades.filter(u => u.chefe_atual_id).length;
    const semChefe = total - comChefe;
    const totalPatrimonio = filteredUnidades.reduce((acc, u) => acc + u.total_patrimonio, 0);
    const valorPatrimonio = filteredUnidades.reduce((acc, u) => acc + u.patrimonio_valor_total, 0);
    const totalAgendamentos = filteredUnidades.reduce((acc, u) => acc + u.total_agendamentos, 0);
    const agendamentosPendentes = filteredUnidades.reduce((acc, u) => acc + u.agendamentos_pendentes, 0);
    const termosVigentes = filteredUnidades.reduce((acc, u) => acc + u.termos_vigentes, 0);
    
    // Por tipo
    const porTipo = Object.keys(TIPO_UNIDADE_LABELS).map(tipo => ({
      tipo,
      label: TIPO_UNIDADE_LABELS[tipo],
      quantidade: filteredUnidades.filter(u => u.tipo_unidade === tipo).length
    })).filter(t => t.quantidade > 0);

    // Por município
    const porMunicipio = MUNICIPIOS_RORAIMA.map(mun => ({
      municipio: mun,
      quantidade: filteredUnidades.filter(u => u.municipio === mun).length
    })).filter(m => m.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade);

    return {
      total, ativas, manutencao, interditadas, comChefe, semChefe,
      totalPatrimonio, valorPatrimonio, totalAgendamentos, agendamentosPendentes,
      termosVigentes, porTipo, porMunicipio
    };
  }, [filteredUnidades]);

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterMunicipio('all');
    setFilterTipo('all');
    setFilterStatus('all');
    setFilterNatureza('all');
    setFilterDiretoria('all');
    setFilterComChefe('all');
    setFilterComPatrimonio('all');
    setFilterComAgendamentos('all');
  };

  const hasActiveFilters = searchTerm || filterMunicipio !== 'all' || filterTipo !== 'all' || 
    filterStatus !== 'all' || filterNatureza !== 'all' || filterDiretoria !== 'all' ||
    filterComChefe !== 'all' || filterComPatrimonio !== 'all' || filterComAgendamentos !== 'all';

  // Exportar dados
  const exportToCSV = () => {
    const headers = [
      'Código', 'Nome', 'Tipo', 'Município', 'Status', 'Natureza',
      'Diretoria', 'Chefe Atual', 'Total Patrimônio', 'Valor Patrimônio',
      'Total Agendamentos', 'Termos Vigentes', 'Capacidade', 'Endereço'
    ];

    const rows = filteredUnidades.map(u => [
      u.codigo_unidade,
      u.nome_unidade,
      TIPO_UNIDADE_LABELS[u.tipo_unidade] || u.tipo_unidade,
      u.municipio,
      STATUS_LABELS[u.status] || u.status,
      u.natureza_uso ? NATUREZA_LABELS[u.natureza_uso] || u.natureza_uso : '',
      u.diretoria_vinculada || '',
      u.chefe_atual_nome || '',
      u.total_patrimonio,
      u.patrimonio_valor_total.toFixed(2),
      u.total_agendamentos,
      u.termos_vigentes,
      u.capacidade || '',
      u.endereco_completo || ''
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-unidades-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado com sucesso!');
  };

  // Diretorias únicas
  const diretorias = useMemo(() => {
    return [...new Set(unidades.map(u => u.diretoria_vinculada).filter(Boolean))];
  }, [unidades]);

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'manutencao': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'interditada': return <Ban className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Relatórios de Unidades Locais
          </h1>
          <p className="text-muted-foreground">
            Visão completa do acervo de unidades esportivas e culturais
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUnidades}>
            <Loader2 className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total de Unidades"
          value={stats.total}
          icon={Building2}
        />
        <StatCard
          title="Ativas"
          value={stats.ativas}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Em Manutenção"
          value={stats.manutencao}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Sem Chefe"
          value={stats.semChefe}
          icon={Users}
          variant={stats.semChefe > 0 ? 'danger' : 'default'}
        />
        <StatCard
          title="Itens de Patrimônio"
          value={stats.totalPatrimonio}
          icon={Package}
        />
        <StatCard
          title="Agendamentos Pendentes"
          value={stats.agendamentosPendentes}
          icon={Calendar}
          variant={stats.agendamentosPendentes > 0 ? 'warning' : 'default'}
        />
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">
            <FileText className="h-4 w-4 mr-2" />
            Lista Detalhada
          </TabsTrigger>
          <TabsTrigger value="resumo">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumo por Categoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filtros */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <CardTitle className="text-lg">Filtros</CardTitle>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredUnidades.length} de {unidades.length}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, código, município ou chefe..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filtros principais */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <Label>Município</Label>
                      <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {MUNICIPIOS_RORAIMA.map(mun => (
                            <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <Select value={filterTipo} onValueChange={setFilterTipo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {Object.entries(TIPO_UNIDADE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Natureza de Uso</Label>
                      <Select value={filterNatureza} onValueChange={setFilterNatureza}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {Object.entries(NATUREZA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Diretoria</Label>
                      <Select value={filterDiretoria} onValueChange={setFilterDiretoria}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {diretorias.map(dir => (
                            <SelectItem key={dir} value={dir!}>{dir}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filtros avançados */}
                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Label>Com chefe:</Label>
                      <Select 
                        value={filterComChefe === 'all' ? 'all' : filterComChefe ? 'sim' : 'nao'}
                        onValueChange={(v) => setFilterComChefe(v === 'all' ? 'all' : v === 'sim')}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label>Com patrimônio:</Label>
                      <Select 
                        value={filterComPatrimonio === 'all' ? 'all' : filterComPatrimonio ? 'sim' : 'nao'}
                        onValueChange={(v) => setFilterComPatrimonio(v === 'all' ? 'all' : v === 'sim')}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label>Com agendamentos:</Label>
                      <Select 
                        value={filterComAgendamentos === 'all' ? 'all' : filterComAgendamentos ? 'sim' : 'nao'}
                        onValueChange={(v) => setFilterComAgendamentos(v === 'all' ? 'all' : v === 'sim')}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      {visibleColumns.codigo && <TableHead className="w-28">Código</TableHead>}
                      {visibleColumns.nome && <TableHead>Nome</TableHead>}
                      {visibleColumns.tipo && <TableHead className="w-32">Tipo</TableHead>}
                      {visibleColumns.municipio && <TableHead className="w-32">Município</TableHead>}
                      {visibleColumns.status && <TableHead className="w-28">Status</TableHead>}
                      {visibleColumns.chefe && <TableHead>Chefe Atual</TableHead>}
                      {visibleColumns.patrimonio && <TableHead className="w-24 text-center">Patrimônio</TableHead>}
                      {visibleColumns.agendamentos && <TableHead className="w-28 text-center">Agendamentos</TableHead>}
                      {visibleColumns.termos && <TableHead className="w-20 text-center">Termos</TableHead>}
                      {visibleColumns.diretoria && <TableHead>Diretoria</TableHead>}
                      {visibleColumns.capacidade && <TableHead className="w-24 text-center">Capacidade</TableHead>}
                      {visibleColumns.natureza && <TableHead className="w-28">Natureza</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnidades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                          Nenhuma unidade encontrada com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnidades.map((unidade) => (
                        <TableRow key={unidade.id} className="hover:bg-muted/50">
                          {visibleColumns.codigo && (
                            <TableCell className="font-mono text-sm">
                              {unidade.codigo_unidade}
                            </TableCell>
                          )}
                          {visibleColumns.nome && (
                            <TableCell className="font-medium">
                              {unidade.nome_unidade}
                            </TableCell>
                          )}
                          {visibleColumns.tipo && (
                            <TableCell>
                              <Badge variant="outline">
                                {TIPO_UNIDADE_LABELS[unidade.tipo_unidade] || unidade.tipo_unidade}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleColumns.municipio && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {unidade.municipio}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.status && (
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getStatusIcon(unidade.status)}
                                <span className="text-sm">
                                  {STATUS_LABELS[unidade.status] || unidade.status}
                                </span>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.chefe && (
                            <TableCell>
                              {unidade.chefe_atual_nome ? (
                                <div>
                                  <p className="text-sm font-medium">{unidade.chefe_atual_nome}</p>
                                  <p className="text-xs text-muted-foreground">{unidade.chefe_atual_cargo}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm italic">Sem chefe</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.patrimonio && (
                            <TableCell className="text-center">
                              {unidade.total_patrimonio > 0 ? (
                                <div>
                                  <span className="font-medium">{unidade.total_patrimonio}</span>
                                  <p className="text-xs text-muted-foreground">
                                    R$ {unidade.patrimonio_valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.agendamentos && (
                            <TableCell className="text-center">
                              {unidade.total_agendamentos > 0 ? (
                                <div>
                                  <span className="font-medium">{unidade.total_agendamentos}</span>
                                  {unidade.agendamentos_pendentes > 0 && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      {unidade.agendamentos_pendentes} pend.
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.termos && (
                            <TableCell className="text-center">
                              {unidade.termos_vigentes > 0 ? (
                                <Badge variant="secondary">{unidade.termos_vigentes}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.diretoria && (
                            <TableCell>{unidade.diretoria_vinculada || '-'}</TableCell>
                          )}
                          {visibleColumns.capacidade && (
                            <TableCell className="text-center">
                              {unidade.capacidade || '-'}
                            </TableCell>
                          )}
                          {visibleColumns.natureza && (
                            <TableCell>
                              {unidade.natureza_uso ? NATUREZA_LABELS[unidade.natureza_uso] || unidade.natureza_uso : '-'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Por Tipo de Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.porTipo.map(item => (
                    <div key={item.tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.quantidade}</Badge>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {((item.quantidade / stats.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Município */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Por Município
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {stats.porMunicipio.map(item => (
                      <div key={item.municipio} className="flex items-center justify-between">
                        <span>{item.municipio}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.quantidade}</Badge>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(item.quantidade / stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Patrimônio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Resumo do Patrimônio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{stats.totalPatrimonio}</p>
                      <p className="text-sm text-muted-foreground">Total de Itens</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        R$ {stats.valorPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Unidades com patrimônio</span>
                      <span className="font-medium">
                        {filteredUnidades.filter(u => u.total_patrimonio > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unidades sem patrimônio</span>
                      <span className="font-medium">
                        {filteredUnidades.filter(u => u.total_patrimonio === 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agendamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Resumo de Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{stats.totalAgendamentos}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                        {stats.agendamentosPendentes}
                      </p>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Termos de cessão vigentes</span>
                      <span className="font-medium">{stats.termosVigentes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unidades com agendamentos</span>
                      <span className="font-medium">
                        {filteredUnidades.filter(u => u.total_agendamentos > 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function RelatoriosUnidadesLocaisPage() {
  return (
    <ProtectedRoute allowedRoles={['manager', 'admin']}>
      <AdminLayout>
        <RelatoriosUnidadesLocaisContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
