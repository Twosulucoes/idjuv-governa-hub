/**
 * Ficha do pedido de passagem: abas Passageiros e trechos (cotação, emissão e a fatura de cada bilhete), Prestação
 * de contas (entrega 2), Dados e Histórico, e a ficha em PDF para juntar no SEI. Spec 2026-10-24-contratos-passagens-aereas-design.md.
 */

import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRightLeft, FileDown, Pencil } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoricoTab } from "@/components/contratos/passagens/HistoricoTab";
import { PassageirosTab } from "@/components/contratos/passagens/PassageirosTab";
import { PedidoFormDialog } from "@/components/contratos/passagens/PedidoFormDialog";
import { PrestacaoTab } from "@/components/contratos/passagens/PrestacaoTab";
import { SituacaoDialog } from "@/components/contratos/passagens/SituacaoDialog";
import { TOM_PEDIDO } from "@/components/contratos/passagens/tons";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/core/tenant";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { resumoPedido, valorTrecho } from "@/lib/passagens/regras";
import { useContratosPassagens, useHistoricoPedido, usePedido, useSalvarPedido } from "@/hooks/usePassagens";
import { useToast } from "@/hooks/use-toast";
import { useFaturasDosTrechos } from "@/hooks/usePassagensFaturas";
import {
  rotuloOrigem,
  rotuloPrestacao,
  rotuloSituacaoFatura,
  rotuloSituacaoPedido,
  rotuloSituacaoTrecho,
  TIPOS_SOLICITANTE,
  type FaturaDoTrecho,
  type PedidoCompleto,
} from "@/types/passagens";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Dados({ p, contrato }: { p: PedidoCompleto; contrato: string }) {
  const cargoDirigente = useTenant().legal?.dirigenteCargo;
  const r = resumoPedido(p.passageiros);
  const periodo = p.data_inicio ? `${formatDateBR(p.data_inicio)}${p.data_fim ? ` a ${formatDateBR(p.data_fim)}` : ""}` : "—";
  return (
    <Card>
      <CardContent className="pt-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Processo SEI">{p.numero_sei}</Campo>
          <Campo rotulo="Data do pedido">{formatDateBR(p.data_pedido)} · {rotuloOrigem(p.origem)}</Campo>
          <Campo rotulo="Quem pediu">
            {p.solicitante_nome ?? "—"}
            <span className="block text-muted-foreground">{TIPOS_SOLICITANTE.find((t) => t.value === p.solicitante_tipo)?.label}</span>
          </Campo>
          <Campo rotulo="Evento">{p.evento ?? "—"}</Campo>
          <Campo rotulo="Destino">{p.destino_cidade ? `${p.destino_cidade}${p.destino_uf ? `/${p.destino_uf}` : ""}` : "—"}</Campo>
          <Campo rotulo="Período">{periodo}</Campo>
          <Campo rotulo="Contrato">{contrato}</Campo>
          <Campo rotulo="Prestação de contas">
            {rotuloPrestacao(p.prestacao_contas)}
            {p.prestacao_contas === "dispensado" && p.prestacao_dispensa_motivo && (
              <span className="block text-muted-foreground">{p.prestacao_dispensa_motivo}</span>
            )}
          </Campo>
          <Campo rotulo={cargoDirigente ? `Aprovação (${cargoDirigente})` : "Aprovação"}>
            {p.aprovacao_documento_sei ? `Documento SEI ${p.aprovacao_documento_sei}, ${formatDateBR(p.aprovacao_data)}` : "ainda não registrada"}
          </Campo>
          <Campo rotulo="Passageiros e trechos">{r.passageiros} passageiros · {r.trechos} trechos ({r.emitidos} emitidos)</Campo>
          <Campo rotulo="Valor emitido"><span className="tabular-nums">{formatCurrency(r.valor)}</span></Campo>
          {p.situacao === "cancelado" && <Campo rotulo="Motivo do cancelamento">{p.cancelamento_motivo ?? "—"}</Campo>}
          <div className="sm:col-span-2 lg:col-span-3"><Campo rotulo="Finalidade">{p.finalidade}</Campo></div>
          {p.observacoes && <div className="sm:col-span-2 lg:col-span-3"><Campo rotulo="Observações">{p.observacoes}</Campo></div>}
        </dl>
      </CardContent>
    </Card>
  );
}

