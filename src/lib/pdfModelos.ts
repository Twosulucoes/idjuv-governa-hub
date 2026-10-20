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
  addCheckbox,
  addSignatureArea,
  addLocalData,
  PAGINA,
  getPageDimensions,
  CORES,
  setColor,
  formatCPF,
  formatCurrency,
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

// ============ 2. FICHA CADASTRAL DO SERVIDOR ============
// Motor único (modelo `rh-ficha-cadastral`): a versão em branco é a mesma ficha sem servidor.
export { generateFichaCadastralModelo } from './pdfGenerator';

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
