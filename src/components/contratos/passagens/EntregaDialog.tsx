/**
 * Registra a entrega de um item da prestação de contas (cartão de embarque ou relatório): a data e, para o relatório,
 * o nº do documento SEI. O relatório continua no SEI; aqui fica o registro. "Desfazer" volta o item para pendente.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Entrega {
  data: string | null;
  documentoSei: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descricao?: string;
  /** Pede o nº do documento SEI (relatórios). */
  comSei?: boolean;
  inicial: Entrega;
  salvando?: boolean;
  onSalvar: (e: Entrega) => Promise<unknown>;
}

const hoje = () => new Date().toLocaleDateString("sv-SE");

export function EntregaDialog({ open, onOpenChange, titulo, descricao, comSei, inicial, salvando, onSalvar }: Props) {
  const [data, setData] = useState("");
  const [sei, setSei] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setData(inicial.data ?? hoje());
    setSei(inicial.documentoSei ?? "");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [open]);

  const gravar = async (e: Entrega) => {
    try {
      await onSalvar(e);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const salvar = () => {
    if (!data) {
      setErro("Informe a data da entrega.");
      return;
    }
    if (data > hoje()) {
      setErro("A data da entrega não pode ser futura.");
      return;
    }
    gravar({ data, documentoSei: comSei ? sei.trim() || null : null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entrega-data">Data da entrega</Label>
            <Input id="entrega-data" type="date" value={data} max={hoje()} onChange={(e) => { setData(e.target.value); setErro(null); }} />
          </div>
          {comSei && (
            <div className="space-y-2">
              <Label htmlFor="entrega-sei">Nº do documento SEI (se houver)</Label>
              <Input id="entrega-sei" value={sei} maxLength={60} inputMode="numeric" onChange={(e) => setSei(e.target.value)} />
            </div>
          )}
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {inicial.data ? (
            <Button type="button" variant="ghost" disabled={salvando} onClick={() => gravar({ data: null, documentoSei: null })}>
              Desfazer entrega
            </Button>
          ) : <span />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
            <Button onClick={salvar} disabled={salvando}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
