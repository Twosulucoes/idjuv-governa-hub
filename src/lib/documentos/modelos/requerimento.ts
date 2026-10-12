import { assinaturas, camposChaveValor, localData, paragrafo, secao } from '../blocos';
import { paraNomeArquivo } from '../core/texto';
import type { DocumentoModelo } from '../tipos';

export interface DadosRequerimento {
  requerente: { nome: string; cpf?: string; matricula?: string; cargo?: string; unidade?: string };
  /** Ex.: "Ao Ilmo. Sr. Presidente do Instituto". */
  destinatario: string;
  assunto: string;
  texto: string;
  fundamentacao?: string;
  anexos?: string[];
  local: string;
  /** Já formatada por quem chama (ex.: "12 de outubro de 2026"). */
  data: string;
  /** Protocolo já numerado pelo sistema de origem; este modelo apenas o imprime. */
  protocolo?: string;
  unidadeEmissora?: string[];
}

export const requerimentoModelo: DocumentoModelo<DadosRequerimento> = {
  tipo: 'requerimento',
  familia: 'ato',
  titulo: () => 'Requerimento',
  protocolo: (d) => d.protocolo,
  unidadeEmissora: (d) => d.unidadeEmissora ?? [],
  nomeArquivo: (d) => `Requerimento_${paraNomeArquivo(d.protocolo ?? d.requerente.nome)}.pdf`,
  blocos: (d) => [
    paragrafo({ texto: d.destinatario, negrito: true }),
    camposChaveValor({
      colunas: 2,
      campos: [
        { rotulo: 'Requerente', valor: d.requerente.nome },
        { rotulo: 'CPF', valor: d.requerente.cpf },
        { rotulo: 'Matrícula', valor: d.requerente.matricula },
        { rotulo: 'Cargo', valor: d.requerente.cargo },
        { rotulo: 'Unidade de lotação', valor: d.requerente.unidade },
      ],
    }),
    secao({ texto: 'Assunto' }),
    paragrafo({ texto: d.assunto }),
    secao({ texto: 'Requerimento' }),
    paragrafo({ texto: d.texto, alinhamento: 'justificado', recuoPrimeiraLinha: 12 }),
    ...(d.fundamentacao
      ? [secao({ texto: 'Fundamentação' }), paragrafo({ texto: d.fundamentacao, alinhamento: 'justificado', recuoPrimeiraLinha: 12 })]
      : []),
    ...(d.anexos?.length ? [secao({ texto: 'Anexos' }), paragrafo({ texto: d.anexos.map((a, i) => `${i + 1}. ${a}`).join('\n') })] : []),
    paragrafo({ texto: 'Nestes termos, pede deferimento.' }),
    localData({ local: d.local, data: d.data }),
    assinaturas({ assinantes: [{ nome: d.requerente.nome, cargo: d.requerente.cargo }] }),
  ],
};
