import { ModuleLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import { FileText, Signature } from "lucide-react";
import { ModelosMensagemTab } from "@/components/reunioes/ModelosMensagemTab";
import { AssinaturaConfigTab } from "@/components/reunioes/AssinaturaConfigTab";

export default function ConfiguracaoReunioesPage() {
  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Reuniões", href: "/admin/reunioes" }, { rotulo: "Configurações" }]}
          titulo="Configurações de reuniões"
          descricao="Gerencie modelos de mensagem e assinaturas para convites de reuniões"
        />

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="modelos" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="modelos" className="gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Modelos de mensagem
                </TabsTrigger>
                <TabsTrigger value="assinaturas" className="gap-2">
                  <Signature className="h-4 w-4" aria-hidden="true" />
                  Assinaturas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="modelos">
                <ModelosMensagemTab />
              </TabsContent>

              <TabsContent value="assinaturas">
                <AssinaturaConfigTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
