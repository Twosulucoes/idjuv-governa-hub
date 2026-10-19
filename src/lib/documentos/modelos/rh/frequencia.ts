import { formatCPF } from '@/lib/formatters';
import { agruparPor, formatarDataISO } from '@/lib/relatoriosRHRegras';
import { assinaturas, camposChaveValor, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { plural } from './comum';

/** Consolidado mensal de frequência de um servidor (uma linha do relatório geral). */
export interface FrequenciaServidor {
  servidor_id: string;
  servidor_nome: string;
  servidor_matricula?: string;
  servidor_cargo?: string;
  servidor_unidade?: string;
  dias_uteis: number;
  dias_trabalhados: number;
  faltas: number;
  atestados: number;
  ferias: number;
  licencas: number;
  abonos: number;
  percentual_presenca: number;
}

const SEM_UNIDADE = 'Sem unidade';
const pct = (n: number, casas = 1) => `${n.toFixed(casas)}%`;
const mediaPresenca = (itens: FrequenciaServidor[]) =>
  itens.length > 0 ? itens.reduce((acc, s) => acc + s.percentual_presenca, 0) / itens.length : 0;
const totalFaltas = (itens: FrequenciaServidor[]) => itens.reduce((acc, s) => acc + s.faltas, 0);
const servidores = (n: number) => plural(n, 'servidor', 'servidores');

// ============================================
// GERAL — paisagem, uma linha por servidor, opcionalmente por unidade com subtotal
// ============================================

export interface DadosFrequenciaGeral {
  /** "MM/AAAA". */
  competencia: string;
  servidores: FrequenciaServidor[];
  dataGeracao: string;
  filtroUnidade?: string;
  /** Agrupa por `servidor_unidade` com subtotal (servidores, faltas, média de presença). */
  agruparPorUnidade?: boolean;
}

// Pesos em mm da largura útil em paisagem (257).
const COLUNAS_GERAL: ColunaTabela[] = [
  { chave: 'matricula', titulo: 'Matrícula', peso: 20 },
  { chave: 'nome', titulo: 'Servidor', peso: 64 },
  { chave: 'cargo', titulo: 'Cargo', peso: 40 },
  { chave: 'diasUteis', titulo: 'Dias úteis', peso: 20, alinhamento: 'centro' },
  { chave: 'trabalhados', titulo: 'Trabalhados', peso: 23, alinhamento: 'centro' },
  { chave: 'faltas', titulo: 'Faltas', peso: 15, alinhamento: 'centro' },
  { chave: 'atestados', titulo: 'Atestados', peso: 20, alinhamento: 'centro' },
  { chave: 'ferias', titulo: 'Férias', peso: 15, alinhamento: 'centro' },
  { chave: 'licencas', titulo: 'Licenças', peso: 18, alinhamento: 'centro' },
  { chave: 'presenca', titulo: '% Presença', peso: 22, alinhamento: 'centro' },
];

const linhaGeral = (s: FrequenciaServidor) => ({
  matricula: s.servidor_matricula,
  nome: s.servidor_nome,
  cargo: s.servidor_cargo,
  diasUteis: s.dias_uteis,
  trabalhados: s.dias_trabalhados,
  faltas: s.faltas,
  atestados: s.atestados,
  ferias: s.ferias,
  licencas: s.licencas,
  presenca: pct(s.percentual_presenca),
});

export const frequenciaGeral: DocumentoModelo<DadosFrequenciaGeral> = {
  tipo: 'rh-frequencia-geral',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: () => 'Relatório de frequência mensal',
  subtitulo: (d) => `Competência: ${d.competencia} | ${d.filtroUnidade ? `Filtro: ${d.filtroUnidade}` : 'Todas as unidades'}`,
  nomeArquivo: (d) => `Relatorio_Frequencia_${d.competencia.replace('/', '-')}.pdf`,
  blocos: (d) => {
    const blocos: Bloco[] = [
      secao({ texto: 'Filtros aplicados' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Competência', valor: d.competencia },
          { rotulo: 'Unidade', valor: d.filtroUnidade ?? 'Todas as unidades' },
          { rotulo: 'Data de geração', valor: d.dataGeracao },
        ],
      }),
    ];

    if (d.agruparPorUnidade && d.servidores.length > 0) {
      const chave = (s: FrequenciaServidor) => s.servidor_unidade || SEM_UNIDADE;
      // Ordena por unidade (e nome) para os blocos ficarem contíguos.
      const ordenados = [...d.servidores].sort(
        (a, b) => chave(a).localeCompare(chave(b), 'pt-BR') || a.servidor_nome.localeCompare(b.servidor_nome, 'pt-BR'),
      );
      for (const g of agruparPor(ordenados, chave)) {
        blocos.push(
          secao({ texto: `${g.chave} (${servidores(g.itens.length)})` }),
          tabela({
            colunas: COLUNAS_GERAL,
            linhas: g.itens.map(linhaGeral),
            totais: { nome: `Subtotal: ${servidores(g.itens.length)}`, faltas: totalFaltas(g.itens), presenca: `Média ${pct(mediaPresenca(g.itens))}` },
          }),
        );
      }
    } else {
      blocos.push(secao({ texto: 'Servidores' }), tabela({ colunas: COLUNAS_GERAL, linhas: d.servidores.map(linhaGeral) }));
    }

    blocos.push(
      secao({ texto: 'Resumo' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Servidores', valor: d.servidores.length },
          { rotulo: 'Total de faltas', valor: totalFaltas(d.servidores) },
          { rotulo: 'Média de presença', valor: pct(mediaPresenca(d.servidores)) },
        ],
      }),
    );
    return blocos;
  },
};

