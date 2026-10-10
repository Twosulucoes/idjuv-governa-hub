import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Plus, Wallet, Eye, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { useAdiantamentos } from "@/hooks/useFinanceiro";
import { STATUS_ADIANTAMENTO_LABELS, type Adiantamento, type StatusAdiantamento } from "@/types/financeiro";

const TOM_STATUS_ADIANTAMENTO: Record<StatusAdiantamento, TomStatus> = {
  solicitado: "pendente",
  autorizado: "andamento",
  liberado: "andamento",
  em_uso: "andamento",
  prestacao_pendente: "pendente",
  prestado: "sucesso",
  aprovado: "sucesso",
  rejeitado: "erro",
  bloqueado: "erro",
};

function StatusAdiantamentoBadge({ status }: { status: string }) {
  const label = STATUS_ADIANTAMENTO_LABELS[status as StatusAdiantamento];
  if (!label) return <StatusBadge tom="neutro">{status || "Sem status"}</StatusBadge>;
  return <StatusBadge tom={TOM_STATUS_ADIANTAMENTO[status as StatusAdiantamento]}>{label}</StatusBadge>;
}

const colunas: ColunaTabela<Adiantamento>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (adi) => <span className="font-medium">{adi.numero}</span>,
    ordenarPor: (adi) => adi.numero,
    buscarPor: (adi) => adi.numero,
    mobile: "titulo",
  },
  {
    id: "finalidade",
    cabecalho: "Finalidade",
    celula: (adi) => adi.finalidade,
    ordenarPor: (adi) => adi.finalidade,
    buscarPor: (adi) => adi.finalidade,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (adi) => (
      <span className="font-mono tabular-nums">{formatCurrency(adi.valor_aprovado || adi.valor_solicitado)}</span>
    ),
    ordenarPor: (adi) => Number(adi.valor_aprovado || adi.valor_solicitado),
    alinhamento: "direita",
  },
  {
    id: "prazo",
    cabecalho: "Prazo de comprovação",
    celula: (adi) => formatDateBR(adi.prazo_prestacao_contas),
    ordenarPor: (adi) => adi.prazo_prestacao_contas,
  },
  {
    id: "status",
    cabecalho: "Situação",
    celula: (adi) => <StatusAdiantamentoBadge status={adi.status} />,
    ordenarPor: (adi) => STATUS_ADIANTAMENTO_LABELS[adi.status] ?? adi.status,
  },
];

export default function AdiantamentosPage() {
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  
  const { data: adiantamentos, isLoading, isError, refetch } = useAdiantamentos();

  const filteredAdiantamentos = (adiantamentos ?? []).filter(
    (adi) => statusFilter === "todos" || adi.status === statusFilter
  );

  const adiantamentosVencendo = adiantamentos?.filter(
    (adi) => adi.status === "liberado" && adi.prazo_prestacao_contas
  );

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Adiantamentos" }]}
        titulo="Adiantamentos"
        descricao="Suprimento de fundos e prestação de contas"
        acoes={
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo adiantamento
          </Button>
        }
      />

      {adiantamentosVencendo && adiantamentosVencendo.length > 0 && (
        <Card className="border-warning/50 bg-warning/5" role="note">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              <p className="text-foreground">
                <strong>{adiantamentosVencendo.length}</strong> adiantamento(s) 
                aguardando prestação de contas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        rotulo="Adiantamentos registrados"
        dados={filteredAdiantamentos}
        colunas={colunas}
        chaveLinha={(adi) => adi.id}
        carregando={isLoading}
        erro={isError ? "Não foi possível carregar os adiantamentos." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por número ou finalidade…" }}
        filtros={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por situação">
              <SelectValue placeholder="Todas as situações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as situações</SelectItem>
              {(Object.entries(STATUS_ADIANTAMENTO_LABELS) as [StatusAdiantamento, string][]).map(([valor, label]) => (
                <SelectItem key={valor} value={valor}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        vazio={{
          icone: Wallet,
          titulo: "Nenhum adiantamento encontrado",
          descricao: "Ajuste o filtro ou registre um adiantamento.",
        }}
        acoesLinha={(adi) => (
          <Button variant="ghost" size="icon" aria-label={`Ver adiantamento ${adi.numero}`}>
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      />
    </div>
    </ModuleLayout>
  );
}
