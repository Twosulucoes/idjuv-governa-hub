/**
 * FORMULÁRIO CPSI - Contrato Público de Solução Inovadora
 * LC 182/2021 (Marco Legal das Startups)
 * 
 * Gera: DFD, ETP e TR para processo de aquisição de soluções inovadoras
 * Integra IA para: preenchimento automático, assistência por campo e revisão
 */

import { useState } from 'react';
import { FileText, Download, ArrowLeft, Lightbulb, ClipboardList, BookOpen, Sparkles, Wand2, CheckCircle, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { generateDFD, generateETP, generateTR } from '@/lib/pdfCPSI';
import type { DFDData, ETPData, TRData } from '@/lib/pdfCPSI';
import { useAICPSI } from '@/hooks/useAICPSI';

// ============ AI FIELD WRAPPER ============

interface AIFieldProps {
  label: string;
  fieldName: string;
  children: React.ReactNode;
  isLoading: boolean;
  onGenerate: () => void;
}

const AIField = ({ label, fieldName, children, isLoading, onGenerate }: AIFieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onGenerate}
        disabled={isLoading}
        className="h-7 px-2 text-xs text-primary hover:text-primary"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Wand2 className="h-3 w-3 mr-1" />
        )}
        {isLoading ? 'Gerando...' : 'IA'}
      </Button>
    </div>
    {children}
  </div>
);

// ============ AI TOOLBAR ============

interface AIToolbarProps {
  onFillAll: () => void;
  onReview: () => void;
  isFillingAll: boolean;
  isReviewing: boolean;
}

const AIToolbar = ({ onFillAll, onReview, isFillingAll, isReviewing }: AIToolbarProps) => (
  <div className="flex flex-wrap gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
    <div className="flex items-center gap-1.5 mr-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">Assistente IA</span>
    </div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onFillAll}
      disabled={isFillingAll || isReviewing}
      className="h-8"
    >
      {isFillingAll ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
      {isFillingAll ? 'Preenchendo...' : 'Preencher Tudo'}
    </Button>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onReview}
      disabled={isFillingAll || isReviewing}
      className="h-8"
    >
      {isReviewing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
      {isReviewing ? 'Revisando...' : 'Revisar com IA'}
    </Button>
  </div>
);

// ============ AI FILL DIALOG ============

interface AIFillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (context: string) => void;
  isLoading: boolean;
  docName: string;
}

