/**
 * RELATÓRIOS DE PATRIMÔNIO E INVENTÁRIO
 * Central de relatórios e exportações do módulo
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, FileDown, FileSpreadsheet, Package, Boxes, 
  TrendingUp, Building2, Calendar, Filter
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEstatisticasPatrimonio } from "@/hooks/usePatrimonio";
import { useEstatisticasAlmoxarifado } from "@/hooks/useAlmoxarifado";

export default function RelatoriosPatrimonioPage() {
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("mes");
  const { data: estatisticasPatrimonio, isLoading: loadingPatrimonio } = useEstatisticasPatrimonio();
  const { data: estatisticasAlmoxarifado, isLoading: loadingAlmoxarifado } = useEstatisticasAlmoxarifado();

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const relatoriosDisponiveis = [
    {
      id: "inventario-geral",
      titulo: "Inventário Geral",
      descricao: "Lista completa de todos os bens patrimoniais",
      icon: Package,
      color: "text-primary",
    },
    {
      id: "por-unidade",
      titulo: "Patrimônio por Unidade",
      descricao: "Distribuição de bens por unidade local",
      icon: Building2,
      color: "text-info",
    },
    {
      id: "movimentacoes",
      titulo: "Movimentações",
      descricao: "Histórico de transferências e cessões",
      icon: TrendingUp,
      color: "text-warning",
    },
    {
      id: "estoque-almoxarifado",
      titulo: "Estoque Almoxarifado",
      descricao: "Posição atual do estoque de materiais",
      icon: Boxes,
      color: "text-success",
    },
    {
      id: "baixas",
      titulo: "Baixas de Patrimônio",
      descricao: "Bens baixados e motivos",
      icon: FileDown,
      color: "text-destructive",
    },
    {
      id: "depreciacao",
      titulo: "Depreciação",
      descricao: "Valores contábeis e depreciação acumulada",
      icon: BarChart3,
      color: "text-muted-foreground",
    },
  ];

  return (
    <ModuleLayout module="patrimonio">
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Relatórios</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Relatórios de Patrimônio</h1>
                <p className="opacity-90 text-sm">Visualize e exporte dados do módulo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs Resumo */}
      <section className="py-6 -mt-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Total de Bens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingPatrimonio ? '...' : estatisticasPatrimonio?.totalBens || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(estatisticasPatrimonio?.valorTotal || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Boxes className="w-4 h-4" />
                  Itens em Estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAlmoxarifado ? '...' : estatisticasAlmoxarifado?.totalItens || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(estatisticasAlmoxarifado?.valorTotal || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Movimentações (Mês)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Transferências e cessões</p>
              </CardContent>
            </Card>

            <Card className={estatisticasAlmoxarifado?.abaixoMinimo ? 'border-warning' : ''}>
              <CardHeader className="pb-2">
                <CardDescription>Alertas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {estatisticasAlmoxarifado?.abaixoMinimo || 0}
                </div>
                <p className="text-xs text-muted-foreground">Itens abaixo do mínimo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lista de Relatórios */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="relatorios" className="space-y-6">
            <TabsList>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="exportacoes">Exportações</TabsTrigger>
            </TabsList>

            <TabsContent value="relatorios" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Período:</span>
                </div>
                <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Este mês</SelectItem>
                    <SelectItem value="trimestre">Trimestre</SelectItem>
                    <SelectItem value="semestre">Semestre</SelectItem>
                    <SelectItem value="ano">Este ano</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatoriosDisponiveis.map((rel) => (
                  <Card key={rel.id} className="group hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <rel.icon className={`w-5 h-5 ${rel.color}`} />
                        {rel.titulo}
                      </CardTitle>
                      <CardDescription>{rel.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileDown className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="exportacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exportação em Lote</CardTitle>
                  <CardDescription>
                    Exporte todos os dados do patrimônio para backup ou integração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <FileSpreadsheet className="w-6 h-6" />
                      <span>Exportar Patrimônio Completo (Excel)</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <FileSpreadsheet className="w-6 h-6" />
                      <span>Exportar Almoxarifado Completo (Excel)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </ModuleLayout>
  );
}
