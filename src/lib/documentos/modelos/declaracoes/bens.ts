import { paragrafo, secao, tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { campos, cpfDe, enderecoDe, fechamento, marca, naturalidadeDe, nomeArquivoDeclaracao, rgDe, type DadosDeclaracao } from './comum';

/** Linhas do quadro de bens para preencher à mão (o sistema não guarda os bens declarados); cabe numa página com a assinatura. */
const LINHAS_DE_BENS = 5;

/**
 * Declaração de bens e valores. Une as cópias antigas de `pdfGenerator`, `pdfModelos` e `pdfDeclaracoes`; o texto
 * é o de `pdfModelos` (o mais completo: identificação com naturalidade e endereço, Leis 8.429/1992 e 8.730/1993,
 * art. 299 do Código Penal), com o quadro descrição/valor e total (de `pdfGenerator`), as duas opções
 * "não possuo"/"possuo" e o compromisso de atualizar a declaração (de `pdfDeclaracoes`).
 */
export const declaracaoBens: DocumentoModelo<DadosDeclaracao> = {
  tipo: 'declaracoes-bens',
  familia: 'ficha',
  titulo: () => 'Declaração de bens e valores',
  subtitulo: () => 'Art. 13 da Lei nº 8.429/1992 (Improbidade Administrativa) e Lei nº 8.730/1993',
  nomeArquivo: (d) => nomeArquivoDeclaracao('Declaracao_Bens', d),
  blocos: (d) => {
    const s = d.servidor;
    return [
      secao({ texto: 'Identificação do declarante' }),
      campos(2, [
        { rotulo: 'Nome', valor: s?.nome_completo },
        { rotulo: 'Cargo', valor: s?.cargo_nome },
      ]),
      campos(3, [
        { rotulo: 'RG / órgão expedidor', valor: rgDe(s) },
        { rotulo: 'CPF', valor: cpfDe(s) },
        { rotulo: 'Naturalidade', valor: naturalidadeDe(s) },
      ]),
      campos(1, [{ rotulo: 'Residente e domiciliado(a) em', valor: enderecoDe(s) }]),
      paragrafo({ texto: `${marca(false)}  DECLARO, para os devidos fins legais, que NÃO POSSUO bens ou valores a declarar.` }),
      paragrafo({ texto: `${marca(false)}  DECLARO, para os devidos fins legais, que POSSUO os seguintes bens e valores:` }),
      tabela({
        colunas: [
          { chave: 'descricao', titulo: 'Descrição do bem/valor', peso: 4 },
          { chave: 'valor', titulo: 'Valor (R$)', peso: 1.3, alinhamento: 'direita' },
        ],
        linhas: Array.from({ length: LINHAS_DE_BENS }, () => ({ descricao: '', valor: '' })),
        totais: { descricao: 'TOTAL', valor: 'R$' },
        formulario: true,
        alturaMinimaLinha: 7,
      }),

      paragrafo({
        texto:
          'Comprometo-me a atualizar esta declaração sempre que houver alteração patrimonial relevante e ao final do exercício do ' +
          'cargo. Por ser verdade, firmo a presente declaração para que surta os efeitos legais, ciente das penalidades previstas ' +
          'no art. 299 do Código Penal para o crime de falsidade ideológica.',
        alinhamento: 'justificado',
      }),
      ...fechamento(d),
    ];
  },
};
