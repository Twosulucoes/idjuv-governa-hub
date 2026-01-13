// Utilitários de formatação de inputs - Padrão IDJUV
// Máscaras e conversão para maiúsculas

// ========================================
// MÁSCARAS DE FORMATAÇÃO
// ========================================

export const formatCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

export const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    // Fixo: (00) 0000-0000
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  // Celular: (00) 00000-0000
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

export const formatCEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export const formatPISPASEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{5})(\d)/, '$1.$2')
    .replace(/(\d{2})(\d{1})/, '$1-$2')
    .slice(0, 14);
};

export const formatRG = (value: string): string => {
  // Formato flexível para RG (aceita letras no final)
  const cleaned = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (cleaned.length <= 9) {
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .slice(0, 12);
  }
  return cleaned.slice(0, 12);
};

export const formatAgencia = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 6);
};

export const formatContaBancaria = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 1) {
    return digits.slice(0, -1) + '-' + digits.slice(-1);
  }
  return digits;
};

export const formatTituloEleitor = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .slice(0, 14);
};

// ========================================
// REMOVER FORMATAÇÃO
// ========================================

export const unmaskValue = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const unmaskCPF = unmaskValue;
export const unmaskTelefone = unmaskValue;
export const unmaskCEP = unmaskValue;
export const unmaskPISPASEP = unmaskValue;

// ========================================
// CONVERSÃO PARA MAIÚSCULAS
// ========================================

export const toUpperCase = (value: string): string => {
  return value.toUpperCase();
};

// ========================================
// FORMATAÇÃO DE DATAS
// ========================================

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY
 * Corrige o problema de fuso horário ao converter datas YYYY-MM-DD
 */
export const formatDateBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  
  // Se já contém 'T', é timestamp ISO completo - usar conversão normal
  if (dateStr.includes('T')) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }
  
  // Formato YYYY-MM-DD - converter diretamente para DD/MM/YYYY
  // Evita problema de fuso horário do new Date()
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr.split('-').reverse().join('/');
  }
  
  // Fallback para outros formatos
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

// ========================================
// VALIDAÇÕES
// ========================================

export const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
};

export const isValidCEP = (cep: string): boolean => {
  const digits = cep.replace(/\D/g, '');
  return digits.length === 8;
};

export const isValidTelefone = (telefone: string): boolean => {
  const digits = telefone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

// ========================================
// MAPEAMENTO DE MÁSCARAS
// ========================================

export type MaskType = 'cpf' | 'telefone' | 'cep' | 'pis' | 'rg' | 'agencia' | 'conta' | 'titulo_eleitor';

export const MASK_FORMATTERS: Record<MaskType, (value: string) => string> = {
  cpf: formatCPF,
  telefone: formatTelefone,
  cep: formatCEP,
  pis: formatPISPASEP,
  rg: formatRG,
  agencia: formatAgencia,
  conta: formatContaBancaria,
  titulo_eleitor: formatTituloEleitor,
};

export const MASK_PLACEHOLDERS: Record<MaskType, string> = {
  cpf: '000.000.000-00',
  telefone: '(00) 00000-0000',
  cep: '00000-000',
  pis: '000.00000.00-0',
  rg: '00.000.000',
  agencia: '0000',
  conta: '00000-0',
  titulo_eleitor: '0000 0000 0000',
};
