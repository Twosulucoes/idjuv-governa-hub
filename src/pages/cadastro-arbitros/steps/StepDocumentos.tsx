import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          <Input value={data.cpf} onChange={e => update('cpf', e.target.value)} placeholder="000.000.000-00" maxLength={14} />
        </div>
        <div className="space-y-2">
          <Label>RG</Label>
          <Input value={data.rg} onChange={e => update('rg', e.target.value)} placeholder="Número do RG" maxLength={20} />
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
        <Input value={data.pis_pasep} onChange={e => update('pis_pasep', e.target.value)} placeholder="Número do PIS/PASEP" maxLength={20} />
      </div>
    </div>
  );
}
