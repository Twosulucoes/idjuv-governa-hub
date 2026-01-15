import jsPDF from 'jspdf';
import { UnidadeOrganizacional, LABELS_UNIDADE } from '@/types/organograma';
import { 
  generateInstitutionalHeader, 
  generateInstitutionalFooter, 
  addPageNumbers,
  loadLogos,
  CORES,
  setColor,
  getPageDimensions
} from '@/lib/pdfTemplate';

export interface OrganogramaConfig {
  exibirNomesServidores?: boolean;
  exibirQuantidadeServidores?: boolean;
  exibirLegenda?: boolean;
}

interface LotacaoSimples {
  servidor?: {
    id: string;
    full_name: string;
  };
  cargo?: {
    nome: string;
    sigla?: string;
  };
}

interface OrganogramaData {
  unidades: UnidadeOrganizacional[];
  contarServidores: (unidadeId: string, incluirSub?: boolean) => number;
  getLotacoesByUnidade?: (unidadeId: string) => LotacaoSimples[];
  titulo?: string;
  subtitulo?: string;
  incluirLogos?: boolean;
  config?: OrganogramaConfig;
}

// Cores por tipo de unidade (valores RGB)
const CORES_RGB: Record<string, [number, number, number]> = {
  presidencia: [0, 68, 68], // verde institucional
  gabinete: [59, 130, 246], // blue-500
  diretoria: [147, 51, 234], // purple-600
  coordenacao: [249, 115, 22], // orange-500
  departamento: [20, 184, 166], // teal-500
  setor: [100, 116, 139], // slate-500
  nucleo: [168, 162, 158], // stone-400
  assessoria: [234, 179, 8], // yellow-500
  comissao: [236, 72, 153], // pink-500
  unidade_local: [6, 182, 212], // cyan-500
};

const CORES_FUNDO_RGB: Record<string, [number, number, number]> = {
  presidencia: [220, 252, 231], // green-100
  gabinete: [219, 234, 254], // blue-100
  diretoria: [243, 232, 255], // purple-100
  coordenacao: [255, 237, 213], // orange-100
  departamento: [204, 251, 241], // teal-100
  setor: [241, 245, 249], // slate-100
  nucleo: [245, 245, 244], // stone-100
  assessoria: [254, 249, 195], // yellow-100
  comissao: [252, 231, 243], // pink-100
  unidade_local: [207, 250, 254], // cyan-100
};

