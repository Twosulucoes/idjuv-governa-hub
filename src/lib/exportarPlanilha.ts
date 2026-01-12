import * as XLSX from 'xlsx';

export interface CampoExportacao {
  id: string;
  label: string;
  categoria: string;
  getValue: (servidor: any) => string | number | null;
}

// Definição de todos os campos disponíveis para exportação
export const CAMPOS_EXPORTACAO: CampoExportacao[] = [
  // Dados Pessoais
  { id: 'nome_completo', label: 'Nome Completo', categoria: 'Dados Pessoais', getValue: (s) => s.nome_completo },
  { id: 'nome_social', label: 'Nome Social', categoria: 'Dados Pessoais', getValue: (s) => s.nome_social },
  { id: 'cpf', label: 'CPF', categoria: 'Dados Pessoais', getValue: (s) => s.cpf },
  { id: 'rg_numero', label: 'RG - Número', categoria: 'Dados Pessoais', getValue: (s) => s.rg_numero },
  { id: 'rg_orgao', label: 'RG - Órgão Emissor', categoria: 'Dados Pessoais', getValue: (s) => s.rg_orgao },
  { id: 'rg_uf', label: 'RG - UF', categoria: 'Dados Pessoais', getValue: (s) => s.rg_uf },
  { id: 'rg_data_emissao', label: 'RG - Data Emissão', categoria: 'Dados Pessoais', getValue: (s) => formatDate(s.rg_data_emissao) },
  { id: 'data_nascimento', label: 'Data de Nascimento', categoria: 'Dados Pessoais', getValue: (s) => formatDate(s.data_nascimento) },
  { id: 'sexo', label: 'Sexo', categoria: 'Dados Pessoais', getValue: (s) => s.sexo === 'M' ? 'Masculino' : s.sexo === 'F' ? 'Feminino' : s.sexo },
  { id: 'estado_civil', label: 'Estado Civil', categoria: 'Dados Pessoais', getValue: (s) => s.estado_civil },
  { id: 'nacionalidade', label: 'Nacionalidade', categoria: 'Dados Pessoais', getValue: (s) => s.nacionalidade },
  { id: 'naturalidade_cidade', label: 'Naturalidade - Cidade', categoria: 'Dados Pessoais', getValue: (s) => s.naturalidade_cidade },
  { id: 'naturalidade_uf', label: 'Naturalidade - UF', categoria: 'Dados Pessoais', getValue: (s) => s.naturalidade_uf },
  
  // Documentos
  { id: 'titulo_eleitor', label: 'Título de Eleitor', categoria: 'Documentos', getValue: (s) => s.titulo_eleitor },
  { id: 'titulo_zona', label: 'Título - Zona', categoria: 'Documentos', getValue: (s) => s.titulo_zona },
  { id: 'titulo_secao', label: 'Título - Seção', categoria: 'Documentos', getValue: (s) => s.titulo_secao },
  { id: 'pis_pasep', label: 'PIS/PASEP', categoria: 'Documentos', getValue: (s) => s.pis_pasep },
  { id: 'ctps_numero', label: 'CTPS - Número', categoria: 'Documentos', getValue: (s) => s.ctps_numero },
  { id: 'ctps_serie', label: 'CTPS - Série', categoria: 'Documentos', getValue: (s) => s.ctps_serie },
  { id: 'ctps_uf', label: 'CTPS - UF', categoria: 'Documentos', getValue: (s) => s.ctps_uf },
  { id: 'cnh_numero', label: 'CNH - Número', categoria: 'Documentos', getValue: (s) => s.cnh_numero },
  { id: 'cnh_categoria', label: 'CNH - Categoria', categoria: 'Documentos', getValue: (s) => s.cnh_categoria },
  { id: 'cnh_validade', label: 'CNH - Validade', categoria: 'Documentos', getValue: (s) => formatDate(s.cnh_validade) },
  { id: 'certificado_reservista', label: 'Certificado Reservista', categoria: 'Documentos', getValue: (s) => s.certificado_reservista },
  
  // Contato
  { id: 'email', label: 'E-mail Pessoal', categoria: 'Contato', getValue: (s) => s.email },
  { id: 'email_institucional', label: 'E-mail Institucional', categoria: 'Contato', getValue: (s) => s.email_institucional },
  { id: 'telefone_fixo', label: 'Telefone Fixo', categoria: 'Contato', getValue: (s) => s.telefone_fixo },
  { id: 'telefone_celular', label: 'Telefone Celular', categoria: 'Contato', getValue: (s) => s.telefone_celular },
  { id: 'contato_emergencia_nome', label: 'Contato Emergência - Nome', categoria: 'Contato', getValue: (s) => s.contato_emergencia_nome },
  { id: 'contato_emergencia_parentesco', label: 'Contato Emergência - Parentesco', categoria: 'Contato', getValue: (s) => s.contato_emergencia_parentesco },
  { id: 'contato_emergencia_telefone', label: 'Contato Emergência - Telefone', categoria: 'Contato', getValue: (s) => s.contato_emergencia_telefone },
  
  // Endereço
  { id: 'endereco_logradouro', label: 'Logradouro', categoria: 'Endereço', getValue: (s) => s.endereco_logradouro },
  { id: 'endereco_numero', label: 'Número', categoria: 'Endereço', getValue: (s) => s.endereco_numero },
  { id: 'endereco_complemento', label: 'Complemento', categoria: 'Endereço', getValue: (s) => s.endereco_complemento },
  { id: 'endereco_bairro', label: 'Bairro', categoria: 'Endereço', getValue: (s) => s.endereco_bairro },
  { id: 'endereco_cidade', label: 'Cidade', categoria: 'Endereço', getValue: (s) => s.endereco_cidade },
  { id: 'endereco_uf', label: 'UF', categoria: 'Endereço', getValue: (s) => s.endereco_uf },
  { id: 'endereco_cep', label: 'CEP', categoria: 'Endereço', getValue: (s) => s.endereco_cep },
  
  // Dados Bancários
  { id: 'banco_codigo', label: 'Banco - Código', categoria: 'Dados Bancários', getValue: (s) => s.banco_codigo },
  { id: 'banco_nome', label: 'Banco - Nome', categoria: 'Dados Bancários', getValue: (s) => s.banco_nome },
  { id: 'banco_agencia', label: 'Agência', categoria: 'Dados Bancários', getValue: (s) => s.banco_agencia },
  { id: 'banco_conta', label: 'Conta', categoria: 'Dados Bancários', getValue: (s) => s.banco_conta },
  { id: 'banco_tipo_conta', label: 'Tipo de Conta', categoria: 'Dados Bancários', getValue: (s) => s.banco_tipo_conta },
  
  // Dados Funcionais
  { id: 'matricula', label: 'Matrícula', categoria: 'Dados Funcionais', getValue: (s) => s.matricula },
  { id: 'vinculo', label: 'Vínculo', categoria: 'Dados Funcionais', getValue: (s) => s.vinculo_label || s.vinculo },
  { id: 'situacao', label: 'Situação', categoria: 'Dados Funcionais', getValue: (s) => s.situacao_label || s.situacao },
  { id: 'tipo_servidor', label: 'Tipo de Servidor', categoria: 'Dados Funcionais', getValue: (s) => s.tipo_servidor },
  { id: 'cargo_nome', label: 'Cargo', categoria: 'Dados Funcionais', getValue: (s) => s.cargo?.nome || s.cargo_nome },
  { id: 'cargo_sigla', label: 'Cargo - Sigla', categoria: 'Dados Funcionais', getValue: (s) => s.cargo?.sigla || s.cargo_sigla },
  { id: 'unidade_nome', label: 'Unidade', categoria: 'Dados Funcionais', getValue: (s) => s.unidade?.nome || s.unidade_nome },
  { id: 'unidade_sigla', label: 'Unidade - Sigla', categoria: 'Dados Funcionais', getValue: (s) => s.unidade?.sigla || s.unidade_sigla },
  { id: 'data_admissao', label: 'Data de Admissão', categoria: 'Dados Funcionais', getValue: (s) => formatDate(s.data_admissao) },
  { id: 'data_posse', label: 'Data de Posse', categoria: 'Dados Funcionais', getValue: (s) => formatDate(s.data_posse) },
  { id: 'data_exercicio', label: 'Data de Exercício', categoria: 'Dados Funcionais', getValue: (s) => formatDate(s.data_exercicio) },
  { id: 'carga_horaria', label: 'Carga Horária', categoria: 'Dados Funcionais', getValue: (s) => s.carga_horaria },
  { id: 'regime_juridico', label: 'Regime Jurídico', categoria: 'Dados Funcionais', getValue: (s) => s.regime_juridico },
  
  // Remuneração
  { id: 'remuneracao_bruta', label: 'Remuneração Bruta', categoria: 'Remuneração', getValue: (s) => formatCurrency(s.remuneracao_bruta) },
  { id: 'gratificacoes', label: 'Gratificações', categoria: 'Remuneração', getValue: (s) => formatCurrency(s.gratificacoes) },
  { id: 'descontos', label: 'Descontos', categoria: 'Remuneração', getValue: (s) => formatCurrency(s.descontos) },
  { id: 'remuneracao_liquida', label: 'Remuneração Líquida', categoria: 'Remuneração', getValue: (s) => formatCurrency((s.remuneracao_bruta || 0) + (s.gratificacoes || 0) - (s.descontos || 0)) },
  
  // Formação
  { id: 'escolaridade', label: 'Escolaridade', categoria: 'Formação', getValue: (s) => s.escolaridade },
  { id: 'formacao_academica', label: 'Formação Acadêmica', categoria: 'Formação', getValue: (s) => s.formacao_academica },
  { id: 'instituicao_ensino', label: 'Instituição de Ensino', categoria: 'Formação', getValue: (s) => s.instituicao_ensino },
  { id: 'ano_conclusao', label: 'Ano de Conclusão', categoria: 'Formação', getValue: (s) => s.ano_conclusao },
];

