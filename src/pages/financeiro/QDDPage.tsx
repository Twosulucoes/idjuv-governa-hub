/**
 * QUADRO DE DETALHAMENTO DE DESPESA (QDD)
 * 
 * Visualização completa do orçamento no formato QDD padrão,
 * com importação do QDD do FIPLAN (PDF ou Excel, Central de Importações) e exportação XLSX.
 * A dotação comum e as emendas (IDU) aparecem separadas: o saldo de emenda é vinculado
 * ao objeto da emenda e não se soma ao saldo livre da natureza.
 * 
 * @version 1.0.0
 */

import { Fragment, useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  PieChart,
  TrendingUp,
  PiggyBank,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";
import { useDotacoes, useResumoOrcamentario, useUltimaImportacaoQdd } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { KpiCard } from "@/components/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { ImportacaoWizard } from "@/components/importacao";
import { importadorQddFiplan } from "@/lib/importacao/importadores/qddFiplan";
import { agruparPorNatureza, ehEmenda, NOMES_EMENDA, resumirPorOrigem, rotuloOrigem } from "@/lib/financeiro/origemDotacao";
import * as XLSX from "xlsx";

export default function QDDPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { exercicio, setExercicio, comExercicio } = useExercicioFinanceiro();
  const [importOpen, setImportOpen] = useState(false);
  const [importando, setImportando] = useState(false);
  /** "todos", "comum", "emendas" ou a sigla de uma emenda (ECI, EII...) */
  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const { hasPermission } = useAuth();
  const podeImportar = hasPermission(importadorQddFiplan.permissao);

  const { data: dotacoes, isLoading } = useDotacoes(exercicio);
  // Resumo do exercício inteiro (não acompanha os filtros da tabela)
  const { data: resumo, isLoading: carregandoResumo } = useResumoOrcamentario(exercicio);
  const { data: ultimaImportacao, isLoading: carregandoImportacao } = useUltimaImportacaoQdd(exercicio);
  const percentualExecutado = resumo?.percentual_executado || 0;

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
      const matchOrigem =
        filtroOrigem === "todos" ||
        (filtroOrigem === "comum" && !ehEmenda(d.idu)) ||
        (filtroOrigem === "emendas" && ehEmenda(d.idu)) ||
        (ehEmenda(d.idu) && d.idu?.trim() === filtroOrigem);
      return matchSearch && matchOrigem;
    });
  }, [dotacoes, searchTerm, filtroOrigem]);

  // Dotação comum × emendas, no exercício inteiro (não acompanha os filtros da tabela)
  const origem = useMemo(() => resumirPorOrigem(dotacoes ?? []), [dotacoes]);
  const grupos = useMemo(() => agruparPorNatureza(filtered), [filtered]);

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
      "Origem": rotuloOrigem(d.idu),
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
          <p className="mt-1 flex items-center gap-1.5 text-caption text-muted-foreground" aria-live="polite">
            <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {carregandoImportacao
              ? "Verificando a última importação do FIPLAN…"
              : ultimaImportacao
                ? `Atualizado pelo FIPLAN em ${format(new Date(ultimaImportacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · ${ultimaImportacao.arquivo_nome}`
                : `Ainda não importado do FIPLAN para ${exercicio}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SeletorExercicio />
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
            <Link to={comExercicio("/financeiro/alteracoes-orcamentarias")}>
              Alterações Orçamentárias
            </Link>
          </Button>
        </div>
      </div>

      {/* Resumo do exercício */}
      <section aria-labelledby="qdd-indicadores">
        <h2 id="qdd-indicadores" className="sr-only">Resumo orçamentário de {exercicio}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard rotulo="Dotação atual" valor={formatCurrency(resumo?.dotacao_atual || 0)} icone={PieChart} carregando={carregandoResumo} />
          <KpiCard rotulo="Empenhado" valor={formatCurrency(resumo?.empenhado || 0)} icone={TrendingUp} carregando={carregandoResumo} />
          <KpiCard
            rotulo="Saldo disponível (comum + emendas)"
            valor={formatCurrency(resumo?.saldo_disponivel || 0)}
            icone={PiggyBank}
            carregando={carregandoResumo}
          />
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-body text-muted-foreground" id="qdd-execucao">Execução (pago / dotação)</p>
              {carregandoResumo ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <p className="text-h1 tabular-nums text-foreground">{percentualExecutado.toFixed(1)}%</p>
                  <Progress value={percentualExecutado} className="h-2" aria-labelledby="qdd-execucao" />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dotação comum × emendas */}
      {(dotacoes?.length ?? 0) > 0 && (
        <section aria-labelledby="qdd-origem" className="space-y-3">
          <div>
            <h2 id="qdd-origem" className="text-h3 font-semibold text-foreground">Dotação comum e emendas</h2>
            <p className="text-body text-muted-foreground">
              O disponível de emenda é vinculado ao objeto da emenda. Para uma despesa comum, conte só com o disponível da dotação comum.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <KpiCard
              rotulo="Disponível da dotação comum (livre)"
              valor={formatCurrency(origem.comum.disponivel)}
              detalhe={`Atual ${formatCurrency(origem.comum.atual)} · reservado ${formatCurrency(origem.comum.reserva)} · empenhado ${formatCurrency(origem.comum.empenhado)}`}
              icone={PiggyBank}
            />
            <Card className="lg:col-span-2">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Emendas (disponível vinculado ao objeto)</TableHead>
                      <TableHead className="text-right">Atual</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Empenhado</TableHead>
                      <TableHead className="text-right font-bold">Disponível</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {origem.porTipo.map(({ idu, totais }) => (
                      <TableRow key={idu} className="text-xs">
                        <TableCell>{rotuloOrigem(idu)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totais.atual)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totais.reserva)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totais.empenhado)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{formatCurrency(totais.disponivel)}</TableCell>
                      </TableRow>
                    ))}
                    {origem.porTipo.length === 0 ? (
                      <TableRow className="text-xs">
                        <TableCell colSpan={5} className="text-muted-foreground">Nenhuma emenda no QDD de {exercicio}.</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow className="text-xs font-bold bg-muted/50">
                        <TableCell>Total de emendas</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(origem.emendas.atual)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(origem.emendas.reserva)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(origem.emendas.empenhado)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(origem.emendas.disponivel)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

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
        {origem.porTipo.length > 0 && (
          <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
            <SelectTrigger className="w-full sm:w-72" aria-label="Filtrar por origem">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Comum e emendas</SelectItem>
              <SelectItem value="comum">Só dotação comum</SelectItem>
              <SelectItem value="emendas">Só emendas</SelectItem>
              {origem.porTipo.map(({ idu }) => (
                <SelectItem key={idu} value={idu}>{rotuloOrigem(idu)}</SelectItem>
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
                  <TableHead>Origem (IDU)</TableHead>
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
                {grupos.map((g) => (
                  <Fragment key={g.chave}>
                  {g.dotacoes.map((d) => (
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
                      {ehEmenda(d.idu) ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0" title={rotuloOrigem(d.idu)}>
                          Emenda {d.idu}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Comum</span>
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
                  {g.subtotal && (
                    <TableRow className="text-xs font-semibold bg-muted/30">
                      <TableCell colSpan={5}>
                        Subtotal {g.natureza} · fonte {g.fonte}
                        <span className="block font-normal text-muted-foreground">
                          Livre (dotação comum): {formatCurrency(g.disponivelComum)} · vinculado a emendas: {formatCurrency(g.subtotal.disponivel - g.disponivelComum)}
                        </span>
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(g.subtotal.atual)}</TableCell>
                      <TableCell className="text-right font-mono">{g.subtotal.bloqueado ? formatCurrency(g.subtotal.bloqueado) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{g.subtotal.reserva ? formatCurrency(g.subtotal.reserva) : "—"}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-mono">{g.subtotal.empenhado ? formatCurrency(g.subtotal.empenhado) : "—"}</TableCell>
                      <TableCell colSpan={3}></TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(g.subtotal.disponivel)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  </Fragment>
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

          {filtered.length > 0 && (
            <p className="border-t px-4 py-3 text-caption text-muted-foreground">
              Origem (coluna IDU do FIPLAN): "Não" é dotação comum;{" "}
              {Object.entries(NOMES_EMENDA).map(([sigla, nome]) => `${sigla}: ${nome.toLowerCase()}`).join("; ")}.
            </p>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma dotação encontrada</p>
              <p className="text-sm mt-1">Importe o QDD do FIPLAN (PDF ou Excel) para carregar as dotações orçamentárias.</p>
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
              if (typeof parametros.exercicio === "number") setExercicio(parametros.exercicio);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
    </ModuleLayout>
  );
}
