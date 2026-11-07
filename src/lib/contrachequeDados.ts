/**
 * Monta a ficha do contracheque (`FichaContracheque`) a partir das linhas do banco. Regra pura, testada em
 * `contrachequeDados.test.ts`; quem busca as linhas é `carregarContracheques` (`@/hooks/useContracheque`).
 *
 * Antes cada tela montava o contracheque do seu jeito e três delas não mandavam as rubricas: o PDF mostrava
 * "Vencimento base, ref. 30" com o bruto e nenhum desconto, embora o total de descontos viesse preenchido
 * (teste do RH de 06/11/2026, itens 2, 3, 4 e 8).
 */
import type { FichaContracheque, RubricaContracheque } from '@/lib/documentos/modelos/folha/contracheque';
import { VINCULO_LABELS, type VinculoFuncional } from '@/types/rh';

export interface ItemFichaLinha {
  descricao: string | null;
  tipo: string;
  valor: number | null;
  referencia: string | null;
  percentual: number | null;
  ordem: number | null;
  rubrica?: { codigo: string | null } | null;
}

export interface FichaContrachequeLinha {
  id: string;
  servidor_id: string | null;
  cargo_nome: string | null;
  unidade_nome: string | null;
  total_proventos: number | null;
  total_descontos: number | null;
  valor_liquido: number | null;
  base_inss: number | null;
  valor_inss: number | null;
  base_irrf: number | null;
  valor_irrf: number | null;
  quantidade_dependentes: number | null;
  inss_patronal: number | null;
  rat: number | null;
  total_encargos: number | null;
  banco_codigo: string | null;
  banco_nome: string | null;
  banco_agencia: string | null;
  banco_conta: string | null;
  tem_inconsistencia: boolean | null;
  folha?: { status: string | null } | null;
  servidor?: {
    nome_completo: string;
    cpf: string | null;
    matricula: string | null;
    pis_pasep: string | null;
    data_admissao: string | null;
    vinculo: string | null;
    contribui_rpps_origem: boolean | null;
    banco_codigo: string | null;
    banco_nome: string | null;
    banco_agencia: string | null;
    banco_conta: string | null;
  } | null;
  itens?: ItemFichaLinha[] | null;
}

/** "SIGLA - Nome" da unidade, ou nulo quando a ficha guardou só o separador (fichas antigas: " - "). */
export function unidadeValida(nome: string | null | undefined): string | null {
  const limpo = (nome ?? '').trim();
  return limpo.replace(/^-|-$/g, '').trim() ? limpo : null;
}

const num = (v: number | null | undefined) => Number(v ?? 0) || 0;

/** Código sequencial quando o item não tem rubrica cadastrada: 001… para proventos, 101… para descontos. */
function rubricas(itens: ItemFichaLinha[]): RubricaContracheque[] {
  const ordenados = [...itens].sort((a, b) => num(a.ordem) - num(b.ordem));
  const seq = { provento: 0, desconto: 0 };
  return ordenados
    .filter((i) => i.tipo === 'provento' || i.tipo === 'desconto')
    .map((i) => {
      const tipo = i.tipo as 'provento' | 'desconto';
      seq[tipo] += 1;
      const codigo = i.rubrica?.codigo || String((tipo === 'provento' ? 0 : 100) + seq[tipo]).padStart(3, '0');
      return {
        codigo,
        descricao: i.descricao || (tipo === 'provento' ? 'Provento' : 'Desconto'),
        tipo,
        // a referência que a ficha mostra ("24/30 dias", "1 dia(s)"); sem ela, o percentual
        referencia: i.referencia?.trim() || (i.percentual ? Number(i.percentual) : null),
        valor: num(i.valor),
      };
    });
}

export function regimeDoServidor(s: FichaContrachequeLinha['servidor']): string | null {
  if (!s) return null;
  const vinculo = s.vinculo ? VINCULO_LABELS[s.vinculo as VinculoFuncional] ?? s.vinculo : null;
  const regime = s.contribui_rpps_origem ? 'regime próprio do órgão de origem' : 'Regime Geral (INSS)';
  return [vinculo, regime].filter(Boolean).join(' · ');
}

export function montarFichaContracheque(
  linha: FichaContrachequeLinha,
  lotacaoVigente?: string | null,
): FichaContracheque {
  const s = linha.servidor;
  const contaFicha = linha.banco_conta
    ? { banco_codigo: linha.banco_codigo, banco_nome: linha.banco_nome, agencia: linha.banco_agencia, conta: linha.banco_conta }
    : null;
  const contaCadastro = s?.banco_conta
    ? { banco_codigo: s.banco_codigo, banco_nome: s.banco_nome, agencia: s.banco_agencia, conta: s.banco_conta }
    : null;
  const encargos = num(linha.total_encargos) > 0 || num(linha.inss_patronal) > 0 || num(linha.rat) > 0
    ? { inss_patronal: num(linha.inss_patronal), rat: num(linha.rat), total: num(linha.total_encargos) }
    : null;
  const previa = (linha.folha?.status ?? 'fechada') !== 'fechada';
  return {
    id: linha.id,
    servidor_id: linha.servidor_id ?? '',
    cargo_nome: linha.cargo_nome,
    unidade_nome: unidadeValida(linha.unidade_nome) ?? lotacaoVigente ?? null,
    total_proventos: num(linha.total_proventos),
    total_descontos: num(linha.total_descontos),
    valor_liquido: num(linha.valor_liquido),
    base_inss: linha.base_inss,
    valor_inss: linha.valor_inss,
    base_irrf: linha.base_irrf,
    valor_irrf: linha.valor_irrf,
    quantidade_dependentes: linha.quantidade_dependentes,
    rubricas: rubricas(linha.itens ?? []),
    servidor: s
      ? { nome_completo: s.nome_completo, cpf: s.cpf ?? '', matricula: s.matricula, pis_pasep: s.pis_pasep }
      : undefined,
    data_admissao: s?.data_admissao ?? null,
    regime: regimeDoServidor(s),
    // a conta gravada na ficha é a do pagamento; ficha sem conta usa a do cadastro
    conta: contaFicha ?? contaCadastro,
    encargos,
    previa,
    com_inconsistencia: previa && !!linha.tem_inconsistencia,
  };
}
