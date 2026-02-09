/**
 * PÁGINA DE PENDÊNCIAS DE PORTARIAS (RH)
 * 
 * Dashboard para acompanhar portarias pendentes de ação no RH
 * - Portarias em minuta/rascunho
 * - Portarias aguardando assinatura
 * - Portarias aguardando publicação
 * 
 * @version 1.0.0
 */

import { useMemo, useState } from 'react';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Filter,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePortarias } from '@/hooks/usePortarias';
import { STATUS_PORTARIA_LABELS, StatusPortaria } from '@/types/portaria';

const STATUS_PENDENTES: StatusPortaria[] = ['minuta', 'aguardando_assinatura', 'aguardando_publicacao'];

const STATUS_ICON: Record<StatusPortaria, typeof Clock> = {
  minuta: FileText,
  aguardando_assinatura: Clock,
  assinado: CheckCircle2,
  aguardando_publicacao: AlertCircle,
  publicado: CheckCircle2,
  vigente: CheckCircle2,
  revogado: AlertCircle,
};

const STATUS_COLOR: Record<StatusPortaria, string> = {
  minuta: 'bg-muted text-muted-foreground',
  aguardando_assinatura: 'bg-warning/20 text-warning-foreground',
  assinado: 'bg-primary/20 text-primary',
  aguardando_publicacao: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  publicado: 'bg-success/20 text-success-foreground',
  vigente: 'bg-success/30 text-success-foreground',
  revogado: 'bg-destructive/20 text-destructive',
};

export default function PendenciasPortariasPage() {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusPortaria | 'all'>('all');

  const currentYear = new Date().getFullYear();
  
  const { data: portarias = [], isLoading } = usePortarias({
    ano: currentYear,
  });

  // Filtrar apenas portarias pendentes
  const portariasPendentes = useMemo(() => {
    return portarias.filter(p => STATUS_PENDENTES.includes(p.status));
  }, [portarias]);

  // Aplicar filtros de busca e status
  const portariasFiltradas = useMemo(() => {
    let resultado = portariasPendentes;

    if (statusFiltro !== 'all') {
      resultado = resultado.filter(p => p.status === statusFiltro);
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(p => 
        p.numero?.toLowerCase().includes(termo) ||
        p.titulo?.toLowerCase().includes(termo) ||
        p.ementa?.toLowerCase().includes(termo)
      );
    }

    return resultado;
  }, [portariasPendentes, statusFiltro, busca]);

  // Contadores por status
  const contadores = useMemo(() => {
    const counts: Record<StatusPortaria, number> = {
      minuta: 0,
      aguardando_assinatura: 0,
      assinado: 0,
      aguardando_publicacao: 0,
      publicado: 0,
      vigente: 0,
      revogado: 0,
    };

    portariasPendentes.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return counts;
  }, [portariasPendentes]);

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              Pendências de Portarias
            </h1>
            <p className="text-muted-foreground">
              Acompanhe portarias que precisam de ação do RH
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/gabinete/portarias">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para Central de Portarias
            </Link>
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFiltro('minuta')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contadores.minuta}</p>
                  <p className="text-sm text-muted-foreground">Em minuta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFiltro('aguardando_assinatura')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contadores.aguardando_assinatura}</p>
                  <p className="text-sm text-muted-foreground">Aguardando assinatura</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFiltro('aguardando_publicacao')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contadores.aguardando_publicacao}</p>
                  <p className="text-sm text-muted-foreground">Aguardando publicação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <Select
            value={statusFiltro}
            onValueChange={(v) => setStatusFiltro(v as StatusPortaria | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as pendências</SelectItem>
              {STATUS_PENDENTES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_PORTARIA_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de portarias */}
        <Card>
          <CardHeader>
            <CardTitle>Portarias Pendentes</CardTitle>
            <CardDescription>
              {portariasFiltradas.length} portaria(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Carregando portarias...
                </div>
              ) : portariasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="font-semibold text-lg">Nenhuma pendência!</h3>
                  <p className="text-muted-foreground">
                    Todas as portarias estão em dia.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Título/Ementa</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Servidores</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portariasFiltradas.map((portaria) => {
                      const StatusIcon = STATUS_ICON[portaria.status] || FileText;
                      return (
                        <TableRow key={portaria.id}>
                          <TableCell className="font-medium">
                            {portaria.numero || '-'}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="truncate">
                              {portaria.titulo || portaria.ementa || '-'}
                            </p>
                          </TableCell>
                          <TableCell>
                            {portaria.data_documento 
                              ? format(new Date(portaria.data_documento), "dd/MM/yyyy", { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLOR[portaria.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_PORTARIA_LABELS[portaria.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {portaria.servidores_ids?.length || 0} servidor(es)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="ghost">
                              <Link to={`/gabinete/portarias?id=${portaria.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
