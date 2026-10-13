import { Link } from "react-router-dom";
import { ArrowLeft, Users, Clock, ClipboardList } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { GuiaProcessoModelo } from "@/components/processos/GuiaProcessoModelo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatrimonioProcessoPage() {
  const { sigla } = useIdentidade();
  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Processos", href: "/processos" }, { rotulo: "Patrimônio" }]}
          titulo="Patrimônio"
          descricao={`Gestão de bens patrimoniais do ${sigla}`}
        />

        <div className="max-w-5xl space-y-6">
          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição do processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                A gestão patrimonial do {sigla} compreende o conjunto de atividades relacionadas 
                ao tombamento e à baixa de bens permanentes. 
                Todo bem deve ter responsável designado através de Termo de Responsabilidade.
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-info border-info">
                  <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                  Bens permanentes: tombamento e baixa
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Users className="w-3 h-3 mr-1" aria-hidden="true" />
                  Responsável: DIRAF/NuPat
                </Badge>
              </div>
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
                  <Link to="/formularios/termo-responsabilidade" className="flex flex-col items-start gap-1">
                    <span className="font-semibold">Termo de Responsabilidade</span>
                    <span className="text-caption text-muted-foreground">Guarda de bens patrimoniais - Art. 7 IN</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="tombamento">
            <TabsList className="mb-6">
              <TabsTrigger value="tombamento">Tombamento</TabsTrigger>
              <TabsTrigger value="baixa">Baixa</TabsTrigger>
            </TabsList>
            <TabsContent value="tombamento">
              <GuiaProcessoModelo modeloCodigo="patrimonio_tombamento" />
            </TabsContent>
            <TabsContent value="baixa">
              <GuiaProcessoModelo modeloCodigo="patrimonio_baixa" />
            </TabsContent>
          </Tabs>

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