export async function gerarOrganogramaPDF(data: OrganogramaData): Promise<void> {
  const {
    unidades,
    contarServidores,
    getLotacoesByUnidade,
    titulo = 'ORGANOGRAMA INSTITUCIONAL',
    subtitulo,
    config = {}
  } = data;

  const {
    exibirNomesServidores = true,
    exibirQuantidadeServidores = true,
    exibirLegenda = true
  } = config;

  // Criar PDF em paisagem A3 para mais espaço
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Cor de texto padrão
  const textColor: [number, number, number] = [30, 41, 59]; // slate-800

  // Carregar logos
  const logos = await loadLogos();

  // Header institucional padrão
  const startY = await generateInstitutionalHeader(pdf, {
    titulo,
    subtitulo,
    fundoEscuro: true
  }, logos);

  // Área de conteúdo
  const contentHeight = pageHeight - startY - 25;

  // Organizar unidades por níveis
  const unidadesPorNivel: Record<number, UnidadeOrganizacional[]> = {};
  unidades.forEach(u => {
    if (!unidadesPorNivel[u.nivel]) unidadesPorNivel[u.nivel] = [];
    unidadesPorNivel[u.nivel].push(u);
  });

  const niveis = Object.keys(unidadesPorNivel).map(Number).sort((a, b) => a - b);
  const numNiveis = niveis.length;
  
  // Calcular altura por nível
  const nivelHeight = Math.min(35, contentHeight / numNiveis);
  const boxHeight = exibirNomesServidores ? 24 : 20;
  const boxMinWidth = 60;
  const boxMaxWidth = 120;
  const boxSpacing = 8;

  // Desenhar organograma nível por nível
  niveis.forEach((nivel, nivelIndex) => {
    const unidadesNivel = unidadesPorNivel[nivel];
    const yNivel = startY + nivelIndex * nivelHeight;

    // Calcular largura das caixas baseado na quantidade
    const totalUnidades = unidadesNivel.length;
    const availableWidth = contentWidth - boxSpacing * (totalUnidades - 1);
    let boxWidth = Math.min(boxMaxWidth, Math.max(boxMinWidth, availableWidth / totalUnidades));
    
    // Se não couber, ajustar
    const totalBoxWidth = totalUnidades * boxWidth + (totalUnidades - 1) * boxSpacing;
    const startX = margin + (contentWidth - totalBoxWidth) / 2;

    unidadesNivel.forEach((unidade, index) => {
      const x = startX + index * (boxWidth + boxSpacing);
      const y = yNivel;

      // Cores da unidade
      const corBorda = CORES_RGB[unidade.tipo] || textColor;
      const corFundo = CORES_FUNDO_RGB[unidade.tipo] || [255, 255, 255];

      // Desenhar caixa
      pdf.setFillColor(...corFundo);
      pdf.setDrawColor(...corBorda);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

      // Barra colorida no topo
      pdf.setFillColor(...corBorda);
      pdf.rect(x, y, boxWidth, 3, 'F');

      // Sigla/Nome
      const nome = unidade.sigla || unidade.nome;
      const nomeExibido = nome.length > 18 ? nome.substring(0, 16) + '...' : nome;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text(nomeExibido, x + boxWidth / 2, y + 9, { align: 'center' });

      // Tipo de unidade
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(LABELS_UNIDADE[unidade.tipo], x + boxWidth / 2, y + 13, { align: 'center' });

      // Servidores (se configurado)
      if (exibirQuantidadeServidores) {
        const qtdServidores = contarServidores(unidade.id, false);
        pdf.setFontSize(6);
        pdf.setTextColor(...corBorda);
        pdf.text(`${qtdServidores} serv.`, x + boxWidth / 2, y + 17, { align: 'center' });
      }

      // Responsável ou primeiro lotado (se configurado)
      if (exibirNomesServidores && boxWidth >= 70) {
        let nomeExibir = '';
        
        // Primeiro tenta o servidor responsável
        if (unidade.servidor_responsavel?.full_name) {
          nomeExibir = unidade.servidor_responsavel.full_name;
        } else if (getLotacoesByUnidade) {
          // Se não tem responsável, pega o primeiro lotado
          const lotacoesUnidade = getLotacoesByUnidade(unidade.id);
          if (lotacoesUnidade.length > 0 && lotacoesUnidade[0].servidor?.full_name) {
            nomeExibir = lotacoesUnidade[0].servidor.full_name;
            if (lotacoesUnidade.length > 1) {
              nomeExibir += ` +${lotacoesUnidade.length - 1}`;
            }
          }
        }
        
        if (nomeExibir) {
          const responsavelExibido = nomeExibir.length > 22 
            ? nomeExibir.substring(0, 20) + '...' 
            : nomeExibir;
          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 116, 139);
          pdf.text(responsavelExibido, x + boxWidth / 2, y + 21, { align: 'center' });
        }
      }

      // Desenhar linha para o superior (se houver e estiver visível)
      if (unidade.superior_id) {
        const superior = unidades.find(u => u.id === unidade.superior_id);
        if (superior) {
          const superiorNivel = superior.nivel;
          const superiorIndex = unidadesPorNivel[superiorNivel]?.findIndex(u => u.id === superior.id);
          
          if (superiorIndex !== undefined && superiorIndex >= 0) {
            const superiorCount = unidadesPorNivel[superiorNivel].length;
            const superiorTotalWidth = superiorCount * boxWidth + (superiorCount - 1) * boxSpacing;
            const superiorStartX = margin + (contentWidth - superiorTotalWidth) / 2;
            const superiorX = superiorStartX + superiorIndex * (boxWidth + boxSpacing) + boxWidth / 2;
            const superiorY = startY + (superiorNivel - niveis[0]) * nivelHeight + boxHeight;

            // Linha vertical do superior para baixo
            const midY = (superiorY + y) / 2;
            
            pdf.setDrawColor(180, 180, 180);
            pdf.setLineWidth(0.3);
            
            // Linha vertical do ponto central da caixa atual para cima
            pdf.line(x + boxWidth / 2, y, x + boxWidth / 2, midY);
            // Linha horizontal conectando
            pdf.line(x + boxWidth / 2, midY, superiorX, midY);
            // Linha vertical do superior para baixo
            pdf.line(superiorX, superiorY, superiorX, midY);
          }
        }
      }
    });
  });

  // Legenda (se configurado)
  if (exibirLegenda) {
    const legendaY = pageHeight - 18;
    const legendaStartX = margin;
    let legendaX = legendaStartX;

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...textColor);
    pdf.text('Legenda:', legendaX, legendaY);
    legendaX += 18;

    const tiposUsados = [...new Set(unidades.map(u => u.tipo))];
    tiposUsados.forEach(tipo => {
      const cor = CORES_RGB[tipo] || textColor;
      
      // Quadrado colorido
      pdf.setFillColor(...cor);
      pdf.rect(legendaX, legendaY - 3, 4, 4, 'F');
      
      // Label
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      pdf.text(LABELS_UNIDADE[tipo], legendaX + 6, legendaY);
      
      legendaX += 30;
    });
  }

  // Total de unidades e servidores
  const totalServidores = unidades.reduce((acc, u) => acc + contarServidores(u.id, false), 0);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Total: ${unidades.length} unidades | ${totalServidores} servidores`,
    pageWidth - margin,
    pageHeight - 18,
    { align: 'right' }
  );

  // Rodapé institucional padrão
  generateInstitutionalFooter(pdf, {
    sistema: 'Sistema de Governança Digital IDJUV',
    mostrarData: true
  });

  // Salvar PDF
  const nomeArquivo = `organograma-idjuv-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(nomeArquivo);
}

