/**
 * Gerador de PDF para Relatório de Estrutura Organizacional
 * 
 * PADRONIZAÇÃO: Usa o sistema institucional (pdfInstitucional.ts)
 * Colunas: Órgão (Sigla Secretaria), Nome da Unidade, Sigla da Unidade, Sigla Unidade Vinculada, E-mail
 */
import jsPDF from 'jspdf';
import {
  criarDocumentoInstitucional,
  finalizarDocumentoInstitucional,
  CORES_INSTITUCIONAIS,
  MARGENS,
  getDimensoesPagina,
  ConfiguracaoDocumento,
} from './pdfInstitucional';

export interface UnidadeEstruturaData {
  id: string;
  nome: string;
  sigla: string | null;
  email: string | null;
  superior_id: string | null;
  tipo: string;
  nivel: number;
  ativo: boolean;
  superior_sigla?: string | null;
  superior_nome?: string | null;
}

export interface ConfigRelatorioEstrutura {
  titulo?: string;
  subtitulo?: string;
  orgaoSigla?: string;
}

/**
 * Gera relatório de estrutura organizacional em PDF
 */
export const generateRelatorioEstruturaPDF = async (
  unidades: UnidadeEstruturaData[],
  config: ConfigRelatorioEstrutura = {}
): Promise<jsPDF> => {
  const docConfig: ConfiguracaoDocumento = {
    titulo: config.titulo || 'RELATÓRIO DE ESTRUTURA ORGANIZACIONAL',
    subtitulo: config.subtitulo || 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima',
    variante: 'escuro',
    mostrarRodape: true,
    mostrarPaginacao: true,
    orientacao: 'landscape',
  };

  // Criar documento em landscape
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const { largura, larguraUtil } = getDimensoesPagina(doc);

  // Como é landscape, precisamos gerar o cabeçalho manualmente para este caso
  // Usando o padrão institucional adaptado
  let y = 15;

  // Fundo do cabeçalho
  doc.setFillColor(
    CORES_INSTITUCIONAIS.primaria.r,
    CORES_INSTITUCIONAIS.primaria.g,
    CORES_INSTITUCIONAIS.primaria.b
  );
  doc.rect(0, 0, largura, 28, 'F');

  // Textos do cabeçalho
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', largura / 2, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', largura / 2, 16, { align: 'center' });

  doc.setFontSize(11);
  doc.text(docConfig.titulo, largura / 2, 24, { align: 'center' });

  // Linha dourada
  doc.setDrawColor(
    CORES_INSTITUCIONAIS.acento.r,
    CORES_INSTITUCIONAIS.acento.g,
    CORES_INSTITUCIONAIS.acento.b
  );
  doc.setLineWidth(0.8);
  doc.line(0, 28, largura, 28);

  y = 35;

  // Informações do relatório
  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoClaro.r,
    CORES_INSTITUCIONAIS.textoClaro.g,
    CORES_INSTITUCIONAIS.textoClaro.b
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Data de emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    MARGENS.esquerda,
    y
  );
  doc.text(`Total de registros: ${unidades.length}`, largura - MARGENS.direita, y, { align: 'right' });
  y += 8;

  // Definir colunas
  const contentWidth = largura - MARGENS.esquerda - MARGENS.direita;
  const colunas = [
    { header: 'ÓRGÃO (SIGLA)', width: 40 },
    { header: 'NOME DA UNIDADE', width: 100 },
    { header: 'SIGLA', width: 35 },
    { header: 'UNIDADE VINCULADA', width: 45 },
    { header: 'E-MAIL', width: 57 },
  ];

  // Ajustar larguras proporcionalmente
  const totalLargura = colunas.reduce((acc, col) => acc + col.width, 0);
  const fator = contentWidth / totalLargura;
  colunas.forEach((col) => {
    col.width = Math.floor(col.width * fator);
  });

  // Função para desenhar cabeçalho da tabela
  const desenharCabecalho = (posY: number): number => {
    doc.setFillColor(
      CORES_INSTITUCIONAIS.primaria.r,
      CORES_INSTITUCIONAIS.primaria.g,
      CORES_INSTITUCIONAIS.primaria.b
    );
    doc.rect(MARGENS.esquerda, posY, contentWidth, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let x = MARGENS.esquerda + 2;
    colunas.forEach((col) => {
      doc.text(col.header, x, posY + 5.5);
      x += col.width;
    });

    return posY + 10;
  };

  // Cabeçalho da tabela
  y = desenharCabecalho(y);

  // Ordenar unidades por nome
  const unidadesOrdenadas = [...unidades].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );

  // Linhas de dados
  unidadesOrdenadas.forEach((unidade, idx) => {
    // Verificar quebra de página
    if (y > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 15;
      y = desenharCabecalho(y);
    }

    // Fundo alternado
    if (idx % 2 === 1) {
      doc.setFillColor(
        CORES_INSTITUCIONAIS.fundoClaro.r,
        CORES_INSTITUCIONAIS.fundoClaro.g,
        CORES_INSTITUCIONAIS.fundoClaro.b
      );
      doc.rect(MARGENS.esquerda, y - 3, contentWidth, 6, 'F');
    }

    // Dados
    doc.setTextColor(
      CORES_INSTITUCIONAIS.textoEscuro.r,
      CORES_INSTITUCIONAIS.textoEscuro.g,
      CORES_INSTITUCIONAIS.textoEscuro.b
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    const orgaoSigla = config.orgaoSigla || 'IDJuv';

    const valores = [
      orgaoSigla,
      unidade.nome || '-',
      unidade.sigla || '-',
      unidade.superior_sigla || '-',
      unidade.email || '-',
    ];

    let x = MARGENS.esquerda + 2;
    valores.forEach((valor, colIdx) => {
      // Truncar se muito longo
      const maxChars = Math.floor(colunas[colIdx].width / 1.8);
      let textoFinal = valor;
      if (valor.length > maxChars) {
        textoFinal = valor.substring(0, maxChars - 2) + '...';
      }
      doc.text(textoFinal, x, y + 2);
      x += colunas[colIdx].width;
    });

    y += 6;
  });

  // Adicionar rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const pageHeight = doc.internal.pageSize.height;
    const yRodape = pageHeight - 10;

    // Linha separadora
    doc.setDrawColor(
      CORES_INSTITUCIONAIS.bordaClara.r,
      CORES_INSTITUCIONAIS.bordaClara.g,
      CORES_INSTITUCIONAIS.bordaClara.b
    );
    doc.setLineWidth(0.3);
    doc.line(MARGENS.esquerda, yRodape - 5, largura - MARGENS.direita, yRodape - 5);

    // Textos do rodapé
    doc.setTextColor(
      CORES_INSTITUCIONAIS.textoClaro.r,
      CORES_INSTITUCIONAIS.textoClaro.g,
      CORES_INSTITUCIONAIS.textoClaro.b
    );
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    doc.text('Sistema IDJuv', MARGENS.esquerda, yRodape);
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      largura / 2,
      yRodape,
      { align: 'center' }
    );
    doc.text(`Página ${i} de ${totalPages}`, largura - MARGENS.direita, yRodape, { align: 'right' });
  }

  return doc;
};
