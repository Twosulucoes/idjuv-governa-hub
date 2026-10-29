/**
 * Ficha da pesquisa de preços: itens, preços coletados com a fonte, saneamento e método de cada item (arts. 17 e 18
 * do Decreto 39.050-E/2025). Gera o relatório em PDF e a planilha para anexar ao SEI e o texto de apoio da nota
 * técnica. Concluída, a pesquisa fica travada (o banco recusa mudança) até ser reaberta.
 */

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, FileDown, FileSpreadsheet, FileText, Lock, Pencil, Plus, Scale, Unlock } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportarParaExcel } from "@/export/exportExcel";
import { PARAMETROS, type ParametroPesquisa } from "@/lib/compras/pesquisaPrecos";
import {
  dataBR, dataHoraConsulta, documentoNoRelatorio, fonteDaAmostra, moedaBR, montarItemRelatorio, SITUACAO_RELATORIO_LABEL, textoNotaTecnica,
} from "@/lib/compras/relatorioPesquisaPrecos";
import {
  useItensPesquisa, usePesquisaPrecos, useSalvarItemPesquisa, useSalvarPesquisa, useSituacaoPesquisa, type PesquisaPrecosItem,
} from "@/hooks/usePesquisaPrecos";
import { ItemCard } from "@/components/compras/pesquisa-precos/ItemCard";
import { ItemDialog } from "@/components/compras/pesquisa-precos/ItemDialog";
import { PesquisaDialog } from "@/components/compras/pesquisa-precos/PesquisaDialog";
import { TextoNotaDialog } from "@/components/compras/pesquisa-precos/TextoNotaDialog";
import {
  FINALIDADE_LABEL, ORIGEM_LABEL, SITUACAO_PESQUISA_LABEL, TOM_SITUACAO_PESQUISA,
} from "@/components/compras/pesquisa-precos/rotulos";

