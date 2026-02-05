/**
 * Relatório de Servidores com Segundo Vínculo Funcional
 * Lista servidores que possuem vínculo externo com outro órgão
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCPF,
  checkPageBreak,
  addSectionHeader,
} from './pdfTemplate';
import {
  VINCULO_EXTERNO_ESFERA_LABELS,
  VINCULO_EXTERNO_FORMA_LABELS,
  type VinculoExternoEsfera,
  type VinculoExternoForma,
} from '@/types/rh';

export interface ServidorSegundoVinculo {
  nome: string;
  cpf: string;
  matricula: string | null;
  vinculo_idjuv: string;
  cargo_idjuv: string;
  unidade_idjuv: string;
  vinculo_externo_esfera: string;
  vinculo_externo_orgao: string;
  vinculo_externo_cargo: string;
  vinculo_externo_matricula: string | null;
  vinculo_externo_forma: string;
  vinculo_externo_ato_numero: string | null;
}

export interface RelatorioSegundoVinculoData {
  servidores: ServidorSegundoVinculo[];
  totalServidores: number;
  dataGeracao: string;
  filtroEsfera: string | null;
  filtroForma: string | null;
  agruparPor: 'esfera' | 'forma' | null;
}

export async function gerarRelatorioSegundoVinculo(data: RelatorioSegundoVinculoData): Promise<void> {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);

  // Subtítulo com filtros aplicados
  let subtitulo = 'Servidores com Vínculo Funcional Externo';
  const filtros: string[] = [];
  if (data.filtroEsfera) {
    filtros.push(`Esfera: ${VINCULO_EXTERNO_ESFERA_LABELS[data.filtroEsfera as VinculoExternoEsfera] || data.filtroEsfera}`);
  }
  if (data.filtroForma) {
    filtros.push(`Forma: ${VINCULO_EXTERNO_FORMA_LABELS[data.filtroForma as VinculoExternoForma] || data.filtroForma}`);
  }
  if (filtros.length > 0) {
    subtitulo = `Filtro: ${filtros.join(' | ')}`;
  }

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES COM SEGUNDO VÍNCULO',
    subtitulo,
    fundoEscuro: true,
  }, logos);

  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total: ${data.totalServidores} servidores`, width - PAGINA.margemDireita - 40, y);
  y += 10;

  // Função para agrupar servidores
  const agruparServidores = (): Map<string, ServidorSegundoVinculo[]> => {
    const grupos = new Map<string, ServidorSegundoVinculo[]>();
    
    if (!data.agruparPor) {
      grupos.set('todos', data.servidores);
      return grupos;
    }

    data.servidores.forEach(s => {
      let chave = '';
      if (data.agruparPor === 'esfera') {
        chave = s.vinculo_externo_esfera;
      } else if (data.agruparPor === 'forma') {
        chave = s.vinculo_externo_forma;
      }
      if (!grupos.has(chave)) {
        grupos.set(chave, []);
      }
      grupos.get(chave)!.push(s);
    });

    return grupos;
  };

  const grupos = agruparServidores();

  // Renderizar cada grupo
  grupos.forEach((servidores, chaveGrupo) => {
    if (data.agruparPor && chaveGrupo !== 'todos') {
      y = checkPageBreak(doc, y, 50);
      
      // Header do grupo
      let labelGrupo = chaveGrupo;
      if (data.agruparPor === 'esfera') {
        labelGrupo = VINCULO_EXTERNO_ESFERA_LABELS[chaveGrupo as VinculoExternoEsfera] || chaveGrupo;
      } else if (data.agruparPor === 'forma') {
        labelGrupo = VINCULO_EXTERNO_FORMA_LABELS[chaveGrupo as VinculoExternoForma] || chaveGrupo;
      }

      setColor(doc, CORES.cinzaMuitoClaro, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
      setColor(doc, CORES.textoEscuro);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`▶ ${labelGrupo.toUpperCase()} (${servidores.length} servidores)`, PAGINA.margemEsquerda + 2, y);
      y += 10;
    }

    // Table header
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Ord', PAGINA.margemEsquerda + 1, y);
    doc.text('Servidor', PAGINA.margemEsquerda + 12, y);
    doc.text('Vínculo IDJuv', 65, y);
    doc.text('Esfera', 95, y);
    doc.text('Órgão Origem', 118, y);
    doc.text('Cargo Origem', 150, y);
    doc.text('Forma', 180, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;

    // Rows
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    servidores.forEach((s, idx) => {
      y = checkPageBreak(doc, y, 20);

      const esferaLabel = VINCULO_EXTERNO_ESFERA_LABELS[s.vinculo_externo_esfera as VinculoExternoEsfera] || s.vinculo_externo_esfera;
      const formaLabel = VINCULO_EXTERNO_FORMA_LABELS[s.vinculo_externo_forma as VinculoExternoForma] || s.vinculo_externo_forma;

      doc.text(String(idx + 1).padStart(2, '0'), PAGINA.margemEsquerda + 1, y);
      doc.text(s.nome.substring(0, 25), PAGINA.margemEsquerda + 12, y);
      doc.text((s.vinculo_idjuv || '-').substring(0, 12), 65, y);
      
      // Cor por esfera
      if (s.vinculo_externo_esfera === 'federal') {
        setColor(doc, { r: 59, g: 130, b: 246 }); // azul
      } else if (s.vinculo_externo_esfera.startsWith('estadual')) {
        setColor(doc, { r: 34, g: 197, b: 94 }); // verde
      } else {
        setColor(doc, { r: 234, g: 179, b: 8 }); // amarelo
      }
      doc.text(esferaLabel.substring(0, 10), 95, y);
      setColor(doc, CORES.textoEscuro);
      
      doc.text((s.vinculo_externo_orgao || '-').substring(0, 15), 118, y);
      doc.text((s.vinculo_externo_cargo || '-').substring(0, 15), 150, y);
      doc.text(formaLabel.substring(0, 10), 180, y);
      y += 5;
    });

    y += 5;
  });

  // Resumo
  y = checkPageBreak(doc, y, 50);
  y = addSectionHeader(doc, 'RESUMO', y);

  // Contagem por esfera
  const porEsfera: Record<string, number> = {};
  const porForma: Record<string, number> = {};
  data.servidores.forEach(s => {
    porEsfera[s.vinculo_externo_esfera] = (porEsfera[s.vinculo_externo_esfera] || 0) + 1;
    porForma[s.vinculo_externo_forma] = (porForma[s.vinculo_externo_forma] || 0) + 1;
  });

  setColor(doc, CORES.textoEscuro);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  doc.text('Por Esfera:', PAGINA.margemEsquerda, y);
  y += 5;
  Object.entries(porEsfera).forEach(([esfera, count]) => {
    const label = VINCULO_EXTERNO_ESFERA_LABELS[esfera as VinculoExternoEsfera] || esfera;
    doc.text(`  • ${label}: ${count} servidores`, PAGINA.margemEsquerda + 5, y);
    y += 4;
  });

  y += 3;
  doc.text('Por Forma de Vínculo:', PAGINA.margemEsquerda, y);
  y += 5;
  Object.entries(porForma).forEach(([forma, count]) => {
    const label = VINCULO_EXTERNO_FORMA_LABELS[forma as VinculoExternoForma] || forma;
    doc.text(`  • ${label}: ${count} servidores`, PAGINA.margemEsquerda + 5, y);
    y += 4;
  });

  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);

  const nomeArquivo = `Relatorio_Segundo_Vinculo_${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(nomeArquivo);
}