/**
 * Checklist do processo: itens das etapas já alcançadas; obrigatórios com selo. A marcação vai pela RPC wf_marcar_item.
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/design-system';
import { useMarcarItem } from '@/hooks/useAcompanhamentoProcessos';
import type { ItemChecklistModelo, RespostaChecklist } from '@/types/workflow';

interface ChecklistEtapaProps {
  processoId: string;
  itens: ItemChecklistModelo[];
  respostas: RespostaChecklist[];
  /** Etapa atual do processo; só aparecem os itens até ela */
  etapaAtual: number;
  /** false = sem permissão workflow.tramitar ou processo fora de andamento */
  podeMarcar: boolean;
}

export function ChecklistEtapa({ processoId, itens, respostas, etapaAtual, podeMarcar }: ChecklistEtapaProps) {
  const marcar = useMarcarItem();
  const visiveis = itens.filter((i) => i.etapa_ordem <= etapaAtual);

  if (visiveis.length === 0) {
    return <p className="text-body text-muted-foreground">Nenhum item de checklist até esta etapa.</p>;
  }

  const marcados = new Set(respostas.filter((r) => r.marcado).map((r) => r.item_id));
  const etapas = Array.from(new Set(visiveis.map((i) => i.etapa_ordem))).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {etapas.map((ordem) => (
        <fieldset key={ordem} className="space-y-2">
          <legend className="text-body font-medium">
            Etapa {ordem}
            {ordem === etapaAtual ? ' (atual)' : ''}
          </legend>
          {visiveis
            .filter((i) => i.etapa_ordem === ordem)
            .map((item) => {
              const idCampo = `item-${item.id}`;
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    id={idCampo}
                    checked={marcados.has(item.id)}
                    disabled={!podeMarcar || marcar.isPending}
                    onCheckedChange={(v) =>
                      marcar.mutate({ processoId, itemCodigo: item.codigo, marcado: v === true })
                    }
                  />
                  <Label htmlFor={idCampo} className="flex-1 cursor-pointer font-normal leading-snug">
                    {item.descricao}
                  </Label>
                  {item.obrigatorio && <StatusBadge tom="pendente">Obrigatório</StatusBadge>}
                </div>
              );
            })}
        </fieldset>
      ))}
    </div>
  );
}
