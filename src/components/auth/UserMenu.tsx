// ============================================
// COMPONENTE USER MENU - FASE 6
// ============================================
// Menu dropdown com informações do usuário e ações

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
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  showRoleBadge?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ showRoleBadge = true }) => {
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated, isSuperAdmin } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        <User className="mr-2 h-4 w-4" />
        Entrar
      </Button>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determinar badge baseado em permissões
  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return { label: 'Super Admin', variant: 'destructive' as const };
    }
    
    const permissionCount = user.permissions.length;
    if (permissionCount > 50) {
      return { label: 'Administrador', variant: 'destructive' as const };
    }
    if (permissionCount > 20) {
      return { label: 'Gestor', variant: 'default' as const };
    }
    if (permissionCount > 5) {
      return { label: 'Operador', variant: 'secondary' as const };
    }
    return { label: 'Usuário', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Usuário'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left hidden md:flex">
            <span className="text-sm font-medium">{user.fullName || 'Usuário'}</span>
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
            <p className="text-sm font-medium">{user.fullName || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/meu-perfil')}
        >
          <User className="h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Shield className="h-4 w-4" />
          <span>Permissões</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {user.permissions.length}
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
