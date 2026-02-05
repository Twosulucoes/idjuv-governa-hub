 /**
  * Bloco de Localização da Unidade Local
  * Renderiza dados geográficos: município, endereço
  */
 import jsPDF from 'jspdf';
 import { CORES, setColor, addField, PAGINA, getPageDimensions } from '../../pdfTemplate';
 
 export interface DadosLocalizacao {
   municipio: string;
   endereco?: string;
   complemento?: string;
   referencia?: string;
 }
 
 /**
  * Renderiza bloco de localização
  * @returns Nova posição Y após o bloco
  */
 export function blocoLocalizacao(
   doc: jsPDF,
   dados: DadosLocalizacao,
   y: number
 ): number {
   const { contentWidth } = getPageDimensions(doc);
   const col1 = PAGINA.margemEsquerda;
 
   // Título do bloco
   setColor(doc, CORES.primaria);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(10);
   doc.text('LOCALIZAÇÃO', col1, y);
   
   setColor(doc, CORES.primaria, 'draw');
   doc.setLineWidth(0.3);
   doc.line(col1, y + 2, col1 + contentWidth, y + 2);
   y += 8;
 
   // Município
   addField(doc, 'Município', `${dados.municipio}/RR`, col1, y, contentWidth);
   y += 10;
 
   // Endereço completo
   if (dados.endereco) {
     addField(doc, 'Endereço', dados.endereco, col1, y, contentWidth);
     y += 10;
   }
 
   // Complemento
   if (dados.complemento) {
     addField(doc, 'Complemento', dados.complemento, col1, y, contentWidth);
     y += 10;
   }
 
   // Referência
   if (dados.referencia) {
     addField(doc, 'Ponto de Referência', dados.referencia, col1, y, contentWidth);
     y += 10;
   }
 
   return y + 4;
 }