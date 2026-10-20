/**
 * PDFs da reunião: lista de convocados, lista de presença e relatório da reunião. O desenho é do
 * motor único (`@/lib/documentos`, modelos em `documentos/modelos/reunioes/reunioes.ts`); aqui ficam
 * só as funções usadas pela tela (`RelatoriosReuniaoDialog`).
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { ParticipanteReuniao, ReuniaoImpressa } from '@/lib/documentos/modelos/reunioes/reunioes';

/** Gera a lista de convocados da reunião. */
export async function gerarPdfListaConvocados(reuniao: ReuniaoImpressa, participantes: ParticipanteReuniao[]): Promise<void> {
  baixarDocumento(await emitirDocumento('reunioes-lista-convocados', { reuniao, participantes }));
}

/** Gera a lista de presença, com espaço para cada participante assinar e a assinatura do responsável. */
export async function gerarPdfListaPresenca(reuniao: ReuniaoImpressa, participantes: ParticipanteReuniao[]): Promise<void> {
  // Local da assinatura: cidade/UF da sede do órgão (perfil do tenant + dados oficiais do banco).
  const endereco = getTenantSnapshot().endereco;
  const local = [endereco?.cidade, endereco?.uf].filter((p) => p && p.trim()).join(' - ');
  const data = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  baixarDocumento(await emitirDocumento('reunioes-lista-presenca', { reuniao, participantes, local, data }));
}

/** Gera o relatório completo da reunião (dados, presentes, pauta e ata). */
export async function gerarPdfRelatorioReuniao(reuniao: ReuniaoImpressa, participantes: ParticipanteReuniao[]): Promise<void> {
  baixarDocumento(await emitirDocumento('reunioes-relatorio', { reuniao, participantes }));
}
