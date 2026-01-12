import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Play, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProcessarFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competencia: string;
}

interface ResultadoProcessamento {
  sucesso: boolean;
  servidores_processados?: number;
  erros?: Array<{ servidor_id: string; nome: string; erro: string }>;
  erro?: string;
}

export function ProcessarFolhaDialog({
  open,
  onOpenChange,
  folhaId,
  competencia,
}: ProcessarFolhaDialogProps) {
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProcessamento | null>(null);
  const queryClient = useQueryClient();

  const handleProcessar = async () => {
    setProcessando(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.rpc("processar_folha_pagamento", {
        p_folha_id: folhaId,
      });

      if (error) throw error;

      const res = data as unknown as ResultadoProcessamento;
      setResultado(res);

      if (res.sucesso) {
        toast.success(`Folha processada com ${res.servidores_processados} servidores`);
        queryClient.invalidateQueries({ queryKey: ["folha-detalhe", folhaId] });
        queryClient.invalidateQueries({ queryKey: ["fichas-financeiras", folhaId] });
        queryClient.invalidateQueries({ queryKey: ["folhas-pagamento"] });
      }
    } catch (error: any) {
      console.error("Erro ao processar folha:", error);
      setResultado({ sucesso: false, erro: error.message });
      toast.error("Erro ao processar folha");
    } finally {
      setProcessando(false);
    }
  };

  const handleClose = () => {
    if (!processando) {
      setResultado(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Processar Folha de Pagamento</DialogTitle>
          <DialogDescription>
            Competência: <strong>{competencia}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!resultado && !processando && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Este processo irá:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>Buscar todos os servidores ativos com provimento</li>
                  <li>Calcular vencimento base, INSS e IRRF</li>
                  <li>Aplicar consignações ativas</li>
                  <li>Gerar fichas financeiras individuais</li>
                  <li>Atualizar totalizadores da folha</li>
                </ul>
                <p className="mt-2 font-medium">
                  Fichas existentes serão substituídas.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {processando && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Processando folha de pagamento...
              </p>
              <p className="text-sm text-muted-foreground">
                Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {resultado && resultado.sucesso && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Processamento Concluído</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>
                  <strong>{resultado.servidores_processados}</strong> servidores
                  processados com sucesso.
                </p>
                {resultado.erros && resultado.erros.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-orange-700">
                      {resultado.erros.length} erro(s) encontrado(s):
                    </p>
                    <ul className="mt-1 text-sm space-y-1">
                      {resultado.erros.map((e, i) => (
                        <li key={i} className="text-orange-600">
                          • {e.nome}: {e.erro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {resultado && !resultado.sucesso && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro no Processamento</AlertTitle>
              <AlertDescription>{resultado.erro}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!resultado && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={processando}>
                Cancelar
              </Button>
              <Button onClick={handleProcessar} disabled={processando}>
                {processando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Processar Folha
                  </>
                )}
              </Button>
            </>
          )}
          {resultado && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
