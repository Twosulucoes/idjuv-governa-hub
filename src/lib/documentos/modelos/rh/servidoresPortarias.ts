import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { dataNoArquivo, formatarCPF, formatarData } from './formatos';

export interface PortariaServidorItem {
  numero: string;
  titulo: string;
  tipo: string;
  categoria: string | null;
  status: string;
  data_documento: string;
  data_publicacao: string | null;
}

export interface ServidorComPortariasItem {
  id: string;
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  unidade: string;
  vinculo: string;
  portarias: PortariaServidorItem[];
}

export interface DadosServidoresPortarias {
  servidores: ServidorComPortariasItem[];
  totalServidores: number;
  totalPortarias: number;
  /** "dd/mm/aaaa" */
  dataGeracao: string;
  filtroTipo: string | null;
  filtroStatus: string | null;
}

/** Linha de identificação do servidor: "CPF: … | Mat: … | Cargo: … | Unidade: …". */
const identificacao = (s: ServidorComPortariasItem): string =>
  [
    `CPF: ${formatarCPF(s.cpf) || '—'}`,
    s.matricula ? `Mat: ${s.matricula}` : null,
    `Cargo: ${s.cargo || '—'}`,
    `Unidade: ${s.unidade || '—'}`,
  ]
    .filter(Boolean)
    .join(' | ');

export const relatorioServidoresPortarias: DocumentoModelo<DadosServidoresPortarias> = {
  tipo: 'rh-servidores-portarias',
  familia: 'relatorio',
  titulo: () => 'Relatório de servidores com portarias',
  subtitulo: (d) => {
    const filtros = [d.filtroTipo, d.filtroStatus].filter(Boolean).join(' - ');
    return filtros ? `Filtro: ${filtros}` : 'Todas as Portarias';
  },
  nomeArquivo: (d) => `Relatorio_Servidores_Portarias_${dataNoArquivo(d.dataGeracao)}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Servidores', valor: d.totalServidores },
        { rotulo: 'Portarias', valor: d.totalPortarias },
        { rotulo: 'Data de geração', valor: d.dataGeracao },
      ],
    }),
    // Servidor sem portaria não é impresso (como no relatório original).
    ...d.servidores
      .filter((s) => s.portarias.length > 0)
      .flatMap((s): Bloco[] => [
        secao({ texto: s.nome }),
        paragrafo({ texto: identificacao(s) }),
        tabela({
          colunas: [
            { chave: 'numero', titulo: 'Número', peso: 1.3 },
            { chave: 'tipo', titulo: 'Tipo', peso: 1.3 },
            { chave: 'categoria', titulo: 'Categoria', peso: 1.4 },
            { chave: 'titulo', titulo: 'Título', peso: 3.5 },
            { chave: 'data', titulo: 'Data doc.', peso: 1.2 },
            { chave: 'status', titulo: 'Status', peso: 1.5 },
          ],
          linhas: s.portarias.map((p) => ({
            numero: p.numero,
            tipo: p.tipo,
            categoria: p.categoria,
            titulo: p.titulo,
            data: formatarData(p.data_documento),
            status: (p.status || 'minuta').replace(/_/g, ' '),
          })),
        }),
      ]),
    secao({ texto: 'Resumo' }),
    paragrafo({
      negrito: true,
      texto: `${d.totalServidores} servidores com ${d.totalPortarias} portarias vinculadas`,
    }),
  ],
};
