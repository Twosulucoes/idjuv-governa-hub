import type jsPDF from 'jspdf';

/** Atos formais (portaria, memorando, termo…) não são família: são feitos no SEI. */
export type Familia = 'relatorio' | 'ficha' | 'comprovante';
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
}

export type EscalaLetra = 'compacto' | 'normal' | 'grande';

/** Tamanhos de letra (pt) de uma escala. */
export interface EscalaFonte {
  titulo: number;
  secao: number;
  corpo: number;
  tabela: number;
  rotulo: number;
  rodape: number;
}

/**
 * Padronização configurada na tela (Configuração do cliente → Impressão de documentos).
 * Vale para todos os documentos; o núcleo recebe pronta (ver `estiloDoTenant`).
 */
export interface EstiloImpressao {
  escala: EscalaLetra;
  /** Linhas alternadas com fundo nas tabelas. */
  zebra: boolean;
  /** "Emitido por Fulano em…" no rodapé; sem ele, só a data. */
  mostrarEmissor: boolean;
  /** `automatica` respeita o modelo (ou a família); as outras forçam todos os documentos. */
  orientacao: 'automatica' | Orientacao;
  /** Linha extra abaixo do nome do órgão, na 1ª página. */
  linhaCabecalho?: string;
  /** Texto livre no rodapé, ao lado do nome do sistema (endereço, aviso…). */
  textoRodape?: string;
}

export interface Emissao {
  emitidoPor?: string;
  emitidoEm: Date;
}

/** Estado de escrita compartilhado pelos blocos. Todas as medidas em mm. */
export interface ContextoDocumento {
  doc: jsPDF;
  marca: MarcaImpressao;
  estilo: EstiloImpressao;
  /** Tamanhos de letra da escala escolhida no estilo. */
  fonte: EscalaFonte;
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
  subtitulo?(dados: D): string | undefined;
  /** Padrão da família quando omitido. */
  orientacao?: Orientacao;
  protocolo?(dados: D): string | undefined;
  /** Até 2 linhas abaixo do nome do órgão (diretoria, divisão…). Dado do documento, não do código. */
  unidadeEmissora?(dados: D): string[];
  blocos(dados: D): Bloco[];
  nomeArquivo(dados: D): string;
}
