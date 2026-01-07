/**
 * Modelos de documentos administrativos padronizados do IDJUV-RR
 * Baseado nos anexos oficiais, adaptados à Lei nº 2.301/2025
 * 
 * Cada modelo possui duas versões:
 * - Modelo em branco (para impressão e preenchimento manual)
 * - Modelo preenchido (com dados do sistema)
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  addFieldWithLine,
  addTextArea,
  addCheckbox,
  addSignatureArea,
  addLocalData,
  addTableHeader,
  addTableRow,
  PAGINA,
  getPageDimensions,
  CORES,
  setColor,
  formatCPF,
  formatDate,
  formatCurrency,
  checkPageBreak,
  VINCULO_LABELS,
  SITUACAO_LABELS,
} from './pdfTemplate';

// ============ INTERFACES ============

export interface DadosServidor {
  nome_completo?: string;
  nome_social?: string;
  cpf?: string;
  rg?: string;
  rg_orgao_expedidor?: string;
  rg_data_emissao?: string;
  rg_uf?: string;
  data_nascimento?: string;
  naturalidade_cidade?: string;
  naturalidade_uf?: string;
  estado_civil?: string;
  sexo?: string;
  nacionalidade?: string;
  escolaridade?: string;
  formacao_academica?: string;
  instituicao_ensino?: string;
  ano_conclusao?: number;
  pis_pasep?: string;
  titulo_eleitor?: string;
  titulo_zona?: string;
  titulo_secao?: string;
  certificado_reservista?: string;
  cnh_numero?: string;
  cnh_categoria?: string;
  cnh_validade?: string;
  email_pessoal?: string;
  email_institucional?: string;
  telefone_celular?: string;
  telefone_fixo?: string;
  telefone_emergencia?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_parentesco?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  matricula?: string;
  vinculo?: string;
  situacao?: string;
  regime_juridico?: string;
  data_admissao?: string;
  data_posse?: string;
  data_exercicio?: string;
  carga_horaria?: number;
  cargo_nome?: string;
  unidade_nome?: string;
  banco_nome?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: string;
  remuneracao_bruta?: number;
  dependentes?: Array<{
    nome: string;
    data_nascimento: string;
    cpf: string;
    parentesco: string;
  }>;
  acumula_cargo?: boolean;
  acumulo_descricao?: string;
}

// ============ 1. RELAÇÃO DE DOCUMENTOS OBRIGATÓRIOS PARA CADASTRO ============

export const generateRelacaoDocumentosModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'DOCUMENTOS OBRIGATÓRIOS PARA CADASTRO',
    subtitulo: 'Secretaria de Administração e Gestão de Pessoas',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const intro = 'Para fins de cadastro funcional no Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJUV, o(a) servidor(a) deverá apresentar os seguintes documentos:';
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, PAGINA.margemEsquerda, y);
  y += introLines.length * 5 + 5;
  
  // Lista de documentos
  y = addSectionHeader(doc, 'Documentos Pessoais', y, { numerada: true, numero: 1 });
  
  const docsObrigatorios = [
    'Ficha Cadastral do Servidor preenchida e assinada',
    '01 (uma) foto 3x4 recente',
    'Cópia do RG (Carteira de Identidade)',
    'Cópia do CPF',
    'Cópia do Título de Eleitor com comprovante da última votação',
    'Cópia do PIS/PASEP (ou declaração de primeiro emprego)',
    'Certidão de Antecedentes Criminais (Estadual e Federal)',
    'Cópia do Comprovante de Residência atualizado (emitido nos últimos 90 dias)',
    'Cópia do Certificado/Diploma de Escolaridade com Histórico Escolar',
    'Cópia do Documento de Quitação Militar (para sexo masculino)',
    'Cópia da Certidão de Nascimento, Casamento ou União Estável',
    'Cópia da CNH, se possuir',
    'Comprovante de dados bancários (conta corrente em nome do servidor)',
  ];
  
  doc.setFontSize(9);
  docsObrigatorios.forEach((item, idx) => {
    setColor(doc, CORES.secundaria);
    doc.text('•', PAGINA.margemEsquerda, y);
    setColor(doc, CORES.textoEscuro);
    doc.text(item, PAGINA.margemEsquerda + 5, y);
    y += 5;
  });
  
  y += 5;
  y = addSectionHeader(doc, 'Declarações Obrigatórias', y, { numerada: true, numero: 2 });
  
  const declaracoes = [
    'Declaração de Acumulação ou Não Acumulação de Cargos Públicos',
    'Declaração de Bens e Valores',
  ];
  
  declaracoes.forEach((item) => {
    setColor(doc, CORES.secundaria);
    doc.text('•', PAGINA.margemEsquerda, y);
    setColor(doc, CORES.textoEscuro);
    doc.text(item, PAGINA.margemEsquerda + 5, y);
    y += 5;
  });
  
  y += 5;
  y = addSectionHeader(doc, 'Documentos de Dependentes (se houver)', y, { numerada: true, numero: 3 });
  
  const docsDependentes = [
    'Cópia do CPF de filhos até 21 anos',
    'Para menores de 14 anos: Certidão de Nascimento e Carteira de Vacinação',
    'Declaração de matrícula escolar dos dependentes menores',
  ];
  
  docsDependentes.forEach((item) => {
    setColor(doc, CORES.secundaria);
    doc.text('•', PAGINA.margemEsquerda, y);
    setColor(doc, CORES.textoEscuro);
    doc.text(item, PAGINA.margemEsquerda + 5, y);
    y += 5;
  });
  
  y += 5;
  y = addSectionHeader(doc, 'Para Servidores Cedidos', y, { numerada: true, numero: 4 });
  
  const docsCedidos = [
    'Cópia do Decreto ou Portaria de cedência',
    'Declaração do órgão de origem sobre situação funcional',
  ];
  
  docsCedidos.forEach((item) => {
    setColor(doc, CORES.secundaria);
    doc.text('•', PAGINA.margemEsquerda, y);
    setColor(doc, CORES.textoEscuro);
    doc.text(item, PAGINA.margemEsquerda + 5, y);
    y += 5;
  });
  
  y += 10;
  
  // Observações
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 25, 'F');
  y += 5;
  
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OBSERVAÇÕES IMPORTANTES:', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, CORES.textoEscuro);
  const obs = [
    '• Todas as cópias devem ser legíveis e, preferencialmente, autenticadas ou apresentadas junto aos originais.',
    '• A não entrega da documentação completa impede a conclusão do cadastro funcional.',
    '• Documentos em língua estrangeira devem estar acompanhados de tradução juramentada.',
  ];
  obs.forEach(o => {
    doc.text(o, PAGINA.margemEsquerda + 3, y);
    y += 4;
  });
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Relacao_Documentos_Cadastro_IDJUV.pdf');
};

// ============ 2. FICHA CADASTRAL DO SERVIDOR - MODELO COMPLETO ============

export const generateFichaCadastralModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FICHA CADASTRAL DO SERVIDOR',
    subtitulo: 'Instituto de Desporto, Juventude e Lazer - IDJUV',
  }, logos);
  
  const { contentWidth, width } = getPageDimensions(doc);
  const col1 = contentWidth * 0.5 - 5;
  const col2Start = PAGINA.margemEsquerda + col1 + 10;
  const col2 = contentWidth * 0.5 - 5;
  
  // ===== SEÇÃO 1: DADOS PESSOAIS =====
  y = addSectionHeader(doc, 'Dados Pessoais', y, { numerada: true, numero: 1 });
  
  y = addFieldWithLine(doc, 'Nome Completo', '', PAGINA.margemEsquerda, y, contentWidth - 40);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + contentWidth - 35, y, 35);
  
  y = addFieldWithLine(doc, 'Filiação (Pai)', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Filiação (Mãe)', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y = addFieldWithLine(doc, 'Data Nascimento', '', PAGINA.margemEsquerda, y, 45);
  y -= 6;
  y = addFieldWithLine(doc, 'Naturalidade/UF', '', PAGINA.margemEsquerda + 50, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'Estado Civil', '', PAGINA.margemEsquerda + 110, y, 35);
  y -= 6;
  y = addFieldWithLine(doc, 'Sexo', '', PAGINA.margemEsquerda + 150, y, 20);
  
  y = addFieldWithLine(doc, 'Cor/Raça', '', PAGINA.margemEsquerda, y, 35);
  y -= 6;
  y = addFieldWithLine(doc, 'Escolaridade', '', PAGINA.margemEsquerda + 40, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Formação/Curso', '', PAGINA.margemEsquerda + 95, y, 75);
  
  y = addFieldWithLine(doc, 'CPF', '', PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'PIS/PASEP', '', PAGINA.margemEsquerda + 55, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Nacionalidade', '', PAGINA.margemEsquerda + 110, y, 60);
  
  y = addFieldWithLine(doc, 'RG', '', PAGINA.margemEsquerda, y, 40);
  y -= 6;
  y = addFieldWithLine(doc, 'Data Emissão', '', PAGINA.margemEsquerda + 45, y, 35);
  y -= 6;
  y = addFieldWithLine(doc, 'Órgão Emissor', '', PAGINA.margemEsquerda + 85, y, 40);
  y -= 6;
  y = addFieldWithLine(doc, 'UF', '', PAGINA.margemEsquerda + 130, y, 20);
  
  y = addFieldWithLine(doc, 'Título Eleitoral', '', PAGINA.margemEsquerda, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'Zona', '', PAGINA.margemEsquerda + 60, y, 30);
  y -= 6;
  y = addFieldWithLine(doc, 'Seção', '', PAGINA.margemEsquerda + 95, y, 30);
  
  y = addFieldWithLine(doc, 'Cert. Reservista', '', PAGINA.margemEsquerda, y, 60);
  y -= 6;
  y = addFieldWithLine(doc, 'CNH', '', PAGINA.margemEsquerda + 65, y, 45);
  y -= 6;
  y = addFieldWithLine(doc, 'Cat.', '', PAGINA.margemEsquerda + 115, y, 20);
  y -= 6;
  y = addFieldWithLine(doc, 'Validade', '', PAGINA.margemEsquerda + 140, y, 30);
  
  y = addFieldWithLine(doc, 'E-mail', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 2;
  
  // ===== SEÇÃO 2: DADOS BANCÁRIOS =====
  y = addSectionHeader(doc, 'Dados Bancários', y, { numerada: true, numero: 2 });
  
  y = addFieldWithLine(doc, 'Banco', '', PAGINA.margemEsquerda, y, 60);
  y -= 6;
  y = addFieldWithLine(doc, 'Agência', '', PAGINA.margemEsquerda + 65, y, 40);
  y -= 6;
  y = addFieldWithLine(doc, 'Conta Corrente', '', PAGINA.margemEsquerda + 110, y, 60);
  
  y += 2;
  
  // ===== SEÇÃO 3: ENDEREÇO / CONTATO =====
  y = addSectionHeader(doc, 'Endereço e Contato', y, { numerada: true, numero: 3 });
  
  y = addFieldWithLine(doc, 'Logradouro', '', PAGINA.margemEsquerda, y, contentWidth - 30);
  y -= 6;
  y = addFieldWithLine(doc, 'Nº', '', PAGINA.margemEsquerda + contentWidth - 25, y, 25);
  
  y = addFieldWithLine(doc, 'Complemento', '', PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Bairro', '', PAGINA.margemEsquerda + 55, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'CEP', '', PAGINA.margemEsquerda + 115, y, 35);
  
  y = addFieldWithLine(doc, 'Município', '', PAGINA.margemEsquerda, y, 60);
  y -= 6;
  y = addFieldWithLine(doc, 'UF', '', PAGINA.margemEsquerda + 65, y, 25);
  y -= 6;
  y = addFieldWithLine(doc, 'Celular', '', PAGINA.margemEsquerda + 95, y, 75);
  
  y += 2;
  
  // ===== SEÇÃO 4: DEPENDENTES =====
  y = addSectionHeader(doc, 'Dependentes', y, { numerada: true, numero: 4 });
  
  // Cabeçalho da tabela
  const colunas = [
    { header: 'NOME', width: 70, align: 'left' as const },
    { header: 'DATA NASC.', width: 30, align: 'center' as const },
    { header: 'CPF', width: 40, align: 'center' as const },
    { header: 'PARENTESCO', width: 30, align: 'center' as const },
  ];
  
  y = addTableHeader(doc, colunas, y);
  
  // 5 linhas vazias para dependentes
  for (let i = 0; i < 5; i++) {
    y = addTableRow(doc, ['', '', '', ''], colunas, y, i % 2 === 1);
    // Adiciona linhas para preenchimento manual
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y - 2, PAGINA.margemEsquerda + contentWidth, y - 2);
  }
  
  y += 5;
  
  // ===== SEÇÃO 5: DADOS FUNCIONAIS =====
  y = checkPageBreak(doc, y, 60);
  if (y < 40) {
    y = await generateInstitutionalHeader(doc, {
      titulo: 'FICHA CADASTRAL DO SERVIDOR',
      subtitulo: 'Continuação',
    }, logos);
  }
  
  y = addSectionHeader(doc, 'Dados Funcionais', y, { numerada: true, numero: 5 });
  
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Unidade de Lotação', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y = addFieldWithLine(doc, 'Vínculo', '', PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Regime Jurídico', '', PAGINA.margemEsquerda + 55, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'Carga Horária', '', PAGINA.margemEsquerda + 115, y, 35);
  
  y = addFieldWithLine(doc, 'Data Admissão', '', PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Data Posse', '', PAGINA.margemEsquerda + 55, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Data Exercício', '', PAGINA.margemEsquerda + 110, y, 50);
  
  y += 5;
  
  // ===== DECLARAÇÃO FINAL =====
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 18, 'F');
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DECLARAÇÃO', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const declaracao = 'Declaro, sob penalidades legais, que as informações acima prestadas são verdadeiras e de minha inteira responsabilidade, comprometendo-me a informar ao IDJUV quaisquer alterações nos dados aqui declarados.';
  const declLines = doc.splitTextToSize(declaracao, contentWidth - 6);
  doc.text(declLines, PAGINA.margemEsquerda + 3, y);
  
  y += 20;
  
  // Local e data
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  // Assinaturas
  y = addSignatureArea(doc, [
    { cargo: 'Assinatura do(a) Servidor(a)' },
    { cargo: 'Responsável - Gestão de Pessoas' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Ficha_Cadastral_IDJUV.pdf');
};

/**
 * Gera Ficha Cadastral preenchida com dados do servidor
 */
