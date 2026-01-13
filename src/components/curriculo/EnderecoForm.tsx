import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaskedInput } from "@/components/ui/masked-input";
import type { PreCadastro } from "@/types/preCadastro";
import { UFS } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function EnderecoForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Endereço</h3>
        <p className="text-sm text-muted-foreground">
          Informe seu endereço residencial completo.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="endereco_cep">CEP *</Label>
          <MaskedInput
            id="endereco_cep"
            mask="cep"
            value={dados.endereco_cep || ""}
            onValueChange={(value) => handleChange("endereco_cep", value)}
            placeholder="00000-000"
            className="max-w-[180px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="endereco_logradouro">Logradouro *</Label>
            <Input
              id="endereco_logradouro"
              value={dados.endereco_logradouro || ""}
              onChange={(e) => handleChange("endereco_logradouro", e.target.value.toUpperCase())}
              placeholder="Rua, Avenida, etc."
              className="uppercase"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endereco_numero">Número *</Label>
            <Input
              id="endereco_numero"
              value={dados.endereco_numero || ""}
              onChange={(e) => handleChange("endereco_numero", e.target.value)}
              placeholder="Nº"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="endereco_complemento">Complemento</Label>
            <Input
              id="endereco_complemento"
              value={dados.endereco_complemento || ""}
              onChange={(e) => handleChange("endereco_complemento", e.target.value.toUpperCase())}
              placeholder="Apto, Bloco, etc."
              className="uppercase"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endereco_bairro">Bairro *</Label>
            <Input
              id="endereco_bairro"
              value={dados.endereco_bairro || ""}
              onChange={(e) => handleChange("endereco_bairro", e.target.value.toUpperCase())}
              placeholder="Bairro"
              className="uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="endereco_cidade">Cidade *</Label>
            <Input
              id="endereco_cidade"
              value={dados.endereco_cidade || ""}
              onChange={(e) => handleChange("endereco_cidade", e.target.value.toUpperCase())}
              placeholder="Cidade"
              className="uppercase"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endereco_uf">Estado (UF) *</Label>
            <Select
              value={dados.endereco_uf || ""}
              onValueChange={(value) => handleChange("endereco_uf", value)}
            >
              <SelectTrigger id="endereco_uf">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
