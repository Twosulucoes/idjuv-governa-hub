// ============================================
// TIPOS DE AUTENTICAÇÃO E PERMISSÕES IDJuv
// ============================================

// Roles disponíveis no sistema (incluindo perfis IDJuv)
export type AppRole = 
  | 'admin' 
  | 'manager' 
  | 'user' 
  | 'guest'
  | 'presidencia'
  | 'diraf'
  | 'rh'
  | 'ti_admin'
  | 'gabinete'
  | 'controle_interno'
  | 'juridico'
  | 'cpl'
  | 'ascom'
  | 'cadastrador_local'
  | 'cadastrador_setor'
  | 'cadastrador_leitura';

// Escopo de acesso
export type AccessScope = 'all' | 'org_unit' | 'local_unit' | 'own' | 'readonly';

// Status de aprovação
export type ApprovalStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled';

// Ações de auditoria
export type AuditAction = 
  | 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset'
  | 'create' | 'update' | 'delete' | 'view' | 'export' 
  | 'upload' | 'download' | 'approve' | 'reject' | 'submit';

// Permissões granulares disponíveis
export type AppPermission =
  | 'users.read' | 'users.create' | 'users.update' | 'users.delete'
  | 'content.read' | 'content.create' | 'content.update' | 'content.delete'
  | 'reports.view' | 'reports.export'
  | 'settings.view' | 'settings.edit'
  | 'processes.read' | 'processes.create' | 'processes.update' | 'processes.delete' | 'processes.approve'
  | 'roles.manage' | 'permissions.manage'
  | 'documents.view' | 'documents.create' | 'documents.edit' | 'documents.delete'
  | 'requests.create' | 'requests.view' | 'requests.approve' | 'requests.reject'
  | 'audit.view' | 'audit.export'
  | 'approval.delegate' | 'org_units.manage' | 'mfa.manage';

// Dados do usuário autenticado
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: AppRole;
  permissions: AppPermission[];
  orgUnitId?: string;
  orgUnitName?: string;
  accessScope?: AccessScope;
}

// Estado da autenticação
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Configurações de segurança do usuário
export interface UserSecuritySettings {
  id: string;
  userId: string;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  mfaMethod: 'app' | 'email';
  forcePasswordChange: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
  lastLoginAt?: string;
  isActive: boolean;
}

// Solicitação de aprovação
export interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  moduleName: string;
  status: ApprovalStatus;
  requesterId: string;
  requesterName?: string;
  requesterOrgUnitId?: string;
  submittedAt?: string;
  justification?: string;
  attachments?: any[];
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  approverDecision?: string;
  electronicSignature?: {
    name: string;
    role: string;
    timestamp: string;
    hash: string;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Log de auditoria
export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  moduleName?: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  roleAtTime?: AppRole;
  description?: string;
  metadata?: any;
}

// Labels para roles (exibição em português)
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  guest: 'Convidado',
  presidencia: 'Presidência',
  diraf: 'DIRAF',
  rh: 'Recursos Humanos',
  ti_admin: 'TI - Administrador',
  gabinete: 'Gabinete',
  controle_interno: 'Controle Interno',
  juridico: 'Jurídico',
  cpl: 'CPL',
  ascom: 'ASCOM',
  cadastrador_local: 'Cadastrador Local',
  cadastrador_setor: 'Cadastrador de Setor',
  cadastrador_leitura: 'Cadastrador (Leitura)'
};

// Descrições dos roles
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acesso total ao sistema',
  manager: 'Acesso moderado com algumas restrições',
  user: 'Acesso básico',
  guest: 'Acesso apenas leitura',
  presidencia: 'Autorização máxima - pode aprovar e delegar',
  diraf: 'Gestão administrativa e financeira',
  rh: 'Gestão de recursos humanos',
  ti_admin: 'Administração técnica do sistema',
  gabinete: 'Chefia de gabinete',
  controle_interno: 'Auditoria e controle interno',
  juridico: 'Assessoria jurídica',
  cpl: 'Comissão de licitação',
  ascom: 'Assessoria de comunicação',
  cadastrador_local: 'Cadastro na unidade local',
  cadastrador_setor: 'Cadastro no setor',
  cadastrador_leitura: 'Apenas visualização'
};

// Labels para permissões
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
  'processes.approve': 'Aprovar processos',
  'roles.manage': 'Gerenciar perfis',
  'permissions.manage': 'Gerenciar permissões',
  'documents.view': 'Visualizar documentos',
  'documents.create': 'Criar documentos',
  'documents.edit': 'Editar documentos',
  'documents.delete': 'Excluir documentos',
  'requests.create': 'Criar solicitações',
  'requests.view': 'Visualizar solicitações',
  'requests.approve': 'Aprovar solicitações',
  'requests.reject': 'Rejeitar solicitações',
  'audit.view': 'Visualizar auditoria',
  'audit.export': 'Exportar auditoria',
  'approval.delegate': 'Delegar aprovação',
  'org_units.manage': 'Gerenciar unidades',
  'mfa.manage': 'Gerenciar MFA'
};

// Grupos de permissões por categoria
export const PERMISSION_GROUPS = {
  users: ['users.read', 'users.create', 'users.update', 'users.delete'] as AppPermission[],
  content: ['content.read', 'content.create', 'content.update', 'content.delete'] as AppPermission[],
  reports: ['reports.view', 'reports.export'] as AppPermission[],
  settings: ['settings.view', 'settings.edit'] as AppPermission[],
  processes: ['processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve'] as AppPermission[],
  documents: ['documents.view', 'documents.create', 'documents.edit', 'documents.delete'] as AppPermission[],
  requests: ['requests.create', 'requests.view', 'requests.approve', 'requests.reject'] as AppPermission[],
  audit: ['audit.view', 'audit.export'] as AppPermission[],
  admin: ['roles.manage', 'permissions.manage', 'approval.delegate', 'org_units.manage', 'mfa.manage'] as AppPermission[]
};

// Labels de status de aprovação
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Submetido',
  in_review: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado'
};

// Labels de ação de auditoria
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Login',
  logout: 'Logout',
  login_failed: 'Login falhou',
  password_change: 'Alteração de senha',
  password_reset: 'Reset de senha',
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  view: 'Visualização',
  export: 'Exportação',
  upload: 'Upload',
  download: 'Download',
  approve: 'Aprovação',
  reject: 'Rejeição',
  submit: 'Submissão'
};

// Labels de escopo
export const ACCESS_SCOPE_LABELS: Record<AccessScope, string> = {
  all: 'Tudo',
  org_unit: 'Meu Setor',
  local_unit: 'Minha Unidade',
  own: 'Meus Registros',
  readonly: 'Somente Leitura'
};

// Perfis que podem aprovar
export const APPROVER_ROLES: AppRole[] = ['presidencia', 'admin'];

// Perfis administrativos
export const ADMIN_ROLES: AppRole[] = ['admin', 'ti_admin', 'presidencia'];
