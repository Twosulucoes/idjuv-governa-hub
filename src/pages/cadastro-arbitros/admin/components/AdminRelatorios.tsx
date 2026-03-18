import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, BarChart3, PieChart, TrendingUp, MapPin, FileText, Printer, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line } from "recharts";
import { exportarParaCSV } from "@/export/exportCSV";
import { exportarParaExcel } from "@/export/exportExcel";
import { MODALIDADES_ESPORTIVAS } from "../../modalidadesEsportivas";
import { gerarRelatorioArbitrosPDF } from "@/lib/pdfRelatorioArbitros";
import { toast } from "sonner";
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

const EXPORT_FIELDS = [
  { key: "protocolo", label: "Protocolo" },
  { key: "nome", label: "Nome" },
  { key: "cpf", label: "CPF" },
  { key: "rg", label: "RG" },
  { key: "rne", label: "RNE" },
  { key: "validade_rne", label: "Validade RNE" },
  { key: "pis_pasep", label: "PIS/PASEP" },
  { key: "email", label: "Email" },
  { key: "celular", label: "Celular" },
  { key: "modalidades_texto", label: "Modalidades" },
  { key: "categorias_texto", label: "Categorias" },
  { key: "sexo", label: "Sexo" },
  { key: "data_nascimento", label: "Data Nascimento" },
  { key: "nacionalidade", label: "Nacionalidade" },
  { key: "tipo_sanguineo", label: "Tipo Sanguíneo" },
  { key: "fator_rh", label: "Fator RH" },
  { key: "cep", label: "CEP" },
  { key: "endereco", label: "Endereço" },
  { key: "complemento", label: "Complemento" },
  { key: "bairro", label: "Bairro" },
  { key: "cidade", label: "Cidade" },
  { key: "uf", label: "UF" },
  { key: "local_trabalho", label: "Local Trabalho" },
  { key: "funcao", label: "Função" },
  { key: "esfera", label: "Esfera" },
  { key: "banco", label: "Banco" },
  { key: "agencia", label: "Agência" },
  { key: "conta_corrente", label: "Conta Corrente" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Data Cadastro" },
] as const;

type ExportFieldKey = (typeof EXPORT_FIELDS)[number]["key"];

const LEGACY_EXPORT_FIELD_MAP: Record<string, ExportFieldKey> = {
  modalidade: "modalidades_texto",
  categoria: "categorias_texto",
};

const VALID_EXPORT_FIELD_KEYS = new Set<string>(EXPORT_FIELDS.map((field) => field.key));

function normalizeSelectedFields(fields: string[]): string[] {
  const mapped = fields
    .map((field) => LEGACY_EXPORT_FIELD_MAP[field] ?? field)
    .filter((field, index, arr) => VALID_EXPORT_FIELD_KEYS.has(field) && arr.indexOf(field) === index);

  return mapped;
}

export function AdminRelatorios({ stats, loading, arbitros }: Props) {
  const [tipo, setTipo] = useState<TipoRelatorio>("modalidade");
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    normalizeSelectedFields(["protocolo", "nome", "cpf", "modalidades_texto", "categorias_texto", "celular", "rg", "email", "created_at"])
  );
  const [filtroModalidadeExport, setFiltroModalidadeExport] = useState("todos");
  const [filtroStatusExport, setFiltroStatusExport] = useState("todos");
  const [filtroCategoriaExport, setFiltroCategoriaExport] = useState("todos");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [agruparPorModalidade, setAgruparPorModalidade] = useState(true);

  const selectedFieldsNormalized = normalizeSelectedFields(selectedFields);

  if (loading || !stats) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  }

  function toggleField(key: string) {
    setSelectedFields((prev) => {
      const normalizedPrev = normalizeSelectedFields(prev);
      return normalizedPrev.includes(key)
        ? normalizedPrev.filter((fieldKey) => fieldKey !== key)
        : [...normalizedPrev, key];
    });
  }

  function selectAllFields() {
    setSelectedFields(EXPORT_FIELDS.map((f) => f.key));
  }

  function deselectAllFields() {
    setSelectedFields([]);
  }

  function getFilteredData() {
    let filtered = [...arbitros];
    if (filtroModalidadeExport !== "todos") {
      filtered = filtered.filter((a) => {
        const mods = a.modalidades_lista || [];
        if (mods.length > 0) {
          return mods.some((m) => m.modalidade === filtroModalidadeExport);
        }
        return a.modalidade === filtroModalidadeExport;
      });
    }
    if (filtroStatusExport !== "todos") {
      filtered = filtered.filter((a) => a.status === filtroStatusExport);
    }
    if (filtroCategoriaExport !== "todos") {
      filtered = filtered.filter((a) => {
        const mods = a.modalidades_lista || [];
        if (mods.length > 0) {
          return mods.some((m) => m.categoria === filtroCategoriaExport);
        }
        return a.categoria === filtroCategoriaExport;
      });
    }
    // Classificação alfabética por nome
    filtered.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
    return filtered;
  }

  /** Normaliza nome: primeira letra maiúscula de cada palavra */
  function toTitleCase(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
  }

  function getExportData() {
    const fieldsToExport = normalizeSelectedFields(selectedFields);

    return getFilteredData().map((a) => {
      const row: Record<string, unknown> = {};
      const mods = a.modalidades_lista || [];

      fieldsToExport.forEach((key) => {
        const field = EXPORT_FIELDS.find((f) => f.key === key);
        if (!field) return;
        let val: unknown;

        if (key === "modalidades_texto") {
          // Mostrar TODAS as modalidades do árbitro (não filtrar)
          val = mods.length > 0
            ? mods.map((m) => m.modalidade).join(", ")
            : a.modalidade || "";
        } else if (key === "categorias_texto") {
          // Mostrar TODAS as categorias do árbitro (não filtrar)
          val = mods.length > 0
            ? [...new Set(mods.map((m) => (m.categoria === "estadual" ? "Estadual" : "Nacional")))].join(", ")
            : (a.categoria === "estadual" ? "Estadual" : a.categoria === "nacional" ? "Nacional" : a.categoria || "");
        } else {
          val = (a as any)[key];
        }

        if ((key === "created_at" || key === "data_nascimento" || key === "validade_rne") && val) val = new Date(val as string).toLocaleDateString("pt-BR");
        if (key === "sexo") val = val === "M" ? "Masculino" : val === "F" ? "Feminino" : val;
        if (key === "status") val = val === "pendente" ? "Pendente" : val === "aprovado" ? "Aprovado" : val === "rejeitado" ? "Rejeitado" : val === "enviado" ? "Enviado" : val;

        // Normalizar nomes para Title Case
        if (key === "nome" && typeof val === "string") val = toTitleCase(val);

        row[field.label] = val ?? "";
      });

      return row;
    });
  }

  function handleExportCSV() {
    const data = getExportData();
    if (data.length === 0) return;
    exportarParaCSV(data, "relatorio-arbitros");
  }

  function handleExportExcel() {
    const data = getExportData();
    if (data.length === 0) return;
    exportarParaExcel(data, "relatorio-arbitros", "Árbitros");
  }

  async function handleGeneratePDF() {
    const fieldsToExport = normalizeSelectedFields(selectedFields);
    if (fieldsToExport.length === 0) {
      toast.error("Selecione pelo menos um campo para exportar");
      return;
    }

    const data = getExportData();
    if (data.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const campos = fieldsToExport.map((key) => {
        const field = EXPORT_FIELDS.find((f) => f.key === key);
        return { key, label: field?.label || key };
      });

      const filteredArbitros = getFilteredData();
      const resumo = stats ? { total: stats.total, pendentes: stats.pendentes, aprovados: stats.aprovados, rejeitados: stats.rejeitados } : undefined;

      if (agruparPorModalidade) {
        // Agrupar por modalidade — cada árbitro aparece 1x por grupo
        const gruposMap = new Map<string, Record<string, unknown>[]>();

        filteredArbitros.forEach((arb) => {
          const mods = arb.modalidades_lista || [];
          const modalidades = mods.length > 0
            ? mods
            : [{ modalidade: arb.modalidade || 'Sem Modalidade', categoria: arb.categoria || '' }];

          modalidades.forEach((mod) => {
            const modName = typeof mod === 'string' ? mod : mod.modalidade;
            const modCategoria = typeof mod === 'string' ? '' : mod.categoria;

            if (!gruposMap.has(modName)) gruposMap.set(modName, []);

            const row: Record<string, unknown> = {};
            fieldsToExport.forEach((key) => {
              const field = EXPORT_FIELDS.find((f) => f.key === key);
              if (!field) return;
              let val: unknown;

              if (key === "modalidades_texto") {
                // No agrupamento, mostrar apenas a modalidade do grupo (sem repetir)
                val = modName;
              } else if (key === "categorias_texto") {
                val = modCategoria === "estadual" ? "Estadual" : modCategoria === "nacional" ? "Nacional" : modCategoria || "";
              } else {
                val = (arb as any)[key];
              }

              if ((key === "created_at" || key === "data_nascimento" || key === "validade_rne") && val) val = new Date(val as string).toLocaleDateString("pt-BR");
              if (key === "sexo") val = val === "M" ? "Masculino" : val === "F" ? "Feminino" : val;
              if (key === "status") val = val === "pendente" ? "Pendente" : val === "aprovado" ? "Aprovado" : val === "rejeitado" ? "Rejeitado" : val === "enviado" ? "Enviado" : val;
              if (key === "nome" && typeof val === "string") val = toTitleCase(val);

              row[field.label] = val ?? "";
            });

            gruposMap.get(modName)!.push(row);
          });
        });

        const nomeLabel = EXPORT_FIELDS.find(f => f.key === 'nome')?.label || 'Nome';
        const grupos = Array.from(gruposMap.entries())
          .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
          .map(([modalidade, dados]) => ({
            modalidade,
            dados: dados.sort((a, b) =>
              String(a[nomeLabel] || '').localeCompare(String(b[nomeLabel] || ''), 'pt-BR', { sensitivity: 'base' })
            ),
          }));

        await gerarRelatorioArbitrosPDF(data, {
          titulo: "Relatório de Cadastro de Árbitros",
          subtitulo: `${filteredArbitros.length} árbitro(s) — ${grupos.length} modalidade(s) — Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
          campos,
          resumo,
          grupos,
        });
        toast.success(`PDF agrupado com ${filteredArbitros.length} árbitros em ${grupos.length} modalidade(s)`);
      } else {
        // Sem agrupamento — lista simples
        await gerarRelatorioArbitrosPDF(data, {
          titulo: "Relatório de Cadastro de Árbitros",
          subtitulo: `${filteredArbitros.length} árbitro(s) — Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
          campos,
          resumo,
        });
        toast.success(`PDF gerado com ${filteredArbitros.length} árbitros`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  const filteredCount = getFilteredData().length;

  return (
    <div className="space-y-6">
      {/* Gráficos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      {tipo === "modalidade" && <RelatorioModalidade data={stats.porModalidade} />}
      {tipo === "uf" && <RelatorioUF data={stats.porUF} />}
      {tipo === "categoria" && <RelatorioCategoria data={stats.porCategoria} />}
      {tipo === "evolucao" && <RelatorioEvolucao data={stats.porMes} />}
      {tipo === "sexo" && <RelatorioSexo data={stats.porSexo} />}

      {/* Exportação Personalizada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Exportação Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Modalidade</Label>
              <Select value={filtroModalidadeExport} onValueChange={setFiltroModalidadeExport}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="todos">Todas</SelectItem>
                  {MODALIDADES_ESPORTIVAS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={filtroStatusExport} onValueChange={setFiltroStatusExport}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={filtroCategoriaExport} onValueChange={setFiltroCategoriaExport}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="estadual">Estadual</SelectItem>
                  <SelectItem value="nacional">Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Label className="text-xs text-muted-foreground">Campos a exportar:</Label>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={selectAllFields}>Selecionar todos</Button>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={deselectAllFields}>Limpar</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {EXPORT_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedFieldsNormalized.includes(f.key)}
                    onCheckedChange={() => toggleField(f.key)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {/* Botões de export */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2" disabled={selectedFieldsNormalized.length === 0}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="gap-2" disabled={selectedFieldsNormalized.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button onClick={handleGeneratePDF} variant="outline" className="gap-2" disabled={selectedFieldsNormalized.length === 0 || isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              PDF com Timbre
            </Button>
            <span className="text-xs text-muted-foreground self-center ml-2">
              {filteredCount} registro(s) • {selectedFieldsNormalized.length} campo(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
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

// Sub-componentes de gráfico
function RelatorioModalidade({ data }: { data: { modalidade: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Cadastros por Modalidade</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados</p> : (
          <ResponsiveContainer width="100%" height={Math.max(320, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="modalidade" width={100} tick={{ fontSize: 11 }} />
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
  const formatted = data.map(d => ({ ...d, categoria: d.categoria === "estadual" ? "Estadual" : "Nacional" }));
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
  const formatted = data.map(d => { const [y, m] = d.mes.split("-"); return { ...d, label: `${m}/${y}` }; });
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
