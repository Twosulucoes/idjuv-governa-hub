/**
 * PÁGINA: FICHA DO ITEM DE MATERIAL (ALMOXARIFADO)
 * Dados cadastrais, parâmetros de estoque, valores e requisições em que o item aparece.
 * O saldo em estoque ainda não é calculado pelo sistema: a ficha mostra só os parâmetros
 * (estoque mínimo/máximo e ponto de reposição), nunca como se fossem quantidade disponível.
 */

import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Barcode, Boxes, Calendar, ClipboardList, Edit, FileText,
  Hash, Info, Layers, Package, Ruler, Tag, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { useItemMaterial, useRequisicoesDoItem } from "@/hooks/useAlmoxarifado";
import { formatCurrency } from "@/lib/formatters";
import { UNIDADES_MEDIDA } from "@/components/inventario/unidadesMedida";
import {
  CampoDetalhe, CardDetalhe, DataHora, DataSemHora, DetalheCarregando, DetalheNaoEncontrado,
} from "@/components/inventario/DetalheRegistro";

const MIGALHAS_BASE = [
  { rotulo: "Inventário", href: "/inventario" },
  { rotulo: "Almoxarifado", href: "/inventario/almoxarifado" },
];

const STATUS_REQUISICAO: Record<string, { label: string; tom: TomStatus }> = {
  pendente: { label: "Pendente", tom: "pendente" },
  em_analise: { label: "Em análise", tom: "andamento" },
  atendida: { label: "Atendida", tom: "sucesso" },
  atendida_parcial: { label: "Atendida parcialmente", tom: "andamento" },
  rejeitada: { label: "Rejeitada", tom: "erro" },
  cancelada: { label: "Cancelada", tom: "neutro" },
};

type ItemBase = NonNullable<ReturnType<typeof useItemMaterial>["data"]>;
// A categoria vem por FK simples; tipamos explicitamente o objeto devolvido.
type ItemMaterial = Omit<ItemBase, "categoria"> & {
  categoria: { id: string; nome: string } | null;
};

type RequisicaoDoItem = {
  id: string;
  quantidade_solicitada: number;
  quantidade_atendida: number | null;
  requisicao: { id: string; numero: string; status: string | null; data_solicitacao: string } | null;
};

/** Quantidade com a unidade de medida; sem valor, "—". */
function quantidade(valor: number | null | undefined, unidade: string) {
  return valor === null || valor === undefined ? "—" : `${valor.toLocaleString("pt-BR")} ${unidade}`;
}

/** Valor em reais; sem valor, "—" (e não "R$ 0,00", que sugere preço zero). */
function moeda(valor: number | null | undefined) {
  return valor === null || valor === undefined ? "—" : formatCurrency(valor);
}

function rotuloUnidade(sigla: string) {
  const unidade = UNIDADES_MEDIDA.find((u) => u.value === sigla);
  return unidade ? `${unidade.label} (${unidade.value})` : sigla;
}

