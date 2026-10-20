/**
 * Ficha cadastral de unidade local (antigo `pdfFichaUnidadeLocal.ts` + `src/lib/pdf/unidades/*`).
 * Seções: identificação, localização, estrutura, responsável, cedências e patrimônio (as duas últimas
 * só quando há dados) e observações.
 */
import { paragrafo, secao } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import {
  secaoCedencias,
  secaoEstrutura,
  secaoIdentificacao,
  secaoLocalizacao,
  secaoPatrimonio,
  secaoResponsavel,
  type DadosCedencias,
  type DadosEstrutura,
  type DadosIdentificacao,
  type DadosLocalizacao,
  type DadosPatrimonio,
  type DadosResponsavel,
} from './secoesFichaUnidade';

export type {
  DadosCedencias,
  DadosEstrutura,
  DadosIdentificacao,
  DadosLocalizacao,
  DadosPatrimonio,
  DadosResponsavel,
} from './secoesFichaUnidade';

export interface FichaUnidadeLocalData {
  identificacao: DadosIdentificacao;
  localizacao: DadosLocalizacao;
  estrutura: DadosEstrutura;
  responsavel: DadosResponsavel | null;
  cedencias?: DadosCedencias;
  patrimonio?: DadosPatrimonio;
  observacoes?: string;
}

export const fichaUnidadeLocal: DocumentoModelo<FichaUnidadeLocalData> = {
  tipo: 'unidades-ficha-unidade-local',
  familia: 'ficha',
  titulo: () => 'Ficha cadastral de unidade local',
  subtitulo: (d) => d.identificacao.nome,
  nomeArquivo: (d) => `Ficha_${d.identificacao.codigo || d.identificacao.nome.replace(/\s+/g, '_')}.pdf`,
  blocos: (d) => {
    const blocos: Bloco[] = [
      ...secaoIdentificacao(d.identificacao),
      ...secaoLocalizacao(d.localizacao),
      ...secaoEstrutura(d.estrutura),
      ...secaoResponsavel(d.responsavel),
    ];
    if (d.cedencias) blocos.push(...secaoCedencias(d.cedencias));
    if (d.patrimonio) blocos.push(...secaoPatrimonio(d.patrimonio));
    if (d.observacoes) blocos.push(secao({ texto: 'Observações' }), paragrafo({ texto: d.observacoes }));
    return blocos;
  },
};
