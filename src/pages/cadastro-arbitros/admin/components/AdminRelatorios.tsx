import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileSpreadsheet, BarChart3, PieChart, TrendingUp, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line } from "recharts";
import type { EstatisticasArbitros, ArbitroCadastro } from "../arbitrosAdminService";

interface Props {
  stats?: EstatisticasArbitros;
  loading: boolean;
  arbitros: ArbitroCadastro[];
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "#6366f1", "#f59e0b", "#14b8a6", "#f43f5e", "#8b5cf6",
];

type TipoRelatorio = "modalidade" | "uf" | "categoria" | "evolucao" | "sexo";

export function AdminRelatorios({ stats, loading, arbitros }: Props) {
  const [tipo, setTipo] = useState<TipoRelatorio>("modalidade");

  if (loading || !stats) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  }

  function exportCSV() {
    const headers = "Protocolo,Nome,CPF,Categoria,Modalidade,UF,Status,Email,Celular,Data Cadastro\n";
    const rows = arbitros.map((a) =>
      `"${a.protocolo || ""}","${a.nome}","${a.cpf}","${a.categoria}","${a.modalidade}","${a.uf || ""}","${a.status}","${a.email}","${a.celular}","${new Date(a.created_at).toLocaleDateString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-arbitros-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header relatórios */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorio)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modalidade">📊 Por Modalidade</SelectItem>
              <SelectItem value="uf">🗺️ Por Estado (UF)</SelectItem>
              <SelectItem value="categoria">🏅 Por Categoria</SelectItem>
              <SelectItem value="evolucao">📈 Evolução Mensal</SelectItem>
              <SelectItem value="sexo">👥 Por Sexo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Gráfico dinâmico */}
      {tipo === "modalidade" && <RelatorioModalidade data={stats.porModalidade} />}
      {tipo === "uf" && <RelatorioUF data={stats.porUF} />}
      {tipo === "categoria" && <RelatorioCategoria data={stats.porCategoria} />}
      {tipo === "evolucao" && <RelatorioEvolucao data={stats.porMes} />}
      {tipo === "sexo" && <RelatorioSexo data={stats.porSexo} />}

      {/* Tabela resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicador</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Total de Cadastros", value: stats.total },
                { label: "Pendentes", value: stats.pendentes },
                { label: "Aprovados", value: stats.aprovados },
                { label: "Rejeitados", value: stats.rejeitados },
              ].map((row) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right font-bold">{row.value}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {stats.total > 0 ? ((row.value / stats.total) * 100).toFixed(1) + "%" : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-componentes de relatório

function RelatorioModalidade({ data }: { data: { modalidade: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Cadastros por Modalidade</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados</p> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="modalidade" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Cadastros" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RelatorioUF({ data }: { data: { uf: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Cadastros por Estado</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados</p> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="uf" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cadastros" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RelatorioCategoria({ data }: { data: { categoria: string; count: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    categoria: d.categoria === "estadual" ? "Estadual" : "Nacional",
  }));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4" /> Distribuição por Categoria</CardTitle></CardHeader>
      <CardContent className="flex justify-center">
        {formatted.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <RPieChart>
              <Pie data={formatted} dataKey="count" nameKey="categoria" cx="50%" cy="50%" outerRadius={100} label={({ categoria, count }) => `${categoria}: ${count}`}>
                {formatted.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </RPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RelatorioEvolucao({ data }: { data: { mes: string; count: number }[] }) {
  const formatted = data.map((d) => {
    const [y, m] = d.mes.split("-");
    return { ...d, label: `${m}/${y}` };
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Evolução Mensal</CardTitle></CardHeader>
      <CardContent>
        {formatted.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Cadastros" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RelatorioSexo({ data }: { data: { sexo: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4" /> Distribuição por Sexo</CardTitle></CardHeader>
      <CardContent className="flex justify-center">
        {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <RPieChart>
              <Pie data={data} dataKey="count" nameKey="sexo" cx="50%" cy="50%" outerRadius={100} label={({ sexo, count }) => `${sexo}: ${count}`}>
                <Cell fill="#3b82f6" />
                <Cell fill="#ec4899" />
              </Pie>
              <Tooltip />
            </RPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
