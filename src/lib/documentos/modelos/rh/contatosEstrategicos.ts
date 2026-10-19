import { formatTelefone } from '@/lib/formatters';
import { camposChaveValor, paragrafo, tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

/** Servidores com indicação registrada, com telefone e órgão de origem (quando há segundo vínculo). */
export interface ServidorContato {
  nome_completo: string;
  telefone_celular: string | null;
  indicacao: string | null;
  possui_vinculo_externo?: boolean;
  vinculo_externo_orgao?: string | null;
}

export interface DadosContatosEstrategicos {
  servidores: ServidorContato[];
  /** Carimbo de data do nome do arquivo (ex.: `2026-10-19-1430`). */
  carimboArquivo: string;
}

export const relatorioContatosEstrategicos: DocumentoModelo<DadosContatosEstrategicos> = {
  tipo: 'rh-contatos-estrategicos',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Relatório de contatos estratégicos',
  subtitulo: () => 'Servidores com indicação política · Documento confidencial',
  nomeArquivo: (d) => `contatos-estrategicos-${d.carimboArquivo}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 2,
      campos: [
        { rotulo: 'Total de registros', valor: d.servidores.length },
        { rotulo: 'Classificação', valor: 'Documento confidencial' },
      ],
    }),
    d.servidores.length === 0
      ? paragrafo({ texto: 'Nenhum servidor encontrado com indicação.' })
      : tabela({
          colunas: [
            { chave: 'nome', titulo: 'Nome', peso: 30 },
            { chave: 'telefone', titulo: 'Telefone', peso: 18 },
            { chave: 'orgao', titulo: 'Órgão de origem', peso: 17 },
            { chave: 'indicacao', titulo: 'Indicação', peso: 35 },
          ],
          linhas: d.servidores.map((s) => ({
            nome: s.nome_completo,
            telefone: s.telefone_celular ? formatTelefone(s.telefone_celular) : null,
            orgao: s.possui_vinculo_externo ? s.vinculo_externo_orgao : null,
            indicacao: s.indicacao,
          })),
          totais: { nome: `Total: ${d.servidores.length} registro(s)` },
        }),
  ],
};
