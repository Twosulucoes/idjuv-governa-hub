/**
 * PÁGINA: DETALHE DA BAIXA DE PATRIMÔNIO
 * Motivo, justificativa, valores, comissão e decisão. Se o bem não vier no join
 * (ex.: sem acesso ao cadastro), usa o retrato gravado em dados_bem_snapshot.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, Check, DollarSign, FileText, FileX,
  Package, User, UserCheck, Users, X, AlertTriangle,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { useBaixaPatrimonio, useDecidirBaixa } from "@/hooks/usePatrimonio";
import { useAuth } from "@/contexts/AuthContext";
import { DecisaoPatrimonioDialog, type ModoDecisao } from "@/components/inventario/DecisaoPatrimonioDialog";
import {
  CampoDetalhe, CardDetalhe, DataHora, DataSemHora, DetalheCarregando, DetalheNaoEncontrado,
} from "@/components/inventario/DetalheRegistro";
import { formatCurrency } from "@/lib/formatters";

const STATUS_BAIXA: Record<string, { label: string; tom: TomStatus }> = {
  solicitada: { label: "Solicitada", tom: "pendente" },
  em_analise: { label: "Em análise", tom: "andamento" },
  aprovada: { label: "Aprovada", tom: "sucesso" },
  rejeitada: { label: "Rejeitada", tom: "erro" },
  concluida: { label: "Concluída", tom: "neutro" },
};

const MOTIVOS_BAIXA: Record<string, string> = {
  inservivel: "Inservível",
  obsoleto: "Obsoleto",
  doacao: "Doação",
  alienacao: "Alienação",
  perda: "Perda/Extravio",
};

const MIGALHAS_BASE = [
  { rotulo: "Inventário", href: "/inventario" },
  { rotulo: "Baixas", href: "/inventario/baixas" },
];

interface DadosBem {
  id: string | null;
  numero_patrimonio: string | null;
  descricao: string | null;
  valor_aquisicao: number | null;
}

/** Lê o retrato do bem gravado na baixa (jsonb) sem confiar no formato. */
function bemDoSnapshot(snapshot: unknown): DadosBem | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const s = snapshot as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" && v ? v : null);
  const numero = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);
  return {
    id: texto(s.id),
    numero_patrimonio: texto(s.numero_patrimonio),
    descricao: texto(s.descricao),
    valor_aquisicao: numero(s.valor_aquisicao),
  };
}

const valorOuTraco = (valor: number | null | undefined) => (valor === null || valor === undefined ? "—" : formatCurrency(valor));

