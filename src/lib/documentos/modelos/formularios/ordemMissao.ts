import { paragrafo, secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { formatarData } from '../rh/formatos';
import { areaDeTexto, campos, fecho, nomeArquivoFormulario, observacoes, subtituloNumero, type DadosFormulario } from './comum';

/** Ordem de missão: preenchida na OrdemMissaoPage e em branco em Modelos de documentos (RH). */
export interface OrdemMissaoPreenchida {
  servidor: string;
  cargo: string;
  matricula: string;
  lotacao?: string;
  destino: string;
  objetivo: string;
  /** "aaaa-mm-dd" (campo de data da tela). */
  dataInicio: string;
  dataFim: string;
  /** Rótulo do meio de transporte escolhido na tela. */
  meioTransporte: string;
  /** Quantidade de diárias (aceita meia diária: "3.5"). */
  diarias: string;
  valorUnitario?: string;
  /** Valor total das diárias, como digitado na tela. */
  valorDiarias: string;
  /** "Sim"/"Não". */
  passagemAerea?: string;
  observacoes?: string;
}

export type DadosOrdemMissao = DadosFormulario<OrdemMissaoPreenchida>;

const AUTORIZACAO = 'Autorizo a realização da missão acima descrita, nos termos da legislação vigente.';

export const ordemMissao: DocumentoModelo<DadosOrdemMissao> = {
  tipo: 'formularios-ordem-missao',
  familia: 'ficha',
  titulo: () => 'Ordem de missão',
  subtitulo: subtituloNumero,
  nomeArquivo: (d) => nomeArquivoFormulario('Ordem_Missao', d),
  blocos: (d) => {
    const emBranco = !d.preenchido;
    const f: Partial<OrdemMissaoPreenchida> = d.preenchido ?? {};
    return [
      secao({ texto: '1. Identificação do servidor' }),
      ...campos(emBranco, 2, [
        { rotulo: 'Nome', valor: f.servidor },
        { rotulo: 'Matrícula', valor: f.matricula },
      ]),
      ...campos(emBranco, 2, [
        { rotulo: 'Cargo/função', valor: f.cargo },
        { rotulo: 'Unidade de lotação', valor: f.lotacao, opcional: true },
      ]),

      secao({ texto: '2. Dados da missão' }),
      ...campos(emBranco, 2, [
        { rotulo: 'Destino (cidade/UF)', valor: f.destino },
        { rotulo: 'Passagem aérea', valor: f.passagemAerea, opcional: true, alternativas: ['Sim', 'Não'] },
      ]),
      areaDeTexto(emBranco, 'Objetivo/finalidade', f.objetivo, 2),

      secao({ texto: '3. Período e transporte' }),
      ...campos(emBranco, 3, [
        { rotulo: 'Data de saída', valor: formatarData(f.dataInicio) },
        { rotulo: 'Data de retorno', valor: formatarData(f.dataFim) },
        { rotulo: 'Meio de transporte', valor: f.meioTransporte },
      ]),

      secao({ texto: '4. Diárias e passagens' }),
      ...campos(emBranco, 3, [
        { rotulo: 'Quantidade de diárias', valor: f.diarias },
        { rotulo: 'Valor unitário (R$)', valor: f.valorUnitario, opcional: true },
        { rotulo: 'Valor total das diárias (R$)', valor: f.valorDiarias },
      ]),

      ...observacoes(emBranco, '5. Observações', f.observacoes, 1),
      paragrafo({ texto: AUTORIZACAO }),
      ...fecho(emBranco, d, f.servidor, ['Servidor', 'Chefia imediata', 'Ordenador de despesa']),
    ];
  },
};
