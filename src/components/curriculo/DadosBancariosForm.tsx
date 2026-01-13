import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PreCadastro } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

const BANCOS = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "033", nome: "Santander" },
  { codigo: "341", nome: "Itaú Unibanco" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "745", nome: "Citibank" },
  { codigo: "422", nome: "Safra" },
  { codigo: "070", nome: "BRB" },
  { codigo: "756", nome: "Sicoob" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "077", nome: "Inter" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "212", nome: "Original" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "290", nome: "PagBank" },
  { codigo: "380", nome: "PicPay" },
];

export function DadosBancariosForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
  };

  const handleBancoChange = (codigo: string) => {
    const banco = BANCOS.find((b) => b.codigo === codigo);
    onChange({
      ...dados,
      banco_codigo: codigo,
      banco_nome: banco?.nome || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Dados Bancários</h3>
        <p className="text-sm text-muted-foreground">
          Informe os dados da conta para crédito de remuneração.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="banco">Banco *</Label>
          <Select value={dados.banco_codigo || ""} onValueChange={handleBancoChange}>
            <SelectTrigger id="banco">
              <SelectValue placeholder="Selecione o banco" />
            </SelectTrigger>
            <SelectContent>
              {BANCOS.map((banco) => (
                <SelectItem key={banco.codigo} value={banco.codigo}>
                  {banco.codigo} - {banco.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="banco_agencia">Agência *</Label>
            <Input
              id="banco_agencia"
              value={dados.banco_agencia || ""}
              onChange={(e) => handleChange("banco_agencia", e.target.value)}
              placeholder="0000"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">Sem dígito verificador</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="banco_conta">Conta *</Label>
            <Input
              id="banco_conta"
              value={dados.banco_conta || ""}
              onChange={(e) => handleChange("banco_conta", e.target.value)}
              placeholder="00000-0"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">Com dígito verificador</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="banco_tipo_conta">Tipo de Conta *</Label>
          <Select
            value={dados.banco_tipo_conta || ""}
            onValueChange={(value) => handleChange("banco_tipo_conta", value)}
          >
            <SelectTrigger id="banco_tipo_conta">
              <SelectValue placeholder="Selecione o tipo de conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corrente">Conta Corrente</SelectItem>
              <SelectItem value="poupanca">Conta Poupança</SelectItem>
              <SelectItem value="salario">Conta Salário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Informações Importantes</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>A conta deve estar em seu nome (titular)</li>
            <li>Preferencialmente conta corrente</li>
            <li>Não são aceitas contas conjuntas</li>
            <li>Será necessário apresentar comprovante de conta (extrato ou cartão)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
