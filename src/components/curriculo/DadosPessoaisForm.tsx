import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaskedInput } from "@/components/ui/masked-input";
import type { PreCadastro } from "@/types/preCadastro";
import { ESTADOS_CIVIS, UFS } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function DadosPessoaisForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Dados Pessoais</h3>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados pessoais básicos.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            value={dados.nome_completo || ""}
            onChange={(e) => handleChange("nome_completo", e.target.value.toUpperCase())}
            placeholder="Digite seu nome completo"
            className="uppercase"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nome_social">Nome Social (se aplicável)</Label>
          <Input
            id="nome_social"
            value={dados.nome_social || ""}
            onChange={(e) => handleChange("nome_social", e.target.value.toUpperCase())}
            placeholder="Digite seu nome social"
            className="uppercase"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={dados.data_nascimento || ""}
              onChange={(e) => handleChange("data_nascimento", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sexo">Sexo *</Label>
            <Select
              value={dados.sexo || ""}
              onValueChange={(value) => handleChange("sexo", value)}
            >
              <SelectTrigger id="sexo">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
                <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="estado_civil">Estado Civil *</Label>
            <Select
              value={dados.estado_civil || ""}
              onValueChange={(value) => handleChange("estado_civil", value)}
            >
              <SelectTrigger id="estado_civil">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_CIVIS.map((ec) => (
                  <SelectItem key={ec} value={ec}>
                    {ec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nacionalidade">Nacionalidade</Label>
            <Input
              id="nacionalidade"
              value={dados.nacionalidade || "Brasileira"}
              onChange={(e) => handleChange("nacionalidade", e.target.value)}
              placeholder="Nacionalidade"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="naturalidade_cidade">Cidade de Nascimento</Label>
            <Input
              id="naturalidade_cidade"
              value={dados.naturalidade_cidade || ""}
              onChange={(e) => handleChange("naturalidade_cidade", e.target.value.toUpperCase())}
              placeholder="Cidade"
              className="uppercase"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="naturalidade_uf">UF</Label>
            <Select
              value={dados.naturalidade_uf || ""}
              onValueChange={(value) => handleChange("naturalidade_uf", value)}
            >
              <SelectTrigger id="naturalidade_uf">
                <SelectValue placeholder="UF" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={dados.email || ""}
              onChange={(e) => handleChange("email", e.target.value.toLowerCase())}
              placeholder="seu@email.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone_celular">Telefone Celular *</Label>
            <MaskedInput
              id="telefone_celular"
              mask="telefone"
              value={dados.telefone_celular || ""}
              onChange={(value) => handleChange("telefone_celular", value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="telefone_fixo">Telefone Fixo (opcional)</Label>
          <MaskedInput
            id="telefone_fixo"
            mask="telefone"
            value={dados.telefone_fixo || ""}
            onChange={(value) => handleChange("telefone_fixo", value)}
            placeholder="(00) 0000-0000"
          />
        </div>
      </div>
    </div>
  );
}
