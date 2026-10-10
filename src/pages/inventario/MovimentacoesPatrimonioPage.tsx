/**
 * MOVIMENTAÇÕES DE PATRIMÔNIO
 * Transferências, cessões e empréstimos de bens
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  TrendingUp, Plus, Eye, Check, X,
  ArrowRight, Building2, User, Package
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { useMovimentacoesPatrimonio } from "@/hooks/usePatrimonio";
import { NovaMovimentacaoDialog } from "@/components/inventario/NovaMovimentacaoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS_MOVIMENTACAO = [
  { value: 'transferencia_interna', label: 'Transferência Interna' },
  { value: 'cessao', label: 'Cessão' },
  { value: 'emprestimo', label: 'Empréstimo' },
  { value: 'recolhimento', label: 'Recolhimento' },
];

const STATUS_MOVIMENTACAO: { value: string; label: string; tom: TomStatus }[] = [
  { value: 'pendente', label: 'Pendente', tom: 'pendente' },
  { value: 'aprovada', label: 'Aprovada', tom: 'sucesso' },
  { value: 'rejeitada', label: 'Rejeitada', tom: 'erro' },
  { value: 'concluida', label: 'Concluída', tom: 'sucesso' },
];

type MovimentacaoBase = NonNullable<ReturnType<typeof useMovimentacoesPatrimonio>["data"]>[number];
// Os tipos gerados tratam o solicitante (FK nomeada) como lista; em tempo de execução vem um objeto.
type Movimentacao = Omit<MovimentacaoBase, "solicitante"> & {
  solicitante: { id: string; nome_completo: string } | null;
};

const getTipoLabel = (tipo: string | null) => {
  const t = TIPOS_MOVIMENTACAO.find(t => t.value === tipo);
  return t?.label || tipo;
};

function StatusMovimentacaoBadge({ status }: { status: string | null }) {
  const st = STATUS_MOVIMENTACAO.find(s => s.value === status);
  return st ? <StatusBadge tom={st.tom}>{st.label}</StatusBadge> : <StatusBadge tom="neutro">Sem status</StatusBadge>;
}

const identificacaoBem = (mov: Movimentacao) => mov.bem?.numero_patrimonio || mov.bem?.descricao || 'bem';

const colunas: ColunaTabela<Movimentacao>[] = [
  {
    id: "data",
    cabecalho: "Data",
    celula: (mov) => (
      <span className="whitespace-nowrap">
        {mov.data_movimentacao
          ? format(new Date(mov.data_movimentacao), 'dd/MM/yyyy', { locale: ptBR })
          : '-'}
      </span>
    ),
    ordenarPor: (mov) => mov.data_movimentacao,
  },
  {
    id: "tipo",
    cabecalho: "Tipo",
    celula: (mov) => <Badge variant="outline">{getTipoLabel(mov.tipo)}</Badge>,
    ordenarPor: (mov) => getTipoLabel(mov.tipo),
  },
  {
    id: "bem",
    cabecalho: "Bem",
    celula: (mov) => (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <span className="font-mono text-caption">{mov.bem?.numero_patrimonio}</span>
          <p className="text-caption text-muted-foreground">{mov.bem?.descricao}</p>
        </div>
      </div>
    ),
    ordenarPor: (mov) => mov.bem?.numero_patrimonio,
    buscarPor: (mov) => `${mov.bem?.descricao ?? ''} ${mov.bem?.numero_patrimonio ?? ''}`,
    mobile: "titulo",
  },
  {
    id: "origem",
    cabecalho: "Origem",
    celula: (mov) => (
      <div className="flex items-center gap-1">
        <Building2 className="w-3 h-3" aria-hidden="true" />
        {mov.origem_unidade_local?.nome_unidade || '-'}
      </div>
    ),
    ordenarPor: (mov) => mov.origem_unidade_local?.nome_unidade,
  },
  {
    id: "destino",
    cabecalho: "Destino",
    celula: (mov) => (
      <div className="flex items-center gap-1">
        <ArrowRight className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        <Building2 className="w-3 h-3" aria-hidden="true" />
        {mov.destino_unidade_local?.nome_unidade || '-'}
      </div>
    ),
    ordenarPor: (mov) => mov.destino_unidade_local?.nome_unidade,
  },
  {
    id: "solicitante",
    cabecalho: "Solicitante",
    celula: (mov) => (
      <div className="flex items-center gap-1">
        <User className="w-3 h-3" aria-hidden="true" />
        {mov.solicitante?.nome_completo?.split(' ').slice(0, 2).join(' ') || '-'}
      </div>
    ),
    ordenarPor: (mov) => mov.solicitante?.nome_completo,
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (mov) => <StatusMovimentacaoBadge status={mov.status} />,
    ordenarPor: (mov) => mov.status,
  },
];

export default function MovimentacoesPatrimonioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dialogNovaMovimentacaoOpen, setDialogNovaMovimentacaoOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaMovimentacaoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: movimentacoes, isLoading, isError, refetch } = useMovimentacoesPatrimonio();

  const movimentacoesFiltradas = ((movimentacoes ?? []) as unknown as Movimentacao[]).filter(mov => {
    if (filtroTipo && mov.tipo !== filtroTipo) return false;
    if (filtroStatus && mov.status !== filtroStatus) return false;
    return true;
  });

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Movimentações" }]}
          titulo="Movimentações"
          descricao="Transferências, cessões e empréstimos"
          acoes={
            <Button onClick={() => setDialogNovaMovimentacaoOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova movimentação
            </Button>
          }
        />

        <DataTable
          rotulo="Movimentações"
          dados={movimentacoesFiltradas}
          colunas={colunas}
          chaveLinha={(mov) => mov.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as movimentações." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por bem" }}
          filtros={
            <>
              <Select value={filtroTipo || "all"} onValueChange={v => setFiltroTipo(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS_MOVIMENTACAO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_MOVIMENTACAO.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          vazio={{
            icone: TrendingUp,
            titulo: "Nenhuma movimentação encontrada",
            descricao: "Ajuste os filtros ou registre uma movimentação.",
          }}
          acoesLinha={(mov) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  to={`/inventario/movimentacoes/${mov.id}`}
                  aria-label={`Ver movimentação do bem ${identificacaoBem(mov)}`}
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              {mov.status === 'pendente' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-success"
                    aria-label={`Aprovar movimentação do bem ${identificacaoBem(mov)}`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label={`Rejeitar movimentação do bem ${identificacaoBem(mov)}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      <NovaMovimentacaoDialog
        open={dialogNovaMovimentacaoOpen}
        onOpenChange={setDialogNovaMovimentacaoOpen}
      />
    </ModuleLayout>
  );
}
