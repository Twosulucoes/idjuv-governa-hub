import { paragrafo, secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { LINHA, campos, cpfDe, fechamento, nomeArquivoDeclaracao, rgDe, type DadosDeclaracao } from './comum';

/**
 * Declaração de residência (antes só a preenchida de `pdfGenerator`; mesmo texto). A em branco é o mesmo
 * modelo sem servidor. O endereço sai em campos, um por linha; sem UF padrão: o que falta fica para preencher.
 */
export const declaracaoResidencia: DocumentoModelo<DadosDeclaracao> = {
  tipo: 'declaracoes-residencia',
  familia: 'ficha',
  titulo: () => 'Declaração de residência',
  nomeArquivo: (d) => nomeArquivoDeclaracao('Declaracao_Residencia', d),
  blocos: (d) => {
    const s = d.servidor;
    const nome = s ? s.nome_completo.toUpperCase() : LINHA[1].slice(0, 50);
    const cpf = cpfDe(s) || '_'.repeat(18);
    const rg = rgDe(s) || (s ? '' : '_'.repeat(18));
    const logradouro = s?.endereco_logradouro
      ? [s.endereco_logradouro, `nº ${s.endereco_numero || 'S/N'}`, s.endereco_complemento].filter(Boolean).join(', ')
      : '';
    const cidadeUf = [s?.endereco_cidade, s?.endereco_uf].filter(Boolean).join('/');
    return [
      paragrafo({
        texto:
          `Eu, ${nome}, inscrito(a) no CPF sob o nº ${cpf}${rg ? `, portador(a) do RG nº ${rg}` : ''}, DECLARO, ` +
          'para os devidos fins e sob as penas da lei, que resido no seguinte endereço:',
        alinhamento: 'justificado',
      }),
      secao({ texto: 'Endereço' }),
      campos(1, [{ rotulo: 'Logradouro, número e complemento', valor: logradouro }]),
      campos(3, [
        { rotulo: 'Bairro', valor: s?.endereco_bairro },
        { rotulo: 'Cidade/UF', valor: cidadeUf },
        { rotulo: 'CEP', valor: s?.endereco_cep },
      ]),
      paragrafo({
        texto:
          'Declaro, ainda, que as informações acima prestadas são verdadeiras e que estou ciente de que a falsidade das ' +
          'informações configura crime previsto no Código Penal Brasileiro, passível de apuração na forma da Lei.',
        alinhamento: 'justificado',
      }),
      ...fechamento(d),
    ];
  },
};
