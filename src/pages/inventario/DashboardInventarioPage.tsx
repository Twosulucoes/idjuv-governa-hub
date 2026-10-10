/**
 * DASHBOARD DE INVENTÁRIO E PATRIMÔNIO
 * Visão geral do módulo com KPIs e ações rápidas
 * Padrões do design system: PageHeader, KpiCard, StatusBadge.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Package, Boxes, TrendingUp, AlertTriangle, ClipboardCheck,
  Wrench, FileX, ArrowRight, BarChart3, QrCode, PackagePlus, ArrowRightLeft, AlertCircle
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KpiCard, PageHeader, StatusBadge } from "@/components/design-system";
import { useEstatisticasPatrimonio, useCampanhasInventario } from "@/hooks/usePatrimonio";
import { useEstatisticasAlmoxarifado } from "@/hooks/useAlmoxarifado";
import { CadastroLoteDialog } from "@/components/inventario/CadastroLoteDialog";
import { MovimentacaoLoteDialog } from "@/components/inventario/MovimentacaoLoteDialog";

export default function DashboardInventarioPage() {
  const [cadastroLoteOpen, setCadastroLoteOpen] = useState(false);
  const [movimentacaoLoteOpen, setMovimentacaoLoteOpen] = useState(false);
  
  const {
    data: estatisticasPatrimonio,
    isLoading: loadingPatrimonio,
    isError: erroPatrimonio,
    refetch: refetchPatrimonio,
  } = useEstatisticasPatrimonio();
  const {
    data: estatisticasAlmoxarifado,
    isLoading: loadingAlmoxarifado,
    isError: erroAlmoxarifado,
    refetch: refetchAlmoxarifado,
  } = useEstatisticasAlmoxarifado();
  const { data: campanhas } = useCampanhasInventario(new Date().getFullYear());

  const campanhaAtiva = campanhas?.find(c => c.status === 'em_andamento');

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Valor do indicador com linha de apoio (valor em reais ou explicação)
  const valorComApoio = (valor: number | string, apoio: string) => (
    <>
      {valor}
      <span className="block text-caption font-normal text-muted-foreground">{apoio}</span>
    </>
  );

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário" }]}
          titulo="Inventário e patrimônio"
          descricao="Gestão integrada de bens e materiais"
          acoes={
            <Button asChild>
              <Link to="/inventario/bens?acao=novo">
                <Package className="h-4 w-4" aria-hidden="true" />
                Novo bem
              </Link>
            </Button>
          }
        />

        {(erroPatrimonio || erroAlmoxarifado) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Não foi possível carregar os indicadores.
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (erroPatrimonio) refetchPatrimonio();
                  if (erroAlmoxarifado) refetchAlmoxarifado();
                }}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs */}
        <section aria-labelledby="inventario-indicadores">
          <h2 id="inventario-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <li>
              <KpiCard
                rotulo="Bens patrimoniais"
                icone={Package}
                carregando={loadingPatrimonio}
                valor={valorComApoio(estatisticasPatrimonio?.totalBens || 0, formatCurrency(estatisticasPatrimonio?.valorTotal || 0))}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Itens em estoque"
                icone={Boxes}
                carregando={loadingAlmoxarifado}
                valor={valorComApoio(estatisticasAlmoxarifado?.totalItens || 0, formatCurrency(estatisticasAlmoxarifado?.valorTotal || 0))}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Alertas de estoque"
                icone={AlertTriangle}
                carregando={loadingAlmoxarifado}
                valor={valorComApoio(estatisticasAlmoxarifado?.abaixoMinimo || 0, "Itens abaixo do mínimo")}
                className={estatisticasAlmoxarifado?.abaixoMinimo ? 'h-full border-warning' : 'h-full'}
              />
            </li>
            <li>
              <KpiCard
                rotulo="Requisições"
                icone={ClipboardCheck}
                carregando={loadingAlmoxarifado}
                valor={valorComApoio(estatisticasAlmoxarifado?.requisicoesPendentes || 0, "Pendentes de atendimento")}
                className="h-full"
              />
            </li>
          </ul>
        </section>

        {/* Campanha de Inventário Ativa */}
        {campanhaAtiva && (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <QrCode className="w-6 h-6 text-primary" aria-hidden="true" />
                  <div>
                    <h2 className="text-h3 text-foreground">{campanhaAtiva.nome}</h2>
                    <CardDescription>
                      Campanha de inventário em andamento
                    </CardDescription>
                  </div>
                </div>
                <StatusBadge tom="andamento">Em andamento</StatusBadge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progresso: {campanhaAtiva.total_conferidos || 0} de {campanhaAtiva.total_bens_esperados || 0} bens</span>
                  <span className="font-medium tabular-nums">{campanhaAtiva.percentual_conclusao?.toFixed(1) || 0}%</span>
                </div>
                <Progress
                  value={campanhaAtiva.percentual_conclusao || 0}
                  aria-label={`Progresso da campanha ${campanhaAtiva.nome}`}
                />
                {campanhaAtiva.total_divergencias ? (
                  <p className="text-sm text-warning flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    {campanhaAtiva.total_divergencias} divergências identificadas
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link to={`/inventario/campanhas/${campanhaAtiva.id}`}>
                    Continuar coleta
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações Rápidas */}
        <section aria-labelledby="inventario-acoes">
          <h2 id="inventario-acoes" className="text-h2 text-foreground mb-4">Ações rápidas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Button asChild variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal">
              <Link to="/inventario/bens?acao=novo">
                <Package className="w-5 h-5" aria-hidden="true" />
                <span>Novo bem</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal" onClick={() => setCadastroLoteOpen(true)}>
              <PackagePlus className="w-5 h-5" aria-hidden="true" />
              <span>Cadastro em lote</span>
            </Button>
            <Button asChild variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal">
              <Link to="/inventario/movimentacoes?acao=nova">
                <TrendingUp className="w-5 h-5" aria-hidden="true" />
                <span>Movimentação</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal" onClick={() => setMovimentacaoLoteOpen(true)}>
              <ArrowRightLeft className="w-5 h-5" aria-hidden="true" />
              <span>Movimentação em lote</span>
            </Button>
            <Button asChild variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal">
              <Link to="/inventario/requisicoes?acao=nova">
                <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
                <span>Requisição</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto sm:h-auto py-4 flex-col gap-2 whitespace-normal">
              <Link to="/inventario/campanhas">
                <QrCode className="w-5 h-5" aria-hidden="true" />
                <span>Inventário</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Dialogs de Lote */}
        <CadastroLoteDialog open={cadastroLoteOpen} onOpenChange={setCadastroLoteOpen} />
        <MovimentacaoLoteDialog open={movimentacaoLoteOpen} onOpenChange={setMovimentacaoLoteOpen} />

        {/* Módulos */}
        <section aria-labelledby="inventario-modulos">
          <h2 id="inventario-modulos" className="text-h2 text-foreground mb-4">Módulos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Patrimônio */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <Package className="w-5 h-5 text-primary" aria-hidden="true" />
                  Bens patrimoniais
                </CardTitle>
                <CardDescription>
                  Cadastro, tombamento e gestão de bens permanentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/bens">
                    Acessar<span className="sr-only"> Bens patrimoniais</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Movimentações */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <TrendingUp className="w-5 h-5 text-info" aria-hidden="true" />
                  Movimentações
                </CardTitle>
                <CardDescription>
                  Transferências, cessões e empréstimos de bens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/movimentacoes">
                    Acessar<span className="sr-only"> Movimentações</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Almoxarifado */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <Boxes className="w-5 h-5 text-success" aria-hidden="true" />
                  Almoxarifado
                </CardTitle>
                <CardDescription>
                  Controle de estoque e materiais de consumo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/almoxarifado">
                    Acessar<span className="sr-only"> Almoxarifado</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Requisições */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <ClipboardCheck className="w-5 h-5 text-warning" aria-hidden="true" />
                  Requisições
                </CardTitle>
                <CardDescription>
                  Solicitação e atendimento de materiais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/requisicoes">
                    Acessar<span className="sr-only"> Requisições</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Manutenções */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <Wrench className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  Manutenções
                </CardTitle>
                <CardDescription>
                  Registro de manutenções preventivas e corretivas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/manutencoes">
                    Acessar<span className="sr-only"> Manutenções</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Baixas */}
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h3">
                  <FileX className="w-5 h-5 text-destructive" aria-hidden="true" />
                  Baixas
                </CardTitle>
                <CardDescription>
                  Desfazimento e baixa de bens patrimoniais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="w-full justify-between">
                  <Link to="/inventario/baixas">
                    Acessar<span className="sr-only"> Baixas</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Situação por Categoria */}
        {estatisticasPatrimonio && Object.keys(estatisticasPatrimonio.porCategoria).length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-h2 text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5" aria-hidden="true" />
                Patrimônio por categoria
              </h2>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(estatisticasPatrimonio.porCategoria).map(([cat, count]) => (
                  <li key={cat} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-xl font-bold tabular-nums">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {cat.replace('_', ' ')}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ModuleLayout>
  );
}
