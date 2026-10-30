/**
 * DASHBOARD - CONTRATOS
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard).
 */

import { FileText, Calendar, CalendarClock, CalendarX2, ClipboardX, UserX, BarChart3, Globe, AlertCircle, ShoppingCart, FileCheck, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useContratosDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader } from "@/components/design-system";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const numero = new Intl.NumberFormat("pt-BR");

// Valor curto para o cartão: "R$ 1,9 mi", "R$ 480 mil"
const moedaCurta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 });

interface Indicador {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  /** Sem `href`: não há tela própria para o indicador. */
  href?: string;
}

export default function ContratosDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useContratosDashboardStats();
  const { hasAnyPermission } = useAuth();
  const PERMISSOES_LISTA = ["contratos.visualizar", "contratos.criar", "contratos.editar"];
  const podeVerLista = hasAnyPermission(PERMISSOES_LISTA);
  const lista = (prazo: string) => (podeVerLista ? `/contratos/lista?prazo=${prazo}` : undefined);
  const vencimentos = (filtro: string) => (podeVerLista ? `/contratos/vencimentos${filtro}` : undefined);

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Contratos em vigor", valor: valor(stats?.emVigor), icone: FileText, href: lista("em_vigor") },
    { rotulo: "Vencem em até 90 dias", valor: valor(stats?.vencem90), icone: Calendar, href: vencimentos("") },
    { rotulo: "Vencidos sem encerrar", valor: valor(stats?.vencidos), icone: CalendarX2, href: vencimentos("?faixa=vencido") },
    { rotulo: "Sem providência do vencimento", valor: valor(stats?.semProvidencia), icone: ClipboardX, href: vencimentos("?providencia=sem") },
    { rotulo: "Sem gestor ou fiscal", valor: valor(stats?.semResponsavel), icone: UserX, href: lista("sem_responsavel") },
    {
      rotulo: "Valor em vigor",
      valor: stats ? moedaCurta.format(stats.valorEmVigor || 0) : "—",
      icone: BarChart3,
      href: lista("em_vigor"),
    },
  ];

  // Só rotas registradas em App.tsx; aditivos ficam na ficha (C2) e execução, fiscalização e atas entram com as C3 a C6 (P21).
  // Pedidos, emissão e faturas das passagens aéreas são do Gabinete da Presidência; aqui fica só o contrato da agência.
  const quickActions: { label: string; description: string; href: string; icon: LucideIcon; permissoes?: string[] }[] = [
    { label: "Lista de contratos", description: "Vigência, gestor e fiscais", href: "/contratos/lista", icon: FileCheck, permissoes: PERMISSOES_LISTA },
    { label: "Vencimentos", description: "O que vence em 120 dias e a providência", href: "/contratos/vencimentos", icon: CalendarClock, permissoes: PERMISSOES_LISTA },
    { label: "Importar contratos", description: "Planilha dos contratos vigentes", href: "/contratos/lista?importador=contratos_planilha", icon: Upload, permissoes: ["contratos.criar"] },
    { label: "Processos de contratação", description: "Compras até virar contrato", href: "/compras/processos", icon: ShoppingCart, permissoes: ["compras.processos.visualizar", "compras.processos.editar"] },
    { label: "Contratos publicados", description: "Portal da transparência", href: "/transparencia/contratos", icon: Globe },
  ];

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        <PageHeader
          titulo="Contratos"
          descricao="Gestão e execução contratual"
          acoes={
            podeVerLista ? (
              <Button asChild>
                <Link to="/contratos/lista">
                  <FileCheck className="h-4 w-4" aria-hidden="true" />
                  Lista de contratos
                </Link>
              </Button>
            ) : undefined
          }
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
        <section aria-labelledby="contratos-indicadores">
          <h2 id="contratos-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {indicadores.map((ind) => {
              const cartao = (
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
                      {cartao}
                    </Link>
                  ) : (
                    cartao
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">Ações rápidas</h2>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {quickActions.filter((a) => !a.permissoes || hasAnyPermission(a.permissoes)).map((action) => {
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
