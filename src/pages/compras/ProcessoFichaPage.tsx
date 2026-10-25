/**
 * Ficha do processo de contratação: abas Dados, Andamento (linha do tempo do SEI) e Empenhos (FIP 614 pelo nº SEI).
 * A aba Reservas (natureza × ação × fonte, saldo livre e PED) entra na entrega 2 da spec
 * 2026-10-23-compras-processos-reserva-natureza-design.md.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { LinhaDoTempoFases } from "@/components/compras/processos/EvolucaoProcesso";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NovaMovimentacaoDialog } from "@/components/compras/processos/NovaMovimentacaoDialog";
import { ProcessoAndamentoTab } from "@/components/compras/processos/ProcessoAndamentoTab";
import { ProcessoEmpenhosTab } from "@/components/compras/processos/ProcessoEmpenhosTab";
import { ProcessoFormDialog } from "@/components/compras/processos/ProcessoFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import {
  somarEmpenhado,
  useAndamentos,
  useEmpenhosDosProcessos,
  useNovaMovimentacao,
  useProcesso,
  useSalvarProcesso,
} from "@/hooks/useProcessosContratacao";
import { rotuloEtapa, rotuloForma, type ProcessoContratacao } from "@/types/processos";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Dados({ p, empenhado }: { p: ProcessoContratacao; empenhado: number | undefined }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Nº do processo SEI">{p.numero_processo}</Campo>
          <Campo rotulo="Ano">{p.ano}</Campo>
          <Campo rotulo="Forma de contratação">{rotuloForma(p.modalidade)}</Campo>
          <Campo rotulo="Etapa atual">{rotuloEtapa(p.etapa)}</Campo>
          <Campo rotulo="Setor atual">{p.setor_atual ?? "—"}</Campo>
          <Campo rotulo="Última movimentação">{p.atualizado_em ? formatDateBR(p.atualizado_em) : "sem data"}</Campo>
          <Campo rotulo="Valor estimado">
            {p.valor_estimado == null ? "não informado" : formatCurrency(p.valor_estimado)}
            {p.valor_estimado_obs && <span className="block text-muted-foreground">{p.valor_estimado_obs}</span>}
          </Campo>
          <Campo rotulo="Empenhado (FIP 614)">{empenhado === undefined ? "—" : formatCurrency(empenhado)}</Campo>
          <div className="sm:col-span-2 lg:col-span-3">
            <Campo rotulo="Situação atual">{p.situacao_atual ?? "—"}</Campo>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Campo rotulo="Objeto">{p.objeto}</Campo>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export default function ProcessoFichaPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("compras.processos.editar");
  const processo = useProcesso(id);
  const andamentos = useAndamentos(id);
  const empenhos = useEmpenhosDosProcessos(id);
  const salvar = useSalvarProcesso();
  const movimentar = useNovaMovimentacao();
  const [editando, setEditando] = useState(false);
  const [movimentando, setMovimentando] = useState(false);

  const p = processo.data;
  const migalhas = [
    { rotulo: "Compras", href: "/compras" },
    { rotulo: "Processos", href: "/compras/processos" },
    { rotulo: p?.numero_processo ?? "Processo" },
  ];

  let conteudo: React.ReactNode;
  if (processo.isLoading) {
    conteudo = <Skeleton className="h-64" />;
  } else if (processo.isError) {
    conteudo = (
      <EmptyState
        titulo="Não foi possível carregar o processo"
        acao={<Button variant="outline" onClick={() => processo.refetch()}>Tentar novamente</Button>}
      />
    );
  } else if (!p) {
    conteudo = (
      <EmptyState
        titulo="Processo não encontrado"
        acao={<Button asChild variant="outline"><Link to="/compras/processos">Voltar à lista</Link></Button>}
      />
    );
  } else {
    conteudo = (
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="andamento">Andamento</TabsTrigger>
          <TabsTrigger value="empenhos">Empenhos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-4">
          <Dados p={p} empenhado={empenhos.data?.length ? somarEmpenhado(empenhos.data).get(p.id) : undefined} />
        </TabsContent>
        <TabsContent value="andamento" className="mt-4">
          <ProcessoAndamentoTab
            andamentos={andamentos.data}
            carregando={andamentos.isLoading}
            erro={andamentos.isError}
            aoTentarNovamente={() => andamentos.refetch()}
            podeEditar={podeEditar}
            aoNovaMovimentacao={() => setMovimentando(true)}
          />
        </TabsContent>
        <TabsContent value="empenhos" className="mt-4">
          <ProcessoEmpenhosTab
            empenhos={empenhos.data}
            carregando={empenhos.isLoading}
            erro={empenhos.isError}
            aoTentarNovamente={() => empenhos.refetch()}
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo={p ? (p.objeto_resumido ?? p.numero_processo) : "Processo de contratação"}
          descricao={p ? `Processo SEI ${p.numero_processo}` : undefined}
          migalhas={migalhas}
          status={p && <StatusBadge tom="andamento" icone={false}>{rotuloEtapa(p.etapa)}</StatusBadge>}
          acoes={
            podeEditar && p ? (
              <Button variant="outline" onClick={() => setEditando(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar dados
              </Button>
            ) : undefined
          }
        />
        {p && <LinhaDoTempoFases processo={p} andamentos={andamentos.data ?? []} />}
        {conteudo}
      </div>

      {p && (
        <>
          <ProcessoFormDialog
            open={editando}
            onOpenChange={setEditando}
            processo={p}
            salvando={salvar.isPending}
            onSalvar={(dados) => salvar.mutateAsync(dados)}
          />
          <NovaMovimentacaoDialog
            open={movimentando}
            onOpenChange={setMovimentando}
            processo={p}
            salvando={movimentar.isPending}
            onSalvar={(dados) => movimentar.mutateAsync(dados)}
          />
        </>
      )}
    </ModuleLayout>
  );
}
