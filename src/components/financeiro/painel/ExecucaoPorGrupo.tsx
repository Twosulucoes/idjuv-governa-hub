import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { ChartCard, EmptyState } from "@/components/design-system";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/formatters";
import type { GrupoExecucao } from "@/lib/financeiro/painelExecucao";
import { EstadoQuadro, type EstadoQuadroProps } from "./EstadoQuadro";

const chartConfig = {
  autorizado: { label: "Autorizado", color: "hsl(var(--chart-1))" },
  empenhado: { label: "Empenhado", color: "hsl(var(--chart-2))" },
  pago: { label: "Pago", color: "hsl(var(--chart-3))" },
};

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function ExecucaoPorGrupo({ grupos, ...estado }: { grupos: GrupoExecucao[] } & EstadoQuadroProps) {
  return (
    <ChartCard
      titulo="Execução por grupo de despesa"
      descricao="Autorizado, empenhado e pago em cada grupo"
      tabela={{
        colunas: [
          { chave: "rotulo", rotulo: "Grupo" },
          { chave: "autorizado", rotulo: "Autorizado", numerica: true },
          { chave: "empenhado", rotulo: "Empenhado", numerica: true },
          { chave: "pago", rotulo: "Pago", numerica: true },
          { chave: "saldo", rotulo: "Saldo para empenhar", numerica: true },
        ],
        linhas: grupos.map((g) => ({
          rotulo: g.rotulo,
          autorizado: formatCurrency(g.autorizado),
          empenhado: formatCurrency(g.empenhado),
          pago: formatCurrency(g.pago),
          saldo: formatCurrency(g.saldoEmpenhar),
        })),
      }}
    >
      <EstadoQuadro {...estado}>
        {grupos.length === 0 ? (
          <EmptyState titulo="Sem dotações no exercício" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={grupos} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tickFormatter={(v: number) => compacto.format(v)} className="text-xs" />
              <YAxis dataKey="rotulo" type="category" width={96} className="text-xs" />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v, nome) => `${nome}: ${formatCurrency(Number(v))}`} />}
              />
              <Legend />
              <Bar dataKey="autorizado" name="Autorizado" fill="var(--color-autorizado)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="empenhado" name="Empenhado" fill="var(--color-empenhado)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="pago" name="Pago" fill="var(--color-pago)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </EstadoQuadro>
    </ChartCard>
  );
}
