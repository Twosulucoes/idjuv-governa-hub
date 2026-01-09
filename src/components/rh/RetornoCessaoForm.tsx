import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RotateCcw } from "lucide-react";
import { useEncerrarCessao } from "@/hooks/useServidorCompleto";
import { type Cessao } from "@/types/servidor";

interface Props {
  cessao: Cessao;
  servidorNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RetornoCessaoForm({ cessao, servidorNome, open, onOpenChange }: Props) {
  const encerrarCessao = useEncerrarCessao();
  
  const [dataRetorno, setDataRetorno] = useState('');
  const [atoRetornoNumero, setAtoRetornoNumero] = useState('');
  const [atoRetornoData, setAtoRetornoData] = useState('');

  const resetForm = () => {
    setDataRetorno('');
    setAtoRetornoNumero('');
    setAtoRetornoData('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataRetorno) return;

    await encerrarCessao.mutateAsync({
      cessaoId: cessao.id,
      dataRetorno,
      atoRetornoNumero: atoRetornoNumero || undefined,
      atoRetornoData: atoRetornoData || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Registrar Retorno de Cessão
          </DialogTitle>
          <DialogDescription>
            Registrar retorno de {servidorNome}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
          <p><strong>Tipo:</strong> {cessao.tipo === 'entrada' ? 'Cessão de Entrada' : 'Cessão de Saída'}</p>
          <p><strong>Órgão:</strong> {cessao.tipo === 'entrada' ? cessao.orgao_origem : cessao.orgao_destino}</p>
          <p><strong>Início:</strong> {new Date(cessao.data_inicio).toLocaleDateString('pt-BR')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data de Retorno *</Label>
            <Input
              type="date"
              value={dataRetorno}
              onChange={(e) => setDataRetorno(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nº Ato de Retorno</Label>
              <Input
                value={atoRetornoNumero}
                onChange={(e) => setAtoRetornoNumero(e.target.value)}
                placeholder="Ex: 001/2024"
              />
            </div>
            <div>
              <Label>Data do Ato</Label>
              <Input
                type="date"
                value={atoRetornoData}
                onChange={(e) => setAtoRetornoData(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!dataRetorno || encerrarCessao.isPending}>
              {encerrarCessao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Retorno
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
