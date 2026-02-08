import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  em_analise: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ativo: { label: 'Ativa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  inativo: { label: 'Inativa', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  rejeitado: { label: 'Rejeitada', color: 'bg-red-100 text-red-800', icon: XCircle },
};

// Fallback seguro para status desconhecido
const getStatusConfig = (status: string | null | undefined) => {
  if (!status || !statusConfig[status]) {
    return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: Clock };
  }
  return statusConfig[status];
};

export default function GestaoFederacoesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);

  const { data: federacoes = [], isLoading, isError, error: queryError } = useQuery({
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

  const filteredFederacoes = (federacoes || []).filter((fed) => {
    if (!fed) return false;
    
    const nome = (fed.nome || '').toLowerCase();
    const sigla = (fed.sigla || '').toLowerCase();
    const presidenteNome = (fed.presidente_nome || '').toLowerCase();
    const searchLower = search.toLowerCase();
    
    const matchesSearch = 
      nome.includes(searchLower) ||
      sigla.includes(searchLower) ||
      presidenteNome.includes(searchLower);
    
    const matchesStatus = statusFilter === 'todos' || fed.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: (federacoes || []).length,
    emAnalise: (federacoes || []).filter((f) => f?.status === 'em_analise').length,
    ativas: (federacoes || []).filter((f) => f?.status === 'ativo').length,
    inativas: (federacoes || []).filter((f) => f?.status === 'inativo').length,
  };

  const handleViewDetails = useCallback((federacao: Federacao) => {
    navigate(`/admin/federacoes/${federacao.id}`);
  }, [navigate]);

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    // Prefer parseISO for yyyy-mm-dd / timestamps; fall back to raw on invalid.
    const parsed = parseISO(date);
    if (!isValid(parsed)) return date;
    return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <FederacoesErrorBoundary>
    <ModuleLayout module="organizacoes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Federações Esportivas</h1>
            <p className="text-muted-foreground">Gerencie as federações vinculadas ao IDJuv</p>
          </div>
          <Button onClick={() => setRelatoriosOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Central de Relatórios
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="federacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="federacoes" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Federações
            </TabsTrigger>
            <TabsTrigger value="calendario" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="federacoes" className="space-y-6 mt-6">

        {/* Central de Relatórios Dialog */}
        <CentralRelatoriosFederacoesDialog
          open={relatoriosOpen}
          onOpenChange={setRelatoriosOpen}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.emAnalise}</div>
              <div className="text-sm text-muted-foreground">Em Análise</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
              <div className="text-sm text-muted-foreground">Ativas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">{stats.inativas}</div>
              <div className="text-sm text-muted-foreground">Inativas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, sigla ou presidente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="ativo">Ativas</SelectItem>
              <SelectItem value="inativo">Inativas</SelectItem>
              <SelectItem value="rejeitado">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Federação</TableHead>
                  <TableHead className="hidden md:table-cell">Presidente</TableHead>
                  <TableHead className="hidden lg:table-cell">Mandato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredFederacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma federação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFederacoes.map((fed) => {
                    const statusInfo = getStatusConfig(fed.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow key={fed.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{fed.sigla || '-'}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {fed.nome || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">{fed.presidente_nome || '-'}</div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatDate(fed.mandato_inicio)} - {formatDate(fed.mandato_fim)}
                            </span>
                            {isMandatoExpirado(fed.mandato_fim) && (
                              <MandatoExpiradoBadge mandatoFim={fed.mandato_fim} variant="badge" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(fed)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
