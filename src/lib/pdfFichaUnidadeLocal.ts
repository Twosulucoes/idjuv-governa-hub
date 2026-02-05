 /**
  * Gerador de PDF: Ficha Cadastral de Unidade Local
  * Documento oficial completo com todos os dados de uma unidade
  */
 import jsPDF from 'jspdf';
 import {
   loadLogos,
   generateInstitutionalHeader,
   generateInstitutionalFooter,
   addPageNumbers,
   PAGINA,
   getPageDimensions,
 } from './pdfTemplate';
 import {
   blocoIdentificacao,
   blocoLocalizacao,
   blocoEstrutura,
   blocoResponsavel,
   blocoCedencias,
   blocoPatrimonio,
   type DadosIdentificacao,
   type DadosLocalizacao,
   type DadosEstrutura,
   type DadosResponsavel,
   type DadosCedencias,
   type DadosPatrimonio,
 } from './pdf/unidades';
 
 export interface FichaUnidadeLocalData {
   identificacao: DadosIdentificacao;
   localizacao: DadosLocalizacao;
   estrutura: DadosEstrutura;
   responsavel: DadosResponsavel | null;
   cedencias?: DadosCedencias;
   patrimonio?: DadosPatrimonio;
   observacoes?: string;
 }
 
 /**
  * Gera PDF da Ficha Cadastral de uma Unidade Local
  */
 export async function generateFichaUnidadeLocal(data: FichaUnidadeLocalData): Promise<void> {
   const logos = await loadLogos();
   const doc = new jsPDF();
   const { height, contentWidth } = getPageDimensions(doc);
 
   // Header institucional
   let y = await generateInstitutionalHeader(doc, {
     titulo: 'FICHA CADASTRAL DE UNIDADE LOCAL',
     subtitulo: data.identificacao.nome,
     fundoEscuro: true,
   }, logos);
 
   // Verificar espaço para nova página
   const checkNewPage = (minSpace: number = 40) => {
     if (y > height - minSpace) {
       doc.addPage();
       y = PAGINA.margemSuperior + 10;
     }
   };
 
   // Bloco 1: Identificação
   y = blocoIdentificacao(doc, data.identificacao, y);
   checkNewPage();
 
   // Bloco 2: Localização
   y = blocoLocalizacao(doc, data.localizacao, y);
   checkNewPage();
 
   // Bloco 3: Estrutura
   y = blocoEstrutura(doc, data.estrutura, y);
   checkNewPage();
 
   // Bloco 4: Responsável
   y = blocoResponsavel(doc, data.responsavel, y);
   checkNewPage();
 
   // Bloco 5: Cedências (se houver dados)
   if (data.cedencias) {
     y = blocoCedencias(doc, data.cedencias, y);
     checkNewPage();
   }
 
   // Bloco 6: Patrimônio (se houver dados)
   if (data.patrimonio) {
     y = blocoPatrimonio(doc, data.patrimonio, y);
   }
 
   // Observações
   if (data.observacoes) {
     checkNewPage(50);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(10);
     doc.setTextColor(0, 68, 68);
     doc.text('OBSERVAÇÕES', PAGINA.margemEsquerda, y);
     
     doc.setDrawColor(0, 68, 68);
     doc.setLineWidth(0.3);
     doc.line(PAGINA.margemEsquerda, y + 2, PAGINA.margemEsquerda + contentWidth, y + 2);
     y += 8;
 
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(9);
     doc.setTextColor(60, 60, 60);
     const linhas = doc.splitTextToSize(data.observacoes, contentWidth - 5);
     doc.text(linhas, PAGINA.margemEsquerda, y);
   }
 
   // Rodapé e paginação
   generateInstitutionalFooter(doc, { sistema: 'Sistema IDJuv - Unidades Locais' });
   addPageNumbers(doc);
 
   // Salvar PDF
   const nomeArquivo = `Ficha_${data.identificacao.codigo || data.identificacao.nome.replace(/\s+/g, '_')}.pdf`;
   doc.save(nomeArquivo);
 }