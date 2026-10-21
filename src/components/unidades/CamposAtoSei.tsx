import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CamposSei } from "@/lib/registroSei";

interface CamposAtoSeiProps {
  valores: CamposSei;
  onChange: (valores: CamposSei) => void;
  /** Rótulo do número do ato (ex.: "Número do termo no SEI"). */
  rotuloNumero: string;
  /** Prefixo dos ids dos campos, para não repetir id entre formulários na mesma tela. */
  idPrefixo: string;
}

/**
 * Campos do ciclo de um ato feito no SEI: processo, número do ato, assinatura e DOE. Todos
 * opcionais: sem o número, o registro fica "aguardando SEI" e é completado depois, na edição.
 */
export function CamposAtoSei({ valores, onChange, rotuloNumero, idPrefixo }: CamposAtoSeiProps) {
  const set = (campo: keyof CamposSei) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...valores, [campo]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefixo}-processo-sei`}>Processo SEI</Label>
          <Input
            id={`${idPrefixo}-processo-sei`}
            value={valores.processoSei}
            onChange={set("processoSei")}
            placeholder="Número do processo no SEI"
            maxLength={60}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefixo}-numero`}>{rotuloNumero}</Label>
          <Input
            id={`${idPrefixo}-numero`}
            value={valores.numero}
            onChange={set("numero")}
            placeholder="Em branco se ainda não saiu"
            maxLength={30}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefixo}-assinatura`}>Data da assinatura</Label>
          <Input
            id={`${idPrefixo}-assinatura`}
            type="date"
            value={valores.dataAssinatura}
            onChange={set("dataAssinatura")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefixo}-doe-numero`}>Nº do DOE</Label>
          <Input
            id={`${idPrefixo}-doe-numero`}
            value={valores.doeNumero}
            onChange={set("doeNumero")}
            placeholder="Se já publicado"
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefixo}-doe-data`}>Data do DOE</Label>
          <Input
            id={`${idPrefixo}-doe-data`}
            type="date"
            value={valores.doeData}
            onChange={set("doeData")}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        O ato é feito e assinado no SEI. Sem o número, o registro fica "Aguardando SEI" e pode ser completado depois.
      </p>
    </div>
  );
}
