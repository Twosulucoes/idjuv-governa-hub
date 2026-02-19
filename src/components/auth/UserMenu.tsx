// ============================================
// COMPONENTE USER MENU - VERSÃO FINAL CORRIGIDA
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  permissions: string[];
  requiresPasswordChange?: boolean;
  isSuperAdmin?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ showRoleBadge = true }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ============================================
  // CARREGAR DADOS DO USUÁRIO DO localStorage
  // ============================================
  useEffect(() => {
    const loadUserData = () => {
      try {
        setIsLoading(true);
        
        const storedUser = localStorage.getItem('@App:user');
        const token = localStorage.getItem('@App:token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          
          // REGRA DE OURO: Se for o seu e-mail ou tiver flag SuperAdmin, garante acesso total
          // Substituímos o admin@exemplo.com pelo seu e-mail real
          if (parsedUser.email === 'handfabiano@gmail.com' || parsedUser.isSuperAdmin) {
            parsedUser.isSuperAdmin = true;
            parsedUser.permissions = ['*']; // Permissão "Coringa" para bypass
          }
          
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '@App:user') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ============================================
  // FUNÇÃO DE LOGOUT
  // ============================================
  const handleSignOut = () => {
    try {
      localStorage.removeItem('@App:user');
      localStorage.removeItem('@App:token');
      localStorage.removeItem('@App:refreshToken');
      
      setUser(null);
      setIsAuthenticated(false);
      
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

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

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    // Super Admin reconhecido pelo e-mail ou pela flag do banco
    if (user.isSuperAdmin || user.email === 'handfabiano@gmail.com') {
      return { label: 'Super Admin', variant: 'destructive' as const };
    }
    
    const permissionCount = user.permissions?.length || 0;
    if (permissionCount > 50) return { label: 'Administrador', variant: 'destructive' as const };
    if (permissionCount > 20) return { label: 'Gestor', variant: 'default' as const };
    
    return { label: 'Usuário', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Usuário'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start text-left hidden md:flex">
            <span className="text-sm font-medium">
              {user.fullName || 'Usuário'}
            </span>
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
        
        <DropdownMenuItem onClick={() => navigate('/meu-perfil')} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/permissoes')} className="cursor-pointer">
          <Shield className="h-4 w-4 mr-2" />
          <span>Permissões</span>
          {user.permissions && (
            <Badge variant="outline" className="ml-auto text-xs">
              {user.permissions[0] === '*' ? '∞' : user.permissions.length}
            </Badge>
          )}
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
