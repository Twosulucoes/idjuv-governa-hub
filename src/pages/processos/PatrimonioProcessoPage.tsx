import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Circle, 
  Download, Users, Clock, ClipboardList
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tiposProcesso = [
  { id: "tombamento", nome: "Tombamento", descricao: "Registro de novo bem patrimonial" },
  { id: "distribuicao", nome: "Distribuição", descricao: "Atribuição de bem a responsável" },
  { id: "inventario", nome: "Inventário", descricao: "Levantamento de bens existentes" },
  { id: "baixa", nome: "Baixa", descricao: "Exclusão de bem do patrimônio" },
];

const checklistTombamento = [
  { id: "nota", label: "Nota fiscal ou documento de aquisição", obrigatorio: true },
  { id: "termo", label: "Termo de Recebimento", obrigatorio: true },
  { id: "plaqueta", label: "Plaqueta de identificação afixada", obrigatorio: true },
  { id: "foto", label: "Registro fotográfico do bem", obrigatorio: false },
  { id: "responsavel", label: "Termo de Responsabilidade assinado", obrigatorio: true },
];

const checklistBaixa = [
  { id: "laudo", label: "Laudo técnico de inservibilidade", obrigatorio: true },
  { id: "parecer", label: "Parecer do Controle Interno", obrigatorio: true },
  { id: "autorizacao", label: "Autorização da Presidência", obrigatorio: true },
  { id: "destino", label: "Documentação de destinação final", obrigatorio: true },
];

export default function PatrimonioProcessoPage() {
  const { sigla } = useIdentidade();
  const [activeTab, setActiveTab] = useState("tombamento");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const currentChecklist = activeTab === "baixa" ? checklistBaixa : checklistTombamento;

  const toggleItem = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const obrigatoriosCount = currentChecklist.filter(i => i.obrigatorio).length;
  const obrigatoriosChecked = currentChecklist.filter(i => i.obrigatorio && checkedItems.includes(i.id)).length;
  const canProceed = obrigatoriosChecked === obrigatoriosCount;

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
                ao tombamento, distribuição, controle, inventário e baixa de bens permanentes. 
                Todo bem deve ter responsável designado através de Termo de Responsabilidade.
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-info border-info">
                  <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                  Inventário: anual
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

          {/* Tipos de Processo */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCheckedItems([]); }}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              {tiposProcesso.map(tipo => (
                <TabsTrigger key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </TabsTrigger>
              ))}
            </TabsList>

            {tiposProcesso.map(tipo => (
              <TabsContent key={tipo.id} value={tipo.id}>
                <Card className="border-l-4 border-l-info">
                  <CardHeader>
                    <CardTitle>{tipo.nome}</CardTitle>
                    <CardDescription>{tipo.descricao}</CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Checklist */}
          <h2 className="text-h2 text-foreground pt-2">Checklist - {tiposProcesso.find(t => t.id === activeTab)?.nome}</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Documentação necessária</CardTitle>
                  <CardDescription>
                    Marque os itens conforme forem providenciados
                  </CardDescription>
                </div>
                <StatusBadge tom={canProceed ? "sucesso" : "pendente"}>
                  {obrigatoriosChecked}/{obrigatoriosCount} obrigatórios
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentChecklist.map((item) => (
                  <div 
                    key={item.id}
                    className={`checklist-item ${checkedItems.includes(item.id) ? 'checked' : ''}`}
                  >
                    <Checkbox
                      id={item.id}
                      checked={checkedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <label 
                      htmlFor={item.id} 
                      className="flex-1 text-sm cursor-pointer"
                    >
                      {item.label}
                      {item.obrigatorio && (
                        <>
                          <span className="text-destructive ml-1" aria-hidden="true">*</span>
                          <span className="sr-only"> (obrigatório)</span>
                        </>
                      )}
                    </label>
                    {checkedItems.includes(item.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/30" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Button asChild variant="outline">
              <Link to="/processos">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Voltar
              </Link>
            </Button>
            <div className="flex gap-4">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Baixar modelos
              </Button>
              <Button disabled={!canProceed}>
                Iniciar processo
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
