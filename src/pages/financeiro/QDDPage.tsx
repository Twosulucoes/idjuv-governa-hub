/**
 * QUADRO DE DETALHAMENTO DE DESPESA (QDD)
 * 
 * Visualização completa do orçamento no formato QDD padrão,
 * com importação do PDF do FIPLAN (Central de Importações) e exportação XLSX.
 * 
 * @version 1.0.0
 */

import { useState, useMemo } from "react";
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
import {
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  PieChart,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import { useDotacoes } from "@/hooks/useFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
import { ImportacaoWizard } from "@/components/importacao";
import { importadorQddFiplan } from "@/lib/importacao/importadores/qddFiplan";
import * as XLSX from "xlsx";

export default function QDDPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [exercicio, setExercicio] = useState(new Date().getFullYear().toString());
  const [importOpen, setImportOpen] = useState(false);
  const [importando, setImportando] = useState(false);
  const [filterIDU, setFilterIDU] = useState("todos");
  const { hasPermission } = useAuth();
  const podeImportar = hasPermission(importadorQddFiplan.permissao);

  // Exercícios: o próximo (o QDD do ano seguinte sai antes da virada) até 2024
  const exercicios = useMemo(() => {
    const proximo = new Date().getFullYear() + 1;
    return Array.from({ length: proximo - 2024 + 1 }, (_, i) => String(proximo - i));
  }, []);

  const { data: dotacoes, isLoading } = useDotacoes(parseInt(exercicio));

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
              {exercicios.map((ano) => (
                <SelectItem key={ano} value={ano}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {podeImportar && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar QDD (FIPLAN)
            </Button>
          )}
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
              <p className="text-sm mt-1">Importe o PDF do QDD do FIPLAN para carregar as dotações orçamentárias.</p>
              {podeImportar && (
                <Button variant="outline" className="mt-4" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar QDD (FIPLAN)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => (open || !importando) && setImportOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar QDD do FIPLAN
            </DialogTitle>
            <DialogDescription>{importadorQddFiplan.descricao}</DialogDescription>
          </DialogHeader>
          <ImportacaoWizard
            importador={importadorQddFiplan}
            onOcupadoChange={setImportando}
            onConcluido={(_, parametros) => {
              if (typeof parametros.exercicio === "number") setExercicio(String(parametros.exercicio));
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
    </ModuleLayout>
  );
}
