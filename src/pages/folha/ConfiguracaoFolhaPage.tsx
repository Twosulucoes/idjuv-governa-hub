import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calculator, Landmark, Settings, FileText, Percent } from "lucide-react";
import { ConfigAutarquiaTab } from "@/components/folha/ConfigAutarquiaTab";
import { RubricasTab } from "@/components/folha/RubricasTab";
import { ParametrosTab } from "@/components/folha/ParametrosTab";
import { TabelasImpostosTab } from "@/components/folha/TabelasImpostosTab";
import { BancosContasTab } from "@/components/folha/BancosContasTab";

export default function ConfiguracaoFolhaPage() {
  const [activeTab, setActiveTab] = useState("autarquia");

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuração da Folha</h1>
          <p className="text-muted-foreground mt-1">
            Configure os parâmetros gerais do sistema de folha de pagamento
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="autarquia" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Autarquia</span>
            </TabsTrigger>
            <TabsTrigger value="rubricas" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Rubricas</span>
            </TabsTrigger>
            <TabsTrigger value="parametros" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Parâmetros</span>
            </TabsTrigger>
            <TabsTrigger value="impostos" className="gap-2">
              <Percent className="h-4 w-4" />
              <span className="hidden sm:inline">INSS/IRRF</span>
            </TabsTrigger>
            <TabsTrigger value="bancos" className="gap-2">
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">Bancos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="autarquia">
            <ConfigAutarquiaTab />
          </TabsContent>

          <TabsContent value="rubricas">
            <RubricasTab />
          </TabsContent>

          <TabsContent value="parametros">
            <ParametrosTab />
          </TabsContent>

          <TabsContent value="impostos">
            <TabelasImpostosTab />
          </TabsContent>

          <TabsContent value="bancos">
            <BancosContasTab />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
