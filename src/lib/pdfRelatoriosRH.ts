/**
 * Geração de Relatórios de RH - IDJUV
 * Utiliza template institucional unificado
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionTitle,
  addSectionHeader,
  addField,
  addTableHeader,
  addTableRow,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCPF,
  formatDate,
  checkPageBreak,
} from './pdfTemplate';

// ===== Interfaces =====

interface ServidorDiretoriaItem {
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  vinculo: string;
  situacao: string;
}

interface GrupoDiretoria {
  unidade_nome: string;
  unidade_sigla: string | null;
  unidade_tipo?: string;
  nivel?: number;
  caminho_hierarquico?: string;
  servidores: ServidorDiretoriaItem[];
}

interface RelatorioServidoresDiretoriaData {
  grupos: GrupoDiretoria[];
  totalServidores: number;
  dataGeracao: string;
  filtroUnidade: string | null;
}

interface ServidorVinculoItem {
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  unidade: string;
  situacao: string;
}

interface GrupoVinculo {
  vinculo: string;
  servidores: ServidorVinculoItem[];
}

interface RelatorioServidoresVinculoData {
  grupos: GrupoVinculo[];
  totalServidores: number;
  dataGeracao: string;
  filtroVinculo: string | null;
}

interface HistoricoItem {
  data: string;
  tipo: string;
  descricao: string;
  portaria: string | null;
  cargo_anterior?: string;
  cargo_novo?: string;
  unidade_anterior?: string;
  unidade_nova?: string;
}

interface PortariaItem {
  numero: string;
  ano: number;
  tipo: string;
  assunto: string;
  data_publicacao: string;
}

interface FeriasItem {
  periodo_aquisitivo: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
}

interface LicencaItem {
  tipo: string | null;
  data_inicio: string;
  data_fim: string | null;
  dias: number | null;
}

interface RelatorioHistoricoFuncionalData {
  servidor: {
    nome: string;
    cpf: string;
    matricula: string | null;
    cargo: string;
    unidade: string;
    vinculo: string;
    situacao: string;
    data_admissao: string | null;
  };
  historico: HistoricoItem[];
  portarias: PortariaItem[];
  ferias: FeriasItem[];
  licencas: LicencaItem[];
  dataGeracao: string;
}

// Interface para Relatório de Vagas por Cargo
interface CargoVagaItem {
  id: string;
  nome: string;
  sigla: string | null;
  natureza: string;
  quantidade_vagas: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  percentual_ocupacao: number;
  vencimento_base: number | null;
}

interface GrupoNatureza {
  natureza: string;
  natureza_label: string;
  cargos: CargoVagaItem[];
  total_previstas: number;
  total_ocupadas: number;
  total_disponiveis: number;
}

interface RelatorioVagasCargoData {
  grupos: GrupoNatureza[];
  totalCargos: number;
  totalPrevistas: number;
  totalOcupadas: number;
  totalDisponiveis: number;
  percentualGeral: number;
  dataGeracao: string;
  filtroNatureza: string | null;
}

// ===== Relatório por Diretoria =====

// Labels para tipos de unidade
const TIPO_UNIDADE_LABELS: Record<string, string> = {
  presidencia: 'PRESIDÊNCIA',
  diretoria: 'DIRETORIA',
  coordenacao: 'ASSESSORIA/COORDENAÇÃO',
  divisao: 'DIVISÃO',
  nucleo: 'NÚCLEO',
  setor: 'SETOR',
};

// Cores por nível hierárquico
const CORES_NIVEL: Record<number, { bg: string; border: string }> = {
  1: { bg: '#1a365d', border: '#1a365d' }, // Presidência - azul escuro
  2: { bg: '#2c5282', border: '#2c5282' }, // Diretorias/Assessorias - azul médio
  3: { bg: '#3182ce', border: '#3182ce' }, // Divisões - azul claro
  4: { bg: '#63b3ed', border: '#63b3ed' }, // Núcleos - azul mais claro
};

export const generateRelatorioServidoresDiretoria = async (data: RelatorioServidoresDiretoriaData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  const subtitulo = data.filtroUnidade 
    ? `Filtro: ${data.filtroUnidade}` 
    : 'Todas as Unidades Organizacionais';
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES POR ESTRUTURA ORGANIZACIONAL',
    subtitulo,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${data.totalServidores}`, width - PAGINA.margemDireita - 50, y);
  y += 10;
  
  // Variável para rastrear o caminho anterior e mostrar separadores visuais
  let caminhoAnterior = '';
  
  // Iterar grupos ordenados hierarquicamente
  data.grupos.forEach((grupo) => {
    y = checkPageBreak(doc, y, 60);
    
    // Determinar nível e cor
    const nivel = grupo.nivel || 2;
    const indentacao = Math.min((nivel - 1) * 5, 15); // Indentação máxima de 15
    const corNivel = CORES_NIVEL[nivel] || CORES_NIVEL[4];
    const tipoLabel = TIPO_UNIDADE_LABELS[grupo.unidade_tipo || 'diretoria'] || '';
    
    // Se mudou a hierarquia superior, adicionar linha separadora
    const caminhoAtual = grupo.caminho_hierarquico || '';
    const partesAnterior = caminhoAnterior.split(' > ');
    const partesAtual = caminhoAtual.split(' > ');
    
    // Se a primeira parte (presidência/diretoria principal) mudou, adicionar separador maior
    if (partesAnterior[0] && partesAtual[0] && partesAnterior.length > 1 && 
        partesAnterior.slice(0, -1).join(' > ') !== partesAtual.slice(0, -1).join(' > ')) {
      y += 3;
    }
    caminhoAnterior = caminhoAtual;
    
    // Header do grupo com cor baseada no nível
    doc.setFillColor(corNivel.bg);
    const headerHeight = nivel === 1 ? 10 : 8;
    doc.rect(PAGINA.margemEsquerda + indentacao, y - 5, contentWidth - indentacao, headerHeight, 'F');
    
    // Texto do header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(nivel === 1 ? 11 : 10);
    doc.setFont('helvetica', 'bold');
    
    const unidadeLabel = grupo.unidade_sigla 
      ? `${grupo.unidade_sigla} - ${grupo.unidade_nome}` 
      : grupo.unidade_nome;
    
    // Mostrar tipo da unidade para contexto
    const prefixo = nivel > 1 && tipoLabel ? `[${tipoLabel}] ` : '';
    const textoCompleto = `${prefixo}${unidadeLabel} (${grupo.servidores.length})`;
    
    doc.text(textoCompleto.substring(0, 70), PAGINA.margemEsquerda + indentacao + 2, y + (nivel === 1 ? 1 : 0));
    y += headerHeight + 2;
    
    // Mostrar caminho hierárquico para contexto (apenas se não for nível 1)
    if (nivel > 1 && grupo.caminho_hierarquico) {
      setColor(doc, CORES.cinzaMedio);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`Hierarquia: ${grupo.caminho_hierarquico}`, PAGINA.margemEsquerda + indentacao + 2, y);
      y += 5;
    }
    
    // Table header
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const tableStart = PAGINA.margemEsquerda + indentacao;
    doc.text('Nome', tableStart + 2, y);
    doc.text('CPF', 85, y);
    doc.text('Cargo', 115, y);
    doc.text('Vínculo', 155, y);
    doc.text('Situação', 178, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(tableStart, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    // Rows
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    grupo.servidores.forEach((s) => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(s.nome.substring(0, 35), tableStart + 2, y);
      doc.text(formatCPF(s.cpf), 85, y);
      doc.text((s.cargo || '-').substring(0, 20), 115, y);
      doc.text((s.vinculo || '-').substring(0, 12), 155, y);
      doc.text((s.situacao || '-').substring(0, 10), 178, y);
      y += 5;
    });
    
    y += 5;
  });
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Servidores_Estrutura_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};

// ===== Relatório por Vínculo =====

export const generateRelatorioServidoresVinculo = async (data: RelatorioServidoresVinculoData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  const subtitulo = data.filtroVinculo 
    ? `Filtro: ${data.filtroVinculo}` 
    : 'Todos os Vínculos Funcionais';
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES POR VÍNCULO FUNCIONAL',
    subtitulo,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${data.totalServidores}`, width - PAGINA.margemDireita - 50, y);
  y += 10;
  
  // Iterar grupos
  data.grupos.forEach((grupo) => {
    y = checkPageBreak(doc, y, 60);
    
    // Header do grupo
    setColor(doc, CORES.cinzaMuitoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
    setColor(doc, CORES.textoEscuro);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${grupo.vinculo} (${grupo.servidores.length} servidores)`, PAGINA.margemEsquerda + 2, y);
    y += 10;
    
    // Table header
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nome', PAGINA.margemEsquerda + 2, y);
    doc.text('CPF', 80, y);
    doc.text('Cargo', 110, y);
    doc.text('Unidade', 150, y);
    doc.text('Situação', 178, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    // Rows
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    grupo.servidores.forEach((s) => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(s.nome.substring(0, 32), PAGINA.margemEsquerda + 2, y);
      doc.text(formatCPF(s.cpf), 80, y);
      doc.text((s.cargo || '-').substring(0, 20), 110, y);
      doc.text((s.unidade || '-').substring(0, 15), 150, y);
      doc.text((s.situacao || '-').substring(0, 10), 178, y);
      y += 5;
    });
    
    y += 5;
  });
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Servidores_Vinculo_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};

// ===== Histórico Funcional Individual =====

export const generateRelatorioHistoricoFuncional = async (data: RelatorioHistoricoFuncionalData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE HISTÓRICO FUNCIONAL',
    fundoEscuro: true,
  }, logos);
  
  // Dados do servidor
  y = addSectionHeader(doc, 'DADOS DO SERVIDOR', y);
  
  const col1 = PAGINA.margemEsquerda;
  const col2 = PAGINA.margemEsquerda + contentWidth / 2;
  const colWidth = contentWidth / 2 - 5;
  
  addField(doc, 'Nome', data.servidor.nome, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'CPF', formatCPF(data.servidor.cpf), col1, y, colWidth);
  addField(doc, 'Matrícula', data.servidor.matricula || '-', col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Cargo', data.servidor.cargo, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'Unidade', data.servidor.unidade, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'Vínculo', data.servidor.vinculo, col1, y, colWidth);
  addField(doc, 'Situação', data.servidor.situacao, col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Data Admissão', formatDate(data.servidor.data_admissao), col1, y, colWidth);
  y += 10;
  
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  y += 8;
  
  // Histórico Funcional
  if (data.historico.length > 0) {
    y = addSectionHeader(doc, 'HISTÓRICO FUNCIONAL', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Data', PAGINA.margemEsquerda + 2, y);
    doc.text('Tipo', 45, y);
    doc.text('Descrição', 85, y);
    doc.text('Portaria', 165, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.historico.forEach(h => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(formatDate(h.data), PAGINA.margemEsquerda + 2, y);
      doc.text((h.tipo || '-').substring(0, 18), 45, y);
      doc.text((h.descricao || '-').substring(0, 45), 85, y);
      doc.text((h.portaria || '-').substring(0, 15), 165, y);
      y += 5;
    });
    y += 5;
  }
  
  // Portarias
  if (data.portarias.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionHeader(doc, 'PORTARIAS VINCULADAS', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Número', PAGINA.margemEsquerda + 2, y);
    doc.text('Tipo', 55, y);
    doc.text('Assunto', 90, y);
    doc.text('Data Publicação', 160, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.portarias.forEach(p => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(`${p.numero}/${p.ano}`, PAGINA.margemEsquerda + 2, y);
      doc.text((p.tipo || '-').substring(0, 15), 55, y);
      doc.text((p.assunto || '-').substring(0, 40), 90, y);
      doc.text(formatDate(p.data_publicacao), 160, y);
      y += 5;
    });
    y += 5;
  }
  
  // Férias
  if (data.ferias.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionHeader(doc, 'FÉRIAS REGISTRADAS', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Período Aquisitivo', PAGINA.margemEsquerda + 2, y);
    doc.text('Início', 90, y);
    doc.text('Fim', 125, y);
    doc.text('Dias', 160, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.ferias.forEach(f => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(f.periodo_aquisitivo || '-', PAGINA.margemEsquerda + 2, y);
      doc.text(formatDate(f.data_inicio), 90, y);
      doc.text(formatDate(f.data_fim), 125, y);
      doc.text(String(f.dias || 0), 160, y);
      y += 5;
    });
    y += 5;
  }
  
  // Licenças
  if (data.licencas.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionHeader(doc, 'LICENÇAS E AFASTAMENTOS', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo', PAGINA.margemEsquerda + 2, y);
    doc.text('Início', 90, y);
    doc.text('Fim', 125, y);
    doc.text('Dias', 160, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.licencas.forEach(l => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text((l.tipo || '-').substring(0, 35), PAGINA.margemEsquerda + 2, y);
      doc.text(formatDate(l.data_inicio), 90, y);
      doc.text(formatDate(l.data_fim), 125, y);
      doc.text(String(l.dias || '-'), 160, y);
      y += 5;
    });
  }
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  const nomeArquivo = data.servidor.nome.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Historico_Funcional_${nomeArquivo}_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};

// ===== Relatório de Vagas por Cargo =====

const NATUREZA_LABELS: Record<string, string> = {
  comissionado: 'Cargos Comissionados',
  efetivo: 'Cargos Efetivos',
  funcao_gratificada: 'Funções Gratificadas',
  temporario: 'Cargos Temporários',
  estagiario: 'Estagiários',
};

export const generateRelatorioVagasCargo = async (data: RelatorioVagasCargoData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  
  const subtitulo = data.filtroNatureza 
    ? `Filtro: ${NATUREZA_LABELS[data.filtroNatureza] || data.filtroNatureza}` 
    : 'Todas as Naturezas de Cargo';
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE VAGAS DISPONÍVEIS POR CARGO',
    subtitulo,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de cargos: ${data.totalCargos}`, width - PAGINA.margemDireita - 40, y);
  y += 10;
  
  // Iterar grupos por natureza
  data.grupos.forEach((grupo) => {
    if (grupo.cargos.length === 0) return;
    
    y = checkPageBreak(doc, y, 70);
    
    // Header do grupo
    setColor(doc, CORES.cinzaMuitoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
    setColor(doc, CORES.textoEscuro);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`▶ ${grupo.natureza_label.toUpperCase()} (${grupo.cargos.length} cargos)`, PAGINA.margemEsquerda + 2, y);
    y += 10;
    
    // Table header
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Cargo', PAGINA.margemEsquerda + 2, y);
    doc.text('Símbolo', 95, y);
    doc.text('Previstas', 120, y);
    doc.text('Ocupadas', 142, y);
    doc.text('Disponíveis', 164, y);
    doc.text('%', 190, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    // Rows
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    grupo.cargos.forEach((c) => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(c.nome.substring(0, 40), PAGINA.margemEsquerda + 2, y);
      doc.text((c.sigla || '-').substring(0, 12), 95, y);
      doc.text(String(c.quantidade_vagas), 125, y);
      doc.text(String(c.vagas_ocupadas), 149, y);
      doc.text(String(c.vagas_disponiveis), 172, y);
      
      // Colorir percentual
      const pct = c.percentual_ocupacao;
      if (pct >= 100) {
        setColor(doc, { r: 220, g: 38, b: 38 }); // vermelho
      } else if (pct >= 75) {
        setColor(doc, { r: 234, g: 179, b: 8 }); // amarelo
      } else {
        setColor(doc, { r: 34, g: 197, b: 94 }); // verde
      }
      doc.text(`${pct.toFixed(0)}%`, 190, y);
      setColor(doc, CORES.textoEscuro);
      y += 5;
    });
    
    // Subtotal do grupo
    y += 2;
    setColor(doc, CORES.cinzaClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 7, 'F');
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Subtotal ${grupo.natureza_label}:`, PAGINA.margemEsquerda + 2, y);
    doc.text(String(grupo.total_previstas), 125, y);
    doc.text(String(grupo.total_ocupadas), 149, y);
    doc.text(String(grupo.total_disponiveis), 172, y);
    const pctGrupo = grupo.total_previstas > 0 ? (grupo.total_ocupadas / grupo.total_previstas) * 100 : 0;
    doc.text(`${pctGrupo.toFixed(0)}%`, 190, y);
    y += 12;
  });
  
  // Resumo geral
  y = checkPageBreak(doc, y, 60);
  y = addSectionHeader(doc, 'RESUMO GERAL', y);
  
  const col1 = PAGINA.margemEsquerda;
  const col2 = PAGINA.margemEsquerda + contentWidth / 2;
  const colWidth = contentWidth / 2 - 5;
  
  addField(doc, 'Total de Cargos', String(data.totalCargos), col1, y, colWidth);
  addField(doc, 'Vagas Previstas', String(data.totalPrevistas), col2, y, colWidth);
  y += 12;
  
  addField(doc, 'Vagas Ocupadas', String(data.totalOcupadas), col1, y, colWidth);
  addField(doc, 'Vagas Disponíveis', String(data.totalDisponiveis), col2, y, colWidth);
  y += 12;
  
  // Barra de progresso visual
  const barWidth = 120;
  const barHeight = 12;
  const barX = col1;
  const barY = y;
  
  // Fundo da barra
  setColor(doc, CORES.cinzaMuitoClaro, 'fill');
  doc.rect(barX, barY, barWidth, barHeight, 'F');
  
  // Preenchimento
  const fillWidth = (data.percentualGeral / 100) * barWidth;
  if (data.percentualGeral >= 90) {
    setColor(doc, { r: 220, g: 38, b: 38 }, 'fill');
  } else if (data.percentualGeral >= 70) {
    setColor(doc, { r: 234, g: 179, b: 8 }, 'fill');
  } else {
    setColor(doc, { r: 34, g: 197, b: 94 }, 'fill');
  }
  doc.rect(barX, barY, fillWidth, barHeight, 'F');
  
  // Borda
  setColor(doc, CORES.cinzaMedio, 'draw');
  doc.rect(barX, barY, barWidth, barHeight, 'S');
  
  // Texto do percentual
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Taxa de Ocupação: ${data.percentualGeral.toFixed(1)}%`, barX + barWidth + 10, barY + 8);
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Vagas_Cargo_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};

// ===== Interfaces para Relatório de Servidores com Portarias =====

interface PortariaServidorItem {
  numero: string;
  titulo: string;
  tipo: string;
  categoria: string | null;
  status: string;
  data_documento: string;
  data_publicacao: string | null;
}

interface ServidorComPortariasItem {
  id: string;
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  unidade: string;
  vinculo: string;
  portarias: PortariaServidorItem[];
}

interface RelatorioServidoresPortariasData {
  servidores: ServidorComPortariasItem[];
  totalServidores: number;
  totalPortarias: number;
  dataGeracao: string;
  filtroTipo: string | null;
  filtroStatus: string | null;
}

// ===== Relatório de Servidores com Portarias =====

export const generateRelatorioServidoresPortarias = async (data: RelatorioServidoresPortariasData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  
  let subtitulo = 'Todas as Portarias';
  if (data.filtroTipo && data.filtroStatus) {
    subtitulo = `Filtro: ${data.filtroTipo} - ${data.filtroStatus}`;
  } else if (data.filtroTipo) {
    subtitulo = `Filtro: ${data.filtroTipo}`;
  } else if (data.filtroStatus) {
    subtitulo = `Filtro: ${data.filtroStatus}`;
  }
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES COM PORTARIAS',
    subtitulo,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Servidores: ${data.totalServidores} | Portarias: ${data.totalPortarias}`, width - PAGINA.margemDireita - 60, y);
  y += 10;
  
  // Iterar servidores
  data.servidores.forEach((servidor) => {
    if (servidor.portarias.length === 0) return;
    
    y = checkPageBreak(doc, y, 60);
    
    // Header do servidor
    setColor(doc, CORES.cinzaMuitoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 12, 'F');
    setColor(doc, CORES.textoEscuro);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${servidor.nome}`, PAGINA.margemEsquerda + 2, y);
    y += 5;
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const infoServidor = [
      `CPF: ${formatCPF(servidor.cpf)}`,
      servidor.matricula ? `Mat: ${servidor.matricula}` : null,
      `Cargo: ${servidor.cargo}`,
      `Unidade: ${servidor.unidade}`,
    ].filter(Boolean).join(' | ');
    doc.text(infoServidor.substring(0, 100), PAGINA.margemEsquerda + 2, y);
    y += 8;
    
    // Table header de portarias
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Número', PAGINA.margemEsquerda + 2, y);
    doc.text('Tipo', 45, y);
    doc.text('Categoria', 75, y);
    doc.text('Título', 105, y);
    doc.text('Data Doc.', 160, y);
    doc.text('Status', 182, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    // Rows de portarias
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    servidor.portarias.forEach((p) => {
      y = checkPageBreak(doc, y, 25);
      
      doc.text((p.numero || '-').substring(0, 15), PAGINA.margemEsquerda + 2, y);
      doc.text((p.tipo || '-').substring(0, 12), 45, y);
      doc.text((p.categoria || '-').substring(0, 12), 75, y);
      doc.text((p.titulo || '-').substring(0, 28), 105, y);
      doc.text(formatDate(p.data_documento), 160, y);
      
      // Colorir status
      const status = p.status || 'minuta';
      if (status === 'publicado' || status === 'vigente') {
        setColor(doc, { r: 34, g: 197, b: 94 }); // verde
      } else if (status === 'assinado' || status === 'aguardando_publicacao') {
        setColor(doc, { r: 59, g: 130, b: 246 }); // azul
      } else if (status === 'revogado') {
        setColor(doc, { r: 220, g: 38, b: 38 }); // vermelho
      } else {
        setColor(doc, CORES.cinzaMedio);
      }
      doc.text((status || '-').substring(0, 12), 182, y);
      setColor(doc, CORES.textoEscuro);
      y += 5;
    });
    
    y += 6;
  });
  
  // Resumo
  y = checkPageBreak(doc, y, 40);
  y += 5;
  setColor(doc, CORES.cinzaClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 12, 'F');
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`RESUMO: ${data.totalServidores} servidores com ${data.totalPortarias} portarias vinculadas`, PAGINA.margemEsquerda + 5, y + 2);
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Servidores_Portarias_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};
