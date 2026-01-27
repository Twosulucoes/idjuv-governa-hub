import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Packer,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para formatar CPF
function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função auxiliar para formatar data por extenso
function formatarDataExtenso(dataString: string): string {
  const data = new Date(dataString + 'T00:00:00');
  return format(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Função auxiliar para formatar data para cabeçalho da portaria (DD DE MES DE AAAA)
function formatarDataCabecalhoPortaria(dataString: string): string {
  const data = new Date(dataString + 'T00:00:00');
  const dia = format(data, 'dd', { locale: ptBR });
  const mes = format(data, 'MMMM', { locale: ptBR }).toUpperCase();
  const ano = format(data, 'yyyy', { locale: ptBR });
  return `${dia} DE ${mes} DE ${ano}`;
}

// Função auxiliar para formatar número da portaria no padrão oficial
// Formato: PORTARIA Nº XXX/IDJuv/PRESI/GAB/AAAA DE DD DE MES DE AAAA
function formatarCabecalhoPortaria(numero: string, dataDocumento: string): string {
  const dataFormatada = formatarDataCabecalhoPortaria(dataDocumento);
  const ano = new Date(dataDocumento + 'T00:00:00').getFullYear();
  // Extrai apenas o número (remove /ano se já existir)
  const numeroLimpo = numero.split('/')[0];
  return `PORTARIA Nº ${numeroLimpo}/IDJuv/PRESI/GAB/${ano} DE ${dataFormatada}`;
}

// Configurações do Presidente
const PRESIDENTE = {
  nome: 'MARCELO DE MAGALHÃES NUNES',
  cargo: 'Presidente do Instituto de Desporto, Juventude e Lazer',
  orgao: 'do Estado de Roraima',
};

// Tamanhos de fonte em half-points (Word usa half-points)
const FONT_SIZE_10 = 20; // 10pt
const FONT_SIZE_11 = 22; // 11pt
const FONT_SIZE_9 = 18;  // 9pt

// Conversão de cm para twips (1 cm = 567 twips)
const CM_TO_TWIPS = 567;

interface ServidorParaWord {
  nome_completo: string;
  cpf: string;
  cargo: string;
  codigo: string;
}

export async function generatePortariaColetivaWord(
  portaria: { numero: string; data_documento: string },
  cabecalho: string,
  servidores: ServidorParaWord[],
  tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao'
): Promise<void> {
  const verbo = tipoAcao === 'nomeacao' ? 'NOMEAR' : 'EXONERAR';

  // Criar parágrafos do cabeçalho
  const cabecalhoParagrafos = cabecalho.split('\n').filter(linha => linha.trim()).map(linha => 
    new Paragraph({
      children: [
        new TextRun({
          text: linha,
          font: 'Times New Roman',
          size: FONT_SIZE_10,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100, line: 276 }, // 1.15 line spacing
    })
  );

  // Criar linhas da tabela com cabeçalho que repete em cada página
  const tableRows: TableRow[] = [
    // Cabeçalho da tabela - configurado para repetir em novas páginas
    new TableRow({
      tableHeader: true, // Repete em cada página
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Nº', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
          })],
          width: { size: 5, type: WidthType.PERCENTAGE },
          shading: { fill: 'E6E6E6' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'NOME COMPLETO', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
          })],
          width: { size: 38, type: WidthType.PERCENTAGE },
          shading: { fill: 'E6E6E6' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'CPF', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
          })],
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: 'E6E6E6' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'CARGO', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
          })],
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: 'E6E6E6' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'CÓD.', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
          })],
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: 'E6E6E6' },
        }),
      ],
    }),
    // Linhas de dados - configuradas para não quebrar no meio
    ...servidores.map((s, index) =>
      new TableRow({
        cantSplit: true, // Não permite quebrar linha no meio da página
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(index + 1), font: 'Times New Roman', size: FONT_SIZE_9 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: s.nome_completo.toUpperCase(), font: 'Times New Roman', size: FONT_SIZE_9 })],
              spacing: { before: 30, after: 30 },
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: formatarCPF(s.cpf), font: 'Times New Roman', size: FONT_SIZE_9 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: s.cargo, font: 'Times New Roman', size: FONT_SIZE_9 })],
              spacing: { before: 30, after: 30 },
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: s.codigo || '-', font: 'Times New Roman', size: FONT_SIZE_9 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 30, after: 30 },
            })],
          }),
        ],
      })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: Math.round(2.5 * CM_TO_TWIPS),   // 2.5cm
              right: Math.round(2 * CM_TO_TWIPS),   // 2cm
              bottom: Math.round(2 * CM_TO_TWIPS),  // 2cm
              left: Math.round(3 * CM_TO_TWIPS),    // 3cm (padrão ABNT)
            },
          },
        },
        children: [
          // Cabeçalho institucional
          new Paragraph({
            children: [
              new TextRun({
                text: 'GOVERNO DO ESTADO DE RORAIMA',
                bold: true,
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA',
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'IDJuv',
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Título da portaria
          new Paragraph({
            children: [
              new TextRun({
                text: formatarCabecalhoPortaria(portaria.numero, portaria.data_documento),
                bold: true,
                font: 'Times New Roman',
                size: FONT_SIZE_11,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
          }),

          // Parágrafos do cabeçalho/preâmbulo
          ...cabecalhoParagrafos,

          // Art. 1º
          new Paragraph({
            children: [
              new TextRun({
                text: `Art. 1º ${verbo} os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv:`,
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 200, after: 200, line: 276 },
          }),

          // Tabela de servidores
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // Art. 2º
          new Paragraph({
            children: [
              new TextRun({
                text: 'Art. 2º Os servidores nomeados farão jus à remuneração correspondente aos seus respectivos cargos, conforme disposto no Anexo I da Lei nº 2.301, de 29 de dezembro de 2025.',
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 200, after: 100, line: 276 },
          }),

          // Art. 3º
          new Paragraph({
            children: [
              new TextRun({
                text: 'Art. 3º Esta Portaria entra em vigor na data de sua publicação.',
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200, line: 276 },
          }),

          // Local e data
          new Paragraph({
            children: [
              new TextRun({
                text: `Boa Vista – RR, ${formatarDataExtenso(portaria.data_documento)}.`,
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 300, after: 400 },
          }),

          // Assinatura
          new Paragraph({
            children: [
              new TextRun({
                text: PRESIDENTE.nome,
                bold: true,
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: PRESIDENTE.cargo,
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: PRESIDENTE.orgao,
                font: 'Times New Roman',
                size: FONT_SIZE_10,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  // Gerar e salvar o arquivo
  const blob = await Packer.toBlob(doc);
  const nomeArquivo = `Portaria_Coletiva_${portaria.numero.replace(/\//g, '-')}.docx`;
  saveAs(blob, nomeArquivo);
}
