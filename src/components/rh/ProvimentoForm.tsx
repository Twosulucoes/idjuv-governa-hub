import { useState, useMemo } from "react";
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
import { Loader2, Award, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCreateProvimento } from "@/hooks/useServidorCompleto";
import {
  type NaturezaCargo,
  type TipoServidor,
  REGRAS_TIPO_SERVIDOR,
  NATUREZA_CARGO_LABELS,
  TIPOS_ATO,
} from "@/types/servidor";

interface Props {
  servidorId: string;
  servidorNome: string;
  tipoServidor?: TipoServidor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProvimentoForm({ servidorId, servidorNome, tipoServidor, open, onOpenChange }: Props) {
  const createProvimento = useCreateProvimento();
  
  // Estado do wizard
  const [step, setStep] = useState(1);
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<NaturezaCargo | ''>('');
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

  // Buscar cargos por natureza
  const { data: cargos = [], isLoading: loadingCargos } = useQuery({
    queryKey: ["cargos-natureza", naturezaSelecionada],
    queryFn: async () => {
      if (!naturezaSelecionada) return [];
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla, natureza, quantidade_vagas")
        .eq("ativo", true)
        .eq("natureza", naturezaSelecionada)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!naturezaSelecionada,
  });

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

  const cargoSelecionado = useMemo(() => 
    cargos.find(c => c.id === cargoId), 
    [cargos, cargoId]
  );

  const resetForm = () => {
    setStep(1);
    setNaturezaSelecionada('');
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

        {/* Aviso se tipo não permite provimento */}
        {regras && !regras.requereProvimento && tipoServidor === 'cedido_entrada' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Servidores cedidos de outros órgãos não podem receber nomeação em cargo do IDJuv.
              Utilize o registro de Cessão para informar a função exercida.
            </AlertDescription>
          </Alert>
        )}

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
              {loadingCargos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : cargos.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum cargo {NATUREZA_CARGO_LABELS[naturezaSelecionada as NaturezaCargo]} encontrado.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {cargos.map((cargo) => (
                    <div
                      key={cargo.id}
                      onClick={() => setCargoId(cargo.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                        cargoId === cargo.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {cargo.sigla && <span className="text-primary">{cargo.sigla} - </span>}
                          {cargo.nome}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {cargo.quantidade_vagas || 1} vaga(s)
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Selecionar Unidade */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-medium">3. Selecione a Unidade (Opcional)</h4>
              <p className="text-sm text-muted-foreground">
                Cargo selecionado: <strong>{cargoSelecionado?.nome}</strong>
              </p>
              {loadingUnidades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesCompativeis.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.sigla && `${u.sigla} - `}{u.nome}
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
                <p className="text-sm"><strong>Cargo:</strong> {cargoSelecionado?.nome}</p>
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
      </DialogContent>
    </Dialog>
  );
}
