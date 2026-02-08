import { useState } from "react";
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
import { Loader2, Building2, AlertCircle, CheckCircle } from "lucide-react";
import { useLotarServidor, useCargosVagos, useUnidadesGestao, type ServidorGestao } from "@/hooks/useGestaoLotacao";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  servidor: ServidorGestao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LotarServidorModal({ servidor, open, onOpenChange }: Props) {
  const lotarServidor = useLotarServidor();
  const { data: cargos = [], isLoading: loadingCargos } = useCargosVagos();
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidadesGestao();

  const [cargoId, setCargoId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [dataInicio, setDataInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [atoNumero, setAtoNumero] = useState("");
  const [atoTipo, setAtoTipo] = useState("");
  const [observacao, setObservacao] = useState("");

  // Filtrar apenas cargos com vagas
  const cargosComVagas = cargos.filter(c => c.vagas_disponiveis > 0);
  const cargoSelecionado = cargos.find(c => c.id === cargoId);

  const resetForm = () => {
    setCargoId("");
    setUnidadeId("");
    setDataInicio(format(new Date(), "yyyy-MM-dd"));
    setAtoNumero("");
    setAtoTipo("");
    setObservacao("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servidor || !cargoId || !unidadeId || !dataInicio) return;

    await lotarServidor.mutateAsync({
      servidorId: servidor.id,
      cargoId,
      unidadeId,
      dataInicio,
      atoNumero: atoNumero || undefined,
      atoTipo: atoTipo || undefined,
      observacao: observacao || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  if (!servidor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
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
              Apenas cargos com vagas disponíveis são exibidos. A validação de vaga é feita em tempo real antes de salvar.
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

          {/* Unidade */}
          <div className="space-y-2">
            <Label>Unidade de Lotação *</Label>
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {loadingUnidades ? (
                  <div className="p-2 text-center text-muted-foreground">Carregando...</div>
                ) : (
                  unidades.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.sigla && `${u.sigla} - `}{u.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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

          {/* Ato (opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo do Ato</Label>
              <Select value={atoTipo} onValueChange={setAtoTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="decreto">Decreto</SelectItem>
                  <SelectItem value="ordem_servico">Ordem de Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número do Ato</Label>
              <Input
                value={atoNumero}
                onChange={(e) => setAtoNumero(e.target.value)}
                placeholder="Ex: 001/2026"
              />
            </div>
          </div>

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
              disabled={!cargoId || !unidadeId || !dataInicio || lotarServidor.isPending}
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
