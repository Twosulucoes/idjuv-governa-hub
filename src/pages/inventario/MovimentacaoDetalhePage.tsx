/**
 * PÁGINA: DETALHE DA MOVIMENTAÇÃO DE PATRIMÔNIO
 * Dados da transferência/cessão/empréstimo, origem e destino, tramitação e decisão.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Building2, Calendar, Check, FileText,
  Package, TrendingUp, User, UserCheck, X, MapPin, AlertTriangle,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { useMovimentacaoPatrimonio, useDecidirMovimentacao } from "@/hooks/usePatrimonio";
import { useAuth } from "@/contexts/AuthContext";
import { DecisaoPatrimonioDialog, type ModoDecisao } from "@/components/inventario/DecisaoPatrimonioDialog";
import {
  CampoDetalhe, CardDetalhe, DataHora, DataSemHora, DetalheCarregando, DetalheNaoEncontrado,
} from "@/components/inventario/DetalheRegistro";

const TIPOS_MOVIMENTACAO: Record<string, string> = {
  transferencia_interna: "Transferência Interna",
  cessao: "Cessão",
  emprestimo: "Empréstimo",
  recolhimento: "Recolhimento",
};

const STATUS_MOVIMENTACAO: Record<string, { label: string; tom: TomStatus }> = {
  pendente: { label: "Pendente", tom: "pendente" },
  aprovado: { label: "Aprovada", tom: "sucesso" },
  rejeitado: { label: "Rejeitada", tom: "erro" },
  concluido: { label: "Concluída", tom: "sucesso" },
};

type MovimentacaoBase = NonNullable<ReturnType<typeof useMovimentacaoPatrimonio>["data"]>;
// Os tipos gerados tratam os responsáveis (FK nomeada) como lista; em tempo de execução vem um objeto.
type Movimentacao = Omit<MovimentacaoBase, "responsavel_origem" | "responsavel_destino"> & {
  responsavel_origem: { id: string; nome_completo: string } | null;
  responsavel_destino: { id: string; nome_completo: string } | null;
};

const MIGALHAS_BASE = [
  { rotulo: "Inventário", href: "/inventario" },
  { rotulo: "Movimentações", href: "/inventario/movimentacoes" },
];

/** Unidade + setor/sala, no formato "Unidade · Setor · Sala". */
function localTexto(unidade: string | null | undefined, setor: string | null, sala: string | null) {
  const partes = [unidade, setor, sala].filter(Boolean);
  return partes.length ? partes.join(" · ") : "—";
}

