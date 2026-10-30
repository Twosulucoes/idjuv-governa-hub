/**
 * Providência do vencimento (tela Vencimentos, C2): o que o NuAC decidiu (prorrogar, nova contratação ou encerrar), o
 * processo SEI aberto para isso e uma observação. O banco limpa a providência sozinho quando o fim atual vai para
 * depois (aditivo de prazo registrado). Exige contratos.editar (conferido também no banco).
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSalvarProvidencia } from "@/hooks/useContratos";
import { textoAcao, type LinhaVencimento } from "@/lib/contratos/vencimentos";
import { PROVIDENCIAS_RENOVACAO, type ProvidenciaRenovacao } from "@/types/contratos";

const NENHUMA = "nenhuma";

export function ProvidenciaRenovacaoDialog({ linha, onClose }: { linha: LinhaVencimento | null; onClose: () => void }) {
  const salvar = useSalvarProvidencia();
  const [providencia, setProvidencia] = useState<ProvidenciaRenovacao | typeof NENHUMA>(NENHUMA);
  const [processo, setProcesso] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!linha) return;
    const c = linha.contrato;
    setProvidencia((c.renovacao_providencia as ProvidenciaRenovacao | null) ?? (linha.acao === "prorrogar" ? "prorrogar" : NENHUMA));
    setProcesso(c.renovacao_processo_sei ?? "");
    setObservacao(c.renovacao_observacao ?? "");
  }, [linha]);

  const gravar = async () => {
    if (!linha) return;
    const nenhuma = providencia === NENHUMA;
    try {
      await salvar.mutateAsync({
        id: linha.contrato.id,
        renovacao_providencia: nenhuma ? null : providencia,
        renovacao_processo_sei: nenhuma ? null : processo.trim() || null,
        renovacao_observacao: nenhuma ? null : observacao.trim() || null,
      });
      onClose();
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const c = linha?.contrato;
  return (
    <Dialog open={!!linha} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Providência do vencimento</DialogTitle>
          <DialogDescription>
            {c ? `Contrato ${c.numero_contrato}/${c.ano}` : ""}. Ação esperada: {linha ? textoAcao(linha.acao).toLowerCase() : ""}. Quando o aditivo de
            prazo for registrado, a providência sai sozinha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prov-tipo">Providência</Label>
            <Select value={providencia} onValueChange={(v) => setProvidencia(v as ProvidenciaRenovacao | typeof NENHUMA)}>
              <SelectTrigger id="prov-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUMA}>Nenhuma ainda</SelectItem>
                {PROVIDENCIAS_RENOVACAO.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {providencia !== NENHUMA && (
            <>
              <div className="space-y-2">
                <Label htmlFor="prov-sei">Processo SEI aberto para isso</Label>
                <Input id="prov-sei" value={processo} maxLength={60} placeholder="00000.000000/0000.00" onChange={(e) => setProcesso(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prov-obs">Observação</Label>
                <Textarea id="prov-obs" rows={3} maxLength={1000} value={observacao} placeholder="Ex.: pesquisa de preços em andamento; parecer jurídico pedido em 10/11." onChange={(e) => setObservacao(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
