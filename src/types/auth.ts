// ============================================
// TIPOS DE AUTENTICAÇÃO E PERMISSÕES
// ============================================

// Roles disponíveis no sistema
export type AppRole = 'admin' | 'manager' | 'user' | 'guest';

// Permissões granulares disponíveis
export type AppPermission =
  | 'users.read' | 'users.create' | 'users.update' | 'users.delete'
  | 'content.read' | 'content.create' | 'content.update' | 'content.delete'
  | 'reports.view' | 'reports.export'
  | 'settings.view' | 'settings.edit'
  | 'processes.read' | 'processes.create' | 'processes.update' | 'processes.delete' | 'processes.approve';

// Dados do usuário autenticado
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: AppRole;
  permissions: AppPermission[];
}

// Estado da autenticação
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Labels para roles (exibição em português)
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  guest: 'Convidado'
};

// Descrições dos roles
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acesso total ao sistema',
  manager: 'Acesso moderado com algumas restrições',
  user: 'Acesso básico',
  guest: 'Acesso apenas leitura'
};

// Labels para permissões (exibição em português)
export const PERMISSION_LABELS: Record<AppPermission, string> = {
  'users.read': 'Visualizar usuários',
  'users.create': 'Criar usuários',
  'users.update': 'Editar usuários',
  'users.delete': 'Excluir usuários',
  'content.read': 'Visualizar conteúdo',
  'content.create': 'Criar conteúdo',
  'content.update': 'Editar conteúdo',
  'content.delete': 'Excluir conteúdo',
  'reports.view': 'Visualizar relatórios',
  'reports.export': 'Exportar relatórios',
  'settings.view': 'Visualizar configurações',
  'settings.edit': 'Editar configurações',
  'processes.read': 'Visualizar processos',
  'processes.create': 'Criar processos',
  'processes.update': 'Editar processos',
  'processes.delete': 'Excluir processos',
  'processes.approve': 'Aprovar processos'
};

// Grupos de permissões por categoria
export const PERMISSION_GROUPS = {
  users: ['users.read', 'users.create', 'users.update', 'users.delete'] as AppPermission[],
  content: ['content.read', 'content.create', 'content.update', 'content.delete'] as AppPermission[],
  reports: ['reports.view', 'reports.export'] as AppPermission[],
  settings: ['settings.view', 'settings.edit'] as AppPermission[],
  processes: ['processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve'] as AppPermission[]
};
