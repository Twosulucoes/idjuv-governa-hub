import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserMinus, AlertTriangle } from "lucide-react";
import { useExonerarServidor, type ServidorGestao } from "@/hooks/useGestaoLotacao";
import { MOTIVOS_DESLIGAMENTO, type MotivoDesligamento } from "@/lib/rhRpc";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  servidor: ServidorGestao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExonerarServidorModal({ servidor, open, onOpenChange }: Props) {
  const exonerarServidor = useExonerarServidor();

  const [dataExoneracao, setDataExoneracao] = useState(format(new Date(), "yyyy-MM-dd"));
  const [motivo, setMotivo] = useState<MotivoDesligamento>("exoneracao_oficio");
  const [atoTipo, setAtoTipo] = useState("portaria");
  const [atoNumero, setAtoNumero] = useState("");
  const [atoData, setAtoData] = useState("");
  const [doeNumero, setDoeNumero] = useState("");
  const [dataPublicacaoDoe, setDataPublicacaoDoe] = useState("");
  const [observacao, setObservacao] = useState("");

  const resetForm = () => {
    setDataExoneracao(format(new Date(), "yyyy-MM-dd"));
    setMotivo("exoneracao_oficio");
    setAtoTipo("portaria");
    setAtoNumero("");
    setAtoData("");
    setDoeNumero("");
    setDataPublicacaoDoe("");
    setObservacao("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servidor || !dataExoneracao) return;

    await exonerarServidor.mutateAsync({
      servidorId: servidor.id,
      data: dataExoneracao,
      motivo,
      atoTipo: atoTipo || undefined,
      atoNumero: atoNumero.trim() || undefined,
      atoData: atoData || undefined,
      atoDoeNumero: doeNumero.trim() || undefined,
      atoDoeData: dataPublicacaoDoe || undefined,
      observacao: observacao.trim() || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  if (!servidor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <UserMinus className="h-5 w-5" />
            Exonerar Servidor
          </DialogTitle>
          <DialogDescription>
            Encerrar lotação de <strong>{servidor.nome_completo}</strong>
            {servidor.matricula && ` (Matrícula: ${servidor.matricula})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alerta de consequências */}
          <Alert variant="destructive" className="bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação desliga o servidor: encerra lotação, vínculos, provimento,
              cessões, designações, férias e licenças em aberto, viagens ainda não iniciadas, chefia de unidade e
              comissões; registra no histórico funcional e gera a minuta da portaria. Bloqueia o acesso ao sistema.
            </AlertDescription>
          </Alert>

          {/* Informações atuais */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Cargo atual:</span>{" "}
              <strong>{servidor.cargo_nome || "—"}</strong>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Unidade:</span>{" "}
              <strong>{servidor.unidade_sigla || servidor.unidade_nome || "—"}</strong>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Lotado desde:</span>{" "}
              <strong>
                {servidor.lotacao_inicio 
                  ? format(new Date(servidor.lotacao_inicio), "dd/MM/yyyy")
                  : "—"}
              </strong>
            </p>
          </div>

          {/* Motivo do desligamento */}
          <div className="space-y-2">
            <Label>Motivo do desligamento *</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoDesligamento)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_DESLIGAMENTO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de Exoneração */}
          <div className="space-y-2">
            <Label>Data da Exoneração *</Label>
            <Input
              type="date"
              value={dataExoneracao}
              onChange={(e) => setDataExoneracao(e.target.value)}
              required
            />
          </div>

          {/* Ato que fundamenta o desligamento */}
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
              <Input
                value={atoNumero}
                onChange={(e) => setAtoNumero(e.target.value)}
                placeholder="Ex: 123/2026"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do ato</Label>
              <Input type="date" value={atoData} onChange={(e) => setAtoData(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº do DOE</Label>
              <Input
                value={doeNumero}
                onChange={(e) => setDoeNumero(e.target.value)}
                placeholder="Ex: 12345"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Publicação DOE</Label>
              <Input
                type="date"
                value={dataPublicacaoDoe}
                onChange={(e) => setDataPublicacaoDoe(e.target.value)}
              />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label>Motivo / Observação</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da exoneração..."
              rows={2}
              maxLength={1000}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!dataExoneracao || exonerarServidor.isPending}
            >
              {exonerarServidor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Exoneração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
