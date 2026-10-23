import { paragrafo, secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import {
  campos,
  doOrgao,
  fecho,
  nomeArquivoFormulario,
  observacoes,
  secaoDeTexto,
  subtituloNumero,
  tabelaEmBranco,
  type DadosFormulario,
} from './comum';

/**
 * Termo de responsabilidade patrimonial: preenchido na TermoResponsabilidadePage e em branco em Modelos de
 * documentos (RH). Une as duas cópias antigas (`pdfGenerator` e `pdfModelos`).
 */
export interface TermoResponsabilidadePreenchido {
  servidor: string;
  cargo: string;
  matricula: string;
  setor: string;
  /** Lista livre digitada na tela (um bem por linha, com o tombo). */
  bens: string;
  localUtilizacao: string;
  observacoes?: string;
}

export type DadosTermoResponsabilidade = DadosFormulario<TermoResponsabilidadePreenchido>;

const LINHAS_DE_BENS = 6;

export const termoResponsabilidade: DocumentoModelo<DadosTermoResponsabilidade> = {
  tipo: 'formularios-termo-responsabilidade',
  familia: 'ficha',
  titulo: () => 'Termo de responsabilidade patrimonial',
  subtitulo: subtituloNumero,
  nomeArquivo: (d) => nomeArquivoFormulario('Termo_Responsabilidade', d),
  blocos: (d) => {
    const emBranco = !d.preenchido;
    const f: Partial<TermoResponsabilidadePreenchido> = d.preenchido ?? {};
    const compromisso =
      'Declaro ter recebido os bens acima descritos, comprometendo-me a zelar pela sua guarda, conservação e uso ' +
      `adequado, nos termos da IN de Patrimônio ${doOrgao(d.siglaOrgao)}. Estou ciente de que responderei ` +
      'administrativa, civil e penalmente por dano, extravio ou uso indevido dos bens patrimoniais sob minha responsabilidade.';
    // Em branco: tabela de tombo/descrição/estado/local para preencher à mão.
    const bens = emBranco
      ? [
          secao({ texto: '2. Bens sob responsabilidade', reservaAbaixo: 24 }),
          tabelaEmBranco(
            [
              { chave: 'tombo', titulo: 'Nº tombo', peso: 1.6, alinhamento: 'centro' },
              { chave: 'descricao', titulo: 'Descrição do bem', peso: 5 },
              { chave: 'estado', titulo: 'Estado', peso: 1.4, alinhamento: 'centro' },
              { chave: 'local', titulo: 'Local', peso: 1.6, alinhamento: 'centro' },
            ],
            LINHAS_DE_BENS,
          ),
        ]
      : secaoDeTexto(false, '2. Bens sob responsabilidade', f.bens, 0);
    return [
      secao({ texto: '1. Identificação do responsável' }),
      ...campos(emBranco, 2, [
        { rotulo: 'Nome', valor: f.servidor },
        { rotulo: 'Matrícula', valor: f.matricula },
      ]),
      ...campos(emBranco, 2, [
        { rotulo: 'Cargo/função', valor: f.cargo },
        { rotulo: 'Setor/unidade', valor: f.setor },
      ]),

      ...bens,
      // No modelo em branco o local vai por bem, na coluna Local da tabela (como no formulário antigo).
      ...(emBranco ? [] : campos(false, 1, [{ rotulo: 'Local de utilização', valor: f.localUtilizacao }])),

      ...observacoes(emBranco, '3. Observações', f.observacoes, 2),

      secao({ texto: 'Termo de compromisso' }),
      paragrafo({ texto: compromisso, alinhamento: 'justificado' }),
      ...fecho(emBranco, d, f.servidor, ['Responsável', 'Chefia imediata', 'Patrimônio']),
    ];
  },
};
