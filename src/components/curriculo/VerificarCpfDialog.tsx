import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVerificarCpf } from "@/hooks/useVerificarCpf";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCpfVerificado: (cpf: string) => void;
  onRecuperarPreCadastro: (codigo: string) => void;
}

export function VerificarCpfDialog({
  open,
  onOpenChange,
  onCpfVerificado,
  onRecuperarPreCadastro,
}: Props) {
  const [cpf, setCpf] = useState("");
  const [resultado, setResultado] = useState<{
    verificado: boolean;
    existeServidor: boolean;
    existePreCadastro: boolean;
    servidor?: { nome: string; matricula: string; situacao: string };
    preCadastro?: { nome: string; status: string; codigo: string };
  } | null>(null);

  const { verificar, isVerificando } = useVerificarCpf();

  const handleVerificar = async () => {
    if (cpf.replace(/\D/g, "").length !== 11) return;

    const res = await verificar(cpf);
    setResultado({
      verificado: true,
      ...res,
    });
  };

  const handleContinuar = () => {
    onCpfVerificado(cpf);
    onOpenChange(false);
    setCpf("");
    setResultado(null);
  };

  const handleRecuperar = () => {
    if (resultado?.preCadastro?.codigo) {
      onRecuperarPreCadastro(resultado.preCadastro.codigo);
      onOpenChange(false);
      setCpf("");
      setResultado(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCpf("");
    setResultado(null);
  };

  const cpfValido = cpf.replace(/\D/g, "").length === 11;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificar CPF</DialogTitle>
          <DialogDescription>
            Digite seu CPF para verificar se já possui cadastro no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf-verificar">CPF</Label>
            <MaskedInput
              id="cpf-verificar"
              mask="cpf"
              value={cpf}
              onChange={setCpf}
              placeholder="000.000.000-00"
              disabled={isVerificando}
            />
          </div>

          {!resultado?.verificado && (
            <Button
              onClick={handleVerificar}
              disabled={!cpfValido || isVerificando}
              className="w-full"
            >
              {isVerificando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar CPF"
              )}
            </Button>
          )}

          {resultado?.verificado && (
            <div className="space-y-4">
              {/* CPF já é servidor */}
              {resultado.existeServidor && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>CPF já cadastrado como servidor</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Este CPF já está vinculado a um servidor no sistema:</p>
                    <div className="bg-destructive/10 p-2 rounded text-sm">
                      <p><strong>Nome:</strong> {resultado.servidor?.nome}</p>
                      <p><strong>Matrícula:</strong> {resultado.servidor?.matricula}</p>
                      <p><strong>Situação:</strong> {resultado.servidor?.situacao}</p>
                    </div>
                    <p className="text-xs">
                      Entre em contato com o RH se precisar de ajuda.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* CPF tem pré-cadastro pendente */}
              {!resultado.existeServidor && resultado.existePreCadastro && (
                <Alert className="border-warning bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-warning">Pré-cadastro existente</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Este CPF já possui um pré-cadastro:</p>
                    <div className="bg-warning/10 p-2 rounded text-sm">
                      <p><strong>Nome:</strong> {resultado.preCadastro?.nome}</p>
                      <p><strong>Status:</strong> {resultado.preCadastro?.status}</p>
                      <p><strong>Código:</strong> {resultado.preCadastro?.codigo}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* CPF disponível */}
              {!resultado.existeServidor && !resultado.existePreCadastro && (
                <Alert className="border-success bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertTitle className="text-success">CPF disponível</AlertTitle>
                  <AlertDescription>
                    Este CPF não possui cadastro no sistema. Você pode iniciar o pré-cadastro.
                  </AlertDescription>
                </Alert>
              )}

              {/* Ações */}
              <div className="flex flex-col gap-2">
                {resultado.existePreCadastro && !resultado.existeServidor && (
                  <Button onClick={handleRecuperar} variant="default">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar pré-cadastro existente
                  </Button>
                )}

                {!resultado.existeServidor && !resultado.existePreCadastro && (
                  <Button onClick={handleContinuar}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Iniciar pré-cadastro
                  </Button>
                )}

                {resultado.existePreCadastro && !resultado.existeServidor && (
                  <Button onClick={handleContinuar} variant="outline">
                    Criar novo pré-cadastro mesmo assim
                  </Button>
                )}

                <Button onClick={handleClose} variant="ghost">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
