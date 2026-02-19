// ============================================
// EXPORTAÇÕES DOS COMPONENTES DE AUTH — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: Exportações completas de todos os componentes e helpers.

export { ProtectedRoute } from './ProtectedRoute';
export { default as RequireAuthOrRedirect } from './RequireAuthOrRedirect';
export {
  PermissionGate,
  SuperAdminOnly,
  AuthenticatedOnly,
  GuestOnly,
  CanView,
  CanCreate,
  CanEdit,
  CanDelete,
  // Retrocompatibilidade
  AdminOnly,
  ManagerOnly,
} from './PermissionGate';
export { DisabledWithPermission } from './DisabledWithPermission';
export { UserMenu } from './UserMenu';
