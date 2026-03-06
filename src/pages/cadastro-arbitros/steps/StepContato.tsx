import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>DDD</Label>
          <Input value={data.ddd} onChange={e => update('ddd', e.target.value)} placeholder="95" maxLength={3} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Celular *</Label>
          <Input value={data.celular} onChange={e => update('celular', e.target.value)} placeholder="00000-0000" maxLength={10} />
        </div>
      </div>
    </div>
  );
}
