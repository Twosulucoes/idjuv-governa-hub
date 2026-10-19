import { camposChaveValor, secao, tabela } from '../blocos';
import type { DocumentoModelo } from '../tipos';

/**
 * Amostras da pré-visualização (Configuração do cliente → Impressão de documentos).
 * Dados fictícios e genéricos: servem só para ver cabeçalho, rodapé, letra e tabela.
 */
export interface DadosAmostra {
  /** Nome de quem pediu a amostra, impresso como exemplo de campo preenchido. */
  solicitante?: string;
}

const LINHAS = Array.from({ length: 28 }, (_, i) => ({
  nome: `Pessoa de exemplo ${String(i + 1).padStart(2, '0')}`,
  unidade: `Unidade ${(i % 4) + 1}`,
  situacao: i % 3 === 0 ? 'Em análise' : 'Concluído',
  valor: (1200 + i * 37.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
}));

export const amostraRelatorio: DocumentoModelo<DadosAmostra> = {
  tipo: 'amostra-relatorio',
  familia: 'relatorio',
  titulo: () => 'Relatório de exemplo',
  subtitulo: () => 'Pré-visualização da padronização de impressão',
  unidadeEmissora: () => ['Unidade emissora de exemplo'],
  nomeArquivo: () => 'exemplo-relatorio.pdf',
  blocos: () => [
    secao({ texto: 'Filtros aplicados' }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Período', valor: '01/09/2026 a 30/09/2026' },
        { rotulo: 'Unidade', valor: 'Todas' },
        { rotulo: 'Situação', valor: 'Todas' },
      ],
    }),
    secao({ texto: 'Resultado' }),
    tabela({
      colunas: [
        { chave: 'nome', titulo: 'Nome', peso: 3 },
        { chave: 'unidade', titulo: 'Unidade', peso: 2 },
        { chave: 'situacao', titulo: 'Situação', peso: 2 },
        { chave: 'valor', titulo: 'Valor (R$)', peso: 1.5, alinhamento: 'direita' },
      ],
      linhas: LINHAS,
      totais: { nome: `TOTAL (${LINHAS.length} registros)` },
    }),
  ],
};

export const amostraFicha: DocumentoModelo<DadosAmostra> = {
  tipo: 'amostra-ficha',
  familia: 'ficha',
  titulo: () => 'Ficha de exemplo',
  protocolo: () => 'EX-2026-000001',
  nomeArquivo: () => 'exemplo-ficha.pdf',
  blocos: (d) => [
    secao({ texto: 'Identificação' }),
    camposChaveValor({
      campos: [
        { rotulo: 'Nome', valor: 'Pessoa de exemplo' },
        { rotulo: 'Matrícula', valor: '000000' },
        { rotulo: 'Cargo', valor: 'Cargo de exemplo' },
        { rotulo: 'Unidade', valor: 'Unidade 1' },
      ],
    }),
    secao({ texto: 'Observações' }),
    camposChaveValor({
      colunas: 1,
      campos: [{ rotulo: 'Solicitado por', valor: d.solicitante }, { rotulo: 'Observações', valor: 'Campo vazio sai como traço.' }],
    }),
  ],
};
