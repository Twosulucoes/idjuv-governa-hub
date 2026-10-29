/**
 * Detalhe do empenho: dados, valores e, no empenho importado do FIPLAN (FIP 614), o histórico de
 * liquidações, NOBs, GCVs e estornos. Quando o relatório não deixa saber o IDU, a dotação é escolhida
 * aqui entre as do QDD com a mesma classificação. Empenho em dotação de emenda é ligado à emenda que executa.
 * Spec docs/superpowers/specs/2026-10-22-importacao-empenhos-fip614-design.md.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileSearch, Info, ScrollText } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, EmptyState, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDefinirDotacaoEmpenho,
  useDocumentosEmpenhoFiplan,
  useDotacoesCandidatasEmpenho,
  useEmpenhoDetalhe,
} from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { useDefinirEmendaEmpenho, useEmendas } from "@/hooks/useEmendas";
import { useAuth } from "@/contexts/AuthContext";
import { ehEmenda, rotuloOrigem } from "@/lib/financeiro/origemDotacao";
import { dataBR } from "@/lib/bancario/exibicao";
import { formatCurrency } from "@/lib/formatters";
import type { DocumentoEmpenhoFiplan, StatusEmpenho } from "@/types/financeiro";

const SITUACAO: Record<StatusEmpenho, { label: string; tom: TomStatus }> = {
  emitido: { label: "Emitido", tom: "andamento" },
  parcialmente_liquidado: { label: "Parcialmente liquidado", tom: "pendente" },
  liquidado: { label: "Liquidado", tom: "andamento" },
  parcialmente_pago: { label: "Parcialmente pago", tom: "pendente" },
  pago: { label: "Pago", tom: "sucesso" },
  anulado: { label: "Anulado", tom: "erro" },
};

const TIPO_DOCUMENTO: Record<DocumentoEmpenhoFiplan["tipo"], string> = {
  EMP: "Empenho",
  EST: "Estorno",
  LIQ: "Liquidação",
  NOB: "Ordem bancária",
  GCV: "Guia de crédito",
};

/** Valor numa coluna do FIP 614; no estorno, o valor sai da coluna (sinal de menos). */
function valorColuna(d: DocumentoEmpenhoFiplan, v: number | null) {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  const n = Number(v);
  const negativo = d.tipo === "EST" ? n > 0 : n < 0;
  return (
    <span className={`tabular-nums ${negativo ? "text-destructive" : ""}`}>
      {negativo ? "− " : ""}
      {formatCurrency(Math.abs(n))}
    </span>
  );
}

