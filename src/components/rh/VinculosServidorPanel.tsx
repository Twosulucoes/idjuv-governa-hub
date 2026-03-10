/**
 * Painel Consolidado de Vínculos do Servidor
 * Substitui: VinculosServidorPanel + NomeacoesProvimentosSection + GestaoLotacao
 * 
 * Usa a tabela vinculos_servidor como fonte única de verdade
 * Inclui wizard de vagas (portado do ProvimentoForm)
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useVinculosServidor,
  useVinculoMutations,
  TIPO_VINCULO_LABELS,
  TIPO_DERIVADO_COLORS,
  ORIGEM_LABELS,
  type TipoVinculoServidor,
  type OrigemVinculo,
  type VinculoServidor,
} from "@/hooks/useVinculosServidor";
import {
  MOTIVOS_ENCERRAMENTO,
  TIPOS_ATO,
  NATUREZA_CARGO_LABELS,
  type NaturezaCargo,
} from "@/types/servidor";
import {
  Plus,
  Link2,
  Building2,
  Calendar,
  XCircle,
  Briefcase,
  MoreHorizontal,
  UserX,
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface VinculosServidorPanelProps {
  servidorId: string;
  servidorNome: string;
  readOnly?: boolean;
}

export function VinculosServidorPanel({
  servidorId,
  servidorNome,
  readOnly = false,
}: VinculosServidorPanelProps) {
  const { data: vinculos = [], isLoading } = useVinculosServidor(servidorId);
  const { criar, encerrar } = useVinculoMutations(servidorId);
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [showEncerrarVinculo, setShowEncerrarVinculo] = useState<VinculoServidor | null>(null);

  const vinculosAtivos = vinculos.filter((v) => v.ativo);
  const vinculosInativos = vinculos.filter((v) => !v.ativo);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-primary" />
            Vínculos Funcionais
            <Badge variant="secondary" className="ml-2">{vinculosAtivos.length} ativo(s)</Badge>
          </CardTitle>
          {!readOnly && (
            <Button size="sm" onClick={() => setShowNovoDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Vínculo
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {vinculosAtivos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum vínculo ativo registrado.
            </p>
          )}

          {vinculosAtivos.map((v) => (
            <VinculoCard
              key={v.id}
              vinculo={v}
              onEncerrar={readOnly ? undefined : () => setShowEncerrarVinculo(v)}
            />
          ))}

          {vinculosInativos.length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Histórico ({vinculosInativos.length})
              </p>
              {vinculosInativos.map((v) => (
                <VinculoCard key={v.id} vinculo={v} inativo />
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Vínculo com Wizard de Vagas */}
      <NovoVinculoWizard
        open={showNovoDialog}
        onClose={() => setShowNovoDialog(false)}
        servidorId={servidorId}
        servidorNome={servidorNome}
        onSave={(data) => criar.mutate(data, { onSuccess: () => setShowNovoDialog(false) })}
        loading={criar.isPending}
      />

      {/* Dialog Encerrar Vínculo */}
      {showEncerrarVinculo && (
        <EncerrarVinculoDialog
          vinculo={showEncerrarVinculo}
          servidorNome={servidorNome}
          open={!!showEncerrarVinculo}
          onOpenChange={(open) => { if (!open) setShowEncerrarVinculo(null); }}
        />
      )}
    </>
  );
}

