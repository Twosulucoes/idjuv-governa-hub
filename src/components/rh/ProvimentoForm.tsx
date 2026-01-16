import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Award, AlertTriangle, CheckCircle2, Search, Building2, GitBranch } from "lucide-react";
import { useCreateProvimento } from "@/hooks/useServidorCompleto";
import {
  type NaturezaCargo,
  type TipoServidor,
  REGRAS_TIPO_SERVIDOR,
  NATUREZA_CARGO_LABELS,
} from "@/types/servidor";
import { LABELS_UNIDADE, type TipoUnidade } from "@/types/organograma";

interface Props {
  servidorId: string;
  servidorNome: string;
  tipoServidor?: TipoServidor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  temProvimentoAtivo?: boolean;
}

interface CargoComDisponibilidade {
  id: string;
  nome: string;
  sigla: string | null;
  natureza: string;
  quantidade_vagas: number;
  vencimento_base: number | null;
  ocupadas: number;
  disponiveis: number;
}

type StepType = 'natureza' | 'cargo' | 'diretoria' | 'divisao' | 'nucleo' | 'dados';

export function ProvimentoForm({ 
  servidorId, 
  servidorNome, 
  tipoServidor, 
  open, 
  onOpenChange,
  temProvimentoAtivo = false 
}: Props) {
  const createProvimento = useCreateProvimento();
  
  // Estado do wizard
  const [currentStep, setCurrentStep] = useState<StepType>('natureza');
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<NaturezaCargo | ''>('');
  const [buscaCargo, setBuscaCargo] = useState('');
  const [cargoId, setCargoId] = useState('');
  
  // Seleção em cascata
  const [diretoriaId, setDiretoriaId] = useState('');
  const [divisaoId, setDivisaoId] = useState('');
  const [nucleoId, setNucleoId] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  
  // Datas
  const [dataNomeacao, setDataNomeacao] = useState('');
  const [dataPosse, setDataPosse] = useState('');
  const [dataExercicio, setDataExercicio] = useState('');
  
  const [observacoes, setObservacoes] = useState('');

  // Regras baseadas no tipo de servidor
  const regras = tipoServidor ? REGRAS_TIPO_SERVIDOR[tipoServidor] : null;
  const naturezasPermitidas = regras?.tiposCargo || ['efetivo', 'comissionado'];

  // Buscar cargos com disponibilidade
  const { data: cargos = [], isLoading: loadingCargos } = useQuery({
    queryKey: ["cargos-disponibilidade", naturezaSelecionada],
    queryFn: async () => {
      if (!naturezaSelecionada) return [];
      
      const { data: cargosData, error: cargosError } = await supabase
        .from("cargos")
        .select("id, nome, sigla, natureza, quantidade_vagas, vencimento_base")
        .eq("ativo", true)
        .eq("natureza", naturezaSelecionada)
        .order("nome");
      
      if (cargosError) throw cargosError;
      if (!cargosData) return [];

      const { data: provimentosAtivos, error: provError } = await supabase
        .from("provimentos")
        .select("cargo_id")
        .eq("status", "ativo");
      if (provError) throw provError;

      const ocupadasPorCargo: Record<string, number> = {};
      provimentosAtivos?.forEach(p => {
        if (p.cargo_id) {
          ocupadasPorCargo[p.cargo_id] = (ocupadasPorCargo[p.cargo_id] || 0) + 1;
        }
      });

      const result: CargoComDisponibilidade[] = cargosData
        .map(cargo => {
          const ocupadas = ocupadasPorCargo[cargo.id] || 0;
          const vagas = cargo.quantidade_vagas || 1;
          return {
            ...cargo,
            ocupadas,
            disponiveis: vagas - ocupadas,
          };
        })
        .filter(cargo => cargo.disponiveis > 0);

      return result;
    },
    enabled: !!naturezaSelecionada,
  });

  // Cargo selecionado
  const cargoSelecionado = useMemo(() => 
    cargos.find(c => c.id === cargoId), 
    [cargos, cargoId]
  );

  // Determinar steps necessários baseado no cargo
  const stepsNecessarios = useMemo((): StepType[] => {
    if (!cargoSelecionado) return ['natureza', 'cargo', 'dados'];
    
    const cargoNome = cargoSelecionado.nome.toLowerCase();
    
    // Chefe de Núcleo: precisa escolher Diretoria → Divisão → Núcleo
    if (cargoNome.includes('núcleo')) {
      return ['natureza', 'cargo', 'diretoria', 'divisao', 'nucleo', 'dados'];
    }
    // Chefe de Divisão: precisa escolher Diretoria → Divisão
    if (cargoNome.includes('divisão')) {
      return ['natureza', 'cargo', 'diretoria', 'divisao', 'dados'];
    }
    // Secretária de Diretoria, Diretor: precisa escolher Diretoria
    if (cargoNome.includes('diretoria') || cargoNome.includes('diretor')) {
      return ['natureza', 'cargo', 'diretoria', 'dados'];
    }
    // Cargos com unidade fixa (Presidente, Assessor, Chefe Gabinete, etc.)
    return ['natureza', 'cargo', 'dados'];
  }, [cargoSelecionado]);

  // Índice do step atual
  const stepIndex = stepsNecessarios.indexOf(currentStep);
  const totalSteps = stepsNecessarios.length;

  // Buscar diretorias disponíveis para o cargo
  const { data: diretorias = [], isLoading: loadingDiretorias } = useQuery({
    queryKey: ["diretorias-disponiveis", cargoId],
    queryFn: async () => {
      if (!cargoId) return [];
      
      // Buscar diretorias (tipo = 'diretoria')
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("tipo", "diretoria")
        .eq("ativo", true)
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
    enabled: stepsNecessarios.includes('diretoria') && !!cargoId,
  });

  // Buscar divisões da diretoria selecionada
  const { data: divisoes = [], isLoading: loadingDivisoes } = useQuery({
    queryKey: ["divisoes-diretoria", diretoriaId],
    queryFn: async () => {
      if (!diretoriaId) return [];
      
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("superior_id", diretoriaId)
        .eq("tipo", "divisao")
        .eq("ativo", true)
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
    enabled: stepsNecessarios.includes('divisao') && !!diretoriaId,
  });

  // Buscar núcleos da divisão selecionada
  const { data: nucleos = [], isLoading: loadingNucleos } = useQuery({
    queryKey: ["nucleos-divisao", divisaoId],
    queryFn: async () => {
      if (!divisaoId) return [];
      
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("superior_id", divisaoId)
        .eq("tipo", "setor")
        .eq("ativo", true)
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
    enabled: stepsNecessarios.includes('nucleo') && !!divisaoId,
  });

  // Buscar unidade automática para cargos com unidade fixa
  const { data: unidadeAutomatica } = useQuery({
    queryKey: ["unidade-automatica", cargoId],
    queryFn: async () => {
      if (!cargoSelecionado) return null;
      
      const cargoNome = cargoSelecionado.nome.toLowerCase();
      let sigla = '';
      
      if (cargoNome.includes('presidente')) sigla = 'PRES';
      else if (cargoNome.includes('gabinete')) sigla = 'GAB';
      else if (cargoNome.includes('controle interno')) sigla = 'CI';
      else if (cargoNome.includes('jurídico')) sigla = 'ASJUR';
      else if (cargoNome.includes('especial')) sigla = 'ASESP';
      else if (cargoNome.includes('comunicação')) sigla = 'ASCOM';
      else if (cargoNome.includes('contratação') || cargoNome.includes('licitação') || cargoNome.includes('pregoeiro')) sigla = 'CPL';
      else if (cargoNome.includes('assistente técnico')) sigla = 'GAB';
      else if (cargoNome.includes('secretária da presidência')) sigla = 'PRES';
      else if (cargoNome.includes('unidade local')) sigla = 'NuUL';
      
      if (!sigla) return null;
      
      const { data } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("sigla", sigla)
        .single();
      
      return data;
    },
    enabled: !stepsNecessarios.includes('diretoria') && !!cargoSelecionado,
  });

  // Auto-definir unidadeId baseado na seleção
  useEffect(() => {
    if (unidadeAutomatica) {
      setUnidadeId(unidadeAutomatica.id);
    }
  }, [unidadeAutomatica]);

  useEffect(() => {
    if (stepsNecessarios.includes('nucleo') && nucleoId) {
      setUnidadeId(nucleoId);
    } else if (stepsNecessarios.includes('divisao') && !stepsNecessarios.includes('nucleo') && divisaoId) {
      setUnidadeId(divisaoId);
    } else if (stepsNecessarios.includes('diretoria') && !stepsNecessarios.includes('divisao') && diretoriaId) {
      setUnidadeId(diretoriaId);
    }
  }, [nucleoId, divisaoId, diretoriaId, stepsNecessarios]);

  // Filtrar cargos por busca
  const cargosFiltrados = useMemo(() => {
    if (!buscaCargo.trim()) return cargos;
    const termo = buscaCargo.toLowerCase();
    return cargos.filter(c => 
      c.nome.toLowerCase().includes(termo) || 
      (c.sigla && c.sigla.toLowerCase().includes(termo))
    );
  }, [cargos, buscaCargo]);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const resetForm = () => {
    setCurrentStep('natureza');
    setNaturezaSelecionada('');
    setBuscaCargo('');
    setCargoId('');
    setDiretoriaId('');
    setDivisaoId('');
    setNucleoId('');
    setUnidadeId('');
    setDataNomeacao('');
    setDataPosse('');
    setDataExercicio('');
    setObservacoes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cargoId || !dataNomeacao) return;

    await createProvimento.mutateAsync({
      servidor_id: servidorId,
      cargo_id: cargoId,
      unidade_id: unidadeId || undefined,
      status: 'ativo',
      data_nomeacao: dataNomeacao,
      data_posse: dataPosse || undefined,
      data_exercicio: dataExercicio || undefined,
      observacoes: observacoes || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'natureza': return !!naturezaSelecionada;
      case 'cargo': return !!cargoId;
      case 'diretoria': return !!diretoriaId;
      case 'divisao': return !!divisaoId;
      case 'nucleo': return !!nucleoId;
      default: return false;
    }
  };

  const goToNextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < stepsNecessarios.length) {
      setCurrentStep(stepsNecessarios[nextIndex]);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepsNecessarios[prevIndex]);
      // Limpar seleções ao voltar
      if (stepsNecessarios[stepIndex] === 'nucleo') setNucleoId('');
      if (stepsNecessarios[stepIndex] === 'divisao') { setDivisaoId(''); setNucleoId(''); }
      if (stepsNecessarios[stepIndex] === 'diretoria') { setDiretoriaId(''); setDivisaoId(''); setNucleoId(''); }
    }
  };

  const getStepLabel = (step: StepType) => {
    switch (step) {
      case 'natureza': return 'Natureza';
      case 'cargo': return 'Cargo';
      case 'diretoria': return 'Diretoria';
      case 'divisao': return 'Divisão';
      case 'nucleo': return 'Núcleo';
      case 'dados': return 'Dados';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Nova Nomeação / Provimento
          </DialogTitle>
          <DialogDescription>
            Registrar nomeação para {servidorNome}
          </DialogDescription>
        </DialogHeader>

        {/* Aviso se já tem provimento ativo */}
        {temProvimentoAtivo && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Este servidor já possui uma nomeação ativa.</strong>
              <br />
              Para registrar uma nova nomeação, primeiro encerre a nomeação atual através da opção "Exonerar / Encerrar".
            </AlertDescription>
          </Alert>
        )}

        {/* Aviso se tipo não permite provimento */}
        {!temProvimentoAtivo && regras && !regras.requereProvimento && tipoServidor === 'cedido_entrada' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Servidores cedidos de outros órgãos não podem receber nomeação em cargo do IDJuv.
              Utilize o registro de Cessão para informar a função exercida.
            </AlertDescription>
          </Alert>
        )}

        {temProvimentoAtivo ? (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            {/* Stepper dinâmico */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
              {stepsNecessarios.map((step, idx) => (
                <div key={step} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === step 
                      ? 'bg-primary text-primary-foreground' 
                      : idx < stepIndex 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {idx < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={`text-xs hidden sm:inline ${currentStep === step ? 'font-medium' : 'text-muted-foreground'}`}>
                    {getStepLabel(step)}
                  </span>
                  {idx < stepsNecessarios.length - 1 && (
                    <div className={`h-0.5 w-4 ${idx < stepIndex ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step: Natureza do Cargo */}
              {currentStep === 'natureza' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Selecione a Natureza do Cargo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {naturezasPermitidas.map((nat) => (
                      <div
                        key={nat}
                        onClick={() => setNaturezaSelecionada(nat as NaturezaCargo)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          naturezaSelecionada === nat 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{NATUREZA_CARGO_LABELS[nat as NaturezaCargo]}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {nat === 'efetivo' 
                            ? 'Cargo permanente do quadro de pessoal' 
                            : 'Cargo de livre nomeação e exoneração'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step: Selecionar Cargo */}
              {currentStep === 'cargo' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Selecione o Cargo Disponível</h4>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cargo por nome ou sigla..."
                      value={buscaCargo}
                      onChange={(e) => setBuscaCargo(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {loadingCargos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : cargosFiltrados.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        {cargos.length === 0 
                          ? `Nenhum cargo ${NATUREZA_CARGO_LABELS[naturezaSelecionada as NaturezaCargo]} com vagas disponíveis.`
                          : 'Nenhum cargo encontrado com a busca aplicada.'
                        }
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {cargosFiltrados.map((cargo) => (
                        <div
                          key={cargo.id}
                          onClick={() => {
                            setCargoId(cargo.id);
                            // Reset seleções dependentes
                            setDiretoriaId('');
                            setDivisaoId('');
                            setNucleoId('');
                            setUnidadeId('');
                          }}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            cargoId === cargo.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                              : 'hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="font-medium">
                                {cargo.sigla && <span className="text-primary font-bold">{cargo.sigla}</span>}
                                {cargo.sigla && ' - '}
                                {cargo.nome}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(cargo.vencimento_base)}
                                </span>
                                <Separator orientation="vertical" className="h-4" />
                                <Badge 
                                  variant={cargo.disponiveis === 1 ? "destructive" : "secondary"}
                                  className="font-normal"
                                >
                                  {cargo.disponiveis} de {cargo.quantidade_vagas} {cargo.quantidade_vagas === 1 ? 'vaga' : 'vagas'} disponível
                                </Badge>
                              </div>
                            </div>
                            {cargoId === cargo.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Selecionar Diretoria */}
              {currentStep === 'diretoria' && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Selecione a Diretoria
                  </h4>
                  
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
                  </div>

                  {loadingDiretorias ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : diretorias.length === 0 ? (
                    <Alert>
                      <AlertDescription>Nenhuma diretoria disponível.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {diretorias.map((dir) => (
                        <div
                          key={dir.id}
                          onClick={() => {
                            setDiretoriaId(dir.id);
                            setDivisaoId('');
                            setNucleoId('');
                          }}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            diretoriaId === dir.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                              : 'hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {dir.sigla && <span className="text-primary">{dir.sigla}</span>}
                              {dir.sigla && ' - '}
                              {dir.nome}
                            </span>
                            {diretoriaId === dir.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Selecionar Divisão */}
              {currentStep === 'divisao' && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Selecione a Divisão
                  </h4>
                  
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
                    <p><strong>Diretoria:</strong> {diretorias.find(d => d.id === diretoriaId)?.nome}</p>
                  </div>

                  {loadingDivisoes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : divisoes.length === 0 ? (
                    <Alert>
                      <AlertDescription>Nenhuma divisão encontrada nesta diretoria.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {divisoes.map((div) => (
                        <div
                          key={div.id}
                          onClick={() => {
                            setDivisaoId(div.id);
                            setNucleoId('');
                          }}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            divisaoId === div.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                              : 'hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {div.sigla && <span className="text-primary">{div.sigla}</span>}
                              {div.sigla && ' - '}
                              {div.nome}
                            </span>
                            {divisaoId === div.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Selecionar Núcleo */}
              {currentStep === 'nucleo' && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Selecione o Núcleo/Setor
                  </h4>
                  
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
                    <p><strong>Diretoria:</strong> {diretorias.find(d => d.id === diretoriaId)?.nome}</p>
                    <p><strong>Divisão:</strong> {divisoes.find(d => d.id === divisaoId)?.nome}</p>
                  </div>

                  {loadingNucleos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : nucleos.length === 0 ? (
                    <Alert>
                      <AlertDescription>Nenhum núcleo/setor encontrado nesta divisão.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {nucleos.map((nuc) => (
                        <div
                          key={nuc.id}
                          onClick={() => setNucleoId(nuc.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            nucleoId === nuc.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                              : 'hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {nuc.sigla && <span className="text-primary">{nuc.sigla}</span>}
                              {nuc.sigla && ' - '}
                              {nuc.nome}
                            </span>
                            {nucleoId === nuc.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Dados do Ato */}
              {currentStep === 'dados' && (
                <div className="space-y-6">
                  <h4 className="font-medium">Dados da Nomeação</h4>
                  
                  {/* Resumo */}
                  <div className="p-4 bg-muted rounded-lg space-y-1">
                    <p className="text-sm"><strong>Natureza:</strong> {NATUREZA_CARGO_LABELS[naturezaSelecionada as NaturezaCargo]}</p>
                    <p className="text-sm"><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
                    <p className="text-sm"><strong>Valor:</strong> {formatCurrency(cargoSelecionado?.vencimento_base ?? null)}</p>
                    {diretoriaId && (
                      <p className="text-sm"><strong>Diretoria:</strong> {diretorias.find(d => d.id === diretoriaId)?.nome}</p>
                    )}
                    {divisaoId && (
                      <p className="text-sm"><strong>Divisão:</strong> {divisoes.find(d => d.id === divisaoId)?.nome}</p>
                    )}
                    {nucleoId && (
                      <p className="text-sm"><strong>Núcleo:</strong> {nucleos.find(n => n.id === nucleoId)?.nome}</p>
                    )}
                    {unidadeAutomatica && !diretoriaId && (
                      <p className="text-sm"><strong>Unidade:</strong> {unidadeAutomatica.nome}</p>
                    )}
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Data da Nomeação *</Label>
                      <Input
                        type="date"
                        value={dataNomeacao}
                        onChange={(e) => setDataNomeacao(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Data da Posse</Label>
                      <Input
                        type="date"
                        value={dataPosse}
                        onChange={(e) => setDataPosse(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data do Exercício</Label>
                      <Input
                        type="date"
                        value={dataExercicio}
                        onChange={(e) => setDataExercicio(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Aviso: Portaria via Central */}
                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      A <strong>Portaria de Nomeação</strong> deve ser gerada pela{" "}
                      <strong>Central de Portarias</strong> após registrar este provimento.
                    </AlertDescription>
                  </Alert>

                  {/* Observações */}
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>
              )}

              {/* Navegação */}
              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => stepIndex > 0 ? goToPrevStep() : onOpenChange(false)}
                >
                  {stepIndex === 0 ? 'Cancelar' : 'Voltar'}
                </Button>
                
                {currentStep !== 'dados' ? (
                  <Button 
                    type="button" 
                    onClick={goToNextStep}
                    disabled={!canProceed()}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button type="submit" disabled={!dataNomeacao || createProvimento.isPending}>
                    {createProvimento.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar Nomeação
                  </Button>
                )}
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
