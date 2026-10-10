/**
 * REQUISIÇÕES DE MATERIAL
 * Solicitação e atendimento de materiais de consumo
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ClipboardList, Plus, Eye, Check, X,
  User, Building2, Calendar, Package
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { useRequisicoesMaterial } from "@/hooks/useAlmoxarifado";
import { NovaRequisicaoDialog } from "@/components/inventario/NovaRequisicaoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_REQUISICAO: { value: string; label: string; tom: TomStatus }[] = [
  { value: 'pendente', label: 'Pendente', tom: 'pendente' },
  { value: 'em_analise', label: 'Em análise', tom: 'andamento' },
  { value: 'atendida', label: 'Atendida', tom: 'sucesso' },
  { value: 'atendida_parcial', label: 'Atendida parcialmente', tom: 'andamento' },
  { value: 'rejeitada', label: 'Rejeitada', tom: 'erro' },
  { value: 'cancelada', label: 'Cancelada', tom: 'neutro' },
];

type RequisicaoBase = NonNullable<ReturnType<typeof useRequisicoesMaterial>["data"]>[number];
// Os tipos gerados tratam as relações por FK nomeada como lista; em tempo de execução vêm objetos.
type Requisicao = Omit<RequisicaoBase, "solicitante" | "setor"> & {
  solicitante: { id: string; nome_completo: string } | null;
  setor: { id: string; nome: string; sigla: string | null } | null;
  itens?: unknown[];
};

function StatusRequisicaoBadge({ status }: { status: string | null }) {
  const st = STATUS_REQUISICAO.find(s => s.value === status);
  return st ? <StatusBadge tom={st.tom}>{st.label}</StatusBadge> : <StatusBadge tom="neutro">Sem status</StatusBadge>;
}

const colunas: ColunaTabela<Requisicao>[] = [
  {
    id: "numero",
    cabecalho: "Nº requisição",
    celula: (req) => <span className="font-mono font-medium">{req.numero || '-'}</span>,
    ordenarPor: (req) => req.numero,
    buscarPor: (req) => req.numero,
    mobile: "titulo",
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (req) => (
      <div className="flex items-center gap-1 whitespace-nowrap">
        <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        {req.created_at
          ? format(new Date(req.created_at), 'dd/MM/yyyy', { locale: ptBR })
          : '-'}
      </div>
    ),
    ordenarPor: (req) => req.created_at,
  },
  {
    id: "solicitante",
    cabecalho: "Solicitante",
    celula: (req) => (
      <div className="flex items-center gap-1">
        <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        {req.solicitante?.nome_completo?.split(' ').slice(0, 2).join(' ') || '-'}
      </div>
    ),
    ordenarPor: (req) => req.solicitante?.nome_completo,
    buscarPor: (req) => req.solicitante?.nome_completo,
  },
  {
    id: "setor",
    cabecalho: "Setor",
    celula: (req) => (
      <div className="flex items-center gap-1">
        <Building2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        {req.setor?.sigla || '-'}
      </div>
    ),
    ordenarPor: (req) => req.setor?.sigla,
  },
  {
    id: "itens",
    cabecalho: "Itens",
    celula: (req) => (
      <div className="flex items-center gap-1">
        <Package className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        {req.itens?.length || 0} item(s)
      </div>
    ),
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (req) => <StatusRequisicaoBadge status={req.status} />,
    ordenarPor: (req) => req.status,
  },
];

export default function RequisicoesMaterialPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dialogNovaRequisicaoOpen, setDialogNovaRequisicaoOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaRequisicaoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: requisicoes, isLoading, isError, refetch } = useRequisicoesMaterial({
    status: filtroStatus || undefined,
  });

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Requisições" }]}
          titulo="Requisições de material"
          descricao="Solicitação e atendimento de materiais"
          acoes={
            <Button onClick={() => setDialogNovaRequisicaoOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova requisição
            </Button>
          }
        />

        <DataTable
          rotulo="Requisições de material"
          dados={(requisicoes ?? []) as unknown as Requisicao[]}
          colunas={colunas}
          chaveLinha={(req) => req.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as requisições." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número ou solicitante" }}
          filtros={
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_REQUISICAO.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: ClipboardList,
            titulo: "Nenhuma requisição encontrada",
            descricao: "Ajuste o filtro ou registre uma requisição.",
          }}
          acoesLinha={(req) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  to={`/inventario/requisicoes/${req.id}`}
                  aria-label={`Ver requisição ${req.numero || ''}`.trim()}
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              {req.status === 'pendente' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-success"
                    aria-label={`Aprovar requisição ${req.numero || ''}`.trim()}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label={`Rejeitar requisição ${req.numero || ''}`.trim()}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      <NovaRequisicaoDialog
        open={dialogNovaRequisicaoOpen}
        onOpenChange={setDialogNovaRequisicaoOpen}
      />
    </ModuleLayout>
  );
}
