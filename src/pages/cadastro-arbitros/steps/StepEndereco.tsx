import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaskedInput } from '@/components/ui/masked-input';
import type { ArbitroFormData } from '../CadastroArbitroPage';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepEndereco({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Endereço</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>CEP</Label>
          <MaskedInput mask="cep" value={data.cep} onChange={v => update('cep', v)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input value={data.endereco} onChange={e => update('endereco', e.target.value)} placeholder="Rua, Av, Travessa..." maxLength={200} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Complemento</Label>
          <Input value={data.complemento} onChange={e => update('complemento', e.target.value)} placeholder="Apto, Bloco..." maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input value={data.bairro} onChange={e => update('bairro', e.target.value)} placeholder="Bairro" maxLength={100} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={data.cidade} onChange={e => update('cidade', e.target.value)} placeholder="Cidade" maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>UF</Label>
          <Select value={data.uf} onValueChange={v => update('uf', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