// ============== VinculoCard ==============
function VinculoCard({
  vinculo,
  onEncerrar,
  inativo,
}: {
  vinculo: VinculoServidor;
  onEncerrar?: () => void;
  inativo?: boolean;
}) {
  const colorClass = TIPO_DERIVADO_COLORS[vinculo.tipo] || TIPO_DERIVADO_COLORS.nao_classificado;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${inativo ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={colorClass}>
            {TIPO_VINCULO_LABELS[vinculo.tipo]}
          </Badge>
          <Badge variant="outline">{ORIGEM_LABELS[vinculo.origem]}</Badge>
          {vinculo.orgao_nome && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {vinculo.orgao_nome}
            </span>
          )}
        </div>
        {onEncerrar && !inativo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={onEncerrar}>
                <UserX className="h-4 w-4 mr-2" />
                Exonerar / Encerrar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {vinculo.cargo && (
          <div>
            <span className="text-xs text-muted-foreground">Cargo</span>
            <p className="font-medium flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {vinculo.cargo.sigla ? `${vinculo.cargo.sigla} - ` : ''}{vinculo.cargo.nome}
            </p>
          </div>
        )}
        {vinculo.unidade && (
          <div>
            <span className="text-xs text-muted-foreground">Lotação</span>
            <p className="font-medium">{vinculo.unidade.sigla || vinculo.unidade.nome}</p>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground">Início</span>
          <p className="font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {vinculo.data_inicio ? format(new Date(vinculo.data_inicio + "T00:00:00"), "dd/MM/yyyy") : "-"}
          </p>
        </div>
        {vinculo.data_fim && (
          <div>
            <span className="text-xs text-muted-foreground">Fim</span>
            <p className="font-medium">{format(new Date(vinculo.data_fim + "T00:00:00"), "dd/MM/yyyy")}</p>
          </div>
        )}
      </div>

      {vinculo.onus && (
        <p className="text-xs text-muted-foreground">
          Ônus: {vinculo.onus === "origem" ? "Órgão de Origem" : vinculo.onus === "destino" ? "Órgão de Destino" : "Compartilhado"}
        </p>
      )}
      {vinculo.motivo_encerramento && inativo && (
        <p className="text-xs text-muted-foreground">
          Motivo: {MOTIVOS_ENCERRAMENTO.find(m => m.value === vinculo.motivo_encerramento)?.label || vinculo.motivo_encerramento}
        </p>
      )}
    </div>
  );
}

// ============== EncerrarVinculoDialog ==============
function EncerrarVinculoDialog({
  vinculo,
  servidorNome,
  open,
  onOpenChange,
}: {
  vinculo: VinculoServidor;
  servidorNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { encerrar } = useVinculoMutations(vinculo.servidor_id);
  const [motivo, setMotivo] = useState('exoneracao');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [atoTipo, setAtoTipo] = useState('');
  const [atoNumero, setAtoNumero] = useState('');
  const [atoData, setAtoData] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataEncerramento || !motivo) return;

    encerrar.mutate(
      { id: vinculo.id, dataFim: dataEncerramento, motivo },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            Encerrar Vínculo
          </DialogTitle>
          <DialogDescription>
            Encerrar vínculo de {servidorNome}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ação irá encerrar o vínculo <strong>{TIPO_VINCULO_LABELS[vinculo.tipo]}</strong>
            {vinculo.cargo && <> no cargo <strong>{vinculo.cargo.nome}</strong></>}.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Motivo do Encerramento *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOTIVOS_ENCERRAMENTO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data do Encerramento *</Label>
            <Input type="date" value={dataEncerramento} onChange={(e) => setDataEncerramento(e.target.value)} required />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Ato de Encerramento (opcional)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo do Ato</Label>
                <Select value={atoTipo} onValueChange={setAtoTipo}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_ATO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número</Label>
                <Input value={atoNumero} onChange={(e) => setAtoNumero(e.target.value)} placeholder="Ex: 001/2024" />
              </div>
              <div>
                <Label>Data do Ato</Label>
                <Input type="date" value={atoData} onChange={(e) => setAtoData(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={!dataEncerramento || !motivo || encerrar.isPending}>
              {encerrar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Encerramento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== NovoVinculoWizard ==============
// Wizard com validação de vagas (portado do ProvimentoForm)

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

type StepType = 'tipo' | 'natureza' | 'cargo' | 'diretoria' | 'divisao' | 'nucleo' | 'dados';

function NovoVinculoWizard({
  open,
  onClose,
  servidorId,
  servidorNome,
  onSave,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  servidorId: string;
  servidorNome: string;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  // Step 1: Tipo + Origem
  const [tipo, setTipo] = useState<TipoVinculoServidor>("comissionado");
  const [origem, setOrigem] = useState<OrigemVinculo>("idjuv");
  const [orgaoNome, setOrgaoNome] = useState("");
  const [onus, setOnus] = useState("");

  // Step 2: Natureza do cargo
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<NaturezaCargo | ''>('');

  // Step 3: Cargo
  const [buscaCargo, setBuscaCargo] = useState('');
  const [cargoId, setCargoId] = useState('');

  // Steps 4-6: Cascata organizacional
  const [diretoriaId, setDiretoriaId] = useState('');
  const [divisaoId, setDivisaoId] = useState('');
  const [nucleoId, setNucleoId] = useState('');
  const [unidadeId, setUnidadeId] = useState('');

  // Step final: Dados
  const [dataInicio, setDataInicio] = useState('');
  const [dataPosse, setDataPosse] = useState('');
  const [dataExercicio, setDataExercicio] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [currentStep, setCurrentStep] = useState<StepType>('tipo');

  const needsOrgao = origem !== "idjuv";
  const needsOnus = tipo === "cedido_entrada" || tipo === "requisitado" || tipo === "federal";
  const needsCargo = tipo === "comissionado" || tipo === "efetivo";

  // Determinar natureza automática baseada no tipo
  const naturezaAutomatica: NaturezaCargo | null = 
    tipo === 'efetivo' ? 'efetivo' : 
    tipo === 'comissionado' ? 'comissionado' : 
    null;

  // Buscar cargos com disponibilidade (usando vinculos_servidor)
  const naturezaParaBusca = naturezaAutomatica || naturezaSelecionada;
  const { data: cargos = [], isLoading: loadingCargos } = useQuery({
    queryKey: ["cargos-disponibilidade-vinculo", naturezaParaBusca],
    queryFn: async () => {
      if (!naturezaParaBusca) return [];
      
      const { data: cargosData, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla, natureza, quantidade_vagas, vencimento_base")
        .eq("ativo", true)
        .eq("natureza", naturezaParaBusca)
        .order("nome");
      if (error) throw error;
      if (!cargosData) return [];

      // Contar ocupações via vinculos_servidor (fonte única)
      const { data: vinculosAtivos } = await supabase
        .from("vinculos_servidor")
        .select("cargo_id")
        .eq("ativo", true);

      const ocupadasPorCargo: Record<string, number> = {};
      vinculosAtivos?.forEach(v => {
        if (v.cargo_id) {
          ocupadasPorCargo[v.cargo_id] = (ocupadasPorCargo[v.cargo_id] || 0) + 1;
        }
      });

      return cargosData
        .map(cargo => ({
          ...cargo,
          ocupadas: ocupadasPorCargo[cargo.id] || 0,
          disponiveis: (cargo.quantidade_vagas || 1) - (ocupadasPorCargo[cargo.id] || 0),
        }))
        .filter(cargo => cargo.disponiveis > 0) as CargoComDisponibilidade[];
    },
    enabled: !!naturezaParaBusca && open,
  });

  // Cargo selecionado
  const cargoSelecionado = cargos.find(c => c.id === cargoId);

  // Unidades ocupadas pelo cargo via vinculos_servidor
  const { data: unidadesOcupadas = [] } = useQuery({
    queryKey: ["unidades-ocupadas-vinculo", cargoId],
    queryFn: async () => {
      if (!cargoId) return [];
      const { data } = await supabase
        .from("vinculos_servidor")
        .select("unidade_id")
        .eq("cargo_id", cargoId)
        .eq("ativo", true);
      return (data || []).map(v => v.unidade_id).filter(Boolean) as string[];
    },
    enabled: !!cargoId && open,
  });

  // Determinar steps necessários
  const stepsNecessarios = (() => {
    const steps: StepType[] = ['tipo'];
    
    if (!needsCargo) {
      // Tipos sem cargo (cedido, requisitado, etc): tipo → dados
      steps.push('dados');
      return steps;
    }

    // Se tipo permite múltiplas naturezas, adicionar step de natureza
    if (!naturezaAutomatica) {
      steps.push('natureza');
    }
    
    steps.push('cargo');

    if (cargoSelecionado) {
      const nome = cargoSelecionado.nome.toLowerCase();
      if (nome.includes('núcleo')) {
        steps.push('diretoria', 'divisao', 'nucleo');
      } else if (nome.includes('divisão')) {
        steps.push('diretoria', 'divisao');
      } else if (nome.includes('diretoria') || nome.includes('diretor')) {
        steps.push('diretoria');
      }
    }

    steps.push('dados');
    return steps;
  })();

  const stepIndex = stepsNecessarios.indexOf(currentStep);

  // Diretorias
  const { data: diretorias = [], isLoading: loadingDiretorias } = useQuery({
    queryKey: ["diretorias-vinculo", cargoId, unidadesOcupadas],
    queryFn: async () => {
      const { data } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("tipo", "diretoria")
        .eq("ativo", true)
        .order("nome");
      
      const cargoNome = cargoSelecionado?.nome.toLowerCase() || '';
      if (cargoNome.includes('diretor') || cargoNome.includes('secretária de diretoria')) {
        return (data || []).filter(d => !unidadesOcupadas.includes(d.id));
      }
      return data || [];
    },
    enabled: stepsNecessarios.includes('diretoria') && !!cargoId && open,
  });

  // Divisões
  const { data: divisoes = [], isLoading: loadingDivisoes } = useQuery({
    queryKey: ["divisoes-vinculo", diretoriaId, cargoId, unidadesOcupadas],
    queryFn: async () => {
      if (!diretoriaId) return [];
      const { data } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("superior_id", diretoriaId)
        .eq("tipo", "divisao")
        .eq("ativo", true)
        .order("nome");

      const cargoNome = cargoSelecionado?.nome.toLowerCase() || '';
      if (cargoNome.includes('divisão')) {
        return (data || []).filter(d => !unidadesOcupadas.includes(d.id));
      }
      return data || [];
    },
    enabled: stepsNecessarios.includes('divisao') && !!diretoriaId && open,
  });

  // Núcleos
  const { data: nucleos = [], isLoading: loadingNucleos } = useQuery({
    queryKey: ["nucleos-vinculo", divisaoId, cargoId, unidadesOcupadas],
    queryFn: async () => {
      if (!divisaoId) return [];
      const { data } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("superior_id", divisaoId)
        .eq("tipo", "nucleo")
        .eq("ativo", true)
        .order("nome");
      return (data || []).filter(n => !unidadesOcupadas.includes(n.id));
    },
    enabled: stepsNecessarios.includes('nucleo') && !!divisaoId && open,
  });

  // Unidade automática para cargos fixos
  const { data: unidadeAutomatica } = useQuery({
    queryKey: ["unidade-auto-vinculo", cargoId],
    queryFn: async () => {
      if (!cargoSelecionado) return null;
      const nome = cargoSelecionado.nome.toLowerCase();
      let sigla = '';
      if (nome.includes('presidente')) sigla = 'PRES';
      else if (nome.includes('gabinete')) sigla = 'GAB';
      else if (nome.includes('controle interno')) sigla = 'CI';
      else if (nome.includes('jurídico')) sigla = 'ASJUR';
      else if (nome.includes('especial')) sigla = 'ASESP';
      else if (nome.includes('comunicação')) sigla = 'ASCOM';
      else if (nome.includes('contratação') || nome.includes('licitação') || nome.includes('pregoeiro')) sigla = 'CPL';
      else if (nome.includes('assistente técnico')) sigla = 'GAB';
      else if (nome.includes('secretária da presidência')) sigla = 'PRES';
      else if (nome.includes('unidade local')) sigla = 'NuUL';
      if (!sigla) return null;
      const { data } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("sigla", sigla)
        .single();
      return data;
    },
    enabled: !stepsNecessarios.includes('diretoria') && !!cargoSelecionado && open,
  });

  // Unidades genéricas (para tipos sem cargo)
  const { data: todasUnidades = [] } = useQuery({
    queryKey: ["unidades-vinculo-todas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
    enabled: !needsCargo && open,
  });

  // Derivar unidadeId final
  const getUnidadeIdFinal = () => {
    if (stepsNecessarios.includes('nucleo') && nucleoId) return nucleoId;
    if (stepsNecessarios.includes('divisao') && !stepsNecessarios.includes('nucleo') && divisaoId) return divisaoId;
    if (stepsNecessarios.includes('diretoria') && !stepsNecessarios.includes('divisao') && diretoriaId) return diretoriaId;
    if (unidadeAutomatica) return unidadeAutomatica.id;
    if (unidadeId) return unidadeId;
    return '';
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const cargosFiltrados = (() => {
    if (!buscaCargo.trim()) return cargos;
    const termo = buscaCargo.toLowerCase();
    return cargos.filter(c => c.nome.toLowerCase().includes(termo) || (c.sigla && c.sigla.toLowerCase().includes(termo)));
  })();

  const resetForm = () => {
    setCurrentStep('tipo');
    setTipo('comissionado');
    setOrigem('idjuv');
    setOrgaoNome('');
    setOnus('');
    setNaturezaSelecionada('');
    setBuscaCargo('');
    setCargoId('');
    setDiretoriaId('');
    setDivisaoId('');
    setNucleoId('');
    setUnidadeId('');
    setDataInicio('');
    setDataPosse('');
    setDataExercicio('');
    setObservacoes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const finalUnidadeId = getUnidadeIdFinal();
    onSave({
      servidor_id: servidorId,
      tipo,
      origem,
      orgao_nome: needsOrgao ? orgaoNome : null,
      cargo_id: needsCargo && cargoId ? cargoId : null,
      unidade_id: finalUnidadeId || null,
      data_inicio: dataInicio,
      data_posse: dataPosse || null,
      data_exercicio: dataExercicio || null,
      onus: needsOnus && onus ? onus : null,
      observacoes: observacoes || null,
      ativo: true,
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'tipo': return !!tipo && !!origem && (!needsOrgao || !!orgaoNome) && (!needsOnus || !!onus);
      case 'natureza': return !!naturezaSelecionada;
      case 'cargo': return !!cargoId;
      case 'diretoria': return !!diretoriaId;
      case 'divisao': return !!divisaoId;
      case 'nucleo': return !!nucleoId;
      case 'dados': return !!dataInicio;
      default: return false;
    }
  };

  const goNext = () => {
    const next = stepIndex + 1;
    if (next < stepsNecessarios.length) setCurrentStep(stepsNecessarios[next]);
  };

  const goPrev = () => {
    const prev = stepIndex - 1;
    if (prev >= 0) {
      const leaving = currentStep;
      if (leaving === 'nucleo') setNucleoId('');
      if (leaving === 'divisao') { setDivisaoId(''); setNucleoId(''); }
      if (leaving === 'diretoria') { setDiretoriaId(''); setDivisaoId(''); setNucleoId(''); }
      if (leaving === 'cargo') { setCargoId(''); setBuscaCargo(''); }
      setCurrentStep(stepsNecessarios[prev]);
    }
  };

  const stepLabels: Record<StepType, string> = {
    tipo: 'Tipo',
    natureza: 'Natureza',
    cargo: 'Cargo',
    diretoria: 'Diretoria',
    divisao: 'Divisão',
    nucleo: 'Núcleo',
    dados: 'Dados',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Novo Vínculo Funcional
          </DialogTitle>
          <DialogDescription>
            Registrar vínculo para {servidorNome}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {stepsNecessarios.map((step, idx) => (
            <div key={step} className="flex items-center gap-1 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : idx < stepIndex
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {idx < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${currentStep === step ? 'font-medium' : 'text-muted-foreground'}`}>
                {stepLabels[step]}
              </span>
              {idx < stepsNecessarios.length - 1 && (
                <div className={`h-0.5 w-4 ${idx < stepIndex ? 'bg-success' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ===== Step: Tipo ===== */}
        {currentStep === 'tipo' && (
          <div className="space-y-4">
            <h4 className="font-medium">Tipo e Origem do Vínculo</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Vínculo *</Label>
                <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoVinculoServidor); setCargoId(''); setNaturezaSelecionada(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_VINCULO_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origem *</Label>
                <Select value={origem} onValueChange={(v) => setOrigem(v as OrigemVinculo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORIGEM_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {needsOrgao && (
              <div>
                <Label>Nome do Órgão *</Label>
                <Input value={orgaoNome} onChange={(e) => setOrgaoNome(e.target.value)} placeholder="Ex: SEED, SESAU..." />
              </div>
            )}

            {needsOnus && (
              <div>
                <Label>Ônus *</Label>
                <Select value={onus} onValueChange={setOnus}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="origem">Órgão de Origem</SelectItem>
                    <SelectItem value="destino">Órgão de Destino</SelectItem>
                    <SelectItem value="compartilhado">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* ===== Step: Natureza ===== */}
        {currentStep === 'natureza' && (
          <div className="space-y-4">
            <h4 className="font-medium">Selecione a Natureza do Cargo</h4>
            <div className="grid grid-cols-2 gap-4">
              {(['efetivo', 'comissionado'] as NaturezaCargo[]).map((nat) => (
                <div
                  key={nat}
                  onClick={() => setNaturezaSelecionada(nat)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    naturezaSelecionada === nat
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">{NATUREZA_CARGO_LABELS[nat]}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nat === 'efetivo' ? 'Cargo permanente do quadro de pessoal' : 'Cargo de livre nomeação e exoneração'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Step: Cargo ===== */}
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
                    ? 'Nenhum cargo com vagas disponíveis para esta natureza.'
                    : 'Nenhum cargo encontrado com a busca aplicada.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {cargosFiltrados.map((cargo) => (
                  <div
                    key={cargo.id}
                    onClick={() => { setCargoId(cargo.id); setDiretoriaId(''); setDivisaoId(''); setNucleoId(''); setUnidadeId(''); }}
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
                          <Badge variant={cargo.disponiveis === 1 ? "destructive" : "secondary"} className="font-normal">
                            {cargo.disponiveis} de {cargo.quantidade_vagas} {cargo.quantidade_vagas === 1 ? 'vaga' : 'vagas'} disponível
                          </Badge>
                        </div>
                      </div>
                      {cargoId === cargo.id && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Step: Diretoria ===== */}
        {currentStep === 'diretoria' && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Selecione a Diretoria
            </h4>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
            </div>
            {loadingDiretorias ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : diretorias.length === 0 ? (
              <Alert><AlertDescription>Nenhuma diretoria disponível para este cargo.</AlertDescription></Alert>
            ) : (
              <div className="space-y-2">
                {diretorias.map((dir) => (
                  <div key={dir.id} onClick={() => { setDiretoriaId(dir.id); setDivisaoId(''); setNucleoId(''); }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      diretoriaId === dir.id ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'hover:border-primary/50 hover:bg-muted/50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dir.sigla && <span className="text-primary">{dir.sigla}</span>}{dir.sigla && ' - '}{dir.nome}</span>
                      {diretoriaId === dir.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Step: Divisão ===== */}
        {currentStep === 'divisao' && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2"><GitBranch className="h-5 w-5" /> Selecione a Divisão</h4>
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
              <p><strong>Diretoria:</strong> {diretorias.find(d => d.id === diretoriaId)?.nome}</p>
            </div>
            {loadingDivisoes ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : divisoes.length === 0 ? (
              <Alert><AlertDescription>Nenhuma divisão disponível nesta diretoria.</AlertDescription></Alert>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {divisoes.map((div) => (
                  <div key={div.id} onClick={() => { setDivisaoId(div.id); setNucleoId(''); }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      divisaoId === div.id ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'hover:border-primary/50 hover:bg-muted/50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{div.sigla && <span className="text-primary">{div.sigla}</span>}{div.sigla && ' - '}{div.nome}</span>
                      {divisaoId === div.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Step: Núcleo ===== */}
        {currentStep === 'nucleo' && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2"><GitBranch className="h-5 w-5" /> Selecione o Núcleo</h4>
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Cargo:</strong> {cargoSelecionado?.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado?.nome}</p>
              <p><strong>Diretoria:</strong> {diretorias.find(d => d.id === diretoriaId)?.nome}</p>
              <p><strong>Divisão:</strong> {divisoes.find(d => d.id === divisaoId)?.nome}</p>
            </div>
            {loadingNucleos ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : nucleos.length === 0 ? (
              <Alert><AlertDescription>Nenhum núcleo disponível nesta divisão.</AlertDescription></Alert>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nucleos.map((nuc) => (
                  <div key={nuc.id} onClick={() => setNucleoId(nuc.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      nucleoId === nuc.id ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'hover:border-primary/50 hover:bg-muted/50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{nuc.sigla && <span className="text-primary">{nuc.sigla}</span>}{nuc.sigla && ' - '}{nuc.nome}</span>
                      {nucleoId === nuc.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Step: Dados ===== */}
        {currentStep === 'dados' && (
          <div className="space-y-4">
            <h4 className="font-medium">Dados do Vínculo</h4>

            {/* Resumo */}
            <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
              <p><strong>Tipo:</strong> {TIPO_VINCULO_LABELS[tipo]} ({ORIGEM_LABELS[origem]})</p>
              {orgaoNome && <p><strong>Órgão:</strong> {orgaoNome}</p>}
              {cargoSelecionado && (
                <>
                  <p><strong>Cargo:</strong> {cargoSelecionado.sigla && `${cargoSelecionado.sigla} - `}{cargoSelecionado.nome}</p>
                  <p><strong>Valor:</strong> {formatCurrency(cargoSelecionado.vencimento_base)}</p>
                </>
              )}
              {diretoriaId && <p><strong>Diretoria:</strong> {diretorias.find(d => d.id === diretoriaId)?.nome}</p>}
              {divisaoId && <p><strong>Divisão:</strong> {divisoes.find(d => d.id === divisaoId)?.nome}</p>}
              {nucleoId && <p><strong>Núcleo:</strong> {nucleos.find(n => n.id === nucleoId)?.nome}</p>}
              {unidadeAutomatica && !diretoriaId && <p><strong>Unidade:</strong> {unidadeAutomatica.nome}</p>}
            </div>

            {/* Para tipos sem cargo, selecionar unidade manualmente */}
            {!needsCargo && (
              <div>
                <Label>Unidade de Lotação</Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar unidade" /></SelectTrigger>
                  <SelectContent>
                    {todasUnidades.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Início / Nomeação *</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
              </div>
              {needsCargo && (
                <>
                  <div>
                    <Label>Data da Posse</Label>
                    <Input type="date" value={dataPosse} onChange={(e) => setDataPosse(e.target.value)} />
                  </div>
                  <div>
                    <Label>Data do Exercício</Label>
                    <Input type="date" value={dataExercicio} onChange={(e) => setDataExercicio(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {needsCargo && (
              <Alert className="bg-success/5 border-success/20">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription>
                  A <strong>Minuta de Portaria de Nomeação</strong> será gerada automaticamente
                  ao registrar este vínculo.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações adicionais..." maxLength={1000} rows={2} />
            </div>
          </div>
        )}

        {/* Navegação */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => stepIndex > 0 ? goPrev() : handleClose()}>
            {stepIndex === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          {currentStep !== 'dados' ? (
            <Button type="button" onClick={goNext} disabled={!canProceed()}>
              Próximo
            </Button>
          ) : (
            <Button disabled={!dataInicio || loading} onClick={handleSave}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Vínculo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
