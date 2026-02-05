 /**
  * Bloco de Estrutura e Áreas Disponíveis
  * Renderiza infraestrutura e áreas da unidade
  */
 import jsPDF from 'jspdf';
 import { CORES, setColor, PAGINA, getPageDimensions } from '../../pdfTemplate';
 
 export interface DadosEstrutura {
   areas: string[];
   estrutura?: string;
   horarioFuncionamento?: string;
   regrasUso?: string;
 }
 
 /**
  * Renderiza bloco de estrutura
  * @returns Nova posição Y após o bloco
  */
 export function blocoEstrutura(
   doc: jsPDF,
   dados: DadosEstrutura,
   y: number
 ): number {
   const { contentWidth } = getPageDimensions(doc);
   const col1 = PAGINA.margemEsquerda;
 
   // Título do bloco
   setColor(doc, CORES.primaria);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(10);
   doc.text('ESTRUTURA E ÁREAS DISPONÍVEIS', col1, y);
   
   setColor(doc, CORES.primaria, 'draw');
   doc.setLineWidth(0.3);
   doc.line(col1, y + 2, col1 + contentWidth, y + 2);
   y += 8;
 
   // Estrutura disponível (texto livre)
   if (dados.estrutura) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Estrutura', col1, y);
     
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(9);
     const linhas = doc.splitTextToSize(dados.estrutura, contentWidth - 5);
     doc.text(linhas, col1, y + 4);
     y += 4 + (linhas.length * 4) + 4;
   }
 
   // Áreas disponíveis (lista em grid)
   if (dados.areas.length > 0) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Áreas Disponíveis', col1, y);
     y += 5;
 
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(9);
 
     // Grid de 2 colunas
     const colWidth = contentWidth / 2 - 5;
     dados.areas.forEach((area, index) => {
       const x = index % 2 === 0 ? col1 + 3 : col1 + colWidth + 8;
       if (index % 2 === 0 && index > 0) y += 5;
       doc.text(`• ${area}`, x, y);
     });
     y += 8;
   }
 
   // Horário de funcionamento
   if (dados.horarioFuncionamento) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Horário de Funcionamento', col1, y);
     
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(9);
     doc.text(dados.horarioFuncionamento, col1, y + 4);
     y += 10;
   }
 
   return y + 4;
 }