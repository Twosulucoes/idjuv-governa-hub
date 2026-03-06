import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/ui/masked-input';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepContato({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contato</h3>

      <div className="space-y-2">
        <Label>E-mail *</Label>
        <Input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="seu@email.com" maxLength={150} />
      </div>

      <div className="space-y-2">
        <Label>Celular *</Label>
        <MaskedInput mask="telefone" value={data.celular} onChange={v => update('celular', v)} />
      </div>
    </div>
  );
}
