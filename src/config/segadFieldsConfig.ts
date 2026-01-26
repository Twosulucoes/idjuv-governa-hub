// ============================================
// CONFIGURAÇÃO DE CAMPOS SEGAD - Mapeamento de Coordenadas
// ============================================

export interface CampoSegad {
  id: string;
  label: string;
  pagina: number;
  tipo: 'texto' | 'checkbox' | 'data';
  x: number;
  y: number;
  maxWidth?: number;
  campo?: string;
  valorFixo?: string;
}

// Chave para localStorage
const STORAGE_KEY = 'segad_fields_config';

// =============================================
// PÁGINA 1 - DADOS DE IDENTIFICAÇÃO, DOCUMENTAÇÃO, ESCOLARIDADE, DADOS FUNCIONAIS
// =============================================
export const CAMPOS_PAGINA_1: CampoSegad[] = [
  // === DADOS DE IDENTIFICAÇÃO ===
  { id: 'nome_completo', label: 'Nome Completo', pagina: 1, tipo: 'texto', x: 22, y: 56, maxWidth: 85, campo: 'nome_completo' },
  { id: 'sexo_m', label: 'Sexo M', pagina: 1, tipo: 'checkbox', x: 184, y: 56 },
  { id: 'sexo_f', label: 'Sexo F', pagina: 1, tipo: 'checkbox', x: 195, y: 56 },
  { id: 'estado_civil', label: 'Estado Civil', pagina: 1, tipo: 'texto', x: 50, y: 63, maxWidth: 38, campo: 'estado_civil' },
  { id: 'raca_cor', label: 'Raça/Cor', pagina: 1, tipo: 'texto', x: 115, y: 63, maxWidth: 28, campo: 'raca_cor' },
  { id: 'pcd_sim', label: 'PCD SIM', pagina: 1, tipo: 'checkbox', x: 175, y: 63 },
  { id: 'pcd_nao', label: 'PCD NÃO', pagina: 1, tipo: 'checkbox', x: 197, y: 63 },
  { id: 'nacionalidade', label: 'Nacionalidade', pagina: 1, tipo: 'texto', x: 50, y: 70, maxWidth: 55, campo: 'nacionalidade' },
  { id: 'pcd_tipo', label: 'Tipo PCD', pagina: 1, tipo: 'texto', x: 160, y: 70, maxWidth: 35, campo: 'pcd_tipo' },
  { id: 'naturalidade', label: 'Naturalidade', pagina: 1, tipo: 'texto', x: 50, y: 77, maxWidth: 55, campo: 'naturalidade' },
  { id: 'molestia_sim', label: 'Moléstia SIM', pagina: 1, tipo: 'checkbox', x: 186, y: 77 },
  { id: 'molestia_nao', label: 'Moléstia NÃO', pagina: 1, tipo: 'checkbox', x: 202, y: 77 },
  { id: 'data_nascimento', label: 'Data Nascimento', pagina: 1, tipo: 'data', x: 60, y: 84, campo: 'data_nascimento' },
  { id: 'tipo_sanguineo', label: 'Tipo Sanguíneo', pagina: 1, tipo: 'texto', x: 157, y: 84, maxWidth: 20, campo: 'tipo_sanguineo' },
  { id: 'nome_mae', label: 'Nome da Mãe', pagina: 1, tipo: 'texto', x: 45, y: 91, maxWidth: 60, campo: 'nome_mae' },
  { id: 'nome_pai', label: 'Nome do Pai', pagina: 1, tipo: 'texto', x: 145, y: 91, maxWidth: 52, campo: 'nome_pai' },

  // === DOCUMENTAÇÃO ===
  { id: 'cpf', label: 'CPF', pagina: 1, tipo: 'texto', x: 22, y: 112, maxWidth: 40, campo: 'cpf' },
  { id: 'pis_pasep', label: 'PIS/PASEP', pagina: 1, tipo: 'texto', x: 115, y: 112, maxWidth: 40, campo: 'pis_pasep' },
  { id: 'rg', label: 'RG', pagina: 1, tipo: 'texto', x: 55, y: 120, maxWidth: 35, campo: 'rg' },
  { id: 'rg_orgao_uf', label: 'Órgão/UF RG', pagina: 1, tipo: 'texto', x: 135, y: 120, maxWidth: 25, campo: 'rg_orgao_uf' },
  { id: 'rg_data_emissao', label: 'Data Emissão RG', pagina: 1, tipo: 'data', x: 178, y: 120, campo: 'rg_data_emissao' },
  { id: 'reservista', label: 'Reservista', pagina: 1, tipo: 'texto', x: 55, y: 128, maxWidth: 35, campo: 'certificado_reservista' },
  { id: 'reservista_orgao', label: 'Órgão Reservista', pagina: 1, tipo: 'texto', x: 135, y: 128, maxWidth: 25, campo: 'reservista_orgao' },
  { id: 'reservista_data', label: 'Data Reservista', pagina: 1, tipo: 'data', x: 178, y: 128, campo: 'reservista_data_emissao' },
  { id: 'reservista_categoria', label: 'Categoria Reserva', pagina: 1, tipo: 'texto', x: 55, y: 136, maxWidth: 40, campo: 'reservista_categoria' },
  { id: 'reservista_ano', label: 'Ano Reserva', pagina: 1, tipo: 'texto', x: 178, y: 136, maxWidth: 20, campo: 'reservista_ano' },
  { id: 'titulo_eleitor', label: 'Título Eleitor', pagina: 1, tipo: 'texto', x: 55, y: 144, maxWidth: 35, campo: 'titulo_eleitor' },
  { id: 'titulo_secao', label: 'Seção', pagina: 1, tipo: 'texto', x: 120, y: 144, maxWidth: 15, campo: 'titulo_secao' },
  { id: 'titulo_zona', label: 'Zona', pagina: 1, tipo: 'texto', x: 150, y: 144, maxWidth: 15, campo: 'titulo_zona' },
  { id: 'titulo_data', label: 'Data Título', pagina: 1, tipo: 'data', x: 178, y: 144, campo: 'titulo_data_emissao' },
  { id: 'titulo_cidade', label: 'Cidade Votação', pagina: 1, tipo: 'texto', x: 50, y: 152, maxWidth: 40, campo: 'titulo_cidade_votacao' },
  { id: 'titulo_uf', label: 'UF Votação', pagina: 1, tipo: 'texto', x: 178, y: 152, maxWidth: 10, campo: 'titulo_uf_votacao' },
  { id: 'ctps_numero', label: 'CTPS Número', pagina: 1, tipo: 'texto', x: 55, y: 160, maxWidth: 30, campo: 'ctps_numero' },
  { id: 'ctps_serie', label: 'CTPS Série', pagina: 1, tipo: 'texto', x: 120, y: 160, maxWidth: 15, campo: 'ctps_serie' },
  { id: 'ctps_uf', label: 'CTPS UF', pagina: 1, tipo: 'texto', x: 150, y: 160, maxWidth: 10, campo: 'ctps_uf' },
  { id: 'ctps_data', label: 'Data CTPS', pagina: 1, tipo: 'data', x: 178, y: 160, campo: 'ctps_data_emissao' },

  // === ESCOLARIDADE ===
  { id: 'escolaridade', label: 'Grau de Instrução', pagina: 1, tipo: 'texto', x: 68, y: 175, maxWidth: 50, campo: 'escolaridade' },
  { id: 'formacao', label: 'Curso', pagina: 1, tipo: 'texto', x: 32, y: 183, maxWidth: 65, campo: 'formacao_academica' },
  { id: 'instituicao', label: 'Instituição', pagina: 1, tipo: 'texto', x: 130, y: 183, maxWidth: 60, campo: 'instituicao_ensino' },

  // === DADOS FUNCIONAIS ===
  { id: 'ocupa_vaga_pcd_sim', label: 'Ocupa Vaga PCD SIM', pagina: 1, tipo: 'checkbox', x: 186, y: 198 },
  { id: 'ocupa_vaga_pcd_nao', label: 'Ocupa Vaga PCD NÃO', pagina: 1, tipo: 'checkbox', x: 202, y: 198 },
  { id: 'lotacao', label: 'Lotação Atual', pagina: 1, tipo: 'texto', x: 50, y: 206, maxWidth: 55, campo: 'lotacao' },
  { id: 'cargo', label: 'Cargo/Função', pagina: 1, tipo: 'texto', x: 130, y: 206, maxWidth: 55, campo: 'cargo' },
  { id: 'codigo_cargo', label: 'Código Cargo', pagina: 1, tipo: 'texto', x: 165, y: 214, maxWidth: 30, campo: 'codigo_cargo' },
  { id: 'quadro_efetivo_sim', label: 'Quadro Efetivo SIM', pagina: 1, tipo: 'checkbox', x: 38, y: 222 },
  { id: 'quadro_efetivo_nao', label: 'Quadro Efetivo NÃO', pagina: 1, tipo: 'checkbox', x: 55, y: 222 },
  { id: 'matricula', label: 'Matrícula', pagina: 1, tipo: 'texto', x: 120, y: 218, maxWidth: 30, campo: 'matricula' },
  { id: 'servidor_federal_sim', label: 'Servidor Federal SIM', pagina: 1, tipo: 'checkbox', x: 95, y: 230 },
  { id: 'servidor_federal_nao', label: 'Servidor Federal NÃO', pagina: 1, tipo: 'checkbox', x: 115, y: 230 },

  // === CNH ===
  { id: 'cnh_numero', label: 'CNH Número', pagina: 1, tipo: 'texto', x: 35, y: 246, maxWidth: 35, campo: 'cnh_numero' },
  { id: 'cnh_validade', label: 'CNH Validade', pagina: 1, tipo: 'data', x: 90, y: 246, campo: 'cnh_validade' },
  { id: 'cnh_expedicao', label: 'CNH Expedição', pagina: 1, tipo: 'data', x: 145, y: 246, campo: 'cnh_data_expedicao' },
  { id: 'cnh_uf', label: 'CNH UF', pagina: 1, tipo: 'texto', x: 188, y: 246, maxWidth: 10, campo: 'cnh_uf' },
  { id: 'cnh_primeira_hab', label: 'Primeira Habilitação', pagina: 1, tipo: 'data', x: 60, y: 254, campo: 'cnh_primeira_habilitacao' },
  { id: 'cnh_categoria', label: 'Categoria CNH', pagina: 1, tipo: 'texto', x: 135, y: 254, maxWidth: 15, campo: 'cnh_categoria' },
];

