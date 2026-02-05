 /**
  * Bloco de Resumo de Cedências
  * Renderiza estatísticas de uso da unidade
  */
 import jsPDF from 'jspdf';
 import { CORES, setColor, PAGINA, getPageDimensions } from '../../pdfTemplate';
 
 export interface DadosCedencias {
   totalSolicitadas: number;
   aprovadas: number;
   rejeitadas: number;
   canceladas: number;
   pendentes: number;
   publicoTotal?: number;
   ultimaCedencia?: {
     titulo: string;
     solicitante: string;
     dataInicio: string;
     dataFim: string;
   };
 }
 
 /**
  * Renderiza bloco de cedências
  * @returns Nova posição Y após o bloco
  */
 export function blocoCedencias(
   doc: jsPDF,
   dados: DadosCedencias,
   y: number
 ): number {
   const { contentWidth } = getPageDimensions(doc);
   const col1 = PAGINA.margemEsquerda;
 
   // Título do bloco
   setColor(doc, CORES.primaria);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(10);
   doc.text('RESUMO DE CEDÊNCIAS', col1, y);
   
   setColor(doc, CORES.primaria, 'draw');
   doc.setLineWidth(0.3);
   doc.line(col1, y + 2, col1 + contentWidth, y + 2);
   y += 8;
 
   // Grid de métricas (5 colunas)
   const metricas = [
     { label: 'Solicitadas', valor: dados.totalSolicitadas, cor: CORES.cinzaMedio },
     { label: 'Aprovadas', valor: dados.aprovadas, cor: CORES.sucesso },
     { label: 'Pendentes', valor: dados.pendentes, cor: CORES.alerta },
     { label: 'Rejeitadas', valor: dados.rejeitadas, cor: CORES.erro },
     { label: 'Canceladas', valor: dados.canceladas, cor: CORES.cinzaClaro },
   ];
 
   const boxWidth = contentWidth / 5 - 2;
   metricas.forEach((m, i) => {
     const x = col1 + (i * (boxWidth + 2));
     
     // Box com fundo
     setColor(doc, CORES.fundoClaro, 'fill');
     doc.rect(x, y, boxWidth, 16, 'F');
     
     // Valor
     setColor(doc, m.cor);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(14);
     doc.text(String(m.valor), x + boxWidth / 2, y + 8, { align: 'center' });
     
     // Label
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(7);
     doc.text(m.label, x + boxWidth / 2, y + 13, { align: 'center' });
   });
   y += 22;
 
   // Público total atendido
   if (dados.publicoTotal && dados.publicoTotal > 0) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Público Total Atendido:', col1, y);
     
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(9);
     doc.text(`${dados.publicoTotal.toLocaleString('pt-BR')} pessoas`, col1 + 42, y);
     y += 8;
   }
 
   // Última cedência
   if (dados.ultimaCedencia) {
     setColor(doc, CORES.cinzaMedio);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     doc.text('Última Cedência:', col1, y);
     
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(9);
     const textoUltima = `${dados.ultimaCedencia.titulo} - ${dados.ultimaCedencia.solicitante} (${dados.ultimaCedencia.dataInicio} a ${dados.ultimaCedencia.dataFim})`;
     const linhas = doc.splitTextToSize(textoUltima, contentWidth - 5);
     doc.text(linhas, col1, y + 4);
     y += 4 + (linhas.length * 4);
   }
 
   return y + 4;
 }