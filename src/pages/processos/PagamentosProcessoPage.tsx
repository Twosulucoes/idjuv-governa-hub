import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, DataTable, KpiCard, StatusBadge, type ColunaTabela, type TomStatus } from '@/components/design-system';
import { 
  Wallet, 
  Plus, 
  Clock,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

const pagamentos = [
  {
    id: 'PAG-2024-0156',
    descricao: 'Nota Fiscal nº 12345 - Material Esportivo',
    fornecedor: 'Esportes Brasil LTDA',
    valor: 15680.00,
    dataVencimento: '2024-12-28',
    dataPagamento: null,
    status: 'pendente',
    tipo: 'fornecedor',
    processo: 'PROC-2024-089'
  },
  {
    id: 'PAG-2024-0155',
    descricao: 'Diárias - Viagem Manaus',
    fornecedor: 'João Silva Santos',
    valor: 2400.00,
    dataVencimento: '2024-12-25',
    dataPagamento: '2024-12-23',
    status: 'pago',
    tipo: 'diarias',
    processo: 'PROC-2024-095'
  },
  {
    id: 'PAG-2024-0154',
    descricao: 'Contrato de Manutenção Predial',
    fornecedor: 'Construmais Serviços',
    valor: 8500.00,
    dataVencimento: '2024-12-30',
    dataPagamento: null,
    status: 'em_analise',
    tipo: 'contrato',
    processo: 'PROC-2024-078'
  },
  {
    id: 'PAG-2024-0153',
    descricao: 'Ressarcimento Evento Esportivo',
    fornecedor: 'Maria Oliveira',
    valor: 890.00,
    dataVencimento: '2024-12-20',
    dataPagamento: null,
    status: 'atrasado',
    tipo: 'ressarcimento',
    processo: 'PROC-2024-102'
  },
];

const resumoMensal = {
  totalPago: 156780.00,
  totalPendente: 45890.00,
  totalAtrasado: 12350.00,
  quantidadePagamentos: 45
};

type Pagamento = (typeof pagamentos)[number];

/** Situação do pagamento → rótulo e tom do StatusBadge. */
const SITUACAO_PAGAMENTO: Record<string, { label: string; tom: TomStatus }> = {
  pago: { label: 'Pago', tom: 'sucesso' },
  pendente: { label: 'Pendente', tom: 'pendente' },
  em_analise: { label: 'Em análise', tom: 'andamento' },
  atrasado: { label: 'Atrasado', tom: 'erro' },
};

const TIPO_PAGAMENTO: Record<string, string> = {
  fornecedor: 'Fornecedor',
  diarias: 'Diárias',
  contrato: 'Contrato',
  ressarcimento: 'Ressarcimento'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

const colunas: ColunaTabela<Pagamento>[] = [
  {
    id: 'descricao',
    cabecalho: 'Descrição',
    mobile: 'titulo',
    celula: (pag) => (
      <div className="min-w-0">
        <div className="font-medium text-foreground">{pag.descricao}</div>
        <div className="font-mono text-caption text-muted-foreground">{pag.id}</div>
      </div>
    ),
    ordenarPor: (pag) => pag.descricao,
    buscarPor: (pag) => `${pag.descricao} ${pag.id}`,
  },
  {
    id: 'fornecedor',
    cabecalho: 'Fornecedor/favorecido',
    celula: (pag) => pag.fornecedor,
    ordenarPor: (pag) => pag.fornecedor,
    buscarPor: (pag) => pag.fornecedor,
  },
  {
    id: 'tipo',
    cabecalho: 'Tipo',
    celula: (pag) => <Badge variant="outline">{TIPO_PAGAMENTO[pag.tipo] || pag.tipo}</Badge>,
    ordenarPor: (pag) => TIPO_PAGAMENTO[pag.tipo] || pag.tipo,
  },
  {
    id: 'vencimento',
    cabecalho: 'Vencimento',
    celula: (pag) => formatDate(pag.dataVencimento),
    ordenarPor: (pag) => pag.dataVencimento,
  },
  {
    id: 'pagamento',
    cabecalho: 'Pago em',
    celula: (pag) => formatDate(pag.dataPagamento),
    ordenarPor: (pag) => pag.dataPagamento,
  },
  {
    id: 'processo',
    cabecalho: 'Processo',
    celula: (pag) => <span className="font-mono text-caption">{pag.processo}</span>,
    buscarPor: (pag) => pag.processo,
  },
  {
    id: 'valor',
    cabecalho: 'Valor',
    alinhamento: 'direita',
    celula: (pag) => <span className="tabular-nums">{formatCurrency(pag.valor)}</span>,
    ordenarPor: (pag) => pag.valor,
  },
  {
    id: 'situacao',
    cabecalho: 'Situação',
    celula: (pag) => {
      const config = SITUACAO_PAGAMENTO[pag.status];
      return <StatusBadge tom={config?.tom ?? 'neutro'}>{config?.label ?? pag.status}</StatusBadge>;
    },
    ordenarPor: (pag) => SITUACAO_PAGAMENTO[pag.status]?.label ?? pag.status,
  },
];

const etapasFluxo = [
  { numero: 1, titulo: 'Recebimento da Demanda', descricao: 'Nota fiscal ou solicitação de pagamento' },
  { numero: 2, titulo: 'Conferência Documental', descricao: 'Verificação de documentos e atesto' },
  { numero: 3, titulo: 'Empenho', descricao: 'Verificação de disponibilidade orçamentária' },
  { numero: 4, titulo: 'Liquidação', descricao: 'Reconhecimento da despesa' },
  { numero: 5, titulo: 'Ordenação', descricao: 'Autorização do ordenador de despesas' },
  { numero: 6, titulo: 'Pagamento', descricao: 'Efetivação do pagamento bancário' },
];

const PagamentosProcessoPage: React.FC = () => {
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const pagamentosFiltrados = pagamentos.filter(pag => filtroStatus === 'todos' || pag.status === filtroStatus);

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Processos', href: '/processos' }, { rotulo: 'Pagamentos' }]}
          titulo="Gestão de pagamentos"
          descricao="Controle de pagamentos, notas fiscais e liquidações"
          acoes={
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo pagamento
            </Button>
          }
        />

        {/* Indicadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard rotulo="Total pago (mês)" valor={formatCurrency(resumoMensal.totalPago)} icone={TrendingUp} />
          <KpiCard rotulo="Total pendente" valor={formatCurrency(resumoMensal.totalPendente)} icone={Clock} />
          <KpiCard rotulo="Total atrasado" valor={formatCurrency(resumoMensal.totalAtrasado)} icone={TrendingDown} />
          <KpiCard rotulo="Pagamentos (mês)" valor={resumoMensal.quantidadePagamentos} icone={DollarSign} />
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lista">Lista de pagamentos</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo do processo</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Lista de Pagamentos */}
          <TabsContent value="lista" className="space-y-6">
            <DataTable
              rotulo="Pagamentos"
              dados={pagamentosFiltrados}
              colunas={colunas}
              chaveLinha={(pag) => pag.id}
              busca={{ placeholder: 'Buscar por descrição, fornecedor ou número' }}
              filtros={
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por situação">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as situações</SelectItem>
                    {Object.entries(SITUACAO_PAGAMENTO).map(([valor, { label }]) => (
                      <SelectItem key={valor} value={valor}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
              vazio={{ icone: Wallet, titulo: 'Nenhum pagamento encontrado', descricao: 'Ajuste a busca ou o filtro de situação.' }}
              acoesLinha={(pag) => (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" aria-label={`Detalhes do pagamento ${pag.id}`}>
                    <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                    Detalhes
                  </Button>
                  {pag.status === 'pendente' && (
                    <Button size="sm" aria-label={`Processar pagamento ${pag.id}`}>
                      Processar
                    </Button>
                  )}
                </div>
              )}
            />
          </TabsContent>

          {/* Fluxo do Processo */}
          <TabsContent value="fluxo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de pagamentos</CardTitle>
                <CardDescription>
                  Etapas do processo de pagamento conforme legislação vigente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {etapasFluxo.map((etapa, index) => (
                    <li key={etapa.numero} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold" aria-hidden="true">
                          {etapa.numero}
                        </div>
                        {index < etapasFluxo.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <h3 className="font-semibold text-foreground">{etapa.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de pagamentos</CardTitle>
                <CardDescription>
                  Gere relatórios e extratos de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { titulo: 'Extrato mensal de pagamentos', desc: 'Todos os pagamentos do mês atual' },
                    { titulo: 'Relatório de pagamentos pendentes', desc: 'Lista de pagamentos aguardando processamento' },
                    { titulo: 'Relatório de pagamentos atrasados', desc: 'Pagamentos vencidos não processados' },
                    { titulo: 'Demonstrativo por fornecedor', desc: 'Pagamentos agrupados por fornecedor' },
                    { titulo: 'Relatório orçamentário', desc: 'Execução orçamentária de pagamentos' },
                    { titulo: 'Histórico anual', desc: 'Todos os pagamentos do exercício' }
                  ].map((relatorio) => (
                    <div key={relatorio.titulo} className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-foreground">{relatorio.titulo}</div>
                        <div className="text-sm text-muted-foreground">{relatorio.desc}</div>
                      </div>
                      <Button variant="outline" size="sm" aria-label={`Gerar ${relatorio.titulo.toLowerCase()}`}>
                        <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                        Gerar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default PagamentosProcessoPage;
