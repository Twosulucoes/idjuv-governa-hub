/**
 * Trilha do pedido (passagem_historico): criação e mudanças de situação do pedido e dos trechos, e a prestação de
 * contas (entregas e dispensas do pedido e dos passageiros) e as faturas da agência (bilhete incluído ou retirado de
 * uma nota e a situação da nota).
 */

import { History } from "lucide-react";
import { EmptyState } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { formatarDataHora } from "@/lib/passagens/regras";
import {
  rotuloAnexo,
  rotuloPrestacao,
  rotuloSituacaoFatura,
  rotuloSituacaoPedido,
  rotuloSituacaoTrecho,
  type PassagemHistorico,
} from "@/types/passagens";

interface Props {
  historico: PassagemHistorico[] | undefined;
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
}

type Json = Record<string, string | number | boolean | null> | null;

const entrega = (rotulo: string, antes: unknown, depois: unknown, sei?: unknown) => {
  if (antes === depois) return null;
  if (!depois) return `${rotulo}: entrega desfeita`;
  return `${rotulo} entregue em ${formatDateBR(depois as string)}${sei ? ` (SEI ${sei})` : ""}`;
};

function descreverPrestacao(h: PassagemHistorico, antes: Json, depois: Json): string {
  if (h.acao === "prestacao_pedido") {
    const partes = [
      antes?.prestacao_contas !== depois?.prestacao_contas
        ? `modo ${rotuloPrestacao(depois?.prestacao_contas as string)}${depois?.prestacao_contas === "dispensado" ? ` (${depois?.prestacao_dispensa_motivo ?? ""})` : ""}`
        : null,
      entrega("relatório do evento", antes?.relatorio_evento_entregue_em, depois?.relatorio_evento_entregue_em, depois?.relatorio_evento_documento_sei),
    ].filter(Boolean);
    return `Prestação de contas do pedido: ${partes.join(" · ") || "responsável ou dados atualizados"}`;
  }
  const quem = depois?.passageiro ?? "passageiro";
  const partes = [
    antes?.prestacao_dispensada !== depois?.prestacao_dispensada
      ? (depois?.prestacao_dispensada ? `dispensado (${depois?.prestacao_dispensa_motivo ?? ""})` : "dispensa retirada")
      : null,
    entrega("cartão de embarque", antes?.embarque_entregue_em, depois?.embarque_entregue_em),
    entrega("relatório", antes?.relatorio_entregue_em, depois?.relatorio_entregue_em, depois?.relatorio_documento_sei),
  ].filter(Boolean);
  return `Prestação de contas de ${quem}: ${partes.join(" · ") || "dados atualizados"}`;
}

function descrever(h: PassagemHistorico): string {
  const antes = h.antes as Json;
  const depois = h.depois as Json;
  if (h.acao === "prestacao_pedido" || h.acao === "prestacao_passageiro") return descreverPrestacao(h, antes, depois);
  if (h.acao === "anexo_incluido" || h.acao === "anexo_removido") {
    return `Anexo ${h.acao === "anexo_incluido" ? "incluído" : "removido"}: ${depois?.nome_arquivo ?? ""} (${rotuloAnexo(depois?.tipo as string)}${depois?.passageiro ? `, ${depois.passageiro}` : ""})`;
  }
  if (h.acao === "fatura_item") {
    if (!antes) return `Bilhete incluído na fatura ${depois?.fatura ?? ""} (${formatCurrency(Number(depois?.valor ?? 0))})`;
    if (!depois) return `Bilhete retirado da fatura ${antes.fatura ?? ""}`;
    return `Valor do bilhete na fatura ${depois.fatura ?? ""}: ${formatCurrency(Number(antes.valor ?? 0))} → ${formatCurrency(Number(depois.valor ?? 0))}`;
  }
  if (h.acao === "fatura_situacao") {
    const extra = depois?.situacao === "paga"
      ? ` · OB ${depois?.ob_numero ?? "—"}, ${formatDateBR(depois?.pagamento_data as string)}`
      : depois?.situacao === "atestada" ? ` · atesto SEI ${depois?.atesto_documento_sei ?? "—"}`
      : depois?.situacao === "cancelada" ? ` · ${depois?.cancelamento_motivo ?? ""}` : "";
    return `Fatura ${depois?.fatura ?? ""}: ${rotuloSituacaoFatura(antes?.situacao as string)} → ${rotuloSituacaoFatura(depois?.situacao as string)}${extra}`;
  }
  if (h.acao === "pedido_criado") return `Pedido registrado (processo SEI ${depois?.numero_sei ?? "—"})`;
  if (h.acao === "pedido_situacao") {
    const extra = depois?.situacao === "aprovado"
      ? ` · documento SEI ${depois?.aprovacao_documento_sei ?? "—"}`
      : depois?.situacao === "cancelado" ? ` · ${depois?.cancelamento_motivo ?? ""}` : "";
    return `Pedido: ${rotuloSituacaoPedido(antes?.situacao as string)} → ${rotuloSituacaoPedido(depois?.situacao as string)}${extra}`;
  }
  const trecho = `${depois?.origem ?? ""} → ${depois?.destino ?? ""}`;
  const de = antes ? `${rotuloSituacaoTrecho(antes.situacao as string)} → ` : "";
  const loc = depois?.localizador ? ` · ${depois.localizador} · ${formatCurrency(Number(depois.valor_emissao ?? 0))}` : "";
  return `Trecho ${trecho}: ${de}${rotuloSituacaoTrecho(depois?.situacao as string)}${loc}`;
}

export function HistoricoTab({ historico, carregando, erro, aoTentarNovamente }: Props) {
  if (carregando) return <Skeleton className="h-48" />;
  if (erro) {
    return <EmptyState titulo="Não foi possível carregar o histórico" acao={<Button variant="outline" onClick={aoTentarNovamente}>Tentar novamente</Button>} />;
  }
  if (!historico?.length) return <EmptyState icone={History} titulo="Sem registros ainda" />;
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {historico.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[1.81rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
          <p className="text-sm font-medium">{formatarDataHora(h.feito_em)}</p>
          <p className="text-sm">{descrever(h)}</p>
        </li>
      ))}
    </ol>
  );
}
