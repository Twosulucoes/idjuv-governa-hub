/**
 * Trilha das etapas do modelo de fluxo: feita, atual e a fazer, com unidade e prazo.
 */
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { StatusBadge } from '@/components/design-system';
import { cn } from '@/lib/utils';
import { rotuloSituacaoPrazo, tomStatusDoSemaforo } from '@/lib/workflow/semaforoPrazo';
import type { ModeloProcessoCompleto, ProcessoAcompanhamento } from '@/types/workflow';

interface TrilhaEtapasProps {
  /** Modelo do processo; nulo/indefinido = processo antigo, sem modelo de fluxo */
  modelo: ModeloProcessoCompleto | null | undefined;
  processo: ProcessoAcompanhamento;
}

export function TrilhaEtapas({ modelo, processo }: TrilhaEtapasProps) {
  if (!processo.modelo_id || !modelo) {
    return <p className="text-body text-muted-foreground">Processo sem modelo de fluxo.</p>;
  }

  const atual = processo.etapa_atual_ordem ?? 0;
  const encerrado = processo.status === 'concluido' || processo.status === 'arquivado';
  const prazo = rotuloSituacaoPrazo(processo.situacao_prazo);

  return (
    <ol className="space-y-3" aria-label="Etapas do processo">
      {modelo.etapas.map((etapa) => {
        const feita = processo.status === 'concluido' ? etapa.ordem <= atual : etapa.ordem < atual;
        const ehAtual = !feita && etapa.ordem === atual;
        const Icone = feita ? CheckCircle2 : ehAtual ? CircleDot : Circle;
        const estado = feita ? 'Feita' : ehAtual ? 'Etapa atual' : 'A fazer';
        // a view resolve a unidade só da etapa atual; nas demais vale a sigla do modelo
        const unidade = ehAtual ? processo.unidade_sigla ?? etapa.unidade_sigla : etapa.unidade_sigla;
        return (
          <li
            key={etapa.id}
            aria-current={ehAtual ? 'step' : undefined}
            className={cn('flex items-start gap-3 rounded-lg border p-3', ehAtual && 'border-primary bg-primary/5')}
          >
            <Icone
              className={cn('mt-0.5 h-5 w-5 shrink-0', feita ? 'text-success' : ehAtual ? 'text-primary' : 'text-muted-foreground')}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {etapa.ordem}. {etapa.nome}
              </p>
              <p className="text-caption text-muted-foreground">
                {unidade}
                {etapa.responsavel_rotulo ? ` • ${etapa.responsavel_rotulo}` : ''}
                {' • '}
                {etapa.prazo_dias_uteis != null ? `Prazo: ${etapa.prazo_dias_uteis} dia(s) útil(eis)` : 'Sem prazo'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-caption text-muted-foreground">{estado}</span>
              {ehAtual && !encerrado && processo.situacao_prazo !== 'sem_prazo' && (
                <StatusBadge tom={tomStatusDoSemaforo(prazo.tom)}>{prazo.texto}</StatusBadge>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
