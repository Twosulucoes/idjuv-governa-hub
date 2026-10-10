import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { KpiCard, PageHeader } from "@/components/design-system";
import {
  Users,
  FileText,
  Plane,
  FileCheck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";

// Só rotas registradas em src/App.tsx (o atalho "Workflow RH" apontava para
// /gabinete/workflow-rh, que não existe).
const quickActions = [
  {
    title: "Pré-cadastros",
    description: "Currículos recebidos para análise",
    icon: Users,
    route: "/gabinete/pre-cadastros",
  },
  {
    title: "Central de portarias",
    description: "Cadastrar e consultar portarias",
    icon: FileText,
    route: "/gabinete/portarias",
  },
  {
    title: "Ordem de missão",
    description: "Autorizar viagens a serviço",
    icon: Plane,
    route: "/formularios/ordem-missao",
  },
  {
    title: "Relatório de viagem",
    description: "Prestação de contas de viagens",
    icon: FileCheck,
    route: "/formularios/relatorio-viagem",
  },
];

// Indicadores ainda sem fonte de dados: mostram "—" (não um zero que pareça real).
const indicadores = [
  { rotulo: "Pré-cadastros", icone: Users },
  { rotulo: "Portarias do mês", icone: FileText },
  { rotulo: "Missões ativas", icone: Plane },
  { rotulo: "Pendências", icone: ClipboardList },
];

function GabineteDashboardContent() {
  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        <PageHeader
          titulo="Gabinete da Presidência"
          descricao="Gestão de documentos, autorizações e fluxos administrativos"
        />

        <section aria-labelledby="gabinete-indicadores">
          <h2 id="gabinete-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {indicadores.map((ind) => (
              <li key={ind.rotulo}>
                <KpiCard
                  rotulo={ind.rotulo}
                  valor="—"
                  detalhe="Indicador ainda não disponível"
                  icone={ind.icone}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">Ações rápidas</h2>
            <CardDescription>
              Acesse as principais funcionalidades do Gabinete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <li key={action.route}>
                  <Card className="relative h-full transition-colors hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <action.icon className="h-10 w-10 shrink-0 text-primary" aria-hidden="true" />
                        <div className="flex-1">
                          <h3 className="text-h3 text-foreground">
                            <Link
                              to={action.route}
                              className="after:absolute after:inset-0 focus-visible:outline-none"
                            >
                              {action.title}
                            </Link>
                          </h3>
                          <p className="text-body text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}

export default function GabineteDashboardPage() {
  return (
    <ProtectedRoute requiredModule="gabinete">
      <GabineteDashboardContent />
    </ProtectedRoute>
  );
}
