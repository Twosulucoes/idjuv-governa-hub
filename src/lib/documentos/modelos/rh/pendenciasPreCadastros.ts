import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

/** Pré-cadastro com pendência de um tipo: os campos pendentes já vêm unidos por vírgula. */
export interface LinhaPendenciaPreCadastro {
  nome: string;
  cpf: string;
  status: string;
  camposPendentes: string;
}

export interface DadosPendenciasPreCadastros {
  /** Texto do filtro da tela ("Qualquer pendência"…). */
  filtro?: string;
  resumo: { total: number; esocial: number; bancaria: number; pessoal: number; completos: number };
  esocial: LinhaPendenciaPreCadastro[];
  bancaria: LinhaPendenciaPreCadastro[];
  pessoal: LinhaPendenciaPreCadastro[];
  /** Sem pendência de eSocial, bancária nem pessoal. */
  completos: { nome: string; cpf: string }[];
}

const COLUNAS_PENDENCIA = [
  { chave: 'nome', titulo: 'Nome', peso: 3 },
  { chave: 'cpf', titulo: 'CPF', peso: 1.5 },
  { chave: 'status', titulo: 'Status', peso: 1.2 },
  { chave: 'camposPendentes', titulo: 'Campos pendentes', peso: 3.5 },
];

export const pendenciasPreCadastros: DocumentoModelo<DadosPendenciasPreCadastros> = {
  tipo: 'rh-pendencias-pre-cadastros',
  familia: 'relatorio',
  titulo: () => 'Relatório de pendências de pré-cadastros',
  subtitulo: (d) => (d.filtro ? `Filtro aplicado: ${d.filtro}` : undefined),
  nomeArquivo: () => `relatorio-pendencias-precadastros-${new Date().toISOString().slice(0, 10)}.pdf`,
  blocos: (d) => {
    const grupos = [
      { titulo: 'Pendências eSocial', linhas: d.esocial },
      { titulo: 'Pendências bancárias', linhas: d.bancaria },
      { titulo: 'Pendências de dados pessoais', linhas: d.pessoal },
    ].filter((g) => g.linhas.length > 0);
    const vazio = grupos.length === 0 && d.completos.length === 0;
    return [
      secao({ texto: 'Resumo estatístico' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Total', valor: d.resumo.total },
          { rotulo: 'Com pendência eSocial', valor: d.resumo.esocial },
          { rotulo: 'Com pendência bancária', valor: d.resumo.bancaria },
          { rotulo: 'Com pendência pessoal', valor: d.resumo.pessoal },
          { rotulo: 'Completos', valor: d.resumo.completos },
        ],
      }),
      ...grupos.flatMap((g) => [
        secao({ texto: `${g.titulo} (${g.linhas.length})` }),
        tabela({ colunas: COLUNAS_PENDENCIA, linhas: g.linhas.map((l) => ({ ...l })) }),
      ]),
      ...(d.completos.length > 0
        ? [
            secao({ texto: `Cadastros completos (${d.completos.length})` }),
            tabela({
              colunas: [
                { chave: 'nome', titulo: 'Nome', peso: 3 },
                { chave: 'cpf', titulo: 'CPF', peso: 1.5 },
                { chave: 'situacao', titulo: 'Situação', peso: 1.5 },
              ],
              linhas: d.completos.map((c) => ({ ...c, situacao: 'Completo' })),
            }),
          ]
        : []),
      ...(vazio ? [paragrafo({ texto: 'Nenhum pré-cadastro encontrado para o filtro aplicado.' })] : []),
    ];
  },
};
