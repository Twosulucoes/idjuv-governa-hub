import {
  VINCULO_EXTERNO_ESFERA_LABELS,
  VINCULO_EXTERNO_FORMA_LABELS,
  type VinculoExternoEsfera,
  type VinculoExternoForma,
} from '@/types/rh';
import { camposChaveValor, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Servidores com vínculo funcional externo (outro órgão), opcionalmente agrupados por esfera ou forma. */
export interface ServidorSegundoVinculo {
  nome: string;
  cpf: string;
  matricula: string | null;
  vinculo_idjuv: string;
  cargo_idjuv: string;
  unidade_idjuv: string;
  vinculo_externo_esfera: string;
  vinculo_externo_orgao: string;
  vinculo_externo_cargo: string;
  vinculo_externo_matricula: string | null;
  vinculo_externo_forma: string;
  vinculo_externo_ato_numero: string | null;
}

export interface RelatorioSegundoVinculoData {
  servidores: ServidorSegundoVinculo[];
  totalServidores: number;
  /** dd/MM/aaaa; vai só no nome do arquivo (a data de emissão sai no rodapé). */
  dataGeracao: string;
  filtroEsfera: string | null;
  filtroForma: string | null;
  agruparPor: 'esfera' | 'forma' | null;
}

const esfera = (v: string): string => VINCULO_EXTERNO_ESFERA_LABELS[v as VinculoExternoEsfera] || v;
const forma = (v: string): string => VINCULO_EXTERNO_FORMA_LABELS[v as VinculoExternoForma] || v;
const plural = (n: number): string => `${n} servidor${n === 1 ? '' : 'es'}`;

const COLUNAS = [
  { chave: 'ord', titulo: 'Ord.', peso: 0.8, alinhamento: 'centro' as const },
  { chave: 'nome', titulo: 'Servidor', peso: 2.6 },
  { chave: 'vinculo', titulo: 'Vínculo no órgão', peso: 1.9 },
  { chave: 'esfera', titulo: 'Esfera', peso: 1.5 },
  { chave: 'orgao', titulo: 'Órgão de origem', peso: 1.9 },
  { chave: 'cargo', titulo: 'Cargo de origem', peso: 1.7 },
  { chave: 'forma', titulo: 'Forma', peso: 1.7 },
];

const tabelaServidores = (servidores: ServidorSegundoVinculo[]): Bloco =>
  tabela({
    colunas: COLUNAS,
    linhas: servidores.map((s, i) => ({
      ord: String(i + 1).padStart(2, '0'),
      nome: s.nome,
      vinculo: s.vinculo_idjuv,
      esfera: esfera(s.vinculo_externo_esfera),
      orgao: s.vinculo_externo_orgao,
      cargo: s.vinculo_externo_cargo,
      forma: forma(s.vinculo_externo_forma),
    })),
    totais: { nome: `Total: ${plural(servidores.length)}` },
  });

/** Contagem por chave, na ordem em que a chave aparece. */
function contar(servidores: ServidorSegundoVinculo[], chave: (s: ServidorSegundoVinculo) => string): Map<string, ServidorSegundoVinculo[]> {
  const grupos = new Map<string, ServidorSegundoVinculo[]>();
  for (const s of servidores) {
    const k = chave(s);
    grupos.set(k, [...(grupos.get(k) ?? []), s]);
  }
  return grupos;
}

const tabelaContagem = (titulo: string, grupos: Map<string, ServidorSegundoVinculo[]>, rotulo: (k: string) => string, total: number): Bloco =>
  tabela({
    colunas: [
      { chave: 'item', titulo, peso: 3 },
      { chave: 'qtd', titulo: 'Servidores', peso: 1, alinhamento: 'direita' },
    ],
    linhas: [...grupos].map(([k, lista]) => ({ item: rotulo(k), qtd: lista.length })),
    totais: { item: 'Total', qtd: total },
  });

export const relatorioSegundoVinculo: DocumentoModelo<RelatorioSegundoVinculoData> = {
  tipo: 'rh-segundo-vinculo',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Relatório de servidores com segundo vínculo',
  subtitulo: () => 'Servidores com vínculo funcional externo',
  nomeArquivo: (d) => `Relatorio_Segundo_Vinculo_${d.dataGeracao.replace(/\//g, '-')}.pdf`,
  blocos: (d) => {
    const porEsfera = contar(d.servidores, (s) => s.vinculo_externo_esfera);
    const porForma = contar(d.servidores, (s) => s.vinculo_externo_forma);
    const grupos = d.agruparPor === 'esfera' ? porEsfera : d.agruparPor === 'forma' ? porForma : null;
    const rotuloGrupo = d.agruparPor === 'forma' ? forma : esfera;
    return [
      secao({ texto: 'Filtros aplicados' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Esfera', valor: d.filtroEsfera ? esfera(d.filtroEsfera) : 'Todas' },
          { rotulo: 'Forma', valor: d.filtroForma ? forma(d.filtroForma) : 'Todas' },
          { rotulo: 'Agrupamento', valor: d.agruparPor === 'esfera' ? 'Por esfera' : d.agruparPor === 'forma' ? 'Por forma' : 'Sem agrupamento' },
          { rotulo: 'Total', valor: plural(d.totalServidores) },
        ],
      }),
      ...(grupos && grupos.size > 0
        ? [...grupos].flatMap(([k, lista]) => [
            secao({ texto: `${rotuloGrupo(k).toUpperCase()} (${plural(lista.length)})` }),
            tabelaServidores(lista),
          ])
        : [secao({ texto: 'Servidores' }), tabelaServidores(d.servidores)]),
      secao({ texto: 'Resumo' }),
      tabelaContagem('Por esfera', porEsfera, esfera, d.servidores.length),
      tabelaContagem('Por forma de vínculo', porForma, forma, d.servidores.length),
    ];
  },
};
