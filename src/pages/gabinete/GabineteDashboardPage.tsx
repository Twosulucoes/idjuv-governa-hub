import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  FileText, 
  Plane, 
  FileCheck, 
  Workflow,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";

const quickActions = [
  {
    title: "Pré-Cadastros",
    description: "Currículos recebidos para análise",
    icon: Users,
    route: "/gabinete/pre-cadastros",
    color: "text-blue-600",
  },
  {
    title: "Central de Portarias",
    description: "Cadastrar e consultar portarias",
    icon: FileText,
    route: "/gabinete/portarias",
    color: "text-amber-600",
  },
  {
    title: "Ordem de Missão",
    description: "Autorizar viagens a serviço",
    icon: Plane,
    route: "/formularios/ordem-missao",
    color: "text-green-600",
  },
  {
    title: "Relatório de Viagem",
    description: "Prestação de contas de viagens",
    icon: FileCheck,
    route: "/formularios/relatorio-viagem",
    color: "text-purple-600",
  },
  {
    title: "Workflow RH",
    description: "Tramitação de processos de pessoal",
    icon: Workflow,
    route: "/gabinete/workflow-rh",
    color: "text-rose-600",
  },
];

function GabineteDashboardContent() {
  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-violet-600" />
            Gabinete da Presidência
          </h1>
          <p className="text-muted-foreground">
            Gestão de documentos, autorizações e fluxos administrativos
          </p>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-sm text-muted-foreground">Pré-cadastros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-sm text-muted-foreground">Portarias do mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Plane className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-sm text-muted-foreground">Missões ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-8 w-8 text-rose-600" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-sm text-muted-foreground">Pendências</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse as principais funcionalidades do Gabinete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.route} to={action.route}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <action.icon className={`h-10 w-10 ${action.color}`} />
                        <div className="flex-1">
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}

export default function GabineteDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <GabineteDashboardContent />
    </ProtectedRoute>
  );
}
