import jsPDF from 'jspdf';

import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DadosRelatorioCargosVagas } from '@/lib/documentos/modelos/cargos/cargosVagas';
import type { DependenteFicha, ServidorFichaCadastral } from '@/lib/documentos/modelos/rh/fichaCadastral';

import { nomeEntidadeSuperiorDocumentos, nomeOficialDocumentos } from './pdfTemplate';

// Formulários administrativos (termo de demanda, ordem de missão, relatório de viagem, requisição de material,
// termo de responsabilidade) migraram para o motor único: `src/lib/formulariosAdministrativos.ts`.
/** Ainda usado por `pdfCPSI` (DFD/ETP/TR, a remover: ato do SEI). */
export { numeroDoFormulario as generateDocumentNumber } from './formulariosAdministrativos';

// ============================================================
// RELATÓRIO DE CARGOS E VAGAS (motor único: modelo `cargos-relatorio-cargos-vagas`)
// ============================================================

/** Gera e baixa o relatório de cargos e vagas (GestaoCargosPage). */
export const generateRelatorioCargos = async (data: DadosRelatorioCargosVagas): Promise<void> => {
  baixarDocumento(await emitirDocumento('cargos-relatorio-cargos-vagas', data));
};

// ============================================================
// RELATÓRIO ANUAL DE GOVERNANÇA (motor único: modelo `governanca-relatorio-anual`)
// ============================================================

/** Gera e baixa o relatório anual de governança e integridade (RelatorioGovernancaPage). Números fixos, como no original. */
export const generateRelatorioGovernancaPDF = async (): Promise<void> => {
  const sigla = getTenantSnapshot().identidade.sigla?.trim() || 'órgão';
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const conformidade = [72, 75, 78, 80, 82, 85, 84, 86, 87, 87, 88, 87];
  const d = await emitirDocumento('governanca-relatorio-anual', {
    exercicio: '2025',
    indicadores: [
      { titulo: 'Conformidade', valor: '87%', meta: '90%' },
      { titulo: 'Processos', valor: '24', meta: '30' },
      { titulo: 'Capacitações', valor: '156', meta: '200' },
      { titulo: 'Riscos mitigados', valor: '18', meta: '22' },
    ],
    conformidadeMensal: meses.map((mes, i) => ({ mes, valor: conformidade[i] })),
    processosPorArea: [
      { area: 'Compras', quantidade: 8 },
      { area: 'RH', quantidade: 5 },
      { area: 'Patrimônio', quantidade: 4 },
      { area: 'Financeiro', quantidade: 4 },
      { area: 'Almoxarifado', quantidade: 3 },
    ],
    riscos: [
      { nivel: 'Baixo', quantidade: 12 },
      { nivel: 'Médio', quantidade: 8 },
      { nivel: 'Alto', quantidade: 4 },
      { nivel: 'Crítico', quantidade: 1 },
    ],
    acoes: [
      { titulo: 'Treinamento em Ética', situacao: 'Concluído' },
      { titulo: 'Código de Conduta', situacao: 'Concluído' },
      { titulo: 'Mapeamento de Riscos', situacao: 'Em andamento' },
      { titulo: 'Canal de Denúncias', situacao: 'Concluído' },
      { titulo: 'Auditoria Interna', situacao: 'Em andamento' },
    ],
    resumoExecutivo: [
      `O ${sigla} alcançou 87% de conformidade em 2025, superando o resultado de 2024.`,
      'Foram mapeados 24 processos administrativos e 156 servidores capacitados.',
      'O Canal de Denúncias está operacional com garantia de anonimato.',
      'A Matriz de Riscos institucional foi aprovada e publicada.',
    ],
    anoMetas: '2026',
    metas: [
      'Atingir 95% de conformidade nos processos críticos',
      'Mapear 100% dos processos institucionais (30 processos)',
      'Capacitar 100% dos servidores em integridade',
      'Obter certificação ISO 37001 (Antissuborno)',
    ],
  });
  baixarDocumento(d);
};

const formatCPFPDF = (cpf: string): string => {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-';
};

