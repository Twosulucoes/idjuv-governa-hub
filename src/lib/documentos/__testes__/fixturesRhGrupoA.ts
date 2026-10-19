import type { DadosHistoricoFuncional } from '../modelos/rh/historicoFuncional';
import type { DadosServidoresDiretoria } from '../modelos/rh/servidoresDiretoria';
import type { DadosServidoresPortarias } from '../modelos/rh/servidoresPortarias';
import type { DadosServidoresVinculo } from '../modelos/rh/servidoresVinculo';
import type { DadosVagasCargo } from '../modelos/rh/vagasCargo';

/** Dados fictícios dos relatórios do RH (grupo A da onda 1). `n` controla quantas linhas por grupo. */

const cpf = (i: number) => String(10000000000 + i * 7919).slice(0, 11);

export const dadosDiretoria = (n = 6): DadosServidoresDiretoria => {
  const servidores = (u: number) =>
    Array.from({ length: n }, (_, i) => ({
      nome: `Servidor ${u}-${String(i + 1).padStart(2, '0')} de Exemplo da Silva`,
      cpf: cpf(u * 100 + i),
      matricula: i % 3 === 0 ? null : `M${1000 + i}`,
      cargo: i % 4 === 0 ? 'Assessor Técnico de Planejamento e Gestão' : 'Analista',
      vinculo: i % 2 === 0 ? 'Comissionado' : 'Efetivo',
      situacao: 'Ativo',
    }));
  const grupos = [
    { unidade_nome: 'Presidência de Exemplo', unidade_sigla: 'PRES', unidade_tipo: 'presidencia', nivel: 1, caminho_hierarquico: 'PRES', servidores: servidores(1) },
    { unidade_nome: 'Diretoria Administrativa', unidade_sigla: 'DIRAF', unidade_tipo: 'diretoria', nivel: 2, caminho_hierarquico: 'PRES > DIRAF', servidores: servidores(2) },
    { unidade_nome: 'Divisão de Pessoal', unidade_sigla: null, unidade_tipo: 'divisao', nivel: 3, caminho_hierarquico: 'PRES > DIRAF > DIPES', servidores: servidores(3) },
  ];
  return { grupos, totalServidores: grupos.reduce((t, g) => t + g.servidores.length, 0), dataGeracao: '19/10/2026', filtroUnidade: null };
};

export const dadosVinculo = (n = 6): DadosServidoresVinculo => {
  const grupos = ['Comissionado', 'Efetivo'].map((vinculo, v) => ({
    vinculo,
    servidores: Array.from({ length: n }, (_, i) => ({
      nome: `Servidor ${v}-${String(i + 1).padStart(2, '0')} de Exemplo`,
      cpf: cpf(v * 100 + i),
      matricula: null,
      cargo: 'Analista de Sistemas',
      unidade: i % 2 ? 'DIRAF' : '',
      situacao: 'Ativo',
      possui_vinculo_externo: i === 1,
      vinculo_externo_orgao: i === 1 ? 'Secretaria Municipal de Exemplo' : null,
    })),
  }));
  return { grupos, totalServidores: grupos.reduce((t, g) => t + g.servidores.length, 0), dataGeracao: '19/10/2026', filtroVinculo: 'Comissionado' };
};

