import * as React from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface TabelaAlternativa {
  colunas: { chave: string; rotulo: string; numerica?: boolean }[];
  linhas: Record<string, React.ReactNode>[];
}

export interface ChartCardProps {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  /** O gráfico (use `ChartContainer` + `chartConfig` com `hsl(var(--chart-N))`). */
  children: React.ReactNode;
  /** Os mesmos dados em tabela: alternativa acessível ao gráfico. */
  tabela?: TabelaAlternativa;
  acoes?: React.ReactNode;
  className?: string;
}

/** Cartão de gráfico com alternância para tabela de dados (não depender só de cor/forma). */
export function ChartCard({ titulo, descricao, children, tabela, acoes, className }: ChartCardProps) {
  const [modo, setModo] = React.useState<"grafico" | "tabela">("grafico");

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-h3">{titulo}</CardTitle>
          {descricao && <CardDescription>{descricao}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {acoes}
          {tabela && (
            <ToggleGroup
              type="single"
              value={modo}
              onValueChange={(v) => (v === "grafico" || v === "tabela") && setModo(v)}
              aria-label="Formato de exibição"
            >
              <ToggleGroupItem value="grafico" aria-label="Ver gráfico" title="Gráfico">
                <BarChart3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="tabela" aria-label="Ver tabela de dados" title="Tabela">
                <Table2 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {modo === "tabela" && tabela ? (
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <caption className="sr-only">{titulo}</caption>
              <thead>
                <tr className="border-b border-border">
                  {tabela.colunas.map((c) => (
                    <th
                      key={c.chave}
                      scope="col"
                      className={`py-2 pr-3 font-medium text-muted-foreground ${c.numerica ? "text-right" : "text-left"}`}
                    >
                      {c.rotulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabela.linhas.map((l, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {tabela.colunas.map((c) => (
                      <td key={c.chave} className={`py-2 pr-3 ${c.numerica ? "text-right" : ""}`}>
                        {l[c.chave]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
