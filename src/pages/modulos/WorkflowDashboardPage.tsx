/**
 * DASHBOARD - WORKFLOW / PROCESSOS
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Ver docs/GUIA_FRONTEND.md (Design System).
 */

import { FileText, Clock, AlertTriangle, FilePlus, Search, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useWorkflowDashboardStats, type GrupoContagem } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard, PageHeader } from "@/components/design-system";
import { Link } from "react-router-dom";

const numero = new Intl.NumberFormat("pt-BR");

interface Indicador {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  href?: string;
}

function ListaContagem({
  titulo,
  grupos,
  carregando,
  href,
}: {
  titulo: string;
  grupos: GrupoContagem[] | undefined;
  carregando: boolean;
  href: (g: GrupoContagem) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-h2 text-foreground">{titulo}</h2>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !grupos || grupos.length === 0 ? (
          <p className="text-body text-muted-foreground">Nenhum processo em andamento.</p>
        ) : (
          <ul className="divide-y divide-border">
            {grupos.map((g) => (
              <li key={`${g.modeloCodigo}-${g.etapa ?? ""}`}>
                <Link
                  to={href(g)}
                  className="flex items-center justify-between gap-3 rounded-md py-2 text-body hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate">{g.rotulo}</span>
                  <span className="font-medium tabular-nums">{numero.format(g.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function WorkflowDashboardPage() {
  const { data: stats, isLoading, isError, refetch, semLotacao } = useWorkflowDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Processos ativos", valor: valor(stats?.ativos), icone: FileText, href: "/workflow/processos?status=ativos" },
    { rotulo: "Na minha unidade", valor: valor(stats?.naMinhaUnidade), icone: Clock, href: "/workflow/processos?meus=true&status=ativos" },
    { rotulo: "Vencidos", valor: valor(stats?.vencidos), icone: AlertTriangle, href: "/workflow/processos?prazo=vencido" },
  ];

  const quickActions = [
    { label: "Novo processo", description: "Iniciar processo", href: "/workflow/processos?acao=novo", icon: FilePlus },
    { label: "Na minha unidade", description: "Processos com a minha unidade", href: "/workflow/processos?meus=true&status=ativos", icon: Clock },
    { label: "Consultar", description: "Buscar processo", href: "/workflow/processos", icon: Search },
  ];

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-6">
        <PageHeader
          titulo="Processos SEI"
          descricao="Acompanhamento dos processos que correm no SEI"
        />

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Não foi possível carregar os indicadores.
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Indicadores: os que têm tela própria levam a ela */}
        <section aria-labelledby="workflow-indicadores">
          <h2 id="workflow-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {indicadores.map((ind) => {
              const card = (
                <KpiCard
                  rotulo={ind.rotulo}
                  valor={ind.valor}
                  icone={ind.icone}
                  carregando={isLoading}
                  className="h-full"
                />
              );
              return (
                <li key={ind.rotulo}>
                  {ind.href ? (
                    <Link
                      to={ind.href}
                      className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {semLotacao && (
          <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Seu usuário não tem lotação ativa; peça ao RH. Sem lotação, "Na minha unidade" fica zerado.
            </AlertDescription>
          </Alert>
        )}

        {stats?.agrupamentoParcial && (
          <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Há muitos processos em andamento: "Por tipo" e "Por etapa" consideram só os primeiros 1.000. Os totais acima são completos.
            </AlertDescription>
          </Alert>
        )}

        {/* Por tipo e por etapa (processos aberto/em tramitação) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ListaContagem
            titulo="Por tipo"
            carregando={isLoading}
            grupos={stats?.porTipo}
            href={(g) =>
              g.modeloCodigo
                ? `/workflow/processos?tipo=${encodeURIComponent(g.modeloCodigo)}&status=ativos`
                : "/workflow/processos?status=ativos"
            }
          />
          <ListaContagem
            titulo="Por etapa"
            carregando={isLoading}
            grupos={stats?.porEtapa}
            href={(g) => `/workflow/processos?tipo=${encodeURIComponent(g.modeloCodigo)}&etapa=${g.etapa}&status=ativos`}
          />
        </div>

        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">Ações rápidas</h2>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto sm:h-auto py-4 flex flex-col items-center gap-2 whitespace-normal"
                    asChild
                  >
                    <Link to={action.href}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                      <span className="font-medium">{action.label}</span>
                      <span className="text-caption text-muted-foreground">{action.description}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