// =============================================
// PÁGINA 2 - ESTRANGEIROS, ENDEREÇO, DADOS BANCÁRIOS
// =============================================
export const CAMPOS_PAGINA_2: CampoSegad[] = [
  // === ENDEREÇO E CONTATOS ===
  { id: 'cep', label: 'CEP', pagina: 2, tipo: 'texto', x: 22, y: 78, maxWidth: 25, campo: 'endereco_cep' },
  { id: 'logradouro', label: 'Logradouro', pagina: 2, tipo: 'texto', x: 68, y: 78, maxWidth: 110, campo: 'endereco_logradouro' },
  { id: 'numero', label: 'Número', pagina: 2, tipo: 'texto', x: 36, y: 86, maxWidth: 15, campo: 'endereco_numero' },
  { id: 'bairro', label: 'Bairro', pagina: 2, tipo: 'texto', x: 65, y: 86, maxWidth: 45, campo: 'endereco_bairro' },
  { id: 'municipio', label: 'Município', pagina: 2, tipo: 'texto', x: 145, y: 86, maxWidth: 40, campo: 'endereco_cidade' },
  { id: 'complemento', label: 'Complemento', pagina: 2, tipo: 'texto', x: 50, y: 94, maxWidth: 80, campo: 'endereco_complemento' },
  { id: 'estado_uf', label: 'UF', pagina: 2, tipo: 'texto', x: 175, y: 94, maxWidth: 10, campo: 'endereco_uf' },
  { id: 'celular', label: 'Celular', pagina: 2, tipo: 'texto', x: 50, y: 102, maxWidth: 40, campo: 'telefone_celular' },
  { id: 'email', label: 'E-mail', pagina: 2, tipo: 'texto', x: 100, y: 102, maxWidth: 85, campo: 'email_pessoal' },

  // === DADOS BANCÁRIOS ===
  { id: 'banco_codigo', label: 'Código Banco', pagina: 2, tipo: 'texto', x: 52, y: 123, maxWidth: 20, campo: 'banco_codigo' },
  { id: 'banco_nome', label: 'Nome Banco', pagina: 2, tipo: 'texto', x: 95, y: 123, maxWidth: 85, campo: 'banco_nome' },
  { id: 'banco_agencia', label: 'Agência', pagina: 2, tipo: 'texto', x: 36, y: 131, maxWidth: 25, campo: 'banco_agencia' },
  { id: 'banco_conta', label: 'Conta Corrente', pagina: 2, tipo: 'texto', x: 95, y: 131, maxWidth: 40, campo: 'banco_conta' },
  
  // === DATA E LOCAL ===
  { id: 'data_local_p2', label: 'Data e Local', pagina: 2, tipo: 'texto', x: 28, y: 152, maxWidth: 100 },
];

