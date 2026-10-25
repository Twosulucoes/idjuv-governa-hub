/**
 * Aba "Prestação de contas" da ficha do pedido (entrega 2): por passageiro, o retorno, o vencimento, o cartão de
 * embarque e o relatório (modo individual; para servidor, conta o relatório apresentado no RH), a dispensa com motivo
 * e os anexos no bucket privado. No modo evento, o relatório único e o responsável da delegação ficam no topo.
 * Regras de prazo em src/lib/passagens/prestacao.ts. Quem só vê baixa os anexos, mas não recebe botões.
 */

import { useRef, useState } from "react";
import { FileText, Paperclip, Trash2, UserX } from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/formatters";
import {
  PRAZO_PADRAO_DIAS,
  pendenciasDoPassageiro,
  pendenciasDoPedido,
  retornoDoPassageiro,
  somarDias,
  type Pendencia,
} from "@/lib/passagens/prestacao";
import {
  abrirAnexo,
  TIPOS_ARQUIVO_ANEXO,
  useAnexosPedido,
  useEnviarAnexo,
  usePrazoPrestacao,
  useRelatorioRh,
  useRemoverAnexo,
  useSalvarPrestacaoPassageiro,
  useSalvarPrestacaoPedido,
} from "@/hooks/usePassagens";
import { rotuloAnexo, rotuloPrestacao, type PassagemAnexo, type PassageiroComTrechos, type PedidoCompleto } from "@/types/passagens";
import { DispensaDialog } from "./DispensaDialog";
import { EntregaDialog, type Entrega } from "./EntregaDialog";

interface Props {
  pedido: PedidoCompleto;
  podeEditar: boolean;
}

const SEM_RESPONSAVEL = "__nenhum__";
const hoje = () => new Date().toLocaleDateString("sv-SE");

type EntregaAberta = {
  titulo: string;
  descricao?: string;
  comSei: boolean;
  inicial: Entrega;
  salvar: (e: Entrega) => Promise<unknown>;
} | null;

function Situacao({ entregueEm, extra, pendencia, vencimento }: { entregueEm: string | null; extra?: string; pendencia?: Pendencia; vencimento: string | null }) {
  if (entregueEm) return <StatusBadge tom="sucesso">Entregue em {formatDateBR(entregueEm)}{extra ? ` · ${extra}` : ""}</StatusBadge>;
  if (pendencia?.diasAtraso) {
    return <StatusBadge tom="erro">Atrasado {pendencia.diasAtraso} {pendencia.diasAtraso === 1 ? "dia" : "dias"}</StatusBadge>;
  }
  if (pendencia) return <StatusBadge tom="pendente">Pendente · até {formatDateBR(pendencia.vencimento)}</StatusBadge>;
  return <StatusBadge tom="neutro" icone={false}>{vencimento ? `Depois da volta · até ${formatDateBR(vencimento)}` : "Sem bilhete emitido"}</StatusBadge>;
}

