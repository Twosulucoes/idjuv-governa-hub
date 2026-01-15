import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  ConfiguracaoRelatorio, 
  CampoRelatorio, 
  NivelAgrupamento,
  TipoRelatorio,
} from '@/types/relatorios';
import { CAMPOS_POR_TIPO, TIPO_RELATORIO_LABELS } from '@/types/relatorios';
import { STATUS_PORTARIA_LABELS } from '@/types/portaria';

// ================================================================
// GERADOR DE PDF AVANÇADO PARA RELATÓRIOS
// ================================================================

interface LogosCarregados {
  gov: HTMLImageElement | null;
  idjuv: HTMLImageElement | null;
}

// Cores institucionais
const CORES = {
  primaria: [0, 100, 60] as [number, number, number],
  secundaria: [0, 80, 120] as [number, number, number],
  textoEscuro: [40, 40, 40] as [number, number, number],
  textoMedio: [100, 100, 100] as [number, number, number],
  fundo: [245, 245, 245] as [number, number, number],
  fundoClaro: [250, 250, 250] as [number, number, number],
  borda: [220, 220, 220] as [number, number, number],
  branco: [255, 255, 255] as [number, number, number],
};

// Carregar imagem
async function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Carregar logos
async function carregarLogos(): Promise<LogosCarregados> {
  const [gov, idjuv] = await Promise.all([
    carregarImagem('/assets/logo-governo-roraima.jpg'),
    carregarImagem('/assets/logo-idjuv-oficial.png'),
  ]);
  return { gov, idjuv };
}

// Formatar valor para exibição
function formatarValor(valor: unknown, campo: CampoRelatorio): string {
  if (valor === null || valor === undefined) return '-';
  
  switch (campo.tipo) {
    case 'data':
      try {
        return format(new Date(String(valor)), 'dd/MM/yyyy');
      } catch {
        return String(valor);
      }
    case 'numero':
      if (campo.id.includes('percentual')) {
        return `${valor}%`;
      }
      if (campo.id.includes('vencimento')) {
        return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      return String(valor);
    case 'badge':
      // Traduzir status se for portaria
      if (campo.id === 'status' && STATUS_PORTARIA_LABELS[valor as keyof typeof STATUS_PORTARIA_LABELS]) {
        return STATUS_PORTARIA_LABELS[valor as keyof typeof STATUS_PORTARIA_LABELS];
      }
      // Capitalizar
      return String(valor).charAt(0).toUpperCase() + String(valor).slice(1).replace(/_/g, ' ');
    default:
      return String(valor);
  }
}

// Obter valor de um campo (suporta campos aninhados)
function obterValor(item: Record<string, unknown>, campoId: string): unknown {
  // Campos especiais processados
  if (campoId in item) {
    return item[campoId];
  }
  
  // Tentar campos aninhados (ex: cargo.nome -> cargo_nome)
  const partes = campoId.split('_');
  if (partes.length > 1) {
    const obj = item[partes[0]];
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[partes.slice(1).join('_')];
    }
  }
  
  return null;
}

// Agrupar dados
function agruparDados(
  dados: Record<string, unknown>[],
  agrupamentos: NivelAgrupamento[],
  campos: CampoRelatorio[],
  nivel = 0
): { grupos: GrupoResultado[]; total: number } {
  if (nivel >= agrupamentos.length || agrupamentos.length === 0) {
    return { grupos: [{ chave: '_root', label: 'Todos', itens: dados, subgrupos: [] }], total: dados.length };
  }

  const agrupamento = agrupamentos[nivel];
  const campo = campos.find((c) => c.id === agrupamento.campo);
  const grupos: Record<string, Record<string, unknown>[]> = {};

  dados.forEach((item) => {
    let chave = String(obterValor(item, agrupamento.campo) || 'Não definido');
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(item);
  });

  // Ordenar chaves
  const chavesOrdenadas = Object.keys(grupos).sort((a, b) => {
    const comp = a.localeCompare(b);
    return agrupamento.ordem === 'asc' ? comp : -comp;
  });

  const gruposResultado: GrupoResultado[] = chavesOrdenadas.map((chave) => {
    const itensGrupo = grupos[chave];
    const labelFormatado = campo ? formatarValor(chave, campo) : chave;
    
    // Recursão para próximo nível
    let subgrupos: GrupoResultado[] = [];
    if (nivel + 1 < agrupamentos.length) {
      const resultado = agruparDados(itensGrupo, agrupamentos, campos, nivel + 1);
      subgrupos = resultado.grupos;
    }

    return {
      chave,
      label: labelFormatado,
      itens: subgrupos.length > 0 ? [] : itensGrupo,
      subgrupos,
      contagem: itensGrupo.length,
    };
  });

  return { grupos: gruposResultado, total: dados.length };
}

