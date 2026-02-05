import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeletorDocumentoVinculo } from "./SeletorDocumentoVinculo";
import { Link2, Building2 } from "lucide-react";
import {
  VinculoExternoEsfera,
  VinculoExternoSituacao,
  VinculoExternoForma,
  VINCULO_EXTERNO_ESFERA_LABELS,
  VINCULO_EXTERNO_SITUACAO_LABELS,
  VINCULO_EXTERNO_FORMA_LABELS,
} from "@/types/rh";

export interface SegundoVinculoData {
  possui_vinculo_externo: boolean;
  vinculo_externo_esfera: string;
  vinculo_externo_orgao: string;
  vinculo_externo_cargo: string;
  vinculo_externo_matricula: string;
  vinculo_externo_situacao: string;
  vinculo_externo_forma: string;
  vinculo_externo_ato_id: string | null;
  vinculo_externo_observacoes: string;
}

interface SegundoVinculoSectionProps {
  data: SegundoVinculoData;
  onChange: (field: keyof SegundoVinculoData, value: string | boolean | null) => void;
  disabled?: boolean;
}

export function SegundoVinculoSection({
  data,
  onChange,
  disabled = false,
}: SegundoVinculoSectionProps) {
  const requiresDocument =
    data.vinculo_externo_forma === "cessao" ||
    data.vinculo_externo_forma === "requisicao" ||
    data.vinculo_externo_forma === "licenca";

  return (
    <div className="space-y-4">
      {/* Toggle Principal */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="possui_vinculo_externo"
          checked={data.possui_vinculo_externo}
          onCheckedChange={(v) => onChange("possui_vinculo_externo", v as boolean)}
          disabled={disabled}
        />
        <Label htmlFor="possui_vinculo_externo" className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Possui vínculo efetivo em outro órgão
        </Label>
      </div>

      {data.possui_vinculo_externo && (
        <div className="ml-6 space-y-4 p-4 border rounded-lg bg-muted/20">
          {/* Esfera e Órgão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Esfera do Vínculo</Label>
              <Select
                value={data.vinculo_externo_esfera}
                onValueChange={(v) => onChange("vinculo_externo_esfera", v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a esfera" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VINCULO_EXTERNO_ESFERA_LABELS) as VinculoExternoEsfera[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {VINCULO_EXTERNO_ESFERA_LABELS[key]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Órgão de Origem</Label>
              <Input
                value={data.vinculo_externo_orgao}
                onChange={(e) => onChange("vinculo_externo_orgao", e.target.value.toUpperCase())}
                placeholder="Ex: RECEITA FEDERAL DO BRASIL"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Cargo e Matrícula */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cargo Efetivo no Órgão</Label>
              <Input
                value={data.vinculo_externo_cargo}
                onChange={(e) => onChange("vinculo_externo_cargo", e.target.value.toUpperCase())}
                placeholder="Ex: AUDITOR FISCAL"
                disabled={disabled}
              />
            </div>
            <div>
              <Label>Matrícula no Órgão</Label>
              <Input
                value={data.vinculo_externo_matricula}
                onChange={(e) => onChange("vinculo_externo_matricula", e.target.value)}
                placeholder="Opcional"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Situação no Órgão */}
          <div>
            <Label>Situação no Órgão de Origem</Label>
            <Select
              value={data.vinculo_externo_situacao}
              onValueChange={(v) => onChange("vinculo_externo_situacao", v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VINCULO_EXTERNO_SITUACAO_LABELS) as VinculoExternoSituacao[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {VINCULO_EXTERNO_SITUACAO_LABELS[key]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Forma do Vínculo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Forma do Vínculo no IDJuv
              </Label>
            </div>

            <Select
              value={data.vinculo_externo_forma}
              onValueChange={(v) => onChange("vinculo_externo_forma", v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Como este servidor está vinculado ao IDJuv?" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VINCULO_EXTERNO_FORMA_LABELS) as VinculoExternoForma[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {VINCULO_EXTERNO_FORMA_LABELS[key]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {/* Seletor de Documento - quando necessário */}
            {requiresDocument && (
              <div className="space-y-2">
                <Label className="text-sm">
                  Documento/Ato Formal{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <SeletorDocumentoVinculo
                  value={data.vinculo_externo_ato_id}
                  onChange={(v) => onChange("vinculo_externo_ato_id", v)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Vincule a portaria de cessão, requisição ou licença da Central de Portarias.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Observações */}
          <div>
            <Label>Observações sobre o Vínculo</Label>
            <Textarea
              value={data.vinculo_externo_observacoes}
              onChange={(e) => onChange("vinculo_externo_observacoes", e.target.value)}
              placeholder="Informações adicionais sobre o vínculo externo..."
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
