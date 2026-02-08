import { ModuleLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Signature, Settings } from "lucide-react";
import { ModelosMensagemTab } from "@/components/reunioes/ModelosMensagemTab";
import { AssinaturaConfigTab } from "@/components/reunioes/AssinaturaConfigTab";

export default function ConfiguracaoReunioesPage() {
  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações de Reuniões
          </h1>
          <p className="text-muted-foreground">
            Gerencie modelos de mensagem e assinaturas para convites de reuniões
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="modelos" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="modelos" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Modelos de Mensagem
                </TabsTrigger>
                <TabsTrigger value="assinaturas" className="gap-2">
                  <Signature className="h-4 w-4" />
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
