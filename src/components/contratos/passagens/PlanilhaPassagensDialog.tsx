/**
 * Planilha de passagens por período (data de emissão do bilhete), de todos os contratos: passageiro, pedido, evento,
 * quem pediu, trecho, valores e a fatura de cada bilhete. "Por beneficiário" e "por instituição" saem do filtro da
 * própria planilha.
 */

import { useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { exportarParaExcel } from "@/export/exportExcel";
import { linhasPlanilhaBilhetes } from "@/lib/passagens/planilhas";
import { buscarBilhetesPeriodo } from "@/hooks/usePassagensFaturas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanilhaPassagensDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ano = new Date().getFullYear();
    setDe(`${ano}-01-01`);
    setAte(new Date().toLocaleDateString("sv-SE"));
  }, [open]);

  const gerar = async () => {
    if (!de || !ate || de > ate) return;
    setGerando(true);
    try {
      const bilhetes = await buscarBilhetesPeriodo(de, ate);
      if (bilhetes.length === 0) {
        toast({ title: "Nenhum bilhete emitido no período" });
        return;
      }
      exportarParaExcel(linhasPlanilhaBilhetes(bilhetes), `passagens-${de}-a-${ate}`, "Passagens");
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Não foi possível gerar a planilha", description: (e as Error)?.message, variant: "destructive" });
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Planilha de passagens</DialogTitle>
          <DialogDescription>Bilhetes emitidos no período, com o passageiro, o pedido e a fatura. Filtre por pessoa ou instituição na planilha.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pl-de">Emitidos de</Label>
            <Input id="pl-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-ate">até</Label>
            <Input id="pl-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>
        {de > ate && <p className="text-sm text-destructive" role="alert">A data inicial passa da final.</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={gerar} disabled={gerando || !de || !ate || de > ate}>
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Gerar planilha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
