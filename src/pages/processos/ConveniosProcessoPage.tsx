import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { GuiaProcessoModelo } from "@/components/processos/GuiaProcessoModelo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConveniosProcessoPage() {
  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Convênios e parcerias" }]}
          titulo="Convênios e parcerias"
          descricao="Celebração, execução e prestação de contas de convênios e parcerias institucionais"
        />

        <div className="max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição do processo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Os convênios, termos de cooperação e acordos de parceria seguem o fluxo abaixo, da proposta e do plano de trabalho até a prestação de contas. O acompanhamento aqui espelha o processo que tramita no SEI.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-info" aria-hidden="true" />
                Base legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Lei nº 14.133/2021 – Nova Lei de Licitações e Contratos</li>
              </ul>
            </CardContent>
          </Card>

          <GuiaProcessoModelo modeloCodigo="convenios" />

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
