import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF } from "@/lib/formatters";
import type { PreCadastro } from "@/types/preCadastro";
import type { TipoServidor } from "@/types/servidor";
import { TIPO_SERVIDOR_LABELS, REGRAS_TIPO_SERVIDOR } from "@/types/servidor";

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

  // Buscar unidades
  const { data: unidades } = useQuery({
    queryKey: ["unidades-conversao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Buscar cargos baseado no tipo de servidor
  const { data: cargos } = useQuery({
    queryKey: ["cargos-conversao", tipoServidor],
    queryFn: async () => {
      if (!tipoServidor) return [];
      
      const regras = REGRAS_TIPO_SERVIDOR[tipoServidor as TipoServidor];
      if (!regras.permiteCargo) return [];

      let query = supabase
        .from("cargos")
        .select("id, nome, sigla, natureza")
        .eq("ativo", true);

      if (regras.tiposCargo.length > 0) {
        query = query.in("natureza", regras.tiposCargo);
      }

      const { data, error } = await query.order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!tipoServidor,
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

  // Reset cargo when tipo changes
  useEffect(() => {
    setCargoId("");
  }, [tipoServidor]);

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

  const regras = tipoServidor
    ? REGRAS_TIPO_SERVIDOR[tipoServidor as TipoServidor]
    : null;

  const canSubmit =
    tipoServidor &&
    unidadeId &&
    dataAdmissao &&
    (!regras?.permiteCargo || cargoId);

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

            {/* Formulário de Conversão */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipoServidor">Tipo de Servidor *</Label>
                <Select
                  value={tipoServidor}
                  onValueChange={(v) => setTipoServidor(v as TipoServidor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de servidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(TIPO_SERVIDOR_LABELS) as TipoServidor[]
                    ).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_SERVIDOR_LABELS[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {regras && (
                  <p className="text-xs text-muted-foreground">
                    {regras.descricao}
                  </p>
                )}
              </div>

              {regras?.permiteCargo && (
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Select value={cargoId} onValueChange={setCargoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos?.map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.id}>
                          {cargo.sigla
                            ? `${cargo.sigla} - ${cargo.nome}`
                            : cargo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade de Lotação *</Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades?.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.sigla
                          ? `${unidade.sigla} - ${unidade.nome}`
                          : unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataAdmissao">Data de Admissão *</Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  value={dataAdmissao}
                  onChange={(e) => setDataAdmissao(e.target.value)}
                />
              </div>
            </div>

            {tipoServidor === "cedido_entrada" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para servidores cedidos, será necessário registrar a cessão
                  após a conversão, informando o órgão de origem.
                </AlertDescription>
              </Alert>
            )}
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
            disabled={!canSubmit || isConverting}
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
