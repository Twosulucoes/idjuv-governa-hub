import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepProfissional({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados Profissionais</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Local de Trabalho</Label>
          <Input value={data.local_trabalho} onChange={e => update('local_trabalho', e.target.value)} placeholder="Onde trabalha atualmente" maxLength={150} />
        </div>
        <div className="space-y-2">
          <Label>Função</Label>
          <Input value={data.funcao} onChange={e => update('funcao', e.target.value)} placeholder="Função exercida" maxLength={100} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Esfera</Label>
        <Select value={data.esfera} onValueChange={v => update('esfera', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="municipal">Municipal</SelectItem>
            <SelectItem value="estadual">Estadual</SelectItem>
            <SelectItem value="federal">Federal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