// =============================================
// PÁGINA 3 - DECLARAÇÃO DE GRAU DE PARENTESCO
// =============================================
export const CAMPOS_PAGINA_3: CampoSegad[] = [
  { id: 'nome_p3', label: 'Nome', pagina: 3, tipo: 'texto', x: 20, y: 28, maxWidth: 95, campo: 'nome_completo' },
  { id: 'cpf_p3', label: 'CPF', pagina: 3, tipo: 'texto', x: 155, y: 28, maxWidth: 40, campo: 'cpf' },
  { id: 'parentesco_nao', label: 'Não possui parentesco', pagina: 3, tipo: 'checkbox', x: 40, y: 97 },
  { id: 'data_local_p3', label: 'Data e Local', pagina: 3, tipo: 'texto', x: 20, y: 190, maxWidth: 100 },
];

// =============================================
// PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
// =============================================
export const CAMPOS_PAGINA_4: CampoSegad[] = [
  { id: 'nome_p4', label: 'Nome', pagina: 4, tipo: 'texto', x: 20, y: 28, maxWidth: 130, campo: 'nome_completo' },
  { id: 'cpf_p4', label: 'CPF', pagina: 4, tipo: 'texto', x: 20, y: 36, maxWidth: 40, campo: 'cpf' },
  { id: 'cargo_p4', label: 'Cargo', pagina: 4, tipo: 'texto', x: 50, y: 44, maxWidth: 120, campo: 'cargo' },
  { id: 'nao_acumula', label: 'Não acumula', pagina: 4, tipo: 'checkbox', x: 15, y: 58 },
  { id: 'data_local_p4', label: 'Data e Local', pagina: 4, tipo: 'texto', x: 20, y: 185, maxWidth: 100 },
];

