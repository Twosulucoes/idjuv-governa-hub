/**
 * Aba Consignações da ficha financeira: lista por servidor (filtro ativas/suspensas/quitadas),
 * margem consignável sobre o líquido da ficha, ações suspender/retomar/quitar e
 * "Lançar na ficha" (cria item de desconto, pois a RPC real não lança consignações).
 */

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info, Loader2, Pause, Pencil, Play, Plus, Receipt } from "lucide-react";
import {
  useConsignacoesAtivas,
  useLancarConsignacaoNaFicha,
  useSaveConsignacao,
  type ConsignacaoRow,
} from "@/hooks/useFolhaPagamento";
import { useParametrosFolha } from "@/hooks/useFolhaCalculos";
import {
  avaliarMargem,
  itemJaLancado,
  situacaoConsignacao,
  ultimoDiaCompetencia,
  type ItemParaReferencia,
  type SituacaoConsignacao,
} from "@/lib/folhaFichaRegras";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { TIPO_CONSIGNACAO_LABELS } from "@/types/folha";
import { ConsignacaoFormDialog } from "./ConsignacaoFormDialog";

type Filtro = "todas" | SituacaoConsignacao;

const SITUACAO_LABEL: Record<SituacaoConsignacao, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  quitada: "Quitada",
  inativa: "Inativa",
};

const SITUACAO_BADGE: Record<SituacaoConsignacao, "default" | "secondary" | "outline" | "destructive"> = {
  ativa: "default",
  suspensa: "destructive",
  quitada: "secondary",
  inativa: "outline",
};

type AcaoPendente = { tipo: "suspender" | "retomar" | "quitar" | "lancar"; consignacao: ConsignacaoRow } | null;

interface ConsignacoesFichaTabProps {
  fichaId: string;
  servidorId: string;
  valorLiquido: number | null | undefined;
  competenciaAno: number;
  competenciaMes: number;
  itens: ItemParaReferencia[];
  podeEditar: boolean;
}

