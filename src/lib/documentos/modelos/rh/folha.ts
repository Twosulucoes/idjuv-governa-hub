import {
  contarRubricas,
  descreverFolha,
  folhaPermiteDetalhe,
  liquidoBlocos,
  rotuloCompetencia,
  rotuloStatusFolha,
  rotuloTipoFolha,
  totalizarFolhas,
  totalizarUnidades,
  type AgregadoUnidade,
  type BlocoRubricas,
  type FolhaResumo,
} from '@/lib/relatoriosFolhaRegras';
import { nomeArquivoRelatorio } from '@/lib/relatoriosRHRegras';
import { camposChaveValor, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda, plural } from './comum';

/**
 * Relatórios gerenciais da folha de pagamento: resumo do ano, por unidade e por rubrica.
 * LGPD: só agregados — nenhum nome, CPF, matrícula ou dado bancário chega a estes modelos.
 */

type FolhaIdentificada = Pick<FolhaResumo, 'competencia_ano' | 'competencia_mes' | 'tipo_folha' | 'status'>;

/** Folha identificada por competência e tipo, para o subtítulo. */
const subtituloFolha = (f: FolhaIdentificada) =>
  `Folha ${rotuloTipoFolha(f.tipo_folha)} - competência ${rotuloCompetencia(f.competencia_ano, f.competencia_mes)}`;

const sufixoCompetencia = (f: FolhaIdentificada) => rotuloCompetencia(f.competencia_ano, f.competencia_mes).replace('/', '-');

// ============================================
// RESUMO DO ANO — paisagem, uma linha por folha, total do ano
// ============================================

export interface DadosResumoFolhasAno {
  folhas: FolhaResumo[];
  ano: number;
}

// Pesos em mm da largura útil em paisagem (257): "R$ 100.000,00" pede ~24 mm na letra da tabela.
const COLUNAS_RESUMO: ColunaTabela[] = [
  { chave: 'competencia', titulo: 'Compet.', peso: 18 },
  { chave: 'tipo', titulo: 'Tipo', peso: 25 },
  { chave: 'status', titulo: 'Status', peso: 20 },
  { chave: 'servidores', titulo: 'Servidores', peso: 20, alinhamento: 'direita' },
  { chave: 'bruto', titulo: 'Bruto', peso: 26, alinhamento: 'direita' },
  { chave: 'descontos', titulo: 'Descontos', peso: 26, alinhamento: 'direita' },
  { chave: 'liquido', titulo: 'Líquido', peso: 26, alinhamento: 'direita' },
  { chave: 'inssServidor', titulo: 'INSS serv.', peso: 24, alinhamento: 'direita' },
  { chave: 'inssPatronal', titulo: 'INSS patr.', peso: 24, alinhamento: 'direita' },
  { chave: 'irrf', titulo: 'IRRF', peso: 24, alinhamento: 'direita' },
  { chave: 'encargos', titulo: 'Encargos', peso: 24, alinhamento: 'direita' },
];

export const resumoFolhasAno: DocumentoModelo<DadosResumoFolhasAno> = {
  tipo: 'rh-folha-resumo-ano',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: () => 'Resumo das folhas de pagamento',
  subtitulo: (d) => `Exercício ${d.ano} - uma linha por folha, com totais do ano`,
  nomeArquivo: (d) => `${nomeArquivoRelatorio(`folha-resumo-${d.ano}`)}.pdf`,
  blocos: (d) => {
    // Prévias e folhas em processamento não entram no total (simulação ou parcial).
    const t = totalizarFolhas(d.folhas.filter((f) => folhaPermiteDetalhe(f.status)));
    return [
      secao({ texto: 'Filtros aplicados' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Ano', valor: d.ano },
          { rotulo: 'Folhas', valor: plural(d.folhas.length, 'folha', 'folhas') },
          { rotulo: 'Critério', valor: 'Todas as folhas do exercício, inclusive prévias (status indicado); o total soma só as processadas' },
        ],
      }),
      secao({ texto: 'Folhas do exercício' }),
      tabela({
        colunas: COLUNAS_RESUMO,
        linhas: d.folhas.map((f) => ({
          competencia: rotuloCompetencia(f.competencia_ano, f.competencia_mes),
          tipo: rotuloTipoFolha(f.tipo_folha),
          status: rotuloStatusFolha(f.status),
          servidores: Number(f.quantidade_servidores) || 0,
          bruto: moeda(f.total_bruto),
          descontos: moeda(f.total_descontos),
          liquido: moeda(f.total_liquido),
          inssServidor: moeda(f.total_inss_servidor),
          inssPatronal: moeda(f.total_inss_patronal),
          irrf: moeda(f.total_irrf),
          encargos: moeda(f.total_encargos_patronais),
        })),
        totais: {
          competencia: 'Total do ano',
          tipo: plural(t.folhas, 'folha processada', 'folhas processadas'),
          bruto: moeda(t.bruto),
          descontos: moeda(t.descontos),
          liquido: moeda(t.liquido),
          inssServidor: moeda(t.inssServidor),
          inssPatronal: moeda(t.inssPatronal),
          irrf: moeda(t.irrf),
          encargos: moeda(t.encargos),
        },
      }),
    ];
  },
};

