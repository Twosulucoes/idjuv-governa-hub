 /**
  * Bloco de Responsável/Chefe da Unidade
  * Renderiza dados do servidor responsável e ato de nomeação
  */
 import jsPDF from 'jspdf';
 import { CORES, setColor, addField, PAGINA, getPageDimensions } from '../../pdfTemplate';
 import { TIPO_ATO_LABELS } from '@/types/unidadesLocais';
 
 export interface DadosResponsavel {
   nome: string;
   cargo: string;
   tipoAto?: string;
   numeroAto?: string;
   dataPublicacao?: string;
   dataInicio?: string;
   status?: string;
 }
 
 /**
  * Renderiza bloco de responsável
  * @returns Nova posição Y após o bloco
  */
 export function blocoResponsavel(
   doc: jsPDF,
   dados: DadosResponsavel | null,
   y: number
 ): number {
   const { contentWidth } = getPageDimensions(doc);
   const col1 = PAGINA.margemEsquerda;
   const col2 = PAGINA.margemEsquerda + contentWidth / 2;
   const colWidth = (contentWidth / 2) - 5;
 
   // Título do bloco
   setColor(doc, CORES.primaria);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(10);
   doc.text('RESPONSÁVEL PELA UNIDADE', col1, y);
   
   setColor(doc, CORES.primaria, 'draw');
   doc.setLineWidth(0.3);
   doc.line(col1, y + 2, col1 + contentWidth, y + 2);
   y += 8;
 
   if (!dados) {
     // Alerta: sem responsável designado
     setColor(doc, CORES.alerta, 'fill');
     doc.rect(col1, y - 2, contentWidth, 10, 'F');
     
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(9);
     doc.text('⚠ Unidade sem responsável designado', col1 + 5, y + 4);
     return y + 16;
   }
 
   // Nome e Cargo
   addField(doc, 'Nome', dados.nome, col1, y, colWidth);
   addField(doc, 'Cargo', dados.cargo, col2, y, colWidth);
   y += 10;
 
   // Ato de Nomeação
   if (dados.tipoAto && dados.numeroAto) {
     const tipoAtoLabel = TIPO_ATO_LABELS[dados.tipoAto as keyof typeof TIPO_ATO_LABELS] || dados.tipoAto;
     addField(doc, 'Ato de Nomeação', `${tipoAtoLabel} nº ${dados.numeroAto}`, col1, y, colWidth);
     
     if (dados.dataPublicacao) {
       addField(doc, 'Data Publicação', dados.dataPublicacao, col2, y, colWidth);
     }
     y += 10;
   }
 
   // Data início da gestão
   if (dados.dataInicio) {
     addField(doc, 'Início da Gestão', dados.dataInicio, col1, y, colWidth);
     y += 10;
   }
 
   return y + 4;
 }