/**
 * Dispensa um passageiro da prestação de contas (ex.: não viajou), com o motivo; ou retira a dispensa.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nome: string;
  dispensado: boolean;
  motivoAtual: string | null;
  salvando?: boolean;
  onSalvar: (dispensar: boolean, motivo: string | null) => Promise<unknown>;
}

export function DispensaDialog({ open, onOpenChange, nome, dispensado, motivoAtual, salvando, onSalvar }: Props) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMotivo(motivoAtual ?? "");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [open]);

  const gravar = async (dispensar: boolean) => {
    if (dispensar && motivo.trim().length < 3) {
      setErro("Escreva o motivo da dispensa.");
      return;
    }
    try {
      await onSalvar(dispensar, dispensar ? motivo.trim() : null);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dispensado ? "Dispensa da prestação" : "Dispensar da prestação"}</DialogTitle>
          <DialogDescription>{nome}: sem cartão de embarque nem relatório a entregar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="dispensa-motivo">Motivo</Label>
          <Textarea id="dispensa-motivo" rows={3} maxLength={1000} value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(null); }} />
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {dispensado ? (
            <Button type="button" variant="ghost" disabled={salvando} onClick={() => gravar(false)}>Retirar dispensa</Button>
          ) : <span />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
            <Button onClick={() => gravar(true)} disabled={salvando}>{dispensado ? "Salvar motivo" : "Dispensar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
