import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { ESTILO_PADRAO } from '../core/tokens';
import { amostraFicha, amostraRelatorio } from '../modelos/amostras';
import { emissaoTeste, marcaTeste } from './fixtures';
import { comprovanteReferencia, dadosComprovante, dadosFicha, dadosRelatorio, fichaReferencia, relatorioReferencia } from './modelosReferencia';

// Gera os PDFs de amostra em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras para inspeção visual', () => {
  it('grava uma amostra por família', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('relatorio.pdf', renderizarDocumento(relatorioReferencia, dadosRelatorio, marcaTeste, emissaoTeste).doc);
    gravar('ficha.pdf', renderizarDocumento(fichaReferencia, dadosFicha, marcaTeste, emissaoTeste).doc);
    gravar('comprovante.pdf', renderizarDocumento(comprovanteReferencia, dadosComprovante, marcaTeste, emissaoTeste).doc);
    // Pré-visualização da tela de configuração: padrão e com todas as opções mudadas.
    gravar('amostra-relatorio.pdf', renderizarDocumento(amostraRelatorio, {}, marcaTeste, emissaoTeste).doc);
    const configurado = {
      ...ESTILO_PADRAO,
      escala: 'compacto' as const,
      zebra: false,
      mostrarEmissor: false,
      orientacao: 'paisagem' as const,
      linhaCabecalho: 'Secretaria de Exemplo',
      textoRodape: 'Rua Exemplo, 100 - Centro - (00) 0000-0000',
    };
    gravar('amostra-relatorio-configurado.pdf', renderizarDocumento(amostraRelatorio, {}, marcaTeste, emissaoTeste, configurado).doc);
    gravar('amostra-ficha.pdf', renderizarDocumento(amostraFicha, { solicitante: 'Fulana' }, marcaTeste, emissaoTeste).doc);
  });
});
