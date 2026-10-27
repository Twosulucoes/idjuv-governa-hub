/**
 * Gestor e fiscais do contrato (contrato_responsaveis): quem está designado agora, com a portaria do SEI, e as
 * designações encerradas. A portaria é ato do SEI; aqui só se registra o número, o documento e as datas.
 * Designar e encerrar exigem contratos.criar ou contratos.editar (conferido também no banco).
 */

import { useEffect, useState } from "react";
import { AlertTriangle, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/design-system";
import { ServidorBusca } from "@/components/contratos/passagens/ServidorBusca";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useBuscarServidoresContrato,
  useDesignarResponsavel,
  useEncerrarDesignacao,
  useResponsaveisContrato,
} from "@/hooks/useContratos";
import { descricaoPortaria, ordenarPorPapel, periodoDesignacao } from "@/lib/contratos/responsaveis";
import { hojeIso } from "@/lib/contratos/vigencia";
import {
  PAPEIS_RESPONSAVEL,
  responsaveisAtivos,
  rotuloPapel,
  type ContratoResponsavel,
  type PapelResponsavel,
} from "@/types/contratos";

interface Props {
  contratoId: string;
  podeGravar: boolean;
  /** Avisa a falta de gestor ou fiscal (só faz sentido com o contrato em vigor). */
  avisarFalta: boolean;
}