/** Prestação de contas do passageiro numa linha (dispensa, cartão de embarque e relatório entregues). */
function prestacaoDoPassageiro(x: PedidoCompleto["passageiros"][number]): string {
  if (x.prestacao_dispensada) return `dispensada (${x.prestacao_dispensa_motivo ?? ""})`;
  const partes = [
    x.embarque_entregue_em ? `cartão de embarque entregue em ${formatDateBR(x.embarque_entregue_em)}` : "cartão de embarque pendente",
    x.relatorio_entregue_em
      ? `relatório entregue em ${formatDateBR(x.relatorio_entregue_em)}`
      : x.servidor_id && x.viagem_id ? "relatório pela viagem do RH" : "relatório pendente",
  ];
  return partes.join(" · ");
}

/** Dados do PDF "Ficha do pedido" (modelo contratos-passagem-ficha-pedido). */
function dadosDaFicha(p: PedidoCompleto, contrato: string, faturas: Record<string, FaturaDoTrecho>) {
  const r = resumoPedido(p.passageiros);
  const bilhetes = p.passageiros.flatMap((x) => x.trechos).filter((t) => t.localizador);
  const somar = (filtro: (f: FaturaDoTrecho) => boolean) =>
    Math.round(bilhetes.reduce((s, t) => s + (faturas[t.id] && filtro(faturas[t.id]) ? Number(faturas[t.id].valor) : 0), 0) * 100) / 100;
  const fatura = (id: string) => {
    const f = faturas[id]?.fatura;
    if (!f) return undefined;
    return f.situacao === "paga"
      ? `NF ${f.numero} · paga em ${formatDateBR(f.pagamento_data)} (OB ${f.ob_numero})`
      : `NF ${f.numero} · ${rotuloSituacaoFatura(f.situacao).toLowerCase()}`;
  };
  return {
    numeroSei: p.numero_sei,
    dataPedido: formatDateBR(p.data_pedido),
    origem: rotuloOrigem(p.origem),
    solicitante: p.solicitante_nome ?? "—",
    evento: p.evento ?? undefined,
    finalidade: p.finalidade,
    destino: p.destino_cidade ? `${p.destino_cidade}${p.destino_uf ? `/${p.destino_uf}` : ""}` : undefined,
    periodo: p.data_inicio ? `${formatDateBR(p.data_inicio)}${p.data_fim ? ` a ${formatDateBR(p.data_fim)}` : ""}` : undefined,
    contrato,
    situacao: rotuloSituacaoPedido(p.situacao),
    aprovacao: p.aprovacao_documento_sei ? `Documento SEI ${p.aprovacao_documento_sei}, ${formatDateBR(p.aprovacao_data)}` : undefined,
    prestacaoContas: rotuloPrestacao(p.prestacao_contas),
    passageiros: p.passageiros.map((x) => ({
      nome: x.nome ?? "—",
      tipo: x.servidor_id ? "servidor" : "beneficiário",
      prestacao: p.prestacao_contas === "individual" ? prestacaoDoPassageiro(x) : undefined,
      trechos: x.trechos.map((t) => ({
        trecho: `${t.origem} - ${t.destino}`,
        dataVoo: formatDateBR(t.data_voo),
        voo: t.companhia ? `${t.companhia}${t.voo ? ` ${t.voo}` : ""}` : undefined,
        situacao: rotuloSituacaoTrecho(t.situacao),
        localizador: t.localizador ?? undefined,
        valor: t.localizador ? valorTrecho(t) : undefined,
        fatura: t.localizador ? fatura(t.id) ?? (valorTrecho(t) > 0 ? "a faturar" : undefined) : undefined,
      })),
    })),
    totalEmitido: r.valor,
    totalFaturado: somar(() => true),
    totalPago: somar((f) => f.fatura.situacao === "paga"),
    observacoes: p.observacoes ?? undefined,
  };
}

