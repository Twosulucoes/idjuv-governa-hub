/**
 * Página de Alterações Orçamentárias
 * Suplementações, reduções, remanejamentos com fluxo de aprovação
 */

import { useMemo, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ArrowUpDown, TrendingUp, TrendingDown, ArrowRightLeft, CheckCheck } from "lucide-react";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  aplicarFiltros,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
  type TomStatus,
} from "@/components/design-system";
import {
  useAlteracoesOrcamentarias,
  useConfirmarAlteracaoFiplan,
  useCriarAlteracaoOrcamentaria,
} from "@/hooks/useAlteracoesOrcamentarias";
import { useDotacoes } from "@/hooks/useFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
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

// Sem a coluna no banco (ou nulo), a alteração ainda não foi confirmada no FIPLAN
const confirmadaNoFiplan = (alt: AlteracaoOrcamentaria) => alt.situacao_fiplan === "confirmada";

// Situações em que não faz sentido lançar a alteração no FIPLAN
const SEM_LANCAMENTO_FIPLAN: StatusWorkflowFinanceiro[] = ["rejeitado", "cancelado", "estornado"];

const podeConfirmarNoFiplan = (alt: AlteracaoOrcamentaria) =>
  !confirmadaNoFiplan(alt) && !SEM_LANCAMENTO_FIPLAN.includes(alt.status);

const filtrosAlteracao: FiltroDef<AlteracaoComDotacoes>[] = [
  {
    tipo: "lista",
    id: "tipo",
    rotulo: "Tipo",
    principal: true,
    valor: (alt) => alt.tipo,
    opcoes: Object.entries(TIPO_ALTERACAO_LABELS).map(([valor, rotulo]) => ({ valor, rotulo })),
  },
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    principal: true,
    valor: (alt) => alt.status,
    opcoes: Object.entries(SITUACAO).map(([valor, s]) => ({ valor, rotulo: s.label })),
  },
  { tipo: "periodo", id: "periodo", rotulo: "Data", principal: true, valor: (alt) => alt.data_alteracao },
  { tipo: "booleano", id: "falta_fiplan", rotulo: "Falta confirmar no FIPLAN", valor: podeConfirmarNoFiplan },
  { tipo: "faixa", id: "valor", rotulo: "Valor", formato: "moeda", valor: (alt) => Number(alt.valor) },
];

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
  {
    id: "fiplan",
    cabecalho: "FIPLAN",
    celula: (alt) =>
      confirmadaNoFiplan(alt) ? (
        <StatusBadge tom="sucesso">
          Confirmada
          {alt.confirmado_fiplan_em
            ? ` em ${format(new Date(alt.confirmado_fiplan_em), "dd/MM/yyyy", { locale: ptBR })}`
            : ""}
        </StatusBadge>
      ) : (
        <StatusBadge tom="pendente">Pendente</StatusBadge>
      ),
    ordenarPor: (alt) => alt.confirmado_fiplan_em ?? (confirmadaNoFiplan(alt) ? "1" : ""),
    buscarPor: (alt) => alt.processo_sei,
  },
];

