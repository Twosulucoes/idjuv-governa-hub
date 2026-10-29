import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { ESTILO_PADRAO } from '../core/tokens';
import { amostraFicha, amostraRelatorio } from '../modelos/amostras';
import { conciliacaoMensal } from '../modelos/financeiro/conciliacaoMensal';
import { fichaContrato } from '../modelos/contratos/fichaContrato';
import { fichaPedidoPassagem } from '../modelos/passagens/fichaPedido';
import { saldoContratoPassagens } from '../modelos/passagens/saldoContrato';
import { fichaHistoricoFuncional } from '../modelos/rh/historicoFuncional';
import { relatorioServidoresDiretoria } from '../modelos/rh/servidoresDiretoria';
import { relatorioServidoresPortarias } from '../modelos/rh/servidoresPortarias';
import { relatorioServidoresVinculo } from '../modelos/rh/servidoresVinculo';
import { relatorioVagasCargo } from '../modelos/rh/vagasCargo';
import { dadosConciliacao } from './fixturesConciliacao';
import { dadosFichaContrato } from './fixturesContratos';
import { dadosFichaPedido, dadosSaldoContrato } from './fixturesPassagens';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosDiretoria, dadosHistorico, dadosPortarias, dadosVagas, dadosVinculo } from './fixturesRhGrupoA';
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

  it('grava os relatórios do RH (grupo A)', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('rh-servidores-diretoria.pdf', renderizarDocumento(relatorioServidoresDiretoria, dadosDiretoria(20), marcaTeste, emissaoTeste).doc);
    gravar('rh-servidores-vinculo.pdf', renderizarDocumento(relatorioServidoresVinculo, dadosVinculo(20), marcaTeste, emissaoTeste).doc);
    gravar('rh-historico-funcional.pdf', renderizarDocumento(fichaHistoricoFuncional, dadosHistorico(8), marcaTeste, emissaoTeste).doc);
    gravar('rh-vagas-cargo.pdf', renderizarDocumento(relatorioVagasCargo, dadosVagas(8), marcaTeste, emissaoTeste).doc);
    gravar('rh-servidores-portarias.pdf', renderizarDocumento(relatorioServidoresPortarias, dadosPortarias(6), marcaTeste, emissaoTeste).doc);
  });

  it('grava o quadro da conciliação mensal', () => {
    mkdirSync(saida!, { recursive: true });
    writeFileSync(join(saida!, 'financeiro-conciliacao-mensal.pdf'),
      Buffer.from(renderizarDocumento(conciliacaoMensal, dadosConciliacao(), marcaTeste, emissaoTeste).doc.output('arraybuffer')));
  });
  it('grava os documentos das passagens aéreas', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('contratos-passagem-ficha-pedido.pdf', renderizarDocumento(fichaPedidoPassagem, dadosFichaPedido(3), marcaTeste, emissaoTeste).doc);
    gravar('contratos-passagens-saldo-contrato.pdf', renderizarDocumento(saldoContratoPassagens, dadosSaldoContrato(8), marcaTeste, emissaoTeste).doc);
    gravar('contratos-ficha-contrato.pdf', renderizarDocumento(fichaContrato, dadosFichaContrato(4), marcaTeste, emissaoTeste).doc);
  });
});