const colunasDocumentos: ColunaTabela<DocumentoEmpenhoFiplan>[] = [
  {
    id: "documento",
    cabecalho: "Documento",
    celula: (d) => (
      <span>
        <span className="font-medium">{TIPO_DOCUMENTO[d.tipo]}</span>
        {d.pc && <span className="text-muted-foreground"> · {d.pc === "P" ? "pagamento" : "consignação"}</span>}
        <span className="block font-mono text-xs text-muted-foreground">{d.numero}</span>
      </span>
    ),
    mobile: "titulo",
  },
  { id: "data", cabecalho: "Data", celula: (d) => dataBR(d.data) },
  { id: "emp", cabecalho: "Empenho", celula: (d) => valorColuna(d, d.valor_emp), alinhamento: "direita" },
  { id: "liq", cabecalho: "Liquidado", celula: (d) => valorColuna(d, d.valor_liq), alinhamento: "direita" },
  { id: "nob", cabecalho: "Pago (NOB)", celula: (d) => valorColuna(d, d.valor_nob), alinhamento: "direita" },
  { id: "gcv", cabecalho: "GCV", celula: (d) => valorColuna(d, d.valor_gcv), alinhamento: "direita" },
  {
    id: "historico",
    cabecalho: "Histórico",
    celula: (d) =>
      d.historico ? (
        <span className="block max-w-[320px] text-xs" title={d.historico}>
          {d.historico}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Moeda({ valor, destaque }: { valor: number | null | undefined; destaque?: boolean }) {
  return <span className={`tabular-nums ${destaque ? "font-medium" : ""}`}>{formatCurrency(Number(valor ?? 0))}</span>;
}

export default function EmpenhoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { comExercicio } = useExercicioFinanceiro();
  const empenho = useEmpenhoDetalhe(id);
  const e = empenho.data;
  const doFiplan = e?.origem === "fiplan";
  const documentos = useDocumentosEmpenhoFiplan(doFiplan ? id : undefined);
  const candidatas = useDotacoesCandidatasEmpenho(e);
  const definirDotacao = useDefinirDotacaoEmpenho();
  const [escolhida, setEscolhida] = useState<string>("");
  const emendasDoAno = useEmendas(e?.exercicio);
  const definirEmenda = useDefinirEmendaEmpenho();
  const { hasPermission } = useAuth();

  const migalhas = [
    { rotulo: "Financeiro", href: comExercicio("/financeiro") },
    { rotulo: "Empenhos", href: comExercicio("/financeiro/empenhos") },
    { rotulo: e?.numero ?? "Empenho" },
  ];

  if (empenho.isLoading) {
    return (
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <PageHeader migalhas={migalhas} titulo="Empenho" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (empenho.isError || !e) {
    return (
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <PageHeader migalhas={migalhas} titulo="Empenho" />
          <Card>
            <EmptyState
              icone={FileSearch}
              titulo={empenho.isError ? "Não foi possível carregar o empenho" : "Empenho não encontrado"}
              descricao={empenho.isError ? "Tente de novo em instantes." : "O empenho não existe ou você não tem acesso a ele."}
              acao={
                <Button asChild>
                  <Link to={comExercicio("/financeiro/empenhos")}>Voltar para empenhos</Link>
                </Button>
              }
              className="py-12"
            />
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  const situacao = SITUACAO[e.status];
  const credor = e.fornecedor?.razao_social ?? e.credor_nome ?? "Sem favorecido";
  const opcoes = candidatas.data ?? [];
  const escolherDotacao = doFiplan && opcoes.length > 1;
  const dotacaoSelecionada = opcoes.find((d) => d.id === (escolhida || e.dotacao_id));
  const emDotacaoDeEmenda = !!e.dotacao && ehEmenda(e.dotacao.idu);
  const emendasDaDotacao = (emendasDoAno.data ?? []).filter((x) => x.dotacao_id === e.dotacao_id);

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={migalhas}
          titulo={<span className="font-mono">{e.numero}</span>}
          status={
            <span className="flex flex-wrap items-center gap-2">
              {situacao ? <StatusBadge tom={situacao.tom}>{situacao.label}</StatusBadge> : <StatusBadge tom="neutro">{e.status}</StatusBadge>}
              {doFiplan && <Badge variant="outline">FIPLAN</Badge>}
            </span>
          }
          descricao={credor}
        />

        {doFiplan && (
          <Alert>
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>Empenho importado do FIPLAN</AlertTitle>
            <AlertDescription>
              Os valores vêm do relatório FIP 614
              {e.data_referencia_fiplan ? ` com data de referência ${dataBR(e.data_referencia_fiplan)}` : ""}. Para atualizar,
              importe um FIP 614 mais recente na Central de Importações.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Dados do empenho</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <Campo rotulo="Exercício">{e.exercicio}</Campo>
                <Campo rotulo="Data do empenho">{dataBR(e.data_empenho)}</Campo>
                <Campo rotulo="Processo SEI">{e.processo_sei ? <span className="font-mono">{e.processo_sei}</span> : "—"}</Campo>
                {doFiplan && (
                  <Campo rotulo="PED">
                    <span className="font-mono">{e.ped_numero ?? "—"}</span>
                    {e.ped_data && <span className="block text-xs text-muted-foreground">{dataBR(e.ped_data)}</span>}
                  </Campo>
                )}
                <Campo rotulo="Credor">
                  {e.fornecedor?.razao_social ?? e.credor_nome ?? "—"}
                  {e.credor_codigo_fiplan && (
                    <span className="block font-mono text-xs text-muted-foreground">FIPLAN {e.credor_codigo_fiplan}</span>
                  )}
                  {doFiplan && !e.fornecedor_id && (
                    <span className="block text-xs text-muted-foreground">Sem favorecido ligado (informe o código do FIPLAN no favorecido)</span>
                  )}
                </Campo>
                <Campo rotulo="Natureza">
                  {e.natureza_despesa ? `${e.natureza_despesa.codigo} - ${e.natureza_despesa.nome}` : "—"}
                </Campo>
                <Campo rotulo="Fonte">{e.fonte_recurso ? `${e.fonte_recurso.codigo} - ${e.fonte_recurso.nome}` : "—"}</Campo>
                <div className="sm:col-span-3">
                  <Campo rotulo="Dotação">
                    {e.dotacao ? (
                      <span className="font-mono text-xs">{e.dotacao.codigo_dotacao}</span>
                    ) : (
                      <span className="text-warning">Não definida</span>
                    )}
                    {doFiplan && e.dotacao_fiplan && (
                      <span className="block font-mono text-xs text-muted-foreground">No FIPLAN: {e.dotacao_fiplan}</span>
                    )}
                  </Campo>
                </div>
                <div className="sm:col-span-3">
                  <Campo rotulo="Objeto">{e.objeto}</Campo>
                </div>
                {e.observacoes && (
                  <div className="sm:col-span-3">
                    <Campo rotulo="Observações">{e.observacoes}</Campo>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <Campo rotulo="Empenhado"><Moeda valor={e.valor_empenhado} /></Campo>
                <Campo rotulo="Estornado"><Moeda valor={e.valor_anulado} /></Campo>
                <Campo rotulo="Liquidado"><Moeda valor={e.valor_liquidado} /></Campo>
                <Campo rotulo="Pago"><Moeda valor={e.valor_pago} /></Campo>
                <Campo rotulo="Saldo a liquidar"><Moeda valor={e.saldo_liquidar} destaque /></Campo>
                <Campo rotulo="A pagar"><Moeda valor={e.saldo_pagar} destaque /></Campo>
              </dl>
            </CardContent>
          </Card>
        </div>

        {escolherDotacao && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dotação do empenho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O FIP 614 em PDF não traz o IDU, e o QDD tem {opcoes.length} dotações com essa classificação. Escolha a do
                empenho (a escolha é mantida quando um FIP 614 novo for importado).
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={escolhida || e.dotacao_id || ""} onValueChange={setEscolhida}>
                  <SelectTrigger className="w-full sm:w-[420px]" aria-label="Dotação do empenho">
                    <SelectValue placeholder="Escolha a dotação" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        IDU {d.idu ?? "—"} · empenhado {formatCurrency(Number(d.valor_empenhado ?? 0))} de{" "}
                        {formatCurrency(Number(d.valor_atual ?? 0))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => dotacaoSelecionada && definirDotacao.mutate({ empenhoId: e.id, dotacao: dotacaoSelecionada })}
                  disabled={!dotacaoSelecionada || dotacaoSelecionada.id === e.dotacao_id || definirDotacao.isPending}
                >
                  {definirDotacao.isPending ? "Salvando..." : "Definir dotação"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {emDotacaoDeEmenda && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emenda do empenho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O empenho está numa dotação de {rotuloOrigem(e.dotacao?.idu).toLowerCase()}. Diga qual emenda ele executa: o
                empenhado entra no saldo dela, em{" "}
                <Link className="underline" to={comExercicio("/financeiro/emendas")}>
                  Emendas parlamentares
                </Link>
                .
              </p>
              {emendasDaDotacao.length === 0 ? (
                <p className="text-sm">Nenhuma emenda cadastrada nesta dotação.</p>
              ) : (
                <Select
                  value={e.emenda_id ?? "nenhuma"}
                  onValueChange={(v) => definirEmenda.mutate({ empenhoId: e.id, emendaId: v === "nenhuma" ? null : v })}
                  disabled={!hasPermission("orcamento.criar") || definirEmenda.isPending}
                >
                  <SelectTrigger className="w-full sm:w-[420px]" aria-label="Emenda do empenho">
                    <SelectValue placeholder="Escolha a emenda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Sem emenda definida</SelectItem>
                    {emendasDaDotacao.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.numero} · {x.autor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {doFiplan && (
          <section className="space-y-3" aria-labelledby="historico-fiplan">
            <h2 id="historico-fiplan" className="text-lg font-semibold">
              Histórico no FIPLAN
            </h2>
            <DataTable
              rotulo="Documentos do FIPLAN do empenho"
              dados={documentos.data ?? []}
              colunas={colunasDocumentos}
              chaveLinha={(d) => d.id}
              carregando={documentos.isLoading}
              erro={documentos.isError ? "Não foi possível carregar o histórico." : null}
              aoTentarNovamente={() => documentos.refetch()}
              vazio={{
                icone: ScrollText,
                titulo: "Sem documentos",
                descricao: "O FIP 614 importado não trouxe documentos para este empenho.",
              }}
            />
          </section>
        )}
      </div>
    </ModuleLayout>
  );
}
