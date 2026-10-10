/**
 * CENTRAL DE RELATÓRIOS INSTITUCIONAL
 * 
 * Ponto único de acesso a TODOS os relatórios do sistema
 * Agrupados por módulo, com busca e filtros
 * Respeita RBAC existente
 * 
 * @version 1.0.0
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  LayoutGrid,
  List,
  Users,
  Building2,
  ShoppingCart,
  FileCheck,
  Wallet,
  Package,
  Scale,
  Eye,
  Settings,
  CalendarDays,
  Trophy,
  Megaphone,
  ClipboardList,
  ChevronRight,
  Filter,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EmptyState, PageHeader } from '@/components/design-system';

// ================================
// TIPOS
// ================================

interface RelatorioItem {
  id: string;
  nome: string;
  descricao: string;
  rota: string;
  permissao?: string;
  modulo: ModuloRelatorio;
  tipo: 'pagina' | 'dialog' | 'pdf';
  tags?: string[];
}

type ModuloRelatorio = 
  | 'rh'
  | 'governanca'
  | 'transparencia'
  | 'compras'
  | 'patrimonio'
  | 'orcamento'
  | 'federacoes'
  | 'unidades'
  | 'admin'
  | 'ascom';

const MODULO_CONFIG: Record<ModuloRelatorio, { label: string; icon: React.ElementType; cor: string }> = {
  rh: { label: 'Recursos Humanos', icon: Users, cor: 'bg-primary/10 text-primary border-primary/20' },
  governanca: { label: 'Governança', icon: Scale, cor: 'bg-accent/15 text-accent border-accent/30' },
  transparencia: { label: 'Transparência', icon: Eye, cor: 'bg-success/15 text-success border-success/30' },
  compras: { label: 'Compras e Contratos', icon: ShoppingCart, cor: 'bg-warning/15 text-warning border-warning/30' },
  patrimonio: { label: 'Patrimônio', icon: Package, cor: 'bg-warning/15 text-warning border-warning/30' },
  orcamento: { label: 'Orçamento', icon: Wallet, cor: 'bg-info/15 text-info border-info/30' },
  federacoes: { label: 'Federações', icon: Trophy, cor: 'bg-destructive/10 text-destructive border-destructive/30' },
  unidades: { label: 'Unidades Locais', icon: MapPin, cor: 'bg-info/15 text-info border-info/30' },
  admin: { label: 'Administração', icon: Settings, cor: 'bg-muted text-muted-foreground border-border' },
  ascom: { label: 'Comunicação', icon: Megaphone, cor: 'bg-secondary/15 text-secondary border-secondary/30' },
};

// ================================
// CATÁLOGO DE RELATÓRIOS
// ================================

const CATALOGO_RELATORIOS: RelatorioItem[] = [
  // ========== RH ==========
  {
    id: 'rh-servidores',
    nome: 'Relatórios de Servidores',
    descricao: 'Relatórios gerais, por unidade, situação, aniversariantes',
    rota: '/rh/relatorios',
    permissao: 'rh.relatorios.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['servidores', 'funcionários', 'quadro'],
  },
  {
    id: 'rh-pendencias',
    nome: 'Diagnóstico de Pendências',
    descricao: 'Servidores com dados incompletos ou documentos pendentes',
    rota: '/rh/pendencias',
    permissao: 'rh.servidores.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['pendências', 'incompletos', 'documentos'],
  },
  {
    id: 'rh-frequencia',
    nome: 'Relatório de Frequência',
    descricao: 'Folhas de frequência mensais, abonos e faltas',
    rota: '/rh/frequencia',
    permissao: 'rh.frequencia.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['frequência', 'ponto', 'presença', 'faltas'],
  },
  {
    id: 'rh-portarias',
    nome: 'Central de Portarias',
    descricao: 'Portarias emitidas, por status e período',
    rota: '/rh/portarias',
    permissao: 'rh.portarias.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['portarias', 'nomeações', 'designações'],
  },
  {
    id: 'rh-designacoes',
    nome: 'Movimentações de Pessoal',
    descricao: 'Designações, exonerações e movimentações',
    rota: '/rh/designacoes',
    permissao: 'rh.designacoes.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['designações', 'movimentações', 'exonerações'],
  },
  {
    id: 'rh-aniversariantes',
    nome: 'Aniversariantes',
    descricao: 'Aniversariantes do mês por unidade',
    rota: '/rh/aniversariantes',
    permissao: 'rh.servidores.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['aniversário', 'datas'],
  },
  {
    id: 'rh-ferias',
    nome: 'Gestão de Férias',
    descricao: 'Férias programadas e em andamento',
    rota: '/rh/ferias',
    permissao: 'rh.ferias.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['férias', 'programação', 'gozo'],
  },
  {
    id: 'rh-licencas',
    nome: 'Gestão de Licenças',
    descricao: 'Licenças ativas e histórico',
    rota: '/rh/licencas',
    permissao: 'rh.licencas.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['licenças', 'afastamentos'],
  },
  {
    id: 'rh-viagens',
    nome: 'Gestão de Viagens',
    descricao: 'Viagens e diárias de servidores',
    rota: '/rh/viagens',
    permissao: 'rh.viagens.visualizar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['viagens', 'diárias', 'missões'],
  },
  {
    id: 'rh-exportar',
    nome: 'Exportação de Planilhas',
    descricao: 'Exportar dados de servidores em Excel/CSV',
    rota: '/rh/exportar',
    modulo: 'rh',
    tipo: 'pagina',
    tags: ['exportar', 'excel', 'csv', 'planilha'],
  },

  // ========== GOVERNANÇA ==========
  {
    id: 'gov-estrutura',
    nome: 'Estrutura Organizacional',
    descricao: 'Organograma e hierarquia institucional',
    rota: '/governanca/estrutura',
    permissao: 'governanca.estrutura.visualizar',
    modulo: 'governanca',
    tipo: 'pagina',
    tags: ['estrutura', 'organograma', 'hierarquia'],
  },
  {
    id: 'gov-relatorio',
    nome: 'Relatório de Governança',
    descricao: 'Indicadores e métricas de governança',
    rota: '/governanca/relatorio',
    modulo: 'governanca',
    tipo: 'pagina',
    tags: ['governança', 'indicadores', 'compliance'],
  },
  {
    id: 'gov-portarias',
    nome: 'Portarias Institucionais',
    descricao: 'Portarias oficiais publicadas',
    rota: '/governanca/portarias',
    permissao: 'governanca.portarias.visualizar',
    modulo: 'governanca',
    tipo: 'pagina',
    tags: ['portarias', 'oficiais', 'DOE'],
  },
  {
    id: 'gov-cargos',
    nome: 'Quadro de Cargos',
    descricao: 'Cargos, vagas e ocupação',
    rota: '/cargos',
    permissao: 'governanca.cargos.visualizar',
    modulo: 'governanca',
    tipo: 'pagina',
    tags: ['cargos', 'vagas', 'ocupação'],
  },
  {
    id: 'gov-lotacoes',
    nome: 'Lotações',
    descricao: 'Distribuição de servidores por unidade',
    rota: '/lotacoes',
    permissao: 'rh.lotacoes.visualizar',
    modulo: 'governanca',
    tipo: 'pagina',
    tags: ['lotações', 'unidades', 'distribuição'],
  },

  // ========== TRANSPARÊNCIA ==========
  {
    id: 'transp-cargos',
    nome: 'Cargos e Remuneração',
    descricao: 'Quadro de pessoal e remunerações (Lei de Acesso)',
    rota: '/transparencia/cargos',
    modulo: 'transparencia',
    tipo: 'pagina',
    tags: ['transparência', 'salários', 'remuneração', 'LAI'],
  },
  {
    id: 'transp-licitacoes',
    nome: 'Licitações Públicas',
    descricao: 'Processos licitatórios em andamento e concluídos',
    rota: '/transparencia/licitacoes',
    modulo: 'transparencia',
    tipo: 'pagina',
    tags: ['licitações', 'editais', 'pregões'],
  },
  {
    id: 'transp-contratos',
    nome: 'Contratos Públicos',
    descricao: 'Contratos vigentes e encerrados',
    rota: '/transparencia/contratos',
    modulo: 'transparencia',
    tipo: 'pagina',
    tags: ['contratos', 'fornecedores'],
  },
  {
    id: 'transp-orcamento',
    nome: 'Execução Orçamentária',
    descricao: 'Receitas, despesas e execução financeira',
    rota: '/transparencia/orcamento',
    modulo: 'transparencia',
    tipo: 'pagina',
    tags: ['orçamento', 'execução', 'despesas', 'receitas'],
  },
  {
    id: 'transp-patrimonio',
    nome: 'Patrimônio Público',
    descricao: 'Bens patrimoniais do instituto',
    rota: '/transparencia/patrimonio',
    modulo: 'transparencia',
    tipo: 'pagina',
    tags: ['patrimônio', 'bens', 'ativos'],
  },
  {
    id: 'transp-lai',
    nome: 'Portal e-SIC / LAI',
    descricao: 'Solicitações de informação e respostas',
    rota: '/transparencia/lai',
    modulo: 'transparencia',
    tipo: 'pagina',
    tags: ['LAI', 'e-SIC', 'informação', 'pedidos'],
  },

  // ========== COMPRAS ==========
  {
    id: 'compras-licitacoes',
    nome: 'Gestão de Licitações',
    descricao: 'Processos licitatórios internos',
    rota: '/processos/compras',
    permissao: 'processos.compras.visualizar',
    modulo: 'compras',
    tipo: 'pagina',
    tags: ['licitações', 'compras', 'pregão'],
  },
  {
    id: 'compras-contratos',
    nome: 'Execução Contratual',
    descricao: 'Contratos em execução e aditivos',
    rota: '/processos/compras?tab=contratos',
    permissao: 'processos.compras.visualizar',
    modulo: 'compras',
    tipo: 'pagina',
    tags: ['contratos', 'execução', 'aditivos'],
  },
  {
    id: 'compras-pagamentos',
    nome: 'Pagamentos',
    descricao: 'Controle de pagamentos e liquidações',
    rota: '/processos/pagamentos',
    permissao: 'processos.pagamentos.visualizar',
    modulo: 'compras',
    tipo: 'pagina',
    tags: ['pagamentos', 'liquidações', 'notas fiscais'],
  },

  // ========== PATRIMÔNIO ==========
  {
    id: 'pat-bens',
    nome: 'Bens Patrimoniais',
    descricao: 'Cadastro e movimentação de bens',
    rota: '/processos/patrimonio',
    permissao: 'processos.patrimonio.visualizar',
    modulo: 'patrimonio',
    tipo: 'pagina',
    tags: ['patrimônio', 'bens', 'inventário'],
  },
  {
    id: 'pat-almoxarifado',
    nome: 'Estoque / Almoxarifado',
    descricao: 'Controle de materiais e estoque',
    rota: '/processos/almoxarifado',
    permissao: 'processos.almoxarifado.visualizar',
    modulo: 'patrimonio',
    tipo: 'pagina',
    tags: ['almoxarifado', 'estoque', 'materiais'],
  },

  // ========== ORÇAMENTO ==========
  {
    id: 'orc-execucao',
    nome: 'Execução Orçamentária',
    descricao: 'Dotações e execução do orçamento',
    rota: '/transparencia/execucao',
    modulo: 'orcamento',
    tipo: 'pagina',
    tags: ['orçamento', 'dotações', 'execução'],
  },

  // ========== FEDERAÇÕES ==========
  {
    id: 'fed-gestao',
    nome: 'Gestão de Federações',
    descricao: 'Federações esportivas cadastradas',
    rota: '/admin/federacoes',
    modulo: 'federacoes',
    tipo: 'pagina',
    tags: ['federações', 'esportes', 'entidades'],
  },

  // ========== UNIDADES ==========
  {
    id: 'uni-gestao',
    nome: 'Gestão de Unidades Locais',
    descricao: 'Unidades descentralizadas e cedidas',
    rota: '/unidades',
    modulo: 'unidades',
    tipo: 'pagina',
    tags: ['unidades', 'locais', 'espaços'],
  },
  {
    id: 'uni-relatorios',
    nome: 'Relatórios de Unidades',
    descricao: 'Ocupação, patrimônio e agenda',
    rota: '/unidades/relatorios',
    modulo: 'unidades',
    tipo: 'pagina',
    tags: ['relatórios', 'unidades'],
  },
  {
    id: 'uni-cedencia',
    nome: 'Termos de Cedência',
    descricao: 'Controle de cessões e cedências',
    rota: '/unidades/cedencia',
    modulo: 'unidades',
    tipo: 'pagina',
    tags: ['cedência', 'cessão', 'termos'],
  },

  // ========== ADMIN ==========
  {
    id: 'admin-relatorio',
    nome: 'Relatório Administrativo',
    descricao: 'Métricas gerais do sistema',
    rota: '/admin/relatorio',
    modulo: 'admin',
    tipo: 'pagina',
    tags: ['admin', 'métricas', 'dashboard'],
  },
  {
    id: 'admin-auditoria',
    nome: 'Auditoria',
    descricao: 'Logs de auditoria e ações de usuários',
    rota: '/admin/auditoria',
    permissao: 'admin.auditoria',
    modulo: 'admin',
    tipo: 'pagina',
    tags: ['auditoria', 'logs', 'segurança'],
  },
  {
    id: 'admin-reunioes',
    nome: 'Relatórios de Reuniões',
    descricao: 'Atas, presenças e histórico de reuniões',
    rota: '/admin/reunioes',
    permissao: 'admin.reunioes',
    modulo: 'admin',
    tipo: 'pagina',
    tags: ['reuniões', 'atas', 'presenças'],
  },

  // ========== ASCOM ==========
  {
    id: 'ascom-demandas',
    nome: 'Demandas de Comunicação',
    descricao: 'Solicitações e demandas da ASCOM',
    rota: '/ascom/demandas',
    permissao: 'ascom.demandas.visualizar',
    modulo: 'ascom',
    tipo: 'pagina',
    tags: ['ascom', 'demandas', 'comunicação'],
  },
];

// ================================
// COMPONENTE
// ================================

export default function CentralRelatoriosPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [busca, setBusca] = useState('');
  const [moduloFiltro, setModuloFiltro] = useState<ModuloRelatorio | 'todos'>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrar relatórios baseado em permissões
  const relatoriosFiltrados = useMemo(() => {
    return CATALOGO_RELATORIOS.filter((rel) => {
      // Verificar permissão
      if (rel.permissao && !isSuperAdmin && !hasPermission(rel.permissao)) {
        return false;
      }

      // Filtrar por módulo
      if (moduloFiltro !== 'todos' && rel.modulo !== moduloFiltro) {
        return false;
      }

      // Filtrar por busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const textosBusca = [
          rel.nome,
          rel.descricao,
          ...(rel.tags || []),
          MODULO_CONFIG[rel.modulo].label,
        ].join(' ').toLowerCase();
        
        return textosBusca.includes(termo);
      }

      return true;
    });
  }, [busca, moduloFiltro, hasPermission, isSuperAdmin]);

  // Agrupar por módulo
  const relatoriosPorModulo = useMemo(() => {
    const grupos: Partial<Record<ModuloRelatorio, RelatorioItem[]>> = {};
    
    for (const rel of relatoriosFiltrados) {
      if (!grupos[rel.modulo]) {
        grupos[rel.modulo] = [];
      }
      grupos[rel.modulo]!.push(rel);
    }

    return grupos;
  }, [relatoriosFiltrados]);

  // Módulos com relatórios
  const modulosAtivos = Object.keys(relatoriosPorModulo) as ModuloRelatorio[];

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Central de relatórios" }]}
          titulo="Central de relatórios"
          descricao="Acesso rápido a todos os relatórios do sistema"
          acoes={
            <>
              <Badge variant="outline" className="text-sm" aria-live="polite">
                {relatoriosFiltrados.length} relatório(s)
              </Badge>
              <div className="flex border rounded-md" role="group" aria-label="Modo de exibição">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-2"
                  aria-label="Exibir em grade"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="px-2"
                  aria-label="Exibir em lista"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          }
        />

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  aria-label="Buscar relatórios"
                  placeholder="Buscar relatórios..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filtro por Módulo */}
              <Tabs
                value={moduloFiltro}
                onValueChange={(v) => setModuloFiltro(v as ModuloRelatorio | 'todos')}
                className="w-full sm:w-auto"
              >
                <TabsList className="flex-wrap h-auto gap-1" aria-label="Filtrar por módulo">
                  <TabsTrigger value="todos" className="text-xs">
                    Todos
                  </TabsTrigger>
                  {Object.entries(MODULO_CONFIG).map(([key, { label }]) => {
                    const hasRelatorios = relatoriosPorModulo[key as ModuloRelatorio];
                    if (!hasRelatorios && moduloFiltro === 'todos') return null;
                    
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="text-xs"
                        disabled={!hasRelatorios}
                      >
                        {label.split(' ')[0]}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          {relatoriosFiltrados.length === 0 ? (
            <Card>
              <EmptyState
                icone={FileText}
                titulo="Nenhum relatório encontrado"
                descricao="Tente ajustar os filtros ou a busca"
              />
            </Card>
          ) : viewMode === 'grid' ? (
            // View Grid (por módulo)
            <div className="space-y-6">
              {modulosAtivos.map((modulo) => {
                const config = MODULO_CONFIG[modulo];
                const ModuloIcon = config.icon;
                const relatorios = relatoriosPorModulo[modulo] || [];

                return (
                  <div key={modulo}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn('p-1.5 rounded-md border', config.cor)}>
                        <ModuloIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <h2 className="text-h3 text-foreground">{config.label}</h2>
                      <Badge variant="secondary" className="text-caption">
                        {relatorios.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {relatorios.map((rel) => (
                        <Link
                          key={rel.id}
                          to={rel.rota}
                          className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span className="truncate">{rel.nome}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <CardDescription className="text-caption line-clamp-2">
                                {rel.descricao}
                              </CardDescription>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // View Lista (accordion)
            <Accordion type="multiple" defaultValue={modulosAtivos} className="space-y-2">
              {modulosAtivos.map((modulo) => {
                const config = MODULO_CONFIG[modulo];
                const ModuloIcon = config.icon;
                const relatorios = relatoriosPorModulo[modulo] || [];

                return (
                  <AccordionItem key={modulo} value={modulo} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-1.5 rounded-md border', config.cor)}>
                          <ModuloIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="secondary" className="text-caption">
                          {relatorios.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pb-2">
                        {relatorios.map((rel) => (
                          <Link
                            key={rel.id}
                            to={rel.rota}
                            className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{rel.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">{rel.descricao}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>
      </div>
    </ModuleLayout>
  );
}
