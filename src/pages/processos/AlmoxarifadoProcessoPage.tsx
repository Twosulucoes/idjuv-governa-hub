import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Circle, 
  FileText, AlertTriangle, Download, Users, Clock, ClipboardList
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const fluxoEtapas = [
  { id: 1, nome: "Requisição", responsavel: "Unidade Solicitante" },
  { id: 2, nome: "Aprovação Chefia", responsavel: "Chefia Imediata" },
  { id: 3, nome: "Verificação Estoque", responsavel: "Almoxarifado" },
  { id: 4, nome: "Separação Material", responsavel: "Almoxarifado" },
  { id: 5, nome: "Entrega", responsavel: "Almoxarifado" },
  { id: 6, nome: "Baixa no Sistema", responsavel: "Almoxarifado" },
];

const checklistItems = [
  { id: "requisicao", label: "Requisição de Material preenchida", obrigatorio: true },
  { id: "justificativa", label: "Justificativa da necessidade", obrigatorio: true },
  { id: "aprovacao", label: "Aprovação da chefia imediata", obrigatorio: true },
  { id: "verificacao", label: "Verificação de disponibilidade no estoque", obrigatorio: true },
];

export default function AlmoxarifadoProcessoPage() {
  const { sigla } = useIdentidade();
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

          {/* Fluxograma */}
          <h2 className="text-h2 text-foreground pt-2">Fluxograma do processo</h2>
          <div className="bg-muted/30 rounded-xl p-6">
            <ol className="flex flex-wrap justify-center gap-4">
              {fluxoEtapas.map((etapa, index) => (
                <li key={etapa.id} className="flex items-center">
                  <div className="fluxo-etapa min-w-[130px]">
                    <div className="text-caption text-muted-foreground mb-1">Etapa {etapa.id}</div>
                    <div className="font-medium text-sm">{etapa.nome}</div>
                    <div className="text-caption text-primary mt-1">{etapa.responsavel}</div>
                  </div>
                  {index < fluxoEtapas.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-muted-foreground mx-2 hidden lg:block" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Checklist */}
          <h2 className="text-h2 text-foreground pt-2">Checklist obrigatório</h2>
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

          {/* Alerta */}
          {!canProceed && (
            <div className="alerta-conformidade" role="note">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">Atenção</h3>
                  <p className="text-sm text-muted-foreground">
                    A saída de material depende de requisição formal autorizada pela chefia (Art. 7º IN Almoxarifado).
                    É vedada a retirada sem devido registro (Art. 8º).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Button asChild variant="outline">
              <Link to="/processos">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Voltar
              </Link>
            </Button>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/formularios/requisicao-material">
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Requisição de material
                </Link>
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
