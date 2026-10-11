/**
 * Detalhe do pagamento: dados da ordem de pagamento e o histórico bancário ligado a ela
 * (remessa, retorno e reenvio lidos dos arquivos do banco, e lançamentos de extrato do BB).
 * Spec docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (etapa 1, detalhe do pagamento).
 */

import { Link, useParams } from "react-router-dom";
import { Banknote, FileSearch, Landmark } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, EmptyState, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { SituacaoMovimentoBadge } from "@/components/financeiro/conciliacao/movimentoUi";
import {
  ROTULO_ORIGEM_ARQUIVO,
  contaFavorecido,
  dataBR,
  documentoMascarado,
  rotuloTipoLancamento,
} from "@/lib/bancario/exibicao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExtratoDoPagamento,
  useMovimentosDoPagamento,
  usePagamentoDetalhe,
} from "@/hooks/useConciliacaoBancaria";
import { formatCurrency } from "@/lib/formatters";
import { STATUS_PAGAMENTO_LABELS, type StatusPagamento } from "@/types/financeiro";
import type { LancamentoExtrato, MovimentoBancario } from "@/types/conciliacaoBancaria";

const TOM_STATUS: Record<StatusPagamento, TomStatus> = {
  programado: "pendente",
  autorizado: "andamento",
  pago: "sucesso",
  devolvido: "erro",
  estornado: "erro",
  cancelado: "neutro",
};

const colunasMovimentos: ColunaTabela<MovimentoBancario>[] = [
  {
    id: "registrado",
    cabecalho: "Registrado em",
    celula: (m) => dataBR(m.created_at),
    ordenarPor: (m) => m.created_at,
  },
  {
    id: "arquivo",
    cabecalho: "Arquivo",
    celula: (m) => (
      <span className="text-xs">
        {ROTULO_ORIGEM_ARQUIVO[m.origem] ?? m.origem} · {m.sentido}
        {m.data_arquivo ? ` de ${dataBR(m.data_arquivo)}` : ""}
        <span className="block text-muted-foreground">{rotuloTipoLancamento(m.tipo_lancamento)}</span>
      </span>
    ),
    mobile: "titulo",
  },
  {
    id: "identificador",
    cabecalho: "OB / seu número",
    celula: (m) => <span className="font-mono">{m.identificador}</span>,
  },
  {
    id: "conta",
    cabecalho: "Banco / agência / conta",
    celula: (m) => <span className="font-mono text-xs">{contaFavorecido(m)}</span>,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (m) => <span className="tabular-nums">{formatCurrency(Number(m.valor))}</span>,
    alinhamento: "direita",
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (m) => (
      <span className="space-y-1">
        <SituacaoMovimentoBadge situacao={m.situacao} />
        {m.motivo_recusa && <span className="block text-xs text-muted-foreground">{m.motivo_recusa}</span>}
        {m.reenviado_em && <span className="block text-xs text-muted-foreground">Reenviado em {dataBR(m.reenviado_em)}</span>}
      </span>
    ),
  },
  {
    id: "autenticacao",
    cabecalho: "Autenticação",
    celula: (m) => <span className="font-mono text-xs">{m.autenticacao || "—"}</span>,
  },
];

