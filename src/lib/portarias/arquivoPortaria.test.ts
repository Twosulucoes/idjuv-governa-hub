import { describe, expect, it, vi } from 'vitest';

// O helper de abertura usa o cliente Supabase; aqui só a parte pura é testada
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { resolverArquivoPortaria } from './arquivoPortaria';

describe('resolverArquivoPortaria', () => {
  it('caminho gravado no bucket volta como caminho', () => {
    expect(resolverArquivoPortaria('portarias/123_portaria.pdf')).toEqual({
      tipo: 'caminho',
      caminho: 'portarias/123_portaria.pdf',
    });
  });

  it('URL pública antiga do bucket documentos vira caminho', () => {
    expect(
      resolverArquivoPortaria(
        'https://bd.exemplo.org/storage/v1/object/public/documentos/portarias/001-2026_assinada_1.pdf',
      ),
    ).toEqual({ tipo: 'caminho', caminho: 'portarias/001-2026_assinada_1.pdf' });
  });

  it('URL pública com caractere codificado é decodificada', () => {
    expect(
      resolverArquivoPortaria('https://x.org/storage/v1/object/public/documentos/portarias/a%20b.pdf'),
    ).toEqual({ tipo: 'caminho', caminho: 'portarias/a b.pdf' });
  });

  it('URL de outro bucket ou externa volta como está', () => {
    const outroBucket = 'https://x.org/storage/v1/object/public/outro/portarias/a.pdf';
    expect(resolverArquivoPortaria(outroBucket)).toEqual({ tipo: 'externa', url: outroBucket });
    const doe = 'https://doe.exemplo.gov.br/edicao/123.pdf';
    expect(resolverArquivoPortaria(doe)).toEqual({ tipo: 'externa', url: doe });
  });

  it.each([null, undefined, '', '   ', '../segredo.pdf', '/portarias/a.pdf'])(
    'valor inválido %s -> null',
    (valor) => {
      expect(resolverArquivoPortaria(valor)).toBeNull();
    },
  );
});
