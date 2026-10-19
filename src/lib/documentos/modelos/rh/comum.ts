/** Formatos compartilhados pelos modelos de relatório do RH. */

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** "R$ 1.234,56"; nulo/indefinido vira R$ 0,00 (soma de relatório nunca é lacuna). */
export const moeda = (valor: number | null | undefined): string => MOEDA.format(Number(valor) || 0);

/** "1 registro" / "3 registros". */
export const plural = (n: number, singular: string, pluralForma: string): string => `${n} ${n === 1 ? singular : pluralForma}`;
