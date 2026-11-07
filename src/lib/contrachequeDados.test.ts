import { describe, expect, it } from 'vitest';
import { montarFichaContracheque, regimeDoServidor, unidadeValida, type FichaContrachequeLinha } from './contrachequeDados';

const linha = (extra: Partial<FichaContrachequeLinha> = {}): FichaContrachequeLinha => ({
  id: 'f1', servidor_id: 's1', cargo_nome: 'Diretor', unidade_nome: ' - ',
  total_proventos: 23368.8, total_descontos: 973.7, valor_liquido: 22395.1,
  base_inss: 22395.1, valor_inss: 0, base_irrf: 22395.1, valor_irrf: 0, quantidade_dependentes: 0,
  inss_patronal: 0, rat: 0, total_encargos: 0,
  banco_codigo: null, banco_nome: null, banco_agencia: null, banco_conta: null, tem_inconsistencia: true,
  folha: { status: 'aberta' },
  servidor: {
    nome_completo: 'TESTE', cpf: '00000000000', matricula: '1776976', pis_pasep: null, data_admissao: '2026-11-07',
    vinculo: 'comissionado', contribui_rpps_origem: false,
    banco_codigo: '001', banco_nome: 'Banco do Brasil', banco_agencia: '1234', banco_conta: '999-1',
  },
  itens: [
    { descricao: 'Desconto de faltas', tipo: 'desconto', valor: 973.7, referencia: '1 dia(s)', percentual: null, ordem: 2 },
    { descricao: 'Vencimento', tipo: 'provento', valor: 23368.8, referencia: '24/30 dias', percentual: null, ordem: 1 },
  ],
  ...extra,
});

describe('contrachequeDados (teste do RH de 06/11/2026)', () => {
  it('leva cada item da ficha com a referência da ficha (24/30, não 30)', () => {
    const f = montarFichaContracheque(linha());
    expect(f.rubricas).toEqual([
      { codigo: '001', descricao: 'Vencimento', tipo: 'provento', referencia: '24/30 dias', valor: 23368.8 },
      { codigo: '101', descricao: 'Desconto de faltas', tipo: 'desconto', referencia: '1 dia(s)', valor: 973.7 },
    ]);
  });

  it('usa o código da rubrica cadastrada quando existe', () => {
    const f = montarFichaContracheque(linha({
      itens: [{ descricao: 'Vencimento', tipo: 'provento', valor: 10, referencia: null, percentual: null, ordem: 1, rubrica: { codigo: 'V01' } }],
    }));
    expect(f.rubricas?.[0].codigo).toBe('V01');
  });

  it('unidade " - " (ficha antiga) cai na lotação vigente', () => {
    expect(unidadeValida(' - ')).toBeNull();
    expect(unidadeValida('PRES - Presidência')).toBe('PRES - Presidência');
    expect(montarFichaContracheque(linha(), 'PRES - Presidência').unidade_nome).toBe('PRES - Presidência');
    expect(montarFichaContracheque(linha({ unidade_nome: 'DIESP - Diretoria' }), 'PRES - Presidência').unidade_nome).toBe('DIESP - Diretoria');
  });

  it('admissão, regime, conta do cadastro quando a ficha não tem, e prévia com inconsistência', () => {
    const f = montarFichaContracheque(linha());
    expect(f.data_admissao).toBe('2026-11-07');
    expect(f.regime).toBe('Comissionado · Regime Geral (INSS)');
    expect(f.conta).toEqual({ banco_codigo: '001', banco_nome: 'Banco do Brasil', agencia: '1234', conta: '999-1' });
    expect(f.previa).toBe(true);
    expect(f.com_inconsistencia).toBe(true);
    expect(f.encargos).toBeNull();
  });

  it('folha fechada não é prévia; conta da ficha vence a do cadastro; encargos quando há', () => {
    const f = montarFichaContracheque(linha({
      folha: { status: 'fechada' }, banco_codigo: '104', banco_nome: 'Caixa', banco_agencia: '1', banco_conta: '2',
      inss_patronal: 100, rat: 10, total_encargos: 110,
    }));
    expect(f.previa).toBe(false);
    expect(f.com_inconsistencia).toBe(false);
    expect(f.conta?.banco_codigo).toBe('104');
    expect(f.encargos).toEqual({ inss_patronal: 100, rat: 10, total: 110 });
  });

  it('regime próprio da origem', () => {
    expect(regimeDoServidor({ ...linha().servidor!, vinculo: 'efetivo', contribui_rpps_origem: true }))
      .toBe('Efetivo · regime próprio do órgão de origem');
  });
});
