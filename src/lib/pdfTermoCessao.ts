/**
 * Geração de Termo de Cessão de Uso - IDJUV
 * Utiliza template institucional unificado
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionTitle,
  addField,
  addSignatureArea,
  addLocalData,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
} from './pdfTemplate';

interface TermoCessaoData {
  numero: string;
  unidade: string;
  municipio: string;
  cessionario: string;
  cessionarioDocumento: string;
  finalidade: string;
  periodoInicio: string;
  periodoFim: string;
  chefeResponsavel: string;
  dataEmissao: string;
}

export async function generateTermoCessao(data: TermoCessaoData): Promise<void> {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);

  // Header institucional
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE CESSÃO DE USO',
    numero: data.numero,
    fundoEscuro: true,
  }, logos);

  // Texto introdutório
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const textoIntro = `O INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV, Autarquia vinculada ao Governo do Estado de Roraima, por intermédio de seu representante legal, CEDE o uso temporário das instalações da unidade esportiva abaixo identificada, mediante as condições estabelecidas neste Termo.`;
  
  const linhasIntro = doc.splitTextToSize(textoIntro, contentWidth);
  doc.text(linhasIntro, PAGINA.margemEsquerda, y);
  y += linhasIntro.length * 5 + 10;

  // Seção 1 - Identificação da Unidade
  y = addSectionTitle(doc, 'IDENTIFICAÇÃO DA UNIDADE', y, { numerada: true, numero: 1 });
  
  const col1 = PAGINA.margemEsquerda + 5;
  addField(doc, 'Unidade', data.unidade, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'Município', data.municipio, col1, y, contentWidth - 10);
  y += 12;

  // Seção 2 - Cessionário
  y = addSectionTitle(doc, 'CESSIONÁRIO', y, { numerada: true, numero: 2 });
  
  addField(doc, 'Nome/Razão Social', data.cessionario, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'CPF/CNPJ', data.cessionarioDocumento || '___________________', col1, y, contentWidth - 10);
  y += 12;

  // Seção 3 - Finalidade
  y = addSectionTitle(doc, 'FINALIDADE', y, { numerada: true, numero: 3 });
  
  const linhasFinalidade = doc.splitTextToSize(data.finalidade, contentWidth - 10);
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(linhasFinalidade, col1, y);
  y += linhasFinalidade.length * 4 + 8;

  // Seção 4 - Período
  y = addSectionTitle(doc, 'PERÍODO DE USO', y, { numerada: true, numero: 4 });
  
  addField(doc, 'Início', data.periodoInicio, col1, y, 80);
  addField(doc, 'Término', data.periodoFim, col1 + 90, y, 80);
  y += 12;

  // Seção 5 - Obrigações
  y = addSectionTitle(doc, 'OBRIGAÇÕES DO CESSIONÁRIO', y, { numerada: true, numero: 5 });
  
  const obrigacoes = [
    'a) Zelar pela conservação das instalações e equipamentos cedidos;',
    'b) Responsabilizar-se por eventuais danos causados às instalações;',
    'c) Respeitar as normas de uso da unidade esportiva;',
    'd) Devolver as instalações nas mesmas condições em que foram recebidas;',
    'e) Não transferir a terceiros os direitos de uso ora cedidos.',
  ];
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  obrigacoes.forEach((obr) => {
    doc.text(obr, col1, y);
    y += 5;
  });
  y += 8;

  // Seção 6 - Disposições Gerais
  y = addSectionTitle(doc, 'DISPOSIÇÕES GERAIS', y, { numerada: true, numero: 6 });
  
  const disposicoes = `A presente cessão de uso é gratuita e não gera qualquer vínculo empregatício ou responsabilidade do IDJUV por danos a terceiros ocorridos durante o período de utilização da unidade.`;
  
  const linhasDisp = doc.splitTextToSize(disposicoes, contentWidth);
  doc.text(linhasDisp, PAGINA.margemEsquerda, y);
  y += linhasDisp.length * 5 + 20;

  // Assinaturas
  const assinaturaY = Math.max(y, height - 70);
  
  addSignatureArea(doc, [
    { cargo: 'CESSIONÁRIO' },
    { cargo: 'CEDENTE', nome: data.chefeResponsavel || undefined },
  ], assinaturaY);

  // Local e Data
  addLocalData(doc, `${data.municipio}/RR`, assinaturaY + 25);

  // Rodapé
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Governança Digital IDJUV' });
  addPageNumbers(doc);

  doc.save(`Termo_Cessao_${data.numero.replace('/', '_')}.pdf`);
}
