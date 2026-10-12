/**
 * Fachada de compatibilidade das portarias: mesmas funções e parâmetros de antes, agora
 * desenhadas pelo modelo `portaria` de src/lib/documentos/ (padrão único de impressão).
 * Passaram a ser assíncronas (os logos do tenant carregam de forma assíncrona).
 * Ver docs/PADRAO_DOCUMENTOS.md.
 */
import type jsPDF from 'jspdf';
import { getTenantSnapshot } from '@/core/tenant';
import type { Artigo, ConfiguracaoAssinatura, ConfiguracaoTabela } from '@/types/portariaUnificada';
import { emitirDocumento } from './documentos';
import {
  dadosColetiva, dadosDesignacao, dadosExoneracao, dadosNomeacao, dadosUnificada,
} from './documentos/modelos/portaria/construtores';
import type { DadosPortariaModelo } from './documentos/modelos/portaria/modelo';
import type { ServidorTabela } from './documentos/modelos/portaria/tabelaServidores';

type Portaria = { numero: string; data_documento: string; ementa?: string; conteudo?: string };
type Servidor = { nome_completo: string; cpf: string; matricula?: string };
type Cargo = { nome: string; sigla?: string; simbolo?: string };
type Unidade = { nome: string; sigla?: string };

const gerar = async (dados: DadosPortariaModelo): Promise<jsPDF> => (await emitirDocumento('portaria', dados)).doc;

export const generatePortariaUnificadaPdf = (
  portaria: { numero: string; data_documento: string }, preambulo: string, artigos: Artigo[],
  servidores: ServidorTabela[], configTabela: ConfiguracaoTabela, assinatura: ConfiguracaoAssinatura,
): Promise<jsPDF> => gerar(dadosUnificada(getTenantSnapshot(), portaria, preambulo, artigos, servidores, configTabela, assinatura));

export const generatePortariaColetivaComTabela = (
  portaria: { numero: string; data_documento: string }, cabecalho: string, servidores: ServidorTabela[],
  tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao',
): Promise<jsPDF> => gerar(dadosColetiva(getTenantSnapshot(), portaria, cabecalho, servidores, tipoAcao));

/** `unidade`, `tipoNomeacao` e `dataEfeitos` eram aceitos e nunca usados no texto; mantidos só pela assinatura. */
export const generatePortariaNomeacao = (
  portaria: Portaria, servidor: Servidor, cargo: Cargo, _unidade: Unidade,
  _tipoNomeacao: 'comissionado' | 'efetivo' = 'comissionado', _dataEfeitos?: string,
): Promise<jsPDF> => gerar(dadosNomeacao(getTenantSnapshot(), portaria, servidor, cargo));

export const generatePortariaExoneracao = (
  portaria: Portaria, servidor: Servidor, cargo: Cargo, unidade: Unidade, motivo: 'pedido' | 'oficio' = 'pedido',
): Promise<jsPDF> => gerar(dadosExoneracao(getTenantSnapshot(), portaria, servidor, cargo, unidade, motivo));

/** `dataInicio` e `dataFim` eram aceitos e nunca usados no texto; mantidos só pela assinatura. */
export const generatePortariaDesignacao = (
  portaria: Portaria, servidor: Servidor, cargo: Cargo, unidadeOrigem: Unidade, unidadeDestino: Unidade,
  _dataInicio: string, _dataFim?: string,
): Promise<jsPDF> => gerar(dadosDesignacao(getTenantSnapshot(), portaria, servidor, cargo, unidadeOrigem, unidadeDestino));
