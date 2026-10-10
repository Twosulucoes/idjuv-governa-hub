import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Eye,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react';

import { CentralRelatoriosFederacoesDialog } from '@/components/federacoes/CentralRelatoriosFederacoesDialog';
import { EditarFederacaoDialog } from '@/components/federacoes/EditarFederacaoDialog';
import { CalendarioFederacaoTab } from '@/components/federacoes/CalendarioFederacaoTab';
import { CalendarioGeralFederacoesTab } from '@/components/federacoes/CalendarioGeralFederacoesTab';
import { FederacoesErrorBoundary } from '@/components/federacoes/FederacoesErrorBoundary';
import { MandatoExpiradoBadge, isMandatoExpirado } from '@/components/federacoes/MandatoExpiradoBadge';
import { FederacaoParceriasTab } from '@/components/federacoes/FederacaoParceriasTab';

import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from '@/components/design-system';
import { useIdentidade } from '@/core/tenant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Federacao {
  id: string;
  nome: string;
  sigla: string;
  cnpj?: string | null;
  data_criacao: string;
  endereco: string;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  telefone: string;
  email: string;
  instagram: string | null;
  facebook?: string | null;
  mandato_inicio: string;
  mandato_fim: string;
  presidente_nome: string;
  presidente_nascimento: string;
  presidente_telefone: string;
  presidente_email: string;
  presidente_endereco: string | null;
  presidente_endereco_logradouro?: string | null;
  presidente_endereco_numero?: string | null;
  presidente_endereco_bairro?: string | null;
  presidente_instagram: string | null;
  presidente_facebook?: string | null;
  vice_presidente_nome: string;
  vice_presidente_telefone: string;
  vice_presidente_data_nascimento?: string | null;
  vice_presidente_instagram?: string | null;
  vice_presidente_facebook?: string | null;
  diretor_tecnico_nome: string | null;
  diretor_tecnico_telefone: string | null;
  diretor_tecnico_data_nascimento?: string | null;
  diretor_tecnico_instagram?: string | null;
  diretor_tecnico_facebook?: string | null;
  status: 'em_analise' | 'ativo' | 'inativo' | 'rejeitado';
  observacoes_internas: string | null;
  data_analise: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; tom: TomStatus }> = {
  em_analise: { label: 'Em análise', tom: 'andamento' },
  ativo: { label: 'Ativa', tom: 'sucesso' },
  inativo: { label: 'Inativa', tom: 'neutro' },
  rejeitado: { label: 'Rejeitada', tom: 'erro' },
};

// Fallback seguro para status desconhecido
const getStatusConfig = (status: string | null | undefined) =>
  (status ? statusConfig[status] : undefined) ?? { label: status || 'Sem situação', tom: 'neutro' as TomStatus };

const formatDate = (date?: string | null) => {
  if (!date) return '-';
  // Prefer parseISO for yyyy-mm-dd / timestamps; fall back to raw on invalid.
  const parsed = parseISO(date);
  if (!isValid(parsed)) return date;
  return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
};

const colunas: ColunaTabela<Federacao>[] = [
  {
    id: 'federacao',
    cabecalho: 'Federação',
    celula: (fed) => (
      <div>
        <div className="font-medium">{fed.sigla || '-'}</div>
        <div className="max-w-[200px] truncate text-caption text-muted-foreground" title={fed.nome || undefined}>
          {fed.nome || '-'}
        </div>
      </div>
    ),
    ordenarPor: (fed) => fed.sigla,
    buscarPor: (fed) => `${fed.sigla ?? ''} ${fed.nome ?? ''}`,
    mobile: 'titulo',
  },
  {
    id: 'presidente',
    cabecalho: 'Presidente',
    celula: (fed) => fed.presidente_nome || '-',
    ordenarPor: (fed) => fed.presidente_nome,
    buscarPor: (fed) => fed.presidente_nome,
  },
  {
    id: 'mandato',
    cabecalho: 'Mandato',
    celula: (fed) => (
      <div className="flex flex-wrap items-center gap-2">
        <span>
          {formatDate(fed.mandato_inicio)} - {formatDate(fed.mandato_fim)}
        </span>
        {isMandatoExpirado(fed.mandato_fim) && (
          <MandatoExpiradoBadge mandatoFim={fed.mandato_fim} variant="badge" />
        )}
      </div>
    ),
    ordenarPor: (fed) => fed.mandato_fim,
  },
  {
    id: 'status',
    cabecalho: 'Situação',
    celula: (fed) => {
      const statusInfo = getStatusConfig(fed.status);
      return <StatusBadge tom={statusInfo.tom}>{statusInfo.label}</StatusBadge>;
    },
    ordenarPor: (fed) => getStatusConfig(fed.status).label,
  },
];

