import { Link } from "react-router-dom";
import { ArrowLeft, Car, FileText } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VeiculosProcessoPage() {
  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Veículos" }]}
          titulo="Veículos"
          descricao="Controle de uso, tráfego e manutenção de veículos oficiais"
        />

        <div className="max-w-5xl space-y-6">
          <Card className="border-l-4 border-l-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-info" aria-hidden="true" />
                Base legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Instrução Normativa interna de uso de veículos oficiais</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <EmptyState
              icone={Car}
              titulo="Controle de frota ainda não implantado"
              descricao="Frota, abastecimentos, manutenções e solicitações de veículos serão disponibilizados quando o módulo for implantado."
            />
          </Card>

          <Button asChild variant="outline">
            <Link to="/processos">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
    </ModuleLayout>
  );
}
