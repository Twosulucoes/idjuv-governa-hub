import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trophy } from 'lucide-react';
import type { ArbitroFormData } from '../CadastroArbitroPage';

interface Props {
  data: ArbitroFormData;
  onEdit: (step: number) => void;
}

const LABELS: Record<string, string> = {
  nome: 'Nome', nacionalidade: 'Nacionalidade', sexo: 'Sexo', data_nascimento: 'Data Nasc.',
  tipo_sanguineo: 'Tipo Sanguíneo', fator_rh: 'Fator RH',
  cpf: 'CPF', rg: 'RG', rne: 'RNE', validade_rne: 'Val. RNE', pis_pasep: 'PIS/PASEP',
  cep: 'CEP', endereco: 'Endereço', complemento: 'Complemento', bairro: 'Bairro',
  cidade: 'Cidade', uf: 'UF', email: 'E-mail', celular: 'Celular',
  local_trabalho: 'Local de Trabalho', funcao: 'Função', esfera: 'Esfera',
  banco: 'Banco', agencia: 'Agência', conta_corrente: 'Conta Corrente',
};

const SECTIONS = [
  { title: 'Dados Pessoais', step: 0, fields: ['nome', 'nacionalidade', 'sexo', 'data_nascimento', 'tipo_sanguineo', 'fator_rh'] },
  { title: 'Documentos', step: 1, fields: ['cpf', 'rg', 'rne', 'validade_rne', 'pis_pasep'] },
  { title: 'Endereço', step: 2, fields: ['cep', 'endereco', 'complemento', 'bairro', 'cidade', 'uf'] },
  { title: 'Contato', step: 3, fields: ['email', 'celular'] },
  { title: 'Profissional', step: 5, fields: ['local_trabalho', 'funcao', 'esfera'] },
  { title: 'Bancário', step: 6, fields: ['banco', 'agencia', 'conta_corrente'] },
];

function formatValue(key: string, val: string): string {
  if (!val) return '—';
  if (key === 'sexo') return val === 'M' ? 'Masculino' : 'Feminino';
  if (key === 'nacionalidade') return val === 'brasileira' ? 'Brasileira' : 'Estrangeira';
  if (key === 'fator_rh') return val === '+' ? 'Positivo (+)' : 'Negativo (-)';
  if (key === 'esfera') return val.charAt(0).toUpperCase() + val.slice(1);
  return val;
}

export function StepRevisao({ data, onEdit }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Revisão dos Dados</h3>
      <p className="text-sm text-muted-foreground">Confira todos os dados antes de enviar. Clique no lápis para editar uma seção.</p>

      {SECTIONS.map(section => (
        <div key={section.title} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">{section.title}</h4>
            <Button variant="ghost" size="sm" onClick={() => onEdit(section.step)} className="h-7 text-xs gap-1">
              <Pencil className="h-3 w-3" /> Editar
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {section.fields.map(field => {
              const val = (data as any)[field];
              if (!val && field !== 'nome') return null;
              return (
                <div key={field} className="text-sm">
                  <span className="text-muted-foreground">{LABELS[field]}: </span>
                  <span className="font-medium">{formatValue(field, val)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modalidades */}
      <div className="border-2 border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Modalidades ({data.modalidades.length})
          </h4>
          <Button variant="ghost" size="sm" onClick={() => onEdit(4)} className="h-7 text-xs gap-1">
            <Pencil className="h-3 w-3" /> Editar
          </Button>
        </div>
        {data.modalidades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma modalidade selecionada</p>
        ) : (
          <div className="space-y-2">
            {data.modalidades.map((mod, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {mod.categoria === 'estadual' ? '🏅 Estadual' : '🏆 Nacional'}
                </Badge>
                <span className="text-sm font-medium">{mod.modalidade}</span>
                {mod.documentos_urls.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {mod.documentos_urls.length} doc(s)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Foto */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Foto e Documentos</h4>
          <Button variant="ghost" size="sm" onClick={() => onEdit(7)} className="h-7 text-xs gap-1">
            <Pencil className="h-3 w-3" /> Editar
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {data.foto_url ? (
            <img src={data.foto_url} alt="Foto" className="w-16 h-16 rounded-lg object-cover border" />
          ) : (
            <span className="text-sm text-muted-foreground">Nenhuma foto enviada</span>
          )}
          <span className="text-sm text-muted-foreground">
            {data.documentos_urls.length > 0 ? `${data.documentos_urls.length} documento(s) anexado(s)` : 'Nenhum documento anexado'}
          </span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800">
          ⚠️ Revise com atenção. Após o envio, os dados não poderão ser alterados por este formulário.
        </p>
      </div>
    </div>
  );
}