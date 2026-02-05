import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MODALIDADES_ESPORTIVAS } from "@/types/unidadesLocais";
import { X } from "lucide-react";

interface ModalidadesSelectorProps {
  value: string[];
  onChange: (modalidades: string[]) => void;
  disabled?: boolean;
}

export function ModalidadesSelector({ value, onChange, disabled = false }: ModalidadesSelectorProps) {
  const handleToggle = (modalidade: string) => {
    if (disabled) return;
    
    if (value.includes(modalidade)) {
      onChange(value.filter(m => m !== modalidade));
    } else {
      onChange([...value, modalidade]);
    }
  };

  const handleRemove = (modalidade: string) => {
    if (disabled) return;
    onChange(value.filter(m => m !== modalidade));
  };

  return (
    <div className="space-y-3">
      <Label>Modalidades Esportivas *</Label>
      
      {/* Badges das modalidades selecionadas */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md">
          {value.map((modalidade) => (
            <Badge 
              key={modalidade} 
              variant="secondary" 
              className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleRemove(modalidade)}
            >
              {modalidade}
              {!disabled && <X className="h-3 w-3" />}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Grid de checkboxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
        {MODALIDADES_ESPORTIVAS.map((modalidade) => (
          <div 
            key={modalidade} 
            className="flex items-center space-x-2"
          >
            <Checkbox
              id={`mod-${modalidade}`}
              checked={value.includes(modalidade)}
              onCheckedChange={() => handleToggle(modalidade)}
              disabled={disabled}
            />
            <label
              htmlFor={`mod-${modalidade}`}
              className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {modalidade}
            </label>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Selecione uma ou mais modalidades ({value.length} selecionada{value.length !== 1 ? 's' : ''})
      </p>
    </div>
  );
}