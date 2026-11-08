import { camposChaveValor, paragrafo, quebraPagina, secao, tabela, type Campo, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda } from '../rh/comum';
import { formatarCPF } from '../rh/formatos';

/**
 * Contracheque (holerite) de um ou mais servidores numa competência. O lote é o mesmo modelo com
 * uma página por servidor (`quebraPagina` entre eles). Documento conferido pelo servidor e pelo banco:
 * imprime a identificação (com admissão, vínculo/regime e conta de pagamento), as rubricas da ficha
 * com código e referência, totais, líquido, bases de INSS e IRRF, dependentes e os encargos do
 * empregador, e nada de dado pessoal além disso. Folha ainda não fechada sai marcada como PRÉVIA.
 * Os dados vêm de `carregarContracheques` (`@/hooks/useContracheque`), igual em todas as telas.
 */

export interface RubricaContracheque {
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  /** Dias, horas ou % ("24/30 dias", 8,5). Texto sai como está; número sai formatado. */
  referencia?: number | string | null;
  valor: number;
}

export interface ServidorContracheque {
  nome_completo: string;
  cpf: string;
  matricula?: string | null;
  pis_pasep?: string | null;
}

export interface ContaPagamentoContracheque {
  banco_codigo?: string | null;
  banco_nome?: string | null;
  agencia?: string | null;
  conta?: string | null;
}

/** Encargos do empregador sobre a ficha (informativos: não entram no líquido). */
export interface EncargosContracheque {
  inss_patronal?: number | null;
  rat?: number | null;
  total?: number | null;
}

/** Uma ficha financeira da competência (o que as telas já carregam). */
export interface FichaContracheque {
  id: string;
  servidor_id: string;
  cargo_nome?: string | null;
  unidade_nome?: string | null;
  total_proventos: number;
  total_descontos: number;
  valor_liquido: number;
  base_inss?: number | null;
  valor_inss?: number | null;
  base_irrf?: number | null;
  valor_irrf?: number | null;
  quantidade_dependentes?: number | null;
  rubricas?: RubricaContracheque[];
  servidor?: ServidorContracheque;
  /** Data ISO (aaaa-mm-dd). */
  data_admissao?: string | null;
  /** Vínculo e regime de previdência, já por extenso. */
  regime?: string | null;
  conta?: ContaPagamentoContracheque | null;
  encargos?: EncargosContracheque | null;
  /** Folha ainda não fechada: o documento sai marcado como prévia. */
  previa?: boolean;
  /** Ficha com inconsistência pendente (só aparece na prévia). */
  com_inconsistencia?: boolean;
}

export interface DadosContracheque {
  /** Ex.: "Setembro/2026". */
  competencia: string;
  /** Um contracheque por ficha, cada um começando em página nova. */
  fichas: FichaContracheque[];
}

const centavos = (v: number) => Math.round(v * 100);

/**
 * Rubricas a imprimir. Sem rubricas detalhadas (ficha antiga), monta o que dá para afirmar: o total de
 * proventos como vencimento (sem referência inventada) e INSS/IRRF com os valores da ficha. Se as linhas não
 * fecham com os totais da ficha, a diferença sai numa linha própria ("Outros proventos/descontos"): o
 * contracheque nunca mostra um total sem as linhas que o formam.
 */
export function rubricasDoContracheque(f: FichaContracheque): { proventos: RubricaContracheque[]; descontos: RubricaContracheque[] } {
  const rubricas = f.rubricas ?? [];
  const proventos = rubricas.filter((r) => r.tipo === 'provento');
  const descontos = rubricas.filter((r) => r.tipo === 'desconto');
  if (proventos.length === 0 && f.total_proventos > 0) {
    proventos.push({ codigo: '001', descricao: 'Vencimento Base', tipo: 'provento', referencia: null, valor: f.total_proventos });
  }
  if (descontos.length === 0) {
    if (f.valor_inss && f.valor_inss > 0) descontos.push({ codigo: '101', descricao: 'INSS', tipo: 'desconto', valor: f.valor_inss });
    if (f.valor_irrf && f.valor_irrf > 0) descontos.push({ codigo: '102', descricao: 'IRRF', tipo: 'desconto', valor: f.valor_irrf });
  }
  const diferenca = (linhas: RubricaContracheque[], total: number) =>
    centavos(total) - linhas.reduce((s, r) => s + centavos(r.valor), 0);
  const difP = diferenca(proventos, f.total_proventos);
  if (difP > 0) proventos.push({ codigo: '099', descricao: 'Outros proventos (sem detalhe na ficha)', tipo: 'provento', valor: difP / 100 });
  const difD = diferenca(descontos, f.total_descontos);
  if (difD > 0) descontos.push({ codigo: '199', descricao: 'Outros descontos (sem detalhe na ficha)', tipo: 'desconto', valor: difD / 100 });
  return { proventos, descontos };
}

const NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** Valor da tabela sem o "R$" (o título da coluna já diz a moeda). */
const valor = (v: number | null | undefined): string => moeda(v).replace(/^R\$\s*/, '');
/** Referência (dias, horas, %): zero ou ausente fica em branco, como no antigo. */
const referencia = (r: number | string | null | undefined): string =>
  typeof r === 'string' ? r.trim() : r ? NUMERO.format(r) : '';
const dataBR = (iso: string | null | undefined): string | undefined => {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined;
};
/** "001 - Banco do Brasil · ag. 1234 · c/c 56789-0", ou indefinido sem conta. */
export function contaDePagamento(c: ContaPagamentoContracheque | null | undefined): string | undefined {
  if (!c?.conta) return undefined;
  const banco = [c.banco_codigo, c.banco_nome].filter(Boolean).join(' - ');
  return [banco, c.agencia && `ag. ${c.agencia}`, `conta ${c.conta}`].filter(Boolean).join(' · ');
}

// Proventos à esquerda e descontos à direita na mesma linha, como no antigo: metade das linhas de uma
// tabela única, para o contracheque caber numa página. Pesos em mm da largura útil em retrato (170).
// Todas em branco quando vazias (`emBranco`): o lado que acabou e o separador não levam "—".
const COLUNAS_RUBRICAS: ColunaTabela[] = (
  [
    { chave: 'codP', titulo: 'Cód', peso: 10 },
    { chave: 'descP', titulo: 'Proventos', peso: 36 },
    { chave: 'refP', titulo: 'Ref.', peso: 14, alinhamento: 'direita' },
    { chave: 'valP', titulo: 'Valor (R$)', peso: 23, alinhamento: 'direita' },
    // Coluna vazia só para separar as duas metades.
    { chave: 'separador', titulo: '', peso: 4 },
    { chave: 'codD', titulo: 'Cód', peso: 10 },
    { chave: 'descD', titulo: 'Descontos', peso: 36 },
    { chave: 'refD', titulo: 'Ref.', peso: 14, alinhamento: 'direita' },
    { chave: 'valD', titulo: 'Valor (R$)', peso: 23, alinhamento: 'direita' },
  ] satisfies ColunaTabela[]
).map((c) => ({ ...c, emBranco: true }));

/** Referência que cabe na coluna (dias, %); a longa ("2 dependente(s); desconto simplificado") vai para a descrição. */
const REF_MAX = 10;
function descricaoERef(r: RubricaContracheque): { desc: string; ref: string } {
  const ref = referencia(r.referencia);
  return ref.length > REF_MAX ? { desc: `${r.descricao} (${ref})`, ref: '' } : { desc: r.descricao, ref };
}

/** Linha i da tabela: i-ésimo provento e i-ésimo desconto (o lado que acabou fica em branco). */
function linhasRubricas(proventos: RubricaContracheque[], descontos: RubricaContracheque[]) {
  return Array.from({ length: Math.max(proventos.length, descontos.length) }, (_, i) => {
    const p = proventos[i] && { ...proventos[i], ...descricaoERef(proventos[i]) };
    const d = descontos[i] && { ...descontos[i], ...descricaoERef(descontos[i]) };
    return {
      ...(p && { codP: p.codigo, descP: p.desc, refP: p.ref, valP: valor(p.valor) }),
      ...(d && { codD: d.codigo, descD: d.desc, refD: d.ref, valD: valor(d.valor) }),
    };
  });
}