const colunasExtrato: ColunaTabela<LancamentoExtrato>[] = [
  { id: "data", cabecalho: "Data", celula: (l) => dataBR(l.data_lancamento), mobile: "titulo" },
  { id: "descricao", cabecalho: "Descrição", celula: (l) => l.descricao || "—" },
  {
    id: "contrapartida",
    cabecalho: "Contrapartida",
    celula: (l) => <span className="font-mono">{documentoMascarado(l.contrapartida_documento)}</span>,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (l) => (
      <span className="tabular-nums">
        {l.sinal === "D" ? "−" : "+"} {formatCurrency(Number(l.valor))}
      </span>
    ),
    alinhamento: "direita",
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

export default function PagamentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const pagamento = usePagamentoDetalhe(id);
  const movimentos = useMovimentosDoPagamento(id);
  const extrato = useExtratoDoPagamento(id);
  const p = pagamento.data;

  const migalhas = [
    { rotulo: "Financeiro", href: "/financeiro" },
    { rotulo: "Pagamentos", href: "/financeiro/pagamentos" },
    { rotulo: p?.numero ?? "Pagamento" },
  ];

  if (pagamento.isLoading) {
    return (
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <PageHeader migalhas={migalhas} titulo="Pagamento" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (pagamento.isError || !p) {
    return (
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <PageHeader migalhas={migalhas} titulo="Pagamento" />
          <Card>
            <EmptyState
              icone={FileSearch}
              titulo={pagamento.isError ? "Não foi possível carregar o pagamento" : "Pagamento não encontrado"}
              descricao={
                pagamento.isError
                  ? "Tente de novo em instantes."
                  : "O pagamento não existe ou você não tem acesso a ele."
              }
              acao={
                <Button asChild>
                  <Link to="/financeiro/pagamentos">Voltar para pagamentos</Link>
                </Button>
              }
              className="py-12"
            />
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  const status = p.status as StatusPagamento;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={migalhas}
          titulo={<span className="font-mono">{p.numero}</span>}
          status={<StatusBadge tom={TOM_STATUS[status] ?? "neutro"}>{STATUS_PAGAMENTO_LABELS[status] ?? p.status}</StatusBadge>}
          descricao={p.fornecedor?.razao_social ?? "Pagamento sem fornecedor vinculado"}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Dados do pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <Campo rotulo="Exercício">{p.exercicio}</Campo>
                <Campo rotulo="Data do pagamento">{dataBR(p.data_pagamento)}</Campo>
                <Campo rotulo="Efetivado em">{dataBR(p.data_efetivacao)}</Campo>
                <Campo rotulo="Empenho">
                  {p.empenho ? <span className="font-mono">{p.empenho.numero}</span> : "—"}
                </Campo>
                <Campo rotulo="Liquidação">
                  {p.liquidacao ? <span className="font-mono">{p.liquidacao.numero}</span> : "—"}
                </Campo>
                <Campo rotulo="Forma">
                  <span className="uppercase">{p.forma_pagamento}</span>
                </Campo>
                <Campo rotulo="Valor bruto">
                  <span className="tabular-nums">{formatCurrency(Number(p.valor_bruto))}</span>
                </Campo>
                <Campo rotulo="Retenções">
                  <span className="tabular-nums">{formatCurrency(Number(p.valor_retencoes))}</span>
                </Campo>
                <Campo rotulo="Valor líquido">
                  <span className="font-medium tabular-nums">{formatCurrency(Number(p.valor_liquido))}</span>
                </Campo>
                {p.empenho?.objeto && (
                  <div className="sm:col-span-3">
                    <Campo rotulo="Objeto do empenho">{p.empenho.objeto}</Campo>
                  </div>
                )}
                {p.observacoes && (
                  <div className="sm:col-span-3">
                    <Campo rotulo="Observações">{p.observacoes}</Campo>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4" aria-hidden /> Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <Campo rotulo="Conta pagadora">
                  {p.conta_bancaria ? `${p.conta_bancaria.nome_conta} · ${p.conta_bancaria.banco_nome}` : "—"}
                </Campo>
                <Campo rotulo="Favorecido (banco / agência / conta)">
                  <span className="font-mono text-xs">
                    {contaFavorecido({
                      banco: p.banco_favorecido,
                      agencia: p.agencia_favorecido,
                      conta: p.conta_favorecido,
                    })}
                  </span>
                </Campo>
                <Campo rotulo="Identificador da transação">
                  <span className="font-mono text-xs">{p.identificador_transacao || "—"}</span>
                </Campo>
              </dl>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3" aria-labelledby="historico-bancario">
          <h2 id="historico-bancario" className="text-lg font-semibold">
            Histórico bancário
          </h2>
          <DataTable
            rotulo="Movimentos bancários do pagamento"
            dados={movimentos.data ?? []}
            colunas={colunasMovimentos}
            chaveLinha={(m) => m.id}
            carregando={movimentos.isLoading}
            erro={movimentos.isError ? "Não foi possível carregar o histórico bancário." : null}
            aoTentarNovamente={() => movimentos.refetch()}
            vazio={{
              icone: Banknote,
              titulo: "Nenhum arquivo do banco ligado a este pagamento",
              descricao: "A remessa e o retorno aparecem aqui depois de importados em Conciliação bancária.",
              acao: (
                <Button variant="outline" asChild>
                  <Link to="/financeiro/conciliacao">Ir para a conciliação</Link>
                </Button>
              ),
            }}
          />
          {(extrato.data?.length ?? 0) > 0 && (
            <DataTable
              rotulo="Lançamentos de extrato do pagamento"
              dados={extrato.data ?? []}
              colunas={colunasExtrato}
              chaveLinha={(l) => l.id}
            />
          )}
        </section>
      </div>
    </ModuleLayout>
  );
}