export default function PesquisaPrecosPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const temEdicao = hasPermission("compras.pesquisa_precos.editar");
  const pesquisa = usePesquisaPrecos(id);
  const itens = useItensPesquisa(id);
  const salvarPesquisa = useSalvarPesquisa();
  const situacao = useSituacaoPesquisa();
  const salvarItem = useSalvarItemPesquisa(id);

  const [editandoPesquisa, setEditandoPesquisa] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<PesquisaPrecosItem | null | undefined>(undefined);
  const [verNota, setVerNota] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const p = pesquisa.data;
  const concluida = p?.situacao === "concluida";
  const podeEditar = temEdicao && !concluida;

  const relatorios = useMemo(
    () => (p ? (itens.data ?? []).map((i) => montarItemRelatorio({ ...i, quantidade: Number(i.quantidade) },
      i.amostras.map((a) => ({ ...a, preco_unitario: Number(a.preco_unitario) })), p.data_referencia)) : []),
    [itens.data, p],
  );
  const total = relatorios.reduce((s, r) => s + (r.valorTotal ?? 0), 0);
  const pendencias = relatorios.reduce((s, r) => s + r.pendencias.length, 0);
  const proximoNumero = Math.max(0, ...(itens.data ?? []).map((i) => i.numero)) + 1;

  const baixarPdf = async () => {
    if (!p) return;
    setGerandoPdf(true);
    try {
      const { baixarDocumento, emitirDocumento } = await import("@/lib/documentos");
      const doc = await emitirDocumento(
        "compras-pesquisa-precos",
        {
          numeroSei: p.numero_sei,
          objeto: p.objeto,
          finalidade: FINALIDADE_LABEL[p.finalidade] ?? p.finalidade,
          dataReferencia: p.data_referencia,
          situacao: SITUACAO_PESQUISA_LABEL[p.situacao] ?? p.situacao,
          responsaveis: p.responsaveis ?? undefined,
          itens: relatorios,
        },
        { emitidoPor: user?.fullName ?? user?.email ?? undefined },
      );
      baixarDocumento(doc);
    } catch {
      toast({ title: "Não foi possível gerar o PDF", description: "Tente de novo em instantes.", variant: "destructive" });
    } finally {
      setGerandoPdf(false);
    }
  };

  const baixarPlanilha = () => {
    if (!p) return;
    const linhas = relatorios.flatMap((r) => r.amostras.map((a) => ({
      Item: r.numero,
      Descrição: r.descricao,
      Inciso: PARAMETROS[a.parametro as ParametroPesquisa]?.inciso ?? a.parametro,
      Origem: ORIGEM_LABEL[a.origem] ?? a.origem,
      Fonte: fonteDaAmostra(a),
      "Compra ou documento": a.numero_compra ?? "",
      "Data do preço": dataBR(a.data_referencia),
      Fornecedor: a.fornecedor_nome ?? "",
      "CNPJ/CPF do fornecedor": documentoNoRelatorio(a.fornecedor_ni) ?? "",
      Marca: a.marca ?? "",
      Unidade: a.unidade ?? "",
      "Preço unitário": Number(a.preco_unitario),
      Situação: SITUACAO_RELATORIO_LABEL[a.situacao],
      Motivo: a.motivo_desconsideracao ?? "",
      Aviso: a.aviso ?? "",
      Link: a.link ?? "",
      "Consultado em": dataHoraConsulta(a.consultado_em),
    })));
    exportarParaExcel(linhas, `pesquisa-precos-${p.numero_sei.replace(/\W+/g, "-")}`, "Preços");
  };

  const texto = p ? textoNotaTecnica({ numeroSei: p.numero_sei, objeto: p.objeto, dataReferencia: p.data_referencia, itens: relatorios }) : "";

  if (pesquisa.isLoading || itens.isLoading) {
    return (
      <ModuleLayout module="compras">
        <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>
      </ModuleLayout>
    );
  }

  if (pesquisa.isError || !p) {
    return (
      <ModuleLayout module="compras">
        <EmptyState
          icone={Scale}
          titulo={pesquisa.isError ? "Não foi possível carregar a pesquisa" : "Pesquisa não encontrada"}
          descricao={pesquisa.isError ? "Confira a conexão e tente de novo." : "Ela pode ter sido apagada ou você não tem acesso."}
          acao={pesquisa.isError ? <Button variant="outline" onClick={() => pesquisa.refetch()}>Tentar novamente</Button> : undefined}
        />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo={p.objeto}
          descricao={`Processo SEI ${p.numero_sei} · ${FINALIDADE_LABEL[p.finalidade] ?? p.finalidade} · data de referência ${dataBR(p.data_referencia)}`}
          migalhas={[
            { rotulo: "Compras", href: "/compras" },
            { rotulo: "Pesquisa de preços", href: "/compras/pesquisa-precos" },
            { rotulo: p.numero_sei },
          ]}
          acoes={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setVerNota(true)} disabled={!relatorios.length}>
                <FileText className="h-4 w-4" aria-hidden="true" />Texto da nota
              </Button>
              <Button variant="outline" onClick={baixarPlanilha} disabled={!relatorios.length}>
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />Planilha
              </Button>
              <Button variant="outline" onClick={baixarPdf} disabled={!relatorios.length || gerandoPdf}>
                <FileDown className="h-4 w-4" aria-hidden="true" />Relatório PDF
              </Button>
              {temEdicao && !concluida && (
                <Button variant="outline" onClick={() => setEditandoPesquisa(true)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />Editar
                </Button>
              )}
              {temEdicao && (
                concluida ? (
                  <Button variant="outline" onClick={() => situacao.mutate({ id: p.id, situacao: "em_andamento" })} disabled={situacao.isPending}>
                    <Unlock className="h-4 w-4" aria-hidden="true" />Reabrir
                  </Button>
                ) : (
                  <Button onClick={() => situacao.mutate({ id: p.id, situacao: "concluida" })} disabled={situacao.isPending || !relatorios.length}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Concluir
                  </Button>
                )
              )}
            </div>
          }
        />

        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4 text-sm">
            <StatusBadge tom={TOM_SITUACAO_PESQUISA[p.situacao]}>{SITUACAO_PESQUISA_LABEL[p.situacao] ?? p.situacao}</StatusBadge>
            <span>{relatorios.length} item(ns)</span>
            <span>Valor estimado: <strong className="tabular-nums">{moedaBR(total)}</strong></span>
            <span className={pendencias ? "text-destructive" : "text-muted-foreground"}>
              {pendencias ? `${pendencias} pendência(s) nos itens` : "Sem pendências"}
            </span>
            {p.responsaveis && <span className="text-muted-foreground">Responsáveis: {p.responsaveis}</span>}
            {concluida && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Lock className="h-4 w-4" aria-hidden="true" />Concluída: reabra para mudar
              </span>
            )}
          </CardContent>
        </Card>

        {podeEditar && (
          <div className="flex justify-end">
            <Button onClick={() => setItemEmEdicao(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" />Novo item
            </Button>
          </div>
        )}

        {itens.isError ? (
          <EmptyState
            titulo="Não foi possível carregar os itens"
            descricao="Confira a conexão e tente de novo."
            acao={<Button variant="outline" onClick={() => itens.refetch()}>Tentar novamente</Button>}
          />
        ) : !relatorios.length ? (
          <EmptyState
            icone={Scale}
            titulo="Nenhum item ainda"
            descricao={podeEditar ? "Lance os itens do termo de referência, com o código do CATMAT ou do CATSER." : "A pesquisa ainda não tem itens."}
          />
        ) : (
          <div className="space-y-4">
            {(itens.data ?? []).map((i, n) => (
              <ItemCard
                key={i.id}
                item={i}
                relatorio={relatorios[n]}
                pesquisaId={p.id}
                dataReferencia={p.data_referencia}
                podeEditar={podeEditar}
                onEditar={() => setItemEmEdicao(i)}
              />
            ))}
          </div>
        )}
      </div>

      <PesquisaDialog
        open={editandoPesquisa}
        onOpenChange={setEditandoPesquisa}
        pesquisa={p}
        salvando={salvarPesquisa.isPending}
        onSalvar={salvarPesquisa.mutateAsync}
      />
      <ItemDialog
        open={itemEmEdicao !== undefined}
        onOpenChange={(o) => !o && setItemEmEdicao(undefined)}
        item={itemEmEdicao}
        proximoNumero={proximoNumero}
        salvando={salvarItem.isPending}
        onSalvar={salvarItem.mutateAsync}
      />
      <TextoNotaDialog open={verNota} onOpenChange={setVerNota} texto={texto} />
    </ModuleLayout>
  );
}
