/**
 * Formulários administrativos (termo de demanda, ordem de missão, relatório de viagem, requisição de material
 * e termo de responsabilidade patrimonial) pelo motor único (`src/lib/documentos/modelos/formularios/`).
 * Cada função gera o formulário preenchido com os dados da tela ou, sem dados, o modelo em branco.
 */
import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DadosFormulario } from '@/lib/documentos/modelos/formularios/comum';
import type { OrdemMissaoPreenchida } from '@/lib/documentos/modelos/formularios/ordemMissao';
import type { RelatorioViagemPreenchido } from '@/lib/documentos/modelos/formularios/relatorioViagem';
import type { RequisicaoMaterialPreenchida } from '@/lib/documentos/modelos/formularios/requisicaoMaterial';
import type { TermoDemandaPreenchido } from '@/lib/documentos/modelos/formularios/termoDemanda';
import type { TermoResponsabilidadePreenchido } from '@/lib/documentos/modelos/formularios/termoResponsabilidade';

/** Número do formulário: prefixo + 4 dígitos aleatórios + ano (ex.: "TD1234/2026"). Não é numeração oficial. */
export const numeroDoFormulario = (prefixo: string): string => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefixo}${random}/${new Date().getFullYear()}`;
};

/** Local, data e sigla vêm da identidade do tenant; sem `preenchido`, o formulário sai em branco. */
function envelope<T>(preenchido?: T, numero?: string): DadosFormulario<T> {
  return {
    preenchido,
    numero,
    local: localDaSede(),
    data: preenchido ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : undefined,
    siglaOrgao: getTenantSnapshot().identidade.sigla?.trim() || undefined,
  };
}

export const baixarTermoDemanda = async (dados?: TermoDemandaPreenchido, numero?: string): Promise<void> =>
  baixarDocumento(await emitirDocumento('formularios-termo-demanda', envelope(dados, numero)));

export const baixarOrdemMissao = async (dados?: OrdemMissaoPreenchida, numero?: string): Promise<void> =>
  baixarDocumento(await emitirDocumento('formularios-ordem-missao', envelope(dados, numero)));

export const baixarRelatorioViagem = async (dados?: RelatorioViagemPreenchido, numero?: string): Promise<void> =>
  baixarDocumento(await emitirDocumento('formularios-relatorio-viagem', envelope(dados, numero)));

export const baixarRequisicaoMaterial = async (dados?: RequisicaoMaterialPreenchida, numero?: string): Promise<void> =>
  baixarDocumento(await emitirDocumento('formularios-requisicao-material', envelope(dados, numero)));

export const baixarTermoResponsabilidade = async (dados?: TermoResponsabilidadePreenchido, numero?: string): Promise<void> =>
  baixarDocumento(await emitirDocumento('formularios-termo-responsabilidade', envelope(dados, numero)));
