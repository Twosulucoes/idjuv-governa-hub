import { useState } from "react";
import { AdminLayout } from "@/components/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  Calendar, 
  FileCheck, 
  Settings, 
  Users, 
  Timer,
  PenLine,
  Lock,
  Briefcase,
  Layers
} from "lucide-react";
import { JornadaTab } from "@/components/frequencia/config/JornadaTab";
import { RegimesTab } from "@/components/frequencia/config/RegimesTab";
import { DiasNaoUteisTab } from "@/components/frequencia/config/DiasNaoUteisTab";
import { TiposAbonoTab } from "@/components/frequencia/config/TiposAbonoTab";
import { CompensacaoTab } from "@/components/frequencia/config/CompensacaoTab";
import { FechamentoTab } from "@/components/frequencia/config/FechamentoTab";
import { AssinaturasTab } from "@/components/frequencia/config/AssinaturasTab";
import { AgrupamentosUnidadesTab } from "@/components/frequencia/config/AgrupamentosUnidadesTab";

export default function ConfiguracaoFrequenciaPage() {
  const [activeTab, setActiveTab] = useState("jornada");

  const tabs = [
    { id: "jornada", label: "Jornada", icon: Clock, description: "Carga horária e horários" },
    { id: "regimes", label: "Regimes", icon: Briefcase, description: "Presencial, teletrabalho, etc." },
    { id: "dias", label: "Dias Não Úteis", icon: Calendar, description: "Feriados, recessos, etc." },
    { id: "abonos", label: "Abonos", icon: FileCheck, description: "Tipos de justificativa" },
    { id: "compensacao", label: "Compensação", icon: Timer, description: "Banco de horas" },
    { id: "fechamento", label: "Fechamento", icon: Lock, description: "Prazos e consolidação" },
    { id: "assinaturas", label: "Assinaturas", icon: PenLine, description: "Validação e assinaturas" },
    { id: "agrupamentos", label: "Agrupamentos", icon: Layers, description: "Grupos de unidades para impressão em lote" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configuração de Frequência
          </h1>
          <p className="text-muted-foreground mt-1">
            Parametrizações institucionais do módulo de frequência
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-background"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab content description */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {tabs.find(t => t.id === activeTab) && (
                  <>
                    {(() => {
                      const Icon = tabs.find(t => t.id === activeTab)!.icon;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                    <div>
                      <CardTitle className="text-lg">
                        {tabs.find(t => t.id === activeTab)?.label}
                      </CardTitle>
                      <CardDescription>
                        {tabs.find(t => t.id === activeTab)?.description}
                      </CardDescription>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
          </Card>

          <TabsContent value="jornada" className="mt-0">
            <JornadaTab />
          </TabsContent>

          <TabsContent value="regimes" className="mt-0">
            <RegimesTab />
          </TabsContent>

          <TabsContent value="dias" className="mt-0">
            <DiasNaoUteisTab />
          </TabsContent>

          <TabsContent value="abonos" className="mt-0">
            <TiposAbonoTab />
          </TabsContent>

          <TabsContent value="compensacao" className="mt-0">
            <CompensacaoTab />
          </TabsContent>

          <TabsContent value="fechamento" className="mt-0">
            <FechamentoTab />
          </TabsContent>

          <TabsContent value="assinaturas" className="mt-0">
            <AssinaturasTab />
          </TabsContent>

          <TabsContent value="agrupamentos" className="mt-0">
            <AgrupamentosUnidadesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
