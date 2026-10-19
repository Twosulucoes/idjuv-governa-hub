import { formatTelefone } from '@/lib/formatters';
import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Relatório de servidores de uma diretoria e das unidades subordinadas (divisões, núcleos…). */
export interface ServidorDiretoria {
  nome: string;
  telefone: string | null;
  cargo: string | null;
}

export interface UnidadeComServidores {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: 'diretoria' | 'divisao' | 'nucleo' | 'presidencia' | 'assessoria' | 'gabinete' | 'coordenacao' | 'outro';
  nivel: number;
  servidores: ServidorDiretoria[];
  subordinadas: UnidadeComServidores[];
}

export interface DadosDiretoriaHierarquia {
  diretoria: UnidadeComServidores;
  /** Carimbo de data do nome do arquivo (ex.: `2026-10-19-1430`). */
  carimboArquivo: string;
}

const rotuloUnidade = (u: UnidadeComServidores): string => (u.sigla ? `${u.sigla} - ${u.nome}` : u.nome);

const contarServidores = (u: UnidadeComServidores): number =>
  u.servidores.length + u.subordinadas.reduce((s, sub) => s + contarServidores(sub), 0);

const plural = (n: number): string => `${n} servidor${n === 1 ? '' : 'es'}`;

/** Uma seção por unidade, na ordem da hierarquia; o caminho de siglas mostra a subordinação. */
function blocosDaUnidade(u: UnidadeComServidores, caminho: string[]): Bloco[] {
  const prefixo = caminho.length ? `${caminho.join(' › ')} › ` : '';
  const blocos: Bloco[] = [secao({ texto: `${prefixo}${rotuloUnidade(u)} (${plural(u.servidores.length)})` })];
  if (u.servidores.length === 0) {
    blocos.push(paragrafo({ texto: 'Nenhum servidor lotado nesta unidade.' }));
  } else {
    blocos.push(
      tabela({
        colunas: [
          { chave: 'nome', titulo: 'Nome', peso: 50 },
          { chave: 'telefone', titulo: 'Telefone', peso: 22 },
          { chave: 'cargo', titulo: 'Cargo', peso: 28 },
        ],
        linhas: u.servidores.map((s) => ({
          nome: s.nome,
          telefone: s.telefone ? formatTelefone(s.telefone) : null,
          cargo: s.cargo,
        })),
        totais: { nome: `Subtotal: ${plural(u.servidores.length)}` },
      }),
    );
  }
  const proximo = [...caminho, u.sigla || u.nome];
  return [...blocos, ...u.subordinadas.flatMap((sub) => blocosDaUnidade(sub, proximo))];
}

export const relatorioDiretoriaHierarquia: DocumentoModelo<DadosDiretoriaHierarquia> = {
  tipo: 'rh-diretoria-hierarquia',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Relatório de servidores',
  subtitulo: (d) => `${rotuloUnidade(d.diretoria)} · Documento interno`,
  nomeArquivo: (d) => `servidores-${(d.diretoria.sigla || 'diretoria').toLowerCase()}-${d.carimboArquivo}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 2,
      campos: [
        { rotulo: 'Total de servidores', valor: contarServidores(d.diretoria) },
        { rotulo: 'Classificação', valor: 'Documento interno' },
      ],
    }),
    ...blocosDaUnidade(d.diretoria, []),
  ],
};
