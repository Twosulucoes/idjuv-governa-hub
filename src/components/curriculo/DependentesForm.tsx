import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { MaskedInput } from "@/components/ui/masked-input";
import { Trash2, Plus, User } from "lucide-react";
import type { PreCadastro, Dependente } from "@/types/preCadastro";
import { PARENTESCOS } from "@/types/preCadastro";
import { formatDateBR } from "@/lib/formatters";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

const DEPENDENTE_VAZIO: Dependente = {
  nome: "",
  cpf: "",
  data_nascimento: "",
  parentesco: "",
  sexo: "",
  certidao_tipo: "",
  termo_guarda: false,
  declarar_ir: false,
  declarar_previdencia: false,
  pcd: false,
  pcd_tipo: "",
  universitario: false,
  salario_familia: false,
};

export function DependentesForm({ dados, onChange }: Props) {
  const [novoDependente, setNovoDependente] = useState<Dependente>({ ...DEPENDENTE_VAZIO });

  const dependentes = (dados.dependentes || []) as Dependente[];

  const adicionarDependente = () => {
    if (novoDependente.nome && novoDependente.cpf && novoDependente.parentesco) {
      onChange({ ...dados, dependentes: [...dependentes, novoDependente] });
      setNovoDependente({ ...DEPENDENTE_VAZIO });
    }
  };

  const removerDependente = (index: number) => {
    onChange({ ...dados, dependentes: dependentes.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Dependentes</h3>
        <p className="text-sm text-muted-foreground">
          Informe os dependentes para fins de dedução de Imposto de Renda (se houver).
        </p>
      </div>

      <div className="grid gap-4">
        {/* Lista de dependentes cadastrados */}
        {dependentes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Dependentes cadastrados ({dependentes.length})</h4>
            {dependentes.map((dep, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{dep.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {dep.parentesco} • CPF: {dep.cpf} {dep.sexo ? `• ${dep.sexo === "M" ? "Masc." : "Fem."}` : ""}
                        </p>
                        {dep.data_nascimento && (
                          <p className="text-xs text-muted-foreground">
                            Nascimento: {formatDateBR(dep.data_nascimento)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dep.declarar_ir && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">IR</span>}
                          {dep.declarar_previdencia && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Previdência</span>}
                          {dep.salario_familia && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Sal. Família</span>}
                          {dep.pcd && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">PCD{dep.pcd_tipo ? `: ${dep.pcd_tipo}` : ""}</span>}
                          {dep.universitario && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Universitário</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removerDependente(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Formulário para adicionar dependente */}
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium text-sm">Adicionar Dependente</h4>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dep_nome">Nome Completo *</Label>
                <Input
                  id="dep_nome"
                  value={novoDependente.nome}
                  onChange={(e) =>
                    setNovoDependente({ ...novoDependente, nome: e.target.value.toUpperCase() })
                  }
                  placeholder="Nome do dependente"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dep_cpf">CPF *</Label>
                  <MaskedInput
                    id="dep_cpf"
                    mask="cpf"
                    value={novoDependente.cpf}
                    onChange={(value) =>
                      setNovoDependente({ ...novoDependente, cpf: value })
                    }
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dep_nascimento">Data de Nascimento</Label>
                  <Input
                    id="dep_nascimento"
                    type="date"
                    value={novoDependente.data_nascimento}
                    onChange={(e) =>
                      setNovoDependente({ ...novoDependente, data_nascimento: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dep_sexo">Sexo</Label>
                  <Select
                    value={novoDependente.sexo || ""}
                    onValueChange={(value) =>
                      setNovoDependente({ ...novoDependente, sexo: value })
                    }
                  >
                    <SelectTrigger id="dep_sexo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dep_parentesco">Grau de Parentesco *</Label>
                  <Select
                    value={novoDependente.parentesco}
                    onValueChange={(value) =>
                      setNovoDependente({ ...novoDependente, parentesco: value })
                    }
                  >
                    <SelectTrigger id="dep_parentesco">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARENTESCOS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dep_certidao">Tipo de Certidão</Label>
                  <Select
                    value={novoDependente.certidao_tipo || ""}
                    onValueChange={(value) =>
                      setNovoDependente({ ...novoDependente, certidao_tipo: value })
                    }
                  >
                    <SelectTrigger id="dep_certidao">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nascimento">Certidão de Nascimento</SelectItem>
                      <SelectItem value="casamento">Certidão de Casamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Declarações SEGAD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dep_ir"
                    checked={novoDependente.declarar_ir}
                    onCheckedChange={(checked) =>
                      setNovoDependente({ ...novoDependente, declarar_ir: !!checked })
                    }
                  />
                  <Label htmlFor="dep_ir" className="text-sm font-normal">
                    Declarar para fins de IR
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dep_previdencia"
                    checked={novoDependente.declarar_previdencia}
                    onCheckedChange={(checked) =>
                      setNovoDependente({ ...novoDependente, declarar_previdencia: !!checked })
                    }
                  />
                  <Label htmlFor="dep_previdencia" className="text-sm font-normal">
                    Declarar para fins previdenciários
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dep_salario_familia"
                    checked={novoDependente.salario_familia}
                    onCheckedChange={(checked) =>
                      setNovoDependente({ ...novoDependente, salario_familia: !!checked })
                    }
                  />
                  <Label htmlFor="dep_salario_familia" className="text-sm font-normal">
                    Dependente para salário família
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dep_pcd"
                    checked={novoDependente.pcd}
                    onCheckedChange={(checked) =>
                      setNovoDependente({ ...novoDependente, pcd: !!checked, pcd_tipo: !checked ? "" : novoDependente.pcd_tipo })
                    }
                  />
                  <Label htmlFor="dep_pcd" className="text-sm font-normal">
                    Pessoa com Deficiência (PCD)
                  </Label>
                </div>

                {novoDependente.pcd && (
                  <div className="grid gap-2">
                    <Label htmlFor="dep_pcd_tipo">Tipo de PCD</Label>
                    <Select
                      value={novoDependente.pcd_tipo || ""}
                      onValueChange={(value) =>
                        setNovoDependente({ ...novoDependente, pcd_tipo: value })
                      }
                    >
                      <SelectTrigger id="dep_pcd_tipo">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Física">Física</SelectItem>
                        <SelectItem value="Auditiva">Auditiva</SelectItem>
                        <SelectItem value="Visual">Visual</SelectItem>
                        <SelectItem value="Intelectual">Intelectual</SelectItem>
                        <SelectItem value="Múltipla">Múltipla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dep_universitario"
                    checked={novoDependente.universitario}
                    onCheckedChange={(checked) =>
                      setNovoDependente({ ...novoDependente, universitario: !!checked })
                    }
                  />
                  <Label htmlFor="dep_universitario" className="text-sm font-normal">
                    É universitário(a)
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dep_guarda"
                  checked={novoDependente.termo_guarda}
                  onCheckedChange={(checked) =>
                    setNovoDependente({ ...novoDependente, termo_guarda: !!checked })
                  }
                />
                <Label htmlFor="dep_guarda" className="text-sm font-normal">
                  Possui Termo de Guarda/Tutela
                </Label>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={adicionarDependente}
                disabled={!novoDependente.nome || !novoDependente.cpf || !novoDependente.parentesco}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dependente
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Quem pode ser dependente para IR?</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Cônjuge ou companheiro(a)</li>
            <li>Filhos ou enteados até 21 anos (ou até 24 anos se universitário)</li>
            <li>Filhos ou enteados de qualquer idade se incapacitados</li>
            <li>Menor sob guarda judicial</li>
            <li>Pais, avós e bisavós (se dependentes economicamente)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
