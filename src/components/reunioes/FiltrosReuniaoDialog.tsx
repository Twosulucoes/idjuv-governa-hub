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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Filter, X } from "lucide-react";

export interface FiltrosReuniao {
  dataInicio: string;
  dataFim: string;
  status: string;
  tipo: string;
}

interface FiltrosReuniaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: FiltrosReuniao;
  onAplicar: (filtros: FiltrosReuniao) => void;
  onLimpar: () => void;
}

const filtrosIniciais: FiltrosReuniao = {
  dataInicio: "",
  dataFim: "",
  status: "",
  tipo: "",
};

export function FiltrosReuniaoDialog({
  open,
  onOpenChange,
  filtros,
  onAplicar,
  onLimpar,
}: FiltrosReuniaoDialogProps) {
  const [localFiltros, setLocalFiltros] = useState<FiltrosReuniao>(filtros);

  const handleAplicar = () => {
    onAplicar(localFiltros);
    onOpenChange(false);
  };

  const handleLimpar = () => {
    setLocalFiltros(filtrosIniciais);
    onLimpar();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar Reuniões
          </DialogTitle>
          <DialogDescription>
            Defina os critérios para filtrar a lista de reuniões
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">De</Label>
                <Input
                  type="date"
                  value={localFiltros.dataInicio}
                  onChange={(e) =>
                    setLocalFiltros({ ...localFiltros, dataInicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Até</Label>
                <Input
                  type="date"
                  value={localFiltros.dataFim}
                  onChange={(e) =>
                    setLocalFiltros({ ...localFiltros, dataFim: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFiltros.status}
              onValueChange={(value) =>
                setLocalFiltros({ ...localFiltros, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="adiada">Adiada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={localFiltros.tipo}
              onValueChange={(value) =>
                setLocalFiltros({ ...localFiltros, tipo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="ordinaria">Ordinária</SelectItem>
                <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                <SelectItem value="reuniao_trabalho">Reunião de Trabalho</SelectItem>
                <SelectItem value="audiencia">Audiência</SelectItem>
                <SelectItem value="sessao_solene">Sessão Solene</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleLimpar} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleAplicar} className="flex-1">
            <Filter className="h-4 w-4 mr-2" />
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { filtrosIniciais };
