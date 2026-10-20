import { secao } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import {
  campos,
  fecho,
  nomeArquivoFormulario,
  observacoes,
  secaoDeTexto,
  subtituloNumero,
  tabelaEmBranco,
  type DadosFormulario,
} from './comum';

/** Requisição de material: preenchida na RequisicaoMaterialPage e em branco em Modelos de documentos (RH). */
export interface RequisicaoMaterialPreenchida {
  solicitante: string;
  cargo: string;
  setor: string;
  /** Lista livre digitada na tela (um item por linha). */
  itens: string;
  justificativa: string;
  /** Rótulo da urgência escolhida na tela. */
  urgencia: string;
  observacoes?: string;
}

export type DadosRequisicaoMaterial = DadosFormulario<RequisicaoMaterialPreenchida>;

const LINHAS_DE_MATERIAL = 8;

export const requisicaoMaterial: DocumentoModelo<DadosRequisicaoMaterial> = {
  tipo: 'formularios-requisicao-material',
  familia: 'ficha',
  titulo: () => 'Requisição de material',
  subtitulo: subtituloNumero,
  nomeArquivo: (d) => nomeArquivoFormulario('Requisicao_Material', d),
  blocos: (d) => {
    const emBranco = !d.preenchido;
    const f: Partial<RequisicaoMaterialPreenchida> = d.preenchido ?? {};
    // Em branco: tabela de quantidade/unidade/descrição/observação para preencher à mão.
    const materiais = emBranco
      ? [
          secao({ texto: '2. Materiais solicitados', reservaAbaixo: 24 }),
          tabelaEmBranco(
            [
              { chave: 'qtd', titulo: 'Qtd.', peso: 0.8, alinhamento: 'centro' },
              { chave: 'unid', titulo: 'Unid.', peso: 0.8, alinhamento: 'centro' },
              { chave: 'descricao', titulo: 'Descrição do material', peso: 6 },
              { chave: 'obs', titulo: 'Obs.', peso: 1.8 },
            ],
            LINHAS_DE_MATERIAL,
          ),
        ]
      : secaoDeTexto(false, '2. Materiais solicitados', f.itens, 0);
    return [
      secao({ texto: '1. Identificação do solicitante' }),
      ...campos(emBranco, 1, [{ rotulo: 'Nome', valor: f.solicitante }]),
      ...campos(emBranco, 2, [
        { rotulo: 'Cargo/função', valor: f.cargo },
        { rotulo: 'Setor/unidade', valor: f.setor },
      ]),

      ...materiais,

      ...secaoDeTexto(emBranco, '3. Justificativa', f.justificativa, 3),
      ...campos(emBranco, 1, [{ rotulo: 'Urgência', valor: f.urgencia, alternativas: ['Normal', 'Urgente', 'Programada'] }]),

      // Como no formulário antigo, o modelo em branco não tem Observações.
      ...(emBranco ? [] : observacoes(false, '4. Observações', f.observacoes, 0)),
      ...fecho(emBranco, d, f.solicitante, ['Solicitante', 'Chefia imediata', 'Responsável pelo almoxarifado']),
    ];
  },
};
