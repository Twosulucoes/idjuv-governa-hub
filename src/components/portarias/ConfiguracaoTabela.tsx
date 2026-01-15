import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  ConfiguracaoTabela as ConfigTabela,
  ColunaTabela,
  ColunaPersonalizada,
  COLUNA_LABELS,
  COLUNAS_PADRAO,
} from '@/types/portariaUnificada';

interface ConfiguracaoTabelaProps {
  config: ConfigTabela;
  onChange: (config: ConfigTabela) => void;
}

export function ConfiguracaoTabela({ config, onChange }: ConfiguracaoTabelaProps) {
  const colunasDisponiveis: ColunaTabela[] = [
    'numero',
    'nome_completo',
    'cpf',
    'matricula',
    'cargo',
    'unidade_setor',
    'codigo',
  ];

  const handleToggleHabilitada = (checked: boolean) => {
    onChange({
      ...config,
      habilitada: checked,
      colunas: checked ? COLUNAS_PADRAO : [],
    });
  };

  const handleToggleColuna = (coluna: ColunaTabela, checked: boolean) => {
    if (checked) {
      // Adicionar coluna mantendo a ordem
      const novasColunas = colunasDisponiveis.filter(
        (c) => config.colunas.includes(c) || c === coluna
      );
      onChange({ ...config, colunas: novasColunas });
    } else {
      onChange({ ...config, colunas: config.colunas.filter((c) => c !== coluna) });
    }
  };

  const handleAddColunaPersonalizada = () => {
    const novaColuna: ColunaPersonalizada = {
      id: crypto.randomUUID(),
      titulo: 'Nova Coluna',
      tipo: 'texto',
    };
    onChange({
      ...config,
      colunasPersonalizadas: [...config.colunasPersonalizadas, novaColuna],
    });
  };

  const handleRemoveColunaPersonalizada = (id: string) => {
    onChange({
      ...config,
      colunasPersonalizadas: config.colunasPersonalizadas.filter((c) => c.id !== id),
    });
  };

  const handleUpdateColunaPersonalizada = (
    id: string,
    field: keyof ColunaPersonalizada,
    value: string
  ) => {
    onChange({
      ...config,
      colunasPersonalizadas: config.colunasPersonalizadas.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tabela de Servidores</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="tabela-habilitada" className="text-sm">
              Incluir tabela no documento
            </Label>
            <Switch
              id="tabela-habilitada"
              checked={config.habilitada}
              onCheckedChange={handleToggleHabilitada}
            />
          </div>
        </div>
      </CardHeader>

      {config.habilitada && (
        <CardContent className="space-y-4">
          {/* Colunas padrão */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Colunas da Tabela</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {colunasDisponiveis.map((coluna) => (
                <div key={coluna} className="flex items-center space-x-2">
                  <Checkbox
                    id={`coluna-${coluna}`}
                    checked={config.colunas.includes(coluna)}
                    onCheckedChange={(checked) =>
                      handleToggleColuna(coluna, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`coluna-${coluna}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {COLUNA_LABELS[coluna]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Colunas personalizadas */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Colunas Personalizadas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColunaPersonalizada}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {config.colunasPersonalizadas.length > 0 ? (
              <div className="space-y-2">
                {config.colunasPersonalizadas.map((coluna) => (
                  <div key={coluna.id} className="flex items-center gap-2">
                    <Input
                      value={coluna.titulo}
                      onChange={(e) =>
                        handleUpdateColunaPersonalizada(coluna.id, 'titulo', e.target.value)
                      }
                      placeholder="Título da coluna"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveColunaPersonalizada(coluna.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma coluna personalizada
              </p>
            )}
          </div>

          {/* Preview da ordem das colunas */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-2 block">Prévia das Colunas</Label>
            <div className="flex flex-wrap gap-1">
              {config.colunas.map((coluna, index) => (
                <span
                  key={coluna}
                  className="px-2 py-1 bg-muted rounded text-xs font-medium"
                >
                  {index + 1}. {COLUNA_LABELS[coluna]}
                </span>
              ))}
              {config.colunasPersonalizadas.map((coluna, index) => (
                <span
                  key={coluna.id}
                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
                >
                  {config.colunas.length + index + 1}. {coluna.titulo}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