export const generateFichaCadastralPreenchida = async (servidor: DadosServidor): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FICHA CADASTRAL DO SERVIDOR',
    subtitulo: 'Instituto de Desporto, Juventude e Lazer - IDJUV',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  
  // ===== SEÇÃO 1: DADOS PESSOAIS =====
  y = addSectionHeader(doc, 'Dados Pessoais', y, { numerada: true, numero: 1 });
  
  y = addFieldWithLine(doc, 'Nome Completo', servidor.nome_completo || '', PAGINA.margemEsquerda, y, contentWidth - 40);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', servidor.matricula || '', PAGINA.margemEsquerda + contentWidth - 35, y, 35);
  
  y = addFieldWithLine(doc, 'Filiação (Pai)', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Filiação (Mãe)', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y = addFieldWithLine(doc, 'Data Nascimento', formatDate(servidor.data_nascimento), PAGINA.margemEsquerda, y, 45);
  y -= 6;
  const naturalidade = servidor.naturalidade_cidade && servidor.naturalidade_uf 
    ? `${servidor.naturalidade_cidade}/${servidor.naturalidade_uf}` 
    : servidor.naturalidade_cidade || '';
  y = addFieldWithLine(doc, 'Naturalidade/UF', naturalidade, PAGINA.margemEsquerda + 50, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'Estado Civil', servidor.estado_civil || '', PAGINA.margemEsquerda + 110, y, 35);
  y -= 6;
  y = addFieldWithLine(doc, 'Sexo', servidor.sexo || '', PAGINA.margemEsquerda + 150, y, 20);
  
  y = addFieldWithLine(doc, 'Cor/Raça', '', PAGINA.margemEsquerda, y, 35);
  y -= 6;
  y = addFieldWithLine(doc, 'Escolaridade', servidor.escolaridade || '', PAGINA.margemEsquerda + 40, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Formação/Curso', servidor.formacao_academica || '', PAGINA.margemEsquerda + 95, y, 75);
  
  y = addFieldWithLine(doc, 'CPF', formatCPF(servidor.cpf || ''), PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'PIS/PASEP', servidor.pis_pasep || '', PAGINA.margemEsquerda + 55, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Nacionalidade', servidor.nacionalidade || 'Brasileira', PAGINA.margemEsquerda + 110, y, 60);
  
  y = addFieldWithLine(doc, 'RG', servidor.rg || '', PAGINA.margemEsquerda, y, 40);
  y -= 6;
  y = addFieldWithLine(doc, 'Data Emissão', formatDate(servidor.rg_data_emissao), PAGINA.margemEsquerda + 45, y, 35);
  y -= 6;
  y = addFieldWithLine(doc, 'Órgão Emissor', servidor.rg_orgao_expedidor || '', PAGINA.margemEsquerda + 85, y, 40);
  y -= 6;
  y = addFieldWithLine(doc, 'UF', servidor.rg_uf || '', PAGINA.margemEsquerda + 130, y, 20);
  
  y = addFieldWithLine(doc, 'Título Eleitoral', servidor.titulo_eleitor || '', PAGINA.margemEsquerda, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'Zona', servidor.titulo_zona || '', PAGINA.margemEsquerda + 60, y, 30);
  y -= 6;
  y = addFieldWithLine(doc, 'Seção', servidor.titulo_secao || '', PAGINA.margemEsquerda + 95, y, 30);
  
  y = addFieldWithLine(doc, 'Cert. Reservista', servidor.certificado_reservista || '', PAGINA.margemEsquerda, y, 60);
  y -= 6;
  y = addFieldWithLine(doc, 'CNH', servidor.cnh_numero || '', PAGINA.margemEsquerda + 65, y, 45);
  y -= 6;
  y = addFieldWithLine(doc, 'Cat.', servidor.cnh_categoria || '', PAGINA.margemEsquerda + 115, y, 20);
  y -= 6;
  y = addFieldWithLine(doc, 'Validade', formatDate(servidor.cnh_validade), PAGINA.margemEsquerda + 140, y, 30);
  
  y = addFieldWithLine(doc, 'E-mail', servidor.email_pessoal || servidor.email_institucional || '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 2;
  
  // ===== SEÇÃO 2: DADOS BANCÁRIOS =====
  y = addSectionHeader(doc, 'Dados Bancários', y, { numerada: true, numero: 2 });
  
  y = addFieldWithLine(doc, 'Banco', servidor.banco_nome || '', PAGINA.margemEsquerda, y, 60);
  y -= 6;
  y = addFieldWithLine(doc, 'Agência', servidor.banco_agencia || '', PAGINA.margemEsquerda + 65, y, 40);
  y -= 6;
  y = addFieldWithLine(doc, 'Conta Corrente', servidor.banco_conta || '', PAGINA.margemEsquerda + 110, y, 60);
  
  y += 2;
  
  // ===== SEÇÃO 3: ENDEREÇO / CONTATO =====
  y = addSectionHeader(doc, 'Endereço e Contato', y, { numerada: true, numero: 3 });
  
  y = addFieldWithLine(doc, 'Logradouro', servidor.endereco_logradouro || '', PAGINA.margemEsquerda, y, contentWidth - 30);
  y -= 6;
  y = addFieldWithLine(doc, 'Nº', servidor.endereco_numero || '', PAGINA.margemEsquerda + contentWidth - 25, y, 25);
  
  y = addFieldWithLine(doc, 'Complemento', servidor.endereco_complemento || '', PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Bairro', servidor.endereco_bairro || '', PAGINA.margemEsquerda + 55, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'CEP', servidor.endereco_cep || '', PAGINA.margemEsquerda + 115, y, 35);
  
  y = addFieldWithLine(doc, 'Município', servidor.endereco_cidade || '', PAGINA.margemEsquerda, y, 60);
  y -= 6;
  y = addFieldWithLine(doc, 'UF', servidor.endereco_uf || '', PAGINA.margemEsquerda + 65, y, 25);
  y -= 6;
  y = addFieldWithLine(doc, 'Celular', servidor.telefone_celular || '', PAGINA.margemEsquerda + 95, y, 75);
  
  y += 2;
  
  // ===== SEÇÃO 4: DEPENDENTES =====
  y = addSectionHeader(doc, 'Dependentes', y, { numerada: true, numero: 4 });
  
  const colunas = [
    { header: 'NOME', width: 70, align: 'left' as const },
    { header: 'DATA NASC.', width: 30, align: 'center' as const },
    { header: 'CPF', width: 40, align: 'center' as const },
    { header: 'PARENTESCO', width: 30, align: 'center' as const },
  ];
  
  y = addTableHeader(doc, colunas, y);
  
  const dependentes = servidor.dependentes || [];
  const totalLinhas = Math.max(dependentes.length, 3);
  
  for (let i = 0; i < totalLinhas; i++) {
    const dep = dependentes[i];
    const valores = dep 
      ? [dep.nome || '', formatDate(dep.data_nascimento), formatCPF(dep.cpf), dep.parentesco || '']
      : ['', '', '', ''];
    y = addTableRow(doc, valores, colunas, y, i % 2 === 1);
  }
  
  y += 5;
  
  // ===== SEÇÃO 5: DADOS FUNCIONAIS =====
  y = checkPageBreak(doc, y, 60);
  if (y < 40) {
    y = await generateInstitutionalHeader(doc, {
      titulo: 'FICHA CADASTRAL DO SERVIDOR',
      subtitulo: 'Continuação',
    }, logos);
  }
  
  y = addSectionHeader(doc, 'Dados Funcionais', y, { numerada: true, numero: 5 });
  
  y = addFieldWithLine(doc, 'Cargo/Função', servidor.cargo_nome || '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Unidade de Lotação', servidor.unidade_nome || '', PAGINA.margemEsquerda, y, contentWidth);
  
  const vinculoLabel = servidor.vinculo ? (VINCULO_LABELS[servidor.vinculo] || servidor.vinculo) : '';
  y = addFieldWithLine(doc, 'Vínculo', vinculoLabel, PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Regime Jurídico', servidor.regime_juridico || '', PAGINA.margemEsquerda + 55, y, 55);
  y -= 6;
  y = addFieldWithLine(doc, 'Carga Horária', servidor.carga_horaria ? `${servidor.carga_horaria}h` : '', PAGINA.margemEsquerda + 115, y, 35);
  
  y = addFieldWithLine(doc, 'Data Admissão', formatDate(servidor.data_admissao), PAGINA.margemEsquerda, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Data Posse', formatDate(servidor.data_posse), PAGINA.margemEsquerda + 55, y, 50);
  y -= 6;
  y = addFieldWithLine(doc, 'Data Exercício', formatDate(servidor.data_exercicio), PAGINA.margemEsquerda + 110, y, 50);
  
  y += 5;
  
  // ===== DECLARAÇÃO FINAL =====
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 18, 'F');
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DECLARAÇÃO', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const declaracao = 'Declaro, sob penalidades legais, que as informações acima prestadas são verdadeiras e de minha inteira responsabilidade, comprometendo-me a informar ao IDJUV quaisquer alterações nos dados aqui declarados.';
  const declLines = doc.splitTextToSize(declaracao, contentWidth - 6);
  doc.text(declLines, PAGINA.margemEsquerda + 3, y);
  
  y += 20;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Assinatura do(a) Servidor(a)', nome: servidor.nome_completo },
    { cargo: 'Responsável - Gestão de Pessoas' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  const nomeArquivo = servidor.nome_completo 
    ? `Ficha_Cadastral_${servidor.nome_completo.replace(/\s+/g, '_').substring(0, 30)}_IDJUV.pdf`
    : 'Ficha_Cadastral_IDJUV.pdf';
  
  doc.save(nomeArquivo);
};

// ============ 3. DECLARAÇÃO DE ACUMULAÇÃO / NÃO ACUMULAÇÃO DE CARGOS ============

export const generateDeclaracaoAcumulacaoModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS',
    subtitulo: 'Art. 37, incisos XVI e XVII da Constituição Federal',
  }, logos);
  
  const { contentWidth, width } = getPageDimensions(doc);
  
  // Dados do Declarante
  y = addSectionHeader(doc, 'Identificação do Declarante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome do(a) Servidor(a)', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'CPF', '', PAGINA.margemEsquerda, y, contentWidth / 2 - 5);
  y -= 6;
  y = addFieldWithLine(doc, 'RG', '', PAGINA.margemEsquerda + contentWidth / 2, y, contentWidth / 2);
  y = addFieldWithLine(doc, 'Cargo no IDJUV', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 5;
  
  // Declaração
  y = addSectionHeader(doc, 'Declaração', y, { numerada: true, numero: 2 });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const intro = 'DECLARO, para os devidos fins de ocupação de cargo, emprego ou função pública no Instituto de Desporto, Juventude e Lazer do Estado de Roraima - IDJUV, que:';
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, PAGINA.margemEsquerda, y);
  y += introLines.length * 5 + 8;
  
  // Opção 1: Não acumula
  y = addCheckbox(doc, 'NÃO ACUMULO cargos, empregos ou funções públicas.', false, PAGINA.margemEsquerda, y);
  y += 5;
  
  // Opção 2: Acumula licitamente
  y = addCheckbox(doc, 'ACUMULO licitamente o cargo, emprego ou função pública de:', false, PAGINA.margemEsquerda, y);
  y += 3;
  y = addFieldWithLine(doc, '   Cargo/Função', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, '   Órgão/Entidade', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 3;
  
  // Sub-opções para cedidos
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.text('Se cedido, assinalar:', PAGINA.margemEsquerda + 10, y);
  y += 5;
  
  y = addCheckbox(doc, 'SEM ônus para o IDJUV (cessionário)', false, PAGINA.margemEsquerda + 10, y);
  y = addCheckbox(doc, 'COM ônus para o IDJUV (cessionário)', false, PAGINA.margemEsquerda + 10, y);
  
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('OBS: Anexar cópia do Decreto ou Portaria de cedência.', PAGINA.margemEsquerda + 10, y);
  y += 8;
  
  // Opção 3: Aposentado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = addCheckbox(doc, 'SOU APOSENTADO(A) no cargo de:', false, PAGINA.margemEsquerda, y);
  y += 3;
  y = addFieldWithLine(doc, '   Cargo', '', PAGINA.margemEsquerda, y, contentWidth / 2);
  y -= 6;
  y = addFieldWithLine(doc, 'Órgão Pagador', '', PAGINA.margemEsquerda + contentWidth / 2 + 5, y, contentWidth / 2 - 5);
  
  y += 10;
  
  // Termo de ciência
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 20, 'F');
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TERMO DE CIÊNCIA E RESPONSABILIDADE', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const ciencia = 'DECLARO, sob as penalidades da lei, que as informações aqui prestadas são verdadeiras e de minha inteira responsabilidade. Estou ciente de que a falsidade ou omissão de informações pode caracterizar crime de falsidade ideológica (art. 299 do Código Penal), além de infração disciplinar.';
  const cienciaLines = doc.splitTextToSize(ciencia, contentWidth - 6);
  doc.text(cienciaLines, PAGINA.margemEsquerda + 3, y);
  
  y += 25;
  
  // Assinaturas
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 10;
  
  y = addSignatureArea(doc, [
    { cargo: 'Assinatura do(a) Servidor(a)' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Declaracao_Acumulacao_Cargos_IDJUV.pdf');
};

/**
 * Gera Declaração de Acumulação preenchida
 */
export const generateDeclaracaoAcumulacaoPreenchida = async (servidor: DadosServidor): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS',
    subtitulo: 'Art. 37, incisos XVI e XVII da Constituição Federal',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  
  // Dados do Declarante
  y = addSectionHeader(doc, 'Identificação do Declarante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome do(a) Servidor(a)', servidor.nome_completo || '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'CPF', formatCPF(servidor.cpf || ''), PAGINA.margemEsquerda, y, contentWidth / 2 - 5);
  y -= 6;
  y = addFieldWithLine(doc, 'RG', servidor.rg || '', PAGINA.margemEsquerda + contentWidth / 2, y, contentWidth / 2);
  y = addFieldWithLine(doc, 'Cargo no IDJUV', servidor.cargo_nome || '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 5;
  
  // Declaração
  y = addSectionHeader(doc, 'Declaração', y, { numerada: true, numero: 2 });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const intro = 'DECLARO, para os devidos fins de ocupação de cargo, emprego ou função pública no Instituto de Desporto, Juventude e Lazer do Estado de Roraima - IDJUV, que:';
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, PAGINA.margemEsquerda, y);
  y += introLines.length * 5 + 8;
  
  // Marca a opção apropriada
  const acumula = servidor.acumula_cargo === true;
  
  y = addCheckbox(doc, 'NÃO ACUMULO cargos, empregos ou funções públicas.', !acumula, PAGINA.margemEsquerda, y);
  y += 5;
  
  y = addCheckbox(doc, 'ACUMULO licitamente o cargo, emprego ou função pública de:', acumula, PAGINA.margemEsquerda, y);
  y += 3;
  y = addFieldWithLine(doc, '   Cargo/Função', acumula ? (servidor.acumulo_descricao || '') : '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, '   Órgão/Entidade', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 3;
  
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.text('Se cedido, assinalar:', PAGINA.margemEsquerda + 10, y);
  y += 5;
  
  y = addCheckbox(doc, 'SEM ônus para o IDJUV (cessionário)', false, PAGINA.margemEsquerda + 10, y);
  y = addCheckbox(doc, 'COM ônus para o IDJUV (cessionário)', false, PAGINA.margemEsquerda + 10, y);
  
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('OBS: Anexar cópia do Decreto ou Portaria de cedência.', PAGINA.margemEsquerda + 10, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = addCheckbox(doc, 'SOU APOSENTADO(A) no cargo de:', false, PAGINA.margemEsquerda, y);
  y += 3;
  y = addFieldWithLine(doc, '   Cargo', '', PAGINA.margemEsquerda, y, contentWidth / 2);
  y -= 6;
  y = addFieldWithLine(doc, 'Órgão Pagador', '', PAGINA.margemEsquerda + contentWidth / 2 + 5, y, contentWidth / 2 - 5);
  
  y += 10;
  
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 20, 'F');
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TERMO DE CIÊNCIA E RESPONSABILIDADE', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const ciencia = 'DECLARO, sob as penalidades da lei, que as informações aqui prestadas são verdadeiras e de minha inteira responsabilidade. Estou ciente de que a falsidade ou omissão de informações pode caracterizar crime de falsidade ideológica (art. 299 do Código Penal), além de infração disciplinar.';
  const cienciaLines = doc.splitTextToSize(ciencia, contentWidth - 6);
  doc.text(cienciaLines, PAGINA.margemEsquerda + 3, y);
  
  y += 25;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 10;
  
  y = addSignatureArea(doc, [
    { cargo: 'Assinatura do(a) Servidor(a)', nome: servidor.nome_completo },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  const nomeArquivo = servidor.nome_completo 
    ? `Declaracao_Acumulacao_${servidor.nome_completo.replace(/\s+/g, '_').substring(0, 25)}_IDJUV.pdf`
    : 'Declaracao_Acumulacao_IDJUV.pdf';
  
  doc.save(nomeArquivo);
};

// ============ 4. DECLARAÇÃO DE BENS E VALORES ============

export const generateDeclaracaoBensModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'DECLARAÇÃO DE BENS E VALORES',
    subtitulo: 'Lei nº 8.429/1992 (Improbidade Administrativa) e Lei nº 8.730/1993',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  // Dados do Declarante
  y = addSectionHeader(doc, 'Identificação do Declarante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Naturalidade', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'RG', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'SSP', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'CPF', '', PAGINA.margemEsquerda, y, halfWidth);
  y = addFieldWithLine(doc, 'Residente e domiciliado(a) em', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 5;
  
  // Declaração de bens
  y = addSectionHeader(doc, 'Bens e Valores', y, { numerada: true, numero: 2 });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('DECLARO, para os devidos fins legais, que os seguintes bens integram o meu patrimônio:', PAGINA.margemEsquerda, y);
  y += 8;
  
  // Linhas para listagem de bens
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  for (let i = 0; i < 8; i++) {
    doc.line(PAGINA.margemEsquerda, y, PAGINA.margemEsquerda + contentWidth, y);
    y += 7;
  }
  
  y += 5;
  
  // Opção de não possuir bens
  y = addCheckbox(doc, 'NÃO POSSUO BENS OU VALORES a declarar.', false, PAGINA.margemEsquerda, y);
  
  y += 10;
  
  // Termo final
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const termo = 'Por ser verdade, firmo a presente declaração para que surta os efeitos legais, ciente das penalidades previstas no art. 299 do Código Penal para o crime de falsidade ideológica.';
  const termoLines = doc.splitTextToSize(termo, contentWidth);
  doc.text(termoLines, PAGINA.margemEsquerda, y);
  
  y += 15;
  
  // Assinaturas
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 10;
  
  y = addSignatureArea(doc, [
    { cargo: 'Assinatura do(a) Servidor(a)' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Declaracao_Bens_Valores_IDJUV.pdf');
};

/**
 * Gera Declaração de Bens preenchida
 */
export const generateDeclaracaoBensPreenchida = async (servidor: DadosServidor): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'DECLARAÇÃO DE BENS E VALORES',
    subtitulo: 'Lei nº 8.429/1992 (Improbidade Administrativa) e Lei nº 8.730/1993',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  // Dados do Declarante
  y = addSectionHeader(doc, 'Identificação do Declarante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', servidor.nome_completo || '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo', servidor.cargo_nome || '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  const naturalidade = servidor.naturalidade_cidade && servidor.naturalidade_uf 
    ? `${servidor.naturalidade_cidade}/${servidor.naturalidade_uf}` 
    : '';
  y = addFieldWithLine(doc, 'Naturalidade', naturalidade, PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'RG', servidor.rg || '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'SSP', servidor.rg_orgao_expedidor || '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'CPF', formatCPF(servidor.cpf || ''), PAGINA.margemEsquerda, y, halfWidth);
  
  const endereco = [
    servidor.endereco_logradouro,
    servidor.endereco_numero ? `nº ${servidor.endereco_numero}` : '',
    servidor.endereco_bairro,
    servidor.endereco_cidade,
    servidor.endereco_uf,
  ].filter(Boolean).join(', ');
  y = addFieldWithLine(doc, 'Residente e domiciliado(a) em', endereco, PAGINA.margemEsquerda, y, contentWidth);
  
  y += 5;
  
  // Declaração de bens
  y = addSectionHeader(doc, 'Bens e Valores', y, { numerada: true, numero: 2 });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('DECLARO, para os devidos fins legais, que os seguintes bens integram o meu patrimônio:', PAGINA.margemEsquerda, y);
  y += 8;
  
  // Linhas para listagem de bens
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  for (let i = 0; i < 8; i++) {
    doc.line(PAGINA.margemEsquerda, y, PAGINA.margemEsquerda + contentWidth, y);
    y += 7;
  }
  
  y += 5;
  
  y = addCheckbox(doc, 'NÃO POSSUO BENS OU VALORES a declarar.', false, PAGINA.margemEsquerda, y);
  
  y += 10;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const termo = 'Por ser verdade, firmo a presente declaração para que surta os efeitos legais, ciente das penalidades previstas no art. 299 do Código Penal para o crime de falsidade ideológica.';
  const termoLines = doc.splitTextToSize(termo, contentWidth);
  doc.text(termoLines, PAGINA.margemEsquerda, y);
  
  y += 15;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 10;
  
  y = addSignatureArea(doc, [
    { cargo: 'Assinatura do(a) Servidor(a)', nome: servidor.nome_completo },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  const nomeArquivo = servidor.nome_completo 
    ? `Declaracao_Bens_${servidor.nome_completo.replace(/\s+/g, '_').substring(0, 25)}_IDJUV.pdf`
    : 'Declaracao_Bens_IDJUV.pdf';
  
  doc.save(nomeArquivo);
};

// ============ 5. TERMO DE DEMANDA ============

export const generateTermoDemandaModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE DEMANDA',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Solicitante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Setor/Unidade', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'E-mail', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Telefone', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Descrição da Demanda', y, { numerada: true, numero: 2 });
  y = addTextArea(doc, 'Objeto da demanda:', '', y, 2);
  y = addTextArea(doc, 'Justificativa (necessidade e motivação):', '', y, 4);
  
  y = addSectionHeader(doc, 'Especificações Técnicas', y, { numerada: true, numero: 3 });
  y = addFieldWithLine(doc, 'Quantidade estimada', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Valor estimado (R$)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Prazo necessário', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Prioridade (Alta/Média/Baixa)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Observações', y, { numerada: true, numero: 4 });
  y = addTextArea(doc, '', '', y, 3);
  
  y += 8;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Solicitante' },
    { cargo: 'Chefia Imediata' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Termo_Demanda_IDJUV.pdf');
};

// ============ 6. ORDEM DE MISSÃO ============

export const generateOrdemMissaoModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'ORDEM DE MISSÃO',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Servidor', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Unidade de Lotação', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Dados da Missão', y, { numerada: true, numero: 2 });
  y = addFieldWithLine(doc, 'Destino (Cidade/UF)', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addTextArea(doc, 'Objetivo/Finalidade:', '', y, 3);
  
  y = addSectionHeader(doc, 'Período e Transporte', y, { numerada: true, numero: 3 });
  y = addFieldWithLine(doc, 'Data/Hora Saída', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Data/Hora Retorno', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Meio de Transporte', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Diárias e Passagens', y, { numerada: true, numero: 4 });
  y = addFieldWithLine(doc, 'Quantidade de Diárias', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Valor Unitário (R$)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Valor Total Diárias (R$)', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Passagem Aérea (Sim/Não)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Observações', y, { numerada: true, numero: 5 });
  y = addTextArea(doc, '', '', y, 2);
  
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Autorizo a realização da missão acima descrita, nos termos da legislação vigente.', PAGINA.margemEsquerda, y);
  
  y += 10;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Servidor' },
    { cargo: 'Chefia Imediata' },
    { cargo: 'Ordenador de Despesa' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Ordem_Missao_IDJUV.pdf');
};

// ============ 7. RELATÓRIO DE VIAGEM ============

export const generateRelatorioViagemModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE VIAGEM',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome do Servidor', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Nº Ordem de Missão', '', PAGINA.margemEsquerda, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Dados da Viagem', y, { numerada: true, numero: 2 });
  y = addFieldWithLine(doc, 'Destino', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Período', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addTextArea(doc, 'Objetivo Original:', '', y, 2);
  
  y = addSectionHeader(doc, 'Atividades Realizadas', y, { numerada: true, numero: 3 });
  y = addTextArea(doc, '', '', y, 5);
  
  y = addSectionHeader(doc, 'Resultados Obtidos', y, { numerada: true, numero: 4 });
  y = addTextArea(doc, '', '', y, 3);
  
  y = addSectionHeader(doc, 'Despesas e Observações', y, { numerada: true, numero: 5 });
  y = addTextArea(doc, '', '', y, 2);
  
  y += 3;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Declaro que as informações acima são verdadeiras e que cumpri integralmente os objetivos da missão.', PAGINA.margemEsquerda, y);
  
  y += 10;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Servidor' },
    { cargo: 'Chefia Imediata' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Relatorio_Viagem_IDJUV.pdf');
};

// ============ 8. REQUISIÇÃO DE MATERIAL ============

export const generateRequisicaoMaterialModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'REQUISIÇÃO DE MATERIAL',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Solicitante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Setor/Unidade', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Materiais Solicitados', y, { numerada: true, numero: 2 });
  
  // Cabeçalho da tabela de materiais
  const colunas = [
    { header: 'QTD', width: 15, align: 'center' as const },
    { header: 'UNID.', width: 15, align: 'center' as const },
    { header: 'DESCRIÇÃO DO MATERIAL', width: 110, align: 'left' as const },
    { header: 'OBS', width: 30, align: 'left' as const },
  ];
  
  y = addTableHeader(doc, colunas, y);
  
  for (let i = 0; i < 8; i++) {
    y = addTableRow(doc, ['', '', '', ''], colunas, y, i % 2 === 1);
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y - 2, PAGINA.margemEsquerda + contentWidth, y - 2);
  }
  
  y += 5;
  
  y = addSectionHeader(doc, 'Justificativa', y, { numerada: true, numero: 3 });
  y = addTextArea(doc, '', '', y, 3);
  
  y = addFieldWithLine(doc, 'Urgência (Alta/Média/Baixa)', '', PAGINA.margemEsquerda, y, halfWidth);
  
  y += 8;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Solicitante' },
    { cargo: 'Chefia Imediata' },
    { cargo: 'Almoxarifado' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Requisicao_Material_IDJUV.pdf');
};

// ============ 9. TERMO DE RESPONSABILIDADE PATRIMONIAL ============

export const generateTermoResponsabilidadeModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE RESPONSABILIDADE PATRIMONIAL',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Responsável', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Setor/Unidade', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Bens sob Responsabilidade', y, { numerada: true, numero: 2 });
  
  const colunas = [
    { header: 'Nº TOMBO', width: 30, align: 'center' as const },
    { header: 'DESCRIÇÃO DO BEM', width: 90, align: 'left' as const },
    { header: 'ESTADO', width: 25, align: 'center' as const },
    { header: 'LOCAL', width: 25, align: 'center' as const },
  ];
  
  y = addTableHeader(doc, colunas, y);
  
  for (let i = 0; i < 6; i++) {
    y = addTableRow(doc, ['', '', '', ''], colunas, y, i % 2 === 1);
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y - 2, PAGINA.margemEsquerda + contentWidth, y - 2);
  }
  
  y += 5;
  
  y = addSectionHeader(doc, 'Observações', y, { numerada: true, numero: 3 });
  y = addTextArea(doc, '', '', y, 2);
  
  y += 3;
  
  // Declaração
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 22, 'F');
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TERMO DE COMPROMISSO', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const declaracao = 'Declaro ter recebido os bens acima descritos, comprometendo-me a zelar pela sua guarda, conservação e uso adequado. Estou ciente de que responderei administrativa, civil e penalmente por dano, extravio ou uso indevido dos bens patrimoniais sob minha responsabilidade.';
  const declLines = doc.splitTextToSize(declaracao, contentWidth - 6);
  doc.text(declLines, PAGINA.margemEsquerda + 3, y);
  
  y += 22;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Responsável' },
    { cargo: 'Chefia Imediata' },
    { cargo: 'Patrimônio' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Termo_Responsabilidade_IDJUV.pdf');
};
