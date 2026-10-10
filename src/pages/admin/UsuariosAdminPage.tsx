// ============================================
// PÁGINA DE ADMINISTRAÇÃO DE USUÁRIOS
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, StatusBadge } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { QuickModuloToggle } from '@/components/admin/QuickModuloToggle';
import { CriarUsuarioDialog } from '@/components/admin/CriarUsuarioDialog';
import { MODULO_LABELS, type UsuarioAdmin, type Modulo } from '@/types/rbac';
import { isProtectedAdmin } from '@/shared/config/protected-users.config';
import { 
  Search, Info, Loader2, RefreshCw, ShieldCheck,
  User, ChevronRight, UserPlus, Lock,
} from 'lucide-react';

export default function UsuariosAdminPage() {
  const navigate = useNavigate();
  const { usuarios, loading, saving, error, fetchUsuarios, toggleModulo } = useAdminUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'bloqueado'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showCriarDialog, setShowCriarDialog] = useState(false);

  const usuariosFiltrados = usuarios.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'ativo' && u.is_active) ||
      (filterStatus === 'bloqueado' && !u.is_active);
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpenDetails = (user: UsuarioAdmin) => {
    navigate(`/admin/usuarios/${user.id}`);
  };

  const handleToggleModulo = async (userId: string, modulo: Modulo, temAtualmente: boolean) => {
    await toggleModulo(userId, modulo, temAtualmente);
  };

  const handleToggleExpand = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setExpandedUser(prev => prev === userId ? null : userId);
  };

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Usuários' }]}
          titulo="Usuários"
          descricao="Acesso dos usuários por módulo"
          acoes={
            <>
              <Button variant="outline" onClick={() => fetchUsuarios()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Atualizar
              </Button>
              <Button onClick={() => setShowCriarDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                Novo usuário
              </Button>
            </>
          }
        />

        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Cada usuário possui acesso a <strong>módulos específicos</strong> com permissões granulares.
            Clique em um usuário para gerenciar seus módulos.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar os usuários: <span className="font-mono">{error}</span>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Buscar por nome ou e-mail"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full lg:w-40" aria-label="Filtrar por situação">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="bloqueado">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Carregando usuários">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icone={User}
                titulo={searchTerm || filterStatus !== 'all'
                  ? 'Nenhum usuário encontrado com os filtros aplicados.'
                  : 'Nenhum usuário cadastrado.'}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {usuariosFiltrados.map((usuario) => {
              const isExpanded = expandedUser === usuario.id;
              const isProtected = isProtectedAdmin(usuario.id, usuario.email);
              const canEditModules = !isProtected;
              
              return (
                <Card 
                  key={usuario.id}
                  className={`transition-all ${!usuario.is_active ? 'opacity-60' : ''} ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={usuario.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(usuario.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {usuario.full_name || 'Sem nome'}
                          </span>
                          {isProtected && <Lock className="h-3 w-3 text-warning" aria-hidden="true" />}
                          {!usuario.is_active && (
                            <StatusBadge tom="erro">Bloqueado</StatusBadge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{usuario.email}</div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {usuario.modulos.length} módulo(s)
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canEditModules && (
                          <Button
                            variant={isExpanded ? "secondary" : "outline"}
                            size="sm"
                            onClick={(e) => handleToggleExpand(e, usuario.id)}
                            className="text-xs"
                            aria-expanded={isExpanded}
                          >
                            Módulos
                          </Button>
                        )}
                        {isProtected && (
                          <StatusBadge tom="pendente" icone={false}>Protegido</StatusBadge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(usuario)}
                          aria-label={`Ver detalhes de ${usuario.full_name || usuario.email}`}
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && canEditModules && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          Clique para ativar/desativar módulos:
                        </p>
                        <QuickModuloToggle
                          modulosAtivos={usuario.modulos}
                          onToggle={(modulo, temAtualmente) => handleToggleModulo(usuario.id, modulo, temAtualmente)}
                          disabled={saving}
                          isSuperAdmin={false}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <CriarUsuarioDialog
          open={showCriarDialog}
          onOpenChange={setShowCriarDialog}
          onSuccess={() => fetchUsuarios()}
        />
      </div>
    </ModuleLayout>
  );
}
