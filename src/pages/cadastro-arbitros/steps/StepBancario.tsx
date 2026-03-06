import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/ui/masked-input';
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
          <MaskedInput mask="agencia" value={data.agencia} onChange={v => update('agencia', v)} />
        </div>
        <div className="space-y-2">
          <Label>Conta Corrente</Label>
          <MaskedInput mask="conta" value={data.conta_corrente} onChange={v => update('conta_corrente', v)} />
        </div>
      </div>
    </div>
  );
}
