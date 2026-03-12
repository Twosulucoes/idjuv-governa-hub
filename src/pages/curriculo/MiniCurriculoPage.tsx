import { useState, useEffect, useMemo } from "react";
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
  DeclaracaoEmergenciaForm,
  RevisaoForm,
  OrientacoesDocumentosCard,
} from "@/components/curriculo";
import { usePreCadastro } from "@/hooks/usePreCadastro";
import { useFormFieldConfig } from "@/hooks/useFormFieldConfig";
import { gerarPdfMiniCurriculo } from "@/lib/pdfMiniCurriculo";
import type { PreCadastro } from "@/types/preCadastro";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

// Mapeamento step → chave de seção na config
const STEP_SECTION_MAP: Record<number, string | null> = {
  1: null, // Dados Pessoais - sempre visível
  2: null, // Documentos - sempre visível (campos internos controlados)
  3: null, // Endereço - sempre visível
  4: 'previdencia',
  5: 'escolaridade',
  6: 'aptidoes',
  7: 'emergencia',
  8: 'checklist',
  9: 'dados_bancarios',
  10: 'dependentes',
  11: null, // Revisão - sempre visível
};

const ALL_STEPS = [
  { id: 1, title: "Dados Pessoais", description: "Informações básicas" },
  { id: 2, title: "Documentos", description: "Documentos pessoais" },
  { id: 3, title: "Endereço", description: "Endereço residencial" },
  { id: 4, title: "Previdência", description: "NIS/PIS/PASEP" },
  { id: 5, title: "Escolaridade", description: "Formação e habilitação" },
  { id: 6, title: "Aptidões", description: "Habilidades e experiência" },
  { id: 7, title: "Declarações", description: "Acumulação e emergência" },
  { id: 8, title: "Checklist", description: "Documentos necessários" },
  { id: 9, title: "Dados Bancários", description: "Conta para crédito" },
  { id: 10, title: "Dependentes", description: "Para dedução de IR" },
  { id: 11, title: "Revisão", description: "Conferir e enviar" },
];

export default function MiniCurriculoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<PreCadastro>>({
    nacionalidade: "Brasileira",
  });
  const [isSaving, setIsSaving] = useState(false);

  const { preCadastro, isLoading, criar, atualizar, enviar } = usePreCadastro(codigo);
  const { isSectionEnabled, isFieldEnabled, loading: configLoading } = useFormFieldConfig('pre_cadastro');

  // Filtrar steps com base na config
  const activeSteps = useMemo(() => {
    if (configLoading) return ALL_STEPS;
    return ALL_STEPS.filter(step => {
      const sectionKey = STEP_SECTION_MAP[step.id];
      if (!sectionKey) return true; // Steps sem mapeamento são sempre visíveis
      return isSectionEnabled(sectionKey);
    });
  }, [configLoading, isSectionEnabled]);

  const currentStep = activeSteps[currentStepIndex];

  // Carregar dados existentes
  useEffect(() => {
    if (preCadastro) {
      setFormData(preCadastro);
    }
  }, [preCadastro]);

  const handleNext = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
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
    if (!currentStep) return null;
    switch (currentStep.id) {
      case 1:
        return (
          <DadosPessoaisForm
            dados={formData}
            onChange={setFormData}
            codigoAtual={codigo}
            onRecuperarPreCadastro={handleRecuperarPreCadastro}
          />
        );
      case 2:
        return <DocumentosForm dados={formData} onChange={setFormData} fieldConfig={{ isFieldEnabled }} />;
      case 3:
        return <EnderecoForm dados={formData} onChange={setFormData} />;
      case 4:
        return <PrevidenciaForm dados={formData} onChange={setFormData} />;
      case 5:
        return <EscolaridadeForm dados={formData} onChange={setFormData} />;
      case 6:
        return <AptidoesForm dados={formData} onChange={setFormData} />;
      case 7:
        return <DeclaracaoEmergenciaForm dados={formData} onChange={setFormData} />;
      case 8:
        return <ChecklistForm dados={formData} onChange={setFormData} />;
      case 9:
        return <DadosBancariosForm dados={formData} onChange={setFormData} />;
      case 10:
        return <DependentesForm dados={formData} onChange={setFormData} />;
      case 11:
        return <RevisaoForm dados={formData} />;
      default:
        return null;
    }
  };

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = ((currentStepIndex + 1) / activeSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoIdjuv} alt="IDJuv" className="h-12 bg-white rounded p-1" />
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
              Etapa {currentStepIndex + 1} de {activeSteps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {currentStep?.title}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="hidden md:flex justify-between mb-8 overflow-x-auto">
          {activeSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={`flex flex-col items-center min-w-[80px] transition-colors ${
                index === currentStepIndex
                  ? "text-primary"
                  : index < currentStepIndex
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                  index === currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : index < currentStepIndex
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <Card className="mb-8">
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar
            </Button>

            {preCadastro?.id && (
              <Button variant="outline" onClick={handleDownloadPdf}>
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStepIndex < activeSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-1" />
                Enviar Pré-Cadastro
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
