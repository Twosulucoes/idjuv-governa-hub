/**
 * QUADRO DE DETALHAMENTO DE DESPESA (QDD)
 * 
 * Visualização completa do orçamento no formato QDD padrão,
 * com importação do QDD do FIPLAN (PDF ou Excel, aqui ou em Atualizar dados) e exportação XLSX.
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import {
  BarraFiltros,
  ChipsFiltros,
  EmptyState,
  KpiCard,
  PageHeader,
  aplicarFiltros,
  useEstadoFiltros,
  type FiltroDef,
} from "@/components/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { ImportacaoWizard } from "@/components/importacao";
import { importadorQddFiplan } from "@/lib/importacao/importadores/qddFiplan";
import { agruparPorNatureza, ehEmenda, NOMES_EMENDA, resumirPorOrigem, rotuloOrigem } from "@/lib/financeiro/origemDotacao";
import { cn } from "@/lib/utils";
import type { Dotacao } from "@/types/financeiro";
import * as XLSX from "xlsx";

type ChaveValor =
  | "inicial" | "suplementado" | "anulado" | "atual" | "bloqueado" | "reserva" | "ped"
  | "empenhado" | "liquidado" | "em_liquidacao" | "pago" | "disponivel" | "restos";

interface ColunaValor {
  chave: ChaveValor;
  rotulo: string;
  valor: (d: Dotacao) => number;
  /** Aparece na visão "Resumo"; as demais só em "Completo". */
  resumo?: boolean;
  /** Atual e Disponível: as duas colunas que respondem "quanto tenho". */
  destaque?: boolean;
}

/** Colunas de valor do QDD, na ordem do FIPLAN. */
const COLUNAS_VALOR: ColunaValor[] = [
  { chave: "inicial", rotulo: "Inicial", valor: (d) => d.valor_inicial },
  { chave: "suplementado", rotulo: "Suplementado", valor: (d) => d.valor_suplementado },
  { chave: "anulado", rotulo: "Anulado", valor: (d) => d.valor_reduzido },
  { chave: "atual", rotulo: "Atual", valor: (d) => d.valor_atual, resumo: true, destaque: true },
  { chave: "bloqueado", rotulo: "Bloqueado", valor: (d) => d.valor_bloqueado },
  { chave: "reserva", rotulo: "Reserva", valor: (d) => d.valor_reserva, resumo: true },
  { chave: "ped", rotulo: "PED", valor: (d) => d.valor_ped, resumo: true },
  { chave: "empenhado", rotulo: "Empenhado", valor: (d) => d.valor_empenhado, resumo: true },
  { chave: "liquidado", rotulo: "Liquidado", valor: (d) => d.valor_liquidado },
  { chave: "em_liquidacao", rotulo: "Em liquidação", valor: (d) => d.valor_em_liquidacao },
  { chave: "pago", rotulo: "Pago", valor: (d) => d.valor_pago },
  { chave: "disponivel", rotulo: "Disponível", valor: (d) => d.saldo_disponivel, resumo: true, destaque: true },
  { chave: "restos", rotulo: "Restos a pagar", valor: (d) => d.valor_restos_pagar },
];

/** Subtotal por natureza só traz o que separa o livre do vinculado a emenda. */
const CHAVES_SUBTOTAL: Partial<Record<ChaveValor, "atual" | "bloqueado" | "reserva" | "empenhado" | "disponivel">> = {
  atual: "atual", bloqueado: "bloqueado", reserva: "reserva", empenhado: "empenhado", disponivel: "disponivel",
};

type VisaoColunas = "resumo" | "completo";
const CHAVE_VISAO = "qdd.visao-colunas";

function lerVisao(): VisaoColunas {
  try {
    return window.localStorage.getItem(CHAVE_VISAO) === "completo" ? "completo" : "resumo";
  } catch {
    return "resumo";
  }
}

/** Zero vira travessão para a linha não virar um mar de "R$ 0,00". */
const valorOuTraco = (v: number | null | undefined) => (v ? formatCurrency(v) : "—");

const percentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const codigoNome = (x?: { codigo?: string | null; nome?: string | null } | null) =>
  x?.codigo ? (x.nome ? `${x.codigo} - ${x.nome}` : x.codigo) : null;

