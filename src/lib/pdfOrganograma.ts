import jsPDF from 'jspdf';
import { UnidadeOrganizacional, LABELS_UNIDADE, CORES_UNIDADE } from '@/types/organograma';

interface OrganogramaData {
  unidades: UnidadeOrganizacional[];
  contarServidores: (unidadeId: string, incluirSub?: boolean) => number;
  titulo?: string;
  subtitulo?: string;
  incluirLogos?: boolean;
}

// Cores por tipo de unidade (valores RGB)
const CORES_RGB: Record<string, [number, number, number]> = {
  presidencia: [22, 163, 74], // green-600
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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function gerarOrganogramaPDF(data: OrganogramaData): Promise<void> {
  const {
    unidades,
    contarServidores,
    titulo = 'ORGANOGRAMA INSTITUCIONAL',
    subtitulo = 'Instituto de Desporto, Juventude e Lazer - IDJUV',
    incluirLogos = true,
  } = data;

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

  // Cores institucionais
  const primaryColor: [number, number, number] = [22, 163, 74]; // Verde
  const textColor: [number, number, number] = [30, 41, 59]; // slate-800

  // Header com logos
  let headerHeight = 30;
  
  if (incluirLogos) {
    try {
      const logoGov = await loadImage('/src/assets/logo-governo-roraima.jpg');
      const logoIdjuv = await loadImage('/src/assets/logo-idjuv-oficial.png');
      
      // Logo esquerda
      pdf.addImage(logoGov, 'JPEG', margin, 10, 35, 20);
      
      // Logo direita
      pdf.addImage(logoIdjuv, 'PNG', pageWidth - margin - 35, 10, 35, 20);
    } catch (error) {
      console.error('Erro ao carregar logos:', error);
    }
    headerHeight = 35;
  }

  // Título
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text(titulo, pageWidth / 2, headerHeight, { align: 'center' });

  // Subtítulo
  if (subtitulo) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text(subtitulo, pageWidth / 2, headerHeight + 6, { align: 'center' });
  }

  // Linha divisória
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, headerHeight + 10, pageWidth - margin, headerHeight + 10);

  // Área de conteúdo
  const startY = headerHeight + 20;
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
  const boxHeight = 22;
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

      // Servidores
      const qtdServidores = contarServidores(unidade.id, false);
      pdf.setFontSize(6);
      pdf.setTextColor(...corBorda);
      pdf.text(`${qtdServidores} serv.`, x + boxWidth / 2, y + 17, { align: 'center' });

      // Responsável (se houver e couber)
      if (unidade.servidor_responsavel?.full_name && boxWidth >= 80) {
        const responsavelNome = unidade.servidor_responsavel.full_name;
        const responsavelExibido = responsavelNome.length > 20 
          ? responsavelNome.substring(0, 18) + '...' 
          : responsavelNome;
        pdf.setFontSize(5);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 116, 139);
        pdf.text(responsavelExibido, x + boxWidth / 2, y + 20, { align: 'center' });
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

  // Legenda
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

  // Rodapé
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Gerado em ${dataGeracao}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Total de unidades e servidores
  const totalServidores = unidades.reduce((acc, u) => acc + contarServidores(u.id, false), 0);
  pdf.text(
    `Total: ${unidades.length} unidades | ${totalServidores} servidores`,
    pageWidth - margin,
    pageHeight - 8,
    { align: 'right' }
  );

  // Salvar PDF
  const nomeArquivo = `organograma-idjuv-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(nomeArquivo);
}

// Versão simplificada em lista hierárquica
export async function gerarOrganogramaListaPDF(data: OrganogramaData): Promise<void> {
  const {
    unidades,
    contarServidores,
    titulo = 'ESTRUTURA ORGANIZACIONAL',
    subtitulo = 'Instituto de Desporto, Juventude e Lazer - IDJUV',
    incluirLogos = true,
  } = data;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const primaryColor: [number, number, number] = [22, 163, 74];
  const textColor: [number, number, number] = [30, 41, 59];

  let currentY = 15;

  // Header com logos
  if (incluirLogos) {
    try {
      const logoGov = await loadImage('/src/assets/logo-governo-roraima.jpg');
      const logoIdjuv = await loadImage('/src/assets/logo-idjuv-oficial.png');
      
      pdf.addImage(logoGov, 'JPEG', margin, 10, 30, 18);
      pdf.addImage(logoIdjuv, 'PNG', pageWidth - margin - 30, 10, 30, 18);
    } catch (error) {
      console.error('Erro ao carregar logos:', error);
    }
    currentY = 35;
  }

  // Título
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...primaryColor);
  pdf.text(titulo, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // Subtítulo
  if (subtitulo) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.text(subtitulo, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
  }

  // Linha
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Construir árvore hierárquica
  function renderUnidade(unidade: UnidadeOrganizacional, indent: number) {
    if (currentY > pageHeight - 30) {
      pdf.addPage();
      currentY = 20;
    }

    const indentX = margin + indent * 8;
    const cor = CORES_RGB[unidade.tipo] || textColor;
    const qtdServidores = contarServidores(unidade.id, false);

    // Marcador
    pdf.setFillColor(...cor);
    pdf.circle(indentX + 2, currentY - 1.5, 1.5, 'F');

    // Nome/Sigla
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...textColor);
    const nome = unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome;
    const nomeExibido = nome.length > 60 ? nome.substring(0, 57) + '...' : nome;
    pdf.text(nomeExibido, indentX + 6, currentY);

    // Tipo e servidores
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${LABELS_UNIDADE[unidade.tipo]} | ${qtdServidores} serv.`, indentX + 6, currentY + 4);

    // Responsável
    if (unidade.servidor_responsavel?.full_name) {
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Resp: ${unidade.servidor_responsavel.full_name}`, indentX + 6, currentY + 8);
      currentY += 4;
    }

    currentY += 10;

    // Filhos
    const filhos = unidades.filter(u => u.superior_id === unidade.id);
    filhos
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach(filho => renderUnidade(filho, indent + 1));
  }

  // Começar pelas raízes
  const raizes = unidades.filter(u => !u.superior_id);
  raizes
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach(raiz => renderUnidade(raiz, 0));

  // Totais
  currentY += 5;
  if (currentY > pageHeight - 30) {
    pdf.addPage();
    currentY = 20;
  }

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  const totalServidores = unidades.reduce((acc, u) => acc + contarServidores(u.id, false), 0);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...textColor);
  pdf.text(`Total de Unidades: ${unidades.length}`, margin, currentY);
  pdf.text(`Total de Servidores: ${totalServidores}`, pageWidth - margin, currentY, { align: 'right' });

  // Rodapé
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Documento gerado em ${dataGeracao}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Salvar
  const nomeArquivo = `estrutura-organizacional-idjuv-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(nomeArquivo);
}
