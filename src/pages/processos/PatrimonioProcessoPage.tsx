import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, ArrowLeft, ArrowRight, CheckCircle2, Circle, 
  FileText, AlertTriangle, Download, Users, Clock, ClipboardList
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/processos" className="hover:underline">Processos</Link>
            <span>/</span>
            <span>Patrimônio</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Patrimônio</h1>
              <p className="opacity-90 mt-1">
                Gestão de bens patrimoniais do IDJUV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Descrição */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Descrição do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  A gestão patrimonial do IDJUV compreende o conjunto de atividades relacionadas 
                  ao tombamento, distribuição, controle, inventário e baixa de bens permanentes. 
                  Todo bem deve ter responsável designado através de Termo de Responsabilidade.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="text-info border-info">
                    <Clock className="w-3 h-3 mr-1" />
                    Inventário: Anual
                  </Badge>
                  <Badge variant="outline" className="text-primary border-primary">
                    <Users className="w-3 h-3 mr-1" />
                    Responsável: DIRAF/NuPat
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Formulários Disponíveis */}
            <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Formulários Digitais
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
                      <span className="text-xs text-muted-foreground">Guarda de bens patrimoniais - Art. 7 IN</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Processo */}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCheckedItems([]); }}>
              <TabsList className="grid grid-cols-4 w-full mb-8">
                {tiposProcesso.map(tipo => (
                  <TabsTrigger key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tiposProcesso.map(tipo => (
                <TabsContent key={tipo.id} value={tipo.id}>
                  <Card className="mb-8 border-l-4 border-l-info">
                    <CardHeader>
                      <CardTitle>{tipo.nome}</CardTitle>
                      <CardDescription>{tipo.descricao}</CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            <Separator className="my-8" />

            {/* Checklist */}
            <h2 className="font-serif text-2xl font-bold mb-6">Checklist - {tiposProcesso.find(t => t.id === activeTab)?.nome}</h2>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documentação Necessária</CardTitle>
                    <CardDescription>
                      Marque os itens conforme forem providenciados
                    </CardDescription>
                  </div>
                  <Badge variant={canProceed ? "default" : "secondary"} className={canProceed ? "bg-success" : ""}>
                    {obrigatoriosChecked}/{obrigatoriosCount} obrigatórios
                  </Badge>
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
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </label>
                      {checkedItems.includes(item.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
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
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <div className="flex gap-4">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Modelos
                </Button>
                <Button 
                  disabled={!canProceed}
                  className="btn-gov"
                >
                  Iniciar Processo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
