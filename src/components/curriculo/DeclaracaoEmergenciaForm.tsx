import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MaskedInput } from "@/components/ui/masked-input";
import type { PreCadastro } from "@/types/preCadastro";
import { PARENTESCOS } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function DeclaracaoEmergenciaForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string | boolean) => {
    onChange({ ...dados, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Declarações e Contato de Emergência</h3>
        <p className="text-sm text-muted-foreground">
          Informe sobre acumulação de cargos e contato de emergência.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Acumulação de Cargos */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Declaração de Acumulação de Cargos</h4>
          <p className="text-xs text-muted-foreground">
            Art. 37, XVI da Constituição Federal - É vedada a acumulação remunerada de cargos públicos, exceto quando houver compatibilidade de horários.
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acumula_cargo"
              checked={dados.acumula_cargo === true}
              onCheckedChange={(checked) => handleChange("acumula_cargo", checked === true)}
            />
            <Label htmlFor="acumula_cargo" className="text-sm font-normal">
              Declaro que possuo outro(s) cargo(s)/emprego(s) público(s)
            </Label>
          </div>

          {dados.acumula_cargo === true && (
            <div className="grid gap-2">
              <Label htmlFor="acumulo_descricao">Descreva o(s) cargo(s) acumulado(s)</Label>
              <Textarea
                id="acumulo_descricao"
                value={dados.acumulo_descricao || ""}
                onChange={(e) => handleChange("acumulo_descricao", e.target.value)}
                placeholder="Informe o cargo, órgão, carga horária e horário de trabalho do(s) outro(s) vínculo(s) público(s)..."
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Indicação */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Indicação</h4>
          <div className="grid gap-2">
            <Label htmlFor="indicacao">Indicado por (se aplicável)</Label>
            <Input
              id="indicacao"
              value={dados.indicacao || ""}
              onChange={(e) => handleChange("indicacao", e.target.value.toUpperCase())}
              placeholder="Nome de quem indicou"
              className="uppercase"
            />
          </div>
        </div>

        {/* Contato de Emergência */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Contato de Emergência</h4>
          <p className="text-xs text-muted-foreground">
            Informe uma pessoa para contato em caso de emergência.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contato_emergencia_nome">Nome do Contato</Label>
              <Input
                id="contato_emergencia_nome"
                value={dados.contato_emergencia_nome || ""}
                onChange={(e) => handleChange("contato_emergencia_nome", e.target.value.toUpperCase())}
                placeholder="Nome completo"
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone_emergencia">Telefone de Emergência</Label>
              <MaskedInput
                id="telefone_emergencia"
                mask="telefone"
                value={dados.telefone_emergencia || ""}
                onChange={(value) => handleChange("telefone_emergencia", value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contato_emergencia_parentesco">Parentesco/Relação</Label>
            <Select
              value={dados.contato_emergencia_parentesco || ""}
              onValueChange={(value) => handleChange("contato_emergencia_parentesco", value)}
            >
              <SelectTrigger id="contato_emergencia_parentesco">
                <SelectValue placeholder="Selecione o parentesco" />
              </SelectTrigger>
              <SelectContent>
                {PARENTESCOS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
                <SelectItem value="Amigo(a)">Amigo(a)</SelectItem>
                <SelectItem value="Vizinho(a)">Vizinho(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
