import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Filter,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  X,
  ChevronRight,
  Calendar,
  FileText,
  Briefcase,
  Loader2,
} from 'lucide-react';

import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TIPO_PORTARIA_LABELS, STATUS_PORTARIA_LABELS, type StatusPortaria } from '@/types/portaria';

// Tipos
interface PortariaPendente {
  id: string;
  numero: string;
  titulo: string;
  categoria?: string;
  status: StatusPortaria;
  data_documento: string;
  data_vigencia_fim?: string;
  created_at: string;
  servidores_ids?: string[];
  responsavel_id?: string;
  unidade?: { id: string; nome: string; sigla?: string };
  cargo?: { id: string; nome: string; sigla?: string };
}

interface ServidorDisponivel {
  id: string;
  nome_completo: string;
  cargo_atual?: string;
  unidade_atual?: string;
  portarias_atribuidas: number;
  carga_maxima: number;
}

interface FiltrosPortaria {
  busca: string;
  tipo?: string;
  status?: StatusPortaria;
  responsavel_id?: string;
}

// Hook para buscar portarias pendentes de atribuição
function usePortariasPendentes(filtros: FiltrosPortaria) {
  return useQuery({
    queryKey: ['portarias-pendentes-atribuicao', filtros],
    queryFn: async () => {
      let query = supabase
        .from('documentos')
        .select(`
          id, numero, titulo, categoria, status, data_documento, 
          data_vigencia_fim, created_at, servidores_ids,
          unidade:estrutura_organizacional(id, nome, sigla),
          cargo:cargos(id, nome, sigla)
        `)
        .eq('tipo', 'portaria')
        .in('status', ['minuta', 'aguardando_assinatura', 'assinado', 'aguardando_publicacao'])
        .order('data_documento', { ascending: false });

      if (filtros.busca) {
        query = query.or(`numero.ilike.%${filtros.busca}%,titulo.ilike.%${filtros.busca}%`);
      }
      if (filtros.tipo && filtros.tipo !== 'all') {
        query = query.eq('categoria', filtros.tipo as any);
      }
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PortariaPendente[];
    },
  });
}

// Hook para buscar servidores com carga de trabalho
function useServidoresComCarga() {
  return useQuery({
    queryKey: ['servidores-carga-trabalho'],
    queryFn: async () => {
      // Buscar servidores ativos (usando nomes corretos das colunas da view)
      const { data: servidores, error: errServ } = await supabase
        .from('v_servidores_situacao')
        .select('id, nome_completo, cargo_nome, unidade_nome')
        .eq('situacao', 'ativo')
        .order('nome_completo');

      if (errServ) throw errServ;

      // Buscar contagem de portarias atribuídas usando servidores_ids
      const { data: documentos, error: errCont } = await supabase
        .from('documentos')
        .select('servidores_ids')
        .eq('tipo', 'portaria')
        .in('status', ['minuta', 'aguardando_assinatura', 'assinado', 'aguardando_publicacao']);

      if (errCont) throw errCont;

      // Calcular carga por servidor (contando aparições em servidores_ids)
      const cargaPorServidor: Record<string, number> = {};
      documentos?.forEach((doc: { servidores_ids?: string[] | null }) => {
        doc.servidores_ids?.forEach((id) => {
          cargaPorServidor[id] = (cargaPorServidor[id] || 0) + 1;
        });
      });

      return (servidores || []).map((s: any) => ({
        id: s.id,
        nome_completo: s.nome_completo,
        cargo_atual: s.cargo_nome,
        unidade_atual: s.unidade_nome,
        portarias_atribuidas: cargaPorServidor[s.id] || 0,
        carga_maxima: 10, // Limite configurável
      })) as ServidorDisponivel[];
    },
  });
}