export function ConsignacoesFichaTab({
  fichaId,
  servidorId,
  valorLiquido,
  competenciaAno,
  competenciaMes,
  itens,
  podeEditar,
}: ConsignacoesFichaTabProps) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<ConsignacaoRow | null>(null);
  const [acao, setAcao] = useState<AcaoPendente>(null);
  const [motivo, setMotivo] = useState("");

  const dataReferencia = ultimoDiaCompetencia(competenciaAno, competenciaMes);
  const { data: consignacoes, isLoading } = useConsignacoesAtivas(servidorId, true);
  const { data: parametros } = useParametrosFolha(dataReferencia);
  const salvar = useSaveConsignacao();
  const lancar = useLancarConsignacaoNaFicha();

  const lista = consignacoes ?? [];
  const percentualMargem = parametros?.margem_consignavel_percentual;
  const margem = useMemo(() => avaliarMargem(valorLiquido, percentualMargem, lista), [valorLiquido, percentualMargem, lista]);

  const filtradas = lista.filter((c) => filtro === "todas" || situacaoConsignacao(c) === filtro);

  const abrirNova = () => {
    setEmEdicao(null);
    setFormAberto(true);
  };
  const abrirEdicao = (c: ConsignacaoRow) => {
    setEmEdicao(c);
    setFormAberto(true);
  };

  const executarAcao = async () => {
    if (!acao) return;
    const hoje = format(new Date(), "yyyy-MM-dd");
    const c = acao.consignacao;
    try {
      if (acao.tipo === "suspender") {
        await salvar.mutateAsync({ id: c.id, suspenso: true, data_suspensao: hoje, motivo_suspensao: motivo || null });
      } else if (acao.tipo === "retomar") {
        await salvar.mutateAsync({ id: c.id, suspenso: false, data_suspensao: null, motivo_suspensao: null });
      } else if (acao.tipo === "quitar") {
        await salvar.mutateAsync({ id: c.id, quitado: true, data_quitacao: hoje, saldo_devedor: 0, parcelas_pagas: c.total_parcelas });
      } else if (acao.tipo === "lancar") {
        await lancar.mutateAsync({
          ficha_id: fichaId,
          rubrica_id: c.rubrica_id,
          descricao: `${TIPO_CONSIGNACAO_LABELS[c.tipo_consignacao ?? ""] ?? "Consignação"} - ${c.consignataria_nome}`,
          numero_contrato: c.numero_contrato,
          valor_parcela: Number(c.valor_parcela),
        });
      }
    } catch {
      // Toast de erro já emitido pelo hook (descreverErroBanco).
    } finally {
      setAcao(null);
      setMotivo("");
    }
  };

  const executando = salvar.isPending || lancar.isPending;

  const tituloAcao: Record<NonNullable<AcaoPendente>["tipo"], string> = {
    suspender: "Suspender consignação",
    retomar: "Retomar consignação",
    quitar: "Quitar consignação",
    lancar: "Lançar na ficha",
  };

  const descricaoAcao = (a: NonNullable<AcaoPendente>) => {
    const c = a.consignacao;
    switch (a.tipo) {
      case "suspender":
        return `A parcela de ${formatCurrency(Number(c.valor_parcela))} deixa de contar na margem e não será lançada até ser retomada.`;
      case "retomar":
        return "A consignação volta a contar na margem e pode ser lançada nas próximas fichas.";
      case "quitar":
        return "A consignação será marcada como quitada (saldo zero, todas as parcelas pagas). Não dá para desfazer pela tela.";
      case "lancar":
        return `Cria um desconto de ${formatCurrency(Number(c.valor_parcela))} nesta ficha com referência "${c.numero_contrato ?? ""}" e recalcula os totais. INSS/IRRF não mudam.`;
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          O processamento da folha <strong>não</strong> lança consignações automaticamente. Use "Lançar na ficha" para
          incluir a parcela como desconto. A margem abaixo usa o líquido desta ficha
          {percentualMargem ? ` e ${percentualMargem}% de margem` : " (parâmetro de margem não encontrado)"}.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Margem consignável</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold font-mono">{formatCurrency(margem.margem)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Usada (ativas)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold font-mono">{formatCurrency(margem.usada)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-semibold font-mono ${margem.disponivel < 0 ? "text-destructive" : "text-success"}`}>
              {formatCurrency(margem.disponivel)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="suspensa">Suspensas</SelectItem>
            <SelectItem value="quitada">Quitadas</SelectItem>
            <SelectItem value="inativa">Inativas</SelectItem>
          </SelectContent>
        </Select>
        {podeEditar && (
          <Button size="sm" onClick={abrirNova}>
            <Plus className="mr-2 h-4 w-4" />
            Nova consignação
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma consignação {filtro === "todas" ? "cadastrada" : "nesta situação"}.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consignatária</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Parcela</TableHead>
                <TableHead className="text-center">Pagas/Total</TableHead>
                <TableHead>Início</TableHead>
                <TableHead className="text-center">Situação</TableHead>
                {podeEditar && <TableHead className="text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((c) => {
                const situacao = situacaoConsignacao(c);
                const jaLancada = itemJaLancado(itens, c.numero_contrato);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.consignataria_nome}</TableCell>
                    <TableCell className="font-mono text-xs">{c.numero_contrato || "-"}</TableCell>
                    <TableCell>{TIPO_CONSIGNACAO_LABELS[c.tipo_consignacao ?? ""] ?? c.tipo_consignacao ?? "-"}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(c.valor_parcela))}</TableCell>
                    <TableCell className="text-center font-mono">
                      {c.parcelas_pagas ?? 0}/{c.total_parcelas}
                    </TableCell>
                    <TableCell>{formatDateBR(c.data_inicio)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant={SITUACAO_BADGE[situacao]}>{SITUACAO_LABEL[situacao]}</Badge>
                        {jaLancada && <Badge variant="outline" className="text-xs">Lançada nesta ficha</Badge>}
                      </div>
                    </TableCell>
                    {podeEditar && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEdicao(c)} disabled={situacao === "quitada"}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {situacao === "ativa" && (
                            <Button variant="ghost" size="icon" title="Suspender" onClick={() => setAcao({ tipo: "suspender", consignacao: c })}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {situacao === "suspensa" && (
                            <Button variant="ghost" size="icon" title="Retomar" onClick={() => setAcao({ tipo: "retomar", consignacao: c })}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {(situacao === "ativa" || situacao === "suspensa") && (
                            <Button variant="ghost" size="icon" title="Quitar" onClick={() => setAcao({ tipo: "quitar", consignacao: c })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {situacao === "ativa" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={jaLancada ? "Já lançada nesta ficha" : "Lançar na ficha"}
                              disabled={jaLancada || !c.numero_contrato}
                              onClick={() => setAcao({ tipo: "lancar", consignacao: c })}
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConsignacaoFormDialog
        open={formAberto}
        onOpenChange={setFormAberto}
        servidorId={servidorId}
        consignacao={emEdicao}
        valorLiquido={valorLiquido}
        percentualMargem={percentualMargem}
        consignacoes={lista}
      />

      <AlertDialog open={!!acao} onOpenChange={(aberto) => !aberto && !executando && setAcao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{acao ? tituloAcao[acao.tipo] : ""}</AlertDialogTitle>
            <AlertDialogDescription>{acao ? descricaoAcao(acao) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          {acao?.tipo === "suspender" && (
            <div className="space-y-2">
              <Label htmlFor="motivo-suspensao">Motivo (opcional)</Label>
              <Textarea id="motivo-suspensao" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void executarAcao();
              }}
              disabled={executando}
            >
              {executando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
