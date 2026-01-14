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

// Função auxiliar para formatar data para cabeçalho da portaria (DD DE MES DE AAAA)
function formatarDataCabecalhoPortaria(dataString: string): string {
  const data = new Date(dataString + 'T00:00:00');
  const dia = format(data, 'dd', { locale: ptBR });
  const mes = format(data, 'MMMM', { locale: ptBR }).toUpperCase();
  const ano = format(data, 'yyyy', { locale: ptBR });
  return `${dia} DE ${mes} DE ${ano}`;
}

// Função auxiliar para formatar número da portaria no padrão oficial
// Formato: PORTARIA Nº XXX/IDJuv/PRESI/GAB/AAAA DE DD DE MES DE AAAA
function formatarCabecalhoPortaria(numero: string, dataDocumento: string): string {
  const dataFormatada = formatarDataCabecalhoPortaria(dataDocumento);
  const ano = new Date(dataDocumento + 'T00:00:00').getFullYear();
  // Extrai apenas o número (remove /ano se já existir)
  const numeroLimpo = numero.split('/')[0];
  return `PORTARIA Nº ${numeroLimpo}/IDJuv/PRESI/GAB/${ano} DE ${dataFormatada}`;
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

// Configurações do Presidente (pode ser personalizado)
const PRESIDENTE = {
  nome: 'MARCELO DE MAGALHÃES NUNES',
  cargo: 'Presidente do Instituto de Desporto, Juventude e Lazer',
  orgao: 'do Estado de Roraima',
};

// Gera PDF de Portaria de Nomeação
export function generatePortariaNomeacao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidade: DadosUnidade,
  tipoNomeacao: 'comissionado' | 'efetivo' = 'comissionado',
  dataEfeitos?: string // Data para "efeitos a contar de"
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addHeader(doc);

  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  // Título - PORTARIA Nº ___/IDJuv/PRESI/GAB/AAAA DE DD DE MES DE AAAA
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 10;

  // Preâmbulo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += preambuloLines.length * 5 + 8;

  // CONSIDERANDO
  const considerando = 'CONSIDERANDO o disposto no art. 7º, §3º, da Lei nº 2.301/2025, que estabelece que a investidura nos cargos em comissão do IDJuv dar-se-á por ato do Diretor Presidente;';
  const considerandoLines = doc.splitTextToSize(considerando, contentWidth);
  doc.text(considerandoLines, CONFIG.marginLeft, y, { align: 'justify' });
  y += considerandoLines.length * 5 + 10;

  // RESOLVE
  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.marginLeft, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  
  // Art. 1º - NOMEAR
  const simboloTexto = cargo.simbolo ? `, código ${cargo.simbolo}` : '';
  const artigo1 = `Art. 1º NOMEAR ${servidor.nome_completo.toUpperCase()}, para exercer o cargo em comissão de ${cargo.nome.toUpperCase()}${simboloTexto}, integrante da estrutura organizacional do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv.`;
  
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo1Lines.length * 5 + 8;

  // Art. 2º - Remuneração
  const artigo2 = 'Art. 2º A nomeada fará jus à remuneração correspondente ao cargo, conforme disposto no Anexo I da Lei nº 2.301, de 29 de dezembro de 2025.';
  const artigo2Lines = doc.splitTextToSize(artigo2, contentWidth);
  doc.text(artigo2Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo2Lines.length * 5 + 8;

  // Art. 3º - Vigência
  const dataEfeitosTexto = dataEfeitos 
    ? formatarDataExtenso(dataEfeitos)
    : `___ de __________ de ${new Date().getFullYear()}`;
  const artigo3 = `Art. 3º Esta Portaria entra em vigor na data de sua publicação, com efeitos a contar de ${dataEfeitosTexto}.`;
  const artigo3Lines = doc.splitTextToSize(artigo3, contentWidth);
  doc.text(artigo3Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo3Lines.length * 5 + 20;

  // Local e data
  const dataDocumentoTexto = formatarDataExtenso(portaria.data_documento);
  doc.text(`Boa Vista – RR, ${dataDocumentoTexto}.`, CONFIG.marginLeft, y);
  y += 20;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text(PRESIDENTE.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(PRESIDENTE.cargo, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(PRESIDENTE.orgao, CONFIG.pageWidth / 2, y, { align: 'center' });

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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 5;

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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 5;

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
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 5;

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

// Gera PDF de Portaria Coletiva COM TABELA (Nome, CPF, Cargo, Código)
export function generatePortariaColetivaComTabela(
  portaria: { numero: string; data_documento: string },
  cabecalho: string,
  servidores: Array<{
    nome_completo: string;
    cpf: string;
    cargo: string;
    codigo: string;
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

  // Título - PORTARIA Nº ___/IDJuv/PRESI/GAB/AAAA DE DD DE MES DE AAAA
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 10;

  // Cabeçalho personalizado (preâmbulo)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const cabecalhoLines = doc.splitTextToSize(cabecalho, contentWidth);
  cabecalhoLines.forEach((line: string) => {
    if (y > CONFIG.pageHeight - 50) {
      doc.addPage();
      addHeader(doc);
      y = CONFIG.marginTop + 25;
    }
    doc.text(line, CONFIG.marginLeft, y);
    y += 5;
  });
  y += 8;

  // Art. 1º - Introdução
  const verbo = tipoAcao === 'nomeacao' ? 'NOMEAR' : 'EXONERAR';
  const artigo1 = `Art. 1º ${verbo} os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv:`;
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo1Lines.length * 5 + 8;

  // Tabela
  const colWidths = {
    num: 10,
    nome: 70,
    cpf: 35,
    cargo: 35,
    codigo: 20,
  };
  const tableWidth = colWidths.num + colWidths.nome + colWidths.cpf + colWidths.cargo + colWidths.codigo;
  const tableX = CONFIG.marginLeft;
  const rowHeight = 7;

  // Cabeçalho da tabela
  const drawTableHeader = () => {
    doc.setFillColor(240, 240, 240);
    doc.rect(tableX, y, tableWidth, rowHeight, 'F');
    doc.setDrawColor(100);
    doc.rect(tableX, y, tableWidth, rowHeight);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let colX = tableX;
    doc.text('Nº', colX + colWidths.num / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.num, y, colX + colWidths.num, y + rowHeight);
    colX += colWidths.num;
    
    doc.text('Nome Completo', colX + 2, y + 5);
    doc.line(colX + colWidths.nome, y, colX + colWidths.nome, y + rowHeight);
    colX += colWidths.nome;
    
    doc.text('CPF', colX + colWidths.cpf / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.cpf, y, colX + colWidths.cpf, y + rowHeight);
    colX += colWidths.cpf;
    
    doc.text('Cargo', colX + 2, y + 5);
    doc.line(colX + colWidths.cargo, y, colX + colWidths.cargo, y + rowHeight);
    colX += colWidths.cargo;
    
    doc.text('Código', colX + colWidths.codigo / 2, y + 5, { align: 'center' });
    
    y += rowHeight;
  };

  drawTableHeader();

  // Linhas da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  servidores.forEach((s, index) => {
    // Verificar se precisa de nova página
    if (y > CONFIG.pageHeight - 50) {
      doc.addPage();
      addHeader(doc);
      y = CONFIG.marginTop + 25;
      drawTableHeader();
    }

    // Calcular altura da linha baseado no nome
    const nomeLines = doc.splitTextToSize(s.nome_completo.toUpperCase(), colWidths.nome - 4);
    const cargoLines = doc.splitTextToSize(s.cargo, colWidths.cargo - 4);
    const lineHeight = Math.max(nomeLines.length, cargoLines.length) * 4 + 3;

    // Borda da linha
    doc.setDrawColor(150);
    doc.rect(tableX, y, tableWidth, lineHeight);

    let colX = tableX;

    // Nº
    doc.text(String(index + 1), colX + colWidths.num / 2, y + 4, { align: 'center' });
    doc.line(colX + colWidths.num, y, colX + colWidths.num, y + lineHeight);
    colX += colWidths.num;

    // Nome
    doc.text(nomeLines, colX + 2, y + 4);
    doc.line(colX + colWidths.nome, y, colX + colWidths.nome, y + lineHeight);
    colX += colWidths.nome;

    // CPF
    doc.text(formatarCPF(s.cpf), colX + colWidths.cpf / 2, y + 4, { align: 'center' });
    doc.line(colX + colWidths.cpf, y, colX + colWidths.cpf, y + lineHeight);
    colX += colWidths.cpf;

    // Cargo
    doc.text(cargoLines, colX + 2, y + 4);
    doc.line(colX + colWidths.cargo, y, colX + colWidths.cargo, y + lineHeight);
    colX += colWidths.cargo;

    // Código
    doc.text(s.codigo || '-', colX + colWidths.codigo / 2, y + 4, { align: 'center' });

    y += lineHeight;
  });

  y += 10;

  // Art. 2º - Remuneração
  if (y > CONFIG.pageHeight - 60) {
    doc.addPage();
    addHeader(doc);
    y = CONFIG.marginTop + 25;
  }
  
  doc.setFontSize(11);
  const artigo2 = 'Art. 2º Os nomeados farão jus à remuneração correspondente aos respectivos cargos, conforme disposto no Anexo I da Lei nº 2.301, de 29 de dezembro de 2025.';
  const artigo2Lines = doc.splitTextToSize(artigo2, contentWidth);
  doc.text(artigo2Lines, CONFIG.marginLeft, y, { align: 'justify' });
  y += artigo2Lines.length * 5 + 8;

  // Art. 3º - Vigência
  const artigo3 = 'Art. 3º Esta Portaria entra em vigor na data de sua publicação.';
  doc.text(artigo3, CONFIG.marginLeft, y);
  y += 20;

  // Local e data
  const dataDocumentoTexto = formatarDataExtenso(portaria.data_documento);
  doc.text(`Boa Vista – RR, ${dataDocumentoTexto}.`, CONFIG.marginLeft, y);
  y += 25;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text(PRESIDENTE.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(PRESIDENTE.cargo, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(PRESIDENTE.orgao, CONFIG.pageWidth / 2, y, { align: 'center' });

  // Adicionar rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  return doc;
}
