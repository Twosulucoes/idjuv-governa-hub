import type jsPDF from 'jspdf';

export type Familia = 'ato' | 'relatorio' | 'ficha' | 'comprovante';
export type Orientacao = 'retrato' | 'paisagem';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LogoImpressao {
  dataUrl: string;
  /** Dimensões originais (px); só a proporção importa. */
  largura: number;
  altura: number;
  formato: 'PNG' | 'JPEG';
}

/** Identidade impressa. Vem do tenant (ver `marca.ts`); o núcleo nunca a lê sozinho. */
export interface MarcaImpressao {
  nomeOrgao: string;
  entidadeSuperior?: string;
  nomeSistema: string;
  corPrimaria: RGB;
  logoOrgao?: LogoImpressao;
  logoEntidadeSuperior?: LogoImpressao;
  /** Endereço impresso no rodapé de todas as páginas (vem do perfil do tenant). */
  enderecoRodape?: string;
}

export interface Emissao {
  emitidoPor?: string;
  emitidoEm: Date;
}

/** Estado de escrita compartilhado pelos blocos. Todas as medidas em mm. */
export interface ContextoDocumento {
  doc: jsPDF;
  marca: MarcaImpressao;
  orientacao: Orientacao;
  familia: Familia;
  fonteCorpo: 'times' | 'helvetica';
  esquerda: number;
  largura: number;
  larguraPagina: number;
  alturaPagina: number;
  /** Y máximo do conteúdo (acima do rodapé). */
  limiteInferior: number;
  /** Cursor vertical: topo do próximo elemento. */
  y: number;
  novaPagina(): void;
  /** Abre nova página se `altura` não couber no que resta. */
  garantirEspaco(altura: number): void;
}

export type Bloco = (ctx: ContextoDocumento) => void;

export interface DocumentoModelo<D> {
  tipo: string;
  familia: Familia;
  titulo(dados: D): string;
  /** Imprime o título exatamente como veio (padrão: caixa alta). Atos com sigla oficial em caixa mista, como "IDJuv". */
  tituloComoEscrito?: boolean;
  subtitulo?(dados: D): string | undefined;
  /** Padrão da família quando omitido. */
  orientacao?: Orientacao;
  protocolo?(dados: D): string | undefined;
  /** Até 2 linhas abaixo do nome do órgão (diretoria, divisão…). Dado do documento, não do código. */
  unidadeEmissora?(dados: D): string[];
  blocos(dados: D): Bloco[];
  nomeArquivo(dados: D): string;
}
