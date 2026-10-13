/**
 * Lista de processos do SEI acompanhados no sistema (view v_processos_acompanhamento).
 * Abas "Na minha unidade" / "Todos"; filtros por tipo (modelo), etapa, unidade e prazo.
 * Padrões do design system: PageHeader, KpiCard, DataTable, StatusBadge.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DataTable,
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
} from '@/components/design-system';
import { Plus, Search, FileText, AlertTriangle, CheckCircle2, Clock, ChevronRight, FolderOpen, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIdentidade } from '@/core/tenant';
import {
  useModeloProcesso,
  useModelosProcesso,
  useProcessosAcompanhamento,
  useUnidadesParaFiltro,
} from '@/hooks/useAcompanhamentoProcessos';
import { rotuloSituacaoPrazo, TOM_STATUS_PROCESSO, tomStatusDoSemaforo } from '@/lib/workflow/semaforoPrazo';
import { AvisoLimiteLinhas } from '@/components/workflow/AvisoLimiteLinhas';
import { NovoProcessoDialog } from '@/components/workflow/NovoProcessoDialog';
import {
  STATUS_PROCESSO_LABELS,
  type ProcessoAcompanhamento,
  type SituacaoPrazo,
  type StatusProcesso,
} from '@/types/workflow';

const SITUACOES: SituacaoPrazo[] = ['em_dia', 'vence_logo', 'vencido', 'sem_prazo'];
const STATUS: StatusProcesso[] = ['aberto', 'em_tramitacao', 'suspenso', 'concluido', 'arquivado'];
const TODOS = 'todos';

const numeroInterno = (p: ProcessoAcompanhamento) => p.numero_formatado || `${p.numero_processo}/${p.ano}`;

export default function GestaoProcessosPage() {
  const navigate = useNavigate();
  const { sigla } = useIdentidade();
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();

  const [aba, setAba] = useState<'minha_unidade' | 'todos'>(params.get('meus') === 'true' ? 'minha_unidade' : 'todos');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(params.get('tipo') ?? TODOS);
  const [filtroEtapa, setFiltroEtapa] = useState(params.get('etapa') ?? TODOS);
  const [filtroUnidade, setFiltroUnidade] = useState(params.get('unidade') ?? TODOS);
  const [filtroPrazo, setFiltroPrazo] = useState(
    SITUACOES.includes(params.get('prazo') as SituacaoPrazo) ? (params.get('prazo') as string) : TODOS,
  );
  const [filtroStatus, setFiltroStatus] = useState(
    STATUS.includes(params.get('status') as StatusProcesso) ? (params.get('status') as string) : TODOS,
  );
  const podeCriar = hasPermission('workflow.criar');
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);

  // Navegação dentro da rota (menu, painel): reaplica o que veio na URL; `acao=novo` abre o diálogo uma vez e sai da URL
  useEffect(() => {
    if (params.has('meus')) setAba(params.get('meus') === 'true' ? 'minha_unidade' : 'todos');
    if (params.has('tipo')) setFiltroTipo(params.get('tipo') ?? TODOS);
    if (params.has('etapa')) setFiltroEtapa(params.get('etapa') ?? TODOS);
    if (params.has('unidade')) setFiltroUnidade(params.get('unidade') ?? TODOS);
    const prazo = params.get('prazo');
    if (prazo) setFiltroPrazo(SITUACOES.includes(prazo as SituacaoPrazo) ? prazo : TODOS);
    const status = params.get('status');
    if (status) setFiltroStatus(STATUS.includes(status as StatusProcesso) ? status : TODOS);
    if (params.get('acao') === 'novo') {
      if (podeCriar) setNovoDialogOpen(true);
      const resto = new URLSearchParams(params);
      resto.delete('acao');
      setParams(resto, { replace: true });
    }
  }, [params, setParams, podeCriar]);

  const { data: modelos } = useModelosProcesso();
  const { data: modeloEscolhido } = useModeloProcesso(filtroTipo === TODOS ? '' : filtroTipo);
  const { data: unidades } = useUnidadesParaFiltro();

  const { data: processos, isLoading, isError, refetch, semLotacao } = useProcessosAcompanhamento({
    escopo: aba,
    modeloCodigo: filtroTipo !== TODOS ? filtroTipo : undefined,
    etapa: filtroTipo !== TODOS && Number.isFinite(Number(filtroEtapa)) && Number(filtroEtapa) > 0 ? Number(filtroEtapa) : undefined,
    unidadeId: filtroUnidade !== TODOS ? filtroUnidade : undefined,
    status: filtroStatus !== TODOS ? (filtroStatus as StatusProcesso) : undefined,
    situacaoPrazo: filtroPrazo !== TODOS ? (filtroPrazo as SituacaoPrazo) : undefined,
    busca: busca || undefined,
  });

  const lista = processos ?? [];
  const totalVencidos = lista.filter((p) => p.situacao_prazo === 'vencido').length;
  const totalVenceLogo = lista.filter((p) => p.situacao_prazo === 'vence_logo').length;
  const totalConcluidos = lista.filter((p) => p.status === 'concluido').length;

  const abrirProcesso = (p: ProcessoAcompanhamento) => navigate(`/workflow/processos/${p.id}`);

  const mudarTipo = (v: string) => {
    setFiltroTipo(v);
    setFiltroEtapa(TODOS); // a etapa só existe dentro de um modelo
  };

  const colunas: ColunaTabela<ProcessoAcompanhamento>[] = [
    {
      id: 'numero',
      cabecalho: 'Nº interno',
      celula: (p) => <span className="font-mono font-medium">{numeroInterno(p)}</span>,
      ordenarPor: (p) => numeroInterno(p),
      className: 'w-[120px]',
    },
    {
      id: 'sei',
      cabecalho: 'Nº SEI',
      celula: (p) =>
        p.numero_sei ? (
          <span className="font-mono">{p.numero_sei}</span>
        ) : (
          <span className="text-muted-foreground">Não informado</span>
        ),
      ordenarPor: (p) => p.numero_sei ?? '',
    },
    {
      id: 'tipo',
      cabecalho: 'Tipo',
      celula: (p) => <Badge variant="outline">{p.modelo_nome ?? 'Sem modelo'}</Badge>,
      ordenarPor: (p) => p.modelo_nome ?? '',
    },
    {
      id: 'assunto',
      cabecalho: 'Assunto',
      celula: (p) => <span className="block max-w-[220px] truncate">{p.assunto}</span>,
      ordenarPor: (p) => p.assunto,
      mobile: 'titulo',
    },
    {
      id: 'etapa',
      cabecalho: 'Etapa',
      celula: (p) =>
        p.etapa_atual_ordem ? (
          <span>{p.etapa_atual_ordem}/{p.etapa_total}. {p.etapa_nome}</span>
        ) : (
          <span className="text-muted-foreground">Sem trilha</span>
        ),
      ordenarPor: (p) => p.etapa_atual_ordem ?? 0,
    },
    {
      id: 'unidade',
      cabecalho: 'Unidade',
      celula: (p) => <span>{p.unidade_sigla ?? p.unidade_nome ?? '-'}</span>,
      ordenarPor: (p) => p.unidade_sigla ?? p.unidade_nome ?? '',
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (p) => (
        <StatusBadge tom={TOM_STATUS_PROCESSO[p.status] ?? 'neutro'}>{STATUS_PROCESSO_LABELS[p.status] ?? p.status}</StatusBadge>
      ),
      ordenarPor: (p) => STATUS_PROCESSO_LABELS[p.status] ?? p.status,
    },
    {
      id: 'prazo',
      cabecalho: 'Prazo',
      celula: (p) => {
        const prazo = rotuloSituacaoPrazo(p.situacao_prazo);
        return <StatusBadge tom={tomStatusDoSemaforo(prazo.tom)}>{prazo.texto}</StatusBadge>;
      },
      ordenarPor: (p) => rotuloSituacaoPrazo(p.situacao_prazo).texto,
    },
  ];

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Processos', href: '/workflow' }, { rotulo: 'Gestão de processos' }]}
          titulo="Processos administrativos"
          descricao={`Acompanhamento dos processos do SEI no ${sigla}`}
          acoes={
            podeCriar ? (
              <Button onClick={() => setNovoDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo processo
              </Button>
            ) : undefined
          }
        />

        <Tabs value={aba} onValueChange={(v) => setAba(v as 'minha_unidade' | 'todos')}>
          <TabsList>
            <TabsTrigger value="minha_unidade">Na minha unidade</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Cards de resumo (sobre a lista carregada) */}
        <section aria-labelledby="processos-resumo">
          <h2 id="processos-resumo" className="sr-only">Resumo</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <li>
              <KpiCard rotulo="Processos" valor={lista.length} icone={FileText} carregando={isLoading} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Vencidos" valor={totalVencidos} icone={AlertTriangle} carregando={isLoading} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Vencem em breve" valor={totalVenceLogo} icone={Clock} carregando={isLoading} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Concluídos" valor={totalConcluidos} icone={CheckCircle2} carregando={isLoading} className="h-full" />
            </li>
          </ul>
        </section>

        <AvisoLimiteLinhas total={lista.length} complemento="Os resumos acima consideram só essas linhas." />

        {semLotacao ? (
          <EmptyState
            icone={UserX}
            titulo="Sem unidade para mostrar"
            descricao="Seu usuário não tem lotação ativa; peça ao RH. Enquanto isso, use a aba Todos."
          />
        ) : (
          <>
        {/* Tabela de processos (busca e filtros vão ao servidor pelo hook) */}
        <DataTable
          rotulo="Processos administrativos"
          dados={lista}
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
                  placeholder="Buscar por assunto, interessado, nº interno ou SEI..."
                  aria-label="Buscar processos"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroTipo} onValueChange={mudarTipo}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os tipos</SelectItem>
                  {(modelos ?? []).map((m) => (
                    <SelectItem key={m.codigo} value={m.codigo}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroEtapa} onValueChange={setFiltroEtapa} disabled={filtroTipo === TODOS}>
                <SelectTrigger className="w-full sm:w-[200px]" aria-label="Etapa">
                  <SelectValue placeholder={filtroTipo === TODOS ? 'Etapa (escolha o tipo)' : 'Etapa'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as etapas</SelectItem>
                  {(modeloEscolhido?.etapas ?? []).map((e) => (
                    <SelectItem key={e.ordem} value={String(e.ordem)}>{e.ordem}. {e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Unidade">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as unidades</SelectItem>
                  {(unidades ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.sigla ?? u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-[170px]" aria-label="Situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as situações</SelectItem>
                  {STATUS.map((st) => (
                    <SelectItem key={st} value={st}>{STATUS_PROCESSO_LABELS[st]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroPrazo} onValueChange={setFiltroPrazo}>
                <SelectTrigger className="w-full sm:w-[170px]" aria-label="Prazo">
                  <SelectValue placeholder="Prazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os prazos</SelectItem>
                  {SITUACOES.map((s) => (
                    <SelectItem key={s} value={s}>{rotuloSituacaoPrazo(s).texto}</SelectItem>
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
              aria-label={`Abrir processo ${numeroInterno(p)}`}
              onClick={(e) => {
                e.stopPropagation();
                abrirProcesso(p);
              }}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        />
          </>
        )}
      </div>

      {podeCriar && <NovoProcessoDialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen} />}
    </ModuleLayout>
  );
}