export function ResponsaveisContratoTab({ contratoId, podeGravar, avisarFalta }: Props) {
  const lista = useResponsaveisContrato(contratoId);
  const [designando, setDesignando] = useState(false);
  const [encerrando, setEncerrando] = useState<ContratoResponsavel | null>(null);

  if (lista.isLoading) return <Skeleton className="h-48" />;
  if (lista.isError) {
    return <EmptyState titulo="Não foi possível carregar os responsáveis" acao={<Button variant="outline" onClick={() => lista.refetch()}>Tentar novamente</Button>} />;
  }

  const todos = lista.data ?? [];
  const { gestor, fiscaisTitulares, ativos } = responsaveisAtivos(todos);
  const encerrados = todos.filter((r) => r.data_fim);
  const faltando = avisarFalta ? ([!gestor && "gestor", !fiscaisTitulares.length && "fiscal"].filter(Boolean) as string[]) : [];

  return (
    <div className="space-y-4">
      {faltando.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Contrato sem {faltando.join(" nem ")} designado. A Lei 14.133/2021 (art. 117) pede fiscal designado para acompanhar a execução.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Em exercício</CardTitle>
          {podeGravar && (
            <Button size="sm" onClick={() => setDesignando(true)}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Designar
            </Button>
          )}
        </CardHeader>
        <CardContent className="sm:pt-0">
          {ativos.length === 0 ? (
            <EmptyState
              icone={UserCheck}
              titulo="Ninguém designado"
              descricao={podeGravar ? "Registre o gestor e os fiscais com o nº da portaria do SEI." : "Ainda não há gestor nem fiscais registrados."}
            />
          ) : (
            <ul className="divide-y divide-border">
              {ordenarPorPapel(ativos).map((r) => (
                <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {rotuloPapel(r.papel)} · {periodoDesignacao(r)}
                      {descricaoPortaria(r) && <span className="block">{descricaoPortaria(r)}</span>}
                    </p>
                  </div>
                  {podeGravar && (
                    <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => setEncerrando(r)}>
                      <UserMinus className="h-4 w-4" aria-hidden="true" />
                      Encerrar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {encerrados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Designações encerradas</CardTitle>
          </CardHeader>
          <CardContent className="sm:pt-0">
            <ul className="divide-y divide-border">
              {encerrados.map((r) => (
                <li key={r.id} className="py-3">
                  <p className="text-sm font-medium">{r.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {rotuloPapel(r.papel)} · {periodoDesignacao(r)}
                    {descricaoPortaria(r) && <span className="block">{descricaoPortaria(r)}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <DesignarDialog open={designando} onOpenChange={setDesignando} contratoId={contratoId} temGestor={!!gestor} />
      <EncerrarDialog designacao={encerrando} onClose={() => setEncerrando(null)} />
    </div>
  );
}

function DesignarDialog({ open, onOpenChange, contratoId, temGestor }: { open: boolean; onOpenChange: (v: boolean) => void; contratoId: string; temGestor: boolean }) {
  const designar = useDesignarResponsavel();
  const [servidor, setServidor] = useState<{ id: string; nome: string } | null>(null);
  const [papel, setPapel] = useState<PapelResponsavel>("gestor");
  const [portaria, setPortaria] = useState("");
  const [documentoSei, setDocumentoSei] = useState("");
  const [dataPortaria, setDataPortaria] = useState("");
  const [inicio, setInicio] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setServidor(null);
    setPapel(temGestor ? "fiscal_tecnico" : "gestor");
    setPortaria("");
    setDocumentoSei("");
    setDataPortaria("");
    setInicio(hojeIso());
    setObservacoes("");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [open]);

  const gravar = async () => {
    if (!servidor) return setErro("Escolha o servidor.");
    if (!inicio) return setErro("Informe o início da designação.");
    try {
      await designar.mutateAsync({
        contrato_id: contratoId,
        servidor_id: servidor.id,
        papel,
        portaria_numero: portaria.trim() || null,
        portaria_documento_sei: documentoSei.trim() || null,
        portaria_data: dataPortaria || null,
        data_inicio: inicio,
        observacoes: observacoes.trim() || null,
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
          <DialogTitle>Designar gestor ou fiscal</DialogTitle>
          <DialogDescription>Registre a designação feita por portaria no SEI.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resp-servidor">Servidor *</Label>
            <ServidorBusca id="resp-servidor" escolhido={servidor} aoEscolher={(s) => { setServidor(s ? { id: s.id, nome: s.nome } : null); setErro(null); }} useBusca={useBuscarServidoresContrato} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp-papel">Papel *</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as PapelResponsavel)}>
              <SelectTrigger id="resp-papel"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAPEIS_RESPONSAVEL.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {papel === "gestor" && temGestor && (
              <p className="text-sm text-muted-foreground">Já há gestor em exercício: encerre a designação dele antes.</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resp-portaria">Nº da portaria</Label>
              <Input id="resp-portaria" value={portaria} maxLength={60} placeholder="Ex.: Portaria 10/2026" onChange={(e) => setPortaria(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp-sei">Documento SEI da portaria</Label>
              <Input id="resp-sei" value={documentoSei} maxLength={60} inputMode="numeric" onChange={(e) => setDocumentoSei(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp-data-portaria">Data da portaria</Label>
              <Input id="resp-data-portaria" type="date" value={dataPortaria} onChange={(e) => setDataPortaria(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp-inicio">Início *</Label>
              <Input id="resp-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp-obs">Observações</Label>
            <Textarea id="resp-obs" rows={2} maxLength={2000} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button onClick={gravar} disabled={designar.isPending}>Designar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EncerrarDialog({ designacao, onClose }: { designacao: ContratoResponsavel | null; onClose: () => void }) {
  const encerrar = useEncerrarDesignacao();
  const [fim, setFim] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!designacao) return;
    setFim(hojeIso());
    setMotivo("");
    setErro(null);
  }, [designacao]);

  const gravar = async () => {
    if (!designacao) return;
    if (!fim) return setErro("Informe a data de fim.");
    if (fim < designacao.data_inicio) return setErro("O fim não pode ser antes do início da designação.");
    if (fim > hojeIso()) return setErro("Encerre no último dia de exercício, até hoje. Saída futura se registra no dia.");
    if (motivo.trim().length < 3) return setErro("Escreva o motivo (ex.: substituído pela Portaria 20/2026).");
    try {
      await encerrar.mutateAsync({ id: designacao.id, contrato_id: designacao.contrato_id, data_fim: fim, motivo_saida: motivo.trim() });
      onClose();
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={!!designacao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Encerrar designação</DialogTitle>
          <DialogDescription>
            {designacao ? `${designacao.nome} · ${rotuloPapel(designacao.papel)}` : ""}. Fica no histórico do contrato.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enc-fim">Último dia *</Label>
            <Input id="enc-fim" type="date" value={fim} max={hojeIso()} onChange={(e) => { setFim(e.target.value); setErro(null); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enc-motivo">Motivo *</Label>
            <Textarea id="enc-motivo" rows={2} maxLength={500} value={motivo} placeholder="Ex.: substituído pela Portaria 20/2026" onChange={(e) => { setMotivo(e.target.value); setErro(null); }} />
          </div>
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
          <Button onClick={gravar} disabled={encerrar.isPending}>Encerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
