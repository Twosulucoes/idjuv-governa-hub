import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DadosPortaria {
  numero: string;
  data_documento: string;
  ementa?: string;
  conteudo?: string;
}

interface DadosServidor {
  nome_completo: string;
  cpf: string;
  matricula?: string;
}

interface DadosCargo {
  nome: string;
  sigla?: string;
  simbolo?: string;
}

interface DadosUnidade {
  nome: string;
  sigla?: string;
}

// Configurações do documento
const CONFIG = {
  marginLeft: 25,
  marginRight: 25,
  marginTop: 30,
  marginBottom: 25,
  pageWidth: 210,
  pageHeight: 297,
  headerHeight: 35,
};

// Função auxiliar para formatar data por extenso
function formatarDataExtenso(dataString: string): string {
  const data = new Date(dataString + 'T00:00:00');
  return format(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Função auxiliar para formatar CPF
function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Adiciona cabeçalho padrão
function addHeader(doc: jsPDF) {
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;
  
  // Brasão (simulado com texto)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GOVERNO DO ESTADO DE RORAIMA', CONFIG.pageWidth / 2, CONFIG.marginTop, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA', CONFIG.pageWidth / 2, CONFIG.marginTop + 5, { align: 'center' });
  doc.text('IDJUV', CONFIG.pageWidth / 2, CONFIG.marginTop + 10, { align: 'center' });
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(CONFIG.marginLeft, CONFIG.marginTop + 15, CONFIG.pageWidth - CONFIG.marginRight, CONFIG.marginTop + 15);
}

// Adiciona rodapé padrão
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const footerY = CONFIG.pageHeight - CONFIG.marginBottom + 10;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Página ${pageNumber} de ${totalPages}`, CONFIG.pageWidth / 2, footerY, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text('Av. Brigadeiro Eduardo Gomes, 4124 - Aeroporto - CEP: 69.310-005 - Boa Vista/RR', CONFIG.pageWidth / 2, footerY + 4, { align: 'center' });
}

// Gera PDF de Portaria de Nomeação
export function generatePortariaNomeacao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidade: DadosUnidade,
  tipoNomeacao: 'comissionado' | 'efetivo' = 'comissionado'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addHeader(doc);

  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`PORTARIA Nº ${portaria.numero}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Boa Vista-RR, ${formatarDataExtenso(portaria.data_documento)}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Ementa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const ementa = portaria.ementa || `Nomeia servidor para cargo ${tipoNomeacao === 'comissionado' ? 'em comissão' : 'efetivo'}.`;
  const ementaLines = doc.splitTextToSize(ementa, contentWidth - 40);
  doc.text(ementaLines, CONFIG.marginLeft + 40, y);
  y += ementaLines.length * 5 + 10;

  // Corpo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += preambuloLines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  
  let artigo1: string;
  if (tipoNomeacao === 'comissionado') {
    artigo1 = `Art. 1º NOMEAR ${servidor.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(servidor.cpf)}, para exercer o cargo em comissão de ${cargo.nome}${cargo.simbolo ? `, símbolo ${cargo.simbolo}` : ''}, no(a) ${unidade.nome}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.`;
  } else {
    artigo1 = `Art. 1º NOMEAR ${servidor.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(servidor.cpf)}, aprovado(a) em concurso público, para exercer o cargo efetivo de ${cargo.nome}, no(a) ${unidade.nome}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.`;
  }
  
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo1Lines.length * 5 + 8;

  if (tipoNomeacao === 'efetivo') {
    const artigo2 = 'Art. 2º O(A) servidor(a) terá o prazo de 30 (trinta) dias para tomar posse, nos termos da legislação vigente.';
    const artigo2Lines = doc.splitTextToSize(artigo2, contentWidth);
    doc.text(artigo2Lines, CONFIG.marginLeft, y, { align: 'justify' });
    y += artigo2Lines.length * 5 + 8;
  }

  const artigoFinal = tipoNomeacao === 'efetivo' ? 'Art. 3º' : 'Art. 2º';
  doc.text(`${artigoFinal} Esta Portaria entra em vigor na data de sua publicação.`, CONFIG.marginLeft, y);
  y += 25;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text('_'.repeat(40), CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('[NOME DO PRESIDENTE]', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Presidente do IDJUV', CONFIG.pageWidth / 2, y, { align: 'center' });

  addFooter(doc, 1, 1);

  return doc;
}

// Gera PDF de Portaria de Exoneração
export function generatePortariaExoneracao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidade: DadosUnidade,
  motivo: 'pedido' | 'oficio' = 'pedido'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addHeader(doc);

  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`PORTARIA Nº ${portaria.numero}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Boa Vista-RR, ${formatarDataExtenso(portaria.data_documento)}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Ementa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const ementa = portaria.ementa || `Exonera servidor ${motivo === 'pedido' ? 'a pedido' : 'de ofício'}.`;
  const ementaLines = doc.splitTextToSize(ementa, contentWidth - 40);
  doc.text(ementaLines, CONFIG.marginLeft + 40, y);
  y += ementaLines.length * 5 + 10;

  // Corpo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += preambuloLines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  
  const motivoTexto = motivo === 'pedido' ? 'a pedido' : 'de ofício';
  const artigo1 = `Art. 1º EXONERAR, ${motivoTexto}, ${servidor.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(servidor.cpf)}, do cargo de ${cargo.nome}, no(a) ${unidade.nome}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.`;
  
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo1Lines.length * 5 + 8;

  doc.text('Art. 2º Esta Portaria entra em vigor na data de sua publicação.', CONFIG.marginLeft, y);
  y += 25;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text('_'.repeat(40), CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('[NOME DO PRESIDENTE]', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Presidente do IDJUV', CONFIG.pageWidth / 2, y, { align: 'center' });

  addFooter(doc, 1, 1);

  return doc;
}

// Gera PDF de Portaria de Designação
export function generatePortariaDesignacao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidadeOrigem: DadosUnidade,
  unidadeDestino: DadosUnidade,
  dataInicio: string,
  dataFim?: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addHeader(doc);

  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`PORTARIA Nº ${portaria.numero}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Boa Vista-RR, ${formatarDataExtenso(portaria.data_documento)}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Ementa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const ementa = portaria.ementa || 'Designa servidor para exercício em outra unidade.';
  const ementaLines = doc.splitTextToSize(ementa, contentWidth - 40);
  doc.text(ementaLines, CONFIG.marginLeft + 40, y);
  y += ementaLines.length * 5 + 10;

  // Corpo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += preambuloLines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  
  const artigo1 = `Art. 1º DESIGNAR ${servidor.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(servidor.cpf)}, ocupante do cargo de ${cargo.nome}, lotado(a) no(a) ${unidadeOrigem.nome}, para exercer suas atividades no(a) ${unidadeDestino.nome}, sem prejuízo de sua lotação original.`;
  
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo1Lines.length * 5 + 8;

  const periodoTexto = dataFim 
    ? `de ${formatarDataExtenso(dataInicio)} a ${formatarDataExtenso(dataFim)}`
    : `a partir de ${formatarDataExtenso(dataInicio)}, por prazo indeterminado`;
  
  const artigo2 = `Art. 2º A designação terá vigência ${periodoTexto}.`;
  const artigo2Lines = doc.splitTextToSize(artigo2, contentWidth);
  doc.text(artigo2Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo2Lines.length * 5 + 8;

  doc.text('Art. 3º Esta Portaria entra em vigor na data de sua publicação.', CONFIG.marginLeft, y);
  y += 25;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text('_'.repeat(40), CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('[NOME DO PRESIDENTE]', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Presidente do IDJUV', CONFIG.pageWidth / 2, y, { align: 'center' });

  addFooter(doc, 1, 1);

  return doc;
}

// Gera PDF de Portaria Coletiva (múltiplos servidores)
export function generatePortariaColetiva(
  portaria: DadosPortaria,
  servidores: Array<{
    nome_completo: string;
    cpf: string;
    cargo: string;
    unidade: string;
  }>,
  tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addHeader(doc);

  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`PORTARIA Nº ${portaria.numero}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Boa Vista-RR, ${formatarDataExtenso(portaria.data_documento)}`, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Ementa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const acaoTexto = tipoAcao === 'nomeacao' ? 'Nomeia servidores' : 'Exonera servidores';
  const ementa = portaria.ementa || `${acaoTexto} para cargos em comissão.`;
  const ementaLines = doc.splitTextToSize(ementa, contentWidth - 40);
  doc.text(ementaLines, CONFIG.marginLeft + 40, y);
  y += ementaLines.length * 5 + 10;

  // Corpo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += preambuloLines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  
  const verbo = tipoAcao === 'nomeacao' ? 'NOMEAR' : 'EXONERAR';
  const artigo1Intro = `Art. 1º ${verbo} os servidores abaixo relacionados para os respectivos cargos no Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV:`;
  const artigo1IntroLines = doc.splitTextToSize(artigo1Intro, contentWidth);
  doc.text(artigo1IntroLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo1IntroLines.length * 5 + 8;

  // Lista de servidores
  servidores.forEach((s, index) => {
    if (y > CONFIG.pageHeight - 60) {
      doc.addPage();
      addHeader(doc);
      y = CONFIG.marginTop + 25;
    }
    
    const linha = `${index + 1}. ${s.nome_completo.toUpperCase()}, CPF nº ${formatarCPF(s.cpf)}, cargo de ${s.cargo}, ${s.unidade};`;
    const linhaLines = doc.splitTextToSize(linha, contentWidth - 10);
    doc.text(linhaLines, CONFIG.marginLeft + 5, y);
    y += linhaLines.length * 5 + 3;
  });

  y += 5;
  doc.text('Art. 2º Esta Portaria entra em vigor na data de sua publicação.', CONFIG.marginLeft, y);
  y += 25;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text('_'.repeat(40), CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('[NOME DO PRESIDENTE]', CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Presidente do IDJUV', CONFIG.pageWidth / 2, y, { align: 'center' });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  return doc;
}
