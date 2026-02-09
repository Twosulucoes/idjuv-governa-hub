/**
 * FORMULÁRIO CPSI - Contrato Público de Solução Inovadora
 * LC 182/2021 (Marco Legal das Startups)
 * 
 * Gera: DFD, ETP e TR para processo de aquisição de soluções inovadoras
 */

import { useState } from 'react';
import { FileText, Download, ArrowLeft, Lightbulb, ClipboardList, BookOpen } from 'lucide-react';
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

// ============ COMPONENTE DFD ============

const DFDForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<DFDData>({
    areaRequisitante: '',
    responsavel: '',
    cargo: '',
    problemaIdentificado: '',
    necessidade: '',
    alinhamentoEstrategico: '',
    resultadosEsperados: '',
    previsaoContratacao: '',
    observacoes: '',
  });

  const update = (field: keyof DFDData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.problemaIdentificado || !formData.necessidade) {
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Identificação da Demanda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Área Requisitante *</label>
            <Input value={formData.areaRequisitante} onChange={e => update('areaRequisitante', e.target.value)} placeholder="Ex: DIRAF" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Responsável *</label>
            <Input value={formData.responsavel} onChange={e => update('responsavel', e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cargo/Função</label>
            <Input value={formData.cargo} onChange={e => update('cargo', e.target.value)} placeholder="Ex: Diretor Administrativo" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">2. Problema Identificado *</h3>
        <Textarea value={formData.problemaIdentificado} onChange={e => update('problemaIdentificado', e.target.value)}
          placeholder="Descreva o problema que a administração enfrenta e que motiva a busca por solução inovadora" className="min-h-[120px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">3. Necessidade da Contratação *</h3>
        <Textarea value={formData.necessidade} onChange={e => update('necessidade', e.target.value)}
          placeholder="Explique por que soluções tradicionais não atendem e qual a necessidade específica" className="min-h-[100px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">4. Alinhamento Estratégico</h3>
        <Textarea value={formData.alinhamentoEstrategico} onChange={e => update('alinhamentoEstrategico', e.target.value)}
          placeholder="Relação com o planejamento estratégico, PPA, LOA ou metas institucionais" className="min-h-[80px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">5. Resultados Esperados</h3>
        <Textarea value={formData.resultadosEsperados} onChange={e => update('resultadosEsperados', e.target.value)}
          placeholder="Quais resultados mensuráveis são esperados com a solução inovadora" className="min-h-[80px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Previsão de Contratação</label>
          <Input value={formData.previsaoContratacao} onChange={e => update('previsaoContratacao', e.target.value)} placeholder="Ex: 2º semestre de 2026" />
        </div>
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

  const update = (field: keyof ETPData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Descrição da Necessidade *</h3>
        <Textarea value={formData.descricaoNecessidade} onChange={e => update('descricaoNecessidade', e.target.value)}
          placeholder="Descreva a necessidade que se pretende atender com a contratação" className="min-h-[100px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">2. Área Requisitante</h3>
        <Input value={formData.areaRequisitante} onChange={e => update('areaRequisitante', e.target.value)} placeholder="Ex: DIRAF - Diretoria Administrativa e Financeira" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">3. Requisitos da Contratação</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Requisitos Técnicos</label>
          <Textarea value={formData.requisitosTecnicos} onChange={e => update('requisitosTecnicos', e.target.value)}
            placeholder="Arquitetura cloud-native, SaaS, API RESTful, segurança LGPD, etc." className="min-h-[80px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Requisitos de Negócio</label>
          <Textarea value={formData.requisitosNegocio} onChange={e => update('requisitosNegocio', e.target.value)}
            placeholder="Módulos funcionais, integrações, workflows, relatórios, etc." className="min-h-[80px]" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">4. Estimativa de Valor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Estimado</label>
            <Input value={formData.estimativaValor} onChange={e => update('estimativaValor', e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Metodologia</label>
            <Input value={formData.metodologiaEstimativa} onChange={e => update('metodologiaEstimativa', e.target.value)} placeholder="Pesquisa de mercado, benchmarking, etc." />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">5. Justificativa da Contratação</h3>
        <Textarea value={formData.justificativaContratacao} onChange={e => update('justificativaContratacao', e.target.value)}
          placeholder="Demonstre por que é necessário contratar solução inovadora via CPSI" className="min-h-[100px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">6. Descrição da Solução *</h3>
        <Textarea value={formData.descricaoSolucao} onChange={e => update('descricaoSolucao', e.target.value)}
          placeholder="Descreva a solução inovadora pretendida (sistema de governança digital, portal, etc.)" className="min-h-[100px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">7. Parâmetros de Inovação (LC 182/2021)</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Diferencial Inovador</label>
          <Textarea value={formData.diferencialInovador} onChange={e => update('diferencialInovador', e.target.value)}
            placeholder="IA generativa, automação de processos, transparência ativa nativa, etc." className="min-h-[80px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ganho de Eficiência</label>
          <Textarea value={formData.ganhoEficiencia} onChange={e => update('ganhoEficiencia', e.target.value)}
            placeholder="Redução de tempo, eliminação de retrabalho, economia de recursos, etc." className="min-h-[60px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Comparativa</label>
          <Textarea value={formData.baseComparativa} onChange={e => update('baseComparativa', e.target.value)}
            placeholder="Compare com soluções tradicionais disponíveis no mercado" className="min-h-[60px]" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">8. Demonstração em Ambiente Real</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ambiente de Teste</label>
          <Textarea value={formData.ambienteTeste} onChange={e => update('ambienteTeste', e.target.value)}
            placeholder="Descreva o ambiente onde a solução será testada (setores, processos, usuários)" className="min-h-[60px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Critérios de Avaliação</label>
            <Textarea value={formData.criteriosAvaliacao} onChange={e => update('criteriosAvaliacao', e.target.value)}
              placeholder="KPIs, métricas de sucesso, indicadores" className="min-h-[60px]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prazo do Teste</label>
            <Input value={formData.prazoTeste} onChange={e => update('prazoTeste', e.target.value)} placeholder="Ex: 12 meses" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">9. Análise de Riscos</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Riscos Identificados</label>
          <Textarea value={formData.riscos} onChange={e => update('riscos', e.target.value)}
            placeholder="Liste os principais riscos da contratação" className="min-h-[80px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Medidas de Mitigação</label>
          <Textarea value={formData.mitigacao} onChange={e => update('mitigacao', e.target.value)}
            placeholder="Ações para mitigar cada risco identificado" className="min-h-[80px]" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">10. Viabilidade</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Viabilidade Técnica</label>
          <Textarea value={formData.viabilidadeTecnica} onChange={e => update('viabilidadeTecnica', e.target.value)}
            placeholder="Demonstre a viabilidade técnica da solução" className="min-h-[60px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Viabilidade Orçamentária</label>
          <Textarea value={formData.viabilidadeOrcamentaria} onChange={e => update('viabilidadeOrcamentaria', e.target.value)}
            placeholder="Fonte de recursos, dotação orçamentária" className="min-h-[60px]" />
        </div>
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

  const update = (field: keyof TRData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Objeto *</h3>
        <Textarea value={formData.objeto} onChange={e => update('objeto', e.target.value)}
          placeholder="Contratação de solução tecnológica inovadora para sistema de governança digital..." className="min-h-[80px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">2. Justificativa *</h3>
        <Textarea value={formData.justificativa} onChange={e => update('justificativa', e.target.value)}
          placeholder="Justifique a contratação demonstrando o interesse público e a necessidade institucional" className="min-h-[100px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">3. Fundamentação Legal</h3>
        <Textarea value={formData.fundamentacaoLegal} onChange={e => update('fundamentacaoLegal', e.target.value)}
          className="min-h-[60px]" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">4. Descrição Detalhada</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Descrição da Solução</label>
          <Textarea value={formData.descricaoDetalhada} onChange={e => update('descricaoDetalhada', e.target.value)}
            placeholder="Descreva em detalhe a solução pretendida, funcionalidades e integrações" className="min-h-[100px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Módulos do Sistema</label>
          <Textarea value={formData.modulosSistema} onChange={e => update('modulosSistema', e.target.value)}
            placeholder="RH, Financeiro, Patrimônio, Licitações, Contratos, Governança, Transparência, etc." className="min-h-[80px]" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">5. Requisitos Técnicos</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Requisitos Funcionais</label>
          <Textarea value={formData.requisitosTecnicos} onChange={e => update('requisitosTecnicos', e.target.value)}
            placeholder="Funcionalidades obrigatórias que a solução deve atender" className="min-h-[80px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Segurança</label>
            <Textarea value={formData.requisitosSeguranca} onChange={e => update('requisitosSeguranca', e.target.value)}
              placeholder="LGPD, criptografia, RBAC, auditoria, backup" className="min-h-[60px]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Desempenho</label>
            <Textarea value={formData.requisitosDesempenho} onChange={e => update('requisitosDesempenho', e.target.value)}
              placeholder="SLA, uptime, tempo de resposta, escalabilidade" className="min-h-[60px]" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">6. Metodologia de Avaliação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Métricas</label>
            <Textarea value={formData.metricas} onChange={e => update('metricas', e.target.value)}
              placeholder="KPIs para avaliar o desempenho da solução" className="min-h-[60px]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Critérios de Aceite</label>
            <Textarea value={formData.criteriosAceite} onChange={e => update('criteriosAceite', e.target.value)}
              placeholder="Condições mínimas para aceite da solução" className="min-h-[60px]" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">7. Prazo de Execução</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prazo</label>
            <Input value={formData.prazoExecucao} onChange={e => update('prazoExecucao', e.target.value)} placeholder="Ex: 12 meses" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cronograma</label>
            <Textarea value={formData.cronograma} onChange={e => update('cronograma', e.target.value)}
              placeholder="Fases, marcos e entregas" className="min-h-[60px]" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">8. Valor e Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Estimado</label>
            <Input value={formData.valorEstimado} onChange={e => update('valorEstimado', e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Condições de Pagamento</label>
            <Textarea value={formData.condicoesPagamento} onChange={e => update('condicoesPagamento', e.target.value)}
              placeholder="Mensal, por entrega, etc." className="min-h-[60px]" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">9. Obrigações das Partes</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Obrigações da Contratada</label>
          <Textarea value={formData.obrigatoesContratada} onChange={e => update('obrigatoesContratada', e.target.value)}
            placeholder="Entrega, suporte, SLA, treinamento, documentação, etc." className="min-h-[80px]" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Obrigações da Contratante</label>
          <Textarea value={formData.obrigatoesContratante} onChange={e => update('obrigatoesContratante', e.target.value)}
            placeholder="Fornecer dados, ambiente, designar fiscal, efetuar pagamento, etc." className="min-h-[80px]" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">10. Sanções</h3>
        <Textarea value={formData.sancoes} onChange={e => update('sancoes', e.target.value)}
          placeholder="Penalidades aplicáveis conforme Lei 14.133/2021" className="min-h-[80px]" />
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
                  <div className="flex items-center gap-2">
                    <CardTitle>CPSI — Contrato Público de Solução Inovadora</CardTitle>
                    <Badge variant="secondary" className="text-xs">LC 182/2021</Badge>
                  </div>
                  <CardDescription>
                    Gere os documentos necessários para abrir processo de contratação de soluções inovadoras
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
                  <strong>Fluxo recomendado:</strong> DFD → ETP → TR (conforme IN SEGES/MP nº 5/2017, art. 20)
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
