import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserPlus } from "lucide-react";
import { formatCPF } from "@/lib/formatters";
import type { PreCadastro } from "@/types/preCadastro";
import type { TipoServidor } from "@/types/servidor";
import { REGRAS_TIPO_SERVIDOR } from "@/types/servidor";
import { VinculoFuncionalForm, useVinculoFuncionalValidation } from "@/components/rh/VinculoFuncionalForm";

interface ConversaoServidorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preCadastro: PreCadastro | null;
  onConverter: (dados: {
    preCadastroId: string;
    tipoServidor: TipoServidor;
    cargoId?: string;
    unidadeId: string;
    dataAdmissao: string;
  }) => Promise<{ servidorId: string } | undefined>;
  isConverting?: boolean;
}

export function ConversaoServidorDialog({
  open,
  onOpenChange,
  preCadastro,
  onConverter,
  isConverting = false,
}: ConversaoServidorDialogProps) {
  const navigate = useNavigate();
  const [tipoServidor, setTipoServidor] = useState<TipoServidor | "">("");
  const [cargoId, setCargoId] = useState<string>("");
  const [unidadeId, setUnidadeId] = useState<string>("");
  const [dataAdmissao, setDataAdmissao] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Usar hook de validação do componente reutilizável
  const { isValid } = useVinculoFuncionalValidation({
    tipoServidor,
    cargoId,
    unidadeId,
    dataAdmissao,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTipoServidor("");
      setCargoId("");
      setUnidadeId("");
      setDataAdmissao(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  const handleConverter = async () => {
    if (!preCadastro || !tipoServidor || !unidadeId) return;

    const regras = REGRAS_TIPO_SERVIDOR[tipoServidor as TipoServidor];
    if (regras.permiteCargo && !cargoId) return;

    const result = await onConverter({
      preCadastroId: preCadastro.id,
      tipoServidor: tipoServidor as TipoServidor,
      cargoId: cargoId || undefined,
      unidadeId,
      dataAdmissao,
    });

    if (result?.servidorId) {
      onOpenChange(false);
      navigate(`/rh/servidores/${result.servidorId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Converter em Servidor
          </DialogTitle>
          <DialogDescription>
            Transforme este pré-cadastro em um servidor ativo no sistema.
          </DialogDescription>
        </DialogHeader>

        {preCadastro && (
          <div className="space-y-4">
            {/* Dados do Candidato */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                Dados do Candidato
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{preCadastro.nome_completo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{formatCPF(preCadastro.cpf)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-mail:</span>
                  <p className="font-medium">{preCadastro.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Código:</span>
                  <Badge variant="outline" className="font-mono">
                    {preCadastro.codigo_acesso}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Formulário de Conversão usando componente reutilizável */}
            <VinculoFuncionalForm
              tipoServidor={tipoServidor}
              cargoId={cargoId}
              unidadeId={unidadeId}
              dataAdmissao={dataAdmissao}
              onTipoServidorChange={setTipoServidor}
              onCargoChange={setCargoId}
              onUnidadeChange={setUnidadeId}
              onDataAdmissaoChange={setDataAdmissao}
              disabled={isConverting}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConverter}
            disabled={!isValid || isConverting}
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Confirmar Conversão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
