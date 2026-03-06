import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  update: (field: keyof ArbitroFormData, value: any) => void;
}

export function StepDadosPessoais({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados Pessoais</h3>

      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input value={data.nome} onChange={e => update('nome', e.target.value)} placeholder="Nome completo do árbitro" maxLength={150} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nacionalidade *</Label>
          <Select value={data.nacionalidade} onValueChange={v => update('nacionalidade', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="brasileira">Brasileira</SelectItem>
              <SelectItem value="estrangeira">Estrangeira</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sexo *</Label>
          <Select value={data.sexo} onValueChange={v => update('sexo', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input type="date" value={data.data_nascimento} onChange={e => update('data_nascimento', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={data.categoria} onValueChange={v => update('categoria', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="estadual">Estadual</SelectItem>
              <SelectItem value="nacional">Nacional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo Sanguíneo</Label>
          <Select value={data.tipo_sanguineo} onValueChange={v => update('tipo_sanguineo', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {['A', 'B', 'AB', 'O'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fator RH</Label>
          <Select value={data.fator_rh} onValueChange={v => update('fator_rh', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="+">Positivo (+)</SelectItem>
              <SelectItem value="-">Negativo (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
