/**
 * Aba Alterações da ficha (C2): o quadro do valor (inicial → acréscimos → supressões → reajustes → atual) e da
 * vigência, os avisos dos limites da Lei 14.133 e a linha do tempo dos aditivos, apostilamentos, suspensões e da
 * rescisão, cada um com o documento do SEI. O ato é do SEI; aqui só se registra. Registrar, corrigir, apagar e
 * registrar a retomada exigem contratos.editar (conferido também no banco, que recalcula o contrato).
 */

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FilePlus2, Pencil, PlayCircle, Repeat, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/design-system";
import { AlteracaoFormDialog } from "@/components/contratos/AlteracaoFormDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlteracoesContrato, useExcluirAlteracao, useRegistrarRetomada } from "@/hooks/useContratos";
import {
  avisosLimites,
  dataAlteracao,
  efeitosAlteracao,
  ordenarAlteracoes,
  resumoAlteracoes,
  tituloAlteracao,
} from "@/lib/contratos/alteracoes";
import { diasAte, hojeIso } from "@/lib/contratos/vigencia";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import type { ContratoAlteracao, ContratoFicha } from "@/types/contratos";

interface Props {
  contrato: ContratoFicha;
  podeEditar: boolean;
}

const sinal = (v: number) => (v < 0 ? `− ${formatCurrency(Math.abs(v))}` : `+ ${formatCurrency(v)}`);
const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className={forte ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>{rotulo}</dt>
      <dd className={forte ? "text-sm font-semibold tabular-nums" : "text-sm tabular-nums"}>{valor}</dd>
    </div>
  );
}

