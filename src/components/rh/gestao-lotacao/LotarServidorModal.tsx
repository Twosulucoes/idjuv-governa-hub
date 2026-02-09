import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Building2, AlertCircle, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { 
  useLotarServidor, 
  useCargosVagos, 
  useUnidadesCompativeisCargo,
  usePortariasParaAto,
  type ServidorGestao 
} from "@/hooks/useGestaoLotacao";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  isCargoChefiaByName,
  requerJustificativaLotacao,
  MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA,
} from "@/constants/cargos-chefia";

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

export function LotarServidorModal({ servidor, open, onOpenChange }: Props) {
  const lotarServidor = useLotarServidor();
  const { data: cargos = [], isLoading: loadingCargos } = useCargosVagos();
  const { data: portarias = [], isLoading: loadingPortarias } = usePortariasParaAto();

  const [cargoId, setCargoId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [dataInicio, setDataInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [atoTipo, setAtoTipo] = useState("");
  const [portariaId, setPortariaId] = useState("");
  const [atoNumeroManual, setAtoNumeroManual] = useState("");
  const [observacao, setObservacao] = useState("");
  const [justificativaLotacaoAlternativa, setJustificativaLotacaoAlternativa] = useState("");

  // Buscar unidades compatíveis com o cargo selecionado
  const { data: unidadesCompativeis = [], isLoading: loadingUnidades } = useUnidadesCompativeisCargo(cargoId || null);

  // Filtrar cargos com vagas e portarias por tipo
  const cargosComVagas = cargos.filter(c => c.vagas_disponiveis > 0);
  const cargoSelecionado = cargos.find(c => c.id === cargoId);
  
  // Obter a unidade selecionada para validação
  const unidadeSelecionada = unidadesCompativeis.find((u: any) => u.id === unidadeId);
  
  // Verificar se é cargo de chefia e se requer justificativa
  const isChefia = useMemo(() => isCargoChefiaByName(cargoSelecionado?.nome), [cargoSelecionado?.nome]);
  const precisaJustificativa = useMemo(
    () => requerJustificativaLotacao(cargoSelecionado?.nome, unidadeSelecionada?.tipo),
    [cargoSelecionado?.nome, unidadeSelecionada?.tipo]
  );
  
  // Filtrar portarias pelo tipo de ato selecionado
  const portariasFiltradas = portarias.filter((p: any) => {
    if (!atoTipo) return true;
    // Portarias da Central (tipo "portaria" no campo tipo)
    if (atoTipo === "portaria") return true;
    return false;
  });

  // Limpar unidade quando cargo mudar
  useEffect(() => {
    setUnidadeId("");
  }, [cargoId]);

  // Limpar portaria quando tipo de ato mudar
  useEffect(() => {
    setPortariaId("");
    setAtoNumeroManual("");
  }, [atoTipo]);

  const resetForm = () => {
    setCargoId("");
    setUnidadeId("");
    setDataInicio(format(new Date(), "yyyy-MM-dd"));
    setAtoTipo("");
    setPortariaId("");
    setAtoNumeroManual("");
    setObservacao("");
    setJustificativaLotacaoAlternativa("");
  };

  // Obter número do ato (da portaria selecionada ou manual)
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

    // Validar justificativa para lotação alternativa de cargo de chefia
    if (precisaJustificativa) {
      if (!justificativaLotacaoAlternativa || justificativaLotacaoAlternativa.trim().length < MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA) {
        return; // O formulário já mostra o erro via validação visual
      }
    }

    // Montar observação incluindo justificativa de lotação alternativa se aplicável
    let observacaoFinal = observacao || "";
    if (precisaJustificativa && justificativaLotacaoAlternativa) {
      const prefixo = `[LOTAÇÃO ALTERNATIVA - ${cargoSelecionado?.nome}] `;
      observacaoFinal = prefixo + justificativaLotacaoAlternativa + (observacaoFinal ? `\n\n${observacaoFinal}` : "");
    }

    await lotarServidor.mutateAsync({
      servidorId: servidor.id,
      cargoId,
      unidadeId,
      dataInicio,
      atoNumero: getAtoNumero() || undefined,
      atoTipo: atoTipo || undefined,
      observacao: observacaoFinal || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  if (!servidor) return null;

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
          {/* Alerta sobre validação */}
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Apenas cargos com vagas são exibidos. As unidades são filtradas conforme o cargo selecionado.
            </AlertDescription>
          </Alert>

          {/* Cargo */}
          <div className="space-y-2">
            <Label>Cargo *</Label>
            <Select value={cargoId} onValueChange={setCargoId}>
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
                        <span>{c.sigla} - {c.nome}</span>
                        <Badge variant="outline" className="text-xs bg-success/10 text-success">
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

          {/* Unidade - Filtrada por cargo */}
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
                ) : unidadesCompativeis.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">Nenhuma unidade disponível para este cargo</div>
                ) : (
                  unidadesCompativeis.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        {u.sigla && <Badge variant="outline" className="text-xs">{u.sigla}</Badge>}
                        <span>{u.nome}</span>
                        <span className="text-xs text-muted-foreground">({u.tipo})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {cargoId && !loadingUnidades && (
              <p className="text-xs text-muted-foreground">
                {unidadesCompativeis.length} unidade(s) disponível(is) para este cargo
              </p>
            )}
          </div>

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

          {/* Tipo de Ato - Vinculado à Central de Portarias */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo do Ato (Central de Portarias)
            </Label>
            <Select value={atoTipo} onValueChange={setAtoTipo}>
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

          {/* Número do Ato - Seleção de Portaria ou Manual */}
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
                    Selecione uma portaria da Central de Portarias ou{" "}
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

          {/* Alerta e Justificativa para Lotação Alternativa */}
          {precisaJustificativa && (
            <div className="space-y-2">
              <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm">
                  <strong>Atenção:</strong> O cargo "{cargoSelecionado?.nome}" normalmente é lotado em unidade de tipo diferente de "{unidadeSelecionada?.tipo}". 
                  É necessário justificar esta lotação alternativa.
                </AlertDescription>
              </Alert>
              <Label className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Justificativa da Lotação Alternativa *
              </Label>
              <Textarea
                value={justificativaLotacaoAlternativa}
                onChange={(e) => setJustificativaLotacaoAlternativa(e.target.value)}
                placeholder={`Justifique a lotação deste cargo de chefia em unidade diferente do tipo padrão (mínimo ${MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA} caracteres)...`}
                rows={3}
                className={
                  justificativaLotacaoAlternativa.trim().length > 0 && 
                  justificativaLotacaoAlternativa.trim().length < MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA
                    ? "border-destructive"
                    : ""
                }
                required
              />
              <p className={`text-xs ${
                justificativaLotacaoAlternativa.trim().length < MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA 
                  ? "text-destructive" 
                  : "text-muted-foreground"
              }`}>
                {justificativaLotacaoAlternativa.trim().length}/{MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA} caracteres mínimos
              </p>
            </div>
          )}

          {/* Indicador de Cargo de Chefia */}
          {isChefia && !precisaJustificativa && unidadeSelecionada && (
            <Alert variant="default" className="bg-success/10 border-success/30">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-sm text-success">
                Lotação compatível: cargo de chefia "{cargoSelecionado?.nome}" em unidade do tipo "{unidadeSelecionada?.tipo}".
              </AlertDescription>
            </Alert>
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
                lotarServidor.isPending ||
                (precisaJustificativa && justificativaLotacaoAlternativa.trim().length < MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA)
              }
              className="bg-success hover:bg-success/90"
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
