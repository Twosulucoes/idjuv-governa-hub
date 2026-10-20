import { secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { areaDeTexto, campos, fecho, nomeArquivoFormulario, observacoes, subtituloNumero, type DadosFormulario } from './comum';

/** Termo de demanda: preenchido na TermoDemandaPage e em branco em Modelos de documentos (RH). */
export interface TermoDemandaPreenchido {
  solicitante: string;
  cargo: string;
  setor: string;
  email?: string;
  telefone?: string;
  objeto: string;
  justificativa: string;
  quantidade: string;
  /** Como digitado na tela (ex.: "3.000,00"). */
  valorEstimado: string;
  prazoEntrega: string;
  /** Rótulo da prioridade escolhida na tela. */
  prioridade: string;
  observacoes?: string;
}

export type DadosTermoDemanda = DadosFormulario<TermoDemandaPreenchido>;

export const termoDemanda: DocumentoModelo<DadosTermoDemanda> = {
  tipo: 'formularios-termo-demanda',
  familia: 'ficha',
  titulo: () => 'Termo de demanda',
  subtitulo: subtituloNumero,
  nomeArquivo: (d) => nomeArquivoFormulario('Termo_Demanda', d),
  blocos: (d) => {
    const emBranco = !d.preenchido;
    const f: Partial<TermoDemandaPreenchido> = d.preenchido ?? {};
    return [
      secao({ texto: '1. Identificação do solicitante' }),
      ...campos(emBranco, 2, [
        { rotulo: 'Nome', valor: f.solicitante },
        { rotulo: 'E-mail', valor: f.email, opcional: true },
      ]),
      ...campos(emBranco, 3, [
        { rotulo: 'Cargo/função', valor: f.cargo },
        { rotulo: 'Setor/unidade', valor: f.setor },
        { rotulo: 'Telefone', valor: f.telefone, opcional: true },
      ]),

      secao({ texto: '2. Descrição da demanda' }),
      areaDeTexto(emBranco, 'Objeto da demanda', f.objeto, 2),
      areaDeTexto(emBranco, 'Justificativa (necessidade e motivação)', f.justificativa, 3),

      secao({ texto: '3. Especificações' }),
      ...campos(emBranco, 3, [
        { rotulo: 'Quantidade', valor: f.quantidade },
        { rotulo: 'Valor estimado (R$)', valor: f.valorEstimado },
        { rotulo: 'Prazo de entrega', valor: f.prazoEntrega },
      ]),
      ...campos(emBranco, 1, [{ rotulo: 'Prioridade', valor: f.prioridade, alternativas: ['Baixa', 'Normal', 'Alta', 'Crítica'] }]),

      ...observacoes(emBranco, '4. Observações', f.observacoes, 2),
      ...fecho(emBranco, d, f.solicitante, ['Solicitante', 'Chefia imediata']),
    ];
  },
};
