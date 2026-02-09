import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PreCadastro } from "@/types/preCadastro";
import { ESCOLARIDADES, CATEGORIAS_CNH, UFS } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function EscolaridadeForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string | number) => {
    onChange({ ...dados, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Escolaridade e Habilitação</h3>
        <p className="text-sm text-muted-foreground">
          Informe sua formação acadêmica e habilitações profissionais.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Formação Acadêmica */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Formação Acadêmica</h4>

          <div className="grid gap-2">
            <Label htmlFor="escolaridade">Escolaridade *</Label>
            <Select
              value={dados.escolaridade || ""}
              onValueChange={(value) => handleChange("escolaridade", value)}
            >
              <SelectTrigger id="escolaridade">
                <SelectValue placeholder="Selecione sua escolaridade" />
              </SelectTrigger>
              <SelectContent>
                {ESCOLARIDADES.map((esc) => (
                  <SelectItem key={esc} value={esc}>
                    {esc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="formacao_academica">Curso / Formação</Label>
            <Input
              id="formacao_academica"
              value={dados.formacao_academica || ""}
              onChange={(e) => handleChange("formacao_academica", e.target.value.toUpperCase())}
              placeholder="Ex: Administração, Direito, Educação Física..."
              className="uppercase"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="instituicao_ensino">Instituição de Ensino</Label>
              <Input
                id="instituicao_ensino"
                value={dados.instituicao_ensino || ""}
                onChange={(e) => handleChange("instituicao_ensino", e.target.value.toUpperCase())}
                placeholder="Nome da instituição"
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ano_conclusao">Ano de Conclusão</Label>
              <Input
                id="ano_conclusao"
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={dados.ano_conclusao || ""}
                onChange={(e) => handleChange("ano_conclusao", parseInt(e.target.value) || 0)}
                placeholder="Ano"
              />
            </div>
          </div>
        </div>

        {/* Primeiro Emprego (SEGAD) */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Primeiro Emprego</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ano_inicio_primeiro_emprego">Ano Início do Primeiro Emprego</Label>
              <Input
                id="ano_inicio_primeiro_emprego"
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={dados.ano_inicio_primeiro_emprego || ""}
                onChange={(e) => handleChange("ano_inicio_primeiro_emprego", parseInt(e.target.value) || 0)}
                placeholder="Ano"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ano_fim_primeiro_emprego">Ano Fim do Primeiro Emprego</Label>
              <Input
                id="ano_fim_primeiro_emprego"
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={dados.ano_fim_primeiro_emprego || ""}
                onChange={(e) => handleChange("ano_fim_primeiro_emprego", parseInt(e.target.value) || 0)}
                placeholder="Ano"
              />
            </div>
          </div>
        </div>
        {/* Registro Profissional */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Registro em Conselho Profissional</h4>
          <p className="text-xs text-muted-foreground">
            Preencha se sua profissão exige registro em conselho (CREF, OAB, CRM, etc.)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="registro_conselho">Conselho</Label>
              <Input
                id="registro_conselho"
                value={dados.registro_conselho || ""}
                onChange={(e) => handleChange("registro_conselho", e.target.value.toUpperCase())}
                placeholder="Ex: CREF, OAB, CRM..."
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conselho_numero">Número do Registro</Label>
              <Input
                id="conselho_numero"
                value={dados.conselho_numero || ""}
                onChange={(e) => handleChange("conselho_numero", e.target.value.toUpperCase())}
                placeholder="Número"
              />
            </div>
          </div>
        </div>

        {/* CNH */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Carteira Nacional de Habilitação (CNH)</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cnh_numero">Número da CNH</Label>
              <Input
                id="cnh_numero"
                value={dados.cnh_numero || ""}
                onChange={(e) => handleChange("cnh_numero", e.target.value)}
                placeholder="00000000000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnh_categoria">Categoria</Label>
              <Select
                value={dados.cnh_categoria || ""}
                onValueChange={(value) => handleChange("cnh_categoria", value)}
              >
                <SelectTrigger id="cnh_categoria">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_CNH.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnh_uf">UF</Label>
              <Select
                value={dados.cnh_uf || ""}
                onValueChange={(value) => handleChange("cnh_uf", value)}
              >
                <SelectTrigger id="cnh_uf">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cnh_data_expedicao">Data de Expedição</Label>
              <Input
                id="cnh_data_expedicao"
                type="date"
                value={dados.cnh_data_expedicao || ""}
                onChange={(e) => handleChange("cnh_data_expedicao", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnh_primeira_habilitacao">Data da 1ª Habilitação</Label>
              <Input
                id="cnh_primeira_habilitacao"
                type="date"
                value={dados.cnh_primeira_habilitacao || ""}
                onChange={(e) => handleChange("cnh_primeira_habilitacao", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnh_validade">Data de Validade</Label>
              <Input
                id="cnh_validade"
                type="date"
                value={dados.cnh_validade || ""}
                onChange={(e) => handleChange("cnh_validade", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
