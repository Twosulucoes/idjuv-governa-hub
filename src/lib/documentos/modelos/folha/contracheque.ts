import { camposChaveValor, paragrafo, quebraPagina, secao, tabela, type Campo, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda } from '../rh/comum';
import { formatarCPF } from '../rh/formatos';

/**
 * Contracheque (holerite) de um ou mais servidores numa competência. O lote é o mesmo modelo com
 * uma página por servidor (`quebraPagina` entre eles). Documento conferido pelo servidor e pelo banco:
 * imprime tudo o que o gerador antigo imprimia (identificação, rubricas com código e referência,
 * totais, líquido, bases de INSS e IRRF, dependentes) e nada de dado pessoal além disso.
 */

export interface RubricaContracheque {
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  referencia?: number | null;
  valor: number;
}

export interface ServidorContracheque {
  nome_completo: string;
  cpf: string;
  matricula?: string | null;
  pis_pasep?: string | null;
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
}

export interface DadosContracheque {
  /** Ex.: "Setembro/2026". */
  competencia: string;
  /** Um contracheque por ficha, cada um começando em página nova. */
  fichas: FichaContracheque[];
}

/**
 * Rubricas a imprimir. Sem rubricas detalhadas, monta as mesmas linhas que o gerador antigo montava:
 * vencimento base (ref. 30) com o total de proventos, e INSS/IRRF com os valores da ficha.
 */
export function rubricasDoContracheque(f: FichaContracheque): { proventos: RubricaContracheque[]; descontos: RubricaContracheque[] } {
  const rubricas = f.rubricas ?? [];
  const proventos = rubricas.filter((r) => r.tipo === 'provento');
  const descontos = rubricas.filter((r) => r.tipo === 'desconto');
  if (proventos.length === 0 && f.total_proventos > 0) {
    proventos.push({ codigo: '001', descricao: 'Vencimento Base', tipo: 'provento', referencia: 30, valor: f.total_proventos });
  }
  if (descontos.length === 0) {
    if (f.valor_inss && f.valor_inss > 0) descontos.push({ codigo: '101', descricao: 'INSS', tipo: 'desconto', valor: f.valor_inss });
    if (f.valor_irrf && f.valor_irrf > 0) descontos.push({ codigo: '102', descricao: 'IRRF', tipo: 'desconto', valor: f.valor_irrf });
  }
  return { proventos, descontos };
}

const NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** Valor da tabela sem o "R$" (o título da coluna já diz a moeda). */
const valor = (v: number | null | undefined): string => moeda(v).replace(/^R\$\s*/, '');
/** Referência (dias, horas, %): zero ou ausente fica em branco, como no antigo. */
const referencia = (r: number | null | undefined): string => (r ? NUMERO.format(r) : '');

// Proventos à esquerda e descontos à direita na mesma linha, como no antigo: metade das linhas de uma
// tabela única, para o contracheque caber numa página. Pesos em mm da largura útil em retrato (170).
const COLUNAS_RUBRICAS: ColunaTabela[] = [
  { chave: 'codP', titulo: 'Cód', peso: 10 },
  { chave: 'descP', titulo: 'Proventos', peso: 39 },
  { chave: 'refP', titulo: 'Ref.', peso: 11, alinhamento: 'direita' },
  { chave: 'valP', titulo: 'Valor (R$)', peso: 23, alinhamento: 'direita' },
  // Coluna vazia só para separar as duas metades.
  { chave: 'separador', titulo: '', peso: 4 },
  { chave: 'codD', titulo: 'Cód', peso: 10 },
  { chave: 'descD', titulo: 'Descontos', peso: 39 },
  { chave: 'refD', titulo: 'Ref.', peso: 11, alinhamento: 'direita' },
  { chave: 'valD', titulo: 'Valor (R$)', peso: 23, alinhamento: 'direita' },
];

/** Linha i da tabela: i-ésimo provento e i-ésimo desconto (o lado que acabou fica em branco). */
function linhasRubricas(proventos: RubricaContracheque[], descontos: RubricaContracheque[]) {
  return Array.from({ length: Math.max(proventos.length, descontos.length) }, (_, i) => {
    const p = proventos[i];
    const d = descontos[i];
    return {
      ...(p && { codP: p.codigo, descP: p.descricao, refP: referencia(p.referencia), valP: valor(p.valor) }),
      ...(d && { codD: d.codigo, descD: d.descricao, refD: referencia(d.referencia), valD: valor(d.valor) }),
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
    // Como no antigo: PIS/PASEP só sai quando a ficha traz o número.
    ...(f.servidor?.pis_pasep ? [{ rotulo: 'PIS/PASEP', valor: f.servidor.pis_pasep }] : []),
  ];
  return [
    // No lote, as páginas 2+ têm cabeçalho compacto, sem o título: a seção diz o que é e de quando.
    secao({ texto: lote ? `Contracheque - competência ${competencia}` : 'Dados do servidor' }),
    camposChaveValor({ colunas: 3, campos: identificacao }),
    tabela({
      colunas: COLUNAS_RUBRICAS,
      linhas: linhasRubricas(proventos, descontos),
      totais: { descP: 'Total de proventos (bruto)', valP: valor(f.total_proventos), descD: 'Total de descontos', valD: valor(f.total_descontos) },
      vazioEmBranco: true,
    }),
    // O líquido em destaque logo abaixo dos totais, como a faixa do antigo.
    paragrafo({ texto: `VALOR LÍQUIDO: ${moeda(f.valor_liquido)}`, negrito: true }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Base INSS', valor: moeda(f.base_inss) },
        { rotulo: 'INSS', valor: moeda(f.valor_inss) },
        { rotulo: 'Dependentes IRRF', valor: String(f.quantidade_dependentes || 0) },
        { rotulo: 'Base IRRF', valor: moeda(f.base_irrf) },
        { rotulo: 'IRRF', valor: moeda(f.valor_irrf) },
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
