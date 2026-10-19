import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

/** Servidor com pendência de um tipo: os campos pendentes já vêm unidos por vírgula. */
export interface LinhaPendenciaServidor {
  nome: string;
  matricula?: string | null;
  cpf: string;
  camposPendentes: string;
}

export interface DadosPendenciasServidores {
  /** Texto do filtro da tela ("Elegíveis para folha"…). */
  filtro?: string;
  resumo: {
    total: number;
    elegibilidade: number;
    esocial: number;
    bancaria: number;
    pessoal: number;
    completos: number;
    elegiveis: number;
  };
  elegibilidade: LinhaPendenciaServidor[];
  esocial: LinhaPendenciaServidor[];
  bancaria: LinhaPendenciaServidor[];
  pessoal: LinhaPendenciaServidor[];
  /** Sem nenhuma pendência. */
  completos: { nome: string; matricula?: string | null; cpf: string; cargo?: string | null }[];
}

const COLUNAS_PENDENCIA = [
  { chave: 'nome', titulo: 'Nome', peso: 3 },
  { chave: 'matricula', titulo: 'Matrícula', peso: 1.2 },
  { chave: 'cpf', titulo: 'CPF', peso: 1.5 },
  { chave: 'camposPendentes', titulo: 'Campos pendentes', peso: 3.5 },
];

export const pendenciasServidores: DocumentoModelo<DadosPendenciasServidores> = {
  tipo: 'rh-pendencias-servidores',
  familia: 'relatorio',
  titulo: () => 'Relatório de pendências de servidores',
  subtitulo: (d) => (d.filtro ? `Filtro aplicado: ${d.filtro}` : undefined),
  nomeArquivo: () => `relatorio_pendencias_servidores_${new Date().toISOString().slice(0, 10)}.pdf`,
  blocos: (d) => {
    const grupos = [
      { titulo: 'Servidores com pendências de elegibilidade', linhas: d.elegibilidade },
      { titulo: 'Servidores com pendências eSocial', linhas: d.esocial },
      { titulo: 'Servidores com pendências bancárias', linhas: d.bancaria },
      { titulo: 'Servidores com pendências pessoais', linhas: d.pessoal },
    ].filter((g) => g.linhas.length > 0);
    const vazio = grupos.length === 0 && d.completos.length === 0;
    return [
      secao({ texto: 'Resumo geral' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Total de servidores', valor: d.resumo.total },
          { rotulo: 'Pendências de elegibilidade', valor: d.resumo.elegibilidade },
          { rotulo: 'Pendências eSocial', valor: d.resumo.esocial },
          { rotulo: 'Pendências bancárias', valor: d.resumo.bancaria },
          { rotulo: 'Pendências pessoais', valor: d.resumo.pessoal },
          { rotulo: 'Cadastro completo', valor: d.resumo.completos },
          { rotulo: 'Elegíveis para folha', valor: d.resumo.elegiveis },
        ],
      }),
      ...grupos.flatMap((g) => [
        secao({ texto: `${g.titulo} (${g.linhas.length})` }),
        tabela({ colunas: COLUNAS_PENDENCIA, linhas: g.linhas.map((l) => ({ ...l })) }),
      ]),
      ...(d.completos.length > 0
        ? [
            secao({ texto: `Servidores com cadastro completo (${d.completos.length})` }),
            tabela({
              colunas: [
                { chave: 'nome', titulo: 'Nome', peso: 3 },
                { chave: 'matricula', titulo: 'Matrícula', peso: 1.2 },
                { chave: 'cpf', titulo: 'CPF', peso: 1.5 },
                { chave: 'cargo', titulo: 'Cargo', peso: 3.5 },
              ],
              linhas: d.completos.map((c) => ({ ...c })),
            }),
          ]
        : []),
      ...(vazio ? [paragrafo({ texto: 'Nenhum servidor encontrado para o filtro aplicado.' })] : []),
    ];
  },
};
