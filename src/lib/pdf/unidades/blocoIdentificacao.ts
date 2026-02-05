 /**
  * Bloco de Identificação da Unidade Local
  * Renderiza dados básicos: código, nome, tipo, status
  */
 import jsPDF from 'jspdf';
 import { CORES, setColor, addField, PAGINA, getPageDimensions } from '../../pdfTemplate';
 import { TIPO_UNIDADE_LABELS, STATUS_UNIDADE_LABELS } from '@/types/unidadesLocais';
 
 export interface DadosIdentificacao {
   codigo?: string;
   nome: string;
   tipo: string;
   natureza?: string;
   status: string;
   diretoria?: string;
   capacidade?: number;
 }
 
 /**
  * Renderiza bloco de identificação da unidade
  * @returns Nova posição Y após o bloco
  */
 export function blocoIdentificacao(
   doc: jsPDF,
   dados: DadosIdentificacao,
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
   doc.text('IDENTIFICAÇÃO DA UNIDADE', col1, y);
   
   setColor(doc, CORES.primaria, 'draw');
   doc.setLineWidth(0.3);
   doc.line(col1, y + 2, col1 + contentWidth, y + 2);
   y += 8;
 
   // Linha 1: Código e Nome
   if (dados.codigo) {
     addField(doc, 'Código', dados.codigo, col1, y, 40);
     addField(doc, 'Nome da Unidade', dados.nome, col1 + 45, y, contentWidth - 50);
   } else {
     addField(doc, 'Nome da Unidade', dados.nome, col1, y, contentWidth);
   }
   y += 10;
 
   // Linha 2: Tipo e Status
   const tipoLabel = TIPO_UNIDADE_LABELS[dados.tipo as keyof typeof TIPO_UNIDADE_LABELS] || dados.tipo;
   const statusLabel = STATUS_UNIDADE_LABELS[dados.status as keyof typeof STATUS_UNIDADE_LABELS] || dados.status;
   
   addField(doc, 'Tipo', tipoLabel, col1, y, colWidth);
   addField(doc, 'Status', statusLabel, col2, y, colWidth);
   y += 10;
 
   // Linha 3: Diretoria e Capacidade (se houver)
   if (dados.diretoria || dados.capacidade) {
     if (dados.diretoria) {
       addField(doc, 'Diretoria Vinculada', dados.diretoria, col1, y, colWidth);
     }
     if (dados.capacidade) {
       addField(doc, 'Capacidade', `${dados.capacidade.toLocaleString('pt-BR')} pessoas`, col2, y, colWidth);
     }
     y += 10;
   }
 
   return y + 4;
 }