// Hook para atribuir responsável à portaria (atualiza servidores_ids)
function useAtribuirResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ portariaIds, responsavelId }: { portariaIds: string[]; responsavelId: string }) => {
      // Atualiza servidores_ids para incluir o responsável
      // Para cada portaria, adiciona o servidor ao array se ainda não estiver
      for (const portariaId of portariaIds) {
        const { data: doc } = await supabase
          .from('documentos')
          .select('servidores_ids')
          .eq('id', portariaId)
          .single();
        
        const idsAtuais = doc?.servidores_ids || [];
        if (!idsAtuais.includes(responsavelId)) {
          const { error } = await supabase
            .from('documentos')
            .update({ servidores_ids: [...idsAtuais, responsavelId] })
            .eq('id', portariaId);
          
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias-pendentes-atribuicao'] });
      queryClient.invalidateQueries({ queryKey: ['servidores-carga-trabalho'] });
      toast.success('Responsável atribuído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atribuir responsável: ' + error.message);
    },
  });
}

// Componente de indicador de prazo
function PrazoIndicator({ dataDocumento, dataVigenciaFim }: { dataDocumento: string; dataVigenciaFim?: string }) {
  const hoje = new Date();
  const dataRef = dataVigenciaFim ? new Date(dataVigenciaFim) : addDays(new Date(dataDocumento), 30);
  const diasRestantes = differenceInDays(dataRef, hoje);

  if (diasRestantes < 0) {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />
        Atrasado ({Math.abs(diasRestantes)}d)
      </Badge>
    );
  }
  if (diasRestantes <= 7) {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
        <Clock className="h-3 w-3" />
        {diasRestantes}d restantes
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      {diasRestantes}d
    </Badge>
  );
}

