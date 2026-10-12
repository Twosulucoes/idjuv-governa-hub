import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { requerimentoModelo } from '../modelos/requerimento';
import { emissaoTeste, marcaTeste } from './fixtures';
import { comprovanteReferencia, dadosComprovante, dadosFicha, dadosRelatorio, fichaReferencia, relatorioReferencia } from './modelosReferencia';

// Gera os PDFs de amostra em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras para inspeção visual', () => {
  it('grava uma amostra por família', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('ato-requerimento.pdf', renderizarDocumento(requerimentoModelo, {
      requerente: { nome: 'João da Silva', cpf: '000.000.000-00', matricula: '1234', cargo: 'Analista', unidade: 'Divisão de Teste' },
      destinatario: 'Ao Ilmo. Sr. Presidente do Instituto', assunto: 'Solicitação de férias',
      texto: 'Venho, respeitosamente, requerer o gozo de férias regulamentares referentes ao exercício de 2026. '.repeat(6),
      fundamentacao: 'Nos termos do estatuto dos servidores.', anexos: ['Cópia do RG', 'Comprovante de residência'],
      local: 'Boa Vista', data: '12 de outubro de 2026', protocolo: 'RH-2026-000123', unidadeEmissora: ['DIVISÃO DE TESTE'],
    }, marcaTeste, emissaoTeste).doc);
    gravar('relatorio.pdf', renderizarDocumento(relatorioReferencia, dadosRelatorio, marcaTeste, emissaoTeste).doc);
    gravar('ficha.pdf', renderizarDocumento(fichaReferencia, dadosFicha, marcaTeste, emissaoTeste).doc);
    gravar('comprovante.pdf', renderizarDocumento(comprovanteReferencia, dadosComprovante, marcaTeste, emissaoTeste).doc);
  });
});
