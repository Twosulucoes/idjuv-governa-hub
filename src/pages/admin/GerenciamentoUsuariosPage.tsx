// ============================================
// PÁGINA DE GERENCIAMENTO DE USUÁRIOS (ADMIN)
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CriarUsuarioDialog } from '@/components/admin/CriarUsuarioDialog';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Edit, 
  Save,
  X,
  Loader2,
  RefreshCw,
  UserCog,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { AppRole, AppPermission, ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSION_LABELS, PERMISSION_GROUPS } from '@/types/auth';

// ============================================
// TIPOS
// ============================================

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: AppRole;
  permissions: AppPermission[];
  createdAt: string;
  tipoUsuario: 'servidor' | 'tecnico';
  isActive: boolean;
  servidorNome?: string;
  servidorMatricula?: string;
  cpf?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GerenciamentoUsuariosContent: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<AppRole | 'all'>('all');
  const [filterTipo, setFilterTipo] = useState<'all' | 'servidor' | 'tecnico'>('servidor');
  
  // Modal de criação de usuário
  const [showCriarUsuario, setShowCriarUsuario] = useState(false);
  
  // Modal de edição
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState<AppRole>('user');
  const [editPermissions, setEditPermissions] = useState<AppPermission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Senha temporária (reset via admin)
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);
  const [showSenhaTemporaria, setShowSenhaTemporaria] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // ============================================
  // CARREGAR USUÁRIOS
  // ============================================

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Buscar profiles com dados do servidor
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar servidores vinculados
      const servidorIds = profiles?.filter(p => p.servidor_id).map(p => p.servidor_id) || [];
      let servidoresMap: Record<string, { nome: string; matricula: string }> = {};
      
      if (servidorIds.length > 0) {
        const { data: servidores } = await supabase
          .from('servidores')
          .select('id, nome_completo, matricula')
          .in('id', servidorIds);
        
        servidores?.forEach(s => {
          servidoresMap[s.id] = { nome: s.nome_completo, matricula: s.matricula };
        });
      }

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Buscar permissões
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Combinar dados
      const usersData: UserData[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const userPermissions = permissions?.filter(p => p.user_id === profile.id) || [];
        const servidor = profile.servidor_id ? servidoresMap[profile.servidor_id] : null;
        
        return {
          id: profile.id,
          email: profile.email || '',
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          role: (userRole?.role as AppRole) || 'user',
          permissions: userPermissions.map(p => p.permission as AppPermission),
          createdAt: profile.created_at,
          tipoUsuario: profile.tipo_usuario || 'servidor',
          isActive: profile.is_active ?? true,
          servidorNome: servidor?.nome,
          servidorMatricula: servidor?.matricula,
          cpf: profile.cpf
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================================
  // ABRIR MODAL DE EDIÇÃO
  // ============================================

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPermissions([...user.permissions]);
    setSenhaTemporaria(null);
    setShowSenhaTemporaria(false);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditRole('user');
    setEditPermissions([]);
    setSenhaTemporaria(null);
    setShowSenhaTemporaria(false);
  };

  // ============================================
  // TOGGLE PERMISSÃO
  // ============================================

  const togglePermission = (permission: AppPermission) => {
    setEditPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  // ============================================
  // SALVAR ALTERAÇÕES
  // ============================================

  const saveChanges = async () => {
    if (!editingUser) return;
    
    // Não permitir que admin remova seu próprio role de admin
    if (editingUser.id === currentUser?.id && editRole !== 'admin') {
      toast({
        variant: "destructive",
        title: "Ação não permitida",
        description: "Você não pode remover seu próprio papel de administrador."
      });
      return;
    }

    setIsSaving(true);
    try {
      // Atualizar role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: editingUser.id,
          role: editRole
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        // Se falhou o upsert, tenta update direto
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: editRole })
          .eq('user_id', editingUser.id);
        
        if (updateError) throw updateError;
      }

      // Remover permissões antigas
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', editingUser.id);

      if (deleteError) throw deleteError;

      // Adicionar novas permissões
      if (editPermissions.length > 0) {
        const newPermissions = editPermissions.map(permission => ({
          user_id: editingUser.id,
          permission: permission as any // Cast para evitar erro de tipo estrito
        }));

        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(newPermissions as any);

        if (insertError) throw insertError;
      }

      toast({
        title: "Alterações salvas",
        description: `Permissões de ${editingUser.fullName || editingUser.email} atualizadas com sucesso.`
      });

      closeEditModal();
      loadUsers();
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // FILTRAR USUÁRIOS
  // ============================================

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.servidorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.servidorMatricula?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTipo = filterTipo === 'all' || user.tipoUsuario === filterTipo;
    
    return matchesSearch && matchesRole && matchesTipo;
  });

  // ============================================
  // HELPERS
  // ============================================

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="h-4 w-4" />;
      case 'manager': return <ShieldCheck className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const handleGerarSenhaTemporaria = async () => {
    if (!editingUser) return;

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: editingUser.id },
      });

      if (error) throw error;

      setSenhaTemporaria((data as any)?.senhaTemporaria ?? null);
      setShowSenhaTemporaria(true);

      toast({
        title: 'Senha temporária gerada',
        description: 'Copie a senha e envie ao usuário.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar senha temporária',
        description: err?.message || 'Não foi possível gerar a senha.',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopiarSenhaTemporaria = async () => {
    if (!senhaTemporaria) return;
    await navigator.clipboard.writeText(senhaTemporaria);
    toast({ title: 'Senha copiada', description: 'Copiada para a área de transferência.' });
  };

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserCog className="h-8 w-8 text-primary" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie roles e permissões dos usuários do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCriarUsuario(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Usuário
            </Button>
            
            <Button variant="outline" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, servidor ou matrícula..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as 'all' | 'servidor' | 'tecnico')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servidor">Usuários-Servidores</SelectItem>
                  <SelectItem value="tecnico">Usuários Técnicos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterRole} onValueChange={(v) => setFilterRole(v as AppRole | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="guest">Convidado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Clique em um usuário para editar suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || filterRole !== 'all' 
                  ? 'Nenhum usuário encontrado com os filtros aplicados.'
                  : 'Nenhum usuário cadastrado.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => openEditModal(user)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="font-medium text-foreground">
                          {user.fullName || 'Sem nome'}
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-muted-foreground ml-2">(você)</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-muted-foreground">
                          {user.permissions.length} permissões extras
                        </div>
                      </div>
                      
                      <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {ROLE_LABELS[user.role]}
                      </Badge>
                      
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de edição */}
        <Dialog open={!!editingUser} onOpenChange={() => closeEditModal()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Editar Permissões
              </DialogTitle>
              <DialogDescription>
                {editingUser?.fullName || editingUser?.email}
              </DialogDescription>
            </DialogHeader>

            {editingUser && (
              <div className="space-y-6 py-4">
                {/* Senha */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label className="text-base font-semibold">Senha</Label>
                      <p className="text-sm text-muted-foreground">
                        Gere uma senha temporária para o usuário (será exigida troca no primeiro acesso)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGerarSenhaTemporaria}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Gerar senha temporária
                        </>
                      )}
                    </Button>
                  </div>

                  {senhaTemporaria && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      <Label className="text-sm text-muted-foreground">Senha temporária</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-md border bg-background p-3 font-mono text-base">
                          {showSenhaTemporaria ? senhaTemporaria : '••••••••••••'}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowSenhaTemporaria((v) => !v)}
                          title={showSenhaTemporaria ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showSenhaTemporaria ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopiarSenhaTemporaria}
                          title="Copiar senha"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Importante: por segurança, copie agora. A aplicação não armazena essa senha.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>

                {/* Aviso se for o próprio usuário */}
                {editingUser.id === currentUser?.id && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Você está editando suas próprias permissões. Não é possível remover seu papel de administrador.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Seleção de Role */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Nível de Acesso</Label>
                  <Select 
                    value={editRole} 
                    onValueChange={(v) => setEditRole(v as AppRole)}
                    disabled={editingUser.id === currentUser?.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['admin', 'manager', 'user', 'guest'] as AppRole[]).map(role => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role)}
                            <div>
                              <div className="font-medium">{ROLE_LABELS[role]}</div>
                              <div className="text-xs text-muted-foreground">
                                {ROLE_DESCRIPTIONS[role]}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Permissões extras */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Permissões Extras</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicione permissões específicas além das herdadas do nível de acesso
                    </p>
                  </div>

                  {Object.entries(PERMISSION_GROUPS as Record<string, string[]>).map(([group, permissions]) => (
                    <div key={group} className="space-y-2">
                      <Label className="text-sm font-medium capitalize">{group}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(permissions as string[]).map(permission => (
                          <div 
                            key={permission}
                            className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50"
                          >
                            <Checkbox
                              id={permission}
                              checked={editPermissions.includes(permission)}
                              onCheckedChange={() => togglePermission(permission)}
                            />
                            <Label 
                              htmlFor={permission} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {PERMISSION_LABELS[permission]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeEditModal}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={saveChanges} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de criação de usuário */}
        <CriarUsuarioDialog 
          open={showCriarUsuario} 
          onOpenChange={setShowCriarUsuario}
          onSuccess={loadUsers}
        />
      </div>
    </AdminLayout>
  );
};

// ============================================
// PÁGINA COM PROTEÇÃO
// ============================================

const GerenciamentoUsuariosPage: React.FC = () => {
  return (
    <ProtectedRoute 
      allowedRoles="admin"
      accessDeniedPath="/acesso-negado"
    >
      <GerenciamentoUsuariosContent />
    </ProtectedRoute>
  );
};

export default GerenciamentoUsuariosPage;
