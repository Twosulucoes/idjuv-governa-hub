import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Loader2,
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

  if (isLoading) {
    return (
      <AdminLayout 
        title="Visualização do Banco de Dados" 
        description="Carregando informações do schema..."
      >
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !data) {
    return (
      <AdminLayout 
        title="Visualização do Banco de Dados" 
        description="Erro ao carregar informações"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">Não foi possível carregar as informações do banco.</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  const categories = Object.keys(data.stats.categoryCounts).sort();
  const discoveryInfo = data.discovery;

  return (
    <AdminLayout 
      title="Visualização do Banco de Dados" 
      description="Mapa completo das tabelas, relacionamentos e estatísticas do sistema"
    >
      <div className="space-y-6">
        {/* Indicador de Descoberta Automática */}
        {discoveryInfo?.mode === 'automatic' && (
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Zap className="h-5 w-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Descoberta Automática Ativa
              </p>
              <p className="text-xs text-muted-foreground">
                Novas tabelas são detectadas automaticamente via catálogo PostgreSQL
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {discoveryInfo.discoveredAt && format(new Date(discoveryInfo.discoveredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </div>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Total de Tabelas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.totalTables}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.tablesWithData} com dados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Database className="h-4 w-4 text-amber-500" />
                Tabelas Vazias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {data.stats.emptyTables}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((data.stats.emptyTables / data.stats.totalTables) * 100)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Link2 className="h-4 w-4" />
                Relacionamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.totalRelationships}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.implicitRelationships} implícitos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {data.diagnostics.filter(d => d.type === 'error' || d.type === 'warning').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.diagnostics.filter(d => d.type === 'error').length} críticos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categorias por cor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="cursor-pointer transition-all hover:scale-105"
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
                  />
                  {cat} ({data.stats.categoryCounts[cat]})
                </Badge>
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
                <BarChart3 className="h-4 w-4" />
                Diagrama
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Tabelas
              </TabsTrigger>
              <TabsTrigger value="relationships" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Relacionamentos
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Diagnóstico
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <TabsContent value="diagram" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Diagrama de Relacionamentos</CardTitle>
                    <CardDescription>
                      Visualização interativa das tabelas e suas conexões
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedCategory || 'all'}
                    onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="w-[180px]">
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
                <CardTitle>Lista de Tabelas</CardTitle>
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
                <CardTitle>Relacionamentos Detectados</CardTitle>
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
    </AdminLayout>
  );
}
