import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, FileText, AlertCircle } from "lucide-react";
import { 
  useLotarServidor, 
  usePortariasParaAto,
  type ServidorGestao 
} from "@/hooks/useGestaoLotacao";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  servidor: ServidorGestao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Tipos de ato disponíveis (vinculados à Central de Portarias)
const TIPOS_ATO = [
  { value: "portaria", label: "Portaria" },
  { value: "decreto", label: "Decreto" },
  { value: "ordem_servico", label: "Ordem de Serviço" },
] as const;

interface ComposicaoCargo {
  id: string;
  unidade_id: string;
  quantidade_vagas: number | null;
  unidade: {
    id: string;
    nome: string;
    sigla: string | null;
  } | null;
}

export function LotarServidorModal({ servidor, open, onOpenChange }: Props) {
  const lotarServidor = useLotarServidor();
  const { data: portarias = [], isLoading: loadingPortarias } = usePortariasParaAto();

  const [cargoId, setCargoId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [dataInicio, setDataInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [atoTipo, setAtoTipo] = useState("");
  const [portariaId, setPortariaId] = useState("");
  const [atoNumeroManual, setAtoNumeroManual] = useState("");
  const [observacao, setObservacao] = useState("");

  // Buscar cargos com vagas disponíveis
  const { data: cargos = [], isLoading: loadingCargos } = useQuery({
    queryKey: ["cargos-vagas-lotacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla, quantidade_vagas")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;

      // Buscar lotações ativas por cargo
      const { data: lotacoes } = await supabase
        .from("lotacoes")
        .select("cargo_id")
        .eq("ativo", true);

      const contagemPorCargo: Record<string, number> = {};
      (lotacoes || []).forEach((l) => {
        if (l.cargo_id) {
          contagemPorCargo[l.cargo_id] = (contagemPorCargo[l.cargo_id] || 0) + 1;
        }
      });

      return (data || []).map((c) => ({
        ...c,
        vagas_ocupadas: contagemPorCargo[c.id] || 0,
        vagas_disponiveis: c.quantidade_vagas - (contagemPorCargo[c.id] || 0),
      }));
    },
    enabled: open,
  });

  // Buscar composição do cargo (unidades vinculadas)
  const { data: composicaoCargo, isLoading: loadingComposicao } = useQuery({
    queryKey: ["composicao-cargo-lotacao", cargoId],
    queryFn: async () => {
      if (!cargoId) return [];

      const { data, error } = await supabase
        .from("composicao_cargos")
        .select(`
          id,
          unidade_id,
          quantidade_vagas,
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
        .eq("cargo_id", cargoId);

      if (error) throw error;
      return (data || []) as ComposicaoCargo[];
    },
    enabled: !!cargoId,
  });

  // Buscar lotações ativas para o cargo selecionado
  const { data: lotacoesAtivas } = useQuery({
    queryKey: ["lotacoes-ativas-cargo", cargoId],
    queryFn: async () => {
      if (!cargoId) return {};

      const { data, error } = await supabase
        .from("lotacoes")
        .select("unidade_id")
        .eq("cargo_id", cargoId)
        .eq("ativo", true);

      if (error) throw error;

      const contagem: Record<string, number> = {};
      (data || []).forEach((lot) => {
        if (lot.unidade_id) {
          contagem[lot.unidade_id] = (contagem[lot.unidade_id] || 0) + 1;
        }
      });
      return contagem;
    },
    enabled: !!cargoId,
  });

  // Buscar todas as unidades (fallback)
  const { data: todasUnidades } = useQuery({
    queryKey: ["unidades-ativas-lotacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Determinar unidades disponíveis baseado na composição do cargo
  const unidadesDisponiveis = useMemo(() => {
    if (!cargoId) return [];

    // Se tem composição definida, usar as unidades da composição
    if (composicaoCargo && composicaoCargo.length > 0) {
      return composicaoCargo
        .filter((c) => c.unidade !== null)
        .map((c) => {
          const vagasTotal = c.quantidade_vagas || 0;
          const vagasOcupadas = lotacoesAtivas?.[c.unidade_id] || 0;
          const vagasDisponiveis = vagasTotal - vagasOcupadas;

          return {
            id: c.unidade!.id,
            nome: c.unidade!.nome,
            sigla: c.unidade!.sigla,
            tipo: null as string | null,
            vagasTotal,
            vagasOcupadas,
            vagasDisponiveis,
            fromComposicao: true,
          };
        });
    }

    // Fallback: mostrar todas as unidades
    return (todasUnidades || []).map((u) => ({
      ...u,
      vagasTotal: null as number | null,
      vagasOcupadas: 0,
      vagasDisponiveis: null as number | null,
      fromComposicao: false,
    }));
  }, [cargoId, composicaoCargo, lotacoesAtivas, todasUnidades]);

  // Informações da unidade selecionada
  const unidadeSelecionada = useMemo(() => {
    return unidadesDisponiveis.find((u) => u.id === unidadeId);
  }, [unidadesDisponiveis, unidadeId]);

  const semVagasNaUnidade = unidadeSelecionada?.vagasDisponiveis !== null && 
    unidadeSelecionada?.vagasDisponiveis !== undefined &&
    unidadeSelecionada.vagasDisponiveis <= 0;

  // Filtrar cargos com vagas
  const cargosComVagas = cargos.filter(c => c.vagas_disponiveis > 0);
  const cargoSelecionado = cargos.find(c => c.id === cargoId);

  // Filtrar portarias pelo tipo de ato selecionado
  const portariasFiltradas = portarias.filter((p: any) => {
    if (!atoTipo) return true;
    if (atoTipo === "portaria") return true;
    return false;
  });

  // Handlers com reset
  const handleCargoChange = (value: string) => {
    setCargoId(value);
    setUnidadeId("");
  };

  const handleAtoTipoChange = (value: string) => {
    setAtoTipo(value);
    setPortariaId("");
    setAtoNumeroManual("");
  };

  const resetForm = () => {
    setCargoId("");
    setUnidadeId("");
    setDataInicio(format(new Date(), "yyyy-MM-dd"));
    setAtoTipo("");
    setPortariaId("");
    setAtoNumeroManual("");
    setObservacao("");
  };

  // Obter número do ato
  const getAtoNumero = () => {
    if (portariaId) {
      const portaria = portarias.find((p: any) => p.id === portariaId);
      return portaria?.numero || "";
    }
    return atoNumeroManual;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servidor || !cargoId || !unidadeId || !dataInicio) return;

    await lotarServidor.mutateAsync({
      servidorId: servidor.id,
      cargoId,
      unidadeId,
      dataInicio,
      atoNumero: getAtoNumero() || undefined,
      atoTipo: atoTipo || undefined,
      observacao: observacao || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  if (!servidor) return null;

  const loadingUnidades = loadingComposicao;
  const temComposicaoDefinida = composicaoCargo && composicaoCargo.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Lotar Servidor
          </DialogTitle>
          <DialogDescription>
            Atribuir lotação para <strong>{servidor.nome_completo}</strong>
            {servidor.matricula && ` (Matrícula: ${servidor.matricula})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cargo */}
          <div className="space-y-2">
            <Label>Cargo *</Label>
            <Select value={cargoId} onValueChange={handleCargoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo com vagas" />
              </SelectTrigger>
              <SelectContent>
                {loadingCargos ? (
                  <div className="p-2 text-center text-muted-foreground">Carregando...</div>
                ) : cargosComVagas.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">Nenhum cargo com vaga disponível</div>
                ) : (
                  cargosComVagas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.sigla ? `${c.sigla} - ${c.nome}` : c.nome}</span>
                        <Badge variant="secondary" className="text-xs">
                          {c.vagas_disponiveis} vaga{c.vagas_disponiveis > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {cargoSelecionado && (
              <p className="text-xs text-muted-foreground">
                {cargoSelecionado.vagas_ocupadas}/{cargoSelecionado.quantidade_vagas} vagas ocupadas
              </p>
            )}
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label>Unidade de Lotação *</Label>
            <Select 
              value={unidadeId} 
              onValueChange={setUnidadeId}
              disabled={!cargoId}
            >
              <SelectTrigger>
                <SelectValue placeholder={cargoId ? "Selecione a unidade" : "Selecione um cargo primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {loadingUnidades ? (
                  <div className="p-2 text-center text-muted-foreground">Carregando unidades...</div>
                ) : unidadesDisponiveis.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">Nenhuma unidade disponível</div>
                ) : (
                  unidadesDisponiveis.map((u) => {
                    const semVagas = u.vagasDisponiveis !== null && u.vagasDisponiveis <= 0;
                    return (
                      <SelectItem key={u.id} value={u.id} disabled={semVagas}>
                        <div className="flex items-center gap-2">
                          <span>{u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}</span>
                          {u.tipo && <span className="text-xs text-muted-foreground">({u.tipo})</span>}
                          {u.vagasDisponiveis !== null && (
                            <Badge 
                              variant={u.vagasDisponiveis > 0 ? "secondary" : "destructive"} 
                              className="text-xs"
                            >
                              {u.vagasDisponiveis} vaga{u.vagasDisponiveis !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {cargoId && !loadingUnidades && !temComposicaoDefinida && (
              <p className="text-xs text-amber-600">
                Este cargo não possui unidades vinculadas na composição. Mostrando todas as unidades.
              </p>
            )}
            {cargoId && !loadingUnidades && temComposicaoDefinida && (
              <p className="text-xs text-muted-foreground">
                {unidadesDisponiveis.length} unidade(s) definida(s) para este cargo
              </p>
            )}
          </div>

          {/* Alerta de sem vagas */}
          {semVagasNaUnidade && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não há vagas disponíveis para este cargo nesta unidade.
                <br />
                <span className="text-xs">
                  Vagas totais: {unidadeSelecionada?.vagasTotal} | Ocupadas: {unidadeSelecionada?.vagasOcupadas}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Data de Início */}
          <div className="space-y-2">
            <Label>Data de Início *</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
            />
          </div>

          {/* Tipo de Ato */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo do Ato
            </Label>
            <Select value={atoTipo} onValueChange={handleAtoTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de ato" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ATO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Número do Ato */}
          {atoTipo && (
            <div className="space-y-2">
              <Label>Número do Ato</Label>
              {atoTipo === "portaria" ? (
                <>
                  <Select value={portariaId} onValueChange={setPortariaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma portaria cadastrada" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPortarias ? (
                        <div className="p-2 text-center text-muted-foreground">Carregando portarias...</div>
                      ) : portariasFiltradas.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">Nenhuma portaria encontrada</div>
                      ) : (
                        portariasFiltradas.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{p.numero}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {p.titulo || p.categoria}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {p.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecione uma portaria ou{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => {
                        setPortariaId("");
                        setAtoTipo("manual");
                      }}
                    >
                      digite manualmente
                    </button>
                  </p>
                </>
              ) : (
                <Input
                  value={atoNumeroManual}
                  onChange={(e) => setAtoNumeroManual(e.target.value)}
                  placeholder="Ex: 001/2026"
                />
              )}
            </div>
          )}

          {/* Observação */}
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                !cargoId || 
                !unidadeId || 
                !dataInicio || 
                semVagasNaUnidade ||
                lotarServidor.isPending
              }
              className="bg-primary hover:bg-primary/90"
            >
              {lotarServidor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Lotação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
