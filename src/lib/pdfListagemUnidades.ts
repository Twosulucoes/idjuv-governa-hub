 /**
  * Gerador de PDF: Listagem Geral de Unidades Locais
  * Relatório tabular com visão consolidada de todas as unidades
  */
 import jsPDF from 'jspdf';
 import {
   loadLogos,
   generateInstitutionalHeader,
   generateInstitutionalFooter,
   addPageNumbers,
   CORES,
   PAGINA,
   getPageDimensions,
   setColor,
 } from './pdfTemplate';
 import { TIPO_UNIDADE_LABELS, STATUS_UNIDADE_LABELS } from '@/types/unidadesLocais';
 
 export interface UnidadeResumo {
   codigo?: string;
   nome: string;
   tipo: string;
   municipio: string;
   status: string;
   chefe?: string;
   capacidade?: number;
 }
 
 export interface ListagemUnidadesConfig {
   titulo?: string;
   subtitulo?: string;
   filtros?: {
     municipio?: string;
     tipo?: string;
     status?: string;
   };
 }
 
 /**
  * Gera PDF da Listagem de Unidades Locais
  */
 export async function generateListagemUnidades(
   unidades: UnidadeResumo[],
   config: ListagemUnidadesConfig = {}
 ): Promise<void> {
   const logos = await loadLogos();
   const doc = new jsPDF({ orientation: 'landscape' });
   const { width, height, contentWidth } = getPageDimensions(doc);
 
   // Construir subtítulo com filtros
   let subtitulo = config.subtitulo || 'Listagem Geral';
   if (config.filtros) {
     const partes: string[] = [];
     if (config.filtros.municipio) partes.push(`Município: ${config.filtros.municipio}`);
     if (config.filtros.tipo) partes.push(`Tipo: ${TIPO_UNIDADE_LABELS[config.filtros.tipo as keyof typeof TIPO_UNIDADE_LABELS] || config.filtros.tipo}`);
     if (config.filtros.status) partes.push(`Status: ${STATUS_UNIDADE_LABELS[config.filtros.status as keyof typeof STATUS_UNIDADE_LABELS] || config.filtros.status}`);
     if (partes.length > 0) subtitulo = partes.join(' | ');
   }
 
   // Header institucional
   let y = await generateInstitutionalHeader(doc, {
     titulo: config.titulo || 'RELATÓRIO DE UNIDADES LOCAIS',
     subtitulo,
     fundoEscuro: true,
   }, logos);
 
   // Totalizador
   setColor(doc, CORES.cinzaMedio);
   doc.setFont('helvetica', 'normal');
   doc.setFontSize(9);
   doc.text(`Total de unidades: ${unidades.length}`, PAGINA.margemEsquerda, y);
   y += 8;
 
   // Definição das colunas
   const colunas = [
     { header: 'Código', width: 20, align: 'left' as const },
     { header: 'Nome da Unidade', width: 70, align: 'left' as const },
     { header: 'Tipo', width: 35, align: 'left' as const },
     { header: 'Município', width: 35, align: 'left' as const },
     { header: 'Status', width: 25, align: 'center' as const },
     { header: 'Responsável', width: 55, align: 'left' as const },
     { header: 'Capacidade', width: 25, align: 'right' as const },
   ];
 
   const rowHeight = 7;
   const headerHeight = 8;
 
   // Função para desenhar cabeçalho da tabela
   const drawTableHeader = (startY: number): number => {
     let x = PAGINA.margemEsquerda;
     
     // Fundo do cabeçalho
     setColor(doc, CORES.primaria, 'fill');
     doc.rect(x, startY, contentWidth, headerHeight, 'F');
     
     // Textos do cabeçalho
     setColor(doc, CORES.textoBranco);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(8);
     
     colunas.forEach((col) => {
       doc.text(col.header, x + 2, startY + 5.5, { align: 'left' });
       x += col.width;
     });
     
     return startY + headerHeight;
   };
 
   // Desenhar cabeçalho inicial
   y = drawTableHeader(y);
 
   // Linhas da tabela
   unidades.forEach((unidade, index) => {
     // Verificar nova página
     if (y > height - 25) {
       doc.addPage();
       y = PAGINA.margemSuperior;
       y = drawTableHeader(y);
     }
 
     // Fundo alternado
     if (index % 2 === 0) {
       setColor(doc, CORES.fundoClaro, 'fill');
       doc.rect(PAGINA.margemEsquerda, y, contentWidth, rowHeight, 'F');
     }
 
     let x = PAGINA.margemEsquerda;
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(8);
 
     // Código
     doc.text(unidade.codigo || '-', x + 2, y + 5);
     x += colunas[0].width;
 
     // Nome (truncado)
     const nomeTrunc = unidade.nome.length > 35 ? unidade.nome.substring(0, 33) + '...' : unidade.nome;
     doc.text(nomeTrunc, x + 2, y + 5);
     x += colunas[1].width;
 
     // Tipo
     const tipoLabel = TIPO_UNIDADE_LABELS[unidade.tipo as keyof typeof TIPO_UNIDADE_LABELS] || unidade.tipo;
     doc.text(tipoLabel, x + 2, y + 5);
     x += colunas[2].width;
 
     // Município
     doc.text(unidade.municipio, x + 2, y + 5);
     x += colunas[3].width;
 
     // Status (com cor)
     const statusLabel = STATUS_UNIDADE_LABELS[unidade.status as keyof typeof STATUS_UNIDADE_LABELS] || unidade.status;
     const statusCor = unidade.status === 'ativa' ? CORES.sucesso :
                       unidade.status === 'manutencao' ? CORES.alerta :
                       unidade.status === 'interditada' ? CORES.erro : CORES.cinzaMedio;
     setColor(doc, statusCor);
     doc.setFont('helvetica', 'bold');
     doc.text(statusLabel, x + colunas[4].width / 2, y + 5, { align: 'center' });
     x += colunas[4].width;
 
     // Responsável
     setColor(doc, CORES.textoEscuro);
     doc.setFont('helvetica', 'normal');
     const chefeTrunc = unidade.chefe && unidade.chefe.length > 28 
       ? unidade.chefe.substring(0, 26) + '...' 
       : (unidade.chefe || '-');
     doc.text(chefeTrunc, x + 2, y + 5);
     x += colunas[5].width;
 
     // Capacidade
     const capText = unidade.capacidade ? unidade.capacidade.toLocaleString('pt-BR') : '-';
     doc.text(capText, x + colunas[6].width - 2, y + 5, { align: 'right' });
 
     y += rowHeight;
   });
 
   // Linha final da tabela
   setColor(doc, CORES.cinzaMuitoClaro, 'draw');
   doc.setLineWidth(0.3);
   doc.line(PAGINA.margemEsquerda, y, PAGINA.margemEsquerda + contentWidth, y);
 
   // Rodapé e paginação
   generateInstitutionalFooter(doc, { sistema: 'Sistema IDJuv - Unidades Locais' });
   addPageNumbers(doc);
 
   // Salvar PDF
   const dataAtual = new Date().toISOString().split('T')[0];
   doc.save(`Listagem_Unidades_${dataAtual}.pdf`);
 }