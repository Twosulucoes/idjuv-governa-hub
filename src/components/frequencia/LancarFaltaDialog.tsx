import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar as CalendarIcon, X } from "lucide-react";
import { useLancarFaltaEmLote, useRecalcularFrequencia, type FrequenciaServidorResumo } from "@/hooks/useFrequencia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LancarFaltaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidor: FrequenciaServidorResumo | null;
  ano: number;
  mes: number;
}

const TIPOS_OCORRENCIA = [
  { value: "falta", label: "Falta (sem justificativa)" },
  { value: "atestado", label: "Atestado Médico" },
  { value: "licenca", label: "Licença" },
  { value: "ferias", label: "Férias" },
  // No banco, o tipo é um ENUM (tipo_registro_ponto) e NÃO existe "abono".
  // O equivalente funcional é "folga".
  { value: "folga", label: "Abono / Folga / Compensação" },
];

export function LancarFaltaDialog({ open, onOpenChange, servidor, ano, mes }: LancarFaltaDialogProps) {
  const [tipo, setTipo] = useState("falta");
  const [datasSelecionadas, setDatasSelecionadas] = useState<Date[]>([]);
  const [justificativa, setJustificativa] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const lancarFalta = useLancarFaltaEmLote();
  const recalcular = useRecalcularFrequencia();

  const handleClose = () => {
    setTipo("falta");
    setDatasSelecionadas([]);
    setJustificativa("");
    onOpenChange(false);
  };

  const handleRemoverData = (dataRemover: Date) => {
    setDatasSelecionadas(datasSelecionadas.filter((d) => d.getTime() !== dataRemover.getTime()));
  };

  const handleSubmit = async () => {
    if (!servidor || datasSelecionadas.length === 0) return;

    try {
      await lancarFalta.mutateAsync({
        servidor_id: servidor.servidor_id,
        datas: datasSelecionadas.map((d) => format(d, "yyyy-MM-dd")),
        tipo,
        justificativa: justificativa || undefined,
      });

      // Recalcular frequência
      await recalcular.mutateAsync({
        servidor_id: servidor.servidor_id,
        ano,
        mes,
      });

      handleClose();
    } catch (error) {
      console.error("Erro ao lançar:", error);
    }
  };

  // Limitar seleção ao mês/ano da competência
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lançar Ocorrência</DialogTitle>
          <DialogDescription>
            Registrar falta, atestado ou outra ocorrência para o servidor.
          </DialogDescription>
        </DialogHeader>

        {servidor && (
          <div className="space-y-4">
            {/* Info do servidor */}
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium">{servidor.servidor_nome}</p>
              <p className="text-sm text-muted-foreground">
                {servidor.servidor_matricula} • {servidor.servidor_cargo}
              </p>
            </div>

            {/* Tipo de ocorrência */}
            <div className="space-y-2">
              <Label>Tipo de Ocorrência</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_OCORRENCIA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de datas */}
            <div className="space-y-2">
              <Label>Data(s)</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      datasSelecionadas.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {datasSelecionadas.length > 0
                      ? `${datasSelecionadas.length} data(s) selecionada(s)`
                      : "Selecione as datas"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="multiple"
                    selected={datasSelecionadas}
                    onSelect={(dates) => setDatasSelecionadas(dates || [])}
                    locale={ptBR}
                    fromDate={primeiroDia}
                    toDate={ultimoDia}
                    disabled={(date) => {
                      const day = date.getDay();
                      return day === 0 || day === 6; // Desabilitar finais de semana
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* Datas selecionadas */}
              {datasSelecionadas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {datasSelecionadas
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((data) => (
                      <Badge key={data.toISOString()} variant="secondary" className="gap-1">
                        {format(data, "dd/MM")}
                        <button
                          type="button"
                          onClick={() => handleRemoverData(data)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <Label>Justificativa / Observação</Label>
              <Textarea
                placeholder="Descreva a justificativa ou observações..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!servidor || datasSelecionadas.length === 0 || lancarFalta.isPending}
          >
            {lancarFalta.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
