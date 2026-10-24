/**
 * Trecho do passageiro (origem, destino, data). Na inclusão, "ida e volta" cria os dois trechos de uma vez.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSalvarTrecho } from "@/hooks/usePassagens";
import type { PassagemTrecho } from "@/types/passagens";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  passageiroId: string;
  proximaOrdem: number;
  trecho?: PassagemTrecho | null;
  sugestao?: { destino?: string | null; ida?: string | null; volta?: string | null };
}

export function TrechoDialog({ open, onOpenChange, pedidoId, passageiroId, proximaOrdem, trecho, sugestao }: Props) {
  const salvar = useSalvarTrecho(pedidoId);
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [data, setData] = useState("");
  const [volta, setVolta] = useState(false);
  const [dataVolta, setDataVolta] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // sugestão em valores simples: o objeto muda a cada render e não pode reabrir o formulário
  const sDestino = sugestao?.destino;
  const sIda = sugestao?.ida;
  const sVolta = sugestao?.volta;

  useEffect(() => {
    if (!open) return;
    setOrigem(trecho?.origem ?? "");
    setDestino(trecho?.destino ?? sDestino ?? "");
    setData(trecho?.data_voo ?? sIda ?? "");
    setVolta(!trecho);
    setDataVolta(sVolta ?? "");
    setErro(null);
  }, [open, trecho, sDestino, sIda, sVolta]);

  const gravar = async () => {
    if (origem.trim().length < 2 || destino.trim().length < 2 || !data) {
      setErro("Informe origem, destino e data.");
      return;
    }
    if (!trecho && volta && (!dataVolta || dataVolta < data)) {
      setErro("A volta precisa de data igual ou depois da ida.");
      return;
    }
    try {
      await salvar.mutateAsync({ id: trecho?.id, passageiro_id: passageiroId, ordem: trecho?.ordem ?? proximaOrdem, origem: origem.trim(), destino: destino.trim(), data_voo: data });
      if (!trecho && volta) {
        // a ida já está gravada: se a volta falhar (aviso no toast), fecha mesmo assim para não gravar a ida de novo
        await salvar
          .mutateAsync({ passageiro_id: passageiroId, ordem: proximaOrdem + 1, origem: destino.trim(), destino: origem.trim(), data_voo: dataVolta })
          .catch(() => undefined);
      }
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{trecho ? "Editar trecho" : "Novo trecho"}</DialogTitle>
          <DialogDescription>Cidade ou aeroporto de saída e de chegada, e a data do voo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trecho-origem">Origem</Label>
              <Input id="trecho-origem" value={origem} onChange={(e) => setOrigem(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trecho-destino">Destino</Label>
              <Input id="trecho-destino" value={destino} onChange={(e) => setDestino(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trecho-data">{trecho ? "Data do voo" : "Data da ida"}</Label>
            <Input id="trecho-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          {!trecho && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox id="trecho-volta" checked={volta} onCheckedChange={(v) => setVolta(v === true)} />
                <Label htmlFor="trecho-volta" className="font-normal">Incluir a volta (destino → origem)</Label>
              </div>
              {volta && (
                <div className="space-y-2">
                  <Label htmlFor="trecho-data-volta">Data da volta</Label>
                  <Input id="trecho-data-volta" type="date" value={dataVolta} onChange={(e) => setDataVolta(e.target.value)} />
                </div>
              )}
            </>
          )}
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
