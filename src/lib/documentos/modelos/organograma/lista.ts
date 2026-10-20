import { camposChaveValor, tabela, type ColunaTabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { arvoreOrganograma, dataDoArquivo, emOrdemHierarquica, totalServidores, type UnidadeOrganograma } from './comum';

export interface ServidorOrganograma {
  nome: string;
  cargo: string;
}

export interface UnidadeOrganogramaLista extends UnidadeOrganograma {
  /** Responsável e lotados, nessa ordem (vazio quando a tela não pede os nomes). */
  servidores: ServidorOrganograma[];
}

export interface DadosOrganogramaLista {
  titulo?: string;
  subtitulo?: string;
  unidades: UnidadeOrganogramaLista[];
  exibirNomesServidores: boolean;
  exibirQuantidadeServidores: boolean;
  /** Até 5 servidores por unidade (um por linha); sem ela, só o primeiro e "+N". */
  exibirTodosServidores: boolean;
}

/** Quantos nomes a lista completa mostra por unidade (o resto vira "+N servidores"). */
const MAXIMO_NOMES = 5;

const comCargo = (s: ServidorOrganograma): string => `${s.nome} (${s.cargo})`;

function textoServidores(servidores: ServidorOrganograma[], todos: boolean): string {
  if (servidores.length === 0) return '(Sem lotação)';
  if (!todos) return `${comCargo(servidores[0])}${servidores.length > 1 ? ` +${servidores.length - 1}` : ''}`;
  const resto = servidores.length - MAXIMO_NOMES;
  return [...servidores.slice(0, MAXIMO_NOMES).map(comCargo), ...(resto > 0 ? [`+${resto} servidores`] : [])].join('\n');
}

/** Estrutura organizacional em lista: uma linha por unidade, na ordem da hierarquia. */
export const organogramaLista: DocumentoModelo<DadosOrganogramaLista> = {
  tipo: 'organograma-lista',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: (d) => d.titulo || 'Estrutura organizacional',
  subtitulo: (d) => d.subtitulo,
  nomeArquivo: () => `estrutura-organizacional-${dataDoArquivo()}.pdf`,
  blocos: (d) => {
    const siglaPorId = new Map(d.unidades.map((u) => [u.id, u.sigla || u.nome]));
    const colunas: ColunaTabela[] = [
      { chave: 'sigla', titulo: 'Sigla', peso: 1.3 },
      { chave: 'nome', titulo: 'Unidade', peso: 3.2 },
      { chave: 'superior', titulo: 'Superior', peso: 1.3 },
      ...(d.exibirQuantidadeServidores ? [{ chave: 'quantidade', titulo: 'Servidores', peso: 1.4, alinhamento: 'direita' as const }] : []),
      ...(d.exibirNomesServidores ? [{ chave: 'servidores', titulo: 'Responsável e lotados', peso: 4 }] : []),
    ];
    return [
      tabela({
        colunas,
        linhas: emOrdemHierarquica(arvoreOrganograma(d.unidades)).map(({ unidade: u }) => ({
          sigla: u.sigla,
          nome: u.nome,
          superior: u.superiorId ? siglaPorId.get(u.superiorId) : null,
          quantidade: u.quantidadeServidores,
          servidores: textoServidores(u.servidores, d.exibirTodosServidores),
        })),
      }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Total de unidades', valor: d.unidades.length },
          { rotulo: 'Total de servidores', valor: totalServidores(d.unidades) },
        ],
      }),
    ];
  },
};
