// ============================================
// PÁGINA DE ADMINISTRAÇÃO DE USUÁRIOS (SIMPLIFICADO)
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { QuickModuloToggle } from '@/components/admin/QuickModuloToggle';
import { PERFIL_LABELS, PERFIL_CORES, type PerfilCodigo, type UsuarioAdmin, type Modulo } from '@/types/rbac';
import { 
  Search, 
  Info,
  Loader2,
  RefreshCw,
  Shield,
  UserCheck,
  User,
  ChevronRight,
} from 'lucide-react';

export default function UsuariosAdminPage() {
  const navigate = useNavigate();
  const { usuarios, loading, saving, error, fetchUsuarios, toggleModulo } = useAdminUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState<'all' | PerfilCodigo>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'bloqueado'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const perfilCodigo = u.perfil?.perfil?.codigo as PerfilCodigo | undefined;
    const matchesPerfil = filterPerfil === 'all' || perfilCodigo === filterPerfil;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'ativo' && u.is_active) ||
      (filterStatus === 'bloqueado' && !u.is_active);
    
    return matchesSearch && matchesPerfil && matchesStatus;
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPerfilIcon = (codigo: PerfilCodigo | undefined) => {
    switch (codigo) {
      case 'super_admin': return <Shield className="h-4 w-4" />;
      case 'gestor': return <UserCheck className="h-4 w-4" />;
      case 'servidor': return <User className="h-4 w-4" />;
      default: return null;
    }
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
    <AdminLayout 
      title="Administração de Usuários" 
      description="Gerencie os usuários e seus acessos ao sistema"
    >
      <div className="space-y-6">
        {/* Aviso institucional */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cada usuário possui um <strong>perfil</strong> (Super Admin, Gestor ou Servidor)
            e acesso a <strong>módulos específicos</strong>. Clique em um usuário para gerenciar.
          </AlertDescription>
        </Alert>

        {/* Erro de carregamento (RLS / query inválida / etc.) */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar os usuários: <span className="font-mono">{error}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Header com filtros */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterPerfil} onValueChange={(v) => setFilterPerfil(v as any)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="servidor">Servidor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="bloqueado">Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => fetchUsuarios()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Lista de usuários */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchTerm || filterPerfil !== 'all' || filterStatus !== 'all'
                ? 'Nenhum usuário encontrado com os filtros aplicados.'
                : 'Nenhum usuário cadastrado.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {usuariosFiltrados.map((usuario) => {
              const perfilCodigo = usuario.perfil?.perfil?.codigo as PerfilCodigo | undefined;
              const isExpanded = expandedUser === usuario.id;
              const isSuperAdmin = perfilCodigo === 'super_admin';
              
              return (
                <Card 
                  key={usuario.id}
                  className={`transition-all ${
                    !usuario.is_active ? 'opacity-60' : ''
                  } ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <CardContent className="py-4">
                    {/* Linha principal */}
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
                          {!usuario.is_active && (
                            <Badge variant="destructive" className="text-xs">
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {usuario.email}
                        </div>
                      </div>

                      {/* Perfil */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {perfilCodigo ? (
                          <Badge className={PERFIL_CORES[perfilCodigo]}>
                            {getPerfilIcon(perfilCodigo)}
                            <span className="ml-1">{PERFIL_LABELS[perfilCodigo]}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Sem perfil
                          </Badge>
                        )}
                      </div>

                      {/* Toggle Módulos / Detalhes */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isSuperAdmin && (
                          <Button
                            variant={isExpanded ? "secondary" : "outline"}
                            size="sm"
                            onClick={(e) => handleToggleExpand(e, usuario.id)}
                            className="text-xs"
                          >
                            {usuario.modulos.length > 0 
                              ? `${usuario.modulos.length} módulo(s)` 
                              : 'Módulos'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(usuario)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Área expandida de módulos */}
                    {isExpanded && !isSuperAdmin && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          Clique para ativar/desativar módulos:
                        </p>
                        <QuickModuloToggle
                          modulosAtivos={usuario.modulos}
                          onToggle={(modulo, temAtualmente) => 
                            handleToggleModulo(usuario.id, modulo, temAtualmente)
                          }
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
      </div>
    </AdminLayout>
  );
}
