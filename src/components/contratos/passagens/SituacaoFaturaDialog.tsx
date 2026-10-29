/**
 * Muda a situação da fatura: recebida → atestada (data e nº SEI do atesto do fiscal) → liquidada (data) → paga (data e
 * nº da OB). Volta um passo quando algo foi lançado errado (fica na trilha) e cancela com motivo antes de paga; a
 * fatura cancelada solta os bilhetes. O FIPLAN continua sendo o oficial.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { pendenciasSituacaoFatura, proximasSituacoesFatura, type SituacaoFatura } from "@/lib/passagens/faturas";
import { useMudarSituacaoFatura } from "@/hooks/usePassagensFaturas";
import { rotuloSituacaoFatura, type PassagemFatura } from "@/types/passagens";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: PassagemFatura | null;
}

const hoje = () => new Date().toLocaleDateString("sv-SE");
const ORDEM: SituacaoFatura[] = ["recebida", "atestada", "liquidada", "paga"];

export function SituacaoFaturaDialog({ open, onOpenChange, fatura }: Props) {
  const mudar = useMudarSituacaoFatura();
  const opcoes = fatura ? proximasSituacoesFatura(fatura.situacao) : [];
  const [nova, setNova] = useState<SituacaoFatura | "">("");
  const [atestoData, setAtestoData] = useState("");
  const [atestoDoc, setAtestoDoc] = useState("");
  const [liquidacao, setLiquidacao] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [ob, setOb] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tentou, setTentou] = useState(false);

  useEffect(() => {
    if (!open || !fatura) return;
    setNova(opcoes[0] ?? "");
    setAtestoData(fatura.atesto_data ?? hoje());
    setAtestoDoc(fatura.atesto_documento_sei ?? "");
    setLiquidacao(fatura.liquidacao_data ?? hoje());
    setPagamento(fatura.pagamento_data ?? hoje());
    setOb(fatura.ob_numero ?? "");
    setMotivo("");
    setTentou(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [open, fatura]);

  if (!fatura) return null;
  const passo = nova ? ORDEM.indexOf(nova) : -1;
  const pede = { atesto: passo >= 1, liquidacao: passo >= 2, pagamento: passo >= 3 };
  // ao voltar um passo, o que vinha depois é apagado
  const dados = {
    atesto_data: pede.atesto ? atestoData || null : null,
    atesto_documento_sei: pede.atesto ? atestoDoc.trim() || null : null,
    liquidacao_data: pede.liquidacao ? liquidacao || null : null,
    pagamento_data: pede.pagamento ? pagamento || null : null,
    ob_numero: pede.pagamento ? ob.trim() || null : null,
  };
  const falta = nova ? pendenciasSituacaoFatura(nova, { ...dados, cancelamento_motivo: motivo }) : [];

  const gravar = async () => {
    setTentou(true);
    if (!nova || falta.length) return;
    try {
      await mudar.mutateAsync(
        nova === "cancelada"
          ? { id: fatura.id, situacao: nova, cancelamento_motivo: motivo.trim() }
          : { id: fatura.id, situacao: nova, ...dados },
      );
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Situação da fatura {fatura.numero}</DialogTitle>
          <DialogDescription>Hoje: {rotuloSituacaoFatura(fatura.situacao)}. O FIPLAN é o oficial; aqui fica o registro.</DialogDescription>
        </DialogHeader>
        {opcoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Fatura cancelada não muda: lance uma nova.</p>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={nova} onValueChange={(v) => { setNova(v as SituacaoFatura); setTentou(false); }} className="space-y-2">
              {opcoes.map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <RadioGroupItem value={o} id={`fsit-${o}`} />
                  <Label htmlFor={`fsit-${o}`} className="font-normal">
                    {rotuloSituacaoFatura(o)}
                    {ORDEM.indexOf(o) >= 0 && ORDEM.indexOf(o) < ORDEM.indexOf(fatura.situacao as SituacaoFatura) && " (voltar)"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {nova && nova !== "cancelada" && pede.atesto && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fsit-atesto-data">Data do atesto</Label>
                  <Input id="fsit-atesto-data" type="date" value={atestoData} onChange={(e) => setAtestoData(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fsit-atesto-doc">Nº do documento SEI do atesto</Label>
                  <Input id="fsit-atesto-doc" value={atestoDoc} onChange={(e) => setAtestoDoc(e.target.value)} inputMode="numeric" maxLength={60} />
                </div>
              </div>
            )}
            {nova && nova !== "cancelada" && pede.liquidacao && (
              <div className="space-y-2 sm:w-1/2 sm:pr-2">
                <Label htmlFor="fsit-liq">Data da liquidação</Label>
                <Input id="fsit-liq" type="date" value={liquidacao} onChange={(e) => setLiquidacao(e.target.value)} />
              </div>
            )}
            {nova === "paga" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fsit-pag">Data do pagamento</Label>
                  <Input id="fsit-pag" type="date" value={pagamento} onChange={(e) => setPagamento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fsit-ob">Nº da OB</Label>
                  <Input id="fsit-ob" value={ob} onChange={(e) => setOb(e.target.value)} maxLength={40} />
                </div>
              </div>
            )}
            {nova === "cancelada" && (
              <div className="space-y-2">
                <Label htmlFor="fsit-motivo">Motivo do cancelamento</Label>
                <Textarea id="fsit-motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} />
                <p className="text-sm text-muted-foreground">Os bilhetes da nota voltam para "a faturar".</p>
              </div>
            )}
            {tentou && falta.map((f) => <p key={f} className="text-sm font-medium text-destructive" role="alert">{f}</p>)}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          {opcoes.length > 0 && <Button onClick={gravar} disabled={mudar.isPending || !nova}>Salvar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
