/**
 * Diálogos dos prazos do processo (P3, migração 20261128090000): lançar um prazo (tipo, descrição, data, responsável
 * e avisos), remarcar (data nova e motivo), cancelar (motivo) e mudar os avisos. O prazo da próxima ação não se lança
 * aqui: nasce da movimentação, e remarcá-lo é corrigir o prazo dela na aba Andamento. O banco confere as mesmas regras.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ServidorBusca } from "@/components/contratos/passagens/ServidorBusca";
import { useBuscarServidoresProcesso } from "@/hooks/useProcessosContratacao";
import { useTiposPrazo, type AcaoPrazo, type NovoPrazo, type ProcessoPrazo } from "@/hooks/useProcessoPrazos";
import { lerAvisos, rotuloTipoPrazo, textoAvisos, TIPOS_PRAZO_MANUAIS } from "@/lib/compras/prazos";
import { hojeLocal } from "@/lib/compras/proximaAcao";
import { formatDateBR } from "@/lib/formatters";

const MOTIVO_MINIMO = 3;

function CampoAvisos({ id, valor, aoMudar }: { id: string; valor: string; aoMudar: (v: string) => void }) {
  const invalido = lerAvisos(valor) === null;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Avisar quantos dias antes</Label>
      <Input id={id} inputMode="numeric" placeholder="Ex.: 15, 7, 3" value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={invalido} aria-describedby={`${id}-ajuda`} />
      <p id={`${id}-ajuda`} className={invalido ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {invalido ? "Use números de 1 a 365, separados por vírgula." : "O aviso de 1 dia antes sempre fica."}
      </p>
    </div>
  );
}

interface NovoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: string;
  salvando: boolean;
  onSalvar: (p: NovoPrazo) => Promise<unknown>;
}

export function NovoPrazoDialog({ open, onOpenChange, processoId, salvando, onSalvar }: NovoProps) {
  const tipos = useTiposPrazo();
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [modo, setModo] = useState<"servidor" | "setor">("setor");
  const [servidor, setServidor] = useState<{ id: string; nome: string } | null>(null);
  const [setor, setSetor] = useState("");
  const [avisos, setAvisos] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTipo(""); setDescricao(""); setData(""); setModo("setor"); setServidor(null); setSetor(""); setAvisos(""); setErro(null);
  }, [open]);

  const escolherTipo = (t: string) => {
    setTipo(t);
    const padrao = tipos.data?.find((x) => x.tipo === t)?.avisos_padrao;
    if (padrao) setAvisos(textoAvisos(padrao));
  };

  const gravar = async () => {
    const dias = lerAvisos(avisos);
    const falta = !tipo ? "Escolha o tipo do prazo."
      : !data ? "Informe a data do prazo."
      : data < hojeLocal() ? "A data do prazo não pode ficar no passado."
      : modo === "servidor" ? (!servidor ? "Escolha o servidor responsável." : null)
      : !setor.trim() ? "Informe o setor responsável." : null;
    if (falta || !dias) {
      setErro(falta ?? "Use números de 1 a 365 nos avisos.");
      return;
    }
    try {
      await onSalvar({
        processo_id: processoId, tipo, descricao: descricao.trim() || null, data_limite: data,
        responsavel_servidor_id: modo === "servidor" ? servidor!.id : null,
        responsavel_setor: modo === "setor" ? setor.trim() : null,
        avisos_dias: dias,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo prazo</DialogTitle>
          <DialogDescription>
            Para prazos fora da próxima ação: resposta de órgão externo, assinatura, vigência, empenho, pagamento e
            outros. O responsável é avisado nos dias escolhidos e quando vencer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prazo-tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={escolherTipo}>
              <SelectTrigger id="prazo-tipo"><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>
                {TIPOS_PRAZO_MANUAIS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prazo-descricao">Descrição</Label>
            <Input id="prazo-descricao" maxLength={300} placeholder="Ex.: resposta da SEFAZ ao ofício" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prazo-data">Data do prazo *</Label>
            <Input id="prazo-data" type="date" min={hojeLocal()} value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Responsável *</Label>
            <RadioGroup value={modo} onValueChange={(v) => setModo(v as "servidor" | "setor")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="servidor" id="prazo-resp-servidor" />
                <Label htmlFor="prazo-resp-servidor" className="font-normal">Servidor</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="setor" id="prazo-resp-setor" />
                <Label htmlFor="prazo-resp-setor" className="font-normal">Setor</Label>
              </div>
            </RadioGroup>
            {modo === "servidor" ? (
              <ServidorBusca id="prazo-servidor" escolhido={servidor} aoEscolher={(s) => setServidor(s ? { id: s.id, nome: s.nome } : null)} useBusca={useBuscarServidoresProcesso} />
            ) : (
              <Input aria-label="Setor responsável" placeholder="IDJUV/PRESI/DIRAF" maxLength={200} value={setor} onChange={(e) => setSetor(e.target.value)} />
            )}
          </div>
          <CampoAvisos id="prazo-avisos" valor={avisos} aoMudar={setAvisos} />
          {erro && <p role="alert" className="text-sm font-medium text-destructive">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={gravar} disabled={salvando}>Lançar prazo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ModoAcao = "remarcar" | "cancelar" | "avisos";

interface AcaoProps {
  prazo: ProcessoPrazo | null;
  modo: ModoAcao;
  onOpenChange: (open: boolean) => void;
  salvando: boolean;
  onSalvar: (a: AcaoPrazo) => Promise<unknown>;
}

const TITULO: Record<ModoAcao, string> = { remarcar: "Remarcar prazo", cancelar: "Cancelar prazo", avisos: "Avisos do prazo" };

export function AcaoPrazoDialog({ prazo, modo, onOpenChange, salvando, onSalvar }: AcaoProps) {
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [avisos, setAvisos] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!prazo) return;
    setData(""); setMotivo(""); setAvisos(textoAvisos(prazo.avisos_dias)); setErro(null);
  }, [prazo, modo]);

  const gravar = async () => {
    let acao: AcaoPrazo;
    if (modo === "avisos") {
      const dias = lerAvisos(avisos);
      if (!dias) return setErro("Use números de 1 a 365 nos avisos.");
      acao = { acao: "avisos", avisos_dias: dias };
    } else if (motivo.trim().length < MOTIVO_MINIMO) {
      return setErro("Informe o motivo (pelo menos 3 caracteres).");
    } else if (modo === "remarcar") {
      if (!data) return setErro("Informe a nova data.");
      if (data < hojeLocal()) return setErro("A nova data não pode ficar no passado.");
      acao = { acao: "remarcar", data_limite: data, motivo: motivo.trim() };
    } else {
      acao = { acao: "cancelar", motivo: motivo.trim() };
    }
    try {
      await onSalvar(acao);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={!!prazo} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TITULO[modo]}</DialogTitle>
          {prazo && (
            <DialogDescription>
              {rotuloTipoPrazo(prazo.tipo)}{prazo.descricao ? ` · ${prazo.descricao}` : ""} · até {formatDateBR(prazo.data_limite)}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          {modo === "remarcar" && (
            <div className="space-y-2">
              <Label htmlFor="remarcar-data">Nova data *</Label>
              <Input id="remarcar-data" type="date" min={hojeLocal()} value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          )}
          {modo === "avisos" ? (
            <CampoAvisos id="acao-avisos" valor={avisos} aoMudar={setAvisos} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="acao-motivo">Motivo *</Label>
              <Textarea id="acao-motivo" rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder={modo === "remarcar" ? "Ex.: a SEFAZ pediu mais 10 dias" : "Ex.: o empenho foi dispensado"} />
              <p className="text-sm text-muted-foreground">Fica guardado no histórico do processo.</p>
            </div>
          )}
          {erro && <p role="alert" className="text-sm font-medium text-destructive">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button variant={modo === "cancelar" ? "destructive" : "default"} onClick={gravar} disabled={salvando}>
            {modo === "remarcar" ? "Remarcar" : modo === "cancelar" ? "Cancelar prazo" : "Salvar avisos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
