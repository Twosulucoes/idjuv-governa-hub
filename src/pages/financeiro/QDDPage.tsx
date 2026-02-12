/**
 * QUADRO DE DETALHAMENTO DE DESPESA (QDD)
 * 
 * Visualização completa do orçamento no formato QDD padrão,
 * com importação de planilha XLSX e exportação.
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useCallback } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  PieChart,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import { useDotacoes } from "@/hooks/useFinanceiro";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export default function QDDPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [exercicio, setExercicio] = useState(new Date().getFullYear().toString());
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [filterIDU, setFilterIDU] = useState("todos");

  const { data: dotacoes, isLoading, refetch } = useDotacoes(parseInt(exercicio));

  // Filtro
  const filtered = useMemo(() => {
    if (!dotacoes) return [];
    return dotacoes.filter((d) => {
      const matchSearch =
        !searchTerm ||
        d.codigo_dotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.natureza_despesa?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.programa?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.acao?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.paoe?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchIDU = filterIDU === "todos" || d.idu === filterIDU;
      return matchSearch && matchIDU;
    });
  }, [dotacoes, searchTerm, filterIDU]);

  // Totais
  const totais = useMemo(() => {
    const t = {
      inicial: 0, suplementado: 0, anulado: 0, atual: 0,
      bloqueado: 0, reserva: 0, ped: 0,
      empenhado: 0, liquidado: 0, em_liquidacao: 0, pago: 0,
      disponivel: 0, restos: 0,
    };
    filtered.forEach((d) => {
      t.inicial += d.valor_inicial || 0;
      t.suplementado += d.valor_suplementado || 0;
      t.anulado += d.valor_reduzido || 0;
      t.atual += d.valor_atual || 0;
      t.bloqueado += d.valor_bloqueado || 0;
      t.reserva += d.valor_reserva || 0;
      t.ped += d.valor_ped || 0;
      t.empenhado += d.valor_empenhado || 0;
      t.liquidado += d.valor_liquidado || 0;
      t.em_liquidacao += d.valor_em_liquidacao || 0;
      t.pago += d.valor_pago || 0;
      t.disponivel += d.saldo_disponivel || 0;
      t.restos += d.valor_restos_pagar || 0;
    });
    return t;
  }, [filtered]);

  // Parse number from string
  const parseNum = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    return parseFloat(String(val).replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
  };

  // Handle file upload for import
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Find header row
      const headerIdx = rows.findIndex(r => 
        r.some(c => String(c).includes("Natureza") || String(c).includes("Fonte"))
      );
      
      if (headerIdx === -1) {
        toast({ title: "Formato inválido", description: "Não foi possível encontrar o cabeçalho da planilha.", variant: "destructive" });
        return;
      }

      const headers = rows[headerIdx].map(h => String(h).trim());
      const dataRows = rows.slice(headerIdx + 1).filter(r => 
        r.length > 3 && !String(r[0] || "").toLowerCase().includes("total")
      );

      const preview = dataRows.map(row => {
        const get = (name: string) => {
          const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
          return idx >= 0 ? row[idx] : null;
        };

        return {
          programa: String(get("Programa") || ""),
          paoe: String(get("PAOE") || ""),
          regional: String(get("Regional") || ""),
          natureza: String(get("Natureza") || ""),
          fonte: String(get("Fonte") || ""),
          cod_acomp: String(get("Cod. Acomp") || "0000"),
          idu: String(get("IDU") || "Não"),
          tro: String(get("TRO") || "No"),
          inicial: parseNum(get("Inicial")),
          suplementado: parseNum(get("Suplementado")),
          anulado: parseNum(get("Anulado")),
          atual: parseNum(get("Atual")),
          bloqueado: parseNum(get("Bloqueado")),
          reserva: parseNum(get("Cont/Reserva") || get("Reserva")),
          ped: parseNum(get("PED")),
          empenhado: parseNum(get("Empenhado")),
          liquidado: parseNum(get("Liquidado")),
          em_liquidacao: parseNum(get("Valor em Liquidação") || get("Liquidação")),
          pago: parseNum(get("Pago")),
          disponivel: parseNum(get("Disponível")),
          restos: parseNum(get("Restos")),
        };
      });

      setImportPreview(preview);
      toast({ title: `${preview.length} linhas encontradas` });
    } catch (err: any) {
      toast({ title: "Erro ao ler arquivo", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  // Execute import
  const executeImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);

    try {
      // First, get or create naturezas and fontes
      const ex = parseInt(exercicio);

      // Get existing programa
      const { data: programas } = await supabase
        .from('fin_programas_orcamentarios')
        .select('id, codigo, nome')
        .eq('exercicio', ex);

      // Get existing naturezas
      const { data: naturezas } = await supabase
        .from('fin_naturezas_despesa')
        .select('id, codigo');

      // Get existing fontes
      const { data: fontes } = await supabase
        .from('fin_fontes_recurso')
        .select('id, codigo');

      let inserted = 0;
      let errors = 0;

      for (const row of importPreview) {
        try {
          // Extract programa code from string like "030 - Desenvolvimento..."
          const progCode = row.programa?.split(" - ")[0]?.trim();
          const paoeCode = row.paoe?.split(" - ")[0]?.trim();
          
          // Find or skip programa
          const prog = programas?.find(p => p.codigo === progCode);

          // Find natureza
          const nat = naturezas?.find(n => n.codigo === row.natureza);

          // Find fonte  
          const fonteCode = row.fonte?.replace(".", "");
          const fonte = fontes?.find(f => f.codigo === fonteCode || f.codigo === row.fonte);

          // Build codigo_dotacao
          const codigoDotacao = `${row.natureza}.${row.fonte}.${row.idu || 'Não'}`;

          const { error } = await supabase
            .from('fin_dotacoes')
            .insert({
              exercicio: ex,
              codigo_dotacao: codigoDotacao,
              paoe: row.paoe || null,
              regional: row.regional || null,
              cod_acompanhamento: row.cod_acomp || '0000',
              idu: row.idu || 'Não',
              tro: row.tro || 'No',
              programa_id: prog?.id || null,
              natureza_despesa_id: nat?.id || null,
              fonte_recurso_id: fonte?.id || null,
              valor_inicial: row.inicial || 0,
              valor_suplementado: row.suplementado || 0,
              valor_reduzido: row.anulado || 0,
              valor_bloqueado: row.bloqueado || 0,
              valor_reserva: row.reserva || 0,
              valor_ped: row.ped || 0,
              valor_empenhado: row.empenhado || 0,
              valor_liquidado: row.liquidado || 0,
              valor_em_liquidacao: row.em_liquidacao || 0,
              valor_pago: row.pago || 0,
              valor_restos_pagar: row.restos || 0,
              ativo: true,
            } as any);

          if (error) {
            console.error('Erro ao inserir dotação:', error);
            errors++;
          } else {
            inserted++;
          }
        } catch {
          errors++;
        }
      }

      toast({
        title: "Importação concluída",
        description: `${inserted} dotações importadas${errors > 0 ? `, ${errors} erros` : ""}.`,
      });

      setImportOpen(false);
      setImportPreview([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  // Export to XLSX
  const exportToXLSX = () => {
    if (!filtered.length) return;

    const exportData = filtered.map(d => ({
      "Programa": d.programa?.nome || "",
      "PAOE": d.paoe || "",
      "Regional": d.regional || "",
      "Natureza": d.natureza_despesa?.codigo || "",
      "Fonte": d.fonte_recurso?.codigo || "",
      "Cod. Acomp.": d.cod_acompanhamento || "",
      "IDU": d.idu || "",
      "TRO": d.tro || "",
      "Inicial": d.valor_inicial || 0,
      "Suplementado": d.valor_suplementado || 0,
      "Anulado": d.valor_reduzido || 0,
      "Atual": d.valor_atual || 0,
      "Bloqueado": d.valor_bloqueado || 0,
      "Cont/Reserva": d.valor_reserva || 0,
      "PED": d.valor_ped || 0,
      "Empenhado": d.valor_empenhado || 0,
      "Liquidado": d.valor_liquidado || 0,
      "Em Liquidação": d.valor_em_liquidacao || 0,
      "Pago": d.valor_pago || 0,
      "Disponível": d.saldo_disponivel || 0,
      "Restos a Pagar": d.valor_restos_pagar || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QDD");
    XLSX.writeFile(wb, `QDD_${exercicio}.xlsx`);
  };

  // IDU options from data
  const iduOptions = useMemo(() => {
    const set = new Set<string>();
    dotacoes?.forEach(d => { if (d.idu) set.add(d.idu); });
    return Array.from(set).sort();
  }, [dotacoes]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quadro de Detalhamento de Despesa
          </h1>
          <p className="text-muted-foreground">
            QDD - Exercício {exercicio} • {filtered.length} dotações
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={exercicio} onValueChange={setExercicio}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar QDD
          </Button>
          <Button variant="outline" size="sm" onClick={exportToXLSX}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" asChild>
            <Link to="/financeiro/alteracoes-orcamentarias">
              Alterações Orçamentárias
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Dotação Atual</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totais.atual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Empenhado</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totais.empenhado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pago</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Disponível</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totais.disponivel)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar natureza, programa, PAOE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {iduOptions.length > 1 && (
          <Select value={filterIDU} onValueChange={setFilterIDU}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar IDU" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos IDU</SelectItem>
              {iduOptions.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* QDD Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Programa / PAOE</TableHead>
                  <TableHead className="min-w-[80px]">Natureza</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Regional</TableHead>
                  <TableHead>IDU</TableHead>
                  <TableHead className="text-right min-w-[110px]">Inicial</TableHead>
                  <TableHead className="text-right min-w-[110px]">Suplementado</TableHead>
                  <TableHead className="text-right min-w-[110px]">Anulado</TableHead>
                  <TableHead className="text-right min-w-[110px] font-bold">Atual</TableHead>
                  <TableHead className="text-right min-w-[110px]">Bloqueado</TableHead>
                  <TableHead className="text-right min-w-[110px]">Reserva</TableHead>
                  <TableHead className="text-right min-w-[110px]">PED</TableHead>
                  <TableHead className="text-right min-w-[110px]">Empenhado</TableHead>
                  <TableHead className="text-right min-w-[110px]">Liquidado</TableHead>
                  <TableHead className="text-right min-w-[110px]">Em Liquid.</TableHead>
                  <TableHead className="text-right min-w-[110px]">Pago</TableHead>
                  <TableHead className="text-right min-w-[110px] font-bold">Disponível</TableHead>
                  <TableHead className="text-right min-w-[110px]">Restos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="text-xs">
                    <TableCell className="sticky left-0 bg-background z-10">
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{d.programa?.nome || d.paoe || "—"}</p>
                        <p className="text-muted-foreground truncate text-[10px]">
                          {d.acao?.nome || d.paoe || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{d.natureza_despesa?.codigo || "—"}</TableCell>
                    <TableCell className="font-mono">{d.fonte_recurso?.codigo || "—"}</TableCell>
                    <TableCell className="text-[10px]">{d.regional || "—"}</TableCell>
                    <TableCell>
                      {d.idu && d.idu !== "Não" ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{d.idu}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(d.valor_inicial)}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_suplementado ? formatCurrency(d.valor_suplementado) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_reduzido ? formatCurrency(d.valor_reduzido) : "—"}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(d.valor_atual)}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_bloqueado ? formatCurrency(d.valor_bloqueado) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_reserva ? formatCurrency(d.valor_reserva) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_ped ? formatCurrency(d.valor_ped) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_empenhado ? formatCurrency(d.valor_empenhado) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_liquidado ? formatCurrency(d.valor_liquidado) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_em_liquidacao ? formatCurrency(d.valor_em_liquidacao) : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{d.valor_pago ? formatCurrency(d.valor_pago) : "—"}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      <span className={d.saldo_disponivel < 0 ? "text-destructive" : ""}>
                        {formatCurrency(d.saldo_disponivel)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{d.valor_restos_pagar ? formatCurrency(d.valor_restos_pagar) : "—"}</TableCell>
                  </TableRow>
                ))}

                {/* Total Row */}
                {filtered.length > 0 && (
                  <TableRow className="text-xs font-bold bg-muted/50 border-t-2">
                    <TableCell className="sticky left-0 bg-muted/50 z-10">Total Geral</TableCell>
                    <TableCell colSpan={4}></TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.inicial)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.suplementado)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.anulado)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.atual)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.bloqueado)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.reserva)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.ped)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.empenhado)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.liquidado)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.em_liquidacao)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.pago)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.disponivel)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totais.restos)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma dotação encontrada</p>
              <p className="text-sm mt-1">Importe um arquivo QDD para carregar as dotações orçamentárias.</p>
              <Button variant="outline" className="mt-4" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar QDD
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar QDD
            </DialogTitle>
            <DialogDescription>
              Selecione um arquivo XLSX com o formato QDD padrão. As colunas esperadas são:
              Programa, PAOE, Regional, Natureza, Fonte, IDU, TRO, Inicial, Atual, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="max-w-sm mx-auto"
              />
            </div>

            {importPreview.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="font-medium">{importPreview.length} linhas prontas para importar</span>
                  <span className="text-muted-foreground">• Exercício {exercicio}</span>
                </div>

                <ScrollArea className="h-64 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Natureza</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>IDU</TableHead>
                        <TableHead className="text-right">Inicial</TableHead>
                        <TableHead className="text-right">Atual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 30).map((row, i) => (
                        <TableRow key={i} className="text-xs">
                          <TableCell className="font-mono">{row.natureza}</TableCell>
                          <TableCell className="font-mono">{row.fonte}</TableCell>
                          <TableCell>{row.idu}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(row.inicial)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(row.atual)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setImportPreview([]); }}>
                    Cancelar
                  </Button>
                  <Button onClick={executeImport} disabled={importing}>
                    {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Importar {importPreview.length} Dotações
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleLayout>
  );
}