export function PrestacaoTab({ pedido, podeEditar }: Props) {
  const { toast } = useToast();
  const edita = podeEditar && pedido.situacao === "emitido";
  const prazo = usePrazoPrestacao();
  const comViagem = pedido.passageiros.filter((p) => p.servidor_id && p.viagem_id).map((p) => p.id);
  const rh = useRelatorioRh(comViagem);
  const anexos = useAnexosPedido(pedido.id);
  const salvarPassageiro = useSalvarPrestacaoPassageiro(pedido.id);
  const salvarPedido = useSalvarPrestacaoPedido(pedido.id);
  const enviar = useEnviarAnexo(pedido.id);
  const remover = useRemoverAnexo(pedido.id);
  const [entrega, setEntrega] = useState<EntregaAberta>(null);
  const [dispensa, setDispensa] = useState<PassageiroComTrechos | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const destinoAnexo = useRef<{ tipo: PassagemAnexo["tipo"]; passageiroId: string | null } | null>(null);

  if (prazo.isLoading) return <Skeleton className="h-48" />;
  const prazoDias = prazo.data ?? PRAZO_PADRAO_DIAS;
  const ctx = { prazoDias, hoje: hoje(), relatorioRh: rh.data ?? {} };
  const pendentes = pendenciasDoPedido(pedido, ctx);
  const modo = pedido.prestacao_contas;

  const anexar = (tipo: PassagemAnexo["tipo"], passageiroId: string | null) => {
    destinoAnexo.current = { tipo, passageiroId };
    arquivo.current?.click();
  };
  const aoEscolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f && destinoAnexo.current) enviar.mutate({ arquivo: f, ...destinoAnexo.current });
  };
  const abrir = (caminho: string) =>
    abrirAnexo(caminho).catch((e: Error) => toast({ title: "Não foi possível abrir", description: e.message, variant: "destructive" }));

  const listaAnexos = (passageiroId: string | null) => {
    const lista = (anexos.data ?? []).filter((a) => a.passageiro_id === passageiroId);
    if (!lista.length) return null;
    return (
      <ul className="space-y-1 border-t pt-3">
        {lista.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
            <button type="button" className="flex min-w-0 items-center gap-2 text-left underline-offset-4 hover:underline" onClick={() => abrir(a.caminho)}>
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{a.nome_arquivo}</span>
              <span className="shrink-0 text-muted-foreground">· {rotuloAnexo(a.tipo)}</span>
            </button>
            {edita && (
              <Button variant="ghost" size="icon" aria-label={`Remover ${a.nome_arquivo}`} disabled={remover.isPending} onClick={() => remover.mutate(a)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const linha = (rotulo: string, situacao: React.ReactNode, acoes: React.ReactNode) => (
    <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{rotulo}</span>
        {situacao}
      </div>
      {edita && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );

  const botoes = (aoRegistrar: () => void, tipo: PassagemAnexo["tipo"], passageiroId: string | null, entregue: boolean) => (
    <>
      <Button size="sm" variant="outline" onClick={aoRegistrar}>{entregue ? "Alterar entrega" : "Registrar entrega"}</Button>
      <Button size="sm" variant="ghost" disabled={enviar.isPending} onClick={() => anexar(tipo, passageiroId)}>
        <Paperclip className="h-4 w-4" aria-hidden="true" />
        Anexar
      </Button>
    </>
  );

  const retornos = pedido.passageiros.filter((p) => !p.prestacao_dispensada).map((p) => retornoDoPassageiro(p.trechos)).filter(Boolean).sort() as string[];
  const ultimoRetorno = retornos.at(-1) ?? null;
  const pendEvento = pendentes.find((x) => x.tipo === "relatorio_evento");

  return (
    <div className="space-y-4">
      <input ref={arquivo} type="file" className="hidden" accept={TIPOS_ARQUIVO_ANEXO.join(",")} onChange={aoEscolherArquivo} aria-hidden="true" tabIndex={-1} />
      <Card>
        <CardContent className="space-y-1 pt-6 text-sm">
          <p>
            <span className="font-medium">{rotuloPrestacao(modo)}</span>
            {modo === "dispensado" && pedido.prestacao_dispensa_motivo && <span className="text-muted-foreground"> · {pedido.prestacao_dispensa_motivo}</span>}
          </p>
          <p className="text-muted-foreground">
            Prazo: {prazoDias} {prazoDias === 1 ? "dia corrido" : "dias corridos"} depois do último voo de cada passageiro.
            {pendentes.length > 0 ? ` ${pendentes.length} ${pendentes.length === 1 ? "item pendente" : "itens pendentes"}.` : " Nada pendente até hoje."}
          </p>
          {pedido.situacao !== "emitido" && pedido.situacao !== "concluido" && (
            <p className="text-muted-foreground">A prestação de contas começa quando o pedido estiver emitido.</p>
          )}
          {modo === "dispensado" && <p className="text-muted-foreground">Sem relatório; o cartão de embarque continua sendo pedido.</p>}
        </CardContent>
      </Card>

      {modo === "evento" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Relatório do evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="prest-responsavel">Responsável da delegação</Label>
              {edita ? (
                <Select
                  value={pedido.responsavel_passageiro_id ?? SEM_RESPONSAVEL}
                  onValueChange={(v) => salvarPedido.mutate({ responsavel_passageiro_id: v === SEM_RESPONSAVEL ? null : v })}
                >
                  <SelectTrigger id="prest-responsavel" className="sm:max-w-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_RESPONSAVEL}>Não indicado</SelectItem>
                    {pedido.passageiros.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome ?? "—"}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p id="prest-responsavel" className="text-sm">{pedido.passageiros.find((p) => p.id === pedido.responsavel_passageiro_id)?.nome ?? "Não indicado"}</p>
              )}
            </div>
            {linha(
              "Relatório",
              <Situacao
                entregueEm={pedido.relatorio_evento_entregue_em}
                extra={pedido.relatorio_evento_documento_sei ? `SEI ${pedido.relatorio_evento_documento_sei}` : undefined}
                pendencia={pendEvento}
                vencimento={ultimoRetorno ? somarDias(ultimoRetorno, prazoDias) : null}
              />,
              botoes(
                () => setEntrega({
                  titulo: "Relatório do evento",
                  descricao: "Um relatório para o grupo todo, entregue pelo responsável.",
                  comSei: true,
                  inicial: { data: pedido.relatorio_evento_entregue_em, documentoSei: pedido.relatorio_evento_documento_sei },
                  salvar: (e) => salvarPedido.mutateAsync({ relatorio_evento_entregue_em: e.data, relatorio_evento_documento_sei: e.documentoSei }),
                }),
                "relatorio",
                null,
                !!pedido.relatorio_evento_entregue_em,
              ),
            )}
            {listaAnexos(null)}
          </CardContent>
        </Card>
      )}

      {pedido.passageiros.map((p) => {
        const retorno = retornoDoPassageiro(p.trechos);
        const vencimento = retorno ? somarDias(retorno, prazoDias) : null;
        const lista = pendenciasDoPassageiro(modo, p, { ...ctx, relatorioRh: !!ctx.relatorioRh[p.id] });
        const relatorioRh = !!ctx.relatorioRh[p.id];
        return (
          <Card key={p.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">{p.nome ?? "—"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {retorno ? `Volta em ${formatDateBR(retorno)} · entrega até ${formatDateBR(vencimento)}` : "Sem bilhete emitido"}
                </p>
              </div>
              {edita && (
                <Button size="sm" variant="ghost" onClick={() => setDispensa(p)}>
                  <UserX className="h-4 w-4" aria-hidden="true" />
                  {p.prestacao_dispensada ? "Dispensa" : "Dispensar"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="divide-y">
              {p.prestacao_dispensada ? (
                <p className="py-2 text-sm">
                  <StatusBadge tom="neutro" icone={false}>Dispensado</StatusBadge>
                  <span className="ml-2 text-muted-foreground">{p.prestacao_dispensa_motivo}</span>
                </p>
              ) : (
                <>
                  {linha(
                    "Cartão de embarque",
                    <Situacao entregueEm={p.embarque_entregue_em} pendencia={lista.find((x) => x.tipo === "embarque")} vencimento={vencimento} />,
                    botoes(
                      () => setEntrega({
                        titulo: "Cartão de embarque",
                        descricao: p.nome ?? undefined,
                        comSei: false,
                        inicial: { data: p.embarque_entregue_em, documentoSei: null },
                        salvar: (e) => salvarPassageiro.mutateAsync({ id: p.id, embarque_entregue_em: e.data }),
                      }),
                      "cartao_embarque",
                      p.id,
                      !!p.embarque_entregue_em,
                    ),
                  )}
                  {modo === "individual" && linha(
                    "Relatório de viagem",
                    relatorioRh && !p.relatorio_entregue_em
                      ? <StatusBadge tom="sucesso">Apresentado no RH</StatusBadge>
                      : (
                        <Situacao
                          entregueEm={p.relatorio_entregue_em}
                          extra={p.relatorio_documento_sei ? `SEI ${p.relatorio_documento_sei}` : undefined}
                          pendencia={lista.find((x) => x.tipo === "relatorio")}
                          vencimento={vencimento}
                        />
                      ),
                    botoes(
                      () => setEntrega({
                        titulo: "Relatório de viagem",
                        descricao: p.nome ?? undefined,
                        comSei: true,
                        inicial: { data: p.relatorio_entregue_em, documentoSei: p.relatorio_documento_sei },
                        salvar: (e) => salvarPassageiro.mutateAsync({ id: p.id, relatorio_entregue_em: e.data, relatorio_documento_sei: e.documentoSei }),
                      }),
                      "relatorio",
                      p.id,
                      !!p.relatorio_entregue_em,
                    ),
                  )}
                </>
              )}
              {listaAnexos(p.id)}
            </CardContent>
          </Card>
        );
      })}

      <EntregaDialog
        open={!!entrega}
        onOpenChange={(o) => !o && setEntrega(null)}
        titulo={entrega?.titulo ?? ""}
        descricao={entrega?.descricao}
        comSei={entrega?.comSei}
        inicial={entrega?.inicial ?? { data: null, documentoSei: null }}
        salvando={salvarPassageiro.isPending || salvarPedido.isPending}
        onSalvar={(e) => entrega!.salvar(e)}
      />
      <DispensaDialog
        open={!!dispensa}
        onOpenChange={(o) => !o && setDispensa(null)}
        nome={dispensa?.nome ?? ""}
        dispensado={!!dispensa?.prestacao_dispensada}
        motivoAtual={dispensa?.prestacao_dispensa_motivo ?? null}
        salvando={salvarPassageiro.isPending}
        onSalvar={(dispensar, motivo) =>
          salvarPassageiro.mutateAsync({ id: dispensa!.id, prestacao_dispensada: dispensar, prestacao_dispensa_motivo: motivo })}
      />
    </div>
  );
}
