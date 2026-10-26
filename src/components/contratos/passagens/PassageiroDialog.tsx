/**
 * Inclusão de passageiro no pedido: servidor (busca no RH, com a viagem do RH opcional) ou beneficiário.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateBR } from "@/lib/formatters";
import { useSalvarPassageiro, useViagensServidor } from "@/hooks/usePassagens";
import { BeneficiarioBusca } from "./BeneficiarioBusca";
import { ServidorBusca } from "./ServidorBusca";

const SEM_VIAGEM = "sem_viagem";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  podeCadastrar: boolean;
}

export function PassageiroDialog({ open, onOpenChange, pedidoId, podeCadastrar }: Props) {
  const salvar = useSalvarPassageiro(pedidoId);
  const [tipo, setTipo] = useState<"beneficiario" | "servidor">("beneficiario");
  const [servidor, setServidor] = useState<{ id: string; nome: string } | null>(null);
  const [beneficiario, setBeneficiario] = useState<{ id: string; nome: string } | null>(null);
  const [viagem, setViagem] = useState(SEM_VIAGEM);
  const [erro, setErro] = useState<string | null>(null);
  const viagens = useViagensServidor(tipo === "servidor" ? servidor?.id : null);

  useEffect(() => {
    if (!open) return;
    setServidor(null);
    setBeneficiario(null);
    setViagem(SEM_VIAGEM);
    setErro(null);
  }, [open]);

  const salvarPassageiro = async () => {
    const escolhido = tipo === "servidor" ? servidor : beneficiario;
    if (!escolhido) {
      setErro(tipo === "servidor" ? "Escolha o servidor." : "Escolha a pessoa.");
      return;
    }
    try {
      await salvar.mutateAsync({
        pedido_id: pedidoId,
        servidor_id: tipo === "servidor" ? escolhido.id : null,
        beneficiario_id: tipo === "beneficiario" ? escolhido.id : null,
        viagem_id: tipo === "servidor" && viagem !== SEM_VIAGEM ? viagem : null,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incluir passageiro</DialogTitle>
          <DialogDescription>Servidor do quadro ou pessoa de fora (atleta, técnico, convidado).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={tipo} onValueChange={(v) => { setTipo(v as typeof tipo); setErro(null); }} className="flex gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="beneficiario" id="tipo-benef" />
              <Label htmlFor="tipo-benef">Pessoa de fora</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="servidor" id="tipo-serv" />
              <Label htmlFor="tipo-serv">Servidor</Label>
            </div>
          </RadioGroup>

          {tipo === "beneficiario" ? (
            <div className="space-y-2">
              <Label htmlFor="busca-benef">Pessoa</Label>
              <BeneficiarioBusca id="busca-benef" escolhido={beneficiario} aoEscolher={(b) => { setBeneficiario(b); setErro(null); }} podeCadastrar={podeCadastrar} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="busca-serv">Servidor</Label>
                <ServidorBusca id="busca-serv" escolhido={servidor} aoEscolher={(s) => { setServidor(s && { id: s.id, nome: s.nome }); setViagem(SEM_VIAGEM); setErro(null); }} />
              </div>
              {servidor && (
                <div className="space-y-2">
                  <Label htmlFor="viagem-rh">Viagem no RH (diárias e relatório)</Label>
                  <Select value={viagem} onValueChange={setViagem}>
                    <SelectTrigger id="viagem-rh"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_VIAGEM}>Sem viagem ligada</SelectItem>
                      {(viagens.data ?? []).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.destino} · {formatDateBR(v.data_saida)} a {formatDateBR(v.data_retorno)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {viagens.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma viagem deste servidor cadastrada no RH.</p>}
                </div>
              )}
            </>
          )}
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvarPassageiro} disabled={salvar.isPending}>Incluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
