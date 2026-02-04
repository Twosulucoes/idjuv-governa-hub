/**
 * Tab de Parcerias, Projetos e Espaços Cedidos
 * 
 * Gerencia o histórico de atividades atribuídas à federação:
 * - Parcerias e projetos (CRUD)
 * - Espaços cedidos (visualização - dados vêm da agenda de unidades)
 * - Árbitros vinculados (CRUD)
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Handshake,
  Building2,
  Users,
  Plus,
  FileText,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NovaParceriaDialog } from './NovaParceriaDialog';
import { NovoArbitroDialog } from './NovoArbitroDialog';

interface FederacaoParceriasTabProps {
  federacaoId: string;
  federacaoSigla: string;
}

// Tipos
interface Parceria {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  processo_sei: string | null;
  numero_termo: string | null;
  numero_portaria: string | null;
  observacoes: string | null;
}

interface EspacoCedido {
  id: string;
  nome_espaco: string;
  descricao_espaco: string | null;
  data_inicio: string;
  data_fim: string | null;
  dias_semana: string[] | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  processo_sei: string | null;
  numero_termo_cessao: string | null;
  numero_portaria: string | null;
  status: string;
  observacoes: string | null;
}

interface EspacoAgenda {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  numero_protocolo: string | null;
  horario_diario: string | null;
  unidade_local: {
    id: string;
    nome_unidade: string;
    municipio: string | null;
  } | null;
}

interface Arbitro {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  modalidades: string[] | null;
  disponibilidade: string | null;
  ativo: boolean;
  observacoes: string | null;
}

// Formatadores
const formatDate = (date: string | null) => {
  if (!date) return '-';
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? format(parsed, 'dd/MM/yyyy', { locale: ptBR }) : date;
  } catch {
    return date;
  }
};

const tipoLabels: Record<string, string> = {
  parceria: 'Parceria',
  projeto: 'Projeto',
  convenio: 'Convênio',
  patrocinio: 'Patrocínio',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  vigente: { label: 'Vigente', color: 'bg-green-100 text-green-800' },
  encerrada: { label: 'Encerrada', color: 'bg-gray-100 text-gray-800' },
  suspensa: { label: 'Suspensa', color: 'bg-yellow-100 text-yellow-800' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-800' },
  suspenso: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-800' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  solicitado: { label: 'Solicitado', color: 'bg-blue-100 text-blue-800' },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
};

const diasSemanaLabels: Record<string, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export function FederacaoParceriasTab({ federacaoId, federacaoSigla }: FederacaoParceriasTabProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('parcerias');
  const [openParceriaDialog, setOpenParceriaDialog] = useState(false);
  const [openArbitroDialog, setOpenArbitroDialog] = useState(false);

  // Query: Parcerias
  const { data: parcerias = [], isLoading: loadingParcerias } = useQuery({
    queryKey: ['federacao-parcerias', federacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('federacao_parcerias')
        .select('*')
        .eq('federacao_id', federacaoId)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Parceria[];
    },
  });

  // Query: Espaços Cedidos (legado/manual)
  const { data: espacosManuais = [], isLoading: loadingEspacosManuais } = useQuery({
    queryKey: ['federacao-espacos', federacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('federacao_espacos_cedidos')
        .select('*')
        .eq('federacao_id', federacaoId)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      return (data || []) as EspacoCedido[];
    },
  });

  // Query: Espaços via Agenda (reservas aprovadas da unidade)
  const { data: espacosAgenda = [], isLoading: loadingEspacosAgenda } = useQuery({
    queryKey: ['federacao-espacos-agenda', federacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_unidade')
        .select(`
          id,
          titulo,
          data_inicio,
          data_fim,
          status,
          numero_protocolo,
          horario_diario,
          unidade_local:unidades_locais(id, nome_unidade, municipio)
        `)
        .eq('federacao_id', federacaoId)
        .in('status', ['aprovado', 'concluido'])
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      return (data || []) as EspacoAgenda[];
    },
  });

  // Query: Árbitros
  const { data: arbitros = [], isLoading: loadingArbitros } = useQuery({
    queryKey: ['federacao-arbitros', federacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('federacao_arbitros')
        .select('*')
        .eq('federacao_id', federacaoId)
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Arbitro[];
    },
  });

  const loadingEspacos = loadingEspacosManuais || loadingEspacosAgenda;
  const totalEspacos = espacosManuais.length + espacosAgenda.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Handshake className="h-4 w-4" />
          Vínculos e Atividades
        </h4>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parcerias" className="text-xs">
            <Handshake className="h-3 w-3 mr-1" />
            Parcerias ({parcerias.length})
          </TabsTrigger>
          <TabsTrigger value="espacos" className="text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            Espaços ({totalEspacos})
          </TabsTrigger>
          <TabsTrigger value="arbitros" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Árbitros ({arbitros.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Parcerias */}
        <TabsContent value="parcerias" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setOpenParceriaDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Parceria
            </Button>
          </div>
          
          {loadingParcerias ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : parcerias.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Handshake className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma parceria ou projeto registrado
                </p>
              </CardContent>
            </Card>
          ) : (
            parcerias.map((parceria) => (
              <Card key={parceria.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{parceria.titulo}</span>
                        <Badge variant="outline" className="text-xs">
                          {tipoLabels[parceria.tipo] || parceria.tipo}
                        </Badge>
                        <Badge className={statusLabels[parceria.status]?.color || 'bg-gray-100'}>
                          {statusLabels[parceria.status]?.label || parceria.status}
                        </Badge>
                      </div>
                      
                      {parceria.descricao && (
                        <p className="text-xs text-muted-foreground">{parceria.descricao}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(parceria.data_inicio)}
                          {parceria.data_fim && ` - ${formatDate(parceria.data_fim)}`}
                        </span>
                        
                        {parceria.processo_sei && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            SEI: {parceria.processo_sei}
                          </span>
                        )}
                        
                        {parceria.numero_termo && (
                          <span>Termo: {parceria.numero_termo}</span>
                        )}
                        
                        {parceria.numero_portaria && (
                          <span>Portaria: {parceria.numero_portaria}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab: Espaços Cedidos */}
        <TabsContent value="espacos" className="space-y-3 mt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Os espaços cedidos são gerenciados pelo módulo de Unidades Locais (DIRAF).
              Esta visualização consolida as cedências aprovadas para esta federação.
            </p>
          </div>
          
          {loadingEspacos ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : totalEspacos === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum espaço cedido registrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Espaços da Agenda (automático) */}
              {espacosAgenda.map((espaco) => (
                <Card key={`agenda-${espaco.id}`} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">
                            {espaco.unidade_local?.nome_unidade || 'Unidade Local'}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Via Agenda
                          </Badge>
                          <Badge className={statusLabels[espaco.status]?.color || 'bg-gray-100'}>
                            {statusLabels[espaco.status]?.label || espaco.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground">{espaco.titulo}</p>
                      
                      {espaco.unidade_local?.municipio && (
                        <p className="text-xs text-muted-foreground">
                          📍 {espaco.unidade_local.municipio}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(espaco.data_inicio)} - {formatDate(espaco.data_fim)}
                        </span>
                        
                        {espaco.horario_diario && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {espaco.horario_diario}
                          </span>
                        )}
                        
                        {espaco.numero_protocolo && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Protocolo: {espaco.numero_protocolo}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Espaços Manuais (legado) */}
              {espacosManuais.map((espaco) => (
                <Card key={`manual-${espaco.id}`} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{espaco.nome_espaco}</span>
                          <Badge variant="outline" className="text-xs">
                            Registro Manual
                          </Badge>
                          <Badge className={statusLabels[espaco.status]?.color || 'bg-gray-100'}>
                            {statusLabels[espaco.status]?.label || espaco.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {espaco.descricao_espaco && (
                        <p className="text-xs text-muted-foreground">{espaco.descricao_espaco}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(espaco.data_inicio)}
                          {espaco.data_fim && ` - ${formatDate(espaco.data_fim)}`}
                        </span>
                        
                        {espaco.dias_semana && espaco.dias_semana.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {espaco.dias_semana.map(d => diasSemanaLabels[d] || d).join(', ')}
                          </span>
                        )}
                        
                        {espaco.horario_inicio && espaco.horario_fim && (
                          <span>
                            {espaco.horario_inicio.slice(0, 5)} - {espaco.horario_fim.slice(0, 5)}
                          </span>
                        )}
                      </div>
                      
                      {(espaco.processo_sei || espaco.numero_termo_cessao || espaco.numero_portaria) && (
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-2 mt-2">
                          {espaco.processo_sei && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              SEI: {espaco.processo_sei}
                            </span>
                          )}
                          {espaco.numero_termo_cessao && (
                            <span>Termo: {espaco.numero_termo_cessao}</span>
                          )}
                          {espaco.numero_portaria && (
                            <span>Portaria: {espaco.numero_portaria}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Árbitros */}
        <TabsContent value="arbitros" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setOpenArbitroDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Árbitro
            </Button>
          </div>
          
          {loadingArbitros ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : arbitros.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum árbitro registrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {arbitros.map((arbitro) => (
                <Card key={arbitro.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{arbitro.nome}</span>
                          {!arbitro.ativo && (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {arbitro.telefone && <span>📞 {arbitro.telefone}</span>}
                          {arbitro.email && <span>✉️ {arbitro.email}</span>}
                        </div>
                        
                        {arbitro.modalidades && arbitro.modalidades.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {arbitro.modalidades.map((mod, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {arbitro.disponibilidade && (
                          <p className="text-xs text-muted-foreground">
                            Disponibilidade: {arbitro.disponibilidade}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NovaParceriaDialog
        open={openParceriaDialog}
        onOpenChange={setOpenParceriaDialog}
        federacaoId={federacaoId}
        federacaoSigla={federacaoSigla}
      />
      
      <NovoArbitroDialog
        open={openArbitroDialog}
        onOpenChange={setOpenArbitroDialog}
        federacaoId={federacaoId}
        federacaoSigla={federacaoSigla}
      />
    </div>
  );
}
