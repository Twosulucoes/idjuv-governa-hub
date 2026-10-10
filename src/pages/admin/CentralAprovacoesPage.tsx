// ============================================
// CENTRAL DE APROVAÇÕES - PRESIDÊNCIA
// ============================================

import { useState, useEffect } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from '@/components/design-system';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ApprovalStatus, 
  ApprovalRequest 
} from '@/types/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCheck,
  X
} from 'lucide-react';

const SITUACOES: Record<ApprovalStatus, { label: string; tom: TomStatus }> = {
  draft: { label: 'Rascunho', tom: 'neutro' },
  submitted: { label: 'Submetido', tom: 'pendente' },
  in_review: { label: 'Em análise', tom: 'andamento' },
  approved: { label: 'Aprovado', tom: 'sucesso' },
  rejected: { label: 'Rejeitado', tom: 'erro' },
  cancelled: { label: 'Cancelado', tom: 'neutro' },
};

const PRIORIDADES: Record<string, { label: string; tom: TomStatus }> = {
  low: { label: 'Baixa', tom: 'neutro' },
  normal: { label: 'Normal', tom: 'neutro' },
  high: { label: 'Alta', tom: 'pendente' },
  urgent: { label: 'Urgente', tom: 'destaque' },
};

const colunasBase: ColunaTabela<ApprovalRequest>[] = [
  {
    id: 'modulo',
    cabecalho: 'Módulo',
    celula: (request) => <span className="font-medium capitalize">{request.moduleName}</span>,
    ordenarPor: (request) => request.moduleName,
    // A justificativa não tem coluna, mas continua entrando na busca.
    buscarPor: (request) => `${request.moduleName} ${request.justification ?? ''}`,
    mobile: 'titulo',
  },
  {
    id: 'tipo',
    cabecalho: 'Tipo',
    celula: (request) => request.entityType,
    ordenarPor: (request) => request.entityType,
    buscarPor: (request) => request.entityType,
  },
  {
    id: 'solicitante',
    cabecalho: 'Solicitante',
    celula: (request) => request.requesterName || 'Não informado',
    ordenarPor: (request) => request.requesterName,
    buscarPor: (request) => request.requesterName,
  },
  {
    id: 'prioridade',
    cabecalho: 'Prioridade',
    celula: (request) => {
      // Mesma regra de antes: o que não for urgent/high/normal aparece como "Baixa".
      const prioridade = PRIORIDADES[request.priority] ?? PRIORIDADES.low;
      return <StatusBadge tom={prioridade.tom} icone={false}>{prioridade.label}</StatusBadge>;
    },
    ordenarPor: (request) => request.priority,
  },
  {
    id: 'situacao',
    cabecalho: 'Situação',
    celula: (request) => {
      const situacao = SITUACOES[request.status] ?? { label: request.status ?? 'Sem situação', tom: 'neutro' as TomStatus };
      return <StatusBadge tom={situacao.tom}>{situacao.label}</StatusBadge>;
    },
    ordenarPor: (request) => request.status,
  },
  {
    id: 'data',
    cabecalho: 'Data',
    celula: (request) => format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    ordenarPor: (request) => new Date(request.createdAt),
  },
];

