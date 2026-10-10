/**
 * Página principal de gestão de processos administrativos (SEI-like)
 * Padrões do design system: PageHeader, KpiCard, DataTable, StatusBadge.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from '@/components/design-system';
import {
  Plus, Search, FileText, Clock, CheckCircle2,
  FolderOpen, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProcessos } from '@/hooks/useWorkflow';
import { useIdentidade } from '@/core/tenant';
import { NovoProcessoDialog } from '@/components/workflow/NovoProcessoDialog';
import {
  TIPO_PROCESSO_LABELS,
  STATUS_PROCESSO_LABELS,
  type ProcessoAdministrativo,
  type TipoProcesso,
  type StatusProcesso,
  type NivelSigilo,
} from '@/types/workflow';

// Situação do processo → selo (texto + tom; nunca só cor)
const STATUS_PROCESSO_SELO: Record<StatusProcesso, { label: string; tom: TomStatus }> = {
  aberto: { label: 'Aberto', tom: 'andamento' },
  em_tramitacao: { label: 'Em tramitação', tom: 'pendente' },
  suspenso: { label: 'Suspenso', tom: 'neutro' },
  concluido: { label: 'Concluído', tom: 'sucesso' },
  arquivado: { label: 'Arquivado', tom: 'neutro' },
};

const SIGILO_SELO: Record<NivelSigilo, { label: string; tom: TomStatus }> = {
  publico: { label: 'Público', tom: 'sucesso' },
  restrito: { label: 'Restrito', tom: 'pendente' },
  sigiloso: { label: 'Sigiloso', tom: 'erro' },
};

const seloStatus = (s: StatusProcesso | null | undefined) =>
  (s && STATUS_PROCESSO_SELO[s]) ?? { label: s ?? 'Sem situação', tom: 'neutro' as TomStatus };
const seloSigilo = (s: NivelSigilo | null | undefined) =>
  (s && SIGILO_SELO[s]) ?? { label: s ?? 'Sem sigilo', tom: 'neutro' as TomStatus };

const numeroDoProcesso = (p: ProcessoAdministrativo) => `${p.numero_processo}/${p.ano}`;

export default function GestaoProcessosPage() {
  const navigate = useNavigate();
  const { sigla } = useIdentidade();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusProcesso | 'todos'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<TipoProcesso | 'todos'>('todos');
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);

  const { data: processos, isLoading, isError, refetch } = useProcessos({
    status: filtroStatus !== 'todos' ? filtroStatus : undefined,
    tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
    busca: busca || undefined,
  });

  // Contadores
  const totalAbertos = processos?.filter(p => p.status === 'aberto').length || 0;
  const totalTramitando = processos?.filter(p => p.status === 'em_tramitacao').length || 0;
  const totalConcluidos = processos?.filter(p => p.status === 'concluido').length || 0;

  const abrirProcesso = (p: ProcessoAdministrativo) => navigate(`/workflow/processos/${p.id}`);

  const colunas: ColunaTabela<ProcessoAdministrativo>[] = [
    {
      id: 'numero',
      cabecalho: 'Número',
      celula: (p) => <span className="font-mono font-medium">{numeroDoProcesso(p)}</span>,
      ordenarPor: (p) => numeroDoProcesso(p),
      className: 'w-[120px]',
    },
    {
      id: 'assunto',
      cabecalho: 'Assunto',
      celula: (p) => <span className="block max-w-[200px] truncate">{p.assunto}</span>,
      ordenarPor: (p) => p.assunto,
      mobile: 'titulo',
    },
    {
      id: 'tipo',
      cabecalho: 'Tipo',
      celula: (p) => <Badge variant="outline">{TIPO_PROCESSO_LABELS[p.tipo_processo] ?? p.tipo_processo}</Badge>,
      ordenarPor: (p) => TIPO_PROCESSO_LABELS[p.tipo_processo] ?? p.tipo_processo,
    },
    {
      id: 'interessado',
      cabecalho: 'Interessado',
      celula: (p) => <span className="block max-w-[150px] truncate">{p.interessado_nome}</span>,
      ordenarPor: (p) => p.interessado_nome,
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (p) => {
        const selo = seloStatus(p.status);
        return <StatusBadge tom={selo.tom}>{selo.label}</StatusBadge>;
      },
      ordenarPor: (p) => seloStatus(p.status).label,
    },
    {
      id: 'sigilo',
      cabecalho: 'Sigilo',
      celula: (p) => {
        const selo = seloSigilo(p.sigilo);
        return <StatusBadge tom={selo.tom}>{selo.label}</StatusBadge>;
      },
      ordenarPor: (p) => seloSigilo(p.sigilo).label,
    },
    {
      id: 'abertura',
      cabecalho: 'Abertura',
      celula: (p) => (
        <span className="text-muted-foreground">
          {format(new Date(p.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      ),
      ordenarPor: (p) => new Date(p.data_abertura),
    },
  ];

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Processos', href: '/workflow' }, { rotulo: 'Gestão de processos' }]}
          titulo="Processos administrativos"
          descricao={`Tramitação oficial de processos do ${sigla}`}
          acoes={
            <Button onClick={() => setNovoDialogOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo processo
            </Button>
          }
        />

        {/* Cards de resumo */}
        <section aria-labelledby="processos-resumo">
          <h2 id="processos-resumo" className="sr-only">Resumo</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <li>
              <KpiCard rotulo="Total de processos" valor={processos?.length || 0} icone={FileText} carregando={isLoading} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Abertos" valor={totalAbertos} icone={FolderOpen} carregando={isLoading} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Em tramitação" valor={totalTramitando} icone={Clock} carregando={isLoading} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Concluídos" valor={totalConcluidos} icone={CheckCircle2} carregando={isLoading} className="h-full" />
            </li>
          </ul>
        </section>

        {/* Tabela de processos (busca e filtros vão ao servidor pelo hook) */}
        <DataTable
          rotulo="Processos administrativos"
          dados={processos ?? []}
          colunas={colunas}
          chaveLinha={(p) => p.id}
          carregando={isLoading}
          erro={isError ? 'Não foi possível carregar os processos.' : null}
          aoTentarNovamente={() => refetch()}
          aoClicarLinha={abrirProcesso}
          filtros={
            <>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Buscar por assunto, interessado ou número..."
                  aria-label="Buscar processos"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as StatusProcesso | 'todos')}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  {Object.entries(STATUS_PROCESSO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{STATUS_PROCESSO_SELO[key as StatusProcesso]?.label ?? label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as TipoProcesso | 'todos')}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_PROCESSO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          vazio={{
            icone: FolderOpen,
            titulo: 'Nenhum processo encontrado',
            descricao: 'Ajuste a busca e os filtros ou abra um novo processo.',
          }}
          acoesLinha={(p) => (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Abrir processo ${numeroDoProcesso(p)}`}
              onClick={(e) => {
                e.stopPropagation();
                abrirProcesso(p);
              }}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        />
      </div>

      <NovoProcessoDialog 
        open={novoDialogOpen} 
        onOpenChange={setNovoDialogOpen}
      />
    </ModuleLayout>
  );
}
