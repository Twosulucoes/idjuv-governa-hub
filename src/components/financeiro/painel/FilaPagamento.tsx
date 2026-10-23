import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { CredorFila } from "@/lib/financeiro/painelExecucao";
import { EstadoQuadro, type EstadoQuadroProps } from "./EstadoQuadro";

const LIMITE = 10;

interface FilaPagamentoProps extends EstadoQuadroProps {
  fila: CredorFila[];
  comExercicio: (href: string) => string;
}

export function FilaPagamento({ fila, comExercicio, ...estado }: FilaPagamentoProps) {
  const total = fila.reduce((s, c) => s + c.aLiquidar + c.aPagar, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-h3">
            Fila de pagamento{fila.length > 0 && ` · ${formatCurrency(total)}`}
          </CardTitle>
          <CardDescription>Empenhado a liquidar e liquidado a pagar, por credor</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={comExercicio("/financeiro/empenhos")}>Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <EstadoQuadro {...estado}>
          {fila.length === 0 ? (
            <p className="text-body text-muted-foreground">Importe o FIP 614 para ver a fila de pagamento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <caption className="sr-only">Fila de pagamento por credor</caption>
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">Credor</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">A pagar</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">A liquidar</th>
                    <th scope="col" className="py-2 text-right font-medium">Mais antigo</th>
                  </tr>
                </thead>
                <tbody>
                  {fila.slice(0, LIMITE).map((c) => (
                    <tr key={c.credor} className="border-b border-border last:border-0">
                      <td className="max-w-[16rem] py-2 pr-3">
                        <span className="line-clamp-2">{c.credor}</span>
                        <span className="text-caption text-muted-foreground">
                          {c.empenhos} {c.empenhos === 1 ? "empenho" : "empenhos"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium text-foreground">
                        {c.aPagar > 0 ? formatCurrency(c.aPagar) : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.aLiquidar > 0 ? formatCurrency(c.aLiquidar) : "—"}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">{c.diasMaisAntigo} dias</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fila.length > LIMITE && (
                <p className="pt-2 text-caption text-muted-foreground">
                  Mostrando {LIMITE} de {fila.length} credores.
                </p>
              )}
            </div>
          )}
        </EstadoQuadro>
      </CardContent>
    </Card>
  );
}
