/**
 * BAIXAS DE PATRIMÔNIO
 * Desfazimento e baixa de bens patrimoniais
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileX, Plus, Eye, Check, X,
  Package, AlertTriangle
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { useBaixasPatrimonio, useDecidirBaixa } from "@/hooks/usePatrimonio";
import { NovaBaixaDialog } from "@/components/inventario/NovaBaixaDialog";
import { DecisaoPatrimonioDialog, type ModoDecisao } from "@/components/inventario/DecisaoPatrimonioDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_BAIXA: { value: string; label: string; tom: TomStatus }[] = [
  { value: 'solicitada', label: 'Solicitada', tom: 'pendente' },
  { value: 'em_analise', label: 'Em análise', tom: 'andamento' },
  { value: 'aprovada', label: 'Aprovada', tom: 'sucesso' },
  { value: 'rejeitada', label: 'Rejeitada', tom: 'erro' },
  { value: 'concluida', label: 'Concluída', tom: 'neutro' },
];

const MOTIVOS_BAIXA = [
  { value: 'inservivel', label: 'Inservível' },
  { value: 'obsoleto', label: 'Obsoleto' },
  { value: 'doacao', label: 'Doação' },
  { value: 'alienacao', label: 'Alienação' },
  { value: 'perda', label: 'Perda/Extravio' },
];

type Baixa = NonNullable<ReturnType<typeof useBaixasPatrimonio>["data"]>[number];

const getMotivoLabel = (motivo: string | null) => {
  const m = MOTIVOS_BAIXA.find(m => m.value === motivo);
  return m?.label || motivo;
};

const formatCurrency = (value: number | null) =>
  value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

function StatusBaixaBadge({ status }: { status: string | null }) {
  const st = STATUS_BAIXA.find(s => s.value === status);
  return st ? <StatusBadge tom={st.tom}>{st.label}</StatusBadge> : <StatusBadge tom="neutro">Sem status</StatusBadge>;
}

const identificacaoBem = (baixa: Baixa) => baixa.bem?.numero_patrimonio || baixa.bem?.descricao || 'bem';

const colunas: ColunaTabela<Baixa>[] = [
  {
    id: "data",
    cabecalho: "Data solicitação",
    celula: (baixa) => (
      <span className="whitespace-nowrap">
        {baixa.data_solicitacao
          ? format(new Date(baixa.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })
          : '-'}
      </span>
    ),
    ordenarPor: (baixa) => baixa.data_solicitacao,
  },
  {
    id: "bem",
    cabecalho: "Bem",
    celula: (baixa) => (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <span className="font-mono text-caption">{baixa.bem?.numero_patrimonio}</span>
          <p className="text-caption text-muted-foreground truncate max-w-[250px]">
            {baixa.bem?.descricao}
          </p>
        </div>
      </div>
    ),
    ordenarPor: (baixa) => baixa.bem?.numero_patrimonio,
    buscarPor: (baixa) => `${baixa.bem?.descricao ?? ''} ${baixa.bem?.numero_patrimonio ?? ''}`,
    mobile: "titulo",
  },
  {
    id: "motivo",
    cabecalho: "Motivo",
    celula: (baixa) => (
      <Badge variant="outline" className="capitalize">
        {getMotivoLabel(baixa.motivo)}
      </Badge>
    ),
    ordenarPor: (baixa) => getMotivoLabel(baixa.motivo),
  },
  {
    id: "valor",
    cabecalho: "Valor residual",
    celula: (baixa) => formatCurrency(baixa.valor_residual),
    ordenarPor: (baixa) => baixa.valor_residual,
    alinhamento: "direita",
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (baixa) => <StatusBaixaBadge status={baixa.status} />,
    ordenarPor: (baixa) => baixa.status,
  },
];

export default function BaixasPatrimonioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dialogNovaBaixaOpen, setDialogNovaBaixaOpen] = useState(false);
  const [decisao, setDecisao] = useState<{ baixa: Baixa; modo: ModoDecisao } | null>(null);
  const decidirBaixa = useDecidirBaixa();

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaBaixaOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: baixas, isLoading, isError, refetch } = useBaixasPatrimonio(
    filtroStatus || undefined
  );

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Baixas" }]}
          titulo="Baixas de patrimônio"
          descricao="Desfazimento e baixa de bens"
          acoes={
            <Button onClick={() => setDialogNovaBaixaOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova baixa
            </Button>
          }
        />

        {/* Alerta */}
        <Card className="border-warning/50 bg-warning/5" role="note">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">Atenção</p>
                <p className="text-body text-muted-foreground">
                  A baixa de bens patrimoniais é um processo irreversível. Certifique-se de que todos os
                  documentos necessários (laudo técnico, autorização) estejam anexados antes de efetivar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          rotulo="Baixas de patrimônio"
          dados={baixas ?? []}
          colunas={colunas}
          chaveLinha={(baixa) => baixa.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as baixas." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por bem" }}
          filtros={
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_BAIXA.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: FileX,
            titulo: "Nenhuma baixa encontrada",
            descricao: "Ajuste o filtro ou registre uma baixa.",
          }}
          acoesLinha={(baixa) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  to={`/inventario/baixas/${baixa.id}`}
                  aria-label={`Ver baixa do bem ${identificacaoBem(baixa)}`}
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              {(baixa.status === 'solicitada' || baixa.status === 'em_analise') && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-success"
                    onClick={() => setDecisao({ baixa, modo: "aprovar" })}
                    aria-label={`Aprovar baixa do bem ${identificacaoBem(baixa)}`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDecisao({ baixa, modo: "rejeitar" })}
                    aria-label={`Rejeitar baixa do bem ${identificacaoBem(baixa)}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      <NovaBaixaDialog
        open={dialogNovaBaixaOpen}
        onOpenChange={setDialogNovaBaixaOpen}
      />

      <DecisaoPatrimonioDialog
        open={!!decisao}
        onOpenChange={(aberto) => !aberto && setDecisao(null)}
        modo={decisao?.modo ?? "aprovar"}
        titulo={decisao?.modo === "rejeitar" ? "Rejeitar baixa" : "Aprovar baixa"}
        descricao={decisao ? `Baixa do bem ${identificacaoBem(decisao.baixa)} por ${getMotivoLabel(decisao.baixa.motivo)}.` : ""}
        aviso={
          decisao?.modo === "aprovar"
            ? `Ao aprovar, o bem ${identificacaoBem(decisao.baixa)} ficará com a situação "baixado" e sairá do patrimônio ativo. Essa decisão não pode ser desfeita pela tela.`
            : undefined
        }
        processando={decidirBaixa.isPending}
        onConfirmar={(motivoRejeicao) => {
          if (!decisao) return;
          decidirBaixa.mutate(
            { id: decisao.baixa.id, aprovar: decisao.modo === "aprovar", motivoRejeicao },
            { onSuccess: () => setDecisao(null) },
          );
        }}
      />
    </ModuleLayout>
  );
}
