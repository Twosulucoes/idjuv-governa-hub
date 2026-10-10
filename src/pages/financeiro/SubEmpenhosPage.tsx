/**
 * Página de Sub-Empenhos (Reforço / Anulação)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Search, Wallet, FileX } from 'lucide-react';
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from '@/components/design-system';
import { ModuleLayout } from '@/components/layout';
import { useEmpenhos } from '@/hooks/useFinanceiro';
import { useSubEmpenhos, useCriarSubEmpenho } from '@/hooks/useSubEmpenhos';
import { TIPO_SUB_EMPENHO_LABELS, type SubEmpenho } from '@/types/financeiro';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

/** Situação do sub-empenho → rótulo e tom do selo. */
const SITUACAO_SUB_EMPENHO: Record<SubEmpenho['status'], { label: string; tom: TomStatus }> = {
  ativo: { label: 'Ativo', tom: 'sucesso' },
  cancelado: { label: 'Cancelado', tom: 'neutro' },
};

const colunas: ColunaTabela<SubEmpenho>[] = [
  {
    id: 'numero',
    cabecalho: 'Número',
    celula: (se) => <span className="font-mono">{se.numero}</span>,
    ordenarPor: (se) => se.numero,
    mobile: 'titulo',
  },
  {
    id: 'tipo',
    cabecalho: 'Tipo',
    celula: (se) => {
      const TipoIcon = se.tipo === 'anulacao' ? TrendingDown : TrendingUp;
      return (
        <Badge variant="outline" className="gap-1">
          <TipoIcon className="h-3 w-3" aria-hidden="true" />
          {TIPO_SUB_EMPENHO_LABELS[se.tipo] ?? se.tipo}
        </Badge>
      );
    },
    ordenarPor: (se) => se.tipo,
  },
  {
    id: 'data',
    cabecalho: 'Data',
    celula: (se) => new Date(se.data_registro).toLocaleDateString('pt-BR'),
    ordenarPor: (se) => new Date(se.data_registro),
  },
  {
    id: 'valor',
    cabecalho: 'Valor',
    celula: (se) => <span className="font-mono tabular-nums">{formatCurrency(se.valor)}</span>,
    ordenarPor: (se) => Number(se.valor),
    alinhamento: 'direita',
  },
  {
    id: 'justificativa',
    cabecalho: 'Justificativa',
    celula: (se) => (
      <span className="block max-w-xs truncate" title={se.justificativa}>
        {se.justificativa}
      </span>
    ),
  },
  {
    id: 'situacao',
    cabecalho: 'Situação',
    celula: (se) => {
      const s = SITUACAO_SUB_EMPENHO[se.status];
      return s ? <StatusBadge tom={s.tom}>{s.label}</StatusBadge> : <StatusBadge tom="neutro">{se.status}</StatusBadge>;
    },
    ordenarPor: (se) => SITUACAO_SUB_EMPENHO[se.status]?.label ?? se.status,
  },
];

export default function SubEmpenhosPage() {
  const [empenhoSelecionado, setEmpenhoSelecionado] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [novoDialog, setNovoDialog] = useState(false);
  const [tipo, setTipo] = useState<'reforco' | 'anulacao'>('reforco');
  const [valor, setValor] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [docReferencia, setDocReferencia] = useState('');

  const { data: empenhos } = useEmpenhos();
  const { data: subEmpenhos, isLoading, isError, refetch } = useSubEmpenhos(empenhoSelecionado || undefined);
  const criarSubEmpenho = useCriarSubEmpenho();

  const empenhosFiltrados = empenhos?.filter((e) =>
    !busca || e.numero.toLowerCase().includes(busca.toLowerCase()) || e.objeto.toLowerCase().includes(busca.toLowerCase())
  );

  const empenhoAtual = empenhos?.find((e) => e.id === empenhoSelecionado);

  const handleCriar = () => {
    if (!empenhoSelecionado || !valor || !justificativa) return;
    criarSubEmpenho.mutate({
      empenho_id: empenhoSelecionado,
      tipo,
      valor: Number(valor),
      justificativa,
      documento_referencia: docReferencia || undefined,
    }, {
      onSuccess: () => {
        setNovoDialog(false);
        setValor('');
        setJustificativa('');
        setDocReferencia('');
      },
    });
  };

  const totalReforcos = subEmpenhos?.filter(s => s.tipo === 'reforco').reduce((sum, s) => sum + s.valor, 0) || 0;
  const totalAnulacoes = subEmpenhos?.filter(s => s.tipo === 'anulacao').reduce((sum, s) => sum + s.valor, 0) || 0;

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: 'Financeiro', href: '/financeiro' }, { rotulo: 'Sub-empenhos' }]}
        titulo="Sub-empenhos"
        descricao="Reforço e anulação de empenhos"
        acoes={
          empenhoAtual && (
            <Button onClick={() => setNovoDialog(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo sub-empenho
            </Button>
          )
        }
      />

      {/* Seleção do Empenho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecionar empenho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por número ou objeto..."
              aria-label="Buscar empenho por número ou objeto"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-border rounded-md">
            {empenhosFiltrados?.slice(0, 20).map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === empenhoSelecionado}
                onClick={() => setEmpenhoSelecionado(e.id)}
                className={`w-full text-left px-4 py-2 hover:bg-muted/50 border-b border-border last:border-b-0 text-sm ${
                  e.id === empenhoSelecionado ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                <span className="font-mono">{e.numero}</span>
                <span className="mx-2 text-muted-foreground" aria-hidden="true">•</span>
                <span className="text-muted-foreground truncate">{e.objeto}</span>
                <span className="float-right tabular-nums">{formatCurrency(e.valor_empenhado)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {empenhoAtual && (
        <>
          {/* Info do Empenho + Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard rotulo="Valor original" valor={formatCurrency(empenhoAtual.valor_empenhado)} icone={Wallet} />
            <KpiCard rotulo="Reforços" valor={formatCurrency(totalReforcos)} icone={TrendingUp} />
            <KpiCard rotulo="Anulações" valor={formatCurrency(totalAnulacoes)} icone={TrendingDown} />
          </div>

          <DataTable
            rotulo="Sub-empenhos"
            dados={subEmpenhos ?? []}
            colunas={colunas}
            chaveLinha={(se) => se.id}
            carregando={isLoading}
            erro={isError ? 'Verifique sua conexão e tente novamente.' : null}
            aoTentarNovamente={() => refetch()}
            vazio={{
              icone: FileX,
              titulo: 'Nenhum sub-empenho registrado',
              descricao: 'Use "Novo sub-empenho" para registrar um reforço ou uma anulação.',
            }}
          />
        </>
      )}

      {/* Dialog Novo Sub-Empenho */}
      <Dialog open={novoDialog} onOpenChange={setNovoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo sub-empenho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as 'reforco' | 'anulacao')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reforco">Reforço</SelectItem>
                  <SelectItem value="anulacao">Anulação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Justificativa *</Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Informe a justificativa..."
                rows={3}
              />
            </div>
            <div>
              <Label>Documento de Referência</Label>
              <Input
                value={docReferencia}
                onChange={(e) => setDocReferencia(e.target.value)}
                placeholder="Ex: Ofício nº 123/2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleCriar}
              disabled={!valor || !justificativa || criarSubEmpenho.isPending}
            >
              {criarSubEmpenho.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleLayout>
  );
}
