/**
 * Página de Alterações Orçamentárias
 * Suplementações, reduções, remanejamentos com fluxo de aprovação
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { useAlteracoesOrcamentarias, useCriarAlteracaoOrcamentaria } from "@/hooks/useAlteracoesOrcamentarias";
import { useDotacoes } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  STATUS_WORKFLOW_LABELS,
  TIPO_ALTERACAO_LABELS,
  type TipoAlteracaoOrcamentaria,
  type StatusWorkflowFinanceiro,
} from "@/types/financeiro";

const statusColors: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-800",
  pendente_analise: "bg-yellow-100 text-yellow-800",
  em_analise: "bg-blue-100 text-blue-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-200 text-gray-600",
  executado: "bg-emerald-100 text-emerald-800",
  estornado: "bg-orange-100 text-orange-800",
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

export default function AlteracoesOrcamentariasPage() {
  const [exercicio] = useState(new Date().getFullYear());
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: alteracoes, isLoading } = useAlteracoesOrcamentarias({ exercicio });
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

  const filteredAlteracoes = alteracoes?.filter((a) => {
    if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
    if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
    if (busca) {
      const termo = busca.toLowerCase();
      return (
        a.numero?.toLowerCase().includes(termo) ||
        a.justificativa?.toLowerCase().includes(termo)
      );
    }
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
      justificativa: formJustificativa,
      fundamentacao_legal: formFundamentacao || null,
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

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alterações Orçamentárias</h1>
            <p className="text-muted-foreground">
              Suplementações, reduções, remanejamentos e créditos
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Alteração
          </Button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Suplementações Executadas</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSupl)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="text-sm text-muted-foreground">Reduções Executadas</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Remanejamentos Executados</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRemn)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou justificativa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="suplementacao">Suplementação</SelectItem>
                  <SelectItem value="reducao">Redução</SelectItem>
                  <SelectItem value="remanejamento">Remanejamento</SelectItem>
                  <SelectItem value="transposicao">Transposição</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="credito_especial">Crédito Especial</SelectItem>
                  <SelectItem value="credito_extraordinario">Crédito Extraordinário</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="pendente_analise">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="executado">Executado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dotação Origem</TableHead>
                  <TableHead>Dotação Destino</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredAlteracoes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <ArrowUpDown className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      Nenhuma alteração orçamentária encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlteracoes?.map((alt) => {
                    const TipoIcon = tipoIcons[alt.tipo] || ArrowUpDown;
                    return (
                      <TableRow key={alt.id}>
                        <TableCell className="font-mono font-medium">{alt.numero}</TableCell>
                        <TableCell>
                          {format(new Date(alt.data_alteracao), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TipoIcon className="h-3 w-3" />
                            {TIPO_ALTERACAO_LABELS[alt.tipo as TipoAlteracaoOrcamentaria] || alt.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {(alt as any).dotacao_origem?.codigo_dotacao || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {(alt as any).dotacao_destino?.codigo_dotacao || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(alt.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[alt.status] || "bg-gray-100"}>
                            {STATUS_WORKFLOW_LABELS[alt.status as StatusWorkflowFinanceiro] || alt.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nova Alteração */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Alteração Orçamentária</DialogTitle>
            <DialogDescription>
              Registrar suplementação, redução ou remanejamento de dotação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de Alteração</Label>
              <Select value={formTipo} onValueChange={(v) => setFormTipo(v as TipoAlteracaoOrcamentaria)}>
                <SelectTrigger>
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
                <Label>Dotação de Origem (anulação de)</Label>
                <Select value={formDotOrigem} onValueChange={setFormDotOrigem}>
                  <SelectTrigger>
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
                <Label>Dotação de Destino (suplementar)</Label>
                <Select value={formDotDestino} onValueChange={setFormDotDestino}>
                  <SelectTrigger>
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
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
              />
            </div>

            <div>
              <Label>Justificativa *</Label>
              <Textarea
                placeholder="Justificativa da alteração orçamentária..."
                value={formJustificativa}
                onChange={(e) => setFormJustificativa(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Fundamentação Legal</Label>
              <Input
                placeholder="Ex: Art. 43, §1º, inciso III, Lei 4.320/64"
                value={formFundamentacao}
                onChange={(e) => setFormFundamentacao(e.target.value)}
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
              {criarAlteracao.isPending ? "Salvando..." : "Registrar Alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
