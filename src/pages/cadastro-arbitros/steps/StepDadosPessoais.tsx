import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MODALIDADES_ESPORTIVAS } from '../modalidadesEsportivas';
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

      <div className="space-y-2">
        <Label>Data de Nascimento *</Label>
        <Input type="date" value={data.data_nascimento} onChange={e => update('data_nascimento', e.target.value)} className="max-w-xs" />
      </div>

      {/* Categoria e Modalidade em destaque */}
      <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Categoria do Árbitro *</Label>
          <p className="text-xs text-muted-foreground">Selecione a categoria de atuação</p>
          <div className="flex gap-3">
            {[
              { value: 'estadual', label: '🏅 Árbitro Estadual' },
              { value: 'nacional', label: '🏆 Árbitro Nacional' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('categoria', opt.value)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all
                  ${data.categoria === opt.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Modalidade Esportiva *</Label>
          <p className="text-xs text-muted-foreground">Selecione a modalidade de atuação</p>
          <Select value={data.modalidade} onValueChange={v => update('modalidade', v)}>
            <SelectTrigger className="border-primary/30 bg-background">
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {MODALIDADES_ESPORTIVAS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
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
