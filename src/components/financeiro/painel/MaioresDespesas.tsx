import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { formatarNatureza, type DespesaElemento } from "@/lib/financeiro/painelExecucao";
import { EstadoQuadro, type EstadoQuadroProps } from "./EstadoQuadro";

const percentual = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function MaioresDespesas({ despesas, ...estado }: { despesas: DespesaElemento[] } & EstadoQuadroProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Maiores despesas</CardTitle>
        <CardDescription>Elementos com mais valor liquidado no exercício</CardDescription>
      </CardHeader>
      <CardContent>
        <EstadoQuadro {...estado}>
          {despesas.length === 0 ? (
            <p className="text-body text-muted-foreground">Nenhuma despesa liquidada no exercício.</p>
          ) : (
            <ol className="space-y-3">
              {despesas.map((d) => (
                <li key={d.elemento} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-body">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-foreground">{formatarNatureza(d.elemento)}</span>
                      {d.nome && <span className="text-muted-foreground"> · {d.nome}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      {formatCurrency(d.liquidado)}{" "}
                      <span className="text-caption text-muted-foreground">({percentual.format(d.pct)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, d.pct)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </EstadoQuadro>
      </CardContent>
    </Card>
  );
}