export default function CentralAprovacoesPage() {
  const { user } = useAuth();
  const { requests, loading, fetchRequests, approveRequest, rejectRequest } = useApprovalRequests();
  const [selectedTab, setSelectedTab] = useState<string>('pendentes');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // A busca textual fica no DataTable; aqui só o recorte da aba.
  const filteredRequests = requests.filter(r => {
    if (selectedTab === 'pendentes') {
      return ['submitted', 'in_review'].includes(r.status);
    } else if (selectedTab === 'aprovadas') {
      return r.status === 'approved';
    } else if (selectedTab === 'rejeitadas') {
      return r.status === 'rejected';
    }
    return true;
  });

  const pendingCount = requests.filter(r => ['submitted', 'in_review'].includes(r.status)).length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;
    
    const success = await approveRequest(
      selectedRequest.id,
      approvalDecision || 'Aprovado',
      { name: user.fullName || user.email, role: user.isSuperAdmin ? 'Super Admin' : 'Aprovador' }
    );

    if (success) {
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setApprovalDecision('');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason) return;
    
    const success = await rejectRequest(selectedRequest.id, rejectReason);

    if (success) {
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectReason('');
    }
  };

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Central de aprovações' }]}
          titulo="Central de aprovações"
          descricao="Solicitações aguardando decisão, aprovadas e rejeitadas"
        />

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard rotulo="Pendentes" valor={pendingCount} icone={Clock} carregando={loading} />
          <KpiCard rotulo="Aprovadas" valor={approvedCount} icone={CheckCircle} carregando={loading} />
          <KpiCard rotulo="Rejeitadas" valor={rejectedCount} icone={XCircle} carregando={loading} />
        </div>

        {/* Abas e tabela */}
        <div className="space-y-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="pendentes" className="gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Pendentes
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="aprovadas" className="gap-2">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Aprovadas
              </TabsTrigger>
              <TabsTrigger value="rejeitadas" className="gap-2">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Rejeitadas
              </TabsTrigger>
              <TabsTrigger value="todas" className="gap-2">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Todas
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <DataTable
            rotulo="Solicitações de aprovação"
            dados={filteredRequests}
            colunas={colunasBase}
            chaveLinha={(request) => request.id}
            carregando={loading}
            busca={{ placeholder: 'Buscar por tipo, módulo, solicitante...' }}
            vazio={{ icone: FileText, titulo: 'Nenhuma solicitação encontrada' }}
            acoesLinha={(request) => (
              <div className="flex justify-end gap-2">
                {['submitted', 'in_review'].includes(request.status) && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-success hover:text-success hover:bg-success/10"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveDialog(true);
                      }}
                      aria-label={`Aprovar solicitação de ${request.requesterName || 'solicitante não informado'} (${request.entityType})`}
                    >
                      <CheckCheck className="h-4 w-4" aria-hidden="true" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectDialog(true);
                      }}
                      aria-label={`Rejeitar solicitação de ${request.requesterName || 'solicitante não informado'} (${request.entityType})`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Rejeitar
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedRequest(request)}
                  aria-label={`Ver detalhes da solicitação de ${request.requesterName || 'solicitante não informado'} (${request.entityType})`}
                >
                  Detalhes
                </Button>
              </div>
            )}
          />
        </div>
      </div>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
              Aprovar solicitação
            </DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar esta solicitação. Esta ação será registrada com sua assinatura eletrônica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm"><strong>Módulo:</strong> {selectedRequest?.moduleName}</p>
              <p className="text-sm"><strong>Tipo:</strong> {selectedRequest?.entityType}</p>
              <p className="text-sm"><strong>Solicitante:</strong> {selectedRequest?.requesterName}</p>
              {selectedRequest?.justification && (
                <p className="text-sm mt-2"><strong>Justificativa:</strong> {selectedRequest.justification}</p>
              )}
            </div>

            <div>
              <label htmlFor="parecer-aprovacao" className="text-sm font-medium">Parecer (opcional)</label>
              <Textarea
                id="parecer-aprovacao"
                placeholder="Adicione um parecer ou observação..."
                value={approvalDecision}
                onChange={(e) => setApprovalDecision(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="bg-success/10 p-4 rounded-lg border border-success/40">
              <p className="text-sm text-foreground">
                <strong>Assinatura eletrônica:</strong><br />
                {user?.fullName || user?.email} - {user?.isSuperAdmin ? 'Super Admin' : 'Aprovador'}<br />
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} className="bg-success text-success-foreground hover:bg-success/90">
              Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              Rejeitar solicitação
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Esta informação será enviada ao solicitante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm"><strong>Módulo:</strong> {selectedRequest?.moduleName}</p>
              <p className="text-sm"><strong>Tipo:</strong> {selectedRequest?.entityType}</p>
              <p className="text-sm"><strong>Solicitante:</strong> {selectedRequest?.requesterName}</p>
            </div>

            <div>
              <label htmlFor="motivo-rejeicao" className="text-sm font-medium">Motivo da rejeição *</label>
              <Textarea
                id="motivo-rejeicao"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReject} 
              variant="destructive"
              disabled={!rejectReason.trim()}
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
