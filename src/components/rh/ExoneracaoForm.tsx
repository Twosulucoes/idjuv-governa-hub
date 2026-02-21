import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserX, AlertTriangle } from "lucide-react";
import { useEncerrarProvimento } from "@/hooks/useServidorCompleto";
import { TIPOS_ATO, MOTIVOS_ENCERRAMENTO, type Provimento } from "@/types/servidor";

interface Props {
  provimento: Provimento;
  servidorNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExoneracaoForm({ provimento, servidorNome, open, onOpenChange }: Props) {
  const encerrarProvimento = useEncerrarProvimento();
  
  const [motivo, setMotivo] = useState('exoneracao');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [atoTipo, setAtoTipo] = useState('');
  const [atoNumero, setAtoNumero] = useState('');
  const [atoData, setAtoData] = useState('');
  const [atoDoeNumero, setAtoDoeNumero] = useState('');
  const [atoDoeData, setAtoDoeData] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const resetForm = () => {
    setMotivo('exoneracao');
    setDataEncerramento('');
    setAtoTipo('');
    setAtoNumero('');
    setAtoData('');
    setAtoDoeNumero('');
    setAtoDoeData('');
    setObservacoes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataEncerramento || !motivo) return;

    await encerrarProvimento.mutateAsync({
      provimentoId: provimento.id,
      motivo,
      dataEncerramento,
      atoTipo: atoTipo || undefined,
      atoNumero: atoNumero.trim() || undefined,
      atoData: atoData || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            Registrar Exoneração / Encerramento
          </DialogTitle>
          <DialogDescription>
            Encerrar provimento de {servidorNome}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ação irá encerrar o provimento atual do servidor no cargo <strong>{provimento.cargo?.nome}</strong>.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Motivo */}
          <div>
            <Label>Motivo do Encerramento *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_ENCERRAMENTO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div>
            <Label>Data do Encerramento *</Label>
            <Input
              type="date"
              value={dataEncerramento}
              onChange={(e) => setDataEncerramento(e.target.value)}
              required
            />
          </div>

          <Separator />

          {/* Ato */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Ato de Encerramento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  maxLength={30}
                />
              </div>
              <div>
                <Label>Data do Ato</Label>
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
                  maxLength={20}
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
              maxLength={1000}
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!dataEncerramento || !motivo || encerrarProvimento.isPending}
            >
              {encerrarProvimento.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Encerramento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
