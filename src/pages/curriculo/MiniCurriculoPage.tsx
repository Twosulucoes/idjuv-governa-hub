import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  FileDown,
  Loader2,
} from "lucide-react";
import {
  DadosPessoaisForm,
  DocumentosForm,
  EnderecoForm,
  PrevidenciaForm,
  EscolaridadeForm,
  AptidoesForm,
  ChecklistForm,
  DadosBancariosForm,
  DependentesForm,
  RevisaoForm,
  OrientacoesDocumentosCard,
} from "@/components/curriculo";
import { usePreCadastro } from "@/hooks/usePreCadastro";
import { gerarPdfMiniCurriculo } from "@/lib/pdfMiniCurriculo";
import type { PreCadastro } from "@/types/preCadastro";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

const STEPS = [
  { id: 1, title: "Dados Pessoais", description: "Informações básicas" },
  { id: 2, title: "Documentos", description: "Documentos pessoais" },
  { id: 3, title: "Endereço", description: "Endereço residencial" },
  { id: 4, title: "Previdência", description: "NIS/PIS/PASEP" },
  { id: 5, title: "Escolaridade", description: "Formação e habilitação" },
  { id: 6, title: "Aptidões", description: "Habilidades e experiência" },
  { id: 7, title: "Checklist", description: "Documentos necessários" },
  { id: 8, title: "Dados Bancários", description: "Conta para crédito" },
  { id: 9, title: "Dependentes", description: "Para dedução de IR" },
  { id: 10, title: "Revisão", description: "Conferir e enviar" },
];

export default function MiniCurriculoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PreCadastro>>({
    nacionalidade: "Brasileira",
  });
  const [isSaving, setIsSaving] = useState(false);

  const { preCadastro, isLoading, criar, atualizar, enviar } = usePreCadastro(codigo);

  // Carregar dados existentes
  useEffect(() => {
    if (preCadastro) {
      setFormData(preCadastro);
    }
  }, [preCadastro]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (preCadastro?.id) {
        await atualizar({ id: preCadastro.id, dados: formData });
        toast.success("Dados salvos com sucesso!");
      } else {
        if (!formData.nome_completo || !formData.cpf || !formData.email) {
          toast.error("Preencha nome, CPF e e-mail para salvar.");
          return;
        }
        const novo = await criar(formData);
        navigate(`/curriculo/${novo.codigo_acesso}`, { replace: true });
        toast.success(`Pré-cadastro criado! Código: ${novo.codigo_acesso}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!preCadastro?.id) {
      toast.error("Salve o formulário antes de enviar.");
      return;
    }

    // Validar campos obrigatórios
    const camposObrigatorios = [
      "nome_completo",
      "cpf",
      "email",
      "data_nascimento",
      "telefone_celular",
    ];
    const faltando = camposObrigatorios.filter(
      (c) => !formData[c as keyof PreCadastro]
    );

    if (faltando.length > 0) {
      toast.error("Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    try {
      await enviar(preCadastro.id);
      navigate("/curriculo/sucesso", {
        state: { codigo: preCadastro.codigo_acesso },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadPdf = () => {
    const doc = gerarPdfMiniCurriculo(formData as PreCadastro);
    doc.save(`pre-cadastro-${formData.codigo_acesso || "rascunho"}.pdf`);
  };

  const handleRecuperarPreCadastro = (codigoRecuperar: string) => {
    navigate(`/curriculo/${codigoRecuperar}`, { replace: true });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <DadosPessoaisForm dados={formData} onChange={setFormData} />;
      case 2:
        return (
          <DocumentosForm
            dados={formData}
            onChange={setFormData}
            codigoAtual={codigo}
            onRecuperarPreCadastro={handleRecuperarPreCadastro}
          />
        );
      case 3:
        return <EnderecoForm dados={formData} onChange={setFormData} />;
      case 4:
        return <PrevidenciaForm dados={formData} onChange={setFormData} />;
      case 5:
        return <EscolaridadeForm dados={formData} onChange={setFormData} />;
      case 6:
        return <AptidoesForm dados={formData} onChange={setFormData} />;
      case 7:
        return <ChecklistForm dados={formData} onChange={setFormData} />;
      case 8:
        return <DadosBancariosForm dados={formData} onChange={setFormData} />;
      case 9:
        return <DependentesForm dados={formData} onChange={setFormData} />;
      case 10:
        return <RevisaoForm dados={formData} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoIdjuv} alt="IDJUV" className="h-12 bg-white rounded p-1" />
              <div>
                <h1 className="font-bold text-lg">Pré-Cadastro de Servidor</h1>
                <p className="text-sm opacity-90">
                  Instituto de Desporto, Juventude e Lazer
                </p>
              </div>
            </div>
            {formData.codigo_acesso && (
              <Badge variant="secondary" className="text-sm font-mono">
                {formData.codigo_acesso}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Orientações e Documentos */}
        <OrientacoesDocumentosCard />

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Etapa {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {STEPS[currentStep - 1].title}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="hidden md:flex justify-between mb-8 overflow-x-auto">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex flex-col items-center min-w-[80px] transition-colors ${
                step.id === currentStep
                  ? "text-primary"
                  : step.id < currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <Card className="mb-6">
          <CardContent className="p-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Rascunho
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>

            {currentStep === STEPS.length ? (
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Pré-Cadastro
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-8">
        <div className="container max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Em caso de dúvidas, entre em contato com o setor de Recursos Humanos do IDJUV.
          </p>
        </div>
      </footer>
    </div>
  );
}
