import { describe, expect, it } from 'vitest';
import { validarGozoAposAquisitivo } from './feriasRegras';

describe('validarGozoAposAquisitivo (item 16 do teste do RH)', () => {
  it('recusa gozo antes do fim do período aquisitivo sem justificativa', () => {
    const erro = validarGozoAposAquisitivo('2027-01-04', '2027-11-06', '');
    expect(erro).toContain('06/11/2027');
  });

  it('aceita a antecipação com justificativa de 20 caracteres ou mais', () => {
    expect(validarGozoAposAquisitivo('2027-01-04', '2027-11-06', 'curta')).not.toBeNull();
    expect(validarGozoAposAquisitivo('2027-01-04', '2027-11-06', 'Antecipação autorizada pelo Presidente')).toBeNull();
  });

  it('aceita gozo depois do fim do período aquisitivo', () => {
    expect(validarGozoAposAquisitivo('2027-11-07', '2027-11-06')).toBeNull();
  });

  it('o próprio último dia do período ainda é antes de completar o período', () => {
    expect(validarGozoAposAquisitivo('2027-11-06', '2027-11-06')).not.toBeNull();
  });
});
