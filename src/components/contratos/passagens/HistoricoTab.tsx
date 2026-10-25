/**
 * Trilha do pedido (passagem_historico): criação e mudanças de situação do pedido e dos trechos.
 */

import { History } from "lucide-react";
import { EmptyState } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { formatarDataHora } from "@/lib/passagens/regras";
import { rotuloSituacaoPedido, rotuloSituacaoTrecho, type PassagemHistorico } from "@/types/passagens";

interface Props {
  historico: PassagemHistorico[] | undefined;
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
}

type Json = Record<string, string | number | null> | null;

function descrever(h: PassagemHistorico): string {
  const antes = h.antes as Json;
  const depois = h.depois as Json;
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
