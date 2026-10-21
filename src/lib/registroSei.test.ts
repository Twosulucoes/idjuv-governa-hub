import { describe, expect, it } from 'vitest';
import {
  CAMPOS_SEI_VAZIOS,
  aguardandoSei,
  numeroTermoExibicao,
  registroSeiDesignacaoSchema,
  registroSeiTermoSchema,
  statusTermoPeloSei,
} from './registroSei';

describe('registro de ato feito no SEI', () => {
  it('termo sem nada do SEI é válido e fica aguardando SEI', () => {
    const r = registroSeiTermoSchema.safeParse({ ...CAMPOS_SEI_VAZIOS, cancelado: false });
    expect(r.success).toBe(true);
    expect(statusTermoPeloSei({ numero: '', dataAssinatura: '' })).toBe('pendente');
    expect(aguardandoSei('  ')).toBe(true);
  });

  it('etapa do termo acompanha o SEI: numerado, assinado e cancelado', () => {
    expect(statusTermoPeloSei({ numero: '12/2026' })).toBe('emitido');
    expect(statusTermoPeloSei({ numero: '12/2026', dataAssinatura: '2026-10-20' })).toBe('assinado');
    expect(statusTermoPeloSei({ numero: '12/2026', dataAssinatura: '2026-10-20', cancelado: true })).toBe('cancelado');
  });

  it('assinatura e DOE exigem o número do ato', () => {
    const r = registroSeiTermoSchema.safeParse({ ...CAMPOS_SEI_VAZIOS, dataAssinatura: '2026-10-20', cancelado: false });
    expect(r.success).toBe(false);
    const d = registroSeiDesignacaoSchema.safeParse({ ...CAMPOS_SEI_VAZIOS, dataPublicacao: '2026-10-20' });
    expect(d.success).toBe(false);
  });

  it('DOE vai com número e data juntos, e não antes da assinatura', () => {
    const base = { ...CAMPOS_SEI_VAZIOS, numero: '5/2026', cancelado: false };
    expect(registroSeiTermoSchema.safeParse({ ...base, doeNumero: '1234' }).success).toBe(false);
    expect(
      registroSeiTermoSchema.safeParse({ ...base, dataAssinatura: '2026-10-20', doeNumero: '1234', doeData: '2026-10-19' }).success,
    ).toBe(false);
    expect(
      registroSeiTermoSchema.safeParse({ ...base, dataAssinatura: '2026-10-20', doeNumero: '1234', doeData: '2026-10-21' }).success,
    ).toBe(true);
  });

  it('número do termo: interno antigo ganha o ano, o do SEI fica como digitado', () => {
    expect(numeroTermoExibicao('007', 2025)).toBe('007/2025');
    expect(numeroTermoExibicao('Termo 12/2026', 2026)).toBe('Termo 12/2026');
    expect(numeroTermoExibicao(null, 2026)).toBeNull();
  });
});
