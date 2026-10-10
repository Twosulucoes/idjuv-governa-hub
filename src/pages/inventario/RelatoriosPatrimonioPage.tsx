/**
 * RELATÓRIOS DE PATRIMÔNIO E INVENTÁRIO
 * Central de relatórios e exportações do módulo
 * Padrões do design system: PageHeader, KpiCard.
 */

import { useState } from "react";
import { 
  BarChart3, FileDown, FileSpreadsheet, Package, Boxes, 
  TrendingUp, Building2, Filter, AlertTriangle
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard, PageHeader } from "@/components/design-system";
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
      titulo: "Inventário geral",
      descricao: "Lista completa de todos os bens patrimoniais",
      icon: Package,
      color: "text-primary",
    },
    {
      id: "por-unidade",
      titulo: "Patrimônio por unidade",
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
      titulo: "Estoque do almoxarifado",
      descricao: "Posição atual do estoque de materiais",
      icon: Boxes,
      color: "text-success",
    },
    {
      id: "baixas",
      titulo: "Baixas de patrimônio",
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
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Relatórios" }]}
          titulo="Relatórios de patrimônio"
          descricao="Visualize e exporte dados do módulo"
        />

        {/* KPIs Resumo */}
        <section aria-labelledby="relatorios-indicadores">
          <h2 id="relatorios-indicadores" className="sr-only">Resumo</h2>
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <li>
              <KpiCard
                rotulo="Total de bens"
                icone={Package}
                carregando={loadingPatrimonio}
                valor={
                  <>
                    {estatisticasPatrimonio?.totalBens || 0}
                    <span className="block text-caption font-normal text-muted-foreground">
                      {formatCurrency(estatisticasPatrimonio?.valorTotal || 0)}
                    </span>
                  </>
                }
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Itens em estoque"
                icone={Boxes}
                carregando={loadingAlmoxarifado}
                valor={
                  <>
                    {estatisticasAlmoxarifado?.totalItens || 0}
                    <span className="block text-caption font-normal text-muted-foreground">
                      {formatCurrency(estatisticasAlmoxarifado?.valorTotal || 0)}
                    </span>
                  </>
                }
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Movimentações (mês)"
                icone={TrendingUp}
                valor={
                  <>
                    0
                    <span className="block text-caption font-normal text-muted-foreground">Transferências e cessões</span>
                  </>
                }
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Alertas"
                icone={AlertTriangle}
                carregando={loadingAlmoxarifado}
                valor={
                  <>
                    {estatisticasAlmoxarifado?.abaixoMinimo || 0}
                    <span className="block text-caption font-normal text-muted-foreground">Itens abaixo do mínimo</span>
                  </>
                }
                className={estatisticasAlmoxarifado?.abaixoMinimo ? 'h-full border-warning' : 'h-full'}
              />
            </li>
          </ul>
        </section>

        {/* Lista de Relatórios */}
        <section aria-label="Relatórios e exportações">
          <Tabs defaultValue="relatorios" className="space-y-6">
            <TabsList>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="exportacoes">Exportações</TabsTrigger>
            </TabsList>

            <TabsContent value="relatorios" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <span id="relatorios-periodo" className="text-sm">Período:</span>
                </div>
                <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                  <SelectTrigger className="w-40" aria-labelledby="relatorios-periodo">
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
                      <CardTitle className="flex items-center gap-2 text-h3">
                        <rel.icon className={`w-5 h-5 ${rel.color}`} aria-hidden="true" />
                        {rel.titulo}
                      </CardTitle>
                      <CardDescription>{rel.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" aria-label={`Baixar ${rel.titulo} em PDF`}>
                          <FileDown className="w-4 h-4 mr-2" aria-hidden="true" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" aria-label={`Baixar ${rel.titulo} em Excel`}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" aria-hidden="true" />
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
                  <CardTitle className="text-h3">Exportação em lote</CardTitle>
                  <CardDescription>
                    Exporte todos os dados do patrimônio para backup ou integração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal">
                      <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
                      <span>Exportar patrimônio completo (Excel)</span>
                    </Button>
                    <Button variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal">
                      <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
                      <span>Exportar almoxarifado completo (Excel)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </ModuleLayout>
  );
}