// Versão em tabela estruturada
export async function gerarOrganogramaListaPDF(data: OrganogramaData): Promise<void> {
  const {
    unidades,
    contarServidores,
    getLotacoesByUnidade,
    titulo = 'ESTRUTURA ORGANIZACIONAL',
    subtitulo,
    config = {}
  } = data;

  const {
    exibirNomesServidores = true,
    exibirQuantidadeServidores = true
  } = config;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const textColor: [number, number, number] = [30, 41, 59];
  const headerBg: [number, number, number] = [0, 68, 68]; // Verde institucional
  const headerText: [number, number, number] = [255, 255, 255];
  const altRowBg: [number, number, number] = [248, 250, 252]; // slate-50

  // Carregar logos
  const logos = await loadLogos();

  // Header institucional padrão
  let currentY = await generateInstitutionalHeader(pdf, {
    titulo,
    subtitulo,
    fundoEscuro: true
  }, logos);

  currentY += 8;

  // Definir colunas da tabela
  const colWidths = {
    orgao: contentWidth * 0.12,   // Sigla
    tipo: contentWidth * 0.40,    // Nome completo
    servidores: contentWidth * 0.12,
    responsavel: contentWidth * 0.36
  };

  const colX = {
    orgao: margin,
    tipo: margin + colWidths.orgao,
    servidores: margin + colWidths.orgao + colWidths.tipo,
    responsavel: margin + colWidths.orgao + colWidths.tipo + colWidths.servidores
  };

  const rowHeight = 8;
  const headerHeight = 10;

  // Função para desenhar cabeçalho da tabela
  function desenharCabecalhoTabela() {
    // Fundo do cabeçalho
    pdf.setFillColor(...headerBg);
    pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

    // Textos do cabeçalho
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...headerText);
    
    pdf.text('Órgão', colX.orgao + 2, currentY + 6.5);
    pdf.text('Tipo', colX.tipo + 2, currentY + 6.5);
    pdf.text('Servidores', colX.servidores + 2, currentY + 6.5);
    pdf.text('Responsável', colX.responsavel + 2, currentY + 6.5);

    // Linhas verticais do cabeçalho
    pdf.setDrawColor(...headerText);
    pdf.setLineWidth(0.1);
    pdf.line(colX.tipo, currentY, colX.tipo, currentY + headerHeight);
    pdf.line(colX.servidores, currentY, colX.servidores, currentY + headerHeight);
    pdf.line(colX.responsavel, currentY, colX.responsavel, currentY + headerHeight);

    currentY += headerHeight;
  }

  // Função para obter nome do responsável
  function obterResponsavel(unidade: UnidadeOrganizacional): string {
    if (unidade.servidor_responsavel?.full_name) {
      return unidade.servidor_responsavel.full_name;
    }
    
    if (getLotacoesByUnidade) {
      const lotacoesUnidade = getLotacoesByUnidade(unidade.id);
      if (lotacoesUnidade.length > 0 && lotacoesUnidade[0].servidor?.full_name) {
        const primeiroNome = lotacoesUnidade[0].servidor.full_name;
        if (lotacoesUnidade.length > 1) {
          return `${primeiroNome} +${lotacoesUnidade.length - 1} servidores`;
        }
        return primeiroNome;
      }
    }
    
    return '';
  }

  // Construir lista ordenada hierarquicamente
  function construirListaHierarquica(
    parentId: string | null, 
    nivelHierarquico: number = 0
  ): { unidade: UnidadeOrganizacional; nivel: number }[] {
    const filhos = unidades
      .filter(u => u.superior_id === parentId)
      .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome));
    
    let resultado: { unidade: UnidadeOrganizacional; nivel: number }[] = [];
    
    for (const filho of filhos) {
      resultado.push({ unidade: filho, nivel: nivelHierarquico });
      resultado = resultado.concat(construirListaHierarquica(filho.id, nivelHierarquico + 1));
    }
    
    return resultado;
  }

  // Desenhar cabeçalho inicial
  desenharCabecalhoTabela();

  // Obter lista hierárquica
  const listaHierarquica = construirListaHierarquica(null);

  // Desenhar linhas da tabela
  let rowIndex = 0;
  let pageNumber = 1;

  for (const { unidade, nivel } of listaHierarquica) {
    // Verificar quebra de página
    if (currentY > pageHeight - 25) {
      // Rodapé da página atual
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Página ${pageNumber} de ...`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      pdf.addPage();
      pageNumber++;
      currentY = 20;
      desenharCabecalhoTabela();
    }

    const qtdServidores = contarServidores(unidade.id, false);
    const responsavel = exibirNomesServidores ? obterResponsavel(unidade) : '';

    // Fundo alternado
    if (rowIndex % 2 === 1) {
      pdf.setFillColor(...altRowBg);
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Borda inferior
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.2);
    pdf.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    // Indicador visual de hierarquia (barra colorida)
    const corUnidade = CORES_RGB[unidade.tipo] || textColor;
    pdf.setFillColor(...corUnidade);
    pdf.rect(margin, currentY, 2, rowHeight, 'F');

    // Indentação visual no nome
    const indentPx = nivel * 2;

    // Sigla/Órgão
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...corUnidade);
    const sigla = unidade.sigla || unidade.nome.substring(0, 6);
    pdf.text(sigla, colX.orgao + 4 + indentPx, currentY + 5.5);

    // Nome/Tipo
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    const tipoLabel = LABELS_UNIDADE[unidade.tipo];
    const nomeCompleto = `${unidade.nome}`;
    const maxNomeWidth = colWidths.tipo - 4;
    
    // Truncar nome se necessário
    let nomeExibido = nomeCompleto;
    pdf.setFontSize(8);
    while (pdf.getTextWidth(nomeExibido) > maxNomeWidth && nomeExibido.length > 10) {
      nomeExibido = nomeExibido.substring(0, nomeExibido.length - 4) + '...';
    }
    pdf.text(nomeExibido, colX.tipo + 2, currentY + 5.5);

    // Quantidade de servidores
    if (exibirQuantidadeServidores) {
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${qtdServidores} serv.`, colX.servidores + 2, currentY + 5.5);
    }

    // Responsável
    if (exibirNomesServidores && responsavel) {
      pdf.setFontSize(7);
      pdf.setTextColor(...textColor);
      
      // Truncar responsável se necessário
      let respExibido = responsavel;
      const maxRespWidth = colWidths.responsavel - 4;
      while (pdf.getTextWidth(respExibido) > maxRespWidth && respExibido.length > 10) {
        respExibido = respExibido.substring(0, respExibido.length - 4) + '...';
      }
      pdf.text(respExibido, colX.responsavel + 2, currentY + 5.5);
    }

    currentY += rowHeight;
    rowIndex++;
  }

  // Linha final da tabela
  pdf.setDrawColor(0, 68, 68);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, margin + contentWidth, currentY);

  // Resumo final
  currentY += 8;
  if (currentY > pageHeight - 25) {
    pdf.addPage();
    pageNumber++;
    currentY = 20;
  }

  const totalServidores = unidades.reduce((acc, u) => acc + contarServidores(u.id, false), 0);
  
  // Caixa de resumo
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(0, 68, 68);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, currentY, contentWidth, 15, 2, 2, 'FD');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...textColor);
  pdf.text(`Total de Unidades: ${unidades.length}`, margin + 10, currentY + 7);
  pdf.text(`Total de Servidores: ${totalServidores}`, margin + contentWidth / 2, currentY + 7);
  
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Gerado em: ${dataGeracao}`, margin + contentWidth - 10, currentY + 11, { align: 'right' });

  // Rodapé institucional padrão
  generateInstitutionalFooter(pdf, {
    sistema: 'Sistema de Governança Digital IDJUV',
    mostrarData: true
  });

  // Adicionar números de página
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // Salvar
  const nomeArquivo = `estrutura-organizacional-idjuv-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(nomeArquivo);
}
