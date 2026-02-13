// ============================================
// TIPOS DE AUTENTICAÇÃO E PERMISSÕES IDJuv
// ============================================
// FASE 6: Sistema baseado EXCLUSIVAMENTE em permissões
// Roles são derivados do banco, nunca hardcoded

// ============================================
// PERMISSÕES DO SISTEMA
// ============================================
// Permissões dinâmicas vindas do banco de dados
// Formato: {modulo}.{recurso}.{acao}
// Ex: rh.servidores.criar, governanca.portarias.visualizar

// Tipo genérico para permissões (aceita qualquer string do banco)
export type PermissionCode = string;

// Status de aprovação
export type ApprovalStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled';

// Ações de auditoria
export type AuditAction = 
  | 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset'
  | 'create' | 'update' | 'delete' | 'view' | 'export' 
  | 'upload' | 'download' | 'approve' | 'reject' | 'submit';

// Escopo de acesso
export type AccessScope = 'all' | 'org_unit' | 'local_unit' | 'own' | 'readonly';

// ============================================
// ESTRUTURA DE PERMISSÃO DO BANCO
// ============================================
// Retorno do RPC listar_permissoes_usuario
export interface PermissaoUsuario {
  funcao_id: string;
  funcao_codigo: string;
  funcao_nome: string;
  modulo: string;
  submodulo: string | null;
  tipo_acao: string;
  perfil_nome: string;
  rota: string | null;
  icone: string | null;
}

// ============================================
// DADOS DO USUÁRIO AUTENTICADO
// ============================================
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  // Lista de códigos de permissão do banco
  permissions: PermissionCode[];
  // Dados estruturados de permissões (opcional para cache)
  permissoesDetalhadas?: PermissaoUsuario[];
  // Flag se é super_admin (bypass de todas as permissões)
  isSuperAdmin: boolean;
  // Servidor vinculado (se aplicável)
  servidorId?: string;
  // Tipo de usuário
  tipoUsuario?: 'servidor' | 'tecnico';
  orgUnitId?: string;
  orgUnitName?: string;
  // Flag para forçar troca de senha no primeiro acesso
  requiresPasswordChange?: boolean;
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

// ============================================
// MAPEAMENTO DE ROTAS PARA PERMISSÕES
// ============================================
// Usado pelo ProtectedRoute para verificar acesso

