/**
 * Muda a situação do pedido. A aprovação do dirigente acontece no SEI: aqui se registra o nº do documento e a data.
 * Cancelar pede o motivo. O que faltar (trecho emitido, trechos em aberto) aparece antes de salvar.
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { pendenciasParaSituacao, proximasSituacoes } from "@/lib/passagens/regras";
import { useMudarSituacao } from "@/hooks/usePassagens";
import { rotuloSituacaoPedido, type PedidoCompleto, type SituacaoPedido } from "@/types/passagens";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: PedidoCompleto;
}

const hoje = () => new Date().toLocaleDateString("sv-SE");

export function SituacaoDialog({ open, onOpenChange, pedido }: Props) {
  const mudar = useMudarSituacao();
  const opcoes = proximasSituacoes(pedido.situacao);
  const [nova, setNova] = useState<SituacaoPedido | "">("");
  const [documento, setDocumento] = useState("");
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNova(opcoes[0] ?? "");
    setDocumento(pedido.aprovacao_documento_sei ?? "");
    setData(pedido.aprovacao_data ?? hoje());
    setMotivo("");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [open]);

  const pendencias = useMemo(() => {
    if (!nova || nova === "aprovado" || nova === "cancelado") return [];
    return pendenciasParaSituacao(nova, pedido, pedido.passageiros);
  }, [nova, pedido]);

  const gravar = async () => {
    if (!nova) return;
    if (nova === "aprovado" && (!documento.trim() || !data)) {
      setErro("Informe o nº do documento SEI e a data da aprovação.");
      return;
    }
    if (nova === "cancelado" && motivo.trim().length < 3) {
      setErro("Escreva o motivo do cancelamento.");
      return;
    }
    if (pendencias.length) return;
    try {
      await mudar.mutateAsync({
        id: pedido.id,
        situacao: nova,
        ...(nova === "aprovado" ? { aprovacao_documento_sei: documento.trim(), aprovacao_data: data } : {}),
        ...(nova === "cancelado" ? { cancelamento_motivo: motivo.trim() } : {}),
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
          <DialogTitle>Mudar situação</DialogTitle>
          <DialogDescription>Hoje: {rotuloSituacaoPedido(pedido.situacao)}. O ato continua no SEI; aqui fica o registro.</DialogDescription>
        </DialogHeader>
        {opcoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este pedido está encerrado.</p>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={nova} onValueChange={(v) => { setNova(v as SituacaoPedido); setErro(null); }} className="space-y-2">
              {opcoes.map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <RadioGroupItem value={o} id={`sit-${o}`} />
                  <Label htmlFor={`sit-${o}`} className="font-normal">{rotuloSituacaoPedido(o)}</Label>
                </div>
              ))}
            </RadioGroup>
            {nova === "aprovado" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sit-doc">Nº do documento SEI da aprovação</Label>
                  <Input id="sit-doc" value={documento} onChange={(e) => setDocumento(e.target.value)} inputMode="numeric" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sit-data">Data da aprovação</Label>
                  <Input id="sit-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                </div>
              </div>
            )}
            {nova === "cancelado" && (
              <div className="space-y-2">
                <Label htmlFor="sit-motivo">Motivo do cancelamento</Label>
                <Textarea id="sit-motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
            )}
            {pendencias.map((p) => (
              <p key={p} className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm" role="status">{p}</p>
            ))}
            {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          {opcoes.length > 0 && (
            <Button onClick={gravar} disabled={mudar.isPending || !nova || pendencias.length > 0}>Salvar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
