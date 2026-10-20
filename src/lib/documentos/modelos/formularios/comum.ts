import { assinaturas, camposChaveValor, localData, paragrafo, secao, tabela, type Assinante, type ColunaTabela } from '../../blocos';
import { paraNomeArquivo } from '../../core/texto';
import { ESPACO, alturaLinha } from '../../core/tokens';
import type { Bloco } from '../../tipos';

/**
 * Peças comuns dos formulários administrativos (termo de demanda, ordem de missão, relatório de viagem,
 * requisição de material, termo de responsabilidade). Cada formulário é um modelo só: com `preenchido` sai
 * com os dados da tela; sem ele, sai em branco, com linhas para preencher à mão.
 */

/** Envelope comum: os dados da tela (ausentes = formulário em branco) e o que vem da instalação. */
export interface DadosFormulario<T> {
  /** Ausente = formulário em branco, para imprimir e preencher à mão. */
  preenchido?: T;
  /** Número do formulário (ex.: "TD1234/2026"); a versão em branco deixa o número para preencher. */
  numero?: string;
  /** "Cidade/UF" da sede, para o local e data acima das assinaturas. */
  local?: string;
  /** Data por extenso do formulário preenchido; o em branco deixa a data para preencher. */
  data?: string;
  /** Sigla do órgão (identidade do tenant), citada nas declarações ("IN de Diárias do …"). */
  siglaOrgao?: string;
}

export interface CampoFormulario {
  rotulo: string;
  valor?: string | number | null;
  /** Só na versão em branco ou quando a tela informou o valor (a tela não pede esse campo). */
  opcional?: boolean;
  /** Campo de marcar: a versão em branco imprime "(   ) opção" para cada uma; a preenchida, a escolha da tela. */
  alternativas?: string[];
}

/**
 * Linha para preencher à mão: sublinhados que cabem na coluna mesmo na letra grande
 * (traço de 11,5 pt ≈ 2,3 mm em colunas de 170, 82 e 52 mm). Mesma medida da ficha cadastral.
 */
const LINHA: Record<1 | 2 | 3, string> = { 1: '_'.repeat(74), 2: '_'.repeat(35), 3: '_'.repeat(22) };

const marcar = (alternativas: string[]): string => alternativas.map((a) => `(   ) ${a}`).join('   ');

const vazio = (v: CampoFormulario['valor']): boolean => v === null || v === undefined || String(v).trim() === '';

/** Rótulo e valor; na versão em branco, todo valor vira linha para preencher. Grade sem campo nenhum some. */
export function campos(emBranco: boolean, colunas: 1 | 2 | 3, lista: CampoFormulario[]): Bloco[] {
  const visiveis = lista.filter((c) => emBranco || !c.opcional || !vazio(c.valor));
  if (visiveis.length === 0) return [];
  return [
    camposChaveValor({
      colunas,
      campos: visiveis.map((c) => ({
        rotulo: c.rotulo,
        valor: !emBranco ? c.valor : c.alternativas ? marcar(c.alternativas) : LINHA[colunas],
      })),
    }),
  ];
}

const linhasEmBranco = (n: number): string => Array.from({ length: n }, () => LINHA[1]).join('\n');

/** Texto livre: na preenchida, o texto da tela (quebra linha); na em branco, `linhas` linhas para escrever. */
export function areaDeTexto(emBranco: boolean, rotulo: string, valor: string | undefined, linhas: number): Bloco {
  return camposChaveValor({
    colunas: 1,
    campos: [{ rotulo, valor: emBranco ? linhasEmBranco(linhas) : valor }],
  });
}

/** Seção numerada só de texto livre (sem rótulo próprio: o título da seção já diz o que é). */
export function secaoDeTexto(emBranco: boolean, titulo: string, valor: string | undefined, linhas: number): Bloco[] {
  if (emBranco) return [secao({ texto: titulo }), paragrafo({ texto: linhasEmBranco(linhas) })];
  return [secao({ texto: titulo }), paragrafo({ texto: valor?.trim() || '—' })];
}

/** Observações: na preenchida só aparece se houver texto (como no formulário antigo); na em branco, sempre. */
export function observacoes(emBranco: boolean, titulo: string, valor: string | undefined, linhas: number): Bloco[] {
  if (!emBranco && !valor?.trim()) return [];
  return secaoDeTexto(emBranco, titulo, valor, linhas);
}

/** Tabela em branco para preencher à mão (material, bens): grade com linhas altas, sem "—". */
export function tabelaEmBranco(colunas: ColunaTabela[], quantidade: number): Bloco {
  return tabela({
    colunas: colunas.map((c) => ({ ...c, emBranco: true })),
    linhas: Array.from({ length: quantidade }, () => ({})),
    formulario: true,
    alturaMinimaLinha: 6.5,
  });
}

/** "do <SIGLA>"/"do órgão": a sigla vem da identidade do tenant, nunca do código. */
export const doOrgao = (sigla?: string): string => (sigla?.trim() ? `do ${sigla.trim()}` : 'do órgão');

export const subtituloNumero = (d: DadosFormulario<unknown>): string =>
  d.preenchido && d.numero ? `Nº ${d.numero}` : 'Nº ________/________';

export const nomeArquivoFormulario = (base: string, d: DadosFormulario<unknown>): string =>
  d.preenchido ? `${base}_${paraNomeArquivo(d.numero || 'formulario')}.pdf` : `Modelo_${base}.pdf`;

/** Espaço acima da linha de assinatura (o mesmo do bloco `assinaturas`). */
const ESPACO_PARA_ASSINAR = 14;

/**
 * Fecho: local e data e as assinaturas. Na preenchida, o primeiro assinante leva o nome de quem preencheu
 * e o papel embaixo; na em branco, só os papéis.
 */
export function fecho(emBranco: boolean, d: DadosFormulario<unknown>, quemPreenche: string | undefined, papeis: string[]): Bloco[] {
  const assinantes: Assinante[] = papeis.map((papel, i) =>
    i === 0 && !emBranco && quemPreenche?.trim() ? { nome: quemPreenche.trim(), cargo: papel } : { nome: papel },
  );
  // Local, data e assinaturas ficam juntos: se não couberem no resto da página, vão juntos para a seguinte.
  // Linhas: a da data e, embaixo da assinatura, o nome (e o papel, na preenchida).
  const linhas = emBranco ? 2 : 3;
  const manterJunto: Bloco = (ctx) =>
    ctx.garantirEspaco(ESPACO.md + ESPACO.sm + ESPACO_PARA_ASSINAR + ESPACO.sm + linhas * alturaLinha(ctx.fonte.corpo));
  return [
    manterJunto,
    localData({ local: d.local || '_'.repeat(30), data: emBranco || !d.data ? '____/____/________' : d.data }),
    // Três papéis (servidor, chefia, ordenador/almoxarifado/patrimônio) cabem numa fileira, como no formulário antigo.
    assinaturas({ assinantes, porFileira: 3 }),
  ];
}
