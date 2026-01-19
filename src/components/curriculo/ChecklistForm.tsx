import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import type { PreCadastro } from "@/types/preCadastro";
import { DOCUMENTOS_CHECKLIST } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function ChecklistForm({ dados, onChange }: Props) {
  const handleChange = (key: string, checked: boolean) => {
    onChange({ ...dados, [key]: checked });
  };

  const contarMarcados = () => {
    const todas = [
      ...DOCUMENTOS_CHECKLIST.pessoais,
      ...DOCUMENTOS_CHECKLIST.previdenciarios,
      ...DOCUMENTOS_CHECKLIST.escolaridade,
      ...DOCUMENTOS_CHECKLIST.certidoes,
      ...DOCUMENTOS_CHECKLIST.declaracoes,
      ...DOCUMENTOS_CHECKLIST.bancarios,
    ];
    return todas.filter((item) => dados[item.key as keyof PreCadastro]).length;
  };

  const total =
    DOCUMENTOS_CHECKLIST.pessoais.length +
    DOCUMENTOS_CHECKLIST.previdenciarios.length +
    DOCUMENTOS_CHECKLIST.escolaridade.length +
    DOCUMENTOS_CHECKLIST.certidoes.length +
    DOCUMENTOS_CHECKLIST.declaracoes.length +
    DOCUMENTOS_CHECKLIST.bancarios.length;

  const marcados = contarMarcados();
  const progresso = Math.round((marcados / total) * 100);

  const renderSecao = (titulo: string, itens: { key: string; label: string }[]) => {
    // Ordenar itens alfabeticamente pelo label
    const itensOrdenados = [...itens].sort((a, b) => 
      a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })
    );

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-primary border-b pb-2">{titulo}</h4>
        <div className="space-y-2">
          {itensOrdenados.map((item) => (
            <div key={item.key} className="flex items-center space-x-3">
              <Checkbox
                id={item.key}
                checked={!!dados[item.key as keyof PreCadastro]}
                onCheckedChange={(checked) => handleChange(item.key, !!checked)}
              />
              <Label
                htmlFor={item.key}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {item.label}
              </Label>
              {dados[item.key as keyof PreCadastro] ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Checklist de Documentos</h3>
        <p className="text-sm text-muted-foreground">
          Marque os documentos que você já possui ou providenciou.
        </p>
      </div>

      {/* Progresso */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progresso da documentação</span>
          <Badge variant={progresso === 100 ? "default" : "secondary"}>
            {marcados}/{total} documentos
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {progresso === 100
            ? "✅ Todos os documentos marcados!"
            : `${progresso}% concluído`}
        </p>
      </div>

      <div className="grid gap-6">
        {renderSecao("Documentos Pessoais", DOCUMENTOS_CHECKLIST.pessoais)}
        {renderSecao("Documentos Previdenciários", DOCUMENTOS_CHECKLIST.previdenciarios)}
        {renderSecao("Escolaridade / Habilitação", DOCUMENTOS_CHECKLIST.escolaridade)}
        {renderSecao("Certidões", DOCUMENTOS_CHECKLIST.certidoes)}
        {renderSecao("Declarações", DOCUMENTOS_CHECKLIST.declaracoes)}
        {renderSecao("Dados Bancários", DOCUMENTOS_CHECKLIST.bancarios)}
      </div>

      <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Importante:</strong> Você deverá apresentar os documentos originais ou cópias
          autenticadas no momento da admissão. Este checklist serve para acompanhamento.
        </p>
      </div>
    </div>
  );
}