// Componente de item de portaria na lista
function PortariaListItem({
  portaria,
  isSelected,
  onSelect,
  onToggle,
}: {
  portaria: PortariaPendente;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (checked: boolean) => void;
}) {
  const isNew = differenceInDays(new Date(), new Date(portaria.created_at)) <= 3;
  const isOverdue = portaria.data_vigencia_fim && isBefore(new Date(portaria.data_vigencia_fim), new Date());
  const isUrgent = portaria.data_vigencia_fim && differenceInDays(new Date(portaria.data_vigencia_fim), new Date()) <= 7;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
        isSelected && 'border-primary bg-primary/5',
        isOverdue && 'border-destructive/50 bg-destructive/5',
        isUrgent && !isOverdue && 'border-warning/50 bg-warning/5',
        isNew && !isOverdue && !isUrgent && 'border-info/50 bg-info/5',
        !isSelected && !isOverdue && !isUrgent && !isNew && 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">
            Portaria nº {portaria.numero}
          </span>
          {isNew && (
            <Badge variant="secondary" className="text-xs bg-info/20 text-info">
              Nova
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate mb-1">
          {portaria.titulo}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {portaria.categoria && (
            <Badge variant="outline" className="text-xs capitalize">
              {TIPO_PORTARIA_LABELS[portaria.categoria as keyof typeof TIPO_PORTARIA_LABELS] || portaria.categoria}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {STATUS_PORTARIA_LABELS[portaria.status]}
          </Badge>
          <PrazoIndicator 
            dataDocumento={portaria.data_documento} 
            dataVigenciaFim={portaria.data_vigencia_fim} 
          />
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

// Componente de card de servidor
function ServidorCard({
  servidor,
  isSelected,
  onSelect,
}: {
  servidor: ServidorDisponivel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ocupacao = (servidor.portarias_atribuidas / servidor.carga_maxima) * 100;
  const ocupacaoClass = ocupacao >= 80 ? 'bg-destructive' : ocupacao >= 50 ? 'bg-warning' : 'bg-success';

  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
        !isSelected && 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs">
            {servidor.nome_completo.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{servidor.nome_completo}</p>
          <p className="text-xs text-muted-foreground truncate">
            {servidor.cargo_atual || 'Sem cargo'}
          </p>
        </div>
        {isSelected && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Carga atual</span>
          <span className="font-medium">
            {servidor.portarias_atribuidas}/{servidor.carga_maxima}
          </span>
        </div>
        <Progress value={ocupacao} className={cn('h-2', ocupacaoClass)} />
      </div>

      {servidor.unidade_atual && (
        <p className="text-xs text-muted-foreground mt-2 truncate">
          {servidor.unidade_atual}
        </p>
      )}
    </div>
  );
}

export default function AtribuicaoPortariasPage() {
  const [filtros, setFiltros] = useState<FiltrosPortaria>({ busca: '' });
  const [portariasSelecionadas, setPortariasSelecionadas] = useState<string[]>([]);
  const [portariaDetalhada, setPortariaDetalhada] = useState<PortariaPendente | null>(null);
  const [servidorSelecionado, setServidorSelecionado] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [buscaServidor, setBuscaServidor] = useState('');

  const { data: portarias = [], isLoading: loadingPortarias } = usePortariasPendentes(filtros);
  const { data: servidores = [], isLoading: loadingServidores } = useServidoresComCarga();
  const atribuirResponsavel = useAtribuirResponsavel();

  // Filtrar servidores pela busca
  const servidoresFiltrados = useMemo(() => {
    if (!buscaServidor) return servidores;
    const termo = buscaServidor.toLowerCase();
    return servidores.filter(
      (s) =>
        s.nome_completo.toLowerCase().includes(termo) ||
        s.cargo_atual?.toLowerCase().includes(termo) ||
        s.unidade_atual?.toLowerCase().includes(termo)
    );
  }, [servidores, buscaServidor]);

  // Contadores
  const contadores = useMemo(() => {
    const atrasadas = portarias.filter(
      (p) => p.data_vigencia_fim && isBefore(new Date(p.data_vigencia_fim), new Date())
    ).length;
    const urgentes = portarias.filter(
      (p) =>
        p.data_vigencia_fim &&
        !isBefore(new Date(p.data_vigencia_fim), new Date()) &&
        differenceInDays(new Date(p.data_vigencia_fim), new Date()) <= 7
    ).length;
    const novas = portarias.filter(
      (p) => differenceInDays(new Date(), new Date(p.created_at)) <= 3
    ).length;

    return { atrasadas, urgentes, novas, total: portarias.length };
  }, [portarias]);

  // Handlers
  const handleTogglePortaria = (id: string, checked: boolean) => {
    if (checked) {
      setPortariasSelecionadas((prev) => [...prev, id]);
    } else {
      setPortariasSelecionadas((prev) => prev.filter((p) => p !== id));
    }
  };

  const handleSelectPortaria = (portaria: PortariaPendente) => {
    setPortariaDetalhada(portaria);
  };

  const handleSelectAllVisible = () => {
    const ids = portarias.map((p) => p.id);
    setPortariasSelecionadas(ids);
  };

  const handleClearSelection = () => {
    setPortariasSelecionadas([]);
  };

  const handleConfirmAtribuicao = async () => {
    if (!servidorSelecionado || portariasSelecionadas.length === 0) return;

    await atribuirResponsavel.mutateAsync({
      portariaIds: portariasSelecionadas,
      responsavelId: servidorSelecionado,
    });

    setPortariasSelecionadas([]);
    setServidorSelecionado(null);
    setConfirmDialogOpen(false);
  };

  const servidorEscolhido = servidores.find((s) => s.id === servidorSelecionado);

  return (
    <ModuleLayout module="rh">
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Atribuição de Portarias</h1>
              <p className="text-muted-foreground">
                Gerencie a distribuição de portarias entre os servidores
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {contadores.atrasadas} atrasadas
              </Badge>
              <Badge variant="outline" className="gap-1 border-warning text-warning">
                <Clock className="h-3 w-3" />
                {contadores.urgentes} urgentes
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {contadores.total} total
              </Badge>
            </div>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Lista de Portarias */}
          <div className="lg:col-span-2 flex flex-col bg-card rounded-lg border overflow-hidden">
            {/* Filtros */}
            <div className="flex-shrink-0 p-4 border-b space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número ou título..."
                    className="pl-9"
                    value={filtros.busca}
                    onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
                  />
                </div>

                <Select
                  value={filtros.tipo || 'all'}
                  onValueChange={(v) => setFiltros((f) => ({ ...f, tipo: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(TIPO_PORTARIA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filtros.status || 'all'}
                  onValueChange={(v) =>
                    setFiltros((f) => ({ ...f, status: v === 'all' ? undefined : (v as StatusPortaria) }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="minuta">Minuta</SelectItem>
                    <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                    <SelectItem value="assinado">Assinado</SelectItem>
                    <SelectItem value="aguardando_publicacao">Aguardando Publicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ações em lote */}
              {portariasSelecionadas.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {portariasSelecionadas.length} selecionada(s)
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={!servidorSelecionado}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Atribuir
                    </Button>
                  </div>
                </div>
              )}

              {portariasSelecionadas.length === 0 && portarias.length > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleSelectAllVisible}>
                  Selecionar todas ({portarias.length})
                </Button>
              )}
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {loadingPortarias ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : portarias.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma portaria pendente encontrada</p>
                  </div>
                ) : (
                  portarias.map((portaria) => (
                    <PortariaListItem
                      key={portaria.id}
                      portaria={portaria}
                      isSelected={portariasSelecionadas.includes(portaria.id)}
                      onSelect={() => handleSelectPortaria(portaria)}
                      onToggle={(checked) => handleTogglePortaria(portaria.id, checked)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Painel de Atribuição */}
          <div className="flex flex-col bg-card rounded-lg border overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Servidores Disponíveis
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione um servidor para atribuir
              </p>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar servidor..."
                  className="pl-9"
                  value={buscaServidor}
                  onChange={(e) => setBuscaServidor(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {loadingServidores ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : servidoresFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum servidor encontrado</p>
                  </div>
                ) : (
                  servidoresFiltrados.map((servidor) => (
                    <ServidorCard
                      key={servidor.id}
                      servidor={servidor}
                      isSelected={servidorSelecionado === servidor.id}
                      onSelect={() => setServidorSelecionado(servidor.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Resumo da seleção */}
            {(servidorSelecionado || portariasSelecionadas.length > 0) && (
              <div className="flex-shrink-0 p-4 border-t bg-muted/30">
                <div className="space-y-2 text-sm">
                  {servidorSelecionado && servidorEscolhido && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="font-medium truncate">{servidorEscolhido.nome_completo}</span>
                    </div>
                  )}
                  {portariasSelecionadas.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>{portariasSelecionadas.length} portaria(s) selecionada(s)</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-3"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={!servidorSelecionado || portariasSelecionadas.length === 0}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Confirmar Atribuição
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sheet de Detalhes */}
      <Sheet open={!!portariaDetalhada} onOpenChange={() => setPortariaDetalhada(null)}>
        <SheetContent className="sm:max-w-lg">
          {portariaDetalhada && (
            <>
              <SheetHeader>
                <SheetTitle>Portaria nº {portariaDetalhada.numero}</SheetTitle>
                <SheetDescription>{portariaDetalhada.titulo}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {portariaDetalhada.categoria && (
                    <Badge variant="outline" className="capitalize">
                      {TIPO_PORTARIA_LABELS[portariaDetalhada.categoria as keyof typeof TIPO_PORTARIA_LABELS] || portariaDetalhada.categoria}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {STATUS_PORTARIA_LABELS[portariaDetalhada.status]}
                  </Badge>
                  <PrazoIndicator
                    dataDocumento={portariaDetalhada.data_documento}
                    dataVigenciaFim={portariaDetalhada.data_vigencia_fim}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Data do Documento</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(portariaDetalhada.data_documento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {portariaDetalhada.cargo && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Cargo</p>
                        <p className="text-sm text-muted-foreground">{portariaDetalhada.cargo.nome}</p>
                      </div>
                    </div>
                  )}

                  {portariaDetalhada.unidade && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Unidade</p>
                        <p className="text-sm text-muted-foreground">{portariaDetalhada.unidade.nome}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!portariasSelecionadas.includes(portariaDetalhada.id)) {
                        handleTogglePortaria(portariaDetalhada.id, true);
                      }
                      setPortariaDetalhada(null);
                    }}
                    disabled={portariasSelecionadas.includes(portariaDetalhada.id)}
                  >
                    {portariasSelecionadas.includes(portariaDetalhada.id) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Já selecionada
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar à seleção
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Atribuição</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Você está prestes a atribuir <strong>{portariasSelecionadas.length} portaria(s)</strong> para:
                </p>
                {servidorEscolhido && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium">{servidorEscolhido.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{servidorEscolhido.cargo_atual}</p>
                  </div>
                )}
                <p className="text-sm">
                  O servidor será notificado automaticamente sobre as novas atribuições.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAtribuicao} disabled={atribuirResponsavel.isPending}>
              {atribuirResponsavel.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
