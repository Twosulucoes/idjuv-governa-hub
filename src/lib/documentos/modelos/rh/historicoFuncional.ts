import {
  VINCULO_EXTERNO_ESFERA_LABELS,
  VINCULO_EXTERNO_FORMA_LABELS,
  VINCULO_EXTERNO_SITUACAO_LABELS,
} from '@/types/rh';
import { camposChaveValor, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { dataNoArquivo, formatarCPF, formatarData } from './formatos';

export interface HistoricoItem {
  data: string;
  tipo: string;
  descricao: string;
  portaria: string | null;
  cargo_anterior?: string;
  cargo_novo?: string;
  unidade_anterior?: string;
  unidade_nova?: string;
}

export interface PortariaItem {
  numero: string;
  ano: number;
  tipo: string;
  assunto: string;
  data_publicacao: string;
}

export interface FeriasItem {
  periodo_aquisitivo: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
}

export interface LicencaItem {
  tipo: string | null;
  data_inicio: string;
  data_fim: string | null;
  dias: number | null;
}

export interface DadosHistoricoFuncional {
  servidor: {
    nome: string;
    cpf: string;
    matricula: string | null;
    cargo: string;
    unidade: string;
    vinculo: string;
    situacao: string;
    data_admissao: string | null;
    // Segundo vínculo
    possui_vinculo_externo?: boolean;
    vinculo_externo_esfera?: string;
    vinculo_externo_situacao?: string;
    vinculo_externo_orgao?: string;
    vinculo_externo_cargo?: string;
    vinculo_externo_matricula?: string | null;
    vinculo_externo_forma?: string;
    vinculo_externo_ato?: { numero: string; ano: number } | null;
  };
  historico: HistoricoItem[];
  portarias: PortariaItem[];
  ferias: FeriasItem[];
  licencas: LicencaItem[];
  /** "dd/mm/aaaa" */
  dataGeracao: string;
}

/** Rótulo do código, ou o próprio código se a lista não o conhece. */
const rotulo = (labels: Record<string, string>, codigo?: string): string => (codigo ? labels[codigo] || codigo : '');

function segundoVinculo(s: DadosHistoricoFuncional['servidor']): Bloco[] {
  if (!s.possui_vinculo_externo) return [];
  return [
    secao({ texto: 'Segundo vínculo funcional' }),
    camposChaveValor({
      campos: [
        { rotulo: 'Esfera', valor: rotulo(VINCULO_EXTERNO_ESFERA_LABELS, s.vinculo_externo_esfera) },
        { rotulo: 'Situação no órgão', valor: rotulo(VINCULO_EXTERNO_SITUACAO_LABELS, s.vinculo_externo_situacao) },
        { rotulo: 'Órgão de origem', valor: s.vinculo_externo_orgao },
        { rotulo: 'Cargo efetivo', valor: s.vinculo_externo_cargo },
        { rotulo: 'Matrícula', valor: s.vinculo_externo_matricula },
        { rotulo: 'Forma do vínculo', valor: rotulo(VINCULO_EXTERNO_FORMA_LABELS, s.vinculo_externo_forma) },
        {
          rotulo: 'Ato formal',
          valor: s.vinculo_externo_ato ? `Portaria nº ${s.vinculo_externo_ato.numero}/${s.vinculo_externo_ato.ano}` : '',
        },
      ],
    }),
  ];
}

export const fichaHistoricoFuncional: DocumentoModelo<DadosHistoricoFuncional> = {
  tipo: 'rh-historico-funcional',
  familia: 'ficha',
  titulo: () => 'Relatório de histórico funcional',
  subtitulo: (d) => d.servidor.nome,
  nomeArquivo: (d) =>
    `Historico_Funcional_${d.servidor.nome.replace(/\s+/g, '_').substring(0, 30)}_${dataNoArquivo(d.dataGeracao)}.pdf`,
  blocos: (d) => {
    const s = d.servidor;
    const blocos: Bloco[] = [
      secao({ texto: 'Dados do servidor' }),
      camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Nome', valor: s.nome }] }),
      camposChaveValor({
        campos: [
          { rotulo: 'CPF', valor: formatarCPF(s.cpf) },
          { rotulo: 'Matrícula', valor: s.matricula },
          { rotulo: 'Cargo', valor: s.cargo },
          { rotulo: 'Unidade', valor: s.unidade },
          { rotulo: 'Vínculo', valor: s.vinculo },
          { rotulo: 'Situação', valor: s.situacao },
          { rotulo: 'Data de admissão', valor: formatarData(s.data_admissao) },
          { rotulo: 'Data de geração', valor: d.dataGeracao },
        ],
      }),
    ];

    // Como no relatório original, seção sem registro não é impressa.
    if (d.historico.length > 0) {
      blocos.push(
        secao({ texto: 'Histórico funcional' }),
        tabela({
          colunas: [
            { chave: 'data', titulo: 'Data', peso: 1.2 },
            { chave: 'tipo', titulo: 'Tipo', peso: 1.8 },
            { chave: 'descricao', titulo: 'Descrição', peso: 4 },
            { chave: 'portaria', titulo: 'Portaria', peso: 1.4 },
          ],
          linhas: d.historico.map((h) => ({ data: formatarData(h.data), tipo: h.tipo, descricao: h.descricao, portaria: h.portaria })),
        }),
      );
    }
    if (d.portarias.length > 0) {
      blocos.push(
        secao({ texto: 'Portarias vinculadas' }),
        tabela({
          colunas: [
            { chave: 'numero', titulo: 'Número', peso: 1.3 },
            { chave: 'tipo', titulo: 'Tipo', peso: 1.5 },
            { chave: 'assunto', titulo: 'Assunto', peso: 4 },
            { chave: 'publicacao', titulo: 'Data de publicação', peso: 1.5 },
          ],
          linhas: d.portarias.map((p) => ({
            numero: `${p.numero}/${p.ano}`,
            tipo: p.tipo,
            assunto: p.assunto,
            publicacao: formatarData(p.data_publicacao),
          })),
        }),
      );
    }
    if (d.ferias.length > 0) {
      blocos.push(
        secao({ texto: 'Férias registradas' }),
        tabela({
          colunas: [
            { chave: 'periodo', titulo: 'Período aquisitivo', peso: 2.5 },
            { chave: 'inicio', titulo: 'Início', peso: 1.2 },
            { chave: 'fim', titulo: 'Fim', peso: 1.2 },
            { chave: 'dias', titulo: 'Dias', peso: 0.8, alinhamento: 'direita' },
          ],
          linhas: d.ferias.map((f) => ({
            periodo: f.periodo_aquisitivo,
            inicio: formatarData(f.data_inicio),
            fim: formatarData(f.data_fim),
            dias: f.dias || 0,
          })),
          totais: { periodo: 'TOTAL', dias: d.ferias.reduce((t, f) => t + (f.dias || 0), 0) },
        }),
      );
    }
    if (d.licencas.length > 0) {
      blocos.push(
        secao({ texto: 'Licenças e afastamentos' }),
        tabela({
          colunas: [
            { chave: 'tipo', titulo: 'Tipo', peso: 2.5 },
            { chave: 'inicio', titulo: 'Início', peso: 1.2 },
            { chave: 'fim', titulo: 'Fim', peso: 1.2 },
            { chave: 'dias', titulo: 'Dias', peso: 0.8, alinhamento: 'direita' },
          ],
          linhas: d.licencas.map((l) => ({
            tipo: l.tipo,
            inicio: formatarData(l.data_inicio),
            fim: formatarData(l.data_fim),
            dias: l.dias,
          })),
        }),
      );
    }
    blocos.push(...segundoVinculo(s));
    return blocos;
  },
};
