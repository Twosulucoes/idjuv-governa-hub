import { camposChaveValor, carimbo, secao, tabela } from '../blocos';
import type { DocumentoModelo } from '../tipos';

export interface DadosRelatorio { filtros: { rotulo: string; valor: string }[]; linhas: { nome: string; unidade: string; valor: number }[] }
export const dadosRelatorio: DadosRelatorio = {
  filtros: [{ rotulo: 'Período', valor: 'Setembro/2026' }, { rotulo: 'Unidade', valor: 'Todas' }],
  linhas: Array.from({ length: 60 }, (_, i) => ({ nome: `Servidor ${i + 1}`, unidade: `Unidade ${(i % 5) + 1}`, valor: 1000 + i })),
};
export const relatorioReferencia: DocumentoModelo<DadosRelatorio> = {
  tipo: 'ref-relatorio', familia: 'relatorio', orientacao: 'paisagem',
  titulo: () => 'Relatório de exemplo', subtitulo: (d) => `${d.linhas.length} registros`,
  nomeArquivo: () => 'relatorio-exemplo.pdf',
  blocos: (d) => [
    secao({ texto: 'Filtros aplicados' }),
    camposChaveValor({ colunas: 3, campos: d.filtros }),
    secao({ texto: 'Resultado' }),
    tabela({
      colunas: [{ chave: 'nome', titulo: 'Nome', peso: 3 }, { chave: 'unidade', titulo: 'Unidade', peso: 2 }, { chave: 'valor', titulo: 'Valor (R$)', alinhamento: 'direita' }],
      linhas: d.linhas,
      totais: { nome: 'TOTAL', valor: d.linhas.reduce((s, l) => s + l.valor, 0) },
    }),
  ],
};

export interface DadosFicha { nome: string; cpf: string; cargo?: string; unidade?: string; observacoes?: string }
export const dadosFicha: DadosFicha = { nome: 'Maria de Souza', cpf: '000.000.000-00', cargo: 'Analista', unidade: undefined, observacoes: 'Sem observações.' };
export const fichaReferencia: DocumentoModelo<DadosFicha> = {
  tipo: 'ref-ficha', familia: 'ficha', titulo: () => 'Ficha cadastral', nomeArquivo: (d) => `ficha-${d.cpf}.pdf`,
  blocos: (d) => [
    secao({ texto: 'Identificação' }),
    camposChaveValor({ campos: [{ rotulo: 'Nome', valor: d.nome }, { rotulo: 'CPF', valor: d.cpf }, { rotulo: 'Cargo', valor: d.cargo }, { rotulo: 'Unidade', valor: d.unidade }] }),
    secao({ texto: 'Observações' }),
    camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Observações', valor: d.observacoes }] }),
  ],
};

export interface DadosComprovante { competencia: string; servidor: string; protocolo: string; itens: { descricao: string; valor: string }[] }
export const dadosComprovante: DadosComprovante = {
  competencia: '09/2026', servidor: 'João da Silva', protocolo: 'FP-2026-000045',
  itens: [{ descricao: 'Vencimento', valor: '5.000,00' }, { descricao: 'Desconto previdenciário', valor: '-550,00' }],
};
export const comprovanteReferencia: DocumentoModelo<DadosComprovante> = {
  tipo: 'ref-comprovante', familia: 'comprovante', titulo: () => 'Comprovante de rendimentos', subtitulo: (d) => `Competência ${d.competencia}`,
  protocolo: (d) => d.protocolo, nomeArquivo: (d) => `comprovante-${d.competencia.replace('/', '-')}.pdf`,
  blocos: (d) => [
    camposChaveValor({ campos: [{ rotulo: 'Servidor', valor: d.servidor }, { rotulo: 'Competência', valor: d.competencia }] }),
    tabela({ colunas: [{ chave: 'descricao', titulo: 'Descrição', peso: 3 }, { chave: 'valor', titulo: 'Valor (R$)', alinhamento: 'direita' }], linhas: d.itens }),
    carimbo({ linhas: ['Este comprovante foi gerado eletronicamente pelo sistema.'] }),
  ],
};
