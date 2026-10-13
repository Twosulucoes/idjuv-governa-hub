import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, FileText, Users, Clock, ClipboardList } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { GuiaProcessoModelo } from "@/components/processos/GuiaProcessoModelo";

export default function ComprasProcessoPage() {
  const { sigla } = useIdentidade();
  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Compras e contratos" }]}
          titulo="Compras e contratos"
          descricao="Processo de aquisição conforme Lei 14.133/2021"
        />

        <div className="max-w-5xl space-y-6">
          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição do processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                O processo de Compras e Contratos do {sigla} segue as diretrizes da Nova Lei 
                de Licitações (Lei 14.133/2021), garantindo a seleção da proposta mais 
                vantajosa para a Administração Pública, observando os princípios de 
                legalidade, impessoalidade, moralidade, publicidade e eficiência.
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-info border-info">
                  <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                  Prazo médio: 30-60 dias
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Users className="w-3 h-3 mr-1" aria-hidden="true" />
                  Responsável inicial: Unidade Demandante
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
                <li>• Lei nº 14.133/2021 – Nova Lei de Licitações e Contratos</li>
                <li>• Decreto Estadual de Regulamentação</li>
                <li>• Instruções Normativas do TCE-RR</li>
                <li>• Regimento Interno do {sigla}</li>
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
                  <Link to="/formularios/termo-demanda" className="flex flex-col items-start gap-1">
                    <span className="font-semibold">Termo de Demanda</span>
                    <span className="text-caption text-muted-foreground">Formalização de demandas de aquisição</span>
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
                  Complete todos os itens obrigatórios do checklist antes de seguir para a próxima etapa. Processos incompletos serão devolvidos pelo Controle Interno.
                </p>
              </div>
            </div>
          </div>

          <GuiaProcessoModelo modeloCodigo="compras" />

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