// ============================================
// POR UNIDADE — retrato, uma linha por unidade, total da folha
// ============================================

export interface DadosFolhaPorUnidade {
  agregados: AgregadoUnidade[];
  folha: FolhaIdentificada;
}

// Pesos em mm da largura útil em retrato (170).
const COLUNAS_UNIDADE: ColunaTabela[] = [
  { chave: 'unidade', titulo: 'Unidade', peso: 34 },
  { chave: 'servidores', titulo: 'Servidores', peso: 20, alinhamento: 'direita' },
  { chave: 'proventos', titulo: 'Proventos', peso: 24, alinhamento: 'direita' },
  { chave: 'descontos', titulo: 'Descontos', peso: 24, alinhamento: 'direita' },
  { chave: 'liquido', titulo: 'Líquido', peso: 24, alinhamento: 'direita' },
  { chave: 'inss', titulo: 'INSS', peso: 22, alinhamento: 'direita' },
  { chave: 'irrf', titulo: 'IRRF', peso: 22, alinhamento: 'direita' },
];

export const folhaPorUnidade: DocumentoModelo<DadosFolhaPorUnidade> = {
  tipo: 'rh-folha-por-unidade',
  familia: 'relatorio',
  titulo: () => 'Folha de pagamento por unidade',
  subtitulo: (d) => subtituloFolha(d.folha),
  nomeArquivo: (d) => `${nomeArquivoRelatorio(`folha-unidade-${sufixoCompetencia(d.folha)}`)}.pdf`,
  blocos: (d) => {
    const t = totalizarUnidades(d.agregados);
    return [
      secao({ texto: 'Filtros aplicados' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Folha', valor: descreverFolha(d.folha) },
          { rotulo: 'Unidades', valor: plural(d.agregados.length, 'unidade', 'unidades') },
        ],
      }),
      secao({ texto: 'Valores por unidade' }),
      tabela({
        colunas: COLUNAS_UNIDADE,
        linhas: d.agregados.map((a) => ({
          unidade: a.unidade,
          servidores: a.servidores,
          proventos: moeda(a.proventos),
          descontos: moeda(a.descontos),
          liquido: moeda(a.liquido),
          inss: moeda(a.inss),
          irrf: moeda(a.irrf),
        })),
        totais: {
          unidade: 'Total da folha',
          servidores: t.servidores,
          proventos: moeda(t.proventos),
          descontos: moeda(t.descontos),
          liquido: moeda(t.liquido),
          inss: moeda(t.inss),
          irrf: moeda(t.irrf),
        },
      }),
    ];
  },
};

// ============================================
// POR RUBRICA — retrato, blocos de proventos e descontos com subtotal
// ============================================

export interface DadosFolhaPorRubrica {
  blocos: BlocoRubricas[];
  folha: FolhaIdentificada;
}

const COLUNAS_RUBRICA: ColunaTabela[] = [
  { chave: 'rubrica', titulo: 'Rubrica', peso: 98 },
  { chave: 'tipo', titulo: 'Tipo', peso: 22 },
  { chave: 'quantidade', titulo: 'Qtde. fichas', peso: 22, alinhamento: 'direita' },
  { chave: 'valor', titulo: 'Valor', peso: 28, alinhamento: 'direita' },
];

export const folhaPorRubrica: DocumentoModelo<DadosFolhaPorRubrica> = {
  tipo: 'rh-folha-por-rubrica',
  familia: 'relatorio',
  titulo: () => 'Folha de pagamento por rubrica',
  subtitulo: (d) => subtituloFolha(d.folha),
  nomeArquivo: (d) => `${nomeArquivoRelatorio(`folha-rubrica-${sufixoCompetencia(d.folha)}`)}.pdf`,
  blocos: (d) => {
    const rubricas = (n: number) => plural(n, 'rubrica', 'rubricas');
    const blocos: Bloco[] = [
      secao({ texto: 'Filtros aplicados' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Folha', valor: descreverFolha(d.folha) },
          { rotulo: 'Rubricas', valor: rubricas(contarRubricas(d.blocos)) },
        ],
      }),
    ];
    if (d.blocos.length === 0) blocos.push(secao({ texto: 'Resultado' }), tabela({ colunas: COLUNAS_RUBRICA, linhas: [] }));
    for (const b of d.blocos) {
      blocos.push(
        secao({ texto: `${b.rotulo} (${rubricas(b.itens.length)})` }),
        tabela({
          colunas: COLUNAS_RUBRICA,
          linhas: b.itens.map((a) => ({ rubrica: a.descricao, tipo: b.rotulo, quantidade: a.quantidade, valor: moeda(a.valor) })),
          totais: { rubrica: `Subtotal de ${b.rotulo.toLowerCase()}`, valor: moeda(b.subtotal) },
        }),
      );
    }
    blocos.push(
      secao({ texto: 'Total geral' }),
      camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Líquido (proventos - descontos)', valor: moeda(liquidoBlocos(d.blocos)) }] }),
    );
    return blocos;
  },
};