// =============================================
// PÁGINA 5 - DECLARAÇÃO DE BENS DO SERVIDOR
// =============================================
export const CAMPOS_PAGINA_5: CampoSegad[] = [
  { id: 'nome_p5', label: 'Nome', pagina: 5, tipo: 'texto', x: 20, y: 28, maxWidth: 130, campo: 'nome_completo' },
  { id: 'cpf_p5', label: 'CPF', pagina: 5, tipo: 'texto', x: 20, y: 36, maxWidth: 40, campo: 'cpf' },
  { id: 'cargo_p5', label: 'Cargo', pagina: 5, tipo: 'texto', x: 50, y: 44, maxWidth: 120, campo: 'cargo' },
  { id: 'nao_possui_bens', label: 'Não possui bens', pagina: 5, tipo: 'checkbox', x: 70, y: 52 },
  { id: 'data_local_p5', label: 'Data e Local', pagina: 5, tipo: 'texto', x: 20, y: 185, maxWidth: 100 },
];

// =============================================
// PÁGINA 6 - DECLARAÇÃO DE BENS DO CÔNJUGE
// =============================================
export const CAMPOS_PAGINA_6: CampoSegad[] = [
  { id: 'nome_p6', label: 'Nome', pagina: 6, tipo: 'texto', x: 20, y: 28, maxWidth: 95, campo: 'nome_completo' },
  { id: 'cpf_p6', label: 'CPF', pagina: 6, tipo: 'texto', x: 20, y: 36, maxWidth: 40, campo: 'cpf' },
  { id: 'cargo_p6', label: 'Cargo', pagina: 6, tipo: 'texto', x: 65, y: 36, maxWidth: 90, campo: 'cargo' },
  { id: 'nao_possui_bens_conjuge', label: 'Não possui bens cônjuge', pagina: 6, tipo: 'checkbox', x: 90, y: 52 },
  { id: 'nao_possui_conjuge', label: 'Não possui cônjuge', pagina: 6, tipo: 'checkbox', x: 155, y: 52 },
  { id: 'data_local_p6', label: 'Data e Local', pagina: 6, tipo: 'texto', x: 20, y: 185, maxWidth: 100 },
];

