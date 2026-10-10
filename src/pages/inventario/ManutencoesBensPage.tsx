/**
 * MANUTENÇÕES DE BENS
 * Registro de manutenções preventivas e corretivas
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Wrench, Plus, Eye, Package, CheckCircle2 } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { useManutencoesPatrimonio } from "@/hooks/usePatrimonio";
import { useAuth } from "@/contexts/AuthContext";
import { NovaManutencaoDialog } from "@/components/inventario/NovaManutencaoDialog";
import { ConcluirManutencaoDialog } from "@/components/inventario/ConcluirManutencaoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_MANUTENCAO: { value: string; label: string; tom: TomStatus }[] = [
  { value: 'aberta', label: 'Aberta', tom: 'pendente' },
  { value: 'em_andamento', label: 'Em andamento', tom: 'andamento' },
  { value: 'concluida', label: 'Concluída', tom: 'sucesso' },
  { value: 'cancelada', label: 'Cancelada', tom: 'neutro' },
];

const TIPOS_MANUTENCAO = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
];

type ManutencaoBase = NonNullable<ReturnType<typeof useManutencoesPatrimonio>["data"]>[number];
// Os tipos gerados podem tratar o fornecedor (FK nomeada) como lista; em tempo de execução vem um objeto.
type Manutencao = Omit<ManutencaoBase, "fornecedor"> & {
  fornecedor: { id: string; razao_social: string | null } | null;
};

const nomeFornecedor = (man: Manutencao) => man.fornecedor?.razao_social || man.fornecedor_externo || null;
const podeConcluir = (man: Manutencao) => man.status === 'aberta' || man.status === 'em_andamento';

const formatCurrency = (value: number | null) =>
  value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

function StatusManutencaoBadge({ status }: { status: string | null }) {
  const st = STATUS_MANUTENCAO.find(s => s.value === status);
  return st ? <StatusBadge tom={st.tom}>{st.label}</StatusBadge> : <StatusBadge tom="neutro">Sem status</StatusBadge>;
}

const colunas: ColunaTabela<Manutencao>[] = [
  {
    id: "data",
    cabecalho: "Data abertura",
    celula: (man) => (
      <span className="whitespace-nowrap">
        {man.data_abertura
          ? format(new Date(man.data_abertura), 'dd/MM/yyyy', { locale: ptBR })
          : '-'}
      </span>
    ),
    ordenarPor: (man) => man.data_abertura,
  },
  {
    id: "tipo",
    cabecalho: "Tipo",
    celula: (man) => (
      <Badge variant="outline" className="capitalize">
        {man.tipo}
      </Badge>
    ),
    ordenarPor: (man) => man.tipo,
  },
  {
    id: "bem",
    cabecalho: "Bem",
    celula: (man) => (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <span className="font-mono text-caption">{man.bem?.numero_patrimonio}</span>
          <p className="text-caption text-muted-foreground truncate max-w-[200px]">
            {man.bem?.descricao}
          </p>
        </div>
      </div>
    ),
    ordenarPor: (man) => man.bem?.numero_patrimonio,
    buscarPor: (man) => `${man.bem?.descricao ?? ''} ${man.bem?.numero_patrimonio ?? ''}`,
    mobile: "titulo",
  },
  {
    id: "descricao",
    cabecalho: "Descrição",
    celula: (man) => <p className="truncate max-w-[200px]">{man.descricao_problema}</p>,
  },
  {
    id: "fornecedor",
    cabecalho: "Fornecedor",
    celula: (man) => nomeFornecedor(man) || '-',
    ordenarPor: (man) => nomeFornecedor(man),
  },
  {
    id: "custo",
    cabecalho: "Custo",
    celula: (man) => formatCurrency(man.custo_final || man.custo_estimado),
    ordenarPor: (man) => man.custo_final || man.custo_estimado,
    alinhamento: "direita",
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (man) => <StatusManutencaoBadge status={man.status} />,
    ordenarPor: (man) => man.status,
  },
];

export default function ManutencoesBensPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [dialogNovaManutencaoOpen, setDialogNovaManutencaoOpen] = useState(false);
  const [manutencaoConcluir, setManutencaoConcluir] = useState<Manutencao | null>(null);
  // Concluir exige patrimonio.tramitar.
  const { hasPermission } = useAuth();
  const podeTramitar = hasPermission("patrimonio.tramitar");

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaManutencaoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: manutencoes, isLoading, isError, refetch } = useManutencoesPatrimonio();

  const manutencoesFiltradas = ((manutencoes ?? []) as unknown as Manutencao[]).filter(man => {
    if (filtroStatus && man.status !== filtroStatus) return false;
    if (filtroTipo && man.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Manutenções" }]}
          titulo="Manutenções"
          descricao="Registro de manutenções preventivas e corretivas"
          acoes={
            <Button onClick={() => setDialogNovaManutencaoOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova manutenção
            </Button>
          }
        />

        <DataTable
          rotulo="Manutenções"
          dados={manutencoesFiltradas}
          colunas={colunas}
          chaveLinha={(man) => man.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as manutenções." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por bem" }}
          filtros={
            <>
              <Select value={filtroTipo || "all"} onValueChange={v => setFiltroTipo(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS_MANUTENCAO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_MANUTENCAO.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          vazio={{
            icone: Wrench,
            titulo: "Nenhuma manutenção encontrada",
            descricao: "Ajuste os filtros ou registre uma manutenção.",
          }}
          acoesLinha={(man) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  to={`/inventario/manutencoes/${man.id}`}
                  aria-label={`Ver manutenção do bem ${man.bem?.numero_patrimonio || man.bem?.descricao || ''}`.trim()}
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              {podeTramitar && podeConcluir(man) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-success"
                  onClick={() => setManutencaoConcluir(man)}
                  aria-label={`Concluir manutenção do bem ${man.bem?.numero_patrimonio || man.bem?.descricao || ''}`.trim()}
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        />
      </div>

      <NovaManutencaoDialog
        open={dialogNovaManutencaoOpen}
        onOpenChange={setDialogNovaManutencaoOpen}
      />

      <ConcluirManutencaoDialog
        open={!!manutencaoConcluir}
        onOpenChange={(aberto) => !aberto && setManutencaoConcluir(null)}
        manutencao={manutencaoConcluir}
      />
    </ModuleLayout>
  );
}
