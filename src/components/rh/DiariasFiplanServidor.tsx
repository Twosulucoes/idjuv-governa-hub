/**
 * Diárias que o FIPLAN pagou ao servidor (FIP 002, importado pelo Financeiro), na aba Viagens da ficha funcional:
 * período, quantidade, valor, data do pagamento e a prestação de contas (prazo de 10 dias do retorno).
 * Leem o RH com rh.viagens.visualizar, o Financeiro e o próprio servidor (RLS de fin_diarias_fiplan).
 */

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDiariasFiplanDoServidor } from "@/hooks/useDiariasFiplan";
import { dataBR } from "@/lib/bancario/exibicao";
import { PRAZO_PRESTACAO_DIAS, resumirDiarias, seloPrestacao } from "@/lib/financeiro/diariasFiplan";
import { formatCurrency } from "@/lib/formatters";

export function DiariasFiplanServidor({ servidorId }: { servidorId: string | undefined }) {
  const diarias = useDiariasFiplanDoServidor(servidorId);
  const hoje = useMemo(() => new Date(), []);
  const lista = diarias.data ?? [];
  const resumo = resumirDiarias(lista, hoje);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
          Diárias pagas no FIPLAN
        </CardTitle>
        <CardDescription>
          {lista.length
            ? `${resumo.quantidade} diária${resumo.quantidade === 1 ? "" : "s"}, ${formatCurrency(resumo.valor)}. ` +
              (resumo.pendentes
                ? `${resumo.pendentes} sem prestação de contas (${formatCurrency(resumo.valorPendente)}).`
                : "Todas com prestação de contas.")
            : `Lidas do FIP 002, importado pelo Financeiro. Prazo para prestar contas: ${PRAZO_PRESTACAO_DIAS} dias depois do retorno.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {diarias.isLoading ? (
          <p className="py-4 text-center text-muted-foreground">Carregando…</p>
        ) : diarias.isError ? (
          <p className="py-4 text-center text-muted-foreground">Não foi possível carregar as diárias do FIPLAN.</p>
        ) : lista.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">Nenhuma diária deste servidor no FIPLAN.</p>
        ) : (
          <ul className="space-y-3">
            {lista.map((d) => {
              const selo = seloPrestacao(d, hoje);
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-4">
                  <div>
                    <p className="font-medium">
                      {dataBR(d.data_saida)} a {dataBR(d.data_retorno)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Number(d.quantidade).toLocaleString("pt-BR")} diária{Number(d.quantidade) === 1 ? "" : "s"}
                      {d.data_pagamento ? ` · paga em ${dataBR(d.data_pagamento)}` : ""}
                      {d.processo_fiplan ? ` · processo ${d.processo_fiplan}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium tabular-nums">{formatCurrency(Number(d.valor_empenhado))}</span>
                    <StatusBadge tom={selo.tom}>{selo.texto}</StatusBadge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