// ============================================
// INDIVIDUAL — ficha do servidor no mês, com registros diários e assinaturas
// ============================================

export interface RegistroPontoDetalhe {
  /** AAAA-MM-DD. */
  data: string;
  dia_semana: string;
  tipo: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  horas_trabalhadas?: number;
  observacao?: string;
}

export interface DadosFrequenciaIndividual {
  competencia: string;
  servidor: {
    nome: string;
    cpf: string;
    matricula?: string;
    cargo?: string;
    unidade?: string;
  };
  resumo: FrequenciaServidor;
  registros: RegistroPontoDetalhe[];
  dataGeracao: string;
}

const COLUNAS_REGISTROS: ColunaTabela[] = [
  // Pesos em mm da largura útil em retrato (170).
  { chave: 'data', titulo: 'Data', peso: 22 },
  { chave: 'dia', titulo: 'Dia', peso: 12 },
  { chave: 'situacao', titulo: 'Situação', peso: 22 },
  { chave: 'entrada1', titulo: 'Entrada', peso: 18, alinhamento: 'centro' },
  { chave: 'saida1', titulo: 'Saída', peso: 16, alinhamento: 'centro' },
  { chave: 'entrada2', titulo: 'Entrada', peso: 18, alinhamento: 'centro' },
  { chave: 'saida2', titulo: 'Saída', peso: 16, alinhamento: 'centro' },
  { chave: 'observacao', titulo: 'Observação', peso: 46 },
];

const rotuloSituacao = (tipo: string) => (tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : tipo);

export const frequenciaIndividual: DocumentoModelo<DadosFrequenciaIndividual> = {
  tipo: 'rh-frequencia-individual',
  familia: 'ficha',
  titulo: () => 'Folha de frequência',
  subtitulo: (d) => `Competência: ${d.competencia}`,
  nomeArquivo: (d) => `Frequencia_${d.servidor.nome.replace(/\s+/g, '_').substring(0, 20)}_${d.competencia.replace('/', '-')}.pdf`,
  blocos: (d) => [
    secao({ texto: 'Dados do servidor' }),
    camposChaveValor({
      campos: [
        { rotulo: 'Nome', valor: d.servidor.nome },
        { rotulo: 'CPF', valor: d.servidor.cpf ? formatCPF(d.servidor.cpf) : undefined },
        { rotulo: 'Matrícula', valor: d.servidor.matricula },
        { rotulo: 'Cargo', valor: d.servidor.cargo },
        { rotulo: 'Unidade', valor: d.servidor.unidade },
      ],
    }),
    secao({ texto: 'Resumo do mês' }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Dias úteis', valor: d.resumo.dias_uteis },
        { rotulo: 'Trabalhados', valor: d.resumo.dias_trabalhados },
        { rotulo: 'Faltas', valor: d.resumo.faltas },
        { rotulo: 'Atestados', valor: d.resumo.atestados },
        { rotulo: 'Férias/Lic.', valor: d.resumo.ferias + d.resumo.licencas },
        { rotulo: '% Presença', valor: pct(d.resumo.percentual_presenca, 0) },
      ],
    }),
    secao({ texto: 'Registros diários' }),
    tabela({
      colunas: COLUNAS_REGISTROS,
      linhas: d.registros.map((r) => ({
        data: formatarDataISO(r.data),
        dia: r.dia_semana,
        situacao: rotuloSituacao(r.tipo),
        entrada1: r.entrada1,
        saida1: r.saida1,
        entrada2: r.entrada2,
        saida2: r.saida2,
        observacao: r.observacao,
      })),
    }),
    assinaturas({ assinantes: [{ nome: d.servidor.nome, cargo: 'Servidor(a)' }, { nome: 'Chefia imediata' }] }),
  ],
};
