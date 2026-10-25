/**
 * Registra uma opção de voo que a agência mandou para o trecho.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lerNumeroBr } from "@/lib/pca/numero";
import { deDataHoraLocal } from "@/lib/passagens/regras";
import { useSalvarCotacao } from "@/hooks/usePassagens";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  trechoId: string;
  descricaoTrecho: string;
}

export function CotacaoDialog({ open, onOpenChange, pedidoId, trechoId, descricaoTrecho }: Props) {
  const salvar = useSalvarCotacao(pedidoId);
  const [companhia, setCompanhia] = useState("");
  const [voo, setVoo] = useState("");
  const [partida, setPartida] = useState("");
  const [chegada, setChegada] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCompanhia("");
    setVoo("");
    setPartida("");
    setChegada("");
    setValor("");
    setErro(null);
  }, [open]);

  const gravar = async () => {
    const v = lerNumeroBr(valor);
    if (!companhia.trim() || !(v >= 0)) {
      setErro("Informe a companhia e o valor.");
      return;
    }
    if (partida && chegada && chegada < partida) {
      setErro("A chegada vem depois da partida.");
      return;
    }
    try {
      await salvar.mutateAsync({
        trecho_id: trechoId,
        companhia: companhia.trim(),
        voo: voo.trim() || null,
        partida: deDataHoraLocal(partida),
        chegada: deDataHoraLocal(chegada),
        valor: v,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova cotação</DialogTitle>
          <DialogDescription>{descricaoTrecho}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cot-cia">Companhia</Label>
              <Input id="cot-cia" value={companhia} onChange={(e) => setCompanhia(e.target.value)} placeholder="Ex.: LATAM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cot-voo">Voo</Label>
              <Input id="cot-voo" value={voo} onChange={(e) => setVoo(e.target.value)} placeholder="Ex.: LA3741" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cot-partida">Partida</Label>
              <Input id="cot-partida" type="datetime-local" value={partida} onChange={(e) => setPartida(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cot-chegada">Chegada</Label>
              <Input id="cot-chegada" type="datetime-local" value={chegada} onChange={(e) => setChegada(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2 sm:w-1/2">
            <Label htmlFor="cot-valor">Valor total cotado (R$)</Label>
            <Input id="cot-valor" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
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