export const ROUTE_PERMISSIONS: Record<string, PermissionCode | PermissionCode[]> = {
  // ============================================
  // ADMIN / SISTEMA
  // ============================================
  '/admin': 'admin',
  '/admin/dashboard': 'admin.dashboard',
  '/admin/usuarios': 'admin.usuarios',
  '/admin/perfis': 'admin.perfis',
  '/admin/auditoria': 'admin.auditoria',
  '/admin/database': 'admin.database',
  '/admin/backup': 'admin.backup',
  '/admin/disaster-recovery': 'admin.disaster_recovery',
  '/admin/calibrador-segad': 'admin.segad',
  '/admin/reunioes': 'admin.reunioes',
  
  // ============================================
  // RH
  // ============================================
  '/rh/servidores': 'rh.servidores.visualizar',
  '/rh/servidores/novo': 'rh.servidores.criar',
  '/rh/servidor/:id': 'rh.servidores.visualizar',
  '/rh/portarias': 'rh.portarias.visualizar',
  '/rh/designacoes': 'rh.designacoes.visualizar',
  '/rh/ferias': 'rh.ferias.visualizar',
  '/rh/licencas': 'rh.licencas.visualizar',
  '/rh/frequencia': 'rh.frequencia.visualizar',
  '/rh/viagens': 'rh.viagens.visualizar',
  '/rh/relatorios': 'rh.relatorios.visualizar',
  '/rh/aniversariantes': 'rh.servidores.visualizar',
  '/rh/modelos': 'rh.modelos.visualizar',
  '/rh/exportacao': 'rh.exportar',
  '/rh/pendencias': 'rh.servidores.visualizar',
  
  // ============================================
  // GOVERNANÇA
  // ============================================
  '/governanca': 'governanca.visualizar',
  '/governanca/documentos': 'governanca.documentos.visualizar',
  '/governanca/portarias': 'governanca.portarias.visualizar',
  '/governanca/estrutura': 'governanca.estrutura.visualizar',
  '/governanca/organograma': 'governanca.organograma.visualizar',
  '/governanca/lei-criacao': 'governanca.documentos.visualizar',
  '/governanca/decreto': 'governanca.documentos.visualizar',
  '/governanca/regimento': 'governanca.documentos.visualizar',
  '/governanca/matriz-raci': 'governanca.matriz.visualizar',
  '/governanca/relatorios': 'governanca.relatorios.visualizar',
  
  // ============================================
  // CARGOS E LOTAÇÕES
  // ============================================
  '/cargos': 'governanca.cargos.visualizar',
  '/lotacoes': 'rh.lotacoes.visualizar',
  
  // ============================================
  // FINANCEIRO / FOLHA
  // ============================================
  '/folha': 'financeiro.folha.visualizar',
  '/folha/configuracao': 'financeiro.folha.configurar',
  '/folha/:id': 'financeiro.folha.visualizar',
  
  // ============================================
  // APROVAÇÕES
  // ============================================
  '/admin/aprovacoes': 'aprovacoes.visualizar',
  
  // ============================================
  // ASCOM / COMUNICAÇÃO
  // ============================================
  '/ascom/demandas': 'ascom.demandas.visualizar',
  '/ascom/demandas/nova': 'ascom.demandas.criar',
  '/ascom/demandas/:id': 'ascom.demandas.visualizar',
  
  // ============================================
  // FEDERAÇÕES ESPORTIVAS
  // ============================================
  '/federacoes': 'federacoes.visualizar',
  '/federacoes/nova': 'federacoes.criar',
  '/federacoes/:id': 'federacoes.visualizar',
  '/admin/federacoes/:id': 'federacoes.visualizar',
  
  // ============================================
  // UNIDADES LOCAIS
  // ============================================
  '/unidades-locais': 'unidades.visualizar',
  '/unidades-locais/:id': 'unidades.visualizar',
  '/unidades-locais/cedencias': 'unidades.cedencias.visualizar',
  '/unidades-locais/relatorios': 'unidades.relatorios.visualizar',
  
  // ============================================
  // PROCESSOS ADMINISTRATIVOS
  // ============================================
  '/processos/compras': 'processos.compras.visualizar',
  '/processos/convenios': 'processos.convenios.visualizar',
  '/processos/pagamentos': 'processos.pagamentos.visualizar',
  '/processos/patrimonio': 'processos.patrimonio.visualizar',
  '/processos/almoxarifado': 'processos.almoxarifado.visualizar',
  '/processos/veiculos': 'processos.veiculos.visualizar',
  '/processos/diarias': 'processos.diarias.visualizar',
  
  // ============================================
  // FORMULÁRIOS
  // ============================================
  '/formularios/termo-demanda': 'formularios.visualizar',
  '/formularios/ordem-missao': 'formularios.visualizar',
  '/formularios/relatorio-viagem': 'formularios.visualizar',
  '/formularios/requisicao-material': 'formularios.visualizar',
  '/formularios/termo-responsabilidade': 'formularios.visualizar',
  
  // ============================================
  // PROGRAMAS
  // ============================================
  '/programas/bolsa-atleta': 'programas.visualizar',
  '/programas/juventude-cidada': 'programas.visualizar',
  '/programas/jovem-empreendedor': 'programas.visualizar',
  '/programas/jogos-escolares': 'programas.visualizar',
  '/programas/esporte-comunidade': 'programas.visualizar',
  
  // ============================================
  // PRÉ-CADASTRO / CURRÍCULO
  // ============================================
  '/curriculo': [], // Público
  '/curriculo/sucesso': [], // Público
  '/admin/pre-cadastros': 'rh.precadastros.visualizar',
  '/admin/pre-cadastros/pendencias': 'rh.precadastros.visualizar',
};

// ============================================
// PERMISSÕES PADRÃO POR MÓDULO
// ============================================
// Usado para agrupar permissões por área funcional

