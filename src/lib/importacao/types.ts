/**
 * ESTRUTURA GENÉRICA DE IMPORTAÇÃO DE DADOS
 *
 * Todo importador segue o mesmo fluxo, conduzido pelo ImportacaoWizard:
 *
 *   1. ler      arquivo → linhas normalizadas + avisos/erros de leitura (no navegador)
 *   2. simular  o banco compara com o que já existe e diz o que vai mudar (nada é gravado)
 *   3. aplicar  grava tudo numa transação e registra o log em `importacoes`
 *
 * A permissão é conferida na tela (para esconder o importador) e de novo no banco,
 * dentro da RPC do importador — a tela é só UX.
 *
 * Para criar um importador novo: implemente `Importador` em `importadores/` e
 * registre-o em `registro.ts`. Detalhes em docs/GUIA_FRONTEND.md (Importação de dados).
 */

import type { Modulo } from "@/shared/config/modules.config";

export type GravidadeProblema = "erro" | "aviso";

export interface ProblemaLeitura {
  gravidade: GravidadeProblema;
  mensagem: string;
  /** Índice da linha (em `linhas`) a que o problema se refere, quando houver */
  linha?: number;
}

export interface ResultadoLeitura<TLinha> {
  linhas: TLinha[];
  problemas: ProblemaLeitura[];
  /** Dados de cabeçalho do arquivo, exibidos na pré-visualização (rótulo → valor) */
  cabecalho: Record<string, string>;
  /** Parâmetros que acompanham as linhas até o banco (ex.: exercício) */
  parametros: Record<string, unknown>;
}

export type AcaoLinha = "inserir" | "atualizar" | "sem_alteracao";

export interface ResultadoLinhaBanco {
  indice: number;
  acao: AcaoLinha;
  /** campo → [antes, depois] */
  mudancas?: Record<string, [unknown, unknown]>;
}

/** Resposta padronizada das RPCs de importação (simulação e aplicação). */
export interface ResultadoBanco {
  simulacao: boolean;
  importacao_id?: string | null;
  linhas: ResultadoLinhaBanco[];
  /** Cadastros auxiliares criados (ou que seriam criados) — rótulo → itens */
  criados?: Record<string, string[]>;
  /** Registros que existem no banco no escopo do arquivo mas não vieram nele */
  ausentes?: string[];
  totais: Record<AcaoLinha, number>;
}

export interface MetadadosArquivo {
  nome: string;
  tamanho: number;
  sha256: string;
}

export interface ColunaPreview<TLinha> {
  id: string;
  rotulo: string;
  valor: (linha: TLinha) => string;
  alinhamento?: "direita";
}

export interface Importador<TLinha = unknown> {
  /** Identificador estável; é gravado em `importacoes.tipo` */
  id: string;
  titulo: string;
  descricao: string;
  /** Módulo dono dos dados; decide quem lê o histórico */
  modulo: Modulo;
  /** Permissão exigida (a RPC confere a mesma) */
  permissao: string;
  /** Valor do atributo `accept` do input de arquivo */
  aceita: string;
  /** Texto curto sobre de onde tirar o arquivo */
  instrucoes: string;
  colunas: ColunaPreview<TLinha>[];
  /** Nome legível dos campos que a RPC devolve em `mudancas` (coluna do banco → rótulo) */
  rotulosCampos?: Record<string, string>;
  ler: (arquivo: File) => Promise<ResultadoLeitura<TLinha>>;
  /** Envia as linhas ao banco; com `simular` nada é gravado */
  enviar: (
    leitura: ResultadoLeitura<TLinha>,
    arquivo: MetadadosArquivo,
    simular: boolean,
  ) => Promise<ResultadoBanco>;
  /** Query keys do React Query a invalidar depois de aplicar */
  invalidar?: unknown[][];
}
