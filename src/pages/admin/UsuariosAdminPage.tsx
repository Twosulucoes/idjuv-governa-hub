// ============================================
// PÁGINA DE ADMINISTRAÇÃO DE USUÁRIOS (NOVO RBAC)
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
import type { UsuarioAdmin } from '@/types/rbac';
import { 
  Search, 
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function UsuariosAdminPage() {
  const navigate = useNavigate();
  const { usuarios, loading, fetchUsuarios } = useAdminUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'servidor' | 'tecnico'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'bloqueado'>('all');

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'all' || u.tipo_usuario === filterTipo;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'ativo' && u.is_active) ||
      (filterStatus === 'bloqueado' && !u.is_active);
    
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpenDetails = (user: UsuarioAdmin) => {
    navigate(`/admin/usuarios/${user.id}`);
  };

  return (
    <AdminLayout 
      title="Administração de Usuários" 
      description="Gerencie os usuários e seus perfis de acesso"
    >
      <div className="space-y-6">
        {/* Aviso institucional */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Usuários recebem acesso ao sistema através de <strong>perfis</strong>.
            Permissões não podem ser atribuídas diretamente aos usuários.
          </AlertDescription>
        </Alert>

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
          
          <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as any)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Tipo de usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="servidor">Servidores</SelectItem>
              <SelectItem value="tecnico">Técnicos</SelectItem>
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
              {searchTerm || filterTipo !== 'all' || filterStatus !== 'all'
                ? 'Nenhum usuário encontrado com os filtros aplicados.'
                : 'Nenhum usuário cadastrado.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {usuariosFiltrados.map((usuario) => (
              <Card 
                key={usuario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !usuario.is_active ? 'opacity-60' : ''
                }`}
                onClick={() => handleOpenDetails(usuario)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={usuario.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
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

                    <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                      {usuario.perfis.length > 0 ? (
                        usuario.perfis.slice(0, 3).map(up => (
                          <Badge 
                            key={up.id} 
                            variant="secondary"
                            className="text-xs"
                            style={{ 
                              borderColor: up.perfil?.cor || undefined,
                              borderWidth: up.perfil?.cor ? 1 : 0
                            }}
                          >
                            {up.perfil?.nome || 'Perfil'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem perfis</span>
                      )}
                      {usuario.perfis.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{usuario.perfis.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                      {usuario.tipo_usuario === 'servidor' ? 'Servidor' : 'Técnico'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
