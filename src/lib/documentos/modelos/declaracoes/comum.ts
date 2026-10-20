import { assinaturas, camposChaveValor, localData, type Campo } from '../../blocos';
import type { Bloco } from '../../tipos';
import { formatarCPF } from '../rh/formatos';

/**
 * Declarações do servidor (acumulação de cargos, bens e valores, residência): o mesmo modelo serve à
 * versão preenchida (com `servidor`) e à em branco (sem ele, campos com linha para preencher à mão).
 * Nome do órgão, local e data vêm nos dados: o modelo não escreve nome de instituição nem cidade.
 */

export interface DeclaranteServidor {
  nome_completo: string;
  cpf?: string | null;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  cargo_nome?: string | null;
  unidade_nome?: string | null;
  naturalidade_cidade?: string | null;
  naturalidade_uf?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  /** Só a declaração de acumulação usa. Ausente = nenhuma opção marcada. */
  acumula_cargo?: boolean | null;
  acumulo_descricao?: string | null;
}

export interface DadosDeclaracao {
  /** Ausente = declaração em branco, para imprimir e preencher à mão. */
  servidor?: DeclaranteServidor;
  /** Nome oficial do órgão (identidade do tenant), citado no texto da declaração. */
  orgao?: string;
  /** "Cidade/UF" da sede, para a linha de local e data. */
  local?: string;
  /** Data por extenso da preenchida; a em branco deixa a data para preencher. */
  data?: string;
}

/** Linha para preencher à mão, do tamanho da coluna (1, 2 ou 3 por linha), mesmo na letra grande. */
export const LINHA: Record<1 | 2 | 3, string> = { 1: '_'.repeat(74), 2: '_'.repeat(35), 3: '_'.repeat(22) };

const preenchido = (v?: string | null): v is string => !!v && v.trim() !== '';

/** Grade rótulo/valor em que campo vazio vira linha para preencher (declaração não fica com "—"). */
export function campos(colunas: 1 | 2 | 3, lista: Campo[]): Bloco {
  const vazio = (v: Campo['valor']) => v === null || v === undefined || String(v).trim() === '';
  return camposChaveValor({ colunas, campos: lista.map((c) => ({ rotulo: c.rotulo, valor: vazio(c.valor) ? LINHA[colunas] : c.valor })) });
}

/** "(X)" marcado, "(   )" para marcar à mão. */
export const marca = (marcado: boolean): string => (marcado ? '( X )' : '(    )');

export const cpfDe = (s?: DeclaranteServidor): string => formatarCPF(s?.cpf);

export const rgDe = (s?: DeclaranteServidor): string =>
  s && preenchido(s.rg) ? (preenchido(s.rg_orgao_expedidor) ? `${s.rg} - ${s.rg_orgao_expedidor}` : s.rg) : '';

export const naturalidadeDe = (s?: DeclaranteServidor): string =>
  [s?.naturalidade_cidade, s?.naturalidade_uf].filter(preenchido).join('/');

/** Endereço numa linha; vazio se não houver logradouro. Sem UF padrão: o que não está no cadastro fica de fora. */
export function enderecoDe(s?: DeclaranteServidor): string {
  if (!s || !preenchido(s.endereco_logradouro)) return '';
  const cidadeUf = [s.endereco_cidade, s.endereco_uf].filter(preenchido).join('/');
  return [
    `${s.endereco_logradouro}, nº ${preenchido(s.endereco_numero) ? s.endereco_numero : 'S/N'}`,
    s.endereco_complemento,
    preenchido(s.endereco_bairro) ? `Bairro ${s.endereco_bairro}` : '',
    cidadeUf,
    preenchido(s.endereco_cep) ? `CEP ${s.endereco_cep}` : '',
  ]
    .filter(preenchido)
    .join(', ');
}

export const nomeArquivoDeclaracao = (prefixo: string, d: DadosDeclaracao): string =>
  d.servidor ? `${prefixo}_${d.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 30)}.pdf` : `Modelo_${prefixo}.pdf`;

/** Local e data e a linha de assinatura do declarante (nome e CPF na preenchida). */
export function fechamento(d: DadosDeclaracao): Bloco[] {
  const s = d.servidor;
  return [
    localData({ local: d.local || '_'.repeat(30), data: s && d.data ? d.data : '______ de ____________________ de ________' }),
    assinaturas({
      assinantes: [
        s
          ? { nome: s.nome_completo, cargo: 'Assinatura do(a) declarante', documento: cpfDe(s) ? `CPF: ${cpfDe(s)}` : undefined }
          : { nome: 'Assinatura do(a) declarante' },
      ],
    }),
  ];
}