export const MODULE_PERMISSIONS = {
  admin: [
    'admin',
    'admin.dashboard',
    'admin.usuarios',
    'admin.usuarios.criar',
    'admin.usuarios.editar',
    'admin.usuarios.excluir',
    'admin.perfis',
    'admin.perfis.gerenciar',
    'admin.auditoria',
    'admin.database',
    'admin.backup',
    'admin.disaster_recovery',
    'admin.segad',
    'admin.reunioes',
    'admin.reunioes.gerenciar',
  ],
  rh: [
    'rh',
    'rh.servidores.visualizar',
    'rh.servidores.criar',
    'rh.servidores.editar',
    'rh.servidores.excluir',
    'rh.portarias.visualizar',
    'rh.portarias.criar',
    'rh.portarias.editar',
    'rh.designacoes.visualizar',
    'rh.designacoes.criar',
    'rh.ferias.visualizar',
    'rh.ferias.gerenciar',
    'rh.licencas.visualizar',
    'rh.licencas.gerenciar',
    'rh.frequencia.visualizar',
    'rh.frequencia.lancar',
    'rh.viagens.visualizar',
    'rh.viagens.gerenciar',
    'rh.lotacoes.visualizar',
    'rh.lotacoes.gerenciar',
    'rh.relatorios.visualizar',
    'rh.exportar',
    'rh.modelos.visualizar',
    'rh.precadastros.visualizar',
    'rh.precadastros.converter',
  ],
  governanca: [
    'governanca.visualizar',
    'governanca.documentos.visualizar',
    'governanca.documentos.criar',
    'governanca.documentos.editar',
    'governanca.portarias.visualizar',
    'governanca.portarias.criar',
    'governanca.portarias.editar',
    'governanca.estrutura.visualizar',
    'governanca.estrutura.editar',
    'governanca.organograma.visualizar',
    'governanca.organograma.editar',
    'governanca.cargos.visualizar',
    'governanca.cargos.gerenciar',
    'governanca.matriz.visualizar',
    'governanca.relatorios.visualizar',
  ],
  financeiro: [
    'financeiro.folha.visualizar',
    'financeiro.folha.processar',
    'financeiro.folha.configurar',
    'financeiro.diarias.visualizar',
    'financeiro.diarias.gerenciar',
    'financeiro.pagamentos.visualizar',
    'financeiro.pagamentos.autorizar',
  ],
  aprovacoes: [
    'aprovacoes.visualizar',
    'aprovacoes.aprovar',
    'aprovacoes.rejeitar',
    'aprovacoes.delegar',
  ],
  ascom: [
    'ascom.demandas.visualizar',
    'ascom.demandas.criar',
    'ascom.demandas.tratar',
    'ascom.demandas.publicar',
  ],
  federacoes: [
    'federacoes.visualizar',
    'federacoes.criar',
    'federacoes.gerenciar',
    'federacoes.relatorios',
  ],
  unidades: [
    'unidades.visualizar',
    'unidades.gerenciar',
    'unidades.cedencias.visualizar',
    'unidades.cedencias.gerenciar',
    'unidades.patrimonio.visualizar',
    'unidades.patrimonio.gerenciar',
    'unidades.relatorios.visualizar',
  ],
  processos: [
    'processos.compras.visualizar',
    'processos.convenios.visualizar',
    'processos.pagamentos.visualizar',
    'processos.patrimonio.visualizar',
    'processos.almoxarifado.visualizar',
    'processos.veiculos.visualizar',
    'processos.diarias.visualizar',
  ],
} as const;

// ============================================
// LABELS DE STATUS
// ============================================

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Submetido',
  in_review: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado'
};

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

export const ACCESS_SCOPE_LABELS: Record<AccessScope, string> = {
  all: 'Tudo',
  org_unit: 'Meu Setor',
  local_unit: 'Minha Unidade',
  own: 'Meus Registros',
  readonly: 'Somente Leitura'
};

// ============================================
// TIPOS LEGADOS (COMPATIBILIDADE)
// ============================================
// @deprecated - Usar PermissionCode em vez de AppPermission
export type AppPermission = string;

export const PERMISSION_LABELS: Record<string, string> = {
  // Labels serão carregados dinamicamente do banco
};

export const PERMISSION_GROUPS = {};

// ============================================
// TIPOS PARA AUDITORIA E APROVAÇÕES
// ============================================

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
  roleAtTime?: string;
  description?: string;
  metadata?: any;
}