export default function AlteracoesOrcamentariasPage() {
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const filtros = useEstadoFiltros("financeiro.alteracoes-orcamentarias", filtrosAlteracao);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useAlteracoesOrcamentarias({ exercicio });
  const alteracoes = data as AlteracaoComDotacoes[] | undefined;
  const { data: dotacoes } = useDotacoes(exercicio);
  const criarAlteracao = useCriarAlteracaoOrcamentaria();
  const confirmarFiplan = useConfirmarAlteracaoFiplan();
  // Confirmar o lançamento no FIPLAN é ato de aprovação do orçamento (a RPC confere a mesma permissão)
  const { hasPermission } = useAuth();
  const podeAprovarOrcamento = hasPermission("orcamento.aprovar");
  const [aConfirmar, setAConfirmar] = useState<AlteracaoComDotacoes | null>(null);

  // Form state
  const [formTipo, setFormTipo] = useState<TipoAlteracaoOrcamentaria>("suplementacao");
  const [formDotOrigem, setFormDotOrigem] = useState("");
  const [formDotDestino, setFormDotDestino] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formJustificativa, setFormJustificativa] = useState("");
  const [formFundamentacao, setFormFundamentacao] = useState("");
  const [formProcessoSei, setFormProcessoSei] = useState("");

  const needsOrigem = ["remanejamento", "transposicao", "transferencia", "reducao"].includes(formTipo);
  const needsDestino = ["suplementacao", "remanejamento", "transposicao", "transferencia", "credito_especial", "credito_extraordinario"].includes(formTipo);

  // Os cartões de totais acompanham os filtros; a busca por texto fica só na tabela
  const filtradas = useMemo(
    () => aplicarFiltros(alteracoes ?? [], filtros.definicoes, filtros.estado),
    [alteracoes, filtros.definicoes, filtros.estado],
  );

  const totalSupl = filtradas
    .filter((a) => a.tipo === "suplementacao" && a.status === "executado")
    .reduce((s, a) => s + Number(a.valor), 0) || 0;
  const totalRed = filtradas
    .filter((a) => a.tipo === "reducao" && a.status === "executado")
    .reduce((s, a) => s + Number(a.valor), 0) || 0;
  const totalRemn = filtradas
    .filter((a) => a.tipo === "remanejamento" && a.status === "executado")
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
      processo_sei: formProcessoSei.trim() || null,
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
    setFormProcessoSei("");
  };

  const confirmarNoFiplan = async () => {
    if (!aConfirmar) return;
    try {
      await confirmarFiplan.mutateAsync(aConfirmar.id);
      setAConfirmar(null);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };


  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Alterações orçamentárias" }]}
          titulo="Alterações orçamentárias"
          descricao={`Suplementações, reduções, remanejamentos e créditos · exercício ${exercicio}`}
          acoes={
            <>
              <SeletorExercicio />
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova alteração
              </Button>
            </>
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
          dados={alteracoes ?? []}
          colunas={colunas}
          chaveLinha={(alt) => alt.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as alterações orçamentárias." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número, justificativa, dotação ou processo SEI…" }}
          filtrosDinamicos={filtros}
          vazio={{
            icone: ArrowUpDown,
            titulo: "Nenhuma alteração orçamentária encontrada",
            descricao: `Não há alterações orçamentárias registradas em ${exercicio}.`,
            acao: (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova alteração
              </Button>
            ),
          }}
          acoesLinha={(alt) =>
            podeAprovarOrcamento && podeConfirmarNoFiplan(alt) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAConfirmar(alt)}
                aria-label={`Confirmar no FIPLAN a alteração ${alt.numero}`}
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Confirmar
              </Button>
            ) : null
          }
        />
      </div>

      {/* Confirmação manual do lançamento no FIPLAN */}
      <AlertDialog open={!!aConfirmar} onOpenChange={(aberto) => !aberto && !confirmarFiplan.isPending && setAConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar no FIPLAN?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme só depois de conferir que a alteração {aConfirmar?.numero}
              {aConfirmar?.processo_sei ? ` (processo SEI ${aConfirmar.processo_sei})` : ""} de{" "}
              {aConfirmar ? formatCurrency(aConfirmar.valor) : ""} já está lançada no FIPLAN. A data da confirmação
              fica registrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmarFiplan.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmarNoFiplan();
              }}
              disabled={confirmarFiplan.isPending}
            >
              {confirmarFiplan.isPending ? "Confirmando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

            <div>
              <Label htmlFor="alt-processo-sei">Processo SEI</Label>
              <Input
                id="alt-processo-sei"
                placeholder="Nº do processo"
                value={formProcessoSei}
                onChange={(e) => setFormProcessoSei(e.target.value)}
                maxLength={50}
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