export default function GestaoFederacoesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sigla: siglaInstituicao } = useIdentidade();
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);

  const { data: federacoes = [], isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['federacoes'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('federacoes_esportivas')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('[Federações] Erro na query:', error);
          throw error;
        }
        return (data || []) as Federacao[];
      } catch (err) {
        console.error('[Federações] Erro ao buscar:', err);
        return [] as Federacao[];
      }
    },
  });

  // Log de debug para erros
  if (isError) {
    console.error('[Federações] Query error:', queryError);
  }

  // Busca por nome/sigla/presidente fica no DataTable; aqui só o filtro de situação
  const filteredFederacoes = useMemo(
    () =>
      (federacoes || []).filter(
        (fed) => Boolean(fed) && (statusFilter === 'todos' || fed.status === statusFilter),
      ),
    [federacoes, statusFilter],
  );

  const stats = {
    total: (federacoes || []).length,
    emAnalise: (federacoes || []).filter((f) => f?.status === 'em_analise').length,
    ativas: (federacoes || []).filter((f) => f?.status === 'ativo').length,
    inativas: (federacoes || []).filter((f) => f?.status === 'inativo').length,
  };

  const indicadores = [
    { rotulo: 'Total', valor: stats.total },
    { rotulo: 'Em análise', valor: stats.emAnalise },
    { rotulo: 'Ativas', valor: stats.ativas },
    { rotulo: 'Inativas', valor: stats.inativas },
  ];

  const handleViewDetails = useCallback((federacao: Federacao) => {
    navigate(`/admin/federacoes/${federacao.id}`);
  }, [navigate]);

  return (
    <FederacoesErrorBoundary>
    <ModuleLayout module="organizacoes">
      <div className="space-y-6">
        <PageHeader
          titulo="Federações esportivas"
          descricao={`Gerencie as federações vinculadas ao ${siglaInstituicao}`}
          acoes={
            <Button onClick={() => setRelatoriosOpen(true)}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Central de relatórios
            </Button>
          }
        />

        {/* Central de Relatórios Dialog */}
        <CentralRelatoriosFederacoesDialog
          open={relatoriosOpen}
          onOpenChange={setRelatoriosOpen}
        />

        {/* Tabs */}
        <Tabs defaultValue="federacoes" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="federacoes" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Federações
            </TabsTrigger>
            <TabsTrigger value="calendario" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Calendário geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="federacoes" className="mt-6 space-y-6">
            {/* Indicadores */}
            <section aria-labelledby="federacoes-indicadores">
              <h2 id="federacoes-indicadores" className="sr-only">Indicadores</h2>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {indicadores.map((ind) => (
                  <li key={ind.rotulo}>
                    <KpiCard rotulo={ind.rotulo} valor={ind.valor} carregando={isLoading} className="h-full" />
                  </li>
                ))}
              </ul>
            </section>

            <DataTable
              rotulo="Federações esportivas"
              dados={filteredFederacoes}
              colunas={colunas}
              chaveLinha={(fed) => fed.id}
              carregando={isLoading}
              erro={isError ? 'Não foi possível carregar as federações.' : null}
              aoTentarNovamente={() => refetch()}
              busca={{ placeholder: 'Buscar por nome, sigla ou presidente' }}
              filtros={
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Situação">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as situações</SelectItem>
                    <SelectItem value="em_analise">Em análise</SelectItem>
                    <SelectItem value="ativo">Ativas</SelectItem>
                    <SelectItem value="inativo">Inativas</SelectItem>
                    <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                  </SelectContent>
                </Select>
              }
              vazio={{
                icone: Building2,
                titulo: 'Nenhuma federação encontrada',
                descricao: statusFilter === 'todos' ? undefined : 'Ajuste o filtro de situação.',
              }}
              acoesLinha={(fed) => (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewDetails(fed)}
                  aria-label={`Ver detalhes de ${fed.sigla || fed.nome || 'federação'}`}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            />
          </TabsContent>

          <TabsContent value="calendario" className="mt-6">
            <CalendarioGeralFederacoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
    </FederacoesErrorBoundary>
  );
}
