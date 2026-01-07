/**
 * Geração de Termo de Responsabilidade pelo Uso do Espaço Público - IDJUV
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
  addCheckbox,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  checkPageBreak,
} from './pdfTemplate';

export interface TermoResponsabilidadeData {
  numero: string;
  ano: number;
  // Dados da Unidade
  unidade: string;
  municipio: string;
  endereco?: string;
  // Dados do Responsável
  responsavel: string;
  responsavelDocumento?: string;
  responsavelRg?: string;
  responsavelTelefone?: string;
  responsavelEndereco?: string;
  // Dados do Evento
  evento: string;
  tipoUso: string;
  periodoInicio: string;
  periodoFim: string;
  publicoEstimado?: number;
  // Termos aceitos
  termosAceitos?: boolean;
  dataAceite?: string;
  // Autoridade
  chefeResponsavel?: string;
  dataEmissao: string;
}

export async function generateTermoResponsabilidade(data: TermoResponsabilidadeData): Promise<void> {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);

  // Header institucional
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE RESPONSABILIDADE',
    subtitulo: 'Uso de Espaço Público Esportivo',
    numero: `${data.numero}/${data.ano}`,
    fundoEscuro: true,
  }, logos);

  // Texto introdutório
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const textoIntro = `Eu, ${data.responsavel.toUpperCase()}, portador(a) do CPF nº ${data.responsavelDocumento || '_______________'}, na qualidade de responsável pelo evento/atividade descrito abaixo, DECLARO estar ciente e de acordo com todas as condições estabelecidas neste Termo de Responsabilidade para uso das instalações do INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV.`;
  
  const linhasIntro = doc.splitTextToSize(textoIntro, contentWidth);
  doc.text(linhasIntro, PAGINA.margemEsquerda, y);
  y += linhasIntro.length * 5 + 10;

  // Seção 1 - Identificação da Unidade
  y = addSectionTitle(doc, 'IDENTIFICAÇÃO DO ESPAÇO', y, { numerada: true, numero: 1 });
  
  const col1 = PAGINA.margemEsquerda + 5;
  addField(doc, 'Unidade', data.unidade, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'Município', data.municipio, col1, y, contentWidth - 10);
  y += 10;
  if (data.endereco) {
    addField(doc, 'Endereço', data.endereco, col1, y, contentWidth - 10);
    y += 10;
  }
  y += 2;

  // Seção 2 - Dados do Evento
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, 'DADOS DA ATIVIDADE/EVENTO', y, { numerada: true, numero: 2 });
  
  addField(doc, 'Evento/Atividade', data.evento, col1, y, contentWidth - 10);
  y += 10;
  addField(doc, 'Tipo de Uso', data.tipoUso, col1, y, 80);
  addField(doc, 'Público Estimado', data.publicoEstimado ? `${data.publicoEstimado} pessoas` : '-', col1 + 90, y, 70);
  y += 10;
  addField(doc, 'Período de Início', data.periodoInicio, col1, y, 80);
  addField(doc, 'Período de Término', data.periodoFim, col1 + 90, y, 80);
  y += 12;

  // Seção 3 - Responsabilidades
  y = checkPageBreak(doc, y, 80);
  y = addSectionTitle(doc, 'DECLARAÇÃO DE RESPONSABILIDADE', y, { numerada: true, numero: 3 });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const declaracoes = [
    'Assumo integral responsabilidade pela guarda, conservação e manutenção das instalações e equipamentos do espaço cedido durante todo o período de utilização;',
    'Responsabilizo-me por quaisquer danos causados às instalações, equipamentos e bens do IDJUV, obrigando-me a ressarcir os prejuízos causados;',
    'Comprometo-me a respeitar as normas de segurança, limpeza e uso do espaço, mantendo a ordem durante a realização do evento/atividade;',
    'Responsabilizo-me pela segurança de todos os participantes do evento/atividade, isentando o IDJUV de qualquer responsabilidade por acidentes ou danos;',
    'Comprometo-me a devolver o espaço nas mesmas condições em que o recebi, imediatamente após o término do período autorizado;',
    'Declaro que não sublocarei ou cederéi a terceiros o espaço ora autorizado, sob pena de revogação da autorização;',
    'Comprometo-me a não realizar atividades diferentes das autorizadas no Termo de Autorização de Uso;',
    'Declaro que estou ciente de que o descumprimento de qualquer das condições aqui estabelecidas poderá implicar na revogação da autorização e impossibilidade de novas solicitações.',
  ];
  
  declaracoes.forEach((decl, idx) => {
    y = checkPageBreak(doc, y, 15);
    const numeral = String.fromCharCode(97 + idx); // a, b, c, d...
    const texto = `${numeral}) ${decl}`;
    const lines = doc.splitTextToSize(texto, contentWidth - 10);
    doc.text(lines, col1, y);
    y += lines.length * 4 + 3;
  });
  y += 8;

  // Seção 4 - Ciência e Aceite
  y = checkPageBreak(doc, y, 50);
  y = addSectionTitle(doc, 'CIÊNCIA E ACEITE', y, { numerada: true, numero: 4 });

  // Checkboxes de aceite
  y = addCheckbox(doc, 'Declaro ter lido e compreendido todas as condições deste Termo', true, col1, y);
  y = addCheckbox(doc, 'Aceito assumir todas as responsabilidades aqui descritas', true, col1, y);
  y = addCheckbox(doc, 'Comprometo-me a cumprir integralmente o presente Termo', true, col1, y);
  y += 8;

  // Texto final
  const textoFinal = `Por ser expressão da verdade, firmo o presente Termo de Responsabilidade, comprometendo-me a cumprir fielmente todas as condições nele estabelecidas.`;
  
  const linhasFinal = doc.splitTextToSize(textoFinal, contentWidth);
  doc.text(linhasFinal, PAGINA.margemEsquerda, y);
  y += linhasFinal.length * 5 + 15;

  // Verificar espaço para assinaturas
  y = checkPageBreak(doc, y, 60);

  // Local e Data
  addLocalData(doc, `${data.municipio}/RR`, y);
  y += 15;

  // Assinaturas
  addSignatureArea(doc, [
    { cargo: 'RESPONSÁVEL', nome: data.responsavel },
    { cargo: 'TESTEMUNHA' },
  ], y);

  y += 25;
  y = checkPageBreak(doc, y, 30);

  // Espaço para carimbo e assinatura do IDJUV
  setColor(doc, CORES.cinzaMedio);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Conferido e recebido pelo IDJUV em ___/___/______', width / 2, y, { align: 'center' });
  y += 15;

  addSignatureArea(doc, [
    { cargo: 'REPRESENTANTE IDJUV', nome: data.chefeResponsavel || undefined },
  ], y);

  // Rodapé
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Governança Digital IDJUV' });
  addPageNumbers(doc);

  doc.save(`Termo_Responsabilidade_${data.numero.replace('/', '_')}_${data.ano}.pdf`);
}
