/**
 * PÁGINA: DETALHE DA MANUTENÇÃO DE BEM
 * Problema relatado, fornecedor, prazos, custos e conclusão.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Building2, Calendar, CheckCircle2, DollarSign,
  FileText, Package, User, Wrench, AlertTriangle,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { useManutencaoPatrimonio } from "@/hooks/usePatrimonio";
import { useAuth } from "@/contexts/AuthContext";
import { ConcluirManutencaoDialog } from "@/components/inventario/ConcluirManutencaoDialog";
import {
  CampoDetalhe, CardDetalhe, DataHora, DataSemHora, DetalheCarregando, DetalheNaoEncontrado,
} from "@/components/inventario/DetalheRegistro";
import { formatCurrency } from "@/lib/formatters";

const STATUS_MANUTENCAO: Record<string, { label: string; tom: TomStatus }> = {
  aberta: { label: "Aberta", tom: "pendente" },
  em_andamento: { label: "Em andamento", tom: "andamento" },
  concluida: { label: "Concluída", tom: "sucesso" },
  cancelada: { label: "Cancelada", tom: "neutro" },
};

const TIPOS_MANUTENCAO: Record<string, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
};

type ManutencaoBase = NonNullable<ReturnType<typeof useManutencaoPatrimonio>["data"]>;
// Os tipos gerados podem tratar o fornecedor (FK nomeada) como lista; em tempo de execução vem um objeto.
type Manutencao = Omit<ManutencaoBase, "fornecedor"> & {
  fornecedor: { id: string; razao_social: string | null } | null;
};

const MIGALHAS_BASE = [
  { rotulo: "Inventário", href: "/inventario" },
  { rotulo: "Manutenções", href: "/inventario/manutencoes" },
];

const valorOuTraco = (valor: number | null) => (valor === null ? "—" : formatCurrency(valor));

export default function ManutencaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useManutencaoPatrimonio(id);
  const [concluirAberto, setConcluirAberto] = useState(false);
  // Concluir exige patrimonio.tramitar.
  const { hasPermission } = useAuth();
  const podeTramitar = hasPermission("patrimonio.tramitar");

  if (isLoading) return <DetalheCarregando rotulo="Carregando manutenção" />;

  if (!data) {
    return (
      <DetalheNaoEncontrado
        migalhas={[...MIGALHAS_BASE, { rotulo: "Detalhe" }]}
        titulo="Manutenção"
        icone={AlertTriangle}
        mensagem="Manutenção não encontrada"
        voltarPara="/inventario/manutencoes"
        rotuloVoltar="Voltar para manutenções"
      />
    );
  }

  const man = data as unknown as Manutencao;
  const status = STATUS_MANUTENCAO[man.status ?? ""];
  const tipo = TIPOS_MANUTENCAO[man.tipo] ?? man.tipo;
  const identificacaoBem = man.bem?.numero_patrimonio || man.bem?.descricao || "bem";
  const podeConcluir = man.status === "aberta" || man.status === "em_andamento";
  const fornecedor = man.fornecedor?.razao_social || man.fornecedor_externo || "—";

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[...MIGALHAS_BASE, { rotulo: man.bem?.numero_patrimonio || "Detalhe" }]}
          midia={
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wrench className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
          }
          titulo={`Manutenção ${tipo.toLowerCase()} do bem ${identificacaoBem}`}
          status={
            status
              ? <StatusBadge tom={status.tom}>{status.label}</StatusBadge>
              : <StatusBadge tom="neutro">Sem status</StatusBadge>
          }
          descricao={
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Aberta em <DataSemHora valor={man.data_abertura} />
            </span>
          }
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/inventario/manutencoes">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {podeTramitar && podeConcluir && (
                <Button onClick={() => setConcluirAberto(true)}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Concluir manutenção
                </Button>
              )}
            </>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <CardDetalhe titulo="Bem">
            <CampoDetalhe icone={Package} rotulo="Número de patrimônio">
              {man.bem ? (
                <Link to={`/inventario/bens/${man.bem.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
                  {man.bem.numero_patrimonio || "Ver bem"}
                </Link>
              ) : "—"}
            </CampoDetalhe>
            <CampoDetalhe icone={FileText} rotulo="Descrição">{man.bem?.descricao || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Wrench} rotulo="Tipo de manutenção">
              <Badge variant="outline">{tipo}</Badge>
            </CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Problema">
            <CampoDetalhe icone={FileText} rotulo="Descrição do problema">{man.descricao_problema || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Building2} rotulo="Fornecedor">{fornecedor}</CampoDetalhe>
            <CampoDetalhe icone={FileText} rotulo="Observações">{man.observacoes || "—"}</CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Prazos">
            <CampoDetalhe icone={Calendar} rotulo="Abertura"><DataSemHora valor={man.data_abertura} /></CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Início"><DataSemHora valor={man.data_inicio} /></CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Conclusão"><DataSemHora valor={man.data_conclusao} /></CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Custos e registro">
            <CampoDetalhe icone={DollarSign} rotulo="Custo estimado">{valorOuTraco(man.custo_estimado)}</CampoDetalhe>
            <CampoDetalhe icone={DollarSign} rotulo="Custo final">{valorOuTraco(man.custo_final)}</CampoDetalhe>
            <CampoDetalhe icone={User} rotulo="Registrado por">{man.registrado_por_nome || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Registrado em"><DataHora valor={man.created_at} /></CampoDetalhe>
          </CardDetalhe>
        </div>
      </div>

      <ConcluirManutencaoDialog
        open={concluirAberto}
        onOpenChange={setConcluirAberto}
        manutencao={concluirAberto ? man : null}
      />
    </ModuleLayout>
  );
}