// =============================================
// PÁGINA 7 - DECLARAÇÃO DE DEPENDENTES
// =============================================
export const CAMPOS_PAGINA_7: CampoSegad[] = [
  { id: 'nome_p7', label: 'Nome', pagina: 7, tipo: 'texto', x: 20, y: 28, maxWidth: 95, campo: 'nome_completo' },
  { id: 'cpf_p7', label: 'CPF', pagina: 7, tipo: 'texto', x: 20, y: 36, maxWidth: 40, campo: 'cpf' },
  { id: 'cargo_p7', label: 'Cargo', pagina: 7, tipo: 'texto', x: 50, y: 44, maxWidth: 120, campo: 'cargo' },
  { id: 'possui_dependentes', label: 'Possui dependentes', pagina: 7, tipo: 'checkbox', x: 15, y: 52 },
  { id: 'nao_possui_dependentes', label: 'Não possui dependentes', pagina: 7, tipo: 'checkbox', x: 70, y: 52 },
  // Linhas de dependentes
  { id: 'dep_1_nome', label: 'Dependente 1 Nome', pagina: 7, tipo: 'texto', x: 35, y: 60, maxWidth: 70 },
  { id: 'dep_1_cpf', label: 'Dependente 1 CPF', pagina: 7, tipo: 'texto', x: 125, y: 60, maxWidth: 35 },
  { id: 'dep_1_data', label: 'Dependente 1 Data', pagina: 7, tipo: 'texto', x: 165, y: 60, maxWidth: 30 },
  { id: 'dep_2_nome', label: 'Dependente 2 Nome', pagina: 7, tipo: 'texto', x: 35, y: 68, maxWidth: 70 },
  { id: 'dep_2_cpf', label: 'Dependente 2 CPF', pagina: 7, tipo: 'texto', x: 125, y: 68, maxWidth: 35 },
  { id: 'dep_2_data', label: 'Dependente 2 Data', pagina: 7, tipo: 'texto', x: 165, y: 68, maxWidth: 30 },
  { id: 'dep_3_nome', label: 'Dependente 3 Nome', pagina: 7, tipo: 'texto', x: 35, y: 76, maxWidth: 70 },
  { id: 'dep_3_cpf', label: 'Dependente 3 CPF', pagina: 7, tipo: 'texto', x: 125, y: 76, maxWidth: 35 },
  { id: 'dep_3_data', label: 'Dependente 3 Data', pagina: 7, tipo: 'texto', x: 165, y: 76, maxWidth: 30 },
  { id: 'dep_4_nome', label: 'Dependente 4 Nome', pagina: 7, tipo: 'texto', x: 35, y: 84, maxWidth: 70 },
  { id: 'dep_4_cpf', label: 'Dependente 4 CPF', pagina: 7, tipo: 'texto', x: 125, y: 84, maxWidth: 35 },
  { id: 'dep_4_data', label: 'Dependente 4 Data', pagina: 7, tipo: 'texto', x: 165, y: 84, maxWidth: 30 },
  { id: 'data_local_p7', label: 'Data e Local', pagina: 7, tipo: 'texto', x: 20, y: 250, maxWidth: 100 },
];

// Combinar todos os campos
export const TODOS_CAMPOS: CampoSegad[] = [
  ...CAMPOS_PAGINA_1,
  ...CAMPOS_PAGINA_2,
  ...CAMPOS_PAGINA_3,
  ...CAMPOS_PAGINA_4,
  ...CAMPOS_PAGINA_5,
  ...CAMPOS_PAGINA_6,
  ...CAMPOS_PAGINA_7,
];

// Funções para gerenciar configuração
export function salvarConfiguracao(campos: CampoSegad[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campos));
  } catch (e) {
    console.error('Erro ao salvar configuração SEGAD:', e);
  }
}

export function carregarConfiguracao(): CampoSegad[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar configuração SEGAD:', e);
  }
  return TODOS_CAMPOS;
}

export function resetarConfiguracao(): CampoSegad[] {
  localStorage.removeItem(STORAGE_KEY);
  return TODOS_CAMPOS;
}

export function exportarConfiguracao(): string {
  const config = carregarConfiguracao();
  return JSON.stringify(config, null, 2);
}

export function importarConfiguracao(json: string): CampoSegad[] | null {
  try {
    const config = JSON.parse(json) as CampoSegad[];
    if (Array.isArray(config) && config.length > 0 && config[0].id) {
      salvarConfiguracao(config);
      return config;
    }
  } catch (e) {
    console.error('Erro ao importar configuração:', e);
  }
  return null;
}

export function getCamposPorPagina(pagina: number): CampoSegad[] {
  return carregarConfiguracao().filter(c => c.pagina === pagina);
}

export function atualizarCampo(id: string, updates: Partial<CampoSegad>): CampoSegad[] {
  const campos = carregarConfiguracao();
  const index = campos.findIndex(c => c.id === id);
  if (index >= 0) {
    campos[index] = { ...campos[index], ...updates };
    salvarConfiguracao(campos);
  }
  return campos;
}