const filtrosQdd: FiltroDef<Dotacao>[] = [
  { tipo: "lista", id: "origem", rotulo: "Origem", principal: true, valor: (d) => rotuloOrigem(d.idu) },
  { tipo: "lista", id: "natureza", rotulo: "Natureza", principal: true, valor: (d) => codigoNome(d.natureza_despesa) },
  { tipo: "lista", id: "fonte", rotulo: "Fonte", principal: true, valor: (d) => codigoNome(d.fonte_recurso) },
  { tipo: "booleano", id: "com_saldo", rotulo: "Com saldo disponível", principal: true, valor: (d) => Number(d.saldo_disponivel) > 0 },
  { tipo: "lista", id: "programa", rotulo: "Programa", valor: (d) => codigoNome(d.programa) },
  { tipo: "lista", id: "paoe", rotulo: "PAOE", valor: (d) => (d.paoe ? (d.acao?.nome ? `${d.paoe} - ${d.acao.nome}` : d.paoe) : null) },
  { tipo: "lista", id: "regional", rotulo: "Regional", valor: (d) => d.regional },
  { tipo: "booleano", id: "com_bloqueio", rotulo: "Com bloqueio", valor: (d) => Number(d.valor_bloqueado) > 0 },
  { tipo: "faixa", id: "disponivel", rotulo: "Saldo disponível", formato: "moeda", valor: (d) => Number(d.saldo_disponivel) },
];

