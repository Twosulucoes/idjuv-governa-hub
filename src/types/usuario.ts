// ============================================
// TIPOS DE USUÁRIO DO SISTEMA
// ============================================

export type TipoUsuario = 'servidor' | 'tecnico';

export interface UsuarioSistema {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tipo_usuario: TipoUsuario;
  is_active: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  cpf: string | null;
  servidor_id: string | null;
  requires_password_change: boolean;
  created_at: string;
  updated_at: string;
  
  // Dados do servidor vinculado (quando tipo_usuario = 'servidor')
  servidor?: {
    nome_completo: string;
    matricula: string | null;
    situacao: string;
    vinculo: string;
    cargo_nome?: string;
    unidade_nome?: string;
  };
  
  // Role do usuário
  role?: string;
}

export const TIPO_USUARIO_LABELS: Record<TipoUsuario, string> = {
  servidor: 'Usuário-Servidor',
  tecnico: 'Usuário Técnico'
};

export const TIPO_USUARIO_DESCRIPTIONS: Record<TipoUsuario, string> = {
  servidor: 'Vinculado a um cadastro de servidor público do IDJuv',
  tecnico: 'Usuário técnico para manutenção e suporte do sistema'
};
