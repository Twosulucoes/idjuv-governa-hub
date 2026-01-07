import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, ArrowLeft, ArrowRight, CheckCircle2, Circle, 
  FileText, AlertTriangle, Download, Users, Clock, ClipboardList
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const fluxoEtapas = [
  { id: 1, nome: "Termo de Demanda", responsavel: "Unidade Demandante" },
  { id: 2, nome: "Análise Orçamentária", responsavel: "DIRAF" },
  { id: 3, nome: "Parecer Controle Interno", responsavel: "CI" },
  { id: 4, nome: "Autorização", responsavel: "Presidência" },
  { id: 5, nome: "Processo Licitatório", responsavel: "CPL" },
  { id: 6, nome: "Contratação", responsavel: "DIRAF" },
  { id: 7, nome: "Fiscalização", responsavel: "Fiscal de Contrato" },
  { id: 8, nome: "Pagamento", responsavel: "DIRAF" },
];

const checklistItems = [
  { id: "demanda", label: "Termo de Demanda preenchido e assinado", obrigatorio: true },
  { id: "justificativa", label: "Justificativa da necessidade (interesse público)", obrigatorio: true },
  { id: "tr", label: "Termo de Referência ou Projeto Básico", obrigatorio: true },
  { id: "pesquisa", label: "Pesquisa de preços (mínimo 3 cotações)", obrigatorio: true },
  { id: "orcamento", label: "Disponibilidade orçamentária atestada", obrigatorio: true },
  { id: "parecer", label: "Parecer jurídico (quando aplicável)", obrigatorio: false },
  { id: "ci", label: "Parecer do Controle Interno", obrigatorio: true },
  { id: "autorizacao", label: "Autorização da Presidência", obrigatorio: true },
];

export default function ComprasProcessoPage() {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const obrigatoriosCount = checklistItems.filter(i => i.obrigatorio).length;
  const obrigatoriosChecked = checklistItems.filter(i => i.obrigatorio && checkedItems.includes(i.id)).length;
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
            <span>Compras e Contratos</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Compras e Contratos</h1>
              <p className="opacity-90 mt-1">
                Processo de aquisição conforme Lei 14.133/2021
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
                  O processo de Compras e Contratos do IDJUV segue as diretrizes da Nova Lei 
                  de Licitações (Lei 14.133/2021), garantindo a seleção da proposta mais 
                  vantajosa para a Administração Pública, observando os princípios de 
                  legalidade, impessoalidade, moralidade, publicidade e eficiência.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="text-info border-info">
                    <Clock className="w-3 h-3 mr-1" />
                    Prazo médio: 30-60 dias
                  </Badge>
                  <Badge variant="outline" className="text-primary border-primary">
                    <Users className="w-3 h-3 mr-1" />
                    Responsável inicial: Unidade Demandante
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Base Legal */}
            <Card className="mb-8 border-l-4 border-l-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-info" />
                  Base Legal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Lei nº 14.133/2021 – Nova Lei de Licitações e Contratos</li>
                  <li>• Decreto Estadual de Regulamentação</li>
                  <li>• Instruções Normativas do TCE-RR</li>
                  <li>• Regimento Interno do IDJUV</li>
                </ul>
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
                    <Link to="/formularios/termo-demanda" className="flex flex-col items-start gap-1">
                      <span className="font-semibold">Termo de Demanda</span>
                      <span className="text-xs text-muted-foreground">Formalização de demandas de aquisição</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Fluxograma */}
            <h2 className="font-serif text-2xl font-bold mb-6">Fluxograma do Processo</h2>
            <div className="bg-muted/30 rounded-xl p-6 mb-8">
              <div className="flex flex-wrap justify-center gap-4">
                {fluxoEtapas.map((etapa, index) => (
                  <div key={etapa.id} className="flex items-center">
                    <div className="fluxo-etapa min-w-[140px]">
                      <div className="text-xs text-muted-foreground mb-1">Etapa {etapa.id}</div>
                      <div className="font-medium text-sm">{etapa.nome}</div>
                      <div className="text-xs text-primary mt-1">{etapa.responsavel}</div>
                    </div>
                    {index < fluxoEtapas.length - 1 && (
                      <ArrowRight className="w-6 h-6 text-muted-foreground mx-2 hidden lg:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Checklist */}
            <h2 className="font-serif text-2xl font-bold mb-6">Checklist Obrigatório</h2>
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
                  {checklistItems.map((item) => (
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
                <p className="text-xs text-muted-foreground mt-4">
                  <span className="text-destructive">*</span> Itens obrigatórios para prosseguir
                </p>
              </CardContent>
            </Card>

            {/* Alerta */}
            {!canProceed && (
              <div className="alerta-conformidade mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Atenção</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete todos os itens obrigatórios do checklist antes de iniciar o processo. 
                      Processos incompletos serão devolvidos pelo Controle Interno.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
