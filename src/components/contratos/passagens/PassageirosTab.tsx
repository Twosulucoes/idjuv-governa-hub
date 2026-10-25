/**
 * Aba "Passageiros e trechos" da ficha do pedido: cada passageiro com seus trechos, as cotações da agência e as
 * ações do bilhete (emitir, remarcar, cancelar, reembolsar). Quem só vê não recebe botões.
 */

import { useState } from "react";
import { Check, MoreHorizontal, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { EmptyState, StatusBadge, type TomStatus } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { formatarDataHora, valorTrecho } from "@/lib/passagens/regras";
import { useEscolherCotacao, useRemoverCotacao, useRemoverPassageiro, useRemoverTrecho } from "@/hooks/usePassagens";
import { rotuloSituacaoTrecho, type PassageiroComTrechos, type PedidoCompleto, type TrechoComCotacoes } from "@/types/passagens";
import { BilheteDialog, type AcaoBilhete } from "./BilheteDialog";
import { CotacaoDialog } from "./CotacaoDialog";
import { PassageiroDialog } from "./PassageiroDialog";
import { TrechoDialog } from "./TrechoDialog";

const TOM_TRECHO: Record<string, TomStatus> = {
  a_cotar: "pendente",
  cotado: "andamento",
  emitido: "sucesso",
  remarcado: "destaque",
  cancelado: "neutro",
  reembolsado: "neutro",
};

type Confirmacao = { titulo: string; texto: string; acao: () => void } | null;

interface Props {
  pedido: PedidoCompleto;
  podeEditar: boolean;
}

export function PassageirosTab({ pedido, podeEditar }: Props) {
  const encerrado = pedido.situacao === "cancelado" || pedido.situacao === "concluido";
  const edita = podeEditar && !encerrado;
  // a emissão vem depois da aprovação (spec §3): antes disso, só cotação
  const podeEmitir = pedido.situacao === "aprovado" || pedido.situacao === "emitido";
  const [novoPassageiro, setNovoPassageiro] = useState(false);
  const [trechoForm, setTrechoForm] = useState<{ passageiro: PassageiroComTrechos; trecho: TrechoComCotacoes | null } | null>(null);
  const [cotacaoDe, setCotacaoDe] = useState<TrechoComCotacoes | null>(null);
  const [bilhete, setBilhete] = useState<{ trecho: TrechoComCotacoes; acao: AcaoBilhete } | null>(null);
  const [confirmar, setConfirmar] = useState<Confirmacao>(null);
  const removerPassageiro = useRemoverPassageiro(pedido.id);
  const removerTrecho = useRemoverTrecho(pedido.id);
  const removerCotacao = useRemoverCotacao(pedido.id);
  const escolher = useEscolherCotacao(pedido.id);

  const botaoPassageiro = edita && (
    <Button onClick={() => setNovoPassageiro(true)}>
      <UserPlus className="h-4 w-4" aria-hidden="true" />
      Incluir passageiro
    </Button>
  );

  const acoesTrecho = (p: PassageiroComTrechos, t: TrechoComCotacoes) => {
    const emitido = !!t.localizador;
    const itens: { rotulo: string; aoClicar: () => void }[] = [];
    if (t.situacao === "a_cotar" || t.situacao === "cotado") {
      itens.push({ rotulo: "Registrar cotação", aoClicar: () => setCotacaoDe(t) });
      if (podeEmitir) itens.push({ rotulo: "Registrar emissão", aoClicar: () => setBilhete({ trecho: t, acao: "emitir" }) });
      itens.push({ rotulo: "Editar trecho", aoClicar: () => setTrechoForm({ passageiro: p, trecho: t }) });
    }
    if (t.situacao === "emitido" || t.situacao === "remarcado") {
      itens.push({ rotulo: "Remarcar", aoClicar: () => setBilhete({ trecho: t, acao: "remarcar" }) });
    }
    if (t.situacao !== "cancelado" && t.situacao !== "reembolsado") {
      itens.push({ rotulo: "Cancelar trecho", aoClicar: () => setBilhete({ trecho: t, acao: "cancelar" }) });
    }
    if (emitido && t.situacao !== "reembolsado") {
      itens.push({ rotulo: "Registrar reembolso", aoClicar: () => setBilhete({ trecho: t, acao: "reembolsar" }) });
    }
    if (!emitido) {
      itens.push({
        rotulo: "Apagar trecho",
        aoClicar: () => setConfirmar({ titulo: "Apagar trecho?", texto: `${t.origem} → ${t.destino} e as cotações dele saem do pedido.`, acao: () => removerTrecho.mutate(t.id) }),
      });
    }
    return itens;
  };

  if (!pedido.passageiros.length) {
    return (
      <>
        <EmptyState icone={Users} titulo="Nenhum passageiro" descricao="Inclua quem vai viajar: servidor ou pessoa de fora." acao={botaoPassageiro || undefined} />
        <PassageiroDialog open={novoPassageiro} onOpenChange={setNovoPassageiro} pedidoId={pedido.id} podeCadastrar={podeEditar} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {botaoPassageiro && <div className="flex justify-end">{botaoPassageiro}</div>}
      {pedido.passageiros.map((p) => {
        const total = p.trechos.reduce((s, t) => s + valorTrecho(t), 0);
        const podeRemover = edita && !p.trechos.some((t) => t.localizador);
        return (
          <Card key={p.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3 sm:pb-3">
              <div>
                <CardTitle className="text-base">{p.nome ?? "—"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {p.servidor_id ? "Servidor" : "Pessoa de fora"}
                  {p.viagem_id && " · ligado à viagem do RH"}
                  {" · "}
                  <span className="tabular-nums">{formatCurrency(total)}</span>
                </p>
              </div>
              {edita && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTrechoForm({ passageiro: p, trecho: null })}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Trecho
                  </Button>
                  {podeRemover && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover ${p.nome ?? "passageiro"}`}
                      onClick={() => setConfirmar({ titulo: "Remover passageiro?", texto: `${p.nome ?? "O passageiro"} e os trechos dele saem do pedido.`, acao: () => removerPassageiro.mutate(p.id) })}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {p.trechos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum trecho ainda.</p>}
              {p.trechos.map((t) => {
                const itens = edita ? acoesTrecho(p, t) : [];
                return (
                  <div key={t.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{t.origem} → {t.destino}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateBR(t.data_voo)}
                          {t.companhia && ` · ${t.companhia}${t.voo ? ` ${t.voo}` : ""}`}
                          {t.partida && ` · sai ${formatarDataHora(t.partida)}`}
                        </p>
                        {t.localizador && (
                          <p className="text-sm">
                            Localizador <span className="font-mono font-medium">{t.localizador}</span>
                            {t.numero_bilhete && ` · bilhete ${t.numero_bilhete}`}
                            {" · "}<span className="tabular-nums">{formatCurrency(valorTrecho(t))}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tom={TOM_TRECHO[t.situacao] ?? "neutro"} icone={false}>{rotuloSituacaoTrecho(t.situacao)}</StatusBadge>
                        {itens.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" aria-label={`Ações do trecho ${t.origem} → ${t.destino}`}>
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {itens.map((i) => <DropdownMenuItem key={i.rotulo} onSelect={i.aoClicar}>{i.rotulo}</DropdownMenuItem>)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    {t.cotacoes.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-border pt-2 text-sm" aria-label="Cotações da agência">
                        {t.cotacoes.map((c) => (
                          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span className={c.escolhida ? "font-medium" : "text-muted-foreground"}>
                              {c.escolhida && <Check className="mr-1 inline h-4 w-4 text-success" aria-label="Escolhida" />}
                              {c.companhia}{c.voo ? ` ${c.voo}` : ""}{c.partida ? ` · ${formatarDataHora(c.partida)}` : ""}
                              {" · "}<span className="tabular-nums">{formatCurrency(Number(c.valor))}</span>
                            </span>
                            {edita && !t.localizador && (
                              <span className="flex gap-1">
                                {!c.escolhida && (
                                  <Button variant="ghost" size="sm" onClick={() => escolher.mutate({ trechoId: t.id, cotacaoId: c.id })}>Escolher</Button>
                                )}
                                <Button variant="ghost" size="sm" aria-label="Apagar cotação" onClick={() => removerCotacao.mutate(c)}>
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <PassageiroDialog open={novoPassageiro} onOpenChange={setNovoPassageiro} pedidoId={pedido.id} podeCadastrar={podeEditar} />
      {trechoForm && (
        <TrechoDialog
          open
          onOpenChange={(a) => !a && setTrechoForm(null)}
          pedidoId={pedido.id}
          passageiroId={trechoForm.passageiro.id}
          proximaOrdem={Math.max(0, ...trechoForm.passageiro.trechos.map((t) => t.ordem)) + 1}
          trecho={trechoForm.trecho}
          sugestao={{
            destino: pedido.destino_cidade && `${pedido.destino_cidade}${pedido.destino_uf ? `/${pedido.destino_uf}` : ""}`,
            ida: pedido.data_inicio,
            volta: pedido.data_fim,
          }}
        />
      )}
      {cotacaoDe && (
        <CotacaoDialog
          open
          onOpenChange={(a) => !a && setCotacaoDe(null)}
          pedidoId={pedido.id}
          trechoId={cotacaoDe.id}
          descricaoTrecho={`${cotacaoDe.origem} → ${cotacaoDe.destino}, ${formatDateBR(cotacaoDe.data_voo)}`}
        />
      )}
      {bilhete && (
        <BilheteDialog open onOpenChange={(a) => !a && setBilhete(null)} pedidoId={pedido.id} trecho={bilhete.trecho} acao={bilhete.acao} />
      )}
      <AlertDialog open={!!confirmar} onOpenChange={(a) => !a && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmar?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{confirmar?.texto}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmar?.acao()}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

