import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useTransferirServidor, useUnidadesCompativeisCargo, type ServidorGestao } from "@/hooks/useGestaoLotacao";
import { MOTIVOS_TRANSFERENCIA, type MotivoTransferencia } from "@/lib/rhRpc";

interface Props {
  servidor: ServidorGestao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Muda o servidor de unidade mantendo cargo, provimento e carreira (sem exonerar e lotar de novo). */
export function TransferirServidorModal({ servidor, open, onOpenChange }: Props) {
  const transferir = useTransferirServidor();
  const { data: unidades = [] } = useUnidadesCompativeisCargo(servidor?.cargo_id ?? null);

  const [unidadeId, setUnidadeId] = useState("");
  const [motivo, setMotivo] = useState<MotivoTransferencia>("transferencia");
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [atoTipo, setAtoTipo] = useState("portaria");
  const [atoNumero, setAtoNumero] = useState("");
  const [atoData, setAtoData] = useState("");
  const [doeNumero, setDoeNumero] = useState("");
  const [doeData, setDoeData] = useState("");
  const [observacao, setObservacao] = useState("");

  const destinos = unidades.filter((u: { id: string }) => u.id !== servidor?.unidade_id);

  const limpar = () => {
    setUnidadeId("");
    setMotivo("transferencia");
    setData(format(new Date(), "yyyy-MM-dd"));
    setAtoTipo("portaria");
    setAtoNumero("");
    setAtoData("");
    setDoeNumero("");
    setDoeData("");
    setObservacao("");
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servidor || !unidadeId || !data) return;
    await transferir.mutateAsync({
      servidorId: servidor.id,
      unidadeId,
      data,
      motivo,
      atoTipo: atoTipo || undefined,
      atoNumero: atoNumero.trim() || undefined,
      atoData: atoData || undefined,
      atoDoeNumero: doeNumero.trim() || undefined,
      atoDoeData: doeData || undefined,
      observacao: observacao.trim() || undefined,
    });
    limpar();
    onOpenChange(false);
  };

  if (!servidor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferir de unidade
          </DialogTitle>
          <DialogDescription>
            <strong>{servidor.nome_completo}</strong>
            {servidor.matricula && ` (Matrícula: ${servidor.matricula})`} — hoje em{" "}
            <strong>{servidor.unidade_sigla || servidor.unidade_nome || "—"}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <Alert>
            <AlertDescription>
              O cargo e o provimento continuam os mesmos: muda a unidade. A lotação atual é encerrada na véspera, a nova
              começa na data informada, e o ato fica no histórico funcional com a minuta de portaria e o protocolo.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Unidade de destino *</Label>
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {destinos.map((u: { id: string; nome: string; sigla?: string | null }) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.sigla ? `${u.sigla} — ${u.nome}` : u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {destinos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma outra unidade prevista para o cargo.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoTransferencia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_TRANSFERENCIA.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de efeito *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo do ato</Label>
              <Select value={atoTipo} onValueChange={setAtoTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="decreto">Decreto</SelectItem>
                  <SelectItem value="ato">Ato</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nº do ato</Label>
              <Input value={atoNumero} onChange={(e) => setAtoNumero(e.target.value)} placeholder="Ex: 123/2026" maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label>Data do ato</Label>
              <Input type="date" value={atoData} onChange={(e) => setAtoData(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº do DOE</Label>
              <Input value={doeNumero} onChange={(e) => setDoeNumero(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label>Data de publicação DOE</Label>
              <Input type="date" value={doeData} onChange={(e) => setDoeData(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo / observação</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} maxLength={1000} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!unidadeId || !data || transferir.isPending}>
              {transferir.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar transferência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
