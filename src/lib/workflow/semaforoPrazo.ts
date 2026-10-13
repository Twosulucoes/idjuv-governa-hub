import type { SituacaoPrazo } from '@/types/workflow';

export type TomSemaforo = 'sucesso' | 'alerta' | 'perigo' | 'neutro';

const ROTULOS: Record<SituacaoPrazo, { texto: string; tom: TomSemaforo }> = {
  em_dia: { texto: 'Em dia', tom: 'sucesso' },
  vence_logo: { texto: 'Vence em breve', tom: 'alerta' },
  vencido: { texto: 'Vencido', tom: 'perigo' },
  sem_prazo: { texto: 'Sem prazo', tom: 'neutro' },
};

/** Texto e tom do semáforo do prazo da etapa (a situação vem calculada pela view no banco). */
export function rotuloSituacaoPrazo(s: SituacaoPrazo): { texto: string; tom: TomSemaforo } {
  return ROTULOS[s] ?? ROTULOS.sem_prazo;
}
