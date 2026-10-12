import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Play, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useContagemItensFolha } from "@/hooks/useFolhaPagamento";

interface ProcessarFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competencia: string;
}

interface ResultadoProcessamento {
  sucesso: boolean;
  servidores_processados?: number;
  total_servidores_ativos?: number;
  total_com_provimento?: number;
  total_sem_vencimento?: number;
  erros?: Array<{ servidor_id: string; nome: string; erro: string }>;
  avisos?: string[];
  protocolo?: string;
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
  // A RPC apaga as fichas (cascata nos itens) — inclusive itens lançados manualmente na ficha.
  const { data: qtdItens } = useContagemItensFolha(open ? folhaId : undefined);

  const handleProcessar = async () => {
    setProcessando(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.rpc("processar_folha_pagamento", {
        p_folha_id: folhaId,
      });

      if (error) throw error;

      // Normalizar resposta (suporta tanto inglês quanto português)
      const rawData = data as any;
      const res: ResultadoProcessamento = {
        sucesso: rawData.sucesso ?? rawData.success ?? false,
        servidores_processados: rawData.servidores_processados ?? rawData.servers_processed ?? 0,
        total_servidores_ativos: rawData.total_servidores_ativos,
        total_com_provimento: rawData.total_com_provimento,
        total_sem_vencimento: rawData.total_sem_vencimento,
        erros: rawData.erros ?? rawData.errors ?? [],
        avisos: rawData.avisos ?? [],
        protocolo: rawData.protocolo,
        erro: rawData.erro ?? rawData.error,
      };
      
      setResultado(res);

      if (res.sucesso) {
        toast.success(`Folha processada com ${res.servidores_processados} servidores. Protocolo ${res.protocolo ?? '—'}`);
        queryClient.invalidateQueries({ queryKey: ["folha-detalhe", folhaId] });
        queryClient.invalidateQueries({ queryKey: ["fichas-financeiras", folhaId] });
        queryClient.invalidateQueries({ queryKey: ["folhas-pagamento"] });
        queryClient.invalidateQueries({ queryKey: ["itens-folha-contagem", folhaId] });
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
                  <li>Incluir quem tem <strong>provimento no período</strong> (inclusive em férias e licença remunerada)</li>
                  <li>Calcular vencimento proporcional, faltas, licença sem remuneração, 1/3 de férias, INSS, IRRF, consignações e pensão (13º e rescisão conforme o tipo da folha)</li>
                  <li>Preservar os <strong>lançamentos manuais</strong> das fichas e refazer o restante</li>
                  <li>Gerar as fichas, marcar inconsistências e atualizar os totais</li>
                  <li>Registrar tudo na trilha com um número de protocolo</li>
                </ul>
                <p className="mt-2 font-medium">
                  Fichas existentes serão substituídas.
                </p>
                {(qtdItens ?? 0) > 0 && (
                  <p className="mt-1 text-sm">
                    As fichas atuais têm {qtdItens} item(ns). Os itens calculados serão refeitos; os lançamentos manuais
                    voltam para a ficha do mesmo servidor.
                  </p>
                )}
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
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Processamento Concluído</AlertTitle>
                <AlertDescription className="text-green-700">
                  <p>
                    <strong>{resultado.servidores_processados}</strong> servidores
                    processados com sucesso.
                  </p>
                  {resultado.protocolo && (
                    <p className="mt-1">Protocolo: <strong className="font-mono">{resultado.protocolo}</strong></p>
                  )}
                </AlertDescription>
              </Alert>

              {/* Diagnóstico detalhado */}
              {(resultado.total_servidores_ativos !== undefined || resultado.total_com_provimento !== undefined) && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Diagnóstico</AlertTitle>
                  <AlertDescription className="text-blue-700 text-sm">
                    <ul className="space-y-1 mt-1">
                      {resultado.total_servidores_ativos !== undefined && (
                        <li>• Servidores com provimento no período: <strong>{resultado.total_servidores_ativos}</strong></li>
                      )}
                      {resultado.total_com_provimento !== undefined && (
                        <li>• Entraram na folha (elegíveis): <strong>{resultado.total_com_provimento}</strong></li>
                      )}
                      {resultado.total_sem_vencimento !== undefined && resultado.total_sem_vencimento > 0 && (
                        <li className="text-orange-600">• Pulados por cargo sem vencimento: <strong>{resultado.total_sem_vencimento}</strong></li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {resultado.avisos && resultado.avisos.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">Avisos</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 text-sm space-y-1">
                      {resultado.avisos.map((a, i) => (
                        <li key={i} className="text-orange-700">• {a}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {resultado.erros && resultado.erros.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">
                    {resultado.erros.length} erro(s) encontrado(s)
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 text-sm space-y-1 max-h-32 overflow-auto">
                      {resultado.erros.map((e, i) => (
                        <li key={i} className="text-orange-600">
                          • {e.nome}: {e.erro}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
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