export default function MovimentacaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useMovimentacaoPatrimonio(id);
  const decidirMovimentacao = useDecidirMovimentacao();
  const [modoDecisao, setModoDecisao] = useState<ModoDecisao | null>(null);
  // Aprovar/rejeitar exige patrimonio.tramitar (o banco também valida: erro 42501).
  const { hasPermission } = useAuth();
  const podeDecidir = hasPermission("patrimonio.tramitar");

  if (isLoading) return <DetalheCarregando rotulo="Carregando movimentação" />;

  if (!data) {
    return (
      <DetalheNaoEncontrado
        migalhas={[...MIGALHAS_BASE, { rotulo: "Detalhe" }]}
        titulo="Movimentação"
        icone={AlertTriangle}
        mensagem="Movimentação não encontrada"
        voltarPara="/inventario/movimentacoes"
        rotuloVoltar="Voltar para movimentações"
      />
    );
  }

  const mov = data as unknown as Movimentacao;
  const status = STATUS_MOVIMENTACAO[mov.status ?? ""];
  const tipo = TIPOS_MOVIMENTACAO[mov.tipo] ?? mov.tipo;
  const identificacaoBem = mov.bem?.numero_patrimonio || mov.bem?.descricao || "bem";
  const decidida = !!mov.data_aprovacao;

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[...MIGALHAS_BASE, { rotulo: mov.bem?.numero_patrimonio || "Detalhe" }]}
          midia={
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
          }
          titulo={`${tipo} do bem ${identificacaoBem}`}
          status={
            status
              ? <StatusBadge tom={status.tom}>{status.label}</StatusBadge>
              : <StatusBadge tom="neutro">Sem status</StatusBadge>
          }
          descricao={
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Movimentação em <DataSemHora valor={mov.data_movimentacao} />
            </span>
          }
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/inventario/movimentacoes">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {podeDecidir && mov.status === "pendente" && (
                <>
                  <Button variant="outline" onClick={() => setModoDecisao("rejeitar")}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Rejeitar
                  </Button>
                  <Button onClick={() => setModoDecisao("aprovar")}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Aprovar
                  </Button>
                </>
              )}
            </>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <CardDetalhe titulo="Bem">
            <CampoDetalhe icone={Package} rotulo="Número de patrimônio">
              {mov.bem ? (
                <Link to={`/inventario/bens/${mov.bem.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
                  {mov.bem.numero_patrimonio || "Ver bem"}
                </Link>
              ) : "—"}
            </CampoDetalhe>
            <CampoDetalhe icone={FileText} rotulo="Descrição">{mov.bem?.descricao || "—"}</CampoDetalhe>
            <CampoDetalhe icone={TrendingUp} rotulo="Tipo de movimentação">
              <Badge variant="outline">{tipo}</Badge>
            </CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Motivo">
            <CampoDetalhe icone={FileText} rotulo="Motivo da movimentação">{mov.motivo || "—"}</CampoDetalhe>
            {mov.motivo_rejeicao && (
              <CampoDetalhe icone={X} rotulo="Motivo da rejeição">{mov.motivo_rejeicao}</CampoDetalhe>
            )}
            <CampoDetalhe icone={FileText} rotulo="Observações">{mov.observacoes || "—"}</CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Origem">
            <CampoDetalhe icone={Building2} rotulo="Unidade / local">
              {localTexto(mov.origem_unidade_local?.nome_unidade, mov.setor_origem, mov.sala_origem)}
            </CampoDetalhe>
            <CampoDetalhe icone={User} rotulo="Responsável">
              {mov.responsavel_origem?.nome_completo || "—"}
            </CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Destino">
            <CampoDetalhe icone={MapPin} rotulo="Unidade / local">
              <span className="inline-flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                {localTexto(mov.destino_unidade_local?.nome_unidade, mov.setor_destino, mov.sala_destino)}
              </span>
            </CampoDetalhe>
            <CampoDetalhe icone={User} rotulo="Responsável">
              {mov.responsavel_destino?.nome_completo || "—"}
            </CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Tramitação">
            <CampoDetalhe icone={User} rotulo="Solicitado por">{mov.solicitado_por_nome || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Data da solicitação">
              <DataHora valor={mov.data_solicitacao ?? mov.created_at} />
            </CampoDetalhe>
            <CampoDetalhe icone={UserCheck} rotulo={mov.status === "rejeitado" ? "Rejeitado por" : "Decidido por"}>
              {decidida ? mov.aprovado_por_nome || "—" : "Aguardando decisão"}
            </CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Data da decisão">
              <DataHora valor={mov.data_aprovacao} />
            </CampoDetalhe>
          </CardDetalhe>
        </div>
      </div>

      <DecisaoPatrimonioDialog
        open={!!modoDecisao}
        onOpenChange={(aberto) => !aberto && setModoDecisao(null)}
        modo={modoDecisao ?? "aprovar"}
        titulo={modoDecisao === "rejeitar" ? "Rejeitar movimentação" : "Aprovar movimentação"}
        descricao={`${tipo} do bem ${identificacaoBem}.`}
        aviso={
          modoDecisao === "aprovar"
            ? `Ao aprovar, o bem passa para ${mov.destino_unidade_local?.nome_unidade || "a unidade de destino"}${mov.responsavel_destino ? ` sob responsabilidade de ${mov.responsavel_destino.nome_completo}` : ""}.`
            : undefined
        }
        processando={decidirMovimentacao.isPending}
        onConfirmar={(motivoRejeicao) => {
          decidirMovimentacao.mutate(
            { id: mov.id, aprovar: modoDecisao === "aprovar", motivoRejeicao },
            { onSuccess: () => setModoDecisao(null) },
          );
        }}
      />
    </ModuleLayout>
  );
}
