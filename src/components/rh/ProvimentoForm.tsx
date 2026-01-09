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
import { Loader2, Award, AlertTriangle, CheckCircle2, Search, Filter } from "lucide-react";
import { useCreateProvimento } from "@/hooks/useServidorCompleto";
import {
  type NaturezaCargo,
  type TipoServidor,
  REGRAS_TIPO_SERVIDOR,
  NATUREZA_CARGO_LABELS,
  TIPOS_ATO,
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
  const [step, setStep] = useState(1);
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<NaturezaCargo | ''>('');
  const [filtroTipoUnidade, setFiltroTipoUnidade] = useState<TipoUnidade | 'todos'>('todos');
  const [buscaCargo, setBuscaCargo] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  
  // Datas
  const [dataNomeacao, setDataNomeacao] = useState('');
  const [dataPosse, setDataPosse] = useState('');
  const [dataExercicio, setDataExercicio] = useState('');
  
  // Ato
  const [atoTipo, setAtoTipo] = useState('');
  const [atoNumero, setAtoNumero] = useState('');
  const [atoData, setAtoData] = useState('');
  const [atoDoeNumero, setAtoDoeNumero] = useState('');
  const [atoDoeData, setAtoDoeData] = useState('');
  
  const [observacoes, setObservacoes] = useState('');

  // Regras baseadas no tipo de servidor
  const regras = tipoServidor ? REGRAS_TIPO_SERVIDOR[tipoServidor] : null;
  const naturezasPermitidas = regras?.tiposCargo || ['efetivo', 'comissionado'];

  // Tipos de unidade para filtro (baseado no banco de dados)
  const tiposUnidade: ('todos' | TipoUnidade)[] = [
    'todos',
    'presidencia',
    'diretoria',
    'departamento',
    'divisao',
    'setor',
    'coordenacao',
    'secao',
  ];

  // Buscar cargos com disponibilidade
  const { data: cargos = [], isLoading: loadingCargos } = useQuery({
    queryKey: ["cargos-disponibilidade", naturezaSelecionada, filtroTipoUnidade],
    queryFn: async () => {
      if (!naturezaSelecionada) return [];
      
      // Buscar cargos
      let queryBase = supabase
        .from("cargos")
        .select("id, nome, sigla, natureza, quantidade_vagas, vencimento_base")
        .eq("ativo", true)
        .eq("natureza", naturezaSelecionada);
      
      const { data: cargosData, error: cargosError } = await queryBase.order("nome");
      if (cargosError) throw cargosError;
      if (!cargosData) return [];

      // Buscar provimentos ativos para contar ocupadas
      const { data: provimentosAtivos, error: provError } = await supabase
        .from("provimentos")
        .select("cargo_id")
        .eq("status", "ativo");
      if (provError) throw provError;

      // Se filtrar por tipo de unidade, buscar compatibilidades
      let cargosCompativeis: string[] | null = null;
      if (filtroTipoUnidade !== 'todos') {
        const { data: compatData } = await supabase
          .from("cargo_unidade_compatibilidade")
          .select("cargo_id")
          .eq("tipo_unidade", filtroTipoUnidade);
        
        if (compatData && compatData.length > 0) {
          cargosCompativeis = compatData.map(c => c.cargo_id).filter(Boolean) as string[];
        }
      }

      // Contar ocupadas por cargo
      const ocupadasPorCargo: Record<string, number> = {};
      provimentosAtivos?.forEach(p => {
        if (p.cargo_id) {
          ocupadasPorCargo[p.cargo_id] = (ocupadasPorCargo[p.cargo_id] || 0) + 1;
        }
      });

      // Montar lista com disponibilidade
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
        .filter(cargo => {
          // Filtrar apenas cargos com vagas disponíveis
          if (cargo.disponiveis <= 0) return false;
          
          // Filtrar por tipo de unidade se especificado
          if (cargosCompativeis !== null && !cargosCompativeis.includes(cargo.id)) {
            return false;
          }
          
          return true;
        });

      return result;
    },
    enabled: !!naturezaSelecionada,
  });

  // Filtrar cargos por busca
  const cargosFiltrados = useMemo(() => {
    if (!buscaCargo.trim()) return cargos;
    const termo = buscaCargo.toLowerCase();
    return cargos.filter(c => 
      c.nome.toLowerCase().includes(termo) || 
      (c.sigla && c.sigla.toLowerCase().includes(termo))
    );
  }, [cargos, buscaCargo]);

  // Buscar unidades compatíveis com o cargo
  const { data: unidadesCompativeis = [], isLoading: loadingUnidades } = useQuery({
    queryKey: ["unidades-compativeis", cargoId],
    queryFn: async () => {
      if (!cargoId) return [];
      
      // Primeiro busca regras de compatibilidade
      const { data: regrasCompat } = await supabase
        .from("cargo_unidade_compatibilidade")
        .select("tipo_unidade, unidade_especifica_id")
        .eq("cargo_id", cargoId);
      
      // Se há regras específicas, filtra unidades
      if (regrasCompat && regrasCompat.length > 0) {
        const tiposPermitidos = regrasCompat
          .filter(r => r.tipo_unidade)
          .map(r => r.tipo_unidade);
        const unidadesEspecificas = regrasCompat
          .filter(r => r.unidade_especifica_id)
          .map(r => r.unidade_especifica_id);
        
        let query = supabase
          .from("estrutura_organizacional")
          .select("id, nome, sigla, tipo")
          .eq("ativo", true);
        
        if (unidadesEspecificas.length > 0) {
          query = query.in("id", unidadesEspecificas);
        } else if (tiposPermitidos.length > 0) {
          query = query.in("tipo", tiposPermitidos);
        }
        
        const { data, error } = await query.order("nome");
        if (error) throw error;
        return data;
      }
      
      // Se não há regras, retorna todas
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!cargoId,
  });

  // Auto-selecionar unidade se só há uma opção
  useEffect(() => {
    if (unidadesCompativeis.length === 1 && !unidadeId) {
      setUnidadeId(unidadesCompativeis[0].id);
    }
  }, [unidadesCompativeis, unidadeId]);

  const cargoSelecionado = useMemo(() => 
    cargos.find(c => c.id === cargoId), 
    [cargos, cargoId]
  );

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const resetForm = () => {
    setStep(1);
    setNaturezaSelecionada('');
    setFiltroTipoUnidade('todos');
    setBuscaCargo('');
    setCargoId('');
    setUnidadeId('');
    setDataNomeacao('');
    setDataPosse('');
    setDataExercicio('');
    setAtoTipo('');
    setAtoNumero('');
    setAtoData('');
    setAtoDoeNumero('');
    setAtoDoeData('');
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
      ato_nomeacao_tipo: atoTipo || undefined,
      ato_nomeacao_numero: atoNumero || undefined,
      ato_nomeacao_data: atoData || undefined,
      ato_nomeacao_doe_numero: atoDoeNumero || undefined,
      ato_nomeacao_doe_data: atoDoeData || undefined,
      observacoes: observacoes || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === 1) return !!naturezaSelecionada;
    if (step === 2) return !!cargoId;
    if (step === 3) return true; // Unidade é opcional
    return false;
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

        {/* Conteúdo bloqueado se já tem provimento ativo */}
        {temProvimentoAtivo ? (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s 
                      ? 'bg-primary text-primary-foreground' 
                      : step > s 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </div>
                  {s < 4 && <div className={`h-0.5 w-8 ${step > s ? 'bg-success' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Natureza do Cargo */}
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="font-medium">1. Selecione a Natureza do Cargo</h4>
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

              {/* Step 2: Selecionar Cargo */}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="font-medium">2. Selecione o Cargo</h4>
                  
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar cargo por nome ou sigla..."
                          value={buscaCargo}
                          onChange={(e) => setBuscaCargo(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-48">
                      <Select 
                        value={filtroTipoUnidade} 
                        onValueChange={(v) => setFiltroTipoUnidade(v as TipoUnidade | 'todos')}
                      >
                        <SelectTrigger>
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filtrar por unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposUnidade.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo === 'todos' ? 'Todas as Unidades' : LABELS_UNIDADE[tipo] || tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          : 'Nenhum cargo encontrado com os filtros aplicados.'
                        }
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {cargosFiltrados.map((cargo) => (
                        <div
                          key={cargo.id}
                          onClick={() => setCargoId(cargo.id)}
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
                                <span className="font-semibold text-success">
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

              {/* Step 3: Selecionar Unidade */}
              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="font-medium">3. Selecione a Unidade</h4>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
                    <p><strong>Valor:</strong> {formatCurrency(cargoSelecionado?.vencimento_base ?? null)}</p>
                  </div>
                  
                  {loadingUnidades ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : unidadesCompativeis.length === 1 ? (
                    <Alert className="border-success bg-success/10">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertDescription>
                        Unidade selecionada automaticamente: <strong>{unidadesCompativeis[0].nome}</strong>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select value={unidadeId} onValueChange={setUnidadeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesCompativeis.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.sigla && `${u.sigla} - `}{u.nome}
                            <span className="text-muted-foreground ml-2">
                              ({LABELS_UNIDADE[u.tipo as TipoUnidade] || u.tipo})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Step 4: Dados do Ato */}
              {step === 4 && (
                <div className="space-y-6">
                  <h4 className="font-medium">4. Dados da Nomeação</h4>
                  
                  {/* Resumo */}
                  <div className="p-4 bg-muted rounded-lg space-y-1">
                    <p className="text-sm"><strong>Natureza:</strong> {NATUREZA_CARGO_LABELS[naturezaSelecionada as NaturezaCargo]}</p>
                    <p className="text-sm"><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
                    <p className="text-sm"><strong>Valor:</strong> {formatCurrency(cargoSelecionado?.vencimento_base ?? null)}</p>
                    {unidadeId && (
                      <p className="text-sm">
                        <strong>Unidade:</strong> {unidadesCompativeis.find(u => u.id === unidadeId)?.nome}
                      </p>
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

                  {/* Ato */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-muted-foreground">Ato de Nomeação</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Tipo do Ato</Label>
                        <Select value={atoTipo} onValueChange={setAtoTipo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_ATO.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input
                          value={atoNumero}
                          onChange={(e) => setAtoNumero(e.target.value)}
                          placeholder="Ex: 001/2024"
                        />
                      </div>
                      <div>
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={atoData}
                          onChange={(e) => setAtoData(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Nº DOE</Label>
                        <Input
                          value={atoDoeNumero}
                          onChange={(e) => setAtoDoeNumero(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Data DOE</Label>
                        <Input
                          type="date"
                          value={atoDoeData}
                          onChange={(e) => setAtoDoeData(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

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
                  onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
                >
                  {step === 1 ? 'Cancelar' : 'Voltar'}
                </Button>
                
                {step < 4 ? (
                  <Button 
                    type="button" 
                    onClick={() => setStep(step + 1)}
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
