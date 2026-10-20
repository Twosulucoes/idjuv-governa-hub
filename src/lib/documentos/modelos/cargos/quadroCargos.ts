import { camposChaveValor, secao, tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

/** Uma vaga do quadro: o cargo na unidade e quem a ocupa (null = vaga). */
export interface VagaQuadroCargos {
  cargo_id: string;
  cargo_nome: string;
  cargo_sigla: string;
  quantidade_vagas: number;
  unidade_nome: string;
  unidade_sigla: string;
  servidor_nome: string | null;
  servidor_id: string | null;
}

export interface DadosQuadroCargos {
  titulo: string;
  subtitulo?: string;
  /** Ordena por unidade e, dentro dela, por cargo. */
  agruparPorUnidade: boolean;
  vagas: VagaQuadroCargos[];
  /** "aaaa-mm-dd" (data de geração). */
  dataGeracao: string;
}

/** "-" é o "sem sigla" que a tela manda: cai para o nome. */
const comValor = (v: string | null | undefined): string => (v && v.trim() !== '-' ? v : '');

const dataExibida = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

export const quadroCargos: DocumentoModelo<DadosQuadroCargos> = {
  tipo: 'cargos-quadro-cargos',
  familia: 'relatorio',
  titulo: (d) => d.titulo,
  subtitulo: (d) => d.subtitulo,
  nomeArquivo: (d) => `quadro-cargos-${d.dataGeracao}.pdf`,
  blocos: (d) => {
    const vagas = [...d.vagas];
    if (d.agruparPorUnidade) {
      vagas.sort(
        (a, b) => (a.unidade_nome || '').localeCompare(b.unidade_nome || '') || (a.cargo_nome || '').localeCompare(b.cargo_nome || ''),
      );
    }
    const ocupados = vagas.filter((v) => v.servidor_nome).length;
    return [
      tabela({
        colunas: [
          { chave: 'n', titulo: 'Nº', peso: 0.5, alinhamento: 'direita' },
          { chave: 'cargo', titulo: 'Cargo', peso: 3 },
          { chave: 'simbolo', titulo: 'Símbolo', peso: 1 },
          { chave: 'unidade', titulo: 'Unidade', peso: 2 },
          { chave: 'servidor', titulo: 'Servidor', peso: 3.2 },
        ],
        linhas: vagas.map((v, i) => ({
          n: i + 1,
          cargo: v.cargo_nome,
          simbolo: comValor(v.cargo_sigla),
          unidade: comValor(v.unidade_sigla) || comValor(v.unidade_nome),
          servidor: v.servidor_nome || '(VAGO)',
        })),
      }),
      secao({ texto: 'Resumo do quadro de cargos' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Total de cargos', valor: vagas.length },
          { rotulo: 'Ocupados', valor: ocupados },
          { rotulo: 'Vagos', valor: vagas.length - ocupados },
          { rotulo: 'Gerado em', valor: dataExibida(d.dataGeracao) },
        ],
      }),
    ];
  },
};
