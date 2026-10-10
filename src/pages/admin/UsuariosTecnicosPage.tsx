// ============================================
// PÁGINA DE USUÁRIOS TÉCNICOS
// ============================================

import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useUsuarios } from '@/hooks/useUsuarios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from '@/components/design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  UserX, 
  UserCheck,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type UsuarioTecnico = ReturnType<typeof useUsuarios>['usuariosTecnicos'][number];

export default function UsuariosTecnicosPage() {
  const { usuariosTecnicos, isLoading, refetch, criarUsuarioTecnico, toggleUsuarioAtivo } = useUsuarios();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [blockingUser, setBlockingUser] = useState<{ id: string; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'ti_admin'
  });

  const handleCreateUser = async () => {
    if (!formData.email || !formData.fullName) return;
    
    await criarUsuarioTecnico.mutateAsync({
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role
    });
    
    setFormData({ email: '', fullName: '', role: 'ti_admin' });
    setIsDialogOpen(false);
  };

  const handleToggleBlock = async (userId: string, currentlyActive: boolean) => {
    if (currentlyActive) {
      // Bloquear - precisa de motivo
      await toggleUsuarioAtivo.mutateAsync({
        userId,
        isActive: false,
        reason: blockReason
      });
      setBlockingUser(null);
      setBlockReason('');
    } else {
      // Desbloquear
      await toggleUsuarioAtivo.mutateAsync({
        userId,
        isActive: true
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const colunas: ColunaTabela<UsuarioTecnico>[] = [
    {
      id: 'usuario',
      cabecalho: 'Usuário',
      celula: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-warning/15 text-warning">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium text-foreground">{user.full_name || 'Sem nome'}</div>
            <div className="text-caption text-muted-foreground">{user.email}</div>
            {user.blocked_reason && (
              <div className="text-caption text-destructive mt-1">
                Motivo: {user.blocked_reason}
              </div>
            )}
          </div>
        </div>
      ),
      ordenarPor: (user) => user.full_name || user.email,
      buscarPor: (user) => `${user.full_name ?? ''} ${user.email}`,
      mobile: 'titulo',
    },
    {
      id: 'perfil',
      cabecalho: 'Perfil',
      celula: (user) => <Badge variant="outline">{user.role || 'Sem perfil'}</Badge>,
      ordenarPor: (user) => user.role,
    },
    {
      id: 'criado',
      cabecalho: 'Criado em',
      celula: (user) => format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR }),
      ordenarPor: (user) => new Date(user.created_at),
    },
    {
      id: 'situacao',
      cabecalho: 'Situação',
      celula: (user) => user.is_active
        ? <StatusBadge tom="sucesso">Ativo</StatusBadge>
        : <StatusBadge tom="erro">Bloqueado</StatusBadge>,
      ordenarPor: (user) => user.is_active,
    },
  ];

  return (
    <ProtectedRoute requiredModule="admin">
      <ModuleLayout module="admin">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Usuários técnicos' }]}
            titulo="Usuários técnicos"
            descricao="Gerenciamento de usuários de manutenção e suporte, com acesso técnico ao sistema (não vinculados a servidores)"
            acoes={
              <>
                <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Atualizar
                </Button>
              
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Novo usuário técnico
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo usuário técnico</DialogTitle>
                      <DialogDescription>
                        Crie um usuário para manutenção do sistema. Este usuário NÃO será vinculado a um servidor.
                      </DialogDescription>
                    </DialogHeader>
                  
                    <Alert>
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      <AlertDescription>
                        Usuários técnicos têm acesso restrito e não aparecem em relatórios administrativos.
                      </AlertDescription>
                    </Alert>
                  
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Nome do usuário técnico"
                        />
                      </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="role">Perfil de acesso</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(v) => setFormData({ ...formData, role: v })}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ti_admin">TI - Administrador</SelectItem>
                            <SelectItem value="admin">Administrador Geral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={!formData.email || !formData.fullName || criarUsuarioTecnico.isPending}
                      >
                        {criarUsuarioTecnico.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                        Criar e enviar e-mail
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            }
          />

          {/* Lista */}
          <DataTable
            rotulo="Usuários técnicos"
            dados={usuariosTecnicos}
            colunas={colunas}
            chaveLinha={(user) => user.id}
            carregando={isLoading}
            busca={{ placeholder: 'Buscar por nome ou e-mail...' }}
            vazio={{ icone: ShieldAlert, titulo: 'Nenhum usuário técnico cadastrado.' }}
            acoesLinha={(user) => user.is_active ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setBlockingUser({ id: user.id, name: user.full_name || user.email })}
                aria-label={`Bloquear ${user.full_name || user.email}`}
              >
                <UserX className="h-4 w-4 mr-1" aria-hidden="true" />
                Bloquear
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleBlock(user.id, false)}
                aria-label={`Desbloquear ${user.full_name || user.email}`}
              >
                <UserCheck className="h-4 w-4 mr-1" aria-hidden="true" />
                Desbloquear
              </Button>
            )}
          />
        </div>

        {/* Dialog de bloqueio */}
        <AlertDialog open={!!blockingUser} onOpenChange={() => setBlockingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bloquear usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a bloquear o acesso de <strong>{blockingUser?.name}</strong>.
                Este usuário não poderá mais acessar o sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo do bloqueio</Label>
              <Textarea
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Informe o motivo do bloqueio..."
              />
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBlockReason('')}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => blockingUser && handleToggleBlock(blockingUser.id, true)}
              >
                Bloquear usuário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
