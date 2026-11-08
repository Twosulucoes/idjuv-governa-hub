/**
 * Campos do bem imóvel (categoria "Imóvel"): RIP, matrícula no cartório, cartório e área.
 * Usado no "Novo bem" e na edição do bem (colunas da migração 20261125100000).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DadosImovel {
  rip: string;
  matricula_imovel: string;
  cartorio_imovel: string;
  area_m2: string;
}

export const IMOVEL_VAZIO: DadosImovel = { rip: "", matricula_imovel: "", cartorio_imovel: "", area_m2: "" };

/** Converte o formulário para as colunas do banco (vazio vira nulo). */
export function imovelParaBanco(d: DadosImovel) {
  const area = Number.parseFloat(d.area_m2.replace(",", "."));
  return {
    rip: d.rip.trim() || null,
    matricula_imovel: d.matricula_imovel.trim() || null,
    cartorio_imovel: d.cartorio_imovel.trim() || null,
    area_m2: Number.isFinite(area) && area > 0 ? area : null,
  };
}

export function CamposImovel({ valor, aoMudar }: { valor: DadosImovel; aoMudar: (v: DadosImovel) => void }) {
  return (
    <fieldset className="grid gap-4 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-medium">Dados do imóvel</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="imovel-rip">RIP</Label>
          <Input
            id="imovel-rip"
            value={valor.rip}
            maxLength={40}
            placeholder="Registro Imobiliário Patrimonial"
            onChange={(e) => aoMudar({ ...valor, rip: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imovel-area">Área (m²)</Label>
          <Input
            id="imovel-area"
            inputMode="decimal"
            value={valor.area_m2}
            onChange={(e) => aoMudar({ ...valor, area_m2: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imovel-matricula">Matrícula</Label>
          <Input
            id="imovel-matricula"
            value={valor.matricula_imovel}
            maxLength={40}
            placeholder="Nº da matrícula no cartório"
            onChange={(e) => aoMudar({ ...valor, matricula_imovel: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imovel-cartorio">Cartório</Label>
          <Input
            id="imovel-cartorio"
            value={valor.cartorio_imovel}
            maxLength={150}
            placeholder="Cartório de registro de imóveis"
            onChange={(e) => aoMudar({ ...valor, cartorio_imovel: e.target.value })}
          />
        </div>
      </div>
    </fieldset>
  );
}
