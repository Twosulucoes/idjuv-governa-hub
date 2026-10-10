/**
 * Página de Restos a Pagar
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Archive, Ban, FileText, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { ModuleLayout } from '@/components/layout';
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from '@/components/design-system';
import { useRestosPagar, useResumoRAP, useInscreverRAP, useCancelarRAP } from '@/hooks/useRestosAPagar';
import { STATUS_RAP_LABELS, TIPO_RAP_LABELS, type RestoPagar, type StatusRestoPagar } from '@/types/financeiro';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const TOM_STATUS_RAP: Record<StatusRestoPagar, TomStatus> = {
  inscrito: 'pendente',
  em_liquidacao: 'andamento',
  liquidado: 'andamento',
  pago: 'sucesso',
  cancelado: 'erro',
  prescrito: 'neutro',
};

function StatusRapBadge({ status }: { status: string }) {
  const label = STATUS_RAP_LABELS[status as StatusRestoPagar];
  if (!label) return <StatusBadge tom="neutro">{status || 'Sem status'}</StatusBadge>;
  return <StatusBadge tom={TOM_STATUS_RAP[status as StatusRestoPagar]}>{label}</StatusBadge>;
}

const colunas: ColunaTabela<RestoPagar>[] = [
  {
    id: 'empenho',
    cabecalho: 'Empenho',
    celula: (rap) => <span className="font-mono">{rap.empenho?.numero || '-'}</span>,
    ordenarPor: (rap) => rap.empenho?.numero,
    buscarPor: (rap) => rap.empenho?.numero,
    mobile: 'titulo',
  },
  {
    id: 'exercicio_origem',
    cabecalho: 'Exercício de origem',
    celula: (rap) => rap.exercicio_origem,
    ordenarPor: (rap) => rap.exercicio_origem,
  },
  {
    id: 'tipo',
    cabecalho: 'Tipo',
    celula: (rap) => <Badge variant="outline">{TIPO_RAP_LABELS[rap.tipo]}</Badge>,
    ordenarPor: (rap) => TIPO_RAP_LABELS[rap.tipo],
  },
  {
    id: 'fornecedor',
    cabecalho: 'Fornecedor',
    celula: (rap) => rap.empenho?.fornecedor?.razao_social || '-',
    ordenarPor: (rap) => rap.empenho?.fornecedor?.razao_social,
    buscarPor: (rap) => rap.empenho?.fornecedor?.razao_social,
  },
  {
    id: 'valor_inscrito',
    cabecalho: 'Valor inscrito',
    celula: (rap) => <span className="font-mono tabular-nums">{formatCurrency(rap.valor_inscrito)}</span>,
    ordenarPor: (rap) => Number(rap.valor_inscrito),
    alinhamento: 'direita',
  },
  {
    id: 'valor_pago',
    cabecalho: 'Pago',
    celula: (rap) => <span className="font-mono tabular-nums">{formatCurrency(rap.valor_pago)}</span>,
    ordenarPor: (rap) => Number(rap.valor_pago),
    alinhamento: 'direita',
  },
  {
    id: 'saldo',
    cabecalho: 'Saldo',
    celula: (rap) => <span className="font-mono font-bold tabular-nums">{formatCurrency(rap.saldo)}</span>,
    ordenarPor: (rap) => Number(rap.saldo),
    alinhamento: 'direita',
  },
  {
    id: 'status',
    cabecalho: 'Situação',
    celula: (rap) => <StatusRapBadge status={rap.status} />,
    ordenarPor: (rap) => STATUS_RAP_LABELS[rap.status] ?? rap.status,
  },
];

export default function RestosAPagarPage() {
  const anoAtual = new Date().getFullYear();
  const [exercicio, setExercicio] = useState(anoAtual);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [cancelarDialog, setCancelarDialog] = useState<string | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [inscreverDialog, setInscreverDialog] = useState(false);
  const [exercicioOrigem, setExercicioOrigem] = useState(anoAtual - 1);

  const { data: restos, isLoading, isError, refetch } = useRestosPagar({
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

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Restos a pagar" }]}
        titulo="Restos a pagar"
        descricao="Controle de RAP processados e não processados"
        acoes={
          <>
            <Select value={String(exercicio)} onValueChange={(v) => setExercicio(Number(v))}>
              <SelectTrigger className="w-[120px]" aria-label="Exercício de inscrição">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setInscreverDialog(true)}>
              <Archive className="h-4 w-4" aria-hidden="true" />
              Inscrever RAP
            </Button>
          </>
        }
      />

      {/* Cards Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            rotulo={`RAP processados (${resumo.processados.total} registro(s))`}
            valor={formatCurrency(resumo.processados.inscrito)}
            icone={FileText}
          />
          <KpiCard
            rotulo={`RAP não processados (${resumo.nao_processados.total} registro(s))`}
            valor={formatCurrency(resumo.nao_processados.inscrito)}
            icone={FileText}
          />
          <KpiCard
            rotulo="Pagos"
            valor={formatCurrency(resumo.processados.pago + resumo.nao_processados.pago)}
            icone={TrendingUp}
          />
          <KpiCard
            rotulo="Saldo pendente"
            valor={formatCurrency(resumo.processados.saldo + resumo.nao_processados.saldo)}
            icone={TrendingDown}
          />
        </div>
      )}

      <DataTable
        rotulo="Restos a pagar"
        dados={restos ?? []}
        colunas={colunas}
        chaveLinha={(rap) => rap.id}
        carregando={isLoading}
        erro={isError ? "Não foi possível carregar os restos a pagar." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por empenho ou fornecedor…" }}
        filtros={
          <>
            <Select value={filtroTipo || "all"} onValueChange={(v) => setFiltroTipo(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="processado">Processado</SelectItem>
                <SelectItem value="nao_processado">Não processado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroStatus || "all"} onValueChange={(v) => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por situação">
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                {Object.entries(STATUS_RAP_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        vazio={{
          icone: Archive,
          titulo: "Nenhum resto a pagar encontrado",
          descricao: "Ajuste os filtros ou inscreva os RAP do exercício.",
        }}
        acoesLinha={(rap) =>
          rap.status === 'inscrito' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCancelarDialog(rap.id)}
              aria-label={`Cancelar resto a pagar do empenho ${rap.empenho?.numero || ''}`.trim()}
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null
        }
      />

      {/* Dialog Inscrever RAP */}
      <Dialog open={inscreverDialog} onOpenChange={setInscreverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
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
    </ModuleLayout>
  );
}
