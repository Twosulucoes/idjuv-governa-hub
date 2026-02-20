// ============================================
// COMPONENTE USER MENU — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: Usa AuthContext em vez de ler localStorage diretamente.
// Isso garante estado único e sincronizado em toda a aplicação.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, Shield, ChevronDown, Loader2 } from 'lucide-react';

interface UserMenuProps {
  showRoleBadge?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ showRoleBadge = true }) => {
  const navigate = useNavigate();
  // ✅ CORREÇÃO: Uma única fonte de verdade — o AuthContext
  const { user, isLoading, isAuthenticated, isSuperAdmin, signOut } = useAuth();

  // ============================================
  // FUNÇÃO DE LOGOUT
  // ============================================
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // ============================================
  // ESTADOS DE CARREGAMENTO / NÃO AUTENTICADO
  // ============================================
  if (isLoading) {
    return (
      <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate('/auth')}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        Entrar
      </Button>
    );
  }

  // ============================================
  // HELPERS
  // ============================================
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    // ✅ CORREÇÃO: Usa isSuperAdmin do contexto. Sem e-mail hardcoded.
    if (isSuperAdmin) {
      return { label: 'Admin', variant: 'destructive' as const };
    }
    const permissionCount = user.permissions?.length ?? 0;
    if (permissionCount > 50) return { label: 'Administrador', variant: 'destructive' as const };
    if (permissionCount > 20) return { label: 'Gestor', variant: 'default' as const };
    return { label: 'Usuário', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();
  const permissionDisplay = isSuperAdmin
    ? '∞'
    : String(user.permissions?.length ?? 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName ?? 'Usuário'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium">{user.fullName ?? 'Usuário'}</span>
            {showRoleBadge && (
              <Badge variant={roleBadge.variant} className="text-xs h-5">
                {roleBadge.label}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.fullName ?? 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/meu-perfil')} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/permissoes')} className="cursor-pointer">
          <Shield className="h-4 w-4 mr-2" />
          <span>Permissões</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {permissionDisplay}
          </Badge>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
