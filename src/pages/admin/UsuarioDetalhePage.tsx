// ============================================
// PÁGINA DE DETALHES DO USUÁRIO (SEM ROLES)
// ============================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, StatusBadge } from '@/components/design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { UsuarioModulosTab } from '@/components/admin/UsuarioModulosTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type Modulo } from '@/types/rbac';
import { isProtectedAdmin } from '@/shared/config/protected-users.config';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Shield, Loader2, Ban, CheckCircle, Boxes, KeyRound, Copy,
  AlertTriangle, User, Mail, Calendar, Lock, Trash2,
} from 'lucide-react';

export default function UsuarioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { usuarios, loading, saving, toggleModulo, toggleUsuarioAtivo } = useAdminUsuarios();
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const usuario = usuarios.find(u => u.id === id) || null;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleToggleStatus = async () => {
    if (!usuario) return;
    await toggleUsuarioAtivo(usuario.id, !usuario.is_active);
  };

  const handleToggleModulo = async (modulo: Modulo, temAtualmente: boolean) => {
    if (!usuario) return;
    await toggleModulo(usuario.id, modulo, temAtualmente);
  };

  const handleResetPassword = async () => {
    if (!usuario) return;
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: usuario.id }
      });
      if (error) { toast({ variant: 'destructive', title: 'Erro ao resetar senha', description: error.message }); return; }
      if (data?.error) { toast({ variant: 'destructive', title: 'Erro', description: data.error }); return; }
      setTempPassword(data.senhaTemporaria);
      setResetDialogOpen(true);
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao resetar a senha.' });
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast({ title: 'Copiado!', description: 'Senha copiada para a área de transferência.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!usuario) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: usuario.id }
      });
      if (error) { toast({ variant: 'destructive', title: 'Erro ao excluir usuário', description: error.message }); return; }
      if (data?.error) { toast({ variant: 'destructive', title: 'Erro', description: data.error }); return; }
      toast({ title: 'Usuário excluído', description: `O usuário ${usuario.email} foi excluído permanentemente.` });
      navigate('/admin/usuarios');
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao excluir o usuário.' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  };

  if (loading) {
    return (
      <ModuleLayout module="admin">
        <div className="flex items-center justify-center py-24" role="status" aria-label="Carregando usuário">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      </ModuleLayout>
    );
  }

  if (!usuario) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6">
          <PageHeader
            migalhas={[
              { rotulo: 'Administração', href: '/admin' },
              { rotulo: 'Usuários', href: '/admin/usuarios' },
              { rotulo: 'Usuário' },
            ]}
            titulo="Usuário"
          />
          <EmptyState
            icone={AlertTriangle}
            titulo="Usuário não encontrado ou sem permissão de acesso."
            acao={
              <Button variant="outline" onClick={() => navigate('/admin/usuarios')}>
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Voltar para lista
              </Button>
            }
          />
        </div>
      </ModuleLayout>
    );
  }

  const isProtected = isProtectedAdmin(usuario.id, usuario.email);

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[
            { rotulo: 'Administração', href: '/admin' },
            { rotulo: 'Usuários', href: '/admin/usuarios' },
            { rotulo: usuario.full_name || usuario.email },
          ]}
          midia={
            <Avatar className="h-16 w-16">
              <AvatarImage src={usuario.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(usuario.full_name)}
              </AvatarFallback>
            </Avatar>
          }
          titulo={usuario.full_name || 'Sem nome'}
          status={
            <>
              {usuario.is_active ? (
                <StatusBadge tom="sucesso">Ativo</StatusBadge>
              ) : (
                <StatusBadge tom="erro">Bloqueado</StatusBadge>
              )}
              {isProtected && (
                <StatusBadge tom="pendente" icone={false}>
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Super admin protegido
                </StatusBadge>
              )}
              <Badge variant="outline">{usuario.modulos.length} módulo(s)</Badge>
            </>
          }
          descricao={<span className="block truncate">{usuario.email}</span>}
          acoes={
            <Button variant="outline" onClick={() => navigate('/admin/usuarios')}>
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Voltar
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Situação do usuário</div>
                  <div className="text-sm text-muted-foreground">
                    {isProtected ? 'Super admin protegido' : usuario.is_active ? 'Pode acessar o sistema' : 'Acesso bloqueado'}
                  </div>
                </div>
                <Button
                  variant={usuario.is_active ? 'destructive' : 'default'}
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={saving || isProtected}
                >
                  {usuario.is_active ? <><Ban className="h-4 w-4 mr-2" aria-hidden="true" />Bloquear</> : <><CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />Desbloquear</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Segurança</div>
                  <div className="text-sm text-muted-foreground">Gerar nova senha temporária</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetting}>
                  {resetting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />Resetando...</> : <><KeyRound className="h-4 w-4 mr-2" aria-hidden="true" />Resetar senha</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {!isProtected && (
            <Card className="border-destructive/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-destructive">Excluir usuário</div>
                    <div className="text-sm text-muted-foreground">Remove permanentemente a conta</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="modulos" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Módulos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" aria-hidden="true" />Informações básicas</CardTitle>
                <CardDescription>Dados cadastrais do usuário</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" aria-hidden="true" />E-mail</div>
                    <p className="font-medium">{usuario.email}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Boxes className="h-4 w-4" aria-hidden="true" />Módulos</div>
                    <p className="font-medium">{usuario.modulos.length} módulo(s)</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" aria-hidden="true" />Data de criação</div>
                    <p className="font-medium">
                      {usuario.created_at ? format(new Date(usuario.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não informada'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" aria-hidden="true" />Tipo</div>
                    <p className="font-medium">{usuario.tipo_usuario === 'tecnico' ? 'Técnico' : 'Servidor'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modulos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5" aria-hidden="true" />Módulos liberados</CardTitle>
                <CardDescription>Selecione quais áreas do sistema o usuário pode acessar</CardDescription>
              </CardHeader>
              <CardContent>
                <UsuarioModulosTab
                  usuario={usuario}
                  saving={saving}
                  onToggleModulo={handleToggleModulo}
                  isProtected={isProtected}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Senha temporária gerada</DialogTitle>
              <DialogDescription>Uma nova senha temporária foi criada. Copie e envie para o usuário.</DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <code className="text-lg font-mono">{tempPassword}</code>
              <Button variant="ghost" size="sm" onClick={handleCopyPassword} aria-label="Copiar senha temporária"><Copy className="h-4 w-4" aria-hidden="true" /></Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setResetDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" aria-hidden="true" />Excluir usuário permanentemente
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Você está prestes a excluir permanentemente o usuário <strong>{usuario?.full_name || usuario?.email}</strong>.</p>
                <p className="text-destructive font-medium">Esta ação é irreversível!</p>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="delete-confirm">Digite <strong>EXCLUIR</strong> para confirmar:</Label>
                  <Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="EXCLUIR" className="font-mono" />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setDeleteConfirmText(''); setDeleteDialogOpen(false); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} disabled={deleteConfirmText !== 'EXCLUIR' || deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />Excluindo...</> : <><Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />Excluir permanentemente</>}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleLayout>
  );
}
