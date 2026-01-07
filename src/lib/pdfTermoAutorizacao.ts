/**
 * Geração de Termo de Autorização de Uso - IDJUV
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
  checkPageBreak,
} from './pdfTemplate';

export interface TermoAutorizacaoData {
  numero: string;
  ano: number;
  // Dados da Unidade
  unidade: string;
  municipio: string;
  endereco?: string;
  capacidade?: number;
  areasUtilizadas?: string[];
  // Dados do Solicitante
  solicitante: string;
  solicitanteDocumento?: string;
  solicitanteTelefone?: string;
  solicitanteEmail?: string;
  solicitanteEndereco?: string;
  tipoSolicitante?: string;
  responsavelLegal?: string;
  // Dados do Evento
  evento: string;
  tipoUso: string;
  finalidade?: string;
  publicoEstimado?: number;
  periodoInicio: string;
  periodoFim: string;
  horarioDiario?: string;
  // Autoridade
  autoridadeConcedente?: string;
  autoridadeCargo?: string;
  chefeResponsavel?: string;
  dataEmissao: string;
}

export async function generateTermoAutorizacao(data: TermoAutorizacaoData): Promise<void> {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);

  // Header institucional
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE AUTORIZAÇÃO DE USO',
    numero: `${data.numero}/${data.ano}`,
    fundoEscuro: true,
  }, logos);

  // Texto introdutório
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const textoIntro = `O INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV, Autarquia vinculada ao Governo do Estado de Roraima, inscrito no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede na cidade de Boa Vista/RR, por intermédio de seu representante legal, no uso de suas atribuições legais e regulamentares, AUTORIZA o uso temporário e precário das instalações da unidade esportiva abaixo identificada, mediante as condições estabelecidas neste Termo.`;
  
  const linhasIntro = doc.splitTextToSize(textoIntro, contentWidth);
  doc.text(linhasIntro, PAGINA.margemEsquerda, y);
  y += linhasIntro.length * 5 + 10;

  // Seção 1 - Identificação da Unidade
  y = addSectionTitle(doc, 'IDENTIFICAÇÃO DA UNIDADE ESPORTIVA', y, { numerada: true, numero: 1 });
  
  const col1 = PAGINA.margemEsquerda + 5;
  addField(doc, 'Unidade', data.unidade, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'Município', data.municipio, col1, y, 80);
  addField(doc, 'Capacidade', data.capacidade ? `${data.capacidade} pessoas` : '-', col1 + 90, y, 70);
  y += 10;
  if (data.endereco) {
    addField(doc, 'Endereço', data.endereco, col1, y, contentWidth - 10);
    y += 10;
  }
  if (data.areasUtilizadas && data.areasUtilizadas.length > 0) {
    addField(doc, 'Áreas Utilizadas', data.areasUtilizadas.join(', '), col1, y, contentWidth - 10);
    y += 10;
  }
  y += 2;

  // Seção 2 - Solicitante/Cessionário
  y = checkPageBreak(doc, y, 50);
  y = addSectionTitle(doc, 'DADOS DO SOLICITANTE/CESSIONÁRIO', y, { numerada: true, numero: 2 });
  
  addField(doc, 'Nome/Razão Social', data.solicitante, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'CPF/CNPJ', data.solicitanteDocumento || '-', col1, y, 80);
  addField(doc, 'Tipo', data.tipoSolicitante || '-', col1 + 90, y, 70);
  y += 10;
  if (data.solicitanteTelefone || data.solicitanteEmail) {
    addField(doc, 'Telefone', data.solicitanteTelefone || '-', col1, y, 80);
    addField(doc, 'E-mail', data.solicitanteEmail || '-', col1 + 90, y, 70);
    y += 10;
  }
  if (data.solicitanteEndereco) {
    addField(doc, 'Endereço', data.solicitanteEndereco, col1, y, contentWidth - 10);
    y += 10;
  }
  if (data.responsavelLegal) {
    addField(doc, 'Responsável Legal', data.responsavelLegal, col1, y, contentWidth - 10);
    y += 10;
  }
  y += 2;

  // Seção 3 - Dados do Evento
  y = checkPageBreak(doc, y, 50);
  y = addSectionTitle(doc, 'DADOS DO EVENTO/ATIVIDADE', y, { numerada: true, numero: 3 });
  
  addField(doc, 'Evento/Atividade', data.evento, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'Tipo de Uso', data.tipoUso, col1, y, 80);
  addField(doc, 'Público Estimado', data.publicoEstimado ? `${data.publicoEstimado} pessoas` : '-', col1 + 90, y, 70);
  y += 10;
  if (data.finalidade) {
    const linhasFinalidade = doc.splitTextToSize(data.finalidade, contentWidth - 10);
    addField(doc, 'Finalidade', '', col1, y, contentWidth - 10);
    y += 4;
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(linhasFinalidade, col1, y);
    y += linhasFinalidade.length * 4 + 4;
  }
  y += 2;

  // Seção 4 - Período
  y = checkPageBreak(doc, y, 30);
  y = addSectionTitle(doc, 'PERÍODO DE AUTORIZAÇÃO', y, { numerada: true, numero: 4 });
  
  addField(doc, 'Data/Hora Início', data.periodoInicio, col1, y, 80);
  addField(doc, 'Data/Hora Término', data.periodoFim, col1 + 90, y, 80);
  y += 10;
  if (data.horarioDiario) {
    addField(doc, 'Horário Diário', data.horarioDiario, col1, y, contentWidth - 10);
    y += 10;
  }
  y += 2;

  // Seção 5 - Condições
  y = checkPageBreak(doc, y, 60);
  y = addSectionTitle(doc, 'CONDIÇÕES E OBRIGAÇÕES', y, { numerada: true, numero: 5 });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const condicoes = [
    'a) A presente autorização é concedida a título precário e gratuito;',
    'b) O CESSIONÁRIO deverá zelar pela conservação das instalações e equipamentos;',
    'c) O CESSIONÁRIO assume total responsabilidade por eventuais danos às instalações;',
    'd) O CESSIONÁRIO deverá respeitar as normas de uso do espaço;',
    'e) É vedada a cessão ou transferência desta autorização a terceiros;',
    'f) O CESSIONÁRIO deverá restituir as instalações nas condições recebidas;',
    'g) O IDJUV poderá revogar esta autorização a qualquer tempo;',
    'h) O CESSIONÁRIO será responsável pela segurança dos participantes do evento.',
  ];
  
  condicoes.forEach((cond) => {
    const lines = doc.splitTextToSize(cond, contentWidth - 10);
    doc.text(lines, col1, y);
    y += lines.length * 4 + 2;
  });
  y += 6;

  // Seção 6 - Disposições Finais
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, 'DISPOSIÇÕES FINAIS', y, { numerada: true, numero: 6 });
  
  const disposicoes = `A presente autorização não gera qualquer vínculo empregatício, societário ou associativo entre o IDJUV e o CESSIONÁRIO, tampouco responsabilidade do IDJUV por quaisquer danos causados a terceiros durante a utilização do espaço. O CESSIONÁRIO declara ter ciência e concordar com todas as condições estabelecidas neste Termo.`;
  
  const linhasDisp = doc.splitTextToSize(disposicoes, contentWidth);
  doc.text(linhasDisp, PAGINA.margemEsquerda, y);
  y += linhasDisp.length * 5 + 15;

  // Verificar espaço para assinaturas
  y = checkPageBreak(doc, y, 60);

  // Local e Data
  addLocalData(doc, `${data.municipio}/RR`, y);
  y += 15;

  // Assinaturas
  addSignatureArea(doc, [
    { cargo: 'CESSIONÁRIO', nome: data.solicitante },
    { cargo: 'CEDENTE - IDJUV', nome: data.chefeResponsavel || data.autoridadeConcedente || undefined },
  ], y);

  // Rodapé
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Governança Digital IDJUV' });
  addPageNumbers(doc);

  doc.save(`Termo_Autorizacao_${data.numero.replace('/', '_')}_${data.ano}.pdf`);
}