export default function PassagemPedidoPage() {
  const { id } = useParams();
  const [busca] = useSearchParams();
  const abaInicial = busca.get("aba") === "prestacao" ? "prestacao" : "passageiros";
  const { hasPermission, user } = useAuth();
  const podeEditar = hasPermission("contratos.passagens.editar");
  const pedido = usePedido(id);
  const trechoIds = useMemo(
    () => (pedido.data?.passageiros ?? []).flatMap((x) => x.trechos.filter((t) => t.localizador).map((t) => t.id)),
    [pedido.data],
  );
  const faturas = useFaturasDosTrechos(trechoIds);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const { toast } = useToast();
  const historico = useHistoricoPedido(id);
  const contratos = useContratosPassagens();
  const salvar = useSalvarPedido();
  const [editando, setEditando] = useState(false);
  const [mudando, setMudando] = useState(false);

  const p = pedido.data;
  const c = contratos.data?.find((x) => x.id === p?.contrato_id);
  const contrato = c ? `${c.numero_contrato}/${c.ano} · ${c.fornecedor?.nome_fantasia ?? c.fornecedor?.razao_social ?? ""}` : "sem contrato definido";
  const encerrado = p?.situacao === "cancelado" || p?.situacao === "concluido";

  const baixarFicha = async () => {
    if (!p) return;
    setGerandoPdf(true);
    try {
      const { baixarDocumento, emitirDocumento } = await import("@/lib/documentos");
      const quem = user?.fullName ?? user?.email ?? undefined;
      const doc = await emitirDocumento("contratos-passagem-ficha-pedido", dadosDaFicha(p, contrato, faturas.data ?? {}), { emitidoPor: quem });
      baixarDocumento(doc);
    } catch {
      toast({ title: "Não foi possível gerar o PDF", description: "Tente de novo em instantes.", variant: "destructive" });
    } finally {
      setGerandoPdf(false);
    }
  };

  let conteudo: React.ReactNode;
  if (pedido.isLoading) {
    conteudo = <Skeleton className="h-64" />;
  } else if (pedido.isError) {
    conteudo = <EmptyState titulo="Não foi possível carregar o pedido" acao={<Button variant="outline" onClick={() => pedido.refetch()}>Tentar novamente</Button>} />;
  } else if (!p) {
    conteudo = <EmptyState titulo="Pedido não encontrado" acao={<Button asChild variant="outline"><Link to="/contratos/passagens">Voltar à lista</Link></Button>} />;
  } else {
    conteudo = (
      <Tabs defaultValue={abaInicial}>
        <TabsList>
          <TabsTrigger value="passageiros">Passageiros e trechos</TabsTrigger>
          <TabsTrigger value="prestacao">Prestação de contas</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="passageiros" className="mt-4">
          <PassageirosTab pedido={p} podeEditar={podeEditar} faturas={faturas.data} />
        </TabsContent>
        <TabsContent value="prestacao" className="mt-4">
          <PrestacaoTab pedido={p} podeEditar={podeEditar} />
        </TabsContent>
        <TabsContent value="dados" className="mt-4">
          <Dados p={p} contrato={contrato} />
        </TabsContent>
        <TabsContent value="historico" className="mt-4">
          <HistoricoTab historico={historico.data} carregando={historico.isLoading} erro={historico.isError} aoTentarNovamente={() => historico.refetch()} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        <PageHeader
          titulo={p ? (p.evento ?? `Pedido ${p.numero_sei}`) : "Pedido de passagem"}
          descricao={p ? `Processo SEI ${p.numero_sei} · ${p.solicitante_nome ?? ""}` : undefined}
          migalhas={[
            { rotulo: "Contratos", href: "/contratos" },
            { rotulo: "Passagens aéreas", href: "/contratos/passagens" },
            { rotulo: p?.numero_sei ?? "Pedido" },
          ]}
          status={p && <StatusBadge tom={TOM_PEDIDO[p.situacao] ?? "neutro"} icone={false}>{rotuloSituacaoPedido(p.situacao)}</StatusBadge>}
          acoes={
            p ? (
              <>
                <Button variant="outline" onClick={baixarFicha} disabled={gerandoPdf || (trechoIds.length > 0 && faturas.isLoading)}>
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  Ficha (PDF)
                </Button>
                {podeEditar && !encerrado && (
                <>
                <Button variant="outline" onClick={() => setEditando(true)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar dados
                </Button>
                <Button onClick={() => setMudando(true)}>
                  <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                  Mudar situação
                </Button>
                </>
                )}
              </>
            ) : undefined
          }
        />
        {conteudo}
      </div>

      {p && (
        <>
          <PedidoFormDialog
            open={editando}
            onOpenChange={setEditando}
            pedido={p}
            salvando={salvar.isPending}
            podeCadastrar={podeEditar}
            onSalvar={(dados) => salvar.mutateAsync(dados)}
          />
          <SituacaoDialog open={mudando} onOpenChange={setMudando} pedido={p} />
        </>
      )}
    </ModuleLayout>
  );
}
