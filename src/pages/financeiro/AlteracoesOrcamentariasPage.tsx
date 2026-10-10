/**
 * Página de Alterações Orçamentárias
 * Suplementações, reduções, remanejamentos com fluxo de aprovação
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowUpDown, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from "@/components/design-system";
import { useAlteracoesOrcamentarias, useCriarAlteracaoOrcamentaria } from "@/hooks/useAlteracoesOrcamentarias";
import { useDotacoes } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TIPO_ALTERACAO_LABELS,
  type AlteracaoOrcamentaria,
  type TipoAlteracaoOrcamentaria,
  type StatusWorkflowFinanceiro,
} from "@/types/financeiro";

// O hook traz as dotações relacionadas junto com a alteração
type AlteracaoComDotacoes = AlteracaoOrcamentaria & {
  dotacao_origem?: { codigo_dotacao: string } | null;
  dotacao_destino?: { codigo_dotacao: string } | null;
};

const tipoIcons: Record<string, typeof TrendingUp> = {
  suplementacao: TrendingUp,
  reducao: TrendingDown,
  remanejamento: ArrowRightLeft,
  transposicao: ArrowRightLeft,
  transferencia: ArrowRightLeft,
  credito_especial: TrendingUp,
  credito_extraordinario: TrendingUp,
};

const SITUACAO: Record<StatusWorkflowFinanceiro, { label: string; tom: TomStatus }> = {
  rascunho: { label: "Rascunho", tom: "neutro" },
  pendente_analise: { label: "Pendente de análise", tom: "pendente" },
  em_analise: { label: "Em análise", tom: "andamento" },
  aprovado: { label: "Aprovado", tom: "sucesso" },
  executado: { label: "Executado", tom: "sucesso" },
  rejeitado: { label: "Rejeitado", tom: "erro" },
  cancelado: { label: "Cancelado", tom: "erro" },
  estornado: { label: "Estornado", tom: "neutro" },
};

const colunas: ColunaTabela<AlteracaoComDotacoes>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (alt) => <span className="font-mono font-medium">{alt.numero}</span>,
    ordenarPor: (alt) => alt.numero,
    // A busca também considera a justificativa, que não tem coluna própria
    buscarPor: (alt) => `${alt.numero ?? ""} ${alt.justificativa ?? ""}`,
    mobile: "titulo",
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (alt) => format(new Date(alt.data_alteracao), "dd/MM/yyyy", { locale: ptBR }),
    ordenarPor: (alt) => new Date(alt.data_alteracao),
  },
  {
    id: "tipo",
    cabecalho: "Tipo",
    celula: (alt) => {
      const TipoIcon = tipoIcons[alt.tipo] || ArrowUpDown;
      return (
        <Badge variant="outline" className="gap-1">
          <TipoIcon className="h-3 w-3" aria-hidden="true" />
          {TIPO_ALTERACAO_LABELS[alt.tipo as TipoAlteracaoOrcamentaria] || alt.tipo}
        </Badge>
      );
    },
    ordenarPor: (alt) => TIPO_ALTERACAO_LABELS[alt.tipo] || alt.tipo,
  },
  {
    id: "origem",
    cabecalho: "Dotação origem",
    celula: (alt) => <span className="font-mono text-caption">{alt.dotacao_origem?.codigo_dotacao || "—"}</span>,
    ordenarPor: (alt) => alt.dotacao_origem?.codigo_dotacao,
    buscarPor: (alt) => alt.dotacao_origem?.codigo_dotacao,
  },
  {
    id: "destino",
    cabecalho: "Dotação destino",
    celula: (alt) => <span className="font-mono text-caption">{alt.dotacao_destino?.codigo_dotacao || "—"}</span>,
    ordenarPor: (alt) => alt.dotacao_destino?.codigo_dotacao,
    buscarPor: (alt) => alt.dotacao_destino?.codigo_dotacao,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (alt) => <span className="font-medium tabular-nums">{formatCurrency(alt.valor)}</span>,
    ordenarPor: (alt) => Number(alt.valor),
    alinhamento: "direita",
  },
  {
    id: "status",
    cabecalho: "Situação",
    celula: (alt) => {
      const situacao = SITUACAO[alt.status];
      return <StatusBadge tom={situacao?.tom ?? "neutro"}>{situacao?.label ?? alt.status}</StatusBadge>;
    },
    ordenarPor: (alt) => SITUACAO[alt.status]?.label ?? alt.status,
  },
];

export default function AlteracoesOrcamentariasPage() {
  const [exercicio] = useState(new Date().getFullYear());
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useAlteracoesOrcamentarias({ exercicio });
  const alteracoes = data as AlteracaoComDotacoes[] | undefined;
  const { data: dotacoes } = useDotacoes(exercicio);
  const criarAlteracao = useCriarAlteracaoOrcamentaria();

  // Form state
  const [formTipo, setFormTipo] = useState<TipoAlteracaoOrcamentaria>("suplementacao");
  const [formDotOrigem, setFormDotOrigem] = useState("");
  const [formDotDestino, setFormDotDestino] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formJustificativa, setFormJustificativa] = useState("");
  const [formFundamentacao, setFormFundamentacao] = useState("");

  const needsOrigem = ["remanejamento", "transposicao", "transferencia", "reducao"].includes(formTipo);
  const needsDestino = ["suplementacao", "remanejamento", "transposicao", "transferencia", "credito_especial", "credito_extraordinario"].includes(formTipo);

  // A busca por texto fica com o DataTable; aqui só os filtros de tipo e situação
  const filteredAlteracoes = (alteracoes ?? []).filter((a) => {
    if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
    if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
    return true;
  });

  const totalSupl = alteracoes
    ?.filter((a) => a.tipo === "suplementacao" && a.status === "executado")
    .reduce((s, a) => s + Number(a.valor), 0) || 0;
  const totalRed = alteracoes
    ?.filter((a) => a.tipo === "reducao" && a.status === "executado")
    .reduce((s, a) => s + Number(a.valor), 0) || 0;
  const totalRemn = alteracoes
    ?.filter((a) => a.tipo === "remanejamento" && a.status === "executado")
    .reduce((s, a) => s + Number(a.valor), 0) || 0;

  const handleSubmit = async () => {
    if (!formJustificativa || !formValor) return;

    await criarAlteracao.mutateAsync({
      exercicio,
      tipo: formTipo,
      dotacao_origem_id: needsOrigem && formDotOrigem ? formDotOrigem : null,
      dotacao_destino_id: needsDestino && formDotDestino ? formDotDestino : null,
      valor: parseFloat(formValor),
      justificativa: formJustificativa.trim(),
      fundamentacao_legal: formFundamentacao.trim() || null,
    });

    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormTipo("suplementacao");
    setFormDotOrigem("");
    setFormDotDestino("");
    setFormValor("");
    setFormJustificativa("");
    setFormFundamentacao("");
  };

  const temFiltro = filtroStatus !== "todos" || filtroTipo !== "todos";

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Alterações orçamentárias" }]}
          titulo="Alterações orçamentárias"
          descricao="Suplementações, reduções, remanejamentos e créditos"
          acoes={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova alteração
            </Button>
          }
        />

        {/* Cards resumo */}
        <section aria-labelledby="alt-indicadores">
          <h2 id="alt-indicadores" className="sr-only">Totais executados em {exercicio}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard rotulo="Suplementações executadas" valor={formatCurrency(totalSupl)} icone={TrendingUp} carregando={isLoading} />
            <KpiCard rotulo="Reduções executadas" valor={formatCurrency(totalRed)} icone={TrendingDown} carregando={isLoading} />
            <KpiCard rotulo="Remanejamentos executados" valor={formatCurrency(totalRemn)} icone={ArrowRightLeft} carregando={isLoading} />
          </div>
        </section>

        <DataTable
          rotulo="Alterações orçamentárias"
          dados={filteredAlteracoes}
          colunas={colunas}
          chaveLinha={(alt) => alt.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as alterações orçamentárias." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número, justificativa ou dotação…" }}
          filtros={
            <>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="suplementacao">Suplementação</SelectItem>
                  <SelectItem value="reducao">Redução</SelectItem>
                  <SelectItem value="remanejamento">Remanejamento</SelectItem>
                  <SelectItem value="transposicao">Transposição</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="credito_especial">Crédito especial</SelectItem>
                  <SelectItem value="credito_extraordinario">Crédito extraordinário</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="pendente_analise">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="executado">Executado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          vazio={{
            icone: ArrowUpDown,
            titulo: temFiltro ? "Nenhuma alteração com esses filtros" : "Nenhuma alteração orçamentária encontrada",
            descricao: temFiltro
              ? "Ajuste o tipo ou a situação para ver outras alterações."
              : `Não há alterações orçamentárias registradas em ${exercicio}.`,
            acao: temFiltro ? undefined : (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova alteração
              </Button>
            ),
          }}
        />
      </div>

      {/* Dialog Nova Alteração */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova alteração orçamentária</DialogTitle>
            <DialogDescription>
              Registrar suplementação, redução ou remanejamento de dotação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="alt-tipo">Tipo de alteração</Label>
              <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoAlteracaoOrcamentaria)}>
                <SelectTrigger id="alt-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suplementacao">Suplementação</SelectItem>
                  <SelectItem value="reducao">Redução / Anulação</SelectItem>
                  <SelectItem value="remanejamento">Remanejamento</SelectItem>
                  <SelectItem value="transposicao">Transposição</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="credito_especial">Crédito Especial</SelectItem>
                  <SelectItem value="credito_extraordinario">Crédito Extraordinário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {needsOrigem && (
              <div>
                <Label htmlFor="alt-origem">Dotação de origem (anulação de)</Label>
                <Select value={formDotOrigem} onValueChange={setFormDotOrigem}>
                  <SelectTrigger id="alt-origem">
                    <SelectValue placeholder="Selecione a dotação..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dotacoes?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.codigo_dotacao} — {formatCurrency(d.saldo_disponivel || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsDestino && (
              <div>
                <Label htmlFor="alt-destino">Dotação de destino (suplementar)</Label>
                <Select value={formDotDestino} onValueChange={setFormDotDestino}>
                  <SelectTrigger id="alt-destino">
                    <SelectValue placeholder="Selecione a dotação..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dotacoes?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.codigo_dotacao} — {formatCurrency(d.valor_atual || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="alt-valor">Valor (R$)</Label>
              <Input
                id="alt-valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="alt-justificativa">Justificativa *</Label>
              <Textarea
                id="alt-justificativa"
                placeholder="Justificativa da alteração orçamentária..."
                value={formJustificativa}
                onChange={(e) => setFormJustificativa(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>

            <div>
              <Label htmlFor="alt-fundamentacao">Fundamentação legal</Label>
              <Input
                id="alt-fundamentacao"
                placeholder="Ex: Art. 43, §1º, inciso III, Lei 4.320/64"
                value={formFundamentacao}
                onChange={(e) => setFormFundamentacao(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={criarAlteracao.isPending || !formJustificativa || !formValor}
            >
              {criarAlteracao.isPending ? "Salvando..." : "Registrar alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
