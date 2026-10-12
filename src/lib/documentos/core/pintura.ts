import type jsPDF from 'jspdf';
import type { RGB } from '../tipos';

export const usarTexto = (doc: jsPDF, c: RGB): void => void doc.setTextColor(c.r, c.g, c.b);
export const usarTraco = (doc: jsPDF, c: RGB): void => void doc.setDrawColor(c.r, c.g, c.b);
export const usarPreenchimento = (doc: jsPDF, c: RGB): void => void doc.setFillColor(c.r, c.g, c.b);
