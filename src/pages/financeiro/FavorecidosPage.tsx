import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import FavorecidoFormDialog from "@/components/financeiro/FavorecidoFormDialog";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
} from "@/components/design-system";
import { Plus, Users, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import { agenciaValida, contaValida } from "@/lib/bancario/favorecido";
import { useFavorecidos, type Favorecido } from "@/hooks/useFavorecidos";

/** Tem banco, agência e conta no formato que a remessa OBN600 aceita. */
const contaPronta = (f: Favorecido) =>
  !!f.banco_codigo && agenciaValida(f.agencia ?? "") && contaValida(f.conta ?? "");

const filtrosFavorecido: FiltroDef<Favorecido>[] = [
  {
    tipo: "lista",
    id: "pessoa",
    rotulo: "Pessoa",
    principal: true,
    valor: (f) => (f.cpf_cnpj.replace(/\D/g, "").length > 11 ? "pj" : "pf"),
    opcoes: [
      { valor: "pj", rotulo: "Jurídica (CNPJ)" },
      { valor: "pf", rotulo: "Física (CPF)" },
    ],
  },
  {
    tipo: "lista",
    id: "situacao",
    rotulo: "Situação",
    principal: true,
    valor: (f) => (f.ativo ? "ativo" : "inativo"),
    opcoes: [
      { valor: "ativo", rotulo: "Ativo" },
      { valor: "inativo", rotulo: "Inativo" },
    ],
  },
  { tipo: "booleano", id: "sem_conta", rotulo: "Sem conta válida", principal: true, valor: (f) => !contaPronta(f) },
  { tipo: "lista", id: "banco", rotulo: "Banco", valor: (f) => f.banco_codigo },
];

const colunas: ColunaTabela<Favorecido>[] = [
  {
    id: "nome",
    cabecalho: "Nome",
    celula: (f) => <span className="font-medium">{f.razao_social}</span>,
    ordenarPor: (f) => f.razao_social,
    buscarPor: (f) => `${f.razao_social} ${f.nome_fantasia ?? ""}`,
    mobile: "titulo",
  },
  {
    id: "documento",
    cabecalho: "CPF/CNPJ",
    celula: (f) => <span className="font-mono tabular-nums">{f.cpf_cnpj}</span>,
    ordenarPor: (f) => f.cpf_cnpj,
    buscarPor: (f) => `${f.cpf_cnpj} ${f.cpf_cnpj.replace(/\D/g, "")}`,
  },
  {
    id: "conta",
    cabecalho: "Banco / agência / conta",
    celula: (f) =>
      f.banco_codigo ? (
        <span className="font-mono tabular-nums">
          {f.banco_codigo} / {f.agencia || "—"} / {f.conta || "—"}
        </span>
      ) : (
        <span className="text-muted-foreground">Sem conta</span>
      ),
    ordenarPor: (f) => f.banco_codigo ?? "",
  },
  {
    id: "remessa",
    cabecalho: "Remessa OBN600",
    celula: (f) => (
      <StatusBadge tom={contaPronta(f) ? "sucesso" : "pendente"}>{contaPronta(f) ? "Pronta" : "Falta conta"}</StatusBadge>
    ),
    ordenarPor: (f) => contaPronta(f),
  },
  {
    id: "status",
    cabecalho: "Situação",
    celula: (f) => <StatusBadge tom={f.ativo ? "sucesso" : "neutro"}>{f.ativo ? "Ativo" : "Inativo"}</StatusBadge>,
    ordenarPor: (f) => !!f.ativo,
  },
];

export default function FavorecidosPage() {
  const { data: favorecidos, isLoading, isError, refetch } = useFavorecidos();
  const [formOpen, setFormOpen] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Favorecido | null>(null);
  const filtros = useEstadoFiltros("financeiro.favorecidos", filtrosFavorecido);

  const abrir = (f: Favorecido | null) => {
    setEmEdicao(f);
    setFormOpen(true);
  };

  const ativos = favorecidos?.filter((f) => f.ativo) ?? [];
  const semConta = ativos.filter((f) => !contaPronta(f)).length;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Favorecidos" }]}
          titulo="Favorecidos"
          descricao="Quem recebe os pagamentos e a conta de crédito usada na remessa OBN600"
          acoes={
            <Button onClick={() => abrir(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo favorecido
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard rotulo="Favorecidos" valor={favorecidos?.length || 0} icone={Users} carregando={isLoading} />
          <KpiCard rotulo="Ativos" valor={ativos.length} icone={CheckCircle2} carregando={isLoading} />
          <KpiCard rotulo="Ativos sem conta válida" valor={semConta} icone={AlertTriangle} carregando={isLoading} />
        </div>

        <DataTable
          rotulo="Favorecidos cadastrados"
          dados={favorecidos ?? []}
          colunas={colunas}
          chaveLinha={(f) => f.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar os favorecidos." : null}
          aoTentarNovamente={() => refetch()}
          acoesLinha={(f) => (
            <Button variant="ghost" size="sm" onClick={() => abrir(f)} aria-label={`Editar ${f.razao_social}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          )}
          busca={{ placeholder: "Buscar por nome ou CPF/CNPJ…" }}
          filtrosDinamicos={filtros}
          vazio={{
            icone: Users,
            titulo: "Nenhum favorecido encontrado",
            descricao: "Cadastre quem vai receber os pagamentos.",
          }}
        />
      </div>
      <FavorecidoFormDialog open={formOpen} onOpenChange={setFormOpen} favorecido={emEdicao} />
    </ModuleLayout>
  );
}
