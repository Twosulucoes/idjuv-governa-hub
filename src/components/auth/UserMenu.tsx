// ============================================
// COMPONENTE USER MENU - FIX VERSÃO 100% FUNCIONAL
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
        
        // Buscar usuário do localStorage
        const storedUser = localStorage.getItem('@App:user');
        const token = localStorage.getItem('@App:token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          
          // Garantir que admin tenha todas as permissões
          if (parsedUser.email === 'admin@exemplo.com' || parsedUser.isSuperAdmin) {
            parsedUser.isSuperAdmin = true;
            parsedUser.permissions = ['*']; // Todas as permissões
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

    // Ouvir mudanças no localStorage
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
      // Limpar dados do localStorage
      localStorage.removeItem('@App:user');
      localStorage.removeItem('@App:token');
      localStorage.removeItem('@App:refreshToken');
      
      // Limpar estado
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirecionar para login
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </Button>
    );
  }

  // ============================================
  // NÃO AUTENTICADO
  // ============================================
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
  // FUNÇÕES AUXILIARES
  // ============================================
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
    // Super Admin sempre tem badge especial
    if (user.isSuperAdmin || user.email === 'admin@exemplo.com') {
      return { label: 'Super Admin', variant: 'destructive' as const };
    }
    
    const permissionCount = user.permissions?.length || 0;
    
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
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.avatarUrl || undefined} 
              alt={user.fullName || 'Usuário'} 
            />
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
            <p className="text-sm font-medium">
              {user.fullName || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
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
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/permissoes')}
        >
          <Shield className="h-4 w-4" />
          <span>Permissões</span>
          {user.permissions && user.permissions.length > 0 && (
            <Badge variant="outline" className="ml-auto text-xs">
              {user.permissions[0] === '*' ? '∞' : user.permissions.length}
            </Badge>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/configuracoes')}
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
