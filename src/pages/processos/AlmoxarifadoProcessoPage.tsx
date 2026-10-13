import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, FileText, Users, Clock, ClipboardList } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { GuiaProcessoModelo } from "@/components/processos/GuiaProcessoModelo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AlmoxarifadoProcessoPage() {
  const { sigla } = useIdentidade();
  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Almoxarifado" }]}
          titulo="Almoxarifado"
          descricao="Gestão de materiais de consumo e distribuição"
        />

        <div className="max-w-5xl space-y-6">
          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição do processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                O processo de Almoxarifado disciplina os procedimentos de controle, guarda, 
                distribuição e responsabilidade dos materiais de consumo e bens de uso comum 
                do {sigla}, conforme Instrução Normativa específica.
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-info border-info">
                  <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                  Inventário: anual
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Users className="w-3 h-3 mr-1" aria-hidden="true" />
                  Responsável: DIRAF/Almoxarifado
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Base Legal */}
          <Card className="border-l-4 border-l-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-info" aria-hidden="true" />
                Base legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• IN de Almoxarifado do {sigla} - Art. 1º ao 13</li>
                <li>• Regimento Interno do {sigla}</li>
                <li>• Instruções Normativas do TCE-RR</li>
              </ul>
            </CardContent>
          </Card>

          {/* Formulários Disponíveis */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" aria-hidden="true" />
                Formulários digitais
              </CardTitle>
              <CardDescription>
                Utilize os formulários abaixo para gerar documentos oficiais com numeração automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 justify-start">
                  <Link to="/formularios/requisicao-material" className="flex flex-col items-start gap-1">
                    <span className="font-semibold">Requisição de Material</span>
                    <span className="text-caption text-muted-foreground">Solicitação formal de materiais - Art. 7 IN</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="alerta-conformidade" role="note">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">Atenção</h3>
                <p className="text-sm text-muted-foreground">
                  A saída de material depende de requisição formal autorizada pela chefia (Art. 7º IN Almoxarifado). É vedada a retirada sem devido registro (Art. 8º).
                </p>
              </div>
            </div>
          </div>

          <GuiaProcessoModelo modeloCodigo="almoxarifado" />

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