const AIFillDialog = ({ isOpen, onClose, onSubmit, isLoading, docName }: AIFillDialogProps) => {
  const [context, setContext] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Preenchimento Automático</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Descreva brevemente a necessidade e a IA preencherá todos os campos do {docName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Ex: Contratação de sistema de governança digital integrado para o Instituto da Juventude de Roraima (IDJuv), incluindo módulos de RH, licitações, patrimônio, contratos, financeiro e transparência, com IA generativa nativa para automação de documentos oficiais."
            className="min-h-[120px]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button onClick={() => onSubmit(context)} disabled={!context.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
              {isLoading ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ AI REVIEW PANEL ============

interface AIReviewPanelProps {
  isReviewing: boolean;
  reviewResult: string;
  onClose: () => void;
}

const AIReviewPanel = ({ isReviewing, reviewResult, onClose }: AIReviewPanelProps) => {
  if (!reviewResult && !isReviewing) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Revisão da IA</CardTitle>
            {isReviewing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          {!isReviewing && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
          {reviewResult || 'Analisando documento...'}
        </div>
      </CardContent>
    </Card>
  );
};

// ============ COMPONENTE DFD ============

const DFDForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFillDialog, setShowFillDialog] = useState(false);
  const [formData, setFormData] = useState<DFDData>({
    orgaoEntidade: '',
    setorRequisitante: '',
    responsavelNome: '',
    responsavelCargo: '',
    responsavelMatricula: '',
    responsavelContato: '',
    descricaoDemanda: '',
    justificativaNecessidade: '',
    estimativaValor: '',
    dataPretendida: '',
    quantidade: '',
    grauPrioridade: '',
    correlacaoDFD: '',
    observacoes: '',
  });

  const ai = useAICPSI({ documentType: 'dfd' });

  const update = (field: keyof DFDData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFillAll = (context: string) => {
    ai.fillAll(context, (fields) => {
      setFormData(prev => ({ ...prev, ...fields }));
      setShowFillDialog(false);
    });
  };

  const handleFillField = (field: keyof DFDData, label: string) => {
    ai.fillField(field, label, formData[field] || '', formData as unknown as Record<string, string>, (value) => {
      update(field, value);
    });
  };

  const handleGenerate = async () => {
    if (!formData.descricaoDemanda || !formData.justificativaNecessidade) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setIsGenerating(true);
    try {
      const numero = await generateDFD(formData);
      toast.success('DFD gerado com sucesso!', { description: `Documento nº ${numero}` });
    } catch {
      toast.error('Erro ao gerar DFD');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AIToolbar
        onFillAll={() => setShowFillDialog(true)}
        onReview={() => ai.review(formData as unknown as Record<string, string>)}
        isFillingAll={ai.isFillingAll}
        isReviewing={ai.isReviewing}
      />

      <AIFillDialog
        isOpen={showFillDialog}
        onClose={() => setShowFillDialog(false)}
        onSubmit={handleFillAll}
        isLoading={ai.isFillingAll}
        docName="DFD"
      />

      <AIReviewPanel
        isReviewing={ai.isReviewing}
        reviewResult={ai.reviewResult}
        onClose={() => ai.setReviewResult('')}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Órgão ou Entidade *" fieldName="orgaoEntidade" isLoading={ai.fillingField === 'orgaoEntidade'} onGenerate={() => handleFillField('orgaoEntidade', 'Órgão ou Entidade')}>
            <Input value={formData.orgaoEntidade} onChange={e => update('orgaoEntidade', e.target.value)} placeholder="Ex: Instituto da Juventude de Roraima - IDJuv" />
          </AIField>
          <AIField label="Setor Requisitante (Unidade/Setor/Departamento) *" fieldName="setorRequisitante" isLoading={ai.fillingField === 'setorRequisitante'} onGenerate={() => handleFillField('setorRequisitante', 'Setor Requisitante')}>
            <Input value={formData.setorRequisitante} onChange={e => update('setorRequisitante', e.target.value)} placeholder="Ex: DIRAF - Diretoria Administrativa e Financeira" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">2. Responsável pela Demanda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Nome *" fieldName="responsavelNome" isLoading={ai.fillingField === 'responsavelNome'} onGenerate={() => handleFillField('responsavelNome', 'Nome do Responsável')}>
            <Input value={formData.responsavelNome} onChange={e => update('responsavelNome', e.target.value)} placeholder="Nome completo" />
          </AIField>
          <AIField label="Cargo" fieldName="responsavelCargo" isLoading={ai.fillingField === 'responsavelCargo'} onGenerate={() => handleFillField('responsavelCargo', 'Cargo do Responsável')}>
            <Input value={formData.responsavelCargo} onChange={e => update('responsavelCargo', e.target.value)} placeholder="Ex: Diretor Administrativo" />
          </AIField>
          <AIField label="Matrícula Funcional" fieldName="responsavelMatricula" isLoading={ai.fillingField === 'responsavelMatricula'} onGenerate={() => handleFillField('responsavelMatricula', 'Matrícula Funcional')}>
            <Input value={formData.responsavelMatricula} onChange={e => update('responsavelMatricula', e.target.value)} placeholder="Nº matrícula" />
          </AIField>
          <AIField label="E-mail e/ou telefone institucional" fieldName="responsavelContato" isLoading={ai.fillingField === 'responsavelContato'} onGenerate={() => handleFillField('responsavelContato', 'Contato institucional')}>
            <Input value={formData.responsavelContato} onChange={e => update('responsavelContato', e.target.value)} placeholder="email@orgao.gov.br / (95) 0000-0000" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">3. Descrição da Demanda *</h3>
        <AIField label="" fieldName="descricaoDemanda" isLoading={ai.fillingField === 'descricaoDemanda'} onGenerate={() => handleFillField('descricaoDemanda', 'Descrição da Demanda')}>
          <Textarea value={formData.descricaoDemanda} onChange={e => update('descricaoDemanda', e.target.value)}
            placeholder="Descreva o objeto da demanda a ser contratada" className="min-h-[120px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">4. Justificativa da Necessidade da Contratação *</h3>
        <AIField label="" fieldName="justificativaNecessidade" isLoading={ai.fillingField === 'justificativaNecessidade'} onGenerate={() => handleFillField('justificativaNecessidade', 'Justificativa da Necessidade da Contratação')}>
          <Textarea value={formData.justificativaNecessidade} onChange={e => update('justificativaNecessidade', e.target.value)}
            placeholder="Justifique a necessidade da contratação, indicando os motivos e o interesse público" className="min-h-[120px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">5. Estimativa Preliminar do Valor da Contratação</h3>
        <AIField label="" fieldName="estimativaValor" isLoading={ai.fillingField === 'estimativaValor'} onGenerate={() => handleFillField('estimativaValor', 'Estimativa Preliminar do Valor')}>
          <Textarea value={formData.estimativaValor} onChange={e => update('estimativaValor', e.target.value)}
            placeholder='Ex: "R$ 30.000,00, estimando-se que a execução do contrato ocorrerá no exercício de 2026".' className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">6. Data Pretendida</h3>
          <AIField label="Data pretendida para conclusão da contratação" fieldName="dataPretendida" isLoading={ai.fillingField === 'dataPretendida'} onGenerate={() => handleFillField('dataPretendida', 'Data Pretendida')}>
            <Input value={formData.dataPretendida} onChange={e => update('dataPretendida', e.target.value)} placeholder="Ex: 25/02/2026" />
          </AIField>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">7. Quantidade</h3>
          <AIField label="Quantidade a ser contratada" fieldName="quantidade" isLoading={ai.fillingField === 'quantidade'} onGenerate={() => handleFillField('quantidade', 'Quantidade')}>
            <Input value={formData.quantidade} onChange={e => update('quantidade', e.target.value)} placeholder="Ex: 7 unidades" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">8. Grau de Prioridade da Contratação</h3>
        <AIField label="" fieldName="grauPrioridade" isLoading={ai.fillingField === 'grauPrioridade'} onGenerate={() => handleFillField('grauPrioridade', 'Grau de Prioridade')}>
          <select
            value={formData.grauPrioridade}
            onChange={e => update('grauPrioridade', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione...</option>
            <option value="Baixo">Baixo</option>
            <option value="Médio">Médio</option>
            <option value="Alto">Alto</option>
          </select>
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">9. Correlação ou Interdependência com outro DFD</h3>
        <AIField label="" fieldName="correlacaoDFD" isLoading={ai.fillingField === 'correlacaoDFD'} onGenerate={() => handleFillField('correlacaoDFD', 'Correlação com outro DFD')}>
          <Textarea value={formData.correlacaoDFD} onChange={e => update('correlacaoDFD', e.target.value)}
            placeholder='Ex: "A execução do objeto deste DFD depende da prévia execução do objeto do DFD xxxxxxx..."' className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Observações</label>
        <Textarea value={formData.observacoes} onChange={e => update('observacoes', e.target.value)}
          placeholder="Informações complementares (opcional)" className="min-h-[60px]" />
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        {isGenerating ? 'Gerando PDF...' : 'Gerar DFD (PDF)'}
      </Button>
    </div>
  );
};

// ============ COMPONENTE ETP ============

const ETPForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFillDialog, setShowFillDialog] = useState(false);
  const [formData, setFormData] = useState<ETPData>({
    descricaoNecessidade: '',
    areaRequisitante: '',
    requisitosTecnicos: '',
    requisitosNegocio: '',
    estimativaValor: '',
    metodologiaEstimativa: '',
    justificativaContratacao: '',
    descricaoSolucao: '',
    diferencialInovador: '',
    ganhoEficiencia: '',
    baseComparativa: '',
    ambienteTeste: '',
    criteriosAvaliacao: '',
    prazoTeste: '',
    riscos: '',
    mitigacao: '',
    viabilidadeTecnica: '',
    viabilidadeOrcamentaria: '',
    observacoes: '',
  });

  const ai = useAICPSI({ documentType: 'etp' });

  const update = (field: keyof ETPData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFillAll = (context: string) => {
    ai.fillAll(context, (fields) => {
      setFormData(prev => ({ ...prev, ...fields }));
      setShowFillDialog(false);
    });
  };

  const handleFillField = (field: keyof ETPData, label: string) => {
    ai.fillField(field, label, formData[field] || '', formData as unknown as Record<string, string>, (value) => {
      update(field, value);
    });
  };

  const handleGenerate = async () => {
    if (!formData.descricaoNecessidade || !formData.descricaoSolucao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setIsGenerating(true);
    try {
      const numero = await generateETP(formData);
      toast.success('ETP gerado com sucesso!', { description: `Documento nº ${numero}` });
    } catch {
      toast.error('Erro ao gerar ETP');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AIToolbar
        onFillAll={() => setShowFillDialog(true)}
        onReview={() => ai.review(formData as unknown as Record<string, string>)}
        isFillingAll={ai.isFillingAll}
        isReviewing={ai.isReviewing}
      />

      <AIFillDialog
        isOpen={showFillDialog}
        onClose={() => setShowFillDialog(false)}
        onSubmit={handleFillAll}
        isLoading={ai.isFillingAll}
        docName="ETP"
      />

      <AIReviewPanel
        isReviewing={ai.isReviewing}
        reviewResult={ai.reviewResult}
        onClose={() => ai.setReviewResult('')}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Descrição da Necessidade *</h3>
        <AIField label="" fieldName="descricaoNecessidade" isLoading={ai.fillingField === 'descricaoNecessidade'} onGenerate={() => handleFillField('descricaoNecessidade', 'Descrição da Necessidade')}>
          <Textarea value={formData.descricaoNecessidade} onChange={e => update('descricaoNecessidade', e.target.value)}
            placeholder="Descreva a necessidade que se pretende atender com a contratação" className="min-h-[100px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">2. Área Requisitante</h3>
        <AIField label="" fieldName="areaRequisitante" isLoading={ai.fillingField === 'areaRequisitante'} onGenerate={() => handleFillField('areaRequisitante', 'Área Requisitante')}>
          <Input value={formData.areaRequisitante} onChange={e => update('areaRequisitante', e.target.value)} placeholder="Ex: DIRAF - Diretoria Administrativa e Financeira" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">3. Requisitos da Contratação</h3>
        <AIField label="Requisitos Técnicos" fieldName="requisitosTecnicos" isLoading={ai.fillingField === 'requisitosTecnicos'} onGenerate={() => handleFillField('requisitosTecnicos', 'Requisitos Técnicos')}>
          <Textarea value={formData.requisitosTecnicos} onChange={e => update('requisitosTecnicos', e.target.value)}
            placeholder="Arquitetura cloud-native, SaaS, API RESTful, segurança LGPD, etc." className="min-h-[80px]" />
        </AIField>
        <AIField label="Requisitos de Negócio" fieldName="requisitosNegocio" isLoading={ai.fillingField === 'requisitosNegocio'} onGenerate={() => handleFillField('requisitosNegocio', 'Requisitos de Negócio')}>
          <Textarea value={formData.requisitosNegocio} onChange={e => update('requisitosNegocio', e.target.value)}
            placeholder="Módulos funcionais, integrações, workflows, relatórios, etc." className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">4. Estimativa de Valor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Valor Estimado" fieldName="estimativaValor" isLoading={ai.fillingField === 'estimativaValor'} onGenerate={() => handleFillField('estimativaValor', 'Valor Estimado')}>
            <Input value={formData.estimativaValor} onChange={e => update('estimativaValor', e.target.value)} placeholder="R$ 0,00" />
          </AIField>
          <AIField label="Metodologia" fieldName="metodologiaEstimativa" isLoading={ai.fillingField === 'metodologiaEstimativa'} onGenerate={() => handleFillField('metodologiaEstimativa', 'Metodologia de Estimativa')}>
            <Input value={formData.metodologiaEstimativa} onChange={e => update('metodologiaEstimativa', e.target.value)} placeholder="Pesquisa de mercado, benchmarking, etc." />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">5. Justificativa da Contratação</h3>
        <AIField label="" fieldName="justificativaContratacao" isLoading={ai.fillingField === 'justificativaContratacao'} onGenerate={() => handleFillField('justificativaContratacao', 'Justificativa da Contratação')}>
          <Textarea value={formData.justificativaContratacao} onChange={e => update('justificativaContratacao', e.target.value)}
            placeholder="Demonstre por que é necessário contratar solução inovadora via CPSI" className="min-h-[100px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">6. Descrição da Solução *</h3>
        <AIField label="" fieldName="descricaoSolucao" isLoading={ai.fillingField === 'descricaoSolucao'} onGenerate={() => handleFillField('descricaoSolucao', 'Descrição da Solução')}>
          <Textarea value={formData.descricaoSolucao} onChange={e => update('descricaoSolucao', e.target.value)}
            placeholder="Descreva a solução inovadora pretendida (sistema de governança digital, portal, etc.)" className="min-h-[100px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">7. Parâmetros de Inovação (LC 182/2021)</h3>
        <AIField label="Diferencial Inovador" fieldName="diferencialInovador" isLoading={ai.fillingField === 'diferencialInovador'} onGenerate={() => handleFillField('diferencialInovador', 'Diferencial Inovador')}>
          <Textarea value={formData.diferencialInovador} onChange={e => update('diferencialInovador', e.target.value)}
            placeholder="IA generativa, automação de processos, transparência ativa nativa, etc." className="min-h-[80px]" />
        </AIField>
        <AIField label="Ganho de Eficiência" fieldName="ganhoEficiencia" isLoading={ai.fillingField === 'ganhoEficiencia'} onGenerate={() => handleFillField('ganhoEficiencia', 'Ganho de Eficiência')}>
          <Textarea value={formData.ganhoEficiencia} onChange={e => update('ganhoEficiencia', e.target.value)}
            placeholder="Redução de tempo, eliminação de retrabalho, economia de recursos, etc." className="min-h-[60px]" />
        </AIField>
        <AIField label="Base Comparativa" fieldName="baseComparativa" isLoading={ai.fillingField === 'baseComparativa'} onGenerate={() => handleFillField('baseComparativa', 'Base Comparativa')}>
          <Textarea value={formData.baseComparativa} onChange={e => update('baseComparativa', e.target.value)}
            placeholder="Compare com soluções tradicionais disponíveis no mercado" className="min-h-[60px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">8. Demonstração em Ambiente Real</h3>
        <AIField label="Ambiente de Teste" fieldName="ambienteTeste" isLoading={ai.fillingField === 'ambienteTeste'} onGenerate={() => handleFillField('ambienteTeste', 'Ambiente de Teste')}>
          <Textarea value={formData.ambienteTeste} onChange={e => update('ambienteTeste', e.target.value)}
            placeholder="Descreva o ambiente onde a solução será testada (setores, processos, usuários)" className="min-h-[60px]" />
        </AIField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Critérios de Avaliação" fieldName="criteriosAvaliacao" isLoading={ai.fillingField === 'criteriosAvaliacao'} onGenerate={() => handleFillField('criteriosAvaliacao', 'Critérios de Avaliação')}>
            <Textarea value={formData.criteriosAvaliacao} onChange={e => update('criteriosAvaliacao', e.target.value)}
              placeholder="KPIs, métricas de sucesso, indicadores" className="min-h-[60px]" />
          </AIField>
          <AIField label="Prazo do Teste" fieldName="prazoTeste" isLoading={ai.fillingField === 'prazoTeste'} onGenerate={() => handleFillField('prazoTeste', 'Prazo do Teste')}>
            <Input value={formData.prazoTeste} onChange={e => update('prazoTeste', e.target.value)} placeholder="Ex: 12 meses" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">9. Análise de Riscos</h3>
        <AIField label="Riscos Identificados" fieldName="riscos" isLoading={ai.fillingField === 'riscos'} onGenerate={() => handleFillField('riscos', 'Riscos Identificados')}>
          <Textarea value={formData.riscos} onChange={e => update('riscos', e.target.value)}
            placeholder="Liste os principais riscos da contratação" className="min-h-[80px]" />
        </AIField>
        <AIField label="Medidas de Mitigação" fieldName="mitigacao" isLoading={ai.fillingField === 'mitigacao'} onGenerate={() => handleFillField('mitigacao', 'Medidas de Mitigação')}>
          <Textarea value={formData.mitigacao} onChange={e => update('mitigacao', e.target.value)}
            placeholder="Ações para mitigar cada risco identificado" className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">10. Viabilidade</h3>
        <AIField label="Viabilidade Técnica" fieldName="viabilidadeTecnica" isLoading={ai.fillingField === 'viabilidadeTecnica'} onGenerate={() => handleFillField('viabilidadeTecnica', 'Viabilidade Técnica')}>
          <Textarea value={formData.viabilidadeTecnica} onChange={e => update('viabilidadeTecnica', e.target.value)}
            placeholder="Demonstre a viabilidade técnica da solução" className="min-h-[60px]" />
        </AIField>
        <AIField label="Viabilidade Orçamentária" fieldName="viabilidadeOrcamentaria" isLoading={ai.fillingField === 'viabilidadeOrcamentaria'} onGenerate={() => handleFillField('viabilidadeOrcamentaria', 'Viabilidade Orçamentária')}>
          <Textarea value={formData.viabilidadeOrcamentaria} onChange={e => update('viabilidadeOrcamentaria', e.target.value)}
            placeholder="Fonte de recursos, dotação orçamentária" className="min-h-[60px]" />
        </AIField>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Observações</label>
        <Textarea value={formData.observacoes} onChange={e => update('observacoes', e.target.value)}
          placeholder="Informações complementares (opcional)" className="min-h-[60px]" />
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        {isGenerating ? 'Gerando PDF...' : 'Gerar ETP (PDF)'}
      </Button>
    </div>
  );
};

// ============ COMPONENTE TR ============

const TRForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFillDialog, setShowFillDialog] = useState(false);
  const [formData, setFormData] = useState<TRData>({
    objeto: '',
    justificativa: '',
    fundamentacaoLegal: 'Lei Complementar nº 182/2021 (Marco Legal das Startups), art. 11 a 16; Lei nº 14.133/2021 (Nova Lei de Licitações); IN SEGES/MP nº 5/2017.',
    descricaoDetalhada: '',
    modulosSistema: '',
    requisitosTecnicos: '',
    requisitosSeguranca: '',
    requisitosDesempenho: '',
    metricas: '',
    criteriosAceite: '',
    prazoExecucao: '',
    cronograma: '',
    valorEstimado: '',
    condicoesPagamento: '',
    obrigatoesContratada: '',
    obrigatoesContratante: '',
    sancoes: '',
    observacoes: '',
  });

  const ai = useAICPSI({ documentType: 'tr' });

  const update = (field: keyof TRData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFillAll = (context: string) => {
    ai.fillAll(context, (fields) => {
      setFormData(prev => ({ ...prev, ...fields }));
      setShowFillDialog(false);
    });
  };

  const handleFillField = (field: keyof TRData, label: string) => {
    ai.fillField(field, label, formData[field] || '', formData as unknown as Record<string, string>, (value) => {
      update(field, value);
    });
  };

  const handleGenerate = async () => {
    if (!formData.objeto || !formData.justificativa) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setIsGenerating(true);
    try {
      const numero = await generateTR(formData);
      toast.success('TR gerado com sucesso!', { description: `Documento nº ${numero}` });
    } catch {
      toast.error('Erro ao gerar Termo de Referência');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AIToolbar
        onFillAll={() => setShowFillDialog(true)}
        onReview={() => ai.review(formData as unknown as Record<string, string>)}
        isFillingAll={ai.isFillingAll}
        isReviewing={ai.isReviewing}
      />

      <AIFillDialog
        isOpen={showFillDialog}
        onClose={() => setShowFillDialog(false)}
        onSubmit={handleFillAll}
        isLoading={ai.isFillingAll}
        docName="Termo de Referência"
      />

      <AIReviewPanel
        isReviewing={ai.isReviewing}
        reviewResult={ai.reviewResult}
        onClose={() => ai.setReviewResult('')}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Objeto *</h3>
        <AIField label="" fieldName="objeto" isLoading={ai.fillingField === 'objeto'} onGenerate={() => handleFillField('objeto', 'Objeto')}>
          <Textarea value={formData.objeto} onChange={e => update('objeto', e.target.value)}
            placeholder="Contratação de solução tecnológica inovadora para sistema de governança digital..." className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">2. Justificativa *</h3>
        <AIField label="" fieldName="justificativa" isLoading={ai.fillingField === 'justificativa'} onGenerate={() => handleFillField('justificativa', 'Justificativa')}>
          <Textarea value={formData.justificativa} onChange={e => update('justificativa', e.target.value)}
            placeholder="Justifique a contratação demonstrando o interesse público e a necessidade institucional" className="min-h-[100px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">3. Fundamentação Legal</h3>
        <AIField label="" fieldName="fundamentacaoLegal" isLoading={ai.fillingField === 'fundamentacaoLegal'} onGenerate={() => handleFillField('fundamentacaoLegal', 'Fundamentação Legal')}>
          <Textarea value={formData.fundamentacaoLegal} onChange={e => update('fundamentacaoLegal', e.target.value)}
            className="min-h-[60px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">4. Descrição Detalhada</h3>
        <AIField label="Descrição da Solução" fieldName="descricaoDetalhada" isLoading={ai.fillingField === 'descricaoDetalhada'} onGenerate={() => handleFillField('descricaoDetalhada', 'Descrição Detalhada')}>
          <Textarea value={formData.descricaoDetalhada} onChange={e => update('descricaoDetalhada', e.target.value)}
            placeholder="Descreva em detalhe a solução pretendida, funcionalidades e integrações" className="min-h-[100px]" />
        </AIField>
        <AIField label="Módulos do Sistema" fieldName="modulosSistema" isLoading={ai.fillingField === 'modulosSistema'} onGenerate={() => handleFillField('modulosSistema', 'Módulos do Sistema')}>
          <Textarea value={formData.modulosSistema} onChange={e => update('modulosSistema', e.target.value)}
            placeholder="RH, Financeiro, Patrimônio, Licitações, Contratos, Governança, Transparência, etc." className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">5. Requisitos Técnicos</h3>
        <AIField label="Requisitos Funcionais" fieldName="requisitosTecnicos" isLoading={ai.fillingField === 'requisitosTecnicos'} onGenerate={() => handleFillField('requisitosTecnicos', 'Requisitos Técnicos')}>
          <Textarea value={formData.requisitosTecnicos} onChange={e => update('requisitosTecnicos', e.target.value)}
            placeholder="Funcionalidades obrigatórias que a solução deve atender" className="min-h-[80px]" />
        </AIField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Segurança" fieldName="requisitosSeguranca" isLoading={ai.fillingField === 'requisitosSeguranca'} onGenerate={() => handleFillField('requisitosSeguranca', 'Requisitos de Segurança')}>
            <Textarea value={formData.requisitosSeguranca} onChange={e => update('requisitosSeguranca', e.target.value)}
              placeholder="LGPD, criptografia, RBAC, auditoria, backup" className="min-h-[60px]" />
          </AIField>
          <AIField label="Desempenho" fieldName="requisitosDesempenho" isLoading={ai.fillingField === 'requisitosDesempenho'} onGenerate={() => handleFillField('requisitosDesempenho', 'Requisitos de Desempenho')}>
            <Textarea value={formData.requisitosDesempenho} onChange={e => update('requisitosDesempenho', e.target.value)}
              placeholder="SLA, uptime, tempo de resposta, escalabilidade" className="min-h-[60px]" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">6. Metodologia de Avaliação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Métricas" fieldName="metricas" isLoading={ai.fillingField === 'metricas'} onGenerate={() => handleFillField('metricas', 'Métricas')}>
            <Textarea value={formData.metricas} onChange={e => update('metricas', e.target.value)}
              placeholder="KPIs para avaliar o desempenho da solução" className="min-h-[60px]" />
          </AIField>
          <AIField label="Critérios de Aceite" fieldName="criteriosAceite" isLoading={ai.fillingField === 'criteriosAceite'} onGenerate={() => handleFillField('criteriosAceite', 'Critérios de Aceite')}>
            <Textarea value={formData.criteriosAceite} onChange={e => update('criteriosAceite', e.target.value)}
              placeholder="Condições mínimas para aceite da solução" className="min-h-[60px]" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">7. Prazo de Execução</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Prazo" fieldName="prazoExecucao" isLoading={ai.fillingField === 'prazoExecucao'} onGenerate={() => handleFillField('prazoExecucao', 'Prazo de Execução')}>
            <Input value={formData.prazoExecucao} onChange={e => update('prazoExecucao', e.target.value)} placeholder="Ex: 12 meses" />
          </AIField>
          <AIField label="Cronograma" fieldName="cronograma" isLoading={ai.fillingField === 'cronograma'} onGenerate={() => handleFillField('cronograma', 'Cronograma')}>
            <Textarea value={formData.cronograma} onChange={e => update('cronograma', e.target.value)}
              placeholder="Fases, marcos e entregas" className="min-h-[60px]" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">8. Valor e Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AIField label="Valor Estimado" fieldName="valorEstimado" isLoading={ai.fillingField === 'valorEstimado'} onGenerate={() => handleFillField('valorEstimado', 'Valor Estimado')}>
            <Input value={formData.valorEstimado} onChange={e => update('valorEstimado', e.target.value)} placeholder="R$ 0,00" />
          </AIField>
          <AIField label="Condições de Pagamento" fieldName="condicoesPagamento" isLoading={ai.fillingField === 'condicoesPagamento'} onGenerate={() => handleFillField('condicoesPagamento', 'Condições de Pagamento')}>
            <Textarea value={formData.condicoesPagamento} onChange={e => update('condicoesPagamento', e.target.value)}
              placeholder="Mensal, por entrega, etc." className="min-h-[60px]" />
          </AIField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">9. Obrigações das Partes</h3>
        <AIField label="Obrigações da Contratada" fieldName="obrigatoesContratada" isLoading={ai.fillingField === 'obrigatoesContratada'} onGenerate={() => handleFillField('obrigatoesContratada', 'Obrigações da Contratada')}>
          <Textarea value={formData.obrigatoesContratada} onChange={e => update('obrigatoesContratada', e.target.value)}
            placeholder="Entrega, suporte, SLA, treinamento, documentação, etc." className="min-h-[80px]" />
        </AIField>
        <AIField label="Obrigações da Contratante" fieldName="obrigatoesContratante" isLoading={ai.fillingField === 'obrigatoesContratante'} onGenerate={() => handleFillField('obrigatoesContratante', 'Obrigações da Contratante')}>
          <Textarea value={formData.obrigatoesContratante} onChange={e => update('obrigatoesContratante', e.target.value)}
            placeholder="Fornecer dados, ambiente, designar fiscal, efetuar pagamento, etc." className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">10. Sanções</h3>
        <AIField label="" fieldName="sancoes" isLoading={ai.fillingField === 'sancoes'} onGenerate={() => handleFillField('sancoes', 'Sanções')}>
          <Textarea value={formData.sancoes} onChange={e => update('sancoes', e.target.value)}
            placeholder="Penalidades aplicáveis conforme Lei 14.133/2021" className="min-h-[80px]" />
        </AIField>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Observações</label>
        <Textarea value={formData.observacoes} onChange={e => update('observacoes', e.target.value)}
          placeholder="Informações complementares (opcional)" className="min-h-[60px]" />
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        {isGenerating ? 'Gerando PDF...' : 'Gerar Termo de Referência (PDF)'}
      </Button>
    </div>
  );
};

// ============ PÁGINA PRINCIPAL ============

const CPSIPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/processos/compras" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Compras e Contratos
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle>CPSI — Contrato Público de Solução Inovadora</CardTitle>
                    <Badge variant="secondary" className="text-xs">LC 182/2021</Badge>
                    <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA Integrada
                    </Badge>
                  </div>
                  <CardDescription>
                    Gere os documentos necessários para abrir processo de contratação de soluções inovadoras — com assistência de IA
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="dfd" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dfd" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">DFD</span>
                    <span className="sm:hidden">DFD</span>
                  </TabsTrigger>
                  <TabsTrigger value="etp" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">ETP</span>
                    <span className="sm:hidden">ETP</span>
                  </TabsTrigger>
                  <TabsTrigger value="tr" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Termo de Referência</span>
                    <span className="sm:hidden">TR</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <strong>Fluxo recomendado:</strong> DFD → ETP → TR (conforme IN SEGES/MP nº 5/2017, art. 20) &nbsp;|&nbsp;
                  <Sparkles className="h-3.5 w-3.5 inline" /> Use os botões de IA para preencher campos automaticamente ou revisar o documento.
                </div>

                <TabsContent value="dfd" className="mt-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Documento de Formalização de Demanda</h2>
                    <p className="text-sm text-muted-foreground">Formaliza a necessidade junto à área competente</p>
                  </div>
                  <DFDForm />
                </TabsContent>

                <TabsContent value="etp" className="mt-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Estudo Técnico Preliminar</h2>
                    <p className="text-sm text-muted-foreground">Análise técnica conforme IN SEGES/MP nº 5/2017 com parâmetros de inovação (LC 182/2021)</p>
                  </div>
                  <ETPForm />
                </TabsContent>

                <TabsContent value="tr" className="mt-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Termo de Referência</h2>
                    <p className="text-sm text-muted-foreground">Especificação técnica para o edital — Lei 14.133/2021 c/c LC 182/2021</p>
                  </div>
                  <TRForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CPSIPage;