// ============================================================
// FICHA CADASTRAL DO SERVIDOR (motor único: modelo `rh-ficha-cadastral`)
// ============================================================

/** Dados vindos do cadastro (linha de `servidores` + cargo/lotação); `dependentes` é o JSON da coluna. */
export type FichaCadastralData = Omit<ServidorFichaCadastral, 'dependentes'> & { dependentes?: unknown };

/** Só itens com nome: o JSON de dependentes é livre e pode vir com lixo de cadastro antigo. */
function dependentesDaFicha(json: unknown): DependenteFicha[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object' && typeof (d as { nome?: unknown }).nome === 'string' && (d as { nome: string }).nome.trim() !== '')
    .map((d) => ({
      nome: String(d.nome),
      data_nascimento: typeof d.data_nascimento === 'string' ? d.data_nascimento : null,
      cpf: typeof d.cpf === 'string' ? d.cpf : null,
      parentesco: typeof d.parentesco === 'string' ? d.parentesco : null,
    }));
}

export const generateFichaCadastral = async (data: FichaCadastralData): Promise<void> => {
  const servidor: ServidorFichaCadastral = { ...data, dependentes: dependentesDaFicha(data.dependentes) };
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { servidor, local: localDaSede(), data: hoje }));
};

// ============================================================
// DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
// ============================================================

interface DeclaracaoAcumulacaoData {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  cargo_nome?: string | null;
  unidade_nome?: string | null;
  acumula_cargo: boolean;
  acumulo_descricao?: string | null;
}

