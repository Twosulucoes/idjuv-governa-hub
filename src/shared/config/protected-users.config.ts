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
 * Email do Super Admin principal — usado como fallback de identificação
 * (ver isProtectedAdmin) além de referência.
 */
export const PROTECTED_SUPER_ADMIN_EMAIL = 'handfabiano@gmail.com';

/**
 * Verifica se um usuário é o Super Admin protegido.
 *
 * Checa por UUID (auth.users.id) e por e-mail. O UUID muda ao trocar de
 * projeto Supabase (Lovable Cloud hoje, instância própria depois) mesmo
 * sendo a mesma pessoa — sem o fallback por e-mail, essa proteção pararia
 * de reconhecer o super admin silenciosamente após a migração, e outro
 * admin poderia alterar/remover as próprias permissões dele pelo painel
 * sem aviso algum. Ao migrar, ainda é recomendado atualizar
 * PROTECTED_SUPER_ADMIN_ID para o novo UUID (defesa em profundidade), mas
 * o sistema não fica exposto nesse intervalo.
 */
export function isProtectedAdmin(userId: string, email?: string | null): boolean {
  if (userId === PROTECTED_SUPER_ADMIN_ID) return true;
  return !!email && email.toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL.toLowerCase();
}