function RequisicoesDoItem({ itemId, unidade }: { itemId: string; unidade: string }) {
  const { data, isLoading } = useRequisicoesDoItem(itemId);
  const linhas = (data ?? []) as unknown as RequisicaoDoItem[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Requisições com este item</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando requisições...</p>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma requisição registrada para este item.</p>
        ) : (
          <ul className="divide-y divide-border">
            {linhas.map((linha) => {
              const status = STATUS_REQUISICAO[linha.requisicao?.status ?? ""];
              return (
                <li key={linha.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="space-y-0.5">
                    {linha.requisicao ? (
                      <Link
                        to={`/inventario/requisicoes/${linha.requisicao.id}`}
                        className="font-mono text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {linha.requisicao.numero}
                      </Link>
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Solicitado em <DataSemHora valor={linha.requisicao?.data_solicitacao} /> ·{" "}
                      {quantidade(linha.quantidade_solicitada, unidade)} solicitado(s)
                      {linha.quantidade_atendida !== null && ` · ${quantidade(linha.quantidade_atendida, unidade)} atendido(s)`}
                    </p>
                  </div>
                  {status
                    ? <StatusBadge tom={status.tom}>{status.label}</StatusBadge>
                    : <StatusBadge tom="neutro">Sem status</StatusBadge>}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function ItemMaterialDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useItemMaterial(id);
  // Editar exige patrimonio.criar (mesma permissão da rota de edição; o banco também valida).
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("patrimonio.criar");

  if (isLoading) return <DetalheCarregando rotulo="Carregando item de material" />;

  if (error || !data) {
    return (
      <DetalheNaoEncontrado
        migalhas={[...MIGALHAS_BASE, { rotulo: "Detalhe" }]}
        titulo="Item de material"
        icone={AlertTriangle}
        mensagem={error ? "Não foi possível carregar o item" : "Item não encontrado"}
        voltarPara="/inventario/almoxarifado"
        rotuloVoltar="Voltar para o almoxarifado"
      />
    );
  }

  const item = data as unknown as ItemMaterial;
  const ativo = item.ativo !== false;

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[...MIGALHAS_BASE, { rotulo: item.codigo || "Detalhe" }]}
          midia={
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Boxes className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
          }
          titulo={item.descricao}
          status={
            ativo
              ? <StatusBadge tom="sucesso">Ativo</StatusBadge>
              : <StatusBadge tom="neutro">Inativo</StatusBadge>
          }
          descricao={<span className="font-mono">Código {item.codigo}</span>}
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/inventario/almoxarifado">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {podeEditar && (
                <Button asChild>
                  <Link to={`/inventario/almoxarifado/${item.id}/editar`}>
                    <Edit className="h-4 w-4" aria-hidden="true" />
                    Editar
                  </Link>
                </Button>
              )}
            </>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          <CardDetalhe titulo="Identificação">
            <CampoDetalhe icone={Hash} rotulo="Código">
              <span className="font-mono">{item.codigo}</span>
            </CampoDetalhe>
            <CampoDetalhe icone={Barcode} rotulo="Código SKU">
              {item.codigo_sku ? <span className="font-mono">{item.codigo_sku}</span> : "—"}
            </CampoDetalhe>
            <CampoDetalhe icone={Package} rotulo="Descrição">{item.descricao}</CampoDetalhe>
            <CampoDetalhe icone={FileText} rotulo="Especificação">{item.especificacao || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Tag} rotulo="Categoria">{item.categoria?.nome || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Ruler} rotulo="Unidade de medida">{rotuloUnidade(item.unidade_medida)}</CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Parâmetros de estoque">
            <CampoDetalhe icone={TrendingDown} rotulo="Estoque mínimo">
              {quantidade(item.estoque_minimo, item.unidade_medida)}
            </CampoDetalhe>
            <CampoDetalhe icone={TrendingUp} rotulo="Estoque máximo">
              {quantidade(item.estoque_maximo, item.unidade_medida)}
            </CampoDetalhe>
            <CampoDetalhe icone={AlertTriangle} rotulo="Ponto de reposição">
              {quantidade(item.ponto_reposicao, item.unidade_medida)}
            </CampoDetalhe>
            <div className="flex items-start gap-2 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                Estes são os limites definidos para o item, não a quantidade disponível.
                O saldo em estoque chega numa próxima etapa.
              </span>
            </div>
          </CardDetalhe>

          <CardDetalhe titulo="Valores">
            <CampoDetalhe icone={Wallet} rotulo="Valor unitário médio">{moeda(item.valor_unitario_medio)}</CampoDetalhe>
            <CampoDetalhe icone={Wallet} rotulo="Último valor de compra">{moeda(item.ultimo_valor_compra)}</CampoDetalhe>
          </CardDetalhe>

          <CardDetalhe titulo="Lote e registro">
            <CampoDetalhe icone={Layers} rotulo="Lote">{item.lote || "—"}</CampoDetalhe>
            <CampoDetalhe icone={Calendar} rotulo="Validade"><DataSemHora valor={item.validade} /></CampoDetalhe>
            <CampoDetalhe icone={ClipboardList} rotulo="Cadastrado em"><DataHora valor={item.created_at} /></CampoDetalhe>
            <CampoDetalhe icone={ClipboardList} rotulo="Última atualização"><DataHora valor={item.updated_at} /></CampoDetalhe>
          </CardDetalhe>
        </div>

        <RequisicoesDoItem itemId={item.id} unidade={item.unidade_medida} />
      </div>
    </ModuleLayout>
  );
}
