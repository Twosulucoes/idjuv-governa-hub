 import { useState } from 'react';
 import { Link, useParams, useNavigate } from 'react-router-dom';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { format, isValid, parseISO } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { toast } from 'sonner';
 import {
   ArrowLeft,
   Building2,
   User,
   Phone,
   Mail,
   Calendar,
   Instagram,
   MapPin,
   ExternalLink,
   CheckCircle,
   XCircle,
   Pencil,
   Trash2,
   AlertTriangle,
 } from 'lucide-react';
 
 import { ModuleLayout } from '@/components/layout';
 import { CalendarioFederacaoTab } from '@/components/federacoes/CalendarioFederacaoTab';
 import { FederacoesErrorBoundary } from '@/components/federacoes/FederacoesErrorBoundary';
 import { MandatoExpiradoBadge, isMandatoExpirado } from '@/components/federacoes/MandatoExpiradoBadge';
 import { FederacaoParceriasTab } from '@/components/federacoes/FederacaoParceriasTab';
 import { EditarFederacaoDialog } from '@/components/federacoes/EditarFederacaoDialog';
 
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Button } from '@/components/ui/button';
 import { EmptyState, PageHeader, StatusBadge, type TomStatus } from '@/components/design-system';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Separator } from '@/components/ui/separator';
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
 import { Textarea } from '@/components/ui/textarea';
 import { Skeleton } from '@/components/ui/skeleton';
 
 interface Federacao {
   id: string;
   nome: string;
   sigla: string;
   cnpj?: string | null;
   data_criacao: string;
   endereco: string;
   telefone: string;
   email: string;
   instagram: string | null;
   mandato_inicio: string;
   mandato_fim: string;
   presidente_nome: string;
   presidente_nascimento: string;
   presidente_telefone: string;
   presidente_email: string;
   presidente_endereco: string | null;
   presidente_instagram: string | null;
   vice_presidente_nome: string;
   vice_presidente_telefone: string;
   diretor_tecnico_nome: string | null;
   diretor_tecnico_telefone: string | null;
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
 
 const getStatusConfig = (status: string | null | undefined) =>
   (status ? statusConfig[status] : undefined) ?? { label: status || 'Sem situação', tom: 'neutro' as TomStatus };
 
 const MIGALHA_FEDERACOES = { rotulo: 'Federações', href: '/admin/federacoes' };
 
 export default function FederacaoDetalhePage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
 
   const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string }>({
     open: false,
     action: '',
   });
   const [observacoes, setObservacoes] = useState('');
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 
   const { data: federacao, isLoading, isError } = useQuery({
     queryKey: ['federacao', id],
     queryFn: async () => {
       if (!id) throw new Error('ID não fornecido');
       const { data, error } = await supabase
         .from('federacoes_esportivas')
         .select('*')
         .eq('id', id)
         .single();
       
       if (error) throw error;
       return data as Federacao;
     },
     enabled: !!id,
   });
 
   const updateStatusMutation = useMutation({
     mutationFn: async ({ status, observacoes }: { status: string; observacoes?: string }) => {
       if (!id) throw new Error('ID não fornecido');
       const { error } = await supabase
         .from('federacoes_esportivas')
         .update({
           status,
           observacoes_internas: observacoes || null,
           data_analise: new Date().toISOString(),
         })
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['federacao', id] });
       queryClient.invalidateQueries({ queryKey: ['federacoes'] });
       toast.success('Status atualizado com sucesso!');
       setConfirmDialog({ open: false, action: '' });
       setObservacoes('');
     },
     onError: () => {
       toast.error('Erro ao atualizar status');
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async () => {
       if (!id) throw new Error('ID não fornecido');
       const { error } = await supabase
         .from('federacoes_esportivas')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['federacoes'] });
       toast.success('Federação excluída com sucesso!');
       navigate('/admin/federacoes');
     },
     onError: () => {
       toast.error('Erro ao excluir federação');
     },
   });
 
   const formatCNPJ = (cnpj: string | null | undefined) => {
     if (!cnpj) return '-';
     const numbers = cnpj.replace(/\D/g, '');
     if (numbers.length !== 14) return cnpj;
     return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
   };
 
   const formatDate = (date?: string | null) => {
     if (!date) return '-';
     const parsed = parseISO(date);
     if (!isValid(parsed)) return date;
     return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
   };
 
   const getWhatsappLink = (phone?: string | null) => {
     const cleaned = (phone || '').replace(/\D/g, '');
     if (!cleaned) return null;
     return `https://wa.me/55${cleaned}`;
   };
 
   const handleStatusChange = (action: string) => {
     setConfirmDialog({ open: true, action });
   };
 
   const confirmStatusChange = () => {
     updateStatusMutation.mutate({
       status: confirmDialog.action,
       observacoes,
     });
   };
 
   const confirmDelete = () => {
     deleteMutation.mutate();
   };
 
    if (isLoading) {
      return (
        <ModuleLayout module="organizacoes">
          <div className="space-y-6" aria-busy="true">
            <PageHeader migalhas={[MIGALHA_FEDERACOES, { rotulo: 'Detalhe' }]} titulo="Carregando federação…" />
            <Skeleton className="h-96 w-full" />
          </div>
        </ModuleLayout>
      );
    }
 
    if (isError || !federacao) {
      return (
        <ModuleLayout module="organizacoes">
          <div className="space-y-6">
            <PageHeader migalhas={[MIGALHA_FEDERACOES, { rotulo: 'Detalhe' }]} titulo="Federação" />
            <EmptyState
              icone={AlertTriangle}
              titulo="Federação não encontrada"
              descricao="O registro solicitado não existe ou foi removido."
              acao={
                <Button asChild>
                  <Link to="/admin/federacoes">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Voltar para lista
                  </Link>
                </Button>
              }
            />
          </div>
        </ModuleLayout>
      );
    }
 
   const statusInfo = getStatusConfig(federacao.status);
 
   return (
      <FederacoesErrorBoundary>
        <ModuleLayout module="organizacoes">
          <div className="space-y-6">
           <PageHeader
             migalhas={[MIGALHA_FEDERACOES, { rotulo: federacao.sigla || 'Detalhe' }]}
             titulo={federacao.sigla || federacao.nome || "Federação"}
             status={<StatusBadge tom={statusInfo.tom}>{statusInfo.label}</StatusBadge>}
             descricao={
               <>
                 <span className="block">{federacao.nome}</span>
                 <span className="block text-caption">Cadastro: {formatDate(federacao.created_at)}</span>
               </>
             }
             acoes={
               <>
                 {federacao.status === 'em_analise' && (
                   <>
                     <Button onClick={() => handleStatusChange('ativo')}>
                       <CheckCircle className="h-4 w-4" aria-hidden="true" />
                       Aprovar
                     </Button>
                     <Button
                       variant="outline"
                       className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                       onClick={() => handleStatusChange('rejeitado')}
                     >
                       <XCircle className="h-4 w-4" aria-hidden="true" />
                       Rejeitar
                     </Button>
                   </>
                 )}
 
                 {federacao.status === 'ativo' && (
                   <Button variant="outline" onClick={() => handleStatusChange('inativo')}>
                     Inativar federação
                   </Button>
                 )}
 
                 {federacao.status === 'inativo' && (
                   <Button onClick={() => handleStatusChange('ativo')}>
                     Reativar federação
                   </Button>
                 )}
 
                 <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                   <Pencil className="h-4 w-4" aria-hidden="true" />
                   Editar dados
                 </Button>
                 <Button
                   variant="outline"
                   className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                   onClick={() => setDeleteDialogOpen(true)}
                 >
                   <Trash2 className="h-4 w-4" aria-hidden="true" />
                   Excluir
                 </Button>
               </>
             }
           />
 
           {/* Conteúdo em Tabs */}
           <Tabs defaultValue="dados" className="w-full">
             <TabsList className="grid w-full grid-cols-3 max-w-md">
               <TabsTrigger value="dados">Dados</TabsTrigger>
               <TabsTrigger value="parcerias">Parcerias</TabsTrigger>
               <TabsTrigger value="calendario">Calendário</TabsTrigger>
             </TabsList>
 
             <TabsContent value="dados" className="mt-6">
               <div className="grid gap-6 md:grid-cols-2">
                 {/* Dados da Federação */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Building2 className="h-5 w-5" aria-hidden="true" />
                       Dados da federação
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3 text-sm">
                     {federacao.cnpj && (
                       <div className="flex items-start gap-2">
                         <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
                         <span>CNPJ: {formatCNPJ(federacao.cnpj)}</span>
                       </div>
                     )}
                     <div className="flex items-start gap-2">
                       <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
                       <span>Criada em {formatDate(federacao.data_criacao)}</span>
                     </div>
                     <div className="flex items-start gap-2">
                       <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
                       <span>{federacao.endereco}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                       {getWhatsappLink(federacao.telefone) ? (
                         <a
                           href={getWhatsappLink(federacao.telefone) as string}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-primary hover:underline flex items-center gap-1"
                         >
                           {federacao.telefone}
                           <ExternalLink className="h-3 w-3" aria-hidden="true" />
                         </a>
                       ) : (
                         <span className="text-muted-foreground">Não informado</span>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                       <a href={`mailto:${federacao.email}`} className="text-primary hover:underline">
                         {federacao.email}
                       </a>
                     </div>
                     {federacao.instagram && (
                       <div className="flex items-center gap-2">
                         <Instagram className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                         <span>{federacao.instagram}</span>
                       </div>
                     )}
 
                     <Separator className="my-4" />
 
                     <div>
                       <h4 className="font-semibold mb-2">Mandato atual</h4>
                       <p className="text-sm">
                         {formatDate(federacao.mandato_inicio)} até {formatDate(federacao.mandato_fim)}
                       </p>
                       {isMandatoExpirado(federacao.mandato_fim) && (
                         <div className="mt-2">
                           <MandatoExpiradoBadge mandatoFim={federacao.mandato_fim} variant="alert" />
                         </div>
                       )}
                     </div>
 
                     {federacao.observacoes_internas && (
                       <>
                         <Separator className="my-4" />
                         <div>
                           <h4 className="font-semibold mb-2">Observações internas</h4>
                           <p className="text-muted-foreground">{federacao.observacoes_internas}</p>
                         </div>
                       </>
                     )}
                   </CardContent>
                 </Card>
 
                 {/* Presidente */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <User className="h-5 w-5" aria-hidden="true" />
                       Presidente
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3 text-sm">
                     <div className="font-medium text-base">{federacao.presidente_nome}</div>
                     <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                       <span>Nascimento: {formatDate(federacao.presidente_nascimento)}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                       {getWhatsappLink(federacao.presidente_telefone) ? (
                         <a
                           href={getWhatsappLink(federacao.presidente_telefone) as string}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-primary hover:underline flex items-center gap-1"
                         >
                           {federacao.presidente_telefone}
                           <ExternalLink className="h-3 w-3" aria-hidden="true" />
                         </a>
                       ) : (
                         <span className="text-muted-foreground">Não informado</span>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                       <a href={`mailto:${federacao.presidente_email}`} className="text-primary hover:underline">
                         {federacao.presidente_email}
                       </a>
                     </div>
                     {federacao.presidente_endereco && (
                       <div className="flex items-start gap-2">
                         <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
                         <span>{federacao.presidente_endereco}</span>
                       </div>
                     )}
                     {federacao.presidente_instagram && (
                       <div className="flex items-center gap-2">
                         <Instagram className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                         <span>{federacao.presidente_instagram}</span>
                       </div>
                     )}
 
                     <Separator className="my-4" />
 
                     <div>
                       <h4 className="font-semibold mb-3">Outros dirigentes</h4>
                       <div className="space-y-4">
                         <div>
                           <div className="text-sm font-medium">Vice-presidente</div>
                           <div className="text-sm">{federacao.vice_presidente_nome}</div>
                           {getWhatsappLink(federacao.vice_presidente_telefone) ? (
                             <a
                               href={getWhatsappLink(federacao.vice_presidente_telefone) as string}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-sm text-primary hover:underline"
                             >
                               {federacao.vice_presidente_telefone}
                             </a>
                           ) : (
                             <div className="text-sm text-muted-foreground">Telefone não informado</div>
                           )}
                         </div>
                         <div>
                           <div className="text-sm font-medium">Diretor técnico</div>
                           <div className="text-sm">{federacao.diretor_tecnico_nome || 'Não informado'}</div>
                           {getWhatsappLink(federacao.diretor_tecnico_telefone) ? (
                             <a
                               href={getWhatsappLink(federacao.diretor_tecnico_telefone) as string}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-sm text-primary hover:underline"
                             >
                               {federacao.diretor_tecnico_telefone}
                             </a>
                           ) : (
                             <div className="text-sm text-muted-foreground">Telefone não informado</div>
                           )}
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </TabsContent>
 
             <TabsContent value="parcerias" className="mt-6">
               <FederacaoParceriasTab
                 federacaoId={federacao.id}
                 federacaoSigla={federacao.sigla}
               />
             </TabsContent>
 
             <TabsContent value="calendario" className="mt-6">
               <CalendarioFederacaoTab
                 federacaoId={federacao.id}
                 federacaoSigla={federacao.sigla}
               />
             </TabsContent>
           </Tabs>
 
           {/* Confirm Status Dialog */}
           <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>
                   {confirmDialog.action === 'ativo' && 'Aprovar federação'}
                   {confirmDialog.action === 'rejeitado' && 'Rejeitar federação'}
                   {confirmDialog.action === 'inativo' && 'Inativar federação'}
                 </AlertDialogTitle>
                 <AlertDialogDescription>
                   {confirmDialog.action === 'ativo' && 
                     `Confirma a aprovação de ${federacao.sigla}? A federação será considerada ativa no sistema.`}
                   {confirmDialog.action === 'rejeitado' && 
                     `Confirma a rejeição de ${federacao.sigla}?`}
                   {confirmDialog.action === 'inativo' && 
                     `Confirma a inativação de ${federacao.sigla}?`}
                 </AlertDialogDescription>
               </AlertDialogHeader>
               
               <div className="my-4">
                 <Textarea
                   placeholder="Observações (opcional)"
                   aria-label="Observações (opcional)"
                   value={observacoes}
                   onChange={(e) => setObservacoes(e.target.value)}
                   rows={3}
                 />
               </div>
 
               <AlertDialogFooter>
                 <AlertDialogCancel onClick={() => setObservacoes('')}>Cancelar</AlertDialogCancel>
                 <AlertDialogAction
                   onClick={confirmStatusChange}
                   className={confirmDialog.action === 'rejeitado' ? 'bg-destructive hover:bg-destructive/90' : ''}
                 >
                   Confirmar
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
 
           {/* Delete Confirm Dialog */}
           <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>Excluir federação</AlertDialogTitle>
                 <AlertDialogDescription>
                   Tem certeza que deseja excluir a federação <strong>{federacao.sigla}</strong>? 
                   Esta ação não pode ser desfeita.
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                 <AlertDialogAction
                   onClick={confirmDelete}
                   className="bg-destructive hover:bg-destructive/90"
                 >
                   Excluir
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
 
           {/* Edit Dialog */}
           <EditarFederacaoDialog
             open={editDialogOpen}
             onOpenChange={setEditDialogOpen}
             federacao={federacao}
           />
         </div>
       </ModuleLayout>
     </FederacoesErrorBoundary>
   );
 }