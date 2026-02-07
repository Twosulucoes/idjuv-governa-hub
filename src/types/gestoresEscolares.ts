/**
 * Tipos e constantes para o Sistema de Credenciamento de Gestores Escolares
 * Jogos Escolares de Roraima
 */

// =====================================================
// Tipos de Status
// =====================================================

export type StatusGestor = 
  | 'aguardando' 
  | 'em_processamento' 
  | 'cadastrado_cbde' 
  | 'contato_realizado' 
  | 'confirmado' 
  | 'problema';

export const STATUS_GESTOR_CONFIG: Record<StatusGestor, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  proximoPasso: string;
}> = {
  aguardando: {
    label: 'Aguardando',
    description: 'Seu pré-cadastro foi recebido e está aguardando processamento pela equipe IDJuv.',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    proximoPasso: 'A equipe IDJuv irá cadastrar você no sistema CBDE em breve.',
  },
  em_processamento: {
    label: 'Em Processamento',
    description: 'Seu cadastro está sendo processado por um membro da equipe IDJuv.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    proximoPasso: 'Aguarde o cadastro no sistema CBDE.',
  },
  cadastrado_cbde: {
    label: 'Cadastrado no CBDE',
    description: 'Você foi cadastrado no sistema CBDE. Um email foi enviado para você com as instruções de acesso.',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    proximoPasso: 'Verifique seu email e teste o acesso ao sistema CBDE. A equipe entrará em contato para confirmar.',
  },
  contato_realizado: {
    label: 'Contato Realizado',
    description: 'A equipe IDJuv entrou em contato com você para confirmar o recebimento do email do CBDE.',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    proximoPasso: 'Teste seu acesso ao sistema CBDE e confirme com a equipe.',
  },
  confirmado: {
    label: 'Confirmado',
    description: 'Seu acesso ao sistema CBDE foi confirmado! Você está credenciado para os Jogos Escolares.',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    proximoPasso: 'Processo concluído. Você pode acessar o sistema CBDE normalmente.',
  },
  problema: {
    label: 'Problema',
    description: 'Houve um problema com seu cadastro. Entre em contato com a equipe IDJuv.',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    proximoPasso: 'Entre em contato com a equipe IDJuv pelo telefone (95) 3621-3232.',
  },
};

export const STATUS_OPTIONS = Object.entries(STATUS_GESTOR_CONFIG).map(([value, config]) => ({
  value: value as StatusGestor,
  label: config.label,
}));

// =====================================================
// Interfaces
// =====================================================

export interface EscolaJer {
  id: string;
  nome: string;
  municipio: string | null;
  inep: string | null;
  ja_cadastrada: boolean;
  created_at: string;
  updated_at: string;
}

export interface GestorEscolar {
  id: string;
  escola_id: string;
  nome: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string | null;
  email: string;
  celular: string;
  endereco: string | null;
  status: StatusGestor;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
  contato_realizado: boolean;
  acesso_testado: boolean;
  data_cadastro_cbde: string | null;
  data_contato: string | null;
  data_confirmacao: string | null;
  created_at: string;
  updated_at: string;
  // Join
  escola?: EscolaJer;
}

export interface GestorFormData {
  escola_id: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento?: string;
  email: string;
  celular: string;
  endereco?: string;
}

export interface EscolaImportData {
  nome: string;
  municipio?: string;
  inep?: string;
}

// =====================================================
// Métricas
// =====================================================

export interface MetricasCredenciamento {
  total: number;
  aguardando: number;
  em_processamento: number;
  cadastrado_cbde: number;
  contato_realizado: number;
  confirmado: number;
  problema: number;
  percentualConcluido: number;
}

// =====================================================
// Helpers
// =====================================================

export const calcularMetricas = (gestores: GestorEscolar[]): MetricasCredenciamento => {
  const contagem = {
    aguardando: 0,
    em_processamento: 0,
    cadastrado_cbde: 0,
    contato_realizado: 0,
    confirmado: 0,
    problema: 0,
  };

  gestores.forEach((g) => {
    if (g.status in contagem) {
      contagem[g.status as keyof typeof contagem]++;
    }
  });

  const total = gestores.length;
  const percentualConcluido = total > 0 ? Math.round((contagem.confirmado / total) * 100) : 0;

  return {
    total,
    ...contagem,
    percentualConcluido,
  };
};

export const formatarCPF = (cpf: string): string => {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarCelular = (celular: string): string => {
  const numeros = celular.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

export const validarCPF = (cpf: string): boolean => {
  const numeros = cpf.replace(/\D/g, '');
  
  if (numeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10))) return false;
  
  return true;
};
