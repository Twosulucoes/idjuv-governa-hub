/**
 * Página pública de Cadastro de Árbitros - IDJuv
 * Formulário multi-step com revisão antes do envio
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send, User, FileText, MapPin, Phone, Briefcase, Building2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { StepDadosPessoais } from './steps/StepDadosPessoais';
import { StepDocumentos } from './steps/StepDocumentos';
import { StepEndereco } from './steps/StepEndereco';
import { StepContato } from './steps/StepContato';
import { StepProfissional } from './steps/StepProfissional';
import { StepBancario } from './steps/StepBancario';
import { StepFotoDocumentos } from './steps/StepFotoDocumentos';
import { StepRevisao } from './steps/StepRevisao';

export interface ArbitroFormData {
  nome: string;
  nacionalidade: string;
  sexo: string;
  data_nascimento: string;
  categoria: string;
  tipo_sanguineo: string;
  fator_rh: string;
  cpf: string;
  rg: string;
  rne: string;
  validade_rne: string;
  pis_pasep: string;
  cep: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  email: string;
  celular: string;
  modalidade: string;
  local_trabalho: string;
  funcao: string;
  esfera: string;
  banco: string;
  agencia: string;
  conta_corrente: string;
  foto_url: string;
  documentos_urls: string[];
}

const INITIAL_DATA: ArbitroFormData = {
  nome: '', nacionalidade: 'brasileira', sexo: '', data_nascimento: '', categoria: '',
  tipo_sanguineo: '', fator_rh: '', cpf: '', rg: '', rne: '', validade_rne: '',
  pis_pasep: '', cep: '', endereco: '', complemento: '', bairro: '', cidade: '',
  uf: '', email: '', ddd: '', celular: '', modalidade: '', local_trabalho: '',
  funcao: '', esfera: '', banco: '', agencia: '', conta_corrente: '',
  foto_url: '', documentos_urls: [],
};

const STEPS = [
  { label: 'Dados Pessoais', icon: User },
  { label: 'Documentos', icon: FileText },
  { label: 'Endereço', icon: MapPin },
  { label: 'Contato', icon: Phone },
  { label: 'Profissional', icon: Briefcase },
  { label: 'Bancário', icon: Building2 },
  { label: 'Foto / Docs', icon: Camera },
  { label: 'Revisão', icon: CheckCircle2 },
];

export default function CadastroArbitroPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ArbitroFormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  function updateField(field: keyof ArbitroFormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!(formData.nome.trim() && formData.sexo && formData.data_nascimento && formData.categoria);
      case 1: return !!formData.cpf.trim();
      case 2: return true;
      case 3: return !!(formData.email.trim() && formData.celular.trim());
      case 4: return !!formData.modalidade.trim();
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('cadastro_arbitros').insert({
        nome: formData.nome.trim(),
        nacionalidade: formData.nacionalidade,
        sexo: formData.sexo,
        data_nascimento: formData.data_nascimento,
        categoria: formData.categoria,
        tipo_sanguineo: formData.tipo_sanguineo || null,
        fator_rh: formData.fator_rh || null,
        cpf: formData.cpf.trim(),
        rg: formData.rg || null,
        rne: formData.rne || null,
        validade_rne: formData.validade_rne || null,
        pis_pasep: formData.pis_pasep || null,
        cep: formData.cep || null,
        endereco: formData.endereco || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        uf: formData.uf || null,
        email: formData.email.trim(),
        ddd: formData.ddd || null,
        celular: formData.celular.trim(),
        modalidade: formData.modalidade.trim(),
        local_trabalho: formData.local_trabalho || null,
        funcao: formData.funcao || null,
        esfera: formData.esfera || null,
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta_corrente: formData.conta_corrente || null,
        foto_url: formData.foto_url || null,
        documentos_urls: formData.documentos_urls.length > 0 ? formData.documentos_urls : null,
      } as any).select('protocolo').single();

      if (error) throw error;
      setProtocolo(data?.protocolo || 'Gerado');
      toast.success('Cadastro enviado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao enviar cadastro:', err);
      toast.error(err.message || 'Erro ao enviar cadastro');
    } finally {
      setLoading(false);
    }
  }

  // Tela de sucesso
  if (protocolo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-800">Cadastro Enviado!</h2>
            <p className="text-muted-foreground">Seu cadastro foi recebido com sucesso.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Seu protocolo:</p>
              <p className="text-2xl font-mono font-bold text-green-700">{protocolo}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Guarde este número para consultas futuras.
            </p>
            <Button onClick={() => { setProtocolo(null); setFormData(INITIAL_DATA); setStep(0); }} variant="outline">
              Novo Cadastro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">Cadastro de Árbitros — IDJuv</h1>
          <p className="text-sm text-muted-foreground">Preencha seus dados para se cadastrar como árbitro</p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all
                  ${isActive ? 'bg-primary text-primary-foreground shadow-md scale-105' : ''}
                  ${isDone ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' : ''}
                  ${!isActive && !isDone ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Etapa {step + 1} de {STEPS.length}: <strong>{STEPS[step].label}</strong></p>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6 space-y-5">
            {step === 0 && <StepDadosPessoais data={formData} update={updateField} />}
            {step === 1 && <StepDocumentos data={formData} update={updateField} />}
            {step === 2 && <StepEndereco data={formData} update={updateField} />}
            {step === 3 && <StepContato data={formData} update={updateField} />}
            {step === 4 && <StepProfissional data={formData} update={updateField} />}
            {step === 5 && <StepBancario data={formData} update={updateField} />}
            {step === 6 && <StepFotoDocumentos data={formData} update={updateField} />}
            {step === 7 && <StepRevisao data={formData} onEdit={setStep} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pb-8">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar Cadastro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
