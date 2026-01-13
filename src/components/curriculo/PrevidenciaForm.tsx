import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import type { PreCadastro } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function PrevidenciaForm({ dados, onChange }: Props) {
  const handleChange = (field: keyof PreCadastro, value: string) => {
    onChange({ ...dados, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Documentos Previdenciários</h3>
        <p className="text-sm text-muted-foreground">
          Informe seu número de inscrição na Previdência Social.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pis_pasep">NIS / PIS / PASEP *</Label>
          <MaskedInput
            id="pis_pasep"
            mask="pis"
            value={dados.pis_pasep || ""}
            onValueChange={(value) => handleChange("pis_pasep", value)}
            placeholder="000.00000.00-0"
            className="max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Número de Identificação Social (NIS), PIS ou PASEP
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Onde encontrar seu NIS/PIS/PASEP?</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Carteira de Trabalho (CTPS)</li>
            <li>Extrato do FGTS</li>
            <li>Cartão Cidadão</li>
            <li>Comprovante de cadastro no INSS</li>
            <li>Aplicativo FGTS ou Meu INSS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