export const dadosHistorico = (n = 4): DadosHistoricoFuncional => ({
  servidor: {
    nome: 'Maria de Exemplo Souza',
    cpf: '12345678901',
    matricula: null,
    cargo: 'Analista',
    unidade: 'Divisão de Pessoal',
    vinculo: 'Efetivo',
    situacao: 'Ativo',
    data_admissao: '2020-03-01',
    possui_vinculo_externo: true,
    vinculo_externo_esfera: 'municipal',
    vinculo_externo_situacao: 'cedido',
    vinculo_externo_orgao: 'Prefeitura de Exemplo',
    vinculo_externo_cargo: 'Professor',
    vinculo_externo_matricula: null,
    vinculo_externo_forma: 'cessao',
    vinculo_externo_ato: { numero: '123', ano: 2024 },
  },
  historico: Array.from({ length: n }, (_, i) => ({
    data: `2021-0${(i % 9) + 1}-15`,
    tipo: i % 2 ? 'Nomeação' : 'Lotação',
    descricao: `Movimentação funcional número ${i + 1} com descrição longa para quebrar a linha na coluna de descrição`,
    portaria: i % 3 === 0 ? null : `${100 + i}/2021`,
  })),
  portarias: [{ numero: '45', ano: 2022, tipo: 'Nomeação', assunto: 'Nomeia servidora para cargo em comissão', data_publicacao: '2022-05-10' }],
  ferias: [
    { periodo_aquisitivo: '2021/2022', data_inicio: '2022-07-01', data_fim: '2022-07-30', dias: 30 },
    { periodo_aquisitivo: '2022/2023', data_inicio: '2023-01-02', data_fim: '2023-01-16', dias: 15 },
  ],
  licencas: [{ tipo: 'Licença médica', data_inicio: '2023-05-02', data_fim: null, dias: null }],
  dataGeracao: '19/10/2026',
});

export const dadosVagas = (n = 5): DadosVagasCargo => {
  const grupos = ['comissionado', 'efetivo', 'temporario'].map((natureza, k) => {
    const cargos = k === 2 ? [] : Array.from({ length: n }, (_, i) => {
      const previstas = 10 + i;
      const ocupadas = Math.min(previstas, 6 + i * 2);
      return {
        id: `${k}-${i}`,
        nome: `Cargo de exemplo ${k}-${i + 1}`,
        sigla: i % 2 ? `CDS-${i}` : null,
        natureza,
        quantidade_vagas: previstas,
        vagas_ocupadas: ocupadas,
        vagas_disponiveis: previstas - ocupadas,
        percentual_ocupacao: (ocupadas / previstas) * 100,
        vencimento_base: null,
      };
    });
    const total_previstas = cargos.reduce((t, c) => t + c.quantidade_vagas, 0);
    const total_ocupadas = cargos.reduce((t, c) => t + c.vagas_ocupadas, 0);
    return {
      natureza,
      natureza_label: ['Cargos Comissionados', 'Cargos Efetivos', 'Cargos Temporários'][k],
      cargos,
      total_previstas,
      total_ocupadas,
      total_disponiveis: total_previstas - total_ocupadas,
    };
  });
  const totalPrevistas = grupos.reduce((t, g) => t + g.total_previstas, 0);
  const totalOcupadas = grupos.reduce((t, g) => t + g.total_ocupadas, 0);
  return {
    grupos,
    totalCargos: grupos.reduce((t, g) => t + g.cargos.length, 0),
    totalPrevistas,
    totalOcupadas,
    totalDisponiveis: totalPrevistas - totalOcupadas,
    percentualGeral: totalPrevistas ? (totalOcupadas / totalPrevistas) * 100 : 0,
    dataGeracao: '19/10/2026',
    filtroNatureza: null,
  };
};

export const dadosPortarias = (n = 3): DadosServidoresPortarias => {
  const servidores = Array.from({ length: 4 }, (_, s) => ({
    id: String(s),
    nome: `Servidor ${s + 1} de Exemplo`,
    cpf: cpf(s),
    matricula: s % 2 ? `M${s}` : null,
    cargo: 'Analista',
    unidade: 'DIRAF',
    vinculo: 'Efetivo',
    portarias:
      s === 3
        ? []
        : Array.from({ length: n }, (_, i) => ({
            numero: `${10 + i}/2026`,
            titulo: `Portaria de exemplo ${i + 1} com título comprido para quebrar a célula`,
            tipo: 'portaria',
            categoria: i % 2 ? null : 'nomeacao',
            status: i % 2 ? 'aguardando_publicacao' : 'publicado',
            data_documento: '2026-02-03',
            data_publicacao: null,
          })),
  }));
  return {
    servidores,
    totalServidores: servidores.filter((s) => s.portarias.length > 0).length,
    totalPortarias: servidores.reduce((t, s) => t + s.portarias.length, 0),
    dataGeracao: '19/10/2026',
    filtroTipo: 'portaria',
    filtroStatus: null,
  };
};