export const generateDeclaracaoAcumulacao = (data: DeclaracaoAcumulacaoData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE NÃO ACUMULAÇÃO DE CARGOS', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  
  // Corpo do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const cpfFormatado = formatCPFPDF(data.cpf);
  const rgInfo = data.rg ? `, portador(a) do RG nº ${data.rg}${data.rg_orgao_expedidor ? ` - ${data.rg_orgao_expedidor}` : ''}` : '';
  
  let texto = '';
  
  if (data.acumula_cargo) {
    texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, ocupante do cargo de ${data.cargo_nome || '[cargo não informado]'}, lotado(a) no(a) ${data.unidade_nome || 'IDJuv'}, DECLARO, para os devidos fins, que ACUMULO cargo, emprego ou função pública, conforme descrição abaixo:

${data.acumulo_descricao || '[Descrição do acúmulo não informada]'}

Declaro estar ciente de que a acumulação de cargos só é permitida nos casos previstos no Art. 37, inciso XVI, da Constituição Federal de 1988, e que a ocultação de informações ou declaração falsa sujeitará o(a) declarante às penalidades previstas em lei.`;
  } else {
    texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, ocupante do cargo de ${data.cargo_nome || '[cargo não informado]'}, lotado(a) no(a) ${data.unidade_nome || 'IDJuv'}, DECLARO, para os devidos fins, que NÃO ACUMULO cargo, emprego ou função pública na Administração Pública Federal, Estadual ou Municipal, direta ou indireta, incluindo autarquias, fundações, empresas públicas, sociedades de economia mista e fundações mantidas pelo Poder Público.

Declaro estar ciente de que a acumulação ilícita de cargos, empregos ou funções públicas sujeitará o(a) declarante às penalidades previstas em lei, incluindo a restituição dos valores indevidamente recebidos.`;
  }
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  y += textLines.length * 6 + 20;
  
  // Compromisso
  doc.setFont('helvetica', 'normal');
  const compromisso = 'Comprometo-me a comunicar imediatamente ao Departamento de Recursos Humanos do IDJUV qualquer alteração na situação aqui declarada.';
  const compLines = doc.splitTextToSize(compromisso, contentWidth);
  doc.text(compLines, margin, y);
  y += compLines.length * 6 + 10;
  
  // Responsabilidade
  const responsabilidade = 'Declaro estar ciente de que respondo civil, penal e administrativamente pela veracidade das informações aqui prestadas.';
  const respLines = doc.splitTextToSize(responsabilidade, contentWidth);
  doc.text(respLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 70;
  doc.setFont('helvetica', 'normal');
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, pageWidth / 2, y, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(data.nome_completo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CPF: ${cpfFormatado}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Declaracao_Acumulacao_${nomeArquivo}.pdf`);
};

// ============================================================
// DECLARAÇÃO DE BENS E VALORES
// ============================================================

interface DeclaracaoBensData {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  cargo_nome?: string | null;
  unidade_nome?: string | null;
  data_admissao?: string | null;
}

export const generateDeclaracaoBens = (data: DeclaracaoBensData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE BENS E VALORES', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Art. 13 da Lei nº 8.429/92 - Lei de Improbidade Administrativa)', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  
  // Corpo do documento
  doc.setFontSize(11);
  
  const cpfFormatado = formatCPFPDF(data.cpf);
  const rgInfo = data.rg ? `, portador(a) do RG nº ${data.rg}${data.rg_orgao_expedidor ? ` - ${data.rg_orgao_expedidor}` : ''}` : '';
  
  const texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, ocupante do cargo de ${data.cargo_nome || '[cargo não informado]'}, lotado(a) no(a) ${data.unidade_nome || 'IDJuv'}, DECLARO, sob as penas da lei, que possuo os seguintes bens e valores que integram meu patrimônio:`;
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  y += textLines.length * 6 + 15;
  
  // Quadro para preenchimento
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  
  // Cabeçalho da tabela
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIÇÃO DO BEM/VALOR', margin + 5, y + 5.5);
  doc.text('VALOR (R$)', pageWidth - margin - 30, y + 5.5);
  y += 8;
  
  // Linhas em branco para preenchimento
  for (let i = 0; i < 8; i++) {
    doc.rect(margin, y, contentWidth, 8, 'D');
    y += 8;
  }
  
  // Linha de total
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 5, y + 5.5);
  doc.text('R$', pageWidth - margin - 30, y + 5.5);
  y += 15;
  
  // Observação
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const obs = '( ) DECLARO não possuir bens e valores a declarar.';
  doc.text(obs, margin, y);
  y += 10;
  
  // Responsabilidade
  doc.setFontSize(10);
  const responsabilidade = 'Declaro estar ciente de que a apresentação de declaração falsa importará em sanções civis, penais e administrativas, nos termos da Lei nº 8.429/92.';
  const respLines = doc.splitTextToSize(responsabilidade, contentWidth);
  doc.text(respLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 65;
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(data.nome_completo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CPF: ${cpfFormatado}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Declaracao_Bens_${nomeArquivo}.pdf`);
};

// ============================================================
// DECLARAÇÃO DE RESIDÊNCIA
// ============================================================

interface DeclaracaoResidenciaData {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
}

export const generateDeclaracaoResidencia = (data: DeclaracaoResidenciaData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE RESIDÊNCIA', pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  
  // Corpo do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const cpfFormatado = formatCPFPDF(data.cpf);
  const rgInfo = data.rg ? `, portador(a) do RG nº ${data.rg}${data.rg_orgao_expedidor ? ` - ${data.rg_orgao_expedidor}` : ''}` : '';
  
  const endereco = data.endereco_logradouro 
    ? `${data.endereco_logradouro}, nº ${data.endereco_numero || 'S/N'}${data.endereco_complemento ? `, ${data.endereco_complemento}` : ''}, Bairro ${data.endereco_bairro || '[não informado]'}, ${data.endereco_cidade || '[cidade não informada]'}/${data.endereco_uf || 'RR'}${data.endereco_cep ? `, CEP: ${data.endereco_cep}` : ''}`
    : '[endereço não informado]';
  
  const texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, DECLARO, para os devidos fins e sob as penas da lei, que resido no seguinte endereço:

${endereco}

Declaro, ainda, que as informações acima prestadas são verdadeiras e que estou ciente de que a falsidade das informações configura crime previsto no Código Penal Brasileiro, passível de apuração na forma da Lei.`;
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 70;
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, pageWidth / 2, y, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(data.nome_completo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CPF: ${cpfFormatado}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Declaracao_Residencia_${nomeArquivo}.pdf`);
};

// ============================================================
// FICHA CADASTRAL EM BRANCO: o mesmo modelo, sem servidor (rótulos com linha para preencher)
// ============================================================

export const generateFichaCadastralModelo = async (): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { local: localDaSede() }));
};

// ============================================================
// DECLARAÇÃO DE ACUMULAÇÃO EM BRANCO (MODELO)
// ============================================================

export const generateDeclaracaoAcumulacaoModelo = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE NÃO ACUMULAÇÃO DE CARGOS', pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  
  // Corpo do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const texto1 = 'Eu, ______________________________________________________________, inscrito(a) no CPF sob o nº ___________________, portador(a) do RG nº ___________________, ocupante do cargo de _____________________________________________, lotado(a) no(a) _____________________________________________, DECLARO, para os devidos fins, que:';
  
  const textLines1 = doc.splitTextToSize(texto1, contentWidth);
  doc.text(textLines1, margin, y);
  y += textLines1.length * 6 + 15;
  
  // Opções
  doc.text('(   ) NÃO ACUMULO cargo, emprego ou função pública na Administração Pública Federal,', margin, y);
  y += 6;
  doc.text('       Estadual ou Municipal, direta ou indireta.', margin, y);
  y += 12;
  
  doc.text('(   ) ACUMULO cargo, emprego ou função pública, conforme descrição abaixo:', margin, y);
  y += 10;
  
  // Linhas para descrição
  doc.setDrawColor(180, 180, 180);
  for (let i = 0; i < 4; i++) {
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  }
  
  y += 10;
  
  // Compromisso
  const compromisso = 'Declaro estar ciente de que a acumulação ilícita de cargos, empregos ou funções públicas sujeitará o(a) declarante às penalidades previstas em lei. Comprometo-me a comunicar imediatamente ao Departamento de Recursos Humanos do IDJUV qualquer alteração na situação aqui declarada.';
  const compLines = doc.splitTextToSize(compromisso, contentWidth);
  doc.text(compLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 70;
  doc.text('Boa Vista/RR, ______ de ____________________ de ________.', pageWidth / 2, y, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text('Assinatura do Servidor', pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Modelo de Declaração - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.save('Modelo_Declaracao_Acumulacao_IDJUV.pdf');
};

// ============================================================
// DECLARAÇÃO DE BENS EM BRANCO (MODELO)
// ============================================================

export const generateDeclaracaoBensModelo = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE BENS E VALORES', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Art. 13 da Lei nº 8.429/92 - Lei de Improbidade Administrativa)', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  
  // Corpo do documento
  doc.setFontSize(11);
  
  const texto = 'Eu, ______________________________________________________________, inscrito(a) no CPF sob o nº ___________________, portador(a) do RG nº ___________________, ocupante do cargo de _____________________________________________, lotado(a) no(a) _____________________________________________, DECLARO, sob as penas da lei, que possuo os seguintes bens e valores:';
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  y += textLines.length * 6 + 15;
  
  // Quadro para preenchimento
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  
  // Cabeçalho da tabela
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIÇÃO DO BEM/VALOR', margin + 5, y + 5.5);
  doc.text('VALOR (R$)', pageWidth - margin - 30, y + 5.5);
  y += 8;
  
  // Linhas em branco para preenchimento
  for (let i = 0; i < 10; i++) {
    doc.rect(margin, y, contentWidth, 8, 'D');
    y += 8;
  }
  
  // Linha de total
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 5, y + 5.5);
  doc.text('R$', pageWidth - margin - 30, y + 5.5);
  y += 15;
  
  // Observação
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('(   ) DECLARO não possuir bens e valores a declarar.', margin, y);
  
  // Data e assinatura
  y = pageHeight - 55;
  doc.setFontSize(11);
  doc.text('Boa Vista/RR, ______ de ____________________ de ________.', pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text('Assinatura do Servidor', pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Modelo de Declaração - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.save('Modelo_Declaracao_Bens_IDJUV.pdf');
};
