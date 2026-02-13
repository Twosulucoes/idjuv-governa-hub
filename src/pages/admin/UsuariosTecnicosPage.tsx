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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Wrench, 
  Plus, 
  Search, 
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
import { ROLE_LABELS } from '@/types/auth';

export default function UsuariosTecnicosPage() {
  const { usuariosTecnicos, isLoading, refetch, criarUsuarioTecnico, toggleUsuarioAtivo } = useUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [blockingUser, setBlockingUser] = useState<{ id: string; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'ti_admin'
  });

  const filteredUsers = usuariosTecnicos.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <ProtectedRoute allowedRoles={['admin']} requiredModule="admin">
      <ModuleLayout module="admin">
        <div className="container mx-auto py-8 px-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-8 w-8 text-orange-500" />
                Usuários Técnicos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerenciamento de usuários de manutenção e suporte
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Usuário Técnico
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Usuário Técnico</DialogTitle>
                    <DialogDescription>
                      Crie um usuário para manutenção do sistema. Este usuário NÃO será vinculado a um servidor.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Usuários técnicos têm acesso restrito e não aparecem em relatórios administrativos.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nome do usuário técnico"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Perfil de Acesso</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(v) => setFormData({ ...formData, role: v })}
                      >
                        <SelectTrigger>
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
                      {criarUsuarioTecnico.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Mail className="mr-2 h-4 w-4" />
                      Criar e Enviar Email
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Busca */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                Usuários Técnicos ({filteredUsers.length})
              </CardTitle>
              <CardDescription>
                Usuários com acesso técnico ao sistema (não vinculados a servidores)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário técnico cadastrado.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        user.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {user.full_name || 'Sem nome'}
                            {!user.is_active && (
                              <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.blocked_reason && (
                            <div className="text-xs text-destructive mt-1">
                              Motivo: {user.blocked_reason}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {user.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role : 'Sem perfil'}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            Criado em {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                        
                        {user.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setBlockingUser({ id: user.id, name: user.full_name || user.email })}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Bloquear
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleBlock(user.id, false)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Desbloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog de bloqueio */}
        <AlertDialog open={!!blockingUser} onOpenChange={() => setBlockingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bloquear Usuário</AlertDialogTitle>
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
                Bloquear Usuário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
