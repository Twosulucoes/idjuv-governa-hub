/**
 * Ficha do pedido de passagem: abas Dados, Passageiros e trechos (cotação e emissão) e Histórico.
 * A aba Prestação de contas entra na entrega 2 da spec 2026-10-24-contratos-passagens-aereas-design.md.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRightLeft, Pencil } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoricoTab } from "@/components/contratos/passagens/HistoricoTab";
import { PassageirosTab } from "@/components/contratos/passagens/PassageirosTab";
import { PedidoFormDialog } from "@/components/contratos/passagens/PedidoFormDialog";
import { SituacaoDialog } from "@/components/contratos/passagens/SituacaoDialog";
import { TOM_PEDIDO } from "@/components/contratos/passagens/tons";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { resumoPedido } from "@/lib/passagens/regras";
import { useContratosPassagens, useHistoricoPedido, usePedido, useSalvarPedido } from "@/hooks/usePassagens";
import { rotuloOrigem, rotuloPrestacao, rotuloSituacaoPedido, TIPOS_SOLICITANTE, type PedidoCompleto } from "@/types/passagens";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Dados({ p, contrato }: { p: PedidoCompleto; contrato: string }) {
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
          <Campo rotulo="Prestação de contas">{rotuloPrestacao(p.prestacao_contas)}</Campo>
          <Campo rotulo="Aprovação do Presidente">
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

export default function PassagemPedidoPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("contratos.passagens.editar");
  const pedido = usePedido(id);
  const historico = useHistoricoPedido(id);
  const contratos = useContratosPassagens();
  const salvar = useSalvarPedido();
  const [editando, setEditando] = useState(false);
  const [mudando, setMudando] = useState(false);

  const p = pedido.data;
  const c = contratos.data?.find((x) => x.id === p?.contrato_id);
  const contrato = c ? `${c.numero_contrato}/${c.ano} · ${c.fornecedor?.nome_fantasia ?? c.fornecedor?.razao_social ?? ""}` : "sem contrato definido";
  const encerrado = p?.situacao === "cancelado" || p?.situacao === "concluido";

  let conteudo: React.ReactNode;
  if (pedido.isLoading) {
    conteudo = <Skeleton className="h-64" />;
  } else if (pedido.isError) {
    conteudo = <EmptyState titulo="Não foi possível carregar o pedido" acao={<Button variant="outline" onClick={() => pedido.refetch()}>Tentar novamente</Button>} />;
  } else if (!p) {
    conteudo = <EmptyState titulo="Pedido não encontrado" acao={<Button asChild variant="outline"><Link to="/contratos/passagens">Voltar à lista</Link></Button>} />;
  } else {
    conteudo = (
      <Tabs defaultValue="passageiros">
        <TabsList>
          <TabsTrigger value="passageiros">Passageiros e trechos</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="passageiros" className="mt-4">
          <PassageirosTab pedido={p} podeEditar={podeEditar} />
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
            podeEditar && p && !encerrado ? (
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