interface GrupoResultado {
  chave: string;
  label: string;
  itens: Record<string, unknown>[];
  subgrupos: GrupoResultado[];
  contagem?: number;
}

// ================================================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO
// ================================================================

export async function gerarRelatorioPDF(
  config: ConfiguracaoRelatorio,
  dados: Record<string, unknown>[]
): Promise<void> {
  const doc = new jsPDF({ orientation: config.orientacao === 'paisagem' ? 'l' : 'p' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  let y = margin;
  let paginaAtual = 1;

  // Carregar logos
  let logos: LogosCarregados = { gov: null, idjuv: null };
  if (config.incluirLogos) {
    logos = await carregarLogos();
  }

  // Obter campos selecionados
  const camposDisponiveis = CAMPOS_POR_TIPO[config.tipo];
  const camposSelecionados = camposDisponiveis.filter((c) =>
    config.camposSelecionados.includes(c.id)
  );

  // Calcular larguras das colunas
  const calcularLarguras = (): number[] => {
    const largurasPadrao: Record<string, number> = {
      pequena: 18,
      media: 28,
      grande: 40,
      auto: 0,
    };
    
    let totalFixo = 0;
    let countAuto = 0;
    
    camposSelecionados.forEach((c) => {
      const larg = c.largura || 'auto';
      if (larg !== 'auto') {
        totalFixo += largurasPadrao[larg];
      } else {
        countAuto++;
      }
    });
    
    const autoWidth = countAuto > 0 ? (contentWidth - totalFixo) / countAuto : 0;
    
    return camposSelecionados.map((c) => {
      const larg = c.largura || 'auto';
      return larg === 'auto' ? autoWidth : largurasPadrao[larg];
    });
  };

  const largurasColunas = calcularLarguras();

  // Verificar quebra de página
  const checkPageBreak = (altura: number): void => {
    if (y + altura > pageHeight - 20) {
      addFooter();
      doc.addPage();
      paginaAtual++;
      addHeader();
    }
  };

  // Adicionar header
  const addHeader = (): void => {
    y = margin;
    
    if (config.incluirLogos && logos.gov && logos.idjuv) {
      doc.addImage(logos.gov, 'JPEG', margin, y, 28, 14);
      doc.addImage(logos.idjuv, 'PNG', pageWidth - margin - 28, y, 28, 14);
      y += 18;
    }
    
    // Título
    doc.setFillColor(...CORES.primaria);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setTextColor(...CORES.branco);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(config.titulo, pageWidth / 2, y + 7, { align: 'center' });
    y += 12;
    
    // Subtítulo
    if (config.subtitulo) {
      doc.setTextColor(...CORES.textoMedio);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(config.subtitulo, pageWidth / 2, y + 4, { align: 'center' });
      y += 8;
    }
    
    // Info geração
    doc.setFontSize(7);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} | Total: ${dados.length} registro(s) | Tipo: ${TIPO_RELATORIO_LABELS[config.tipo]}`,
      pageWidth / 2,
      y + 3,
      { align: 'center' }
    );
    y += 8;
  };

  // Adicionar footer
  const addFooter = (): void => {
    doc.setFillColor(...CORES.primaria);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setTextColor(...CORES.branco);
    doc.setFontSize(7);
    doc.text('Sistema de Gestão - IDJUV | Governo do Estado de Roraima', margin, pageHeight - 4);
    doc.text(`Página ${paginaAtual}`, pageWidth - margin - 15, pageHeight - 4);
  };

  // Adicionar cabeçalho de tabela
  const addTableHeader = (indent = 0): void => {
    checkPageBreak(12);
    
    doc.setFillColor(...CORES.borda);
    doc.rect(margin + indent, y, contentWidth - indent, 6, 'F');
    doc.setTextColor(...CORES.textoEscuro);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    let x = margin + indent + 2;
    camposSelecionados.forEach((campo, i) => {
      const text = campo.label.substring(0, Math.floor(largurasColunas[i] / 2.5));
      doc.text(text.toUpperCase(), x, y + 4);
      x += largurasColunas[i];
    });
    
    y += 7;
  };

  // Adicionar linha de dados
  const addDataRow = (item: Record<string, unknown>, rowIndex: number, indent = 0): void => {
    checkPageBreak(6);
    
    // Fundo alternado
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...CORES.fundoClaro);
      doc.rect(margin + indent, y - 1, contentWidth - indent, 5, 'F');
    }
    
    doc.setTextColor(...CORES.textoEscuro);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    let x = margin + indent + 2;
    camposSelecionados.forEach((campo, i) => {
      const valor = obterValor(item, campo.id);
      const texto = formatarValor(valor, campo);
      const maxChars = Math.floor(largurasColunas[i] / 2.2);
      doc.text(texto.substring(0, maxChars), x, y + 2);
      x += largurasColunas[i];
    });
    
    y += 5;
  };

  // Adicionar grupo
  const renderGrupo = (grupo: GrupoResultado, nivel: number): void => {
    const indent = nivel * 8;
    const cores = [CORES.primaria, CORES.secundaria, CORES.textoMedio];
    const cor = cores[Math.min(nivel, cores.length - 1)];
    
    checkPageBreak(10);
    
    // Header do grupo
    doc.setFillColor(...cor);
    doc.rect(margin + indent, y, contentWidth - indent, 7, 'F');
    doc.setTextColor(...CORES.branco);
    doc.setFontSize(9 - nivel);
    doc.setFont('helvetica', 'bold');
    
    const labelGrupo = `${grupo.label} (${grupo.contagem || grupo.itens.length})`;
    doc.text(labelGrupo, margin + indent + 3, y + 5);
    y += 9;

    // Subgrupos ou itens
    if (grupo.subgrupos.length > 0) {
      grupo.subgrupos.forEach((subgrupo) => {
        renderGrupo(subgrupo, nivel + 1);
      });
    } else if (grupo.itens.length > 0) {
      addTableHeader(indent);
      grupo.itens.forEach((item, idx) => {
        addDataRow(item, idx, indent);
      });
    }

    // Subtotal
    if (config.mostrarTotais && grupo.itens.length > 0) {
      doc.setFillColor(...CORES.fundo);
      doc.rect(margin + indent, y, contentWidth - indent, 5, 'F');
      doc.setTextColor(...CORES.textoMedio);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`Subtotal: ${grupo.itens.length} registro(s)`, margin + indent + 3, y + 3.5);
      y += 7;
    }
  };

  // ================================================================
  // RENDERIZAÇÃO
  // ================================================================

  addHeader();

  // Resumo estatístico
  if (config.mostrarResumo && dados.length > 0) {
    checkPageBreak(30);
    
    doc.setFillColor(...CORES.fundo);
    doc.rect(margin, y, contentWidth, 20, 'F');
    doc.setTextColor(...CORES.textoEscuro);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO', margin + 3, y + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Estatísticas por agrupamento principal
    if (config.agrupamentos.length > 0) {
      const campoAgrup = config.agrupamentos[0].campo;
      const contagens: Record<string, number> = {};
      
      dados.forEach((item) => {
        const valor = String(obterValor(item, campoAgrup) || 'Não definido');
        contagens[valor] = (contagens[valor] || 0) + 1;
      });
      
      let xResumo = margin + 3;
      let yResumo = y + 12;
      
      Object.entries(contagens).slice(0, 8).forEach(([chave, count]) => {
        const campo = camposDisponiveis.find((c) => c.id === campoAgrup);
        const label = campo ? formatarValor(chave, campo) : chave;
        const texto = `${label}: ${count}`;
        
        doc.text(texto, xResumo, yResumo);
        xResumo += 45;
        
        if (xResumo > pageWidth - margin - 45) {
          xResumo = margin + 3;
          yResumo += 5;
        }
      });
    }
    
    y += 25;
  }

  // Dados agrupados
  const { grupos } = agruparDados(dados, config.agrupamentos, camposDisponiveis);
  
  if (config.agrupamentos.length === 0) {
    // Sem agrupamento - tabela simples
    addTableHeader();
    dados.forEach((item, idx) => {
      addDataRow(item, idx);
    });
  } else {
    // Com agrupamento
    grupos.forEach((grupo) => {
      if (grupo.chave !== '_root') {
        renderGrupo(grupo, 0);
      } else {
        // Root sem agrupamento
        addTableHeader();
        grupo.itens.forEach((item, idx) => {
          addDataRow(item, idx);
        });
      }
    });
  }

  // Total geral
  if (config.mostrarTotais) {
    checkPageBreak(12);
    
    doc.setFillColor(...CORES.primaria);
    doc.rect(margin, y + 3, contentWidth, 8, 'F');
    doc.setTextColor(...CORES.branco);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GERAL: ${dados.length} registro(s)`, margin + 3, y + 8.5);
  }

  addFooter();

  // Salvar
  const nomeArquivo = `${config.nome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(nomeArquivo);
}
