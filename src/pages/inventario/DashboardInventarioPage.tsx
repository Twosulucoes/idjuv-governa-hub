/**
 * DASHBOARD DE INVENTÁRIO E PATRIMÔNIO
 * Visão geral do módulo com KPIs e ações rápidas
 */

import { Link } from "react-router-dom";
import { 
  Package, Boxes, TrendingUp, AlertTriangle, ClipboardCheck,
  Wrench, FileX, ArrowRight, BarChart3, QrCode
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEstatisticasPatrimonio, useCampanhasInventario } from "@/hooks/usePatrimonio";
import { useEstatisticasAlmoxarifado } from "@/hooks/useAlmoxarifado";

export default function DashboardInventarioPage() {
  const { data: estatisticasPatrimonio, isLoading: loadingPatrimonio } = useEstatisticasPatrimonio();
  const { data: estatisticasAlmoxarifado, isLoading: loadingAlmoxarifado } = useEstatisticasAlmoxarifado();
  const { data: campanhas } = useCampanhasInventario(new Date().getFullYear());

  const campanhaAtiva = campanhas?.find(c => c.status === 'em_andamento');

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold">Inventário e Patrimônio</h1>
              <p className="opacity-90">Gestão integrada de bens e materiais</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="py-6 -mt-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bens Patrimoniais */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Bens Patrimoniais
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

            {/* Estoque */}
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

            {/* Alertas */}
            <Card className={estatisticasAlmoxarifado?.abaixoMinimo ? 'border-warning' : ''}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas Estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {loadingAlmoxarifado ? '...' : estatisticasAlmoxarifado?.abaixoMinimo || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Itens abaixo do mínimo
                </p>
              </CardContent>
            </Card>

            {/* Requisições Pendentes */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Requisições
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingAlmoxarifado ? '...' : estatisticasAlmoxarifado?.requisicoesPendentes || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pendentes de atendimento
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Campanha de Inventário Ativa */}
      {campanhaAtiva && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{campanhaAtiva.nome}</CardTitle>
                      <CardDescription>
                        Campanha de inventário em andamento
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default">Em Andamento</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progresso: {campanhaAtiva.total_conferidos || 0} de {campanhaAtiva.total_bens_esperados || 0} bens</span>
                    <span className="font-medium">{campanhaAtiva.percentual_conclusao?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={campanhaAtiva.percentual_conclusao || 0} />
                  {campanhaAtiva.total_divergencias ? (
                    <p className="text-sm text-warning flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {campanhaAtiva.total_divergencias} divergências identificadas
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm">
                    <Link to={`/inventario/campanhas/${campanhaAtiva.id}`}>
                      Continuar Coleta
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Ações Rápidas */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-xl font-bold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/inventario/bens?acao=novo">
                <Package className="w-5 h-5" />
                <span>Novo Bem</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/inventario/movimentacoes?acao=nova">
                <TrendingUp className="w-5 h-5" />
                <span>Movimentação</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/inventario/requisicoes?acao=nova">
                <ClipboardCheck className="w-5 h-5" />
                <span>Requisição</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/inventario/campanhas">
                <QrCode className="w-5 h-5" />
                <span>Inventário</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-xl font-bold mb-4">Módulos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Patrimônio */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  Bens Patrimoniais
                </CardTitle>
                <CardDescription>
                  Cadastro, tombamento e gestão de bens permanentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/bens">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Movimentações */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-info" />
                  Movimentações
                </CardTitle>
                <CardDescription>
                  Transferências, cessões e empréstimos de bens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/movimentacoes">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Almoxarifado */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Boxes className="w-5 h-5 text-success" />
                  Almoxarifado
                </CardTitle>
                <CardDescription>
                  Controle de estoque e materiais de consumo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/almoxarifado">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Requisições */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardCheck className="w-5 h-5 text-warning" />
                  Requisições
                </CardTitle>
                <CardDescription>
                  Solicitação e atendimento de materiais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/requisicoes">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Manutenções */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="w-5 h-5 text-muted-foreground" />
                  Manutenções
                </CardTitle>
                <CardDescription>
                  Registro de manutenções preventivas e corretivas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/manutencoes">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Baixas */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileX className="w-5 h-5 text-destructive" />
                  Baixas
                </CardTitle>
                <CardDescription>
                  Desfazimento e baixa de bens patrimoniais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/baixas">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Situação por Categoria */}
      {estatisticasPatrimonio && Object.keys(estatisticasPatrimonio.porCategoria).length > 0 && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Patrimônio por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(estatisticasPatrimonio.porCategoria).map(([cat, count]) => (
                    <div key={cat} className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {cat.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
