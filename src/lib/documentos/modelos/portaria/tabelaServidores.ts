import type { Celula, ColunaTabela as ColunaBloco } from '../../blocos';
import { COLUNA_LABELS, type ColunaTabela, type ConfiguracaoTabela } from '@/types/portariaUnificada';
import { formatarCPF } from './textos';

export interface ServidorTabela {
  nome_completo: string;
  cpf: string;
  matricula?: string;
  cargo: string;
  codigo: string;
  unidade_nome?: string;
  [chave: string]: string | undefined;
}

// Larguras relativas herdadas do gerador antigo (mm base, escaladas para caber).
const PESOS: Record<ColunaTabela, number> = { numero: 8, nome_completo: 45, cpf: 28, matricula: 20, cargo: 35, unidade_setor: 30, codigo: 10, custom: 20 };
const CENTRALIZADAS: ColunaTabela[] = ['numero', 'cpf', 'codigo'];

const valorDaColuna = (s: ServidorTabela, col: ColunaTabela, i: number): Celula => {
  switch (col) {
    case 'numero': return String(i + 1);
    case 'nome_completo': return s.nome_completo?.toUpperCase();
    case 'cpf': return s.cpf ? formatarCPF(s.cpf) : undefined;
    case 'matricula': return s.matricula;
    case 'cargo': return s.cargo;
    case 'unidade_setor': return s.unidade_nome;
    case 'codigo': return s.codigo;
    default: return undefined;
  }
};

/** Colunas e linhas do bloco `tabela` a partir da configuração da portaria. Valor ausente vira "—" no bloco. */
export function tabelaDeServidores(
  config: ConfiguracaoTabela,
  servidores: ServidorTabela[],
  rotulos: Partial<Record<ColunaTabela, string>> = {},
): { colunas: ColunaBloco[]; linhas: Record<string, Celula>[] } {
  const colunas: ColunaBloco[] = [
    ...config.colunas.map((c) => ({
      chave: c, titulo: rotulos[c] ?? COLUNA_LABELS[c] ?? c, peso: PESOS[c] ?? 20,
      alinhamento: CENTRALIZADAS.includes(c) ? ('centro' as const) : ('esquerda' as const),
    })),
    ...config.colunasPersonalizadas.map((c) => ({ chave: c.id, titulo: c.titulo.toUpperCase(), peso: 20 })),
  ];
  const linhas = servidores.map((s, i) => {
    const linha: Record<string, Celula> = {};
    for (const c of config.colunas) linha[c] = valorDaColuna(s, c, i);
    for (const c of config.colunasPersonalizadas) linha[c.id] = s[c.id];
    return linha;
  });
  return { colunas, linhas };
}