export default function BaixaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: baixa, isLoading } = useBaixaPatrimonio(id);
  const decidirBaixa = useDecidirBaixa();
  const [modoDecisao, setModoDecisao] = useState<ModoDecisao | null>(null);
  // Aprovar/rejeitar exige patrimonio.tramitar (o banco também valida: erro 42501).
  const { hasPermission } = useAuth();
  const podeDecidir = hasPermission("patrimonio.tramitar");

  if (isLoading) return <DetalheCarregando rotulo="Carregando baixa" />;

  if (!baixa) {
    return (
      <DetalheNaoEncontrado
        migalhas={[...MIGALHAS_BASE, { rotulo: "Detalhe" }]}
        titulo="Baixa de patrimônio"
        icone={AlertTriangle}
        mensagem="Baixa não encontrada"
        voltarPara="/inventario/baixas"
        rotuloVoltar="Voltar para baixas"
      />
    );
  }

  const snapshot = bemDoSnapshot(baixa.dados_bem_snapshot);
  const bem: DadosBem | null = baixa.bem ?? snapshot;
  const bemId = baixa.bem?.id ?? baixa.bem_id;
  const usandoSnapshot = !baixa.bem && !!snapshot;
  const status = STATUS_BAIXA[baixa.status ?? ""];
  const motivo = MOTIVOS_BAIXA[baixa.motivo] ?? baixa.motivo;
  const identificacaoBem = bem?.numero_patrimonio || bem?.descricao || "bem";
  const decidida = !!baixa.data_aprovacao;
  const pendente = baixa.status === "solicitada" || baixa.status === "em_analise";

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[...MIGALHAS_BASE, { rotulo: bem?.numero_patrimonio || "Detalhe" }]}
          midia={
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileX className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
          }
          titulo={`Baixa do bem ${identificacaoBem}`}
          status={
            status
              ? <StatusBadge tom={status.tom}>{status.label}</StatusBadge>
              : <StatusBadge tom="neutro">Sem status</StatusBadge>
          }
          descricao={
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Solicitada em <DataSemHora valor={baixa.data_solicitacao} />
            </span>
          }
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/inventario/baixas">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {podeDecidir && pendente && (
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

        {pendente && (
          <Card className="border-warning/50 bg-warning/5" role="note">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" aria-hidden="true" />
                <p className="text-body text-muted-foreground">
                  A baixa de bens patrimoniais é um processo irreversível. Confira o laudo técnico e a
                  autorização no processo antes de aprovar.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <CardDetalhe titulo="Bem">
            <CampoDetalhe icone={Package} rotulo="Número de patrimônio">
              {bemId ? (
                <Link to={`/inventario/bens/${bemId}`} className="font-mono text-primary underline-offset-4 hover:underline">
                  {bem?.numero_patrimonio || "Ver bem"}
                </Link>
              ) : bem?.numero_patrimonio || "—"}
            </CampoDetalhe>
            <CampoDetalhe icone={FileText} rotulo="Descrição">
              {bem?.descricao || "—"}
              {usandoSnapshot && (
                <span className="mt-1 block text-caption font-normal text-muted-foreground">
                  Dados do bem conforme registrados no momento da baixa.
                </span>
              )}
            </CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Motivo">
            <CampoDetalhe icone={FileX} rotulo="Motivo da baixa">
              <Badge variant="outline">{motivo}</Badge>
            </CampoDetalhe>
            <CampoDetalhe icone={FileText} rotulo="Justificativa">{baixa.justificativa || "—"}</CampoDetalhe>
            {baixa.motivo_rejeicao && (
              <CampoDetalhe icone={X} rotulo="Motivo da rejeição">{baixa.motivo_rejeicao}</CampoDetalhe>
            )}
          </CardDetalhe>

          <CardDetalhe titulo="Valores">
            <CampoDetalhe icone={DollarSign} rotulo="Valor de aquisição">{valorOuTraco(bem?.valor_aquisicao)}</CampoDetalhe>
            <CampoDetalhe icone={DollarSign} rotulo="Valor residual">{valorOuTraco(baixa.valor_residual)}</CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Tramitação">
            <CampoDetalhe icone={User} rotulo="Solicitado por">{baixa.solicitado_por_nome || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Data da solicitação"><DataSemHora valor={baixa.data_solicitacao} /></CampoDetalhe>
            <CampoDetalhe icone={Users} rotulo="Comissão responsável">{baixa.comissao_responsavel || "—"}</CampoDetalhe>
            <CampoDetalhe icone={UserCheck} rotulo={baixa.status === "rejeitada" ? "Rejeitado por" : "Decidido por"}>
              {decidida ? baixa.aprovado_por_nome || "—" : "Aguardando decisão"}
            </CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Data da decisão"><DataHora valor={baixa.data_aprovacao} /></CampoDetalhe>
          </CardDetalhe>
        </div>
      </div>

      <DecisaoPatrimonioDialog
        open={!!modoDecisao}
        onOpenChange={(aberto) => !aberto && setModoDecisao(null)}
        modo={modoDecisao ?? "aprovar"}
        titulo={modoDecisao === "rejeitar" ? "Rejeitar baixa" : "Aprovar baixa"}
        descricao={`Baixa do bem ${identificacaoBem} por ${motivo}.`}
        aviso={
          modoDecisao === "aprovar"
            ? `Ao aprovar, o bem ${identificacaoBem} ficará com a situação "baixado" e sairá do patrimônio ativo. Essa decisão não pode ser desfeita pela tela.`
            : undefined
        }
        processando={decidirBaixa.isPending}
        onConfirmar={(motivoRejeicao) => {
          decidirBaixa.mutate(
            { id: baixa.id, aprovar: modoDecisao === "aprovar", motivoRejeicao },
            { onSuccess: () => setModoDecisao(null) },
          );
        }}
      />
    </ModuleLayout>
  );
}
