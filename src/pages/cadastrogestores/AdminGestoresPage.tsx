/**
 * Painel Administrativo de Gestores Escolares
 * /cadastrogestores/admin
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle, 
  Eye,
  UserPlus,
  Phone,
  Mail,
  MoreHorizontal,
  School,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGestoresEscolares } from '@/hooks/useGestoresEscolares';
import { useAuth } from '@/contexts/AuthContext';
import { 
  STATUS_GESTOR_CONFIG, 
  STATUS_OPTIONS,
  calcularMetricas,
  formatarCPF,
  formatarCelular,
  type StatusGestor 
} from '@/types/gestoresEscolares';
import * as XLSX from 'xlsx';
import { GestorDetalhesDialog } from '@/components/cadastrogestores/GestorDetalhesDialog';

export default function AdminGestoresPage() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [gestorSelecionado, setGestorSelecionado] = useState<string | null>(null);

  const { user } = useAuth();
  const { 
    gestores, 
    isLoading, 
    refetch,
    assumirTarefa,
    marcarCadastradoCbde,
    marcarContatoRealizado,
    confirmarAcesso,
  } = useGestoresEscolares();

  // Filtrar gestores
  const gestoresFiltrados = useMemo(() => {
    return gestores.filter((g) => {
      // Filtro por status
      if (filtroStatus !== 'todos' && g.status !== filtroStatus) return false;
      
      // Filtro por busca
      if (busca) {
        const termo = busca.toLowerCase();
        return (
          g.nome.toLowerCase().includes(termo) ||
          g.cpf.includes(termo.replace(/\D/g, '')) ||
          g.email.toLowerCase().includes(termo) ||
          g.escola?.nome.toLowerCase().includes(termo)
        );
      }
      
      return true;
    });
  }, [gestores, filtroStatus, busca]);

  // Métricas
  const metricas = useMemo(() => calcularMetricas(gestores), [gestores]);

  // Exportar para Excel
  const handleExportar = () => {
    const dados = gestoresFiltrados.map((g) => ({
      'Escola': g.escola?.nome || '',
      'Município': g.escola?.municipio || '',
      'Nome': g.nome,
      'CPF': formatarCPF(g.cpf),
      'Email': g.email,
      'Celular': formatarCelular(g.celular),
      'Status': STATUS_GESTOR_CONFIG[g.status as StatusGestor]?.label || g.status,
      'Responsável': g.responsavel_nome || '',
      'Data Cadastro': new Date(g.created_at).toLocaleDateString('pt-BR'),
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestores');
    XLSX.writeFile(wb, `gestores-jer-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Assumir tarefa
  const handleAssumir = async (gestorId: string) => {
    if (!user) return;
    await assumirTarefa.mutateAsync({
      gestorId,
      responsavelId: user.id,
      responsavelNome: user.email || '',
    });
  };

  const getStatusBadge = (status: StatusGestor) => {
    const config = STATUS_GESTOR_CONFIG[status];
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <ModuleLayout module="gestores_escolares">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            Credenciamento de Gestores
          </h1>
          <p className="text-muted-foreground">
            Jogos Escolares de Roraima - Controle de Pré-cadastros
          </p>
        </div>

        {/* Alerta de novos cadastros aguardando */}
        {metricas.aguardando > 0 && (
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              {metricas.aguardando} novo{metricas.aguardando > 1 ? 's' : ''} pré-cadastro{metricas.aguardando > 1 ? 's' : ''} aguardando!
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Existem gestores aguardando processamento. Clique em "Assumir Tarefa" para iniciar o atendimento.
            </AlertDescription>
          </Alert>
        )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{metricas.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{metricas.aguardando}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{metricas.em_processamento}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Processando</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Mail className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{metricas.cadastrado_cbde}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cad. CBDE</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Phone className="h-5 w-5 text-indigo-500" />
              <span className="text-2xl font-bold">{metricas.contato_realizado}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Contato</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{metricas.confirmado}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progresso */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">
              {metricas.confirmado} de {metricas.total} ({metricas.percentualConcluido}%)
            </span>
          </div>
          <Progress value={metricas.percentualConcluido} className="h-2" />
        </CardContent>
      </Card>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, email ou escola..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Link to="/cadastrogestores/escolas">
            <Button variant="outline">
              <School className="h-4 w-4 mr-2" />
              Escolas
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExportar}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : gestoresFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum gestor encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escola</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Responsável</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gestoresFiltrados.map((gestor) => (
                  <TableRow key={gestor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {gestor.escola?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {gestor.escola?.municipio}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{gestor.nome}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {formatarCPF(gestor.cpf)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{formatarCPF(gestor.cpf)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm">{gestor.email}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(gestor.status as StatusGestor)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {gestor.responsavel_nome || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setGestorSelecionado(gestor.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          {gestor.status === 'aguardando' && (
                            <DropdownMenuItem onClick={() => handleAssumir(gestor.id)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Assumir Tarefa
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {gestor.status === 'em_processamento' && (
                            <DropdownMenuItem onClick={() => marcarCadastradoCbde.mutateAsync(gestor.id)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Marcar Cadastrado CBDE
                            </DropdownMenuItem>
                          )}
                          
                          {gestor.status === 'cadastrado_cbde' && (
                            <DropdownMenuItem onClick={() => marcarContatoRealizado.mutateAsync(gestor.id)}>
                              <Phone className="h-4 w-4 mr-2" />
                              Marcar Contato Realizado
                            </DropdownMenuItem>
                          )}
                          
                          {gestor.status === 'contato_realizado' && (
                            <DropdownMenuItem onClick={() => confirmarAcesso.mutateAsync(gestor.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar Acesso
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        {/* Dialog de Detalhes */}
        {gestorSelecionado && (
          <GestorDetalhesDialog
            gestorId={gestorSelecionado}
            open={!!gestorSelecionado}
            onOpenChange={(open) => !open && setGestorSelecionado(null)}
          />
        )}
      </div>
    </ModuleLayout>
  );
}