function blocosDaFicha(f: FichaContracheque, competencia: string, lote: boolean): Bloco[] {
  const { proventos, descontos } = rubricasDoContracheque(f);
  const identificacao: Campo[] = [
    { rotulo: 'Nome', valor: f.servidor?.nome_completo },
    { rotulo: 'CPF', valor: formatarCPF(f.servidor?.cpf) },
    { rotulo: 'Matrícula', valor: f.servidor?.matricula },
    { rotulo: 'Cargo', valor: f.cargo_nome },
    { rotulo: 'Lotação', valor: f.unidade_nome },
    // admissão, vínculo/regime e conta só saem quando a ficha os traz (fichas antigas não têm)
    ...([
      { rotulo: 'Admissão', valor: dataBR(f.data_admissao) },
      { rotulo: 'Vínculo e regime', valor: f.regime ?? undefined },
      { rotulo: 'Conta de pagamento', valor: contaDePagamento(f.conta) },
    ].filter((c) => !!c.valor) as Campo[]),
    // Como no antigo: PIS/PASEP só sai quando a ficha traz o número.
    ...(f.servidor?.pis_pasep ? [{ rotulo: 'PIS/PASEP', valor: f.servidor.pis_pasep }] : []),
  ];
  const aviso: Bloco[] = f.previa
    ? [paragrafo({
        texto: `PRÉVIA: a folha desta competência ainda não foi fechada${f.com_inconsistencia ? ' e a ficha tem inconsistência pendente' : ''}. Este documento não vale como comprovante.`,
        negrito: true,
      })]
    : [];
  const encargos = f.encargos;
  return [
    ...aviso,
    // No lote, as páginas 2+ têm cabeçalho compacto, sem o título: a seção diz o que é e de quando.
    secao({ texto: lote ? `Contracheque - competência ${competencia}` : 'Dados do servidor' }),
    camposChaveValor({ colunas: 3, campos: identificacao }),
    tabela({
      colunas: COLUNAS_RUBRICAS,
      linhas: linhasRubricas(proventos, descontos),
      totais: { descP: 'Total de proventos (bruto)', valP: valor(f.total_proventos), descD: 'Total de descontos', valD: valor(f.total_descontos) },
    }),
    // O líquido em destaque logo abaixo dos totais, como a faixa do antigo.
    paragrafo({ texto: `VALOR LÍQUIDO: ${moeda(f.valor_liquido)}`, negrito: true }),
    // bases e, quando há, os encargos do empregador (informativos) num bloco só, para caber numa página
    camposChaveValor({
      colunas: encargos ? 4 : 3,
      campos: [
        { rotulo: 'Base INSS', valor: moeda(f.base_inss) },
        { rotulo: 'INSS', valor: moeda(f.valor_inss) },
        { rotulo: 'Dependentes IRRF', valor: String(f.quantidade_dependentes || 0) },
        { rotulo: 'Base IRRF', valor: moeda(f.base_irrf) },
        { rotulo: 'IRRF', valor: moeda(f.valor_irrf) },
        ...(encargos
          ? [
              { rotulo: 'INSS patronal (empregador)', valor: moeda(encargos.inss_patronal) },
              { rotulo: 'RAT/FAP (empregador)', valor: moeda(encargos.rat) },
              { rotulo: 'Total de encargos', valor: moeda(encargos.total) },
            ]
          : []),
      ],
    }),
  ];
}

const nomeNoArquivo = (nome: string | undefined): string => (nome || 'servidor').replace(/\s+/g, '_').substring(0, 20);

export const contracheque: DocumentoModelo<DadosContracheque> = {
  tipo: 'folha-contracheque',
  familia: 'comprovante',
  titulo: () => 'Contracheque',
  subtitulo: (d) => `Competência: ${d.competencia}`,
  // Mesmos nomes de arquivo do gerador antigo (um servidor × lote).
  nomeArquivo: (d) =>
    d.fichas.length === 1
      ? `Contracheque_${nomeNoArquivo(d.fichas[0].servidor?.nome_completo)}_${d.competencia.replace('/', '-')}.pdf`
      : `Contracheques_${d.competencia.replace('/', '-')}_Lote.pdf`,
  blocos: (d) => {
    if (d.fichas.length === 0) return [paragrafo({ texto: 'Nenhum contracheque para a competência.' })];
    return d.fichas.flatMap((f, i) => [...(i > 0 ? [quebraPagina()] : []), ...blocosDaFicha(f, d.competencia, d.fichas.length > 1)]);
  },
};
