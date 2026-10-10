import { useState } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { badgeVariants } from '@/components/ui/badge';
import { EmptyState, KpiCard, PageHeader } from '@/components/design-system';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Database, 
  Link2, 
  AlertTriangle, 
  BarChart3,
  RefreshCw,
  Zap,
  Clock,
} from 'lucide-react';
import { useDatabaseSchema, CATEGORY_COLORS } from '@/hooks/useDatabaseSchema';
import { DatabaseDiagram } from '@/components/database/DatabaseDiagram';
import { TableListTab } from '@/components/database/TableListTab';
import { RelationshipsTab } from '@/components/database/RelationshipsTab';
import { DiagnosticsTab } from '@/components/database/DiagnosticsTab';
import { TableDetailDialog } from '@/components/database/TableDetailDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DatabaseSchemaPage() {
  const { data, isLoading, isError, refetch } = useDatabaseSchema();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    setDialogOpen(true);
  };

  const handleNavigateToTable = (tableName: string) => {
    setSelectedTable(tableName);
    // Mantém o dialog aberto para navegação
  };

  const selectedTableData = data?.tables.find(t => t.name === selectedTable) || null;

  const cabecalho = (
    <PageHeader
      migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Banco de dados" }]}
      titulo="Banco de dados"
      descricao="Estrutura, relacionamentos e diagnóstico das tabelas do sistema"
      acoes={
        data ? (
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Atualizar
          </Button>
        ) : undefined
      }
    />
  );

  if (isLoading) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6">
          {cabecalho}
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-busy="true" aria-label="Carregando indicadores">
            {['Total de tabelas', 'Tabelas vazias', 'Relacionamentos', 'Alertas'].map((rotulo) => (
              <li key={rotulo}>
                <KpiCard rotulo={rotulo} valor="" carregando />
              </li>
            ))}
          </ul>
        </div>
      </ModuleLayout>
    );
  }

  if (isError || !data) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6">
          {cabecalho}
          <Card>
            <EmptyState
              icone={AlertTriangle}
              titulo="Não foi possível carregar as informações do banco."
              acao={
                <Button onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Tentar novamente
                </Button>
              }
            />
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  const categories = Object.keys(data.stats.categoryCounts).sort();
  const discoveryInfo = data.discovery;

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        {cabecalho}

        {/* Indicador de Descoberta Automática */}
        {discoveryInfo?.mode === 'automatic' && (
          <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
            <Zap className="h-5 w-5 text-success" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Descoberta automática ativa
              </p>
              <p className="text-xs text-muted-foreground">
                Novas tabelas são detectadas automaticamente via catálogo PostgreSQL
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {discoveryInfo.discoveredAt && format(new Date(discoveryInfo.discoveredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </div>
          </div>
        )}

        {/* Cards de Resumo */}
        <section aria-labelledby="banco-indicadores">
          <h2 id="banco-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <li>
              <KpiCard
                rotulo="Total de tabelas"
                icone={Database}
                className="h-full"
                valor={data.stats.totalTables}
                detalhe={`${data.stats.tablesWithData} com dados`}
              />
            </li>
            <li>
              <KpiCard
                rotulo="Tabelas vazias"
                icone={Database}
                className="h-full"
                valor={data.stats.emptyTables}
                detalhe={`${Math.round((data.stats.emptyTables / data.stats.totalTables) * 100)}% do total`}
              />
            </li>
            <li>
              <KpiCard
                rotulo="Relacionamentos"
                icone={Link2}
                className="h-full"
                valor={data.stats.totalRelationships}
                detalhe={`${data.stats.implicitRelationships} implícitos`}
              />
            </li>
            <li>
              <KpiCard
                rotulo="Alertas"
                icone={AlertTriangle}
                className="h-full"
                valor={data.diagnostics.filter(d => d.type === 'error' || d.type === 'warning').length}
                detalhe={`${data.diagnostics.filter(d => d.type === 'error').length} críticos`}
              />
            </li>
          </ul>
        </section>

        {/* Categorias por cor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-h3">Distribuição por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={selectedCategory === cat}
                  className={cn(
                    badgeVariants({ variant: 'outline' }),
                    'cursor-pointer transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                  style={{
                    borderColor: CATEGORY_COLORS[cat],
                    backgroundColor: selectedCategory === cat 
                      ? `${CATEGORY_COLORS[cat]}20` 
                      : 'transparent',
                  }}
                  onClick={() => setSelectedCategory(
                    selectedCategory === cat ? null : cat
                  )}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    aria-hidden="true"
                  />
                  {cat} ({data.stats.categoryCounts[cat]})
                </button>
              ))}
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-6 px-2 text-xs"
                >
                  Limpar filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs principais */}
        <Tabs defaultValue="diagram" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="diagram" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Diagrama
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Database className="h-4 w-4" aria-hidden="true" />
                Tabelas
              </TabsTrigger>
              <TabsTrigger value="relationships" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Relacionamentos
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Diagnóstico
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="diagram" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Diagrama de relacionamentos</CardTitle>
                    <CardDescription>
                      Visualização interativa das tabelas e suas conexões
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedCategory || 'all'}
                    onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="w-[180px]" aria-label="Filtrar categoria">
                      <SelectValue placeholder="Filtrar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas categorias</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <DatabaseDiagram
                  tables={data.tables}
                  relationships={data.relationships}
                  selectedCategory={selectedCategory}
                  onTableClick={handleTableClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de tabelas</CardTitle>
                <CardDescription>
                  Todas as tabelas do banco com informações detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TableListTab 
                  tables={data.tables} 
                  onTableClick={handleTableClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relationships" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Relacionamentos detectados</CardTitle>
                <CardDescription>
                  Conexões entre tabelas (implícitas e explícitas)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RelationshipsTab 
                  relationships={data.relationships}
                  onTableClick={handleTableClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-4">
            <DiagnosticsTab
              diagnostics={data.diagnostics}
              tables={data.tables}
              relationships={data.relationships}
              onTableClick={handleTableClick}
            />
          </TabsContent>
        </Tabs>

        {/* Dialog de detalhes da tabela */}
        <TableDetailDialog
          table={selectedTableData}
          relationships={data.relationships}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onNavigateToTable={handleNavigateToTable}
        />
      </div>
    </ModuleLayout>
  );
}
