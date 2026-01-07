// ============================================
// CENTRAL DE APROVAÇÕES - PRESIDÊNCIA
// ============================================

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';
import { useAuth } from '@/contexts/AuthContext';
import { 
  APPROVAL_STATUS_LABELS, 
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
  Search,
  Filter,
  AlertTriangle,
  CheckCheck,
  X
} from 'lucide-react';

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function CentralAprovacoesPage() {
  const { user } = useAuth();
  const { requests, loading, fetchRequests, approveRequest, rejectRequest } = useApprovalRequests();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('pendentes');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.justification?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === 'pendentes') {
      return matchesSearch && ['submitted', 'in_review'].includes(r.status);
    } else if (selectedTab === 'aprovadas') {
      return matchesSearch && r.status === 'approved';
    } else if (selectedTab === 'rejeitadas') {
      return matchesSearch && r.status === 'rejected';
    }
    return matchesSearch;
  });

  const pendingCount = requests.filter(r => ['submitted', 'in_review'].includes(r.status)).length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;
    
    const success = await approveRequest(
      selectedRequest.id,
      approvalDecision || 'Aprovado',
      { name: user.fullName || user.email, role: user.role }
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
    <AdminLayout 
      title="Central de Aprovações" 
      description="Gerencie solicitações pendentes de aprovação"
    >
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por tipo, módulo, solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Abas e tabela */}
      <Card>
        <CardHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="pendentes" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="aprovadas" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprovadas
              </TabsTrigger>
              <TabsTrigger value="rejeitadas" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejeitadas
              </TabsTrigger>
              <TabsTrigger value="todas" className="gap-2">
                <FileText className="h-4 w-4" />
                Todas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium capitalize">
                      {request.moduleName}
                    </TableCell>
                    <TableCell>{request.entityType}</TableCell>
                    <TableCell>{request.requesterName || 'Não informado'}</TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[request.priority as keyof typeof PRIORITY_COLORS]}>
                        {request.priority === 'urgent' ? 'Urgente' : 
                         request.priority === 'high' ? 'Alta' :
                         request.priority === 'normal' ? 'Normal' : 'Baixa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[request.status]}>
                        {APPROVAL_STATUS_LABELS[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {['submitted', 'in_review'].includes(request.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCheck className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectDialog(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Aprovar Solicitação
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
              <label className="text-sm font-medium">Parecer (opcional)</label>
              <Textarea
                placeholder="Adicione um parecer ou observação..."
                value={approvalDecision}
                onChange={(e) => setApprovalDecision(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Assinatura Eletrônica:</strong><br />
                {user?.fullName || user?.email} - {user?.role}<br />
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Rejeitar Solicitação
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
              <label className="text-sm font-medium">Motivo da Rejeição *</label>
              <Textarea
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
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
