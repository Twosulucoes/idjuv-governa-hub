import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepDocumentos({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Documentos</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>CPF *</Label>
          <MaskedInput mask="cpf" value={data.cpf} onChange={v => update('cpf', v)} />
        </div>
        <div className="space-y-2">
          <Label>RG</Label>
          <MaskedInput mask="rg" value={data.rg} onChange={v => update('rg', v)} />
        </div>
      </div>

      {data.nacionalidade === 'estrangeira' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>RNE</Label>
            <Input value={data.rne} onChange={e => update('rne', e.target.value)} placeholder="Registro Nacional de Estrangeiro" maxLength={20} />
          </div>
          <div className="space-y-2">
            <Label>Validade RNE</Label>
            <Input type="date" value={data.validade_rne} onChange={e => update('validade_rne', e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>PIS / PASEP</Label>
        <MaskedInput mask="pis" value={data.pis_pasep} onChange={v => update('pis_pasep', v)} />
      </div>
    </div>
  );
}