export function AlteracoesContratoTab({ contrato: c, podeEditar }: Props) {
  const consulta = useAlteracoesContrato(c.id);
  const excluir = useExcluirAlteracao();
  const [editando, setEditando] = useState<ContratoAlteracao | "nova" | null>(null);
  const [apagando, setApagando] = useState<ContratoAlteracao | null>(null);
  const [retomando, setRetomando] = useState<ContratoAlteracao | null>(null);

  const alteracoes = useMemo(() => consulta.data ?? [], [consulta.data]);
  const resumo = useMemo(() => resumoAlteracoes(c, alteracoes), [c, alteracoes]);
  const avisos = useMemo(() => avisosLimites(c, alteracoes, resumo), [c, alteracoes, resumo]);
  const linhaDoTempo = useMemo(() => ordenarAlteracoes(alteracoes), [alteracoes]);

  if (consulta.isLoading) return <Skeleton className="h-48" />;
  if (consulta.isError) {
    return <EmptyState titulo="Não foi possível carregar as alterações" acao={<Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button>} />;
  }

  const rascunho = c.status === "rascunho";
  const rescindido = !!resumo.rescisao;
  const podeRegistrar = podeEditar && !rascunho && !rescindido;
  const prorrogado = c.data_fim_atual && c.data_fim_atual !== c.data_fim;

  return (
    <div className="space-y-4">
      {avisos.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <ul className="space-y-1">
              {avisos.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {resumo.suspensaoAberta && (
        <Alert>
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Contrato suspenso desde {formatDateBR(resumo.suspensaoAberta.data_inicio)}. Quando o SEI registrar a retomada, registre aqui; depois, o
              apostilamento que prorroga o fim pelo tempo parado (art. 115, §5º).
            </span>
            {podeEditar && (
              <Button size="sm" variant="outline" className="self-start sm:self-auto" onClick={() => setRetomando(resumo.suspensaoAberta as ContratoAlteracao)}>
                Registrar retomada
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {resumo.rescisao && (
        <Alert>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Contrato rescindido: {efeitosAlteracao(resumo.rescisao).join(", ")}. Para registrar outra alteração, corrija ou apague a rescisão antes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valor</CardTitle>
          </CardHeader>
          <CardContent className="sm:pt-0">
            <dl className="divide-y divide-border">
              <Linha rotulo="Valor inicial" valor={formatCurrency(resumo.valorInicial)} />
              {resumo.acrescimos > 0 && (
                <Linha rotulo={`Acréscimos (${pct(resumo.percentualAcrescimo)}; limite ${resumo.limitePercentual}%)`} valor={sinal(resumo.acrescimos)} />
              )}
              {resumo.supressoes > 0 && (
                <Linha rotulo={`Supressões (${pct(resumo.percentualSupressao)}; limite 25%)`} valor={sinal(-resumo.supressoes)} />
              )}
              {resumo.reajustes !== 0 && <Linha rotulo="Reajustes e repactuações" valor={sinal(resumo.reajustes)} />}
              {resumo.anterior !== 0 && <Linha rotulo="Situação anterior ao sistema" valor={sinal(resumo.anterior)} />}
              <Linha rotulo="Valor atual" valor={formatCurrency(Number(c.valor_atual))} forte />
            </dl>
            <p className="mt-2 text-sm text-muted-foreground">
              Os percentuais são sobre o valor inicial atualizado pelos reajustes{c.reforma ? " (reforma: limite de acréscimo de 50%)" : ""}.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vigência</CardTitle>
          </CardHeader>
          <CardContent className="sm:pt-0">
            <dl className="divide-y divide-border">
              <Linha rotulo="Vigência original" valor={`${formatDateBR(c.data_inicio)} a ${formatDateBR(c.data_fim)}`} />
              <Linha rotulo={rescindido ? "Fim (rescisão)" : prorrogado ? "Fim atual (prorrogado)" : "Fim atual"} valor={formatDateBR(c.data_fim_atual || c.data_fim)} forte />
              <Linha
                rotulo="Pode ir até"
                valor={!c.prorrogavel ? "não prorrogável" : resumo.limiteProrrogacao ? `${formatDateBR(resumo.limiteProrrogacao)} (${c.prazo_maximo_meses} meses)` : "sem prazo máximo cadastrado"}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Alterações registradas</CardTitle>
          {podeRegistrar && (
            <Button size="sm" onClick={() => setEditando("nova")}>
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Registrar alteração
            </Button>
          )}
        </CardHeader>
        <CardContent className="sm:pt-0">
          {linhaDoTempo.length === 0 ? (
            <EmptyState
              icone={Repeat}
              titulo="Nenhuma alteração"
              descricao={
                rascunho
                  ? "O contrato ainda é rascunho: as alterações se registram depois de assinado (situação vigente)."
                  : podeEditar
                    ? "Registre aqui cada termo aditivo, apostilamento, suspensão ou rescisão, com o documento do SEI."
                    : "O contrato não tem aditivo, apostilamento, suspensão nem rescisão registrados."
              }
            />
          ) : (
            <ol className="relative space-y-5 border-l border-border pl-6">
              {linhaDoTempo.map((a) => {
                const data = dataAlteracao(a);
                const efeitos = efeitosAlteracao(a);
                const sei = [
                  a.processo_sei && `Processo ${a.processo_sei}`,
                  a.documento_sei && `documento ${a.documento_sei}`,
                  a.data_publicacao_doe && `DOE ${formatDateBR(a.data_publicacao_doe)}${a.numero_doe ? ` nº ${a.numero_doe}` : ""}`,
                ].filter(Boolean).join(" · ");
                // com a rescisão, só ela se corrige (o banco recusa as outras)
                const podeCorrigir = podeEditar && (!rescindido || a.especie === "rescisao");
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[1.81rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">
                          {tituloAlteracao(a)}
                          {data && <span className="font-normal text-muted-foreground"> · {formatDateBR(data)}</span>}
                        </p>
                        {efeitos.length > 0 && <p className="text-sm">{efeitos.join(" · ")}</p>}
                        <p className="whitespace-pre-line text-sm text-muted-foreground">{a.descricao}</p>
                        {sei && <p className="text-sm text-muted-foreground">{sei}</p>}
                        {a.especie === "suspensao" && a.data_retomada && a.documento_retomada_sei && (
                          <p className="text-sm text-muted-foreground">Retomada: documento {a.documento_retomada_sei}</p>
                        )}
                      </div>
                      {podeEditar && (
                        <div className="flex shrink-0 gap-1 self-start">
                          {a.especie === "suspensao" && !a.data_retomada && (
                            <Button variant="outline" size="sm" onClick={() => setRetomando(a)}>
                              Retomada
                            </Button>
                          )}
                          {podeCorrigir && (
                            <Button variant="ghost" size="icon" aria-label={`Corrigir ${tituloAlteracao(a).toLowerCase()}`} onClick={() => setEditando(a)}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" aria-label={`Apagar ${tituloAlteracao(a).toLowerCase()}`} onClick={() => setApagando(a)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <AlteracaoFormDialog alteracao={editando} contrato={c} alteracoes={alteracoes} onClose={() => setEditando(null)} />
      <RetomadaDialog suspensao={retomando} onClose={() => setRetomando(null)} />
      <AlertDialog open={!!apagando} onOpenChange={(v) => !v && setApagando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar {apagando ? tituloAlteracao(apagando).toLowerCase() : "a alteração"}?</AlertDialogTitle>
            <AlertDialogDescription>
              O valor atual, o fim e a situação do contrato são recalculados sem ela. A exclusão fica no histórico. Apague só o que foi registrado por engano;
              o ato continua no SEI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluir.isPending}
              onClick={() => apagando && excluir.mutate({ id: apagando.id, contrato_id: c.id })}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RetomadaDialog({ suspensao, onClose }: { suspensao: ContratoAlteracao | null; onClose: () => void }) {
  const retomar = useRegistrarRetomada();
  const [data, setData] = useState("");
  const [documento, setDocumento] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!suspensao) return;
    setData(hojeIso());
    setDocumento("");
    setErro(null);
  }, [suspensao]);

  const inicio = suspensao?.data_inicio ?? "";
  const parados = data && inicio && data >= inicio ? diasAte(data, inicio) : null;

  const gravar = async () => {
    if (!suspensao) return;
    if (!data) return setErro("Informe a data da retomada.");
    if (data < inicio) return setErro("A retomada não pode ser antes do início da suspensão.");
    try {
      await retomar.mutateAsync({ id: suspensao.id, contrato_id: suspensao.contrato_id, data_retomada: data, documento_retomada_sei: documento.trim() || null });
      onClose();
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={!!suspensao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar retomada</DialogTitle>
          <DialogDescription>Suspensão desde {formatDateBR(inicio)}. O contrato volta a vigente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ret-data">Data da retomada *</Label>
            <Input id="ret-data" type="date" value={data} min={inicio} onChange={(e) => { setData(e.target.value); setErro(null); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ret-doc">Documento SEI da retomada</Label>
            <Input id="ret-doc" value={documento} maxLength={60} inputMode="numeric" onChange={(e) => setDocumento(e.target.value)} />
          </div>
          {parados !== null && (
            <p className="text-sm text-muted-foreground">
              {parados} {parados === 1 ? "dia" : "dias"} parado. Depois, registre o apostilamento "Prorrogação pelo tempo suspenso" com o novo fim.
            </p>
          )}
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
          <Button onClick={gravar} disabled={retomar.isPending}>Registrar retomada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
