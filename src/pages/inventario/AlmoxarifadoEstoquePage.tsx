/**
 * ALMOXARIFADO - CONTROLE DE ESTOQUE
 * Gestão de materiais de consumo
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Boxes, Plus, AlertTriangle, Edit, Eye,
  Package, TrendingDown, TrendingUp
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { useItensMaterial, useEstatisticasAlmoxarifado } from "@/hooks/useAlmoxarifado";
import { NovoItemMaterialDialog } from "@/components/inventario/NovoItemMaterialDialog";

type ItemMaterial = NonNullable<ReturnType<typeof useItensMaterial>["data"]>[number];

const formatCurrency = (value: number | null) =>
  value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

function EstoqueBadge({ item }: { item: ItemMaterial }) {
  if (!item.estoque_minimo) return null;

  if ((item.ponto_reposicao ?? 0) <= 0) {
    return <StatusBadge tom="erro">Sem estoque</StatusBadge>;
  }
  if ((item.ponto_reposicao ?? 0) < item.estoque_minimo) {
    return <StatusBadge tom="pendente">Baixo</StatusBadge>;
  }
  return null;
}

const colunas: ColunaTabela<ItemMaterial>[] = [
  {
    id: "sku",
    cabecalho: "SKU",
    celula: (item) => <span className="font-mono">{item.codigo_sku || '-'}</span>,
    ordenarPor: (item) => item.codigo_sku,
    buscarPor: (item) => item.codigo_sku,
  },
  {
    id: "descricao",
    cabecalho: "Descrição",
    celula: (item) => <span className="font-medium">{item.descricao}</span>,
    ordenarPor: (item) => item.descricao,
    buscarPor: (item) => item.descricao,
    mobile: "titulo",
  },
  {
    id: "categoria",
    cabecalho: "Categoria",
    celula: (item) => item.categoria?.nome || '-',
    ordenarPor: (item) => item.categoria?.nome,
  },
  {
    id: "minimo",
    cabecalho: "Estoque mín.",
    celula: (item) => <span className="text-muted-foreground">{item.estoque_minimo || '-'}</span>,
    ordenarPor: (item) => item.estoque_minimo,
    alinhamento: "direita",
  },
  {
    id: "maximo",
    cabecalho: "Estoque máx.",
    celula: (item) => <span className="text-muted-foreground">{item.estoque_maximo || '-'}</span>,
    ordenarPor: (item) => item.estoque_maximo,
    alinhamento: "direita",
  },
  {
    id: "valor",
    cabecalho: "Valor médio",
    celula: (item) => formatCurrency(item.valor_unitario_medio),
    ordenarPor: (item) => item.valor_unitario_medio,
    alinhamento: "direita",
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (item) => <EstoqueBadge item={item} />,
  },
];

export default function AlmoxarifadoEstoquePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroEstoque, setFiltroEstoque] = useState<string>("");
  const [dialogNovoItemOpen, setDialogNovoItemOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "novo") {
      setDialogNovoItemOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: itens, isLoading, isError, refetch } = useItensMaterial({
    abaixoEstoqueMinimo: filtroEstoque === 'baixo',
  });

  const { data: estatisticas, isLoading: carregandoEstatisticas } = useEstatisticasAlmoxarifado();

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Almoxarifado" }]}
          titulo="Almoxarifado"
          descricao="Controle de estoque e materiais de consumo"
          acoes={
            <Button onClick={() => setDialogNovoItemOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo item
            </Button>
          }
        />

        {/* Indicadores */}
        <section aria-labelledby="almoxarifado-indicadores">
          <h2 id="almoxarifado-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <li>
              <KpiCard
                rotulo="Total de itens"
                valor={estatisticas?.totalItens || 0}
                icone={Package}
                carregando={carregandoEstatisticas}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Valor em estoque"
                valor={formatCurrency(estatisticas?.valorTotal || 0)}
                icone={TrendingUp}
                carregando={carregandoEstatisticas}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Abaixo do mínimo"
                valor={estatisticas?.abaixoMinimo || 0}
                icone={AlertTriangle}
                carregando={carregandoEstatisticas}
                className={estatisticas?.abaixoMinimo ? 'h-full border-warning' : 'h-full'}
              />
            </li>
            <li>
              <Link
                to="/inventario/requisicoes"
                className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <KpiCard
                  rotulo="Requisições pendentes"
                  valor={estatisticas?.requisicoesPendentes || 0}
                  icone={TrendingDown}
                  carregando={carregandoEstatisticas}
                  className="h-full"
                />
              </Link>
            </li>
          </ul>
        </section>

        <DataTable
          rotulo="Itens de material"
          dados={itens ?? []}
          colunas={colunas}
          chaveLinha={(item) => item.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar os itens do almoxarifado." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por descrição ou SKU" }}
          filtros={
            <Select value={filtroEstoque || "all"} onValueChange={v => setFiltroEstoque(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Estoque">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o estoque</SelectItem>
                <SelectItem value="baixo">Abaixo do mínimo</SelectItem>
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: Boxes,
            titulo: "Nenhum item encontrado",
            descricao: "Ajuste o filtro ou cadastre um item.",
          }}
          acoesLinha={(item) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/inventario/almoxarifado/${item.id}`} aria-label={`Ver item ${item.descricao}`}>
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/inventario/almoxarifado/${item.id}/editar`} aria-label={`Editar item ${item.descricao}`}>
                  <Edit className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        />
      </div>

      <NovoItemMaterialDialog
        open={dialogNovoItemOpen}
        onOpenChange={setDialogNovoItemOpen}
      />
    </ModuleLayout>
  );
}
