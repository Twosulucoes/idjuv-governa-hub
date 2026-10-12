import type { Emissao, MarcaImpressao } from '../tipos';

/** PNG 1x1 válido; esticado vira um bloco cinza — suficiente para ver onde o logo cai. */
export const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const marcaTeste: MarcaImpressao = {
  nomeOrgao: 'INSTITUTO DE TESTE',
  entidadeSuperior: 'GOVERNO DE TESTE',
  nomeSistema: 'Sistema de Teste / TST',
  corPrimaria: { r: 22, g: 64, b: 105 },
  logoOrgao: { dataUrl: PNG_1X1, largura: 4, altura: 1, formato: 'PNG' },
  logoEntidadeSuperior: { dataUrl: PNG_1X1, largura: 4, altura: 1, formato: 'PNG' },
};

export const emissaoTeste: Emissao = { emitidoPor: 'Fulana de Tal', emitidoEm: new Date('2026-10-12T14:30:00Z') };
