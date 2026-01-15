import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CAMPOS_POR_CATEGORIA,
  CAMPO_LABELS,
  TIPOS_LICENCA,
  OPCOES_ONUS,
} from '@/types/portariaUnificada';

interface CamposDinamicosProps {
  categoria: string;
  valores: Record<string, any>;
  onChange: (campo: string, valor: any) => void;
}

export function CamposDinamicos({ categoria, valores, onChange }: CamposDinamicosProps) {
  const campos = CAMPOS_POR_CATEGORIA[categoria] || [];

  // Buscar cargos
  const { data: cargos = [] } = useQuery({
    queryKey: ['cargos-campos-dinamicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cargos')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: campos.includes('cargo_id'),
  });

  // Buscar unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades-campos-dinamicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: campos.some((c) =>
      ['unidade_id', 'unidade_origem_id', 'unidade_destino_id'].includes(c)
    ),
  });

  if (campos.length === 0) {
    return null;
  }

  const renderCampo = (campo: string) => {
    const label = CAMPO_LABELS[campo] || campo;

    switch (campo) {
      case 'cargo_id':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Select
              value={valores[campo] || ''}
              onValueChange={(value) => onChange(campo, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {cargos.map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.id}>
                    {cargo.sigla ? `${cargo.sigla} - ${cargo.nome}` : cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'unidade_id':
      case 'unidade_origem_id':
      case 'unidade_destino_id':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Select
              value={valores[campo] || ''}
              onValueChange={(value) => onChange(campo, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'data_inicio':
      case 'data_fim':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Input
              type="date"
              value={valores[campo] || ''}
              onChange={(e) => onChange(campo, e.target.value)}
            />
          </div>
        );

      case 'tipo_licenca':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Select
              value={valores[campo] || ''}
              onValueChange={(value) => onChange(campo, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_LICENCA.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'dias_ferias':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={valores[campo] || ''}
              onChange={(e) => onChange(campo, parseInt(e.target.value) || '')}
              placeholder="Ex: 30"
            />
          </div>
        );

      case 'exercicio':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={valores[campo] || new Date().getFullYear()}
              onChange={(e) => onChange(campo, parseInt(e.target.value) || '')}
            />
          </div>
        );

      case 'orgao_cessionario':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Input
              value={valores[campo] || ''}
              onChange={(e) => onChange(campo, e.target.value)}
              placeholder="Nome do órgão cessionário"
            />
          </div>
        );

      case 'onus':
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Select
              value={valores[campo] || ''}
              onValueChange={(value) => onChange(campo, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ônus" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_ONUS.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={campo} className="space-y-2">
            <Label>{label}</Label>
            <Input
              value={valores[campo] || ''}
              onChange={(e) => onChange(campo, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campos.map(renderCampo)}
      </div>
    </div>
  );
}
