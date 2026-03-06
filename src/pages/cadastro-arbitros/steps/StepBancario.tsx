import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepBancario({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados Bancários</h3>
      <p className="text-sm text-muted-foreground">Informações opcionais para pagamento de diárias.</p>

      <div className="space-y-2">
        <Label>Banco</Label>
        <Input value={data.banco} onChange={e => update('banco', e.target.value)} placeholder="Nome do banco" maxLength={100} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Agência</Label>
          <Input value={data.agencia} onChange={e => update('agencia', e.target.value)} placeholder="0000" maxLength={10} />
        </div>
        <div className="space-y-2">
          <Label>Conta Corrente</Label>
          <Input value={data.conta_corrente} onChange={e => update('conta_corrente', e.target.value)} placeholder="00000-0" maxLength={20} />
        </div>
      </div>
    </div>
  );
}
