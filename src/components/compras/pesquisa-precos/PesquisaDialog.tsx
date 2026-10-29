/**
 * Abertura (ou edição) da pesquisa de preços de um processo SEI: número, objeto, finalidade, data de referência
 * (de onde contam os prazos de 6 e 12 meses do art. 17 do Decreto 39.050-E/2025) e quem faz a pesquisa.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PesquisaPrecos, PesquisaPrecosInput } from "@/hooks/usePesquisaPrecos";
import { FINALIDADE_LABEL } from "./rotulos";

interface PesquisaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pesquisa?: PesquisaPrecos | null;
  salvando?: boolean;
  onSalvar: (p: PesquisaPrecosInput) => Promise<unknown>;
}

const hoje = () => new Date().toLocaleDateString("sv-SE");

export function PesquisaDialog({ open, onOpenChange, pesquisa, salvando, onSalvar }: PesquisaDialogProps) {
  const [campos, setCampos] = useState({ numero_sei: "", objeto: "", finalidade: "licitacao", data_referencia: hoje(), responsaveis: "", observacoes: "" });
  const [tentou, setTentou] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTentou(false);
    setCampos({
      numero_sei: pesquisa?.numero_sei ?? "",
      objeto: pesquisa?.objeto ?? "",
      finalidade: pesquisa?.finalidade ?? "licitacao",
      data_referencia: pesquisa?.data_referencia ?? hoje(),
      responsaveis: pesquisa?.responsaveis ?? "",
      observacoes: pesquisa?.observacoes ?? "",
    });
  }, [open, pesquisa]);

  const muda = (k: keyof typeof campos) => (v: string) => setCampos((c) => ({ ...c, [k]: v }));
  const erros = {
    numero_sei: !campos.numero_sei.trim() ? "Informe o processo SEI" : null,
    objeto: !campos.objeto.trim() ? "Descreva o objeto" : null,
    data_referencia: !/^\d{4}-\d{2}-\d{2}$/.test(campos.data_referencia) ? "Informe a data de referência" : null,
  };
  const valido = !Object.values(erros).some(Boolean);

  const salvar = async () => {
    setTentou(true);
    if (!valido) return;
    try {
      await onSalvar({
        id: pesquisa?.id,
        numero_sei: campos.numero_sei.trim(),
        objeto: campos.objeto.trim(),
        finalidade: campos.finalidade,
        data_referencia: campos.data_referencia,
        responsaveis: campos.responsaveis.trim() || null,
        observacoes: campos.observacoes.trim() || null,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const erro = (k: keyof typeof erros) => tentou && erros[k] ? <p className="text-sm text-destructive">{erros[k]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pesquisa ? "Editar pesquisa de preços" : "Nova pesquisa de preços"}</DialogTitle>
          <DialogDescription>Uma pesquisa por processo SEI. A nota técnica continua sendo assinada no SEI.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pp-sei">Processo SEI *</Label>
              <Input id="pp-sei" placeholder="00000.000000/2026-00" value={campos.numero_sei} onChange={(e) => muda("numero_sei")(e.target.value)}
                aria-invalid={tentou && !!erros.numero_sei} />
              {erro("numero_sei")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-finalidade">Finalidade *</Label>
              <Select value={campos.finalidade} onValueChange={muda("finalidade")}>
                <SelectTrigger id="pp-finalidade"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FINALIDADE_LABEL).map(([v, r]) => <SelectItem key={v} value={v}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-objeto">Objeto *</Label>
            <Textarea id="pp-objeto" rows={2} value={campos.objeto} onChange={(e) => muda("objeto")(e.target.value)} aria-invalid={tentou && !!erros.objeto} />
            {erro("objeto")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-data">Data de referência *</Label>
            <Input id="pp-data" type="date" className="max-w-[12rem]" value={campos.data_referencia} onChange={(e) => muda("data_referencia")(e.target.value)} />
            <p className="text-sm text-muted-foreground">
              Divulgação do edital prevista ou data da pesquisa. Dela contam os prazos de 12 meses (incisos I, II e V) e de 6 meses
              (incisos III e IV) do art. 17.
            </p>
            {erro("data_referencia")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-resp">Responsáveis pela pesquisa</Label>
            <Textarea id="pp-resp" rows={2} placeholder="Ex.: Equipe de Planejamento e Contratação (portaria de designação)"
              value={campos.responsaveis} onChange={(e) => muda("responsaveis")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-obs">Observações</Label>
            <Textarea id="pp-obs" rows={2} value={campos.observacoes} onChange={(e) => muda("observacoes")(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
