import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { GuiaProcessoModelo } from "@/components/processos/GuiaProcessoModelo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PagamentosProcessoPage() {
  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Pagamentos" }]}
          titulo="Pagamentos"
          descricao="Liquidação e pagamento de despesas públicas"
        />

        <div className="max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição do processo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                O pagamento de despesas segue os estágios de empenho, liquidação e pagamento. O acompanhamento aqui espelha o processo que tramita no SEI.
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
                <li>• Lei nº 4.320/1964 – Normas gerais de direito financeiro</li>
              </ul>
            </CardContent>
          </Card>

          <GuiaProcessoModelo modeloCodigo="pagamentos" />

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
