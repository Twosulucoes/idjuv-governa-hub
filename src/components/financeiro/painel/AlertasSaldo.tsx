import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { formatarNatureza, type AlertaSaldo } from "@/lib/financeiro/painelExecucao";
import { EstadoQuadro, type EstadoQuadroProps } from "./EstadoQuadro";

export function AlertasSaldo({ alertas, ...estado }: { alertas: AlertaSaldo[] } & EstadoQuadroProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Alertas de saldo</CardTitle>
        <CardDescription>Dotações cujo saldo não cobre o resto do ano no ritmo atual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <EstadoQuadro {...estado}>
          {alertas.length === 0 ? (
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              Nenhuma dotação com saldo abaixo do ritmo do ano.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {alertas.map((a) => (
                <li key={`${a.natureza}-${a.fonte}-${a.paoe}`} className="flex gap-3 py-3 first:pt-0">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium text-foreground">
                      {formatarNatureza(a.natureza)}
                      {a.natureza_nome && <span className="font-normal text-muted-foreground"> · {a.natureza_nome}</span>}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Fonte {a.fonte ?? "—"} · ritmo de {formatCurrency(a.ritmoMensal)}/mês · {a.mesesRestantes}{" "}
                      {a.mesesRestantes === 1 ? "mês" : "meses"} pela frente
                    </p>
                    <dl className="grid grid-cols-3 gap-2 text-caption">
                      <div>
                        <dt className="text-muted-foreground">Tem</dt>
                        <dd className="tabular-nums text-foreground">{formatCurrency(a.cobertura)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Precisa</dt>
                        <dd className="tabular-nums text-foreground">{formatCurrency(a.necessidade)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Falta</dt>
                        <dd className="font-semibold tabular-nums text-warning">{formatCurrency(a.falta)}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-caption text-muted-foreground">
            Estimativa pelo ritmo do ano; não considera gastos que ainda vão começar.
          </p>
        </EstadoQuadro>
      </CardContent>
    </Card>
  );
}
