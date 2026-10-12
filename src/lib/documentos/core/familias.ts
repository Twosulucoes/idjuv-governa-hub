import type { Familia, Orientacao } from '../tipos';

export interface ConfigFamilia {
  fonteCorpo: 'times' | 'helvetica';
  orientacaoPadrao: Orientacao;
  /** Imprime "Documento emitido eletronicamente…" acima do rodapé. */
  linhaAutenticidade: boolean;
}

export const FAMILIAS: Record<Familia, ConfigFamilia> = {
  relatorio: { fonteCorpo: 'helvetica', orientacaoPadrao: 'retrato', linhaAutenticidade: false },
  ficha: { fonteCorpo: 'helvetica', orientacaoPadrao: 'retrato', linhaAutenticidade: false },
  comprovante: { fonteCorpo: 'helvetica', orientacaoPadrao: 'retrato', linhaAutenticidade: true },
};