// Campos padrão pré-selecionados
export const CAMPOS_PADRAO = [
  'nome_completo',
  'cpf',
  'matricula',
  'cargo_nome',
  'unidade_nome',
  'vinculo',
  'situacao',
];

// Agrupar campos por categoria
export const CATEGORIAS_CAMPOS = CAMPOS_EXPORTACAO.reduce((acc, campo) => {
  if (!acc[campo.categoria]) {
    acc[campo.categoria] = [];
  }
  acc[campo.categoria].push(campo);
  return acc;
}, {} as Record<string, CampoExportacao[]>);

// Funções auxiliares
function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return value;
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Gerar nome do arquivo com timestamp
function gerarNomeArquivo(extensao: 'xlsx' | 'csv'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `servidores_${timestamp}.${extensao}`;
}

// Exportar para Excel
export function exportarParaExcel(
  servidores: any[],
  camposSelecionados: string[]
): void {
  const campos = CAMPOS_EXPORTACAO.filter(c => camposSelecionados.includes(c.id));
  
  // Criar dados para a planilha
  const dados = servidores.map(servidor => {
    const linha: Record<string, any> = {};
    campos.forEach(campo => {
      linha[campo.label] = campo.getValue(servidor) ?? '';
    });
    return linha;
  });
  
  // Criar workbook e worksheet
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Servidores');
  
  // Ajustar largura das colunas
  const maxWidths = campos.map(campo => {
    const headerWidth = campo.label.length;
    const dataWidths = servidores.map(s => {
      const value = campo.getValue(s);
      return value ? String(value).length : 0;
    });
    return Math.min(50, Math.max(headerWidth, ...dataWidths) + 2);
  });
  
  ws['!cols'] = maxWidths.map(width => ({ wch: width }));
  
  // Download do arquivo
  XLSX.writeFile(wb, gerarNomeArquivo('xlsx'));
}

// Exportar para CSV
export function exportarParaCSV(
  servidores: any[],
  camposSelecionados: string[]
): void {
  const campos = CAMPOS_EXPORTACAO.filter(c => camposSelecionados.includes(c.id));
  
  // Criar cabeçalho
  const cabecalho = campos.map(c => `"${c.label}"`).join(';');
  
  // Criar linhas de dados
  const linhas = servidores.map(servidor => {
    return campos.map(campo => {
      const valor = campo.getValue(servidor);
      if (valor === null || valor === undefined) return '""';
      // Escapar aspas duplas e envolver em aspas
      return `"${String(valor).replace(/"/g, '""')}"`;
    }).join(';');
  });
  
  // Juntar tudo com BOM para UTF-8
  const bom = '\uFEFF';
  const conteudo = bom + cabecalho + '\n' + linhas.join('\n');
  
  // Criar blob e download
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = gerarNomeArquivo('csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
