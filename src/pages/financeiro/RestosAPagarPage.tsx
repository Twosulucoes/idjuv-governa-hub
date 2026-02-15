/**
 * Página de Restos a Pagar
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Archive, Ban, FileText, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useRestosPagar, useResumoRAP, useInscreverRAP, useCancelarRAP } from '@/hooks/useRestosAPagar';
import { STATUS_RAP_LABELS, TIPO_RAP_LABELS } from '@/types/financeiro';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function RestosAPagarPage() {
  const anoAtual = new Date().getFullYear();
  const [exercicio, setExercicio] = useState(anoAtual);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [cancelarDialog, setCancelarDialog] = useState<string | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [inscreverDialog, setInscreverDialog] = useState(false);
  const [exercicioOrigem, setExercicioOrigem] = useState(anoAtual - 1);

  const { data: restos, isLoading } = useRestosPagar({
    exercicio_inscricao: exercicio,
    tipo: filtroTipo || undefined,
    status: filtroStatus || undefined,
  });
  const { data: resumo } = useResumoRAP(exercicio);
  const inscreverRAP = useInscreverRAP();
  const cancelarRAP = useCancelarRAP();

  const handleInscrever = () => {
    inscreverRAP.mutate({ exercicio_origem: exercicioOrigem, exercicio_inscricao: exercicio });
    setInscreverDialog(false);
  };

  const handleCancelar = () => {
    if (cancelarDialog && motivoCancelamento) {
      cancelarRAP.mutate({ id: cancelarDialog, motivo: motivoCancelamento });
      setCancelarDialog(null);
      setMotivoCancelamento('');
    }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      inscrito: 'bg-blue-100 text-blue-800',
      em_liquidacao: 'bg-yellow-100 text-yellow-800',
      liquidado: 'bg-orange-100 text-orange-800',
      pago: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      prescrito: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restos a Pagar</h1>
          <p className="text-muted-foreground">Controle de RAP processados e não processados</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(exercicio)} onValueChange={(v) => setExercicio(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setInscreverDialog(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Inscrever RAP
          </Button>
        </div>
      </div>

      {/* Cards Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">RAP Processados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.processados.inscrito)}</div>
              <p className="text-xs text-muted-foreground">{resumo.processados.total} registro(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">RAP Não Processados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.nao_processados.inscrito)}</div>
              <p className="text-xs text-muted-foreground">{resumo.nao_processados.total} registro(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" /> Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(resumo.processados.pago + resumo.nao_processados.pago)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-orange-500" /> Saldo Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(resumo.processados.saldo + resumo.nao_processados.saldo)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="processado">Processado</SelectItem>
            <SelectItem value="nao_processado">Não Processado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(STATUS_RAP_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empenho</TableHead>
                <TableHead>Exercício Origem</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Valor Inscrito</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : !restos?.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum resto a pagar encontrado
                  </TableCell>
                </TableRow>
              ) : (
                restos.map((rap) => (
                  <TableRow key={rap.id}>
                    <TableCell className="font-mono text-sm">{(rap.empenho as any)?.numero || '-'}</TableCell>
                    <TableCell>{rap.exercicio_origem}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TIPO_RAP_LABELS[rap.tipo]}</Badge>
                    </TableCell>
                    <TableCell>{(rap.empenho as any)?.fornecedor?.razao_social || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(rap.valor_inscrito)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(rap.valor_pago)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(rap.saldo)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(rap.status)}>{STATUS_RAP_LABELS[rap.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {rap.status === 'inscrito' && (
                        <Button variant="ghost" size="sm" onClick={() => setCancelarDialog(rap.id)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Inscrever RAP */}
      <Dialog open={inscreverDialog} onOpenChange={setInscreverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Inscrever Restos a Pagar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ação inscreverá automaticamente todos os empenhos com saldo pendente do exercício selecionado como Restos a Pagar.
            </p>
            <div>
              <Label>Exercício de Origem</Label>
              <Select value={String(exercicioOrigem)} onValueChange={(v) => setExercicioOrigem(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[anoAtual - 1, anoAtual - 2, anoAtual - 3].map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInscreverDialog(false)}>Cancelar</Button>
            <Button onClick={handleInscrever} disabled={inscreverRAP.isPending}>
              {inscreverRAP.isPending ? 'Processando...' : 'Confirmar Inscrição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cancelar RAP */}
      <Dialog open={!!cancelarDialog} onOpenChange={() => setCancelarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Resto a Pagar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo do Cancelamento *</Label>
              <Textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Informe o motivo do cancelamento..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelarDialog(null)}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={!motivoCancelamento || cancelarRAP.isPending}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
