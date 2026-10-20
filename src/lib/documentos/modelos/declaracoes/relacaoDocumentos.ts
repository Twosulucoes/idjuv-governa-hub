import { paragrafo, secao } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Relação de documentos para o cadastro funcional (antigo `generateRelacaoDocumentosModelo`, mesmas listas). */
export interface DadosRelacaoDocumentos {
  /** Nome oficial do órgão (identidade do tenant), citado na introdução. */
  orgao?: string;
}

const GRUPOS: { titulo: string; itens: string[] }[] = [
  {
    titulo: '1. Documentos pessoais',
    itens: [
      'Ficha Cadastral do Servidor preenchida e assinada',
      '01 (uma) foto 3x4 recente',
      'Cópia do RG (Carteira de Identidade)',
      'Cópia do CPF',
      'Cópia do Título de Eleitor com comprovante da última votação',
      'Cópia do PIS/PASEP (ou declaração de primeiro emprego)',
      'Certidão de Antecedentes Criminais (Estadual e Federal)',
      'Cópia do Comprovante de Residência atualizado (emitido nos últimos 90 dias)',
      'Cópia do Certificado/Diploma de Escolaridade com Histórico Escolar',
      'Cópia do Documento de Quitação Militar (para sexo masculino)',
      'Cópia da Certidão de Nascimento, Casamento ou União Estável',
      'Cópia da CNH, se possuir',
      'Comprovante de dados bancários (conta corrente em nome do servidor)',
    ],
  },
  {
    titulo: '2. Declarações obrigatórias',
    itens: ['Declaração de Acumulação ou Não Acumulação de Cargos Públicos', 'Declaração de Bens e Valores'],
  },
  {
    titulo: '3. Documentos de dependentes (se houver)',
    itens: [
      'Cópia do CPF de filhos até 21 anos',
      'Para menores de 14 anos: Certidão de Nascimento e Carteira de Vacinação',
      'Declaração de matrícula escolar dos dependentes menores',
    ],
  },
  {
    titulo: '4. Para servidores cedidos',
    itens: ['Cópia do Decreto ou Portaria de cedência', 'Declaração do órgão de origem sobre situação funcional'],
  },
  {
    titulo: 'Observações importantes',
    itens: [
      'Todas as cópias devem ser legíveis e, preferencialmente, autenticadas ou apresentadas junto aos originais.',
      'A não entrega da documentação completa impede a conclusão do cadastro funcional.',
      'Documentos em língua estrangeira devem estar acompanhados de tradução juramentada.',
    ],
  },
];

const lista = (itens: string[]): Bloco => paragrafo({ texto: itens.map((i) => `•  ${i}`).join('\n') });

export const relacaoDocumentos: DocumentoModelo<DadosRelacaoDocumentos> = {
  tipo: 'declaracoes-relacao-documentos',
  familia: 'ficha',
  titulo: () => 'Documentos obrigatórios para cadastro',
  nomeArquivo: () => 'Relacao_Documentos_Cadastro.pdf',
  blocos: (d) => [
    paragrafo({
      texto: `Para fins de cadastro funcional no(a) ${d.orgao || 'órgão'}, o(a) servidor(a) deverá apresentar os seguintes documentos:`,
      alinhamento: 'justificado',
    }),
    ...GRUPOS.flatMap((g) => [secao({ texto: g.titulo }), lista(g.itens)]),
  ],
};
