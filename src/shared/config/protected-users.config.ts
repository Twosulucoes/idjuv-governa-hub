// ============================================
// CONFIGURAÇÃO DE USUÁRIOS PROTEGIDOS
// ============================================
// Define quais usuários não podem ter suas permissões alteradas

/**
 * ID do Super Admin principal do sistema
 * Este usuário é o único que não pode ter suas permissões alteradas
 */
export const PROTECTED_SUPER_ADMIN_ID = 'b53e0eea-bf59-4de9-b71e-5d36d3c69bb8';

/**
 * Email do Super Admin principal (para referência)
 */
export const PROTECTED_SUPER_ADMIN_EMAIL = 'handfabiano@gmail.com';

/**
 * Verifica se um usuário é o Super Admin protegido
 */
export function isProtectedAdmin(userId: string): boolean {
  return userId === PROTECTED_SUPER_ADMIN_ID;
}
