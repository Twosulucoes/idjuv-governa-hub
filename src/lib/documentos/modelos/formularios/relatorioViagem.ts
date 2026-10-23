import { paragrafo, secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { formatarData } from '../rh/formatos';
import {
  areaDeTexto,
  campos,
  doOrgao,
  fecho,
  nomeArquivoFormulario,
  observacoes,
  secaoDeTexto,
  subtituloNumero,
  type DadosFormulario,
} from './comum';

/** Relatório de viagem: preenchido na RelatorioViagemPage e em branco em Modelos de documentos (RH). */
export interface RelatorioViagemPreenchido {
  servidor: string;
  cargo: string;
  matricula: string;
  numeroOrdemMissao?: string;
  destino: string;
  /** "aaaa-mm-dd" (campo de data da tela). */
  dataInicio: string;
  dataFim: string;
  objetivoOriginal: string;
  atividadesRealizadas: string;
  resultadosObtidos: string;
  despesasRealizadas: string;
  observacoes?: string;
}

export type DadosRelatorioViagem = DadosFormulario<RelatorioViagemPreenchido>;

const periodo = (inicio?: string, fim?: string): string => {
  const [a, b] = [formatarData(inicio), formatarData(fim)];
  return a || b ? `${a || '—'} a ${b || '—'}` : '';
};

export const relatorioViagem: DocumentoModelo<DadosRelatorioViagem> = {
  tipo: 'formularios-relatorio-viagem',
  familia: 'ficha',
  titulo: () => 'Relatório de viagem',
  subtitulo: subtituloNumero,
  nomeArquivo: (d) => nomeArquivoFormulario('Relatorio_Viagem', d),
  blocos: (d) => {
    const emBranco = !d.preenchido;
    const f: Partial<RelatorioViagemPreenchido> = d.preenchido ?? {};
    const declaracao =
      'Declaro que as informações acima são verdadeiras e estou ciente das responsabilidades previstas ' +
      `na IN de Diárias ${doOrgao(d.siglaOrgao)}.`;
    return [
      secao({ texto: '1. Identificação do servidor' }),
      ...campos(emBranco, 2, [
        { rotulo: 'Nome', valor: f.servidor },
        { rotulo: 'Matrícula', valor: f.matricula },
      ]),
      ...campos(emBranco, 2, [
        { rotulo: 'Cargo/função', valor: f.cargo },
        { rotulo: 'Nº da ordem de missão', valor: f.numeroOrdemMissao, opcional: true },
      ]),

      secao({ texto: '2. Dados da viagem' }),
      ...campos(emBranco, 2, [
        { rotulo: 'Destino', valor: f.destino },
        { rotulo: 'Período', valor: periodo(f.dataInicio, f.dataFim) },
      ]),
      areaDeTexto(emBranco, 'Objetivo original', f.objetivoOriginal, 2),

      ...secaoDeTexto(emBranco, '3. Atividades realizadas', f.atividadesRealizadas, 5),
      ...secaoDeTexto(emBranco, '4. Resultados obtidos', f.resultadosObtidos, 3),
      ...secaoDeTexto(emBranco, '5. Despesas realizadas', f.despesasRealizadas, 2),
      ...observacoes(emBranco, '6. Observações', f.observacoes, 2),

      paragrafo({ texto: declaracao, alinhamento: 'justificado' }),
      ...fecho(emBranco, d, f.servidor, ['Servidor', 'Chefia imediata']),
    ];
  },
};
