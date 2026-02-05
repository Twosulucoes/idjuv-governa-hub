 /**
  * Bloco de Resumo Patrimonial da Unidade
  * Renderiza totais e distribuição de bens
  */
 import jsPDF from 'jspdf';
 import { CORES, setColor, PAGINA, getPageDimensions } from '../../pdfTemplate';
 import { ESTADO_CONSERVACAO_LABELS } from '@/types/unidadesLocais';
 
 export interface DadosPatrimonio {
   totalItens: number;
   valorEstimado?: number;
   porEstado: {
     otimo?: number;
     bom?: number;
     regular?: number;
     ruim?: number;
     inservivel?: number;
   };
   itensRecentes?: Array<{
     tombo: string;
     descricao: string;
     estado: string;
   }>;
 }
 
 /**
  * Renderiza bloco de patrimônio
  * @returns Nova posição Y após o bloco
  */
 export function blocoPatrimonio(
   doc: jsPDF,
   dados: DadosPatrimonio,
   y: number
 ): number {
   const { contentWidth } = getPageDimensions(doc);
   const col1 = PAGINA.margemEsquerda;
 
   // Título do bloco
   setColor(doc, CORES.primaria);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(10);
   doc.text('PATRIMÔNIO', col1, y);
   
   setColor(doc, CORES.primaria, 'draw');
   doc.setLineWidth(0.3);
   doc.line(col1, y + 2, col1 + contentWidth, y + 2);
   y += 8;
 
   // Total e valor estimado
   setColor(doc, CORES.cinzaMedio);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(8);
   doc.text('Total de Itens:', col1, y);
   
   setColor(doc, CORES.textoEscuro);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(12);
   doc.text(String(dados.totalItens), col1 + 28, y);
   
   if (dados.valorEstimado && dados.valorEstimado > 0) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Valor Estimado:', col1 + 60, y);
     
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(10);
     doc.text(
       dados.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
       col1 + 92,
       y
     );
   }
   y += 10;
 
   // Distribuição por estado de conservação
   if (dados.totalItens > 0) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Distribuição por Estado de Conservação:', col1, y);
     y += 6;
 
     const estados = [
       { key: 'otimo', cor: { r: 34, g: 197, b: 94 } },     // Verde
       { key: 'bom', cor: { r: 59, g: 130, b: 246 } },       // Azul
       { key: 'regular', cor: { r: 234, g: 179, b: 8 } },    // Amarelo
       { key: 'ruim', cor: { r: 249, g: 115, b: 22 } },      // Laranja
       { key: 'inservivel', cor: { r: 220, g: 38, b: 38 } }, // Vermelho
     ];
 
     const boxWidth = contentWidth / 5 - 2;
     estados.forEach((e, i) => {
       const valor = dados.porEstado[e.key as keyof typeof dados.porEstado] || 0;
       const x = col1 + (i * (boxWidth + 2));
       
       // Box com borda colorida
       setColor(doc, e.cor, 'draw');
       doc.setLineWidth(1);
       doc.rect(x, y, boxWidth, 14);
       
       // Valor
       setColor(doc, CORES.textoEscuro);
       doc.setFont('helvetica', 'bold');
       doc.setFontSize(11);
       doc.text(String(valor), x + boxWidth / 2, y + 7, { align: 'center' });
       
       // Label
       setColor(doc, CORES.cinzaMedio);
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(6);
       const label = ESTADO_CONSERVACAO_LABELS[e.key as keyof typeof ESTADO_CONSERVACAO_LABELS];
       doc.text(label, x + boxWidth / 2, y + 12, { align: 'center' });
     });
     y += 18;
   }
 
   // Itens recentes (lista resumida)
   if (dados.itensRecentes && dados.itensRecentes.length > 0) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Itens Recentes:', col1, y);
     y += 5;
 
     dados.itensRecentes.slice(0, 3).forEach((item) => {
       setColor(doc, CORES.textoEscuro);
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.text(`• ${item.tombo}: ${item.descricao.substring(0, 50)}...`, col1 + 3, y);
       y += 4;
     });
   }
 
   return y + 4;
 }