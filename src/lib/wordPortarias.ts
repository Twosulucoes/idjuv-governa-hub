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

// Configurações do Presidente
const PRESIDENTE = {
  nome: 'MARCELO DE MAGALHÃES NUNES',
  cargo: 'Presidente do Instituto de Desporto, Juventude e Lazer',
  orgao: 'do Estado de Roraima',
};

// Tamanho de fonte 9pt em half-points (Word usa half-points)
const FONT_SIZE_9 = 18; // 9 * 2 = 18 half-points

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
          size: FONT_SIZE_9,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
    })
  );

  // Criar linhas da tabela
  const tableRows: TableRow[] = [
    // Cabeçalho da tabela
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Nº', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 5, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'NOME COMPLETO', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 40, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'CPF', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'CARGO', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'CÓDIGO', bold: true, font: 'Times New Roman', size: FONT_SIZE_9 })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    // Linhas de dados
    ...servidores.map((s, index) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(index + 1), font: 'Times New Roman', size: FONT_SIZE_9 })],
              alignment: AlignmentType.CENTER,
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: s.nome_completo.toUpperCase(), font: 'Times New Roman', size: FONT_SIZE_9 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: formatarCPF(s.cpf), font: 'Times New Roman', size: FONT_SIZE_9 })],
              alignment: AlignmentType.CENTER,
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: s.cargo, font: 'Times New Roman', size: FONT_SIZE_9 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: s.codigo || '-', font: 'Times New Roman', size: FONT_SIZE_9 })],
              alignment: AlignmentType.CENTER,
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
              top: 1134, // ~2cm
              right: 1134,
              bottom: 1134,
              left: 1134,
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
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
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
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'IDJUV',
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),

          // Título da portaria
          new Paragraph({
            children: [
              new TextRun({
                text: `PORTARIA Nº ${portaria.numero}/IDJUV`,
                bold: true,
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),

          // Parágrafos do cabeçalho/preâmbulo
          ...cabecalhoParagrafos,

          // Art. 1º
          new Paragraph({
            children: [
              new TextRun({
                text: `Art. 1º ${verbo} os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv:`,
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 240, after: 240 },
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
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 240, after: 120 },
          }),

          // Art. 3º
          new Paragraph({
            children: [
              new TextRun({
                text: 'Art. 3º Esta Portaria entra em vigor na data de sua publicação.',
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 },
          }),

          // Local e data
          new Paragraph({
            children: [
              new TextRun({
                text: `Boa Vista – RR, ${formatarDataExtenso(portaria.data_documento)}.`,
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 360, after: 480 },
          }),

          // Assinatura
          new Paragraph({
            children: [
              new TextRun({
                text: PRESIDENTE.nome,
                bold: true,
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: PRESIDENTE.cargo,
                font: 'Times New Roman',
                size: FONT_SIZE_9,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: PRESIDENTE.orgao,
                font: 'Times New Roman',
                size: FONT_SIZE_9,
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