export default function QDDPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { exercicio, setExercicio, comExercicio } = useExercicioFinanceiro();
  const [importOpen, setImportOpen] = useState(false);
  const [importando, setImportando] = useState(false);
  const filtros = useEstadoFiltros("financeiro.qdd", filtrosQdd);
  const [visao, setVisao] = useState<VisaoColunas>(lerVisao);
  const colunas = visao === "completo" ? COLUNAS_VALOR : COLUNAS_VALOR.filter((c) => c.resumo);
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
    return aplicarFiltros(dotacoes, filtros.definicoes, filtros.estado).filter((d) => {
      const matchSearch =
        !searchTerm ||
        d.codigo_dotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.natureza_despesa?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.programa?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.acao?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.paoe?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [dotacoes, searchTerm, filtros.definicoes, filtros.estado]);

  // Dotação comum × emendas, no exercício inteiro (não acompanha os filtros da tabela)
  const origem = useMemo(() => resumirPorOrigem(dotacoes ?? []), [dotacoes]);
  const grupos = useMemo(() => agruparPorNatureza(filtered), [filtered]);

  // Totais
  const totais = useMemo(() => {
    const t = Object.fromEntries(COLUNAS_VALOR.map((c) => [c.chave, 0])) as Record<ChaveValor, number>;
    filtered.forEach((d) => COLUNAS_VALOR.forEach((c) => { t[c.chave] += c.valor(d) || 0; }));
    return t;
  }, [filtered]);

  const mudarVisao = (v: string) => {
    if (v !== "resumo" && v !== "completo") return;
    setVisao(v);
    try { window.localStorage.setItem(CHAVE_VISAO, v); } catch { /* sem armazenamento: só não lembra */ }
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
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </ModuleLayout>
    );
  }

  // Célula compacta (densidade de tabela financeira) e coluna fixa à esquerda a partir do tablet
  // (repete o sm: porque TableCell/TableHead trazem sm:p-4 e o tailwind-merge não troca variantes diferentes)
  const celula = "px-3 py-2 sm:px-3 sm:py-2";
  const celulaValor = cn(celula, "text-right whitespace-nowrap");
  const colunaFixa = "sm:sticky sm:left-0 sm:z-10 sm:shadow-[1px_0_0_hsl(var(--border))]";

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        titulo="Quadro de Detalhamento de Despesa"
        descricao={
          <>
            <p>QDD do exercício {exercicio} · {filtered.length} {filtered.length === 1 ? "dotação" : "dotações"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-caption" aria-live="polite">
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {carregandoImportacao
                ? "Verificando a última importação do FIPLAN…"
                : ultimaImportacao
                  ? `Atualizado pelo FIPLAN em ${format(new Date(ultimaImportacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · ${ultimaImportacao.arquivo_nome}`
                  : `Ainda não importado do FIPLAN para ${exercicio}`}
            </p>
          </>
        }
        acoes={
          <>
            <SeletorExercicio />
            {podeImportar && (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                Importar QDD (FIPLAN)
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportToXLSX} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Exportar
            </Button>
          </>
        }
      />

      {/* Resumo do exercício */}
      <section aria-labelledby="qdd-indicadores">
        <h2 id="qdd-indicadores" className="sr-only">Resumo orçamentário de {exercicio}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard rotulo="Dotação atual" valor={formatCurrency(resumo?.dotacao_atual || 0)} icone={PieChart} carregando={carregandoResumo} />
          <KpiCard rotulo="Empenhado" valor={formatCurrency(resumo?.empenhado || 0)} icone={TrendingUp} carregando={carregandoResumo} />
          <KpiCard
            rotulo="Saldo disponível"
            valor={formatCurrency(resumo?.saldo_disponivel || 0)}
            detalhe="Dotação comum + emendas"
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
                  <p className="text-h1 tabular-nums text-foreground">{percentual.format(percentualExecutado)}%</p>
                  <Progress value={percentualExecutado} className="h-2" aria-labelledby="qdd-execucao" />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dotação comum × emendas: uma tabela só, para comparar coluna a coluna */}
      {(dotacoes?.length ?? 0) > 0 && (
        <section aria-labelledby="qdd-origem" className="space-y-3">
          <div className="space-y-1">
            <h2 id="qdd-origem" className="text-h3 text-foreground">Dotação comum e emendas</h2>
            <p className="text-body text-muted-foreground max-w-prose">
              O disponível de emenda é vinculado ao objeto da emenda. Para uma despesa comum, conte só com o disponível da dotação comum.
              Autor, objeto e beneficiário de cada emenda ficam em{" "}
              <Link className="underline underline-offset-2" to={comExercicio("/financeiro/emendas")}>Emendas parlamentares</Link>.
            </p>
          </div>
          <Card>
            <CardContent className="p-0 sm:p-0">
              <Table>
                <caption className="sr-only">Disponível da dotação comum e das emendas em {exercicio}</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className={cn(celula, "min-w-[200px]")}>Origem</TableHead>
                    <TableHead className={cn(celula, "text-right")}>Atual</TableHead>
                    <TableHead className={cn(celula, "text-right")}>Reservado</TableHead>
                    <TableHead className={cn(celula, "text-right")}>Empenhado</TableHead>
                    <TableHead className={cn(celula, "text-right text-foreground")}>Disponível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-primary/5 hover:bg-primary/10">
                    <TableCell className={celula}>
                      <p className="font-semibold text-foreground">Dotação comum (livre)</p>
                      <p className="text-caption text-muted-foreground">Pode ser usada em qualquer despesa da natureza</p>
                    </TableCell>
                    <TableCell className={celulaValor}>{formatCurrency(origem.comum.atual)}</TableCell>
                    <TableCell className={celulaValor}>{valorOuTraco(origem.comum.reserva)}</TableCell>
                    <TableCell className={celulaValor}>{valorOuTraco(origem.comum.empenhado)}</TableCell>
                    <TableCell className={cn(celulaValor, "text-base font-semibold text-foreground", origem.comum.disponivel < 0 && "text-destructive")}>
                      {formatCurrency(origem.comum.disponivel)}
                    </TableCell>
                  </TableRow>
                  {origem.porTipo.map(({ idu, totais }) => (
                    <TableRow key={idu}>
                      <TableCell className={celula}>{rotuloOrigem(idu)}</TableCell>
                      <TableCell className={celulaValor}>{formatCurrency(totais.atual)}</TableCell>
                      <TableCell className={celulaValor}>{valorOuTraco(totais.reserva)}</TableCell>
                      <TableCell className={celulaValor}>{valorOuTraco(totais.empenhado)}</TableCell>
                      <TableCell className={cn(celulaValor, "font-semibold", totais.disponivel < 0 && "text-destructive")}>
                        {formatCurrency(totais.disponivel)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {origem.porTipo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className={cn(celula, "text-muted-foreground")}>Nenhuma emenda no QDD de {exercicio}.</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className={celula}>Total de emendas (vinculado ao objeto)</TableCell>
                      <TableCell className={celulaValor}>{formatCurrency(origem.emendas.atual)}</TableCell>
                      <TableCell className={celulaValor}>{valorOuTraco(origem.emendas.reserva)}</TableCell>
                      <TableCell className={celulaValor}>{valorOuTraco(origem.emendas.empenhado)}</TableCell>
                      <TableCell className={celulaValor}>{formatCurrency(origem.emendas.disponivel)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Dotações */}
      <section aria-labelledby="qdd-dotacoes" className="space-y-3">
        <h2 id="qdd-dotacoes" className="sr-only">Dotações do QDD</h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar natureza, programa, PAOE..."
              aria-label="Buscar natureza, programa ou PAOE"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <BarraFiltros filtros={filtros.definicoes} dados={dotacoes ?? []} estado={filtros.estado} aoMudar={filtros.aoMudar} />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={visao}
            onValueChange={mudarVisao}
            aria-label="Colunas da tabela"
            className="justify-start lg:ml-auto"
          >
            <ToggleGroupItem value="resumo" title="Atual, reserva, PED, empenhado e disponível">Resumo</ToggleGroupItem>
            <ToggleGroupItem value="completo" title="Todas as colunas do QDD do FIPLAN">Todas as colunas</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ChipsFiltros
          filtros={filtros.definicoes}
          estado={filtros.estado}
          aoMudar={filtros.aoMudar}
          contagem={{ visiveis: filtered.length, total: dotacoes?.length ?? 0, rotulo: "dotações" }}
        />

        <Card>
          <CardContent className="p-0 sm:p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icone={FileSpreadsheet}
                titulo={dotacoes?.length ? "Nenhuma dotação com esses filtros" : "Nenhuma dotação encontrada"}
                descricao={
                  dotacoes?.length
                    ? "Limpe a busca ou os filtros."
                    : "Importe o QDD do FIPLAN (PDF ou Excel) para carregar as dotações orçamentárias."
                }
                acao={!dotacoes?.length && podeImportar ? (
                  <Button variant="outline" onClick={() => setImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                    Importar QDD (FIPLAN)
                  </Button>
                ) : undefined}
              />
            ) : (
              <>
                <Table>
                  <caption className="sr-only">Dotações do QDD de {exercicio}, agrupadas por natureza e fonte</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(celula, colunaFixa, "min-w-[168px] bg-card")}>Programa / ação</TableHead>
                      <TableHead className={celula}>Natureza / fonte</TableHead>
                      {visao === "completo" && <TableHead className={celula}>Regional</TableHead>}
                      <TableHead className={celula}>Origem</TableHead>
                      {colunas.map((c) => (
                        <TableHead key={c.chave} className={cn(celula, "text-right", c.destaque && "text-foreground")}>
                          {c.rotulo}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupos.map((g) => (
                      <Fragment key={g.chave}>
                        {g.dotacoes.map((d) => (
                          <TableRow key={d.id} className="group">
                            <TableCell className={cn(celula, colunaFixa, "bg-card group-hover:bg-muted")}>
                              <div className="max-w-[168px]" title={[d.programa?.nome, d.acao?.nome].filter(Boolean).join(" · ")}>
                                <p className="font-medium truncate">{d.programa?.nome || d.paoe || "—"}</p>
                                <p className="text-caption text-muted-foreground truncate">
                                  {d.paoe ? `PAOE ${d.paoe}` : ""}{d.paoe && d.acao?.nome ? " · " : ""}{d.acao?.nome || ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className={cn(celula, "whitespace-nowrap")}>
                              <p>{d.natureza_despesa?.codigo || "—"}</p>
                              <p className="text-caption text-muted-foreground">fonte {d.fonte_recurso?.codigo || "—"}</p>
                            </TableCell>
                            {visao === "completo" && <TableCell className={celula}>{d.regional || "—"}</TableCell>}
                            <TableCell className={cn(celula, "whitespace-nowrap")}>
                              {ehEmenda(d.idu) ? (
                                <Badge variant="secondary" title={rotuloOrigem(d.idu)}>
                                  <span className="sr-only">Emenda </span>{d.idu}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">Comum</span>
                              )}
                            </TableCell>
                            {colunas.map((c) => {
                              const v = c.valor(d);
                              return (
                                <TableCell
                                  key={c.chave}
                                  className={cn(celulaValor, c.destaque && "font-semibold", c.chave === "disponivel" && v < 0 && "text-destructive")}
                                >
                                  {c.destaque ? formatCurrency(v) : valorOuTraco(v)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                        {g.subtotal && (
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={visao === "completo" ? 4 : 3} className={celula}>
                              <p className="font-semibold">Subtotal {g.natureza} · fonte {g.fonte}</p>
                              <p className="text-caption text-muted-foreground">
                                Livre (dotação comum): {formatCurrency(g.disponivelComum)} · vinculado a emendas: {formatCurrency(g.subtotal.disponivel - g.disponivelComum)}
                              </p>
                            </TableCell>
                            {colunas.map((c) => {
                              const chave = CHAVES_SUBTOTAL[c.chave];
                              return (
                                <TableCell key={c.chave} className={cn(celulaValor, "font-semibold")}>
                                  {chave ? (c.destaque ? formatCurrency(g.subtotal![chave]) : valorOuTraco(g.subtotal![chave])) : ""}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        )}
                      </Fragment>
                    ))}

                    <TableRow className="bg-muted hover:bg-muted border-t-2 font-semibold">
                      <TableCell className={cn(celula, colunaFixa, "bg-muted")}>Total geral</TableCell>
                      <TableCell colSpan={visao === "completo" ? 3 : 2} className={celula}></TableCell>
                      {colunas.map((c) => (
                        <TableCell key={c.chave} className={celulaValor}>{formatCurrency(totais[c.chave])}</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>

                <p className="border-t px-4 py-3 text-caption text-muted-foreground">
                  Origem (coluna IDU do FIPLAN): "Não" é dotação comum;{" "}
                  {Object.entries(NOMES_EMENDA).map(([sigla, nome]) => `${sigla}: ${nome.toLowerCase()}`).join("; ")}.
                  {visao === "resumo" && " Inicial, suplementado, anulado, bloqueado, liquidado, em liquidação, pago e restos a pagar ficam em \"Todas as colunas\" e no Exportar."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => (open || !importando) && setImportOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
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
