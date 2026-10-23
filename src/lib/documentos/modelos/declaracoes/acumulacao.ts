import { paragrafo, secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { campos, cpfDe, fechamento, marca, nomeArquivoDeclaracao, rgDe, type DadosDeclaracao } from './comum';

/**
 * Declaração de acumulação (ou não acumulação) de cargos. Une as cópias antigas de `pdfGenerator`, `pdfModelos`
 * e `pdfDeclaracoes`; o texto é o de `pdfModelos` (o mais completo: três situações, cessão e aposentadoria),
 * com o aviso da acumulação ilícita e o compromisso de comunicar mudança (das outras duas), numa página.
 * Na preenchida, `acumula_cargo` marca a opção; sem ele, nenhuma opção sai marcada.
 */
export const declaracaoAcumulacao: DocumentoModelo<DadosDeclaracao> = {
  tipo: 'declaracoes-acumulacao',
  familia: 'ficha',
  titulo: () => 'Declaração de acumulação de cargos',
  subtitulo: () => 'Art. 37, incisos XVI e XVII, da Constituição Federal',
  nomeArquivo: (d) => nomeArquivoDeclaracao('Declaracao_Acumulacao', d),
  blocos: (d) => {
    const s = d.servidor;
    const acumula = s?.acumula_cargo === true;
    const naoAcumula = s?.acumula_cargo === false;
    return [
      secao({ texto: 'Identificação do declarante' }),
      campos(2, [
        { rotulo: 'Nome do(a) servidor(a)', valor: s?.nome_completo },
        { rotulo: 'CPF', valor: cpfDe(s) },
      ]),
      campos(3, [
        { rotulo: 'RG / órgão expedidor', valor: rgDe(s) },
        { rotulo: 'Cargo', valor: s?.cargo_nome },
        { rotulo: 'Lotação', valor: s?.unidade_nome },
      ]),

      secao({ texto: 'Declaração' }),
      paragrafo({
        texto: `DECLARO, para os devidos fins de ocupação de cargo, emprego ou função pública no(a) ${d.orgao || 'órgão'}, que:`,
        alinhamento: 'justificado',
      }),
      paragrafo({ texto: `${marca(naoAcumula)}  NÃO ACUMULO cargos, empregos ou funções públicas.` }),
      paragrafo({ texto: `${marca(acumula)}  ACUMULO licitamente o cargo, emprego ou função pública de:` }),
      campos(2, [
        { rotulo: 'Cargo/função', valor: acumula ? s?.acumulo_descricao : '' },
        { rotulo: 'Órgão/entidade', valor: '' },
      ]),
      paragrafo({ texto: `Se cedido: ${marca(false)} SEM ônus  ${marca(false)} COM ônus para o órgão cessionário (anexar cópia do ato de cedência).` }),
      paragrafo({ texto: `${marca(false)}  SOU APOSENTADO(A) no cargo de ${'_'.repeat(18)}, órgão pagador ${'_'.repeat(16)}.` }),
      paragrafo({
        texto:
          'DECLARO, sob as penalidades da lei, que as informações aqui prestadas são verdadeiras e de minha inteira ' +
          'responsabilidade. Estou ciente de que a falsidade ou omissão de informações pode caracterizar crime de falsidade ' +
          'ideológica (art. 299 do Código Penal), além de infração disciplinar, e de que a acumulação ilícita de cargos, ' +
          'empregos ou funções públicas sujeitará o(a) declarante às penalidades previstas em lei. Comprometo-me a ' +
          'comunicar imediatamente ao setor de gestão de pessoas qualquer alteração na situação aqui declarada.',
        alinhamento: 'justificado',
      }),
      ...fechamento(d),
    ];
  },
};
