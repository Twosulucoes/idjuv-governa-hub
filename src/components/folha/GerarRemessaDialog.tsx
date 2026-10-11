import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  faltaFichas,
  fichaTemBanco,
  montarDadosRemessa,
  useDadosRemessaCNAB,
  useGerarRemessaCNAB,
} from "@/hooks/useArquivosFolha";

interface GerarRemessaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competencia: string;
  competenciaAno: number;
  competenciaMes: number;
  /** A remessa só é gerada com a folha fechada (o banco também recusa). */
  folhaFechada: boolean;
  /** `folhas_pagamento.quantidade_servidores`: a leitura das fichas tem de bater (senão o arquivo sairia incompleto). */
  quantidadeServidores: number | null;
}

export function GerarRemessaDialog({
  open,
  onOpenChange,
  folhaId,
  competencia,
  competenciaAno,
  competenciaMes,
  folhaFechada,
  quantidadeServidores,
}: GerarRemessaDialogProps) {
  const [contaSelecionada, setContaSelecionada] = useState<string>("");
  const [gerando, setGerando] = useState(false);
  const [faltas, setFaltas] = useState<string[]>([]);
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string; arquivo?: string } | null>(null);
  const { contas: qContas, config: qConfig, fichas: qFichas } = useDadosRemessaCNAB(folhaId, open);
  const contas = qContas.data;
  const config = qConfig.data;
  const todasFichas = qFichas.data;
  // Só entra quem tem líquido a receber
  const fichas = todasFichas?.filter((f) => (f.valor_liquido ?? 0) > 0);
  const carregando = qContas.isLoading || qConfig.isLoading || qFichas.isLoading;
  const erroConsulta = qContas.isError || qConfig.isError || qFichas.isError;
  const leituraIncompleta = todasFichas ? faltaFichas(todasFichas.length, quantidadeServidores) : null;
  const gerarRemessa = useGerarRemessaCNAB();

  const handleGerar = async () => {
    if (!folhaFechada) {
      toast.error("Feche a folha antes de gerar a remessa.");
      return;
    }
    if (!contaSelecionada || !config || !fichas || !todasFichas) {
      toast.error("Selecione uma conta e verifique os dados");
      return;
    }
    if (leituraIncompleta) {
      setResultado({ sucesso: false, mensagem: leituraIncompleta });
      return;
    }

    const contaInfo = contas?.find((c) => c.id === contaSelecionada);
    if (!contaInfo) {
      toast.error("Conta não encontrada");
      return;
    }

    setFaltas([]);
    setResultado(null);

    if (!fichas.some(fichaTemBanco)) {
      setResultado({ sucesso: false, mensagem: "Nenhum servidor com dados bancários completos encontrado." });
      return;
    }

    // Data de crédito: D+2 da geração (conferir no manual do banco o prazo do convênio)
    const dataCredito = new Date();
    dataCredito.setDate(dataCredito.getDate() + 2);

    // Faltou dado obrigatório no cadastro: recusa e diz qual
    const { empresa, favorecidos, faltas: pendentes } = montarDadosRemessa(config, contaInfo, fichas, dataCredito);
    if (pendentes.length > 0) {
      setFaltas(pendentes);
      return;
    }

    setGerando(true);
    try {
      const r = await gerarRemessa({
        folhaId,
        contaId: contaSelecionada,
        competenciaAno,
        competenciaMes,
        empresa,
        favorecidos,
      });
      if (r.ok === false) {
        // O erro fica no alerta do diálogo (o registro na trilha já avisa por toast quando falha)
        setResultado({ sucesso: false, mensagem: r.mensagem });
        return;
      }
      setResultado({
        sucesso: true,
        mensagem: `Remessa nº ${r.numero} gerada e guardada. ${r.quantidade} pagamentos totalizando R$ ${r.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        arquivo: r.nomeArquivo,
      });
      toast.success("Arquivo CNAB gerado com sucesso!");
    } catch (error: unknown) {
      console.error("Erro ao gerar remessa:", error);
      setResultado({
        sucesso: false,
        mensagem: error instanceof Error && error.message ? error.message : "Erro ao gerar arquivo de remessa.",
      });
      toast.error("Erro ao gerar remessa");
    } finally {
      setGerando(false);
    }
  };

  const handleClose = () => {
    if (!gerando) {
      setResultado(null);
      setFaltas([]);
      setContaSelecionada("");
      onOpenChange(false);
    }
  };

  // Verificar pré-requisitos
  const servidoresSemBanco = fichas?.filter((f) => !fichaTemBanco(f)).length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar Remessa Bancária (CNAB240)</DialogTitle>
          <DialogDescription>
            Competência: <strong>{competencia}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!resultado && (
            <>
              {!folhaFechada && (
                <Alert variant="destructive">
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Folha não fechada</AlertTitle>
                  <AlertDescription>
                    A remessa bancária só pode ser gerada com a folha fechada, para o arquivo pagar exatamente o que
                    foi conferido. Feche a folha e volte aqui.
                  </AlertDescription>
                </Alert>
              )}

              {erroConsulta && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Não foi possível carregar os dados</AlertTitle>
                  <AlertDescription>
                    Falhou a leitura das contas, da configuração ou das fichas da folha. Feche e abra de novo; se
                    continuar, verifique seu acesso.
                  </AlertDescription>
                </Alert>
              )}

              {!erroConsulta && leituraIncompleta && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fichas incompletas</AlertTitle>
                  <AlertDescription>{leituraIncompleta}</AlertDescription>
                </Alert>
              )}

              {!carregando && !erroConsulta && !config?.cnpj && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Configuração Incompleta</AlertTitle>
                  <AlertDescription>
                    Configure os dados da autarquia (CNPJ) antes de gerar remessas.
                  </AlertDescription>
                </Alert>
              )}

              {servidoresSemBanco > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    {servidoresSemBanco} servidor(es) não possuem dados bancários
                    completos e não serão incluídos na remessa.
                  </AlertDescription>
                </Alert>
              )}

              {faltas.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Faltam dados no cadastro</AlertTitle>
                  <AlertDescription>
                    <p>A remessa não foi gerada. Complete:</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5">
                      {faltas.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Conta para Débito</Label>
                <Select
                  value={contaSelecionada}
                  onValueChange={(v) => {
                    setContaSelecionada(v);
                    setFaltas([]);
                  }}
                  disabled={qContas.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contas?.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.descricao} - Ag: {conta.agencia} / CC: {conta.conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fichas && fichas.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <p>
                    Serão gerados <strong>{fichas.length - servidoresSemBanco}</strong>{" "}
                    pagamentos no arquivo. O arquivo fica guardado (com hash) e pode ser baixado de novo na aba
                    Remessas.
                  </p>
                </div>
              )}
            </>
          )}

          {gerando && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Gerando e guardando o arquivo CNAB240...</p>
            </div>
          )}

          {resultado && resultado.sucesso && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">Remessa Gerada</AlertTitle>
              <AlertDescription className="text-success">
                <p>{resultado.mensagem}</p>
                <p className="mt-2 font-medium">Arquivo: {resultado.arquivo}</p>
              </AlertDescription>
            </Alert>
          )}

          {resultado && !resultado.sucesso && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{resultado.mensagem}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!resultado && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={gerando}>
                Cancelar
              </Button>
              <Button
                onClick={handleGerar}
                disabled={
                  gerando ||
                  carregando ||
                  erroConsulta ||
                  !!leituraIncompleta ||
                  !folhaFechada ||
                  !contaSelecionada ||
                  !config?.cnpj
                }
                title={!folhaFechada ? "Disponível com a folha fechada" : undefined}
              >
                {gerando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar CNAB240
                  </>
                )}
              </Button>
            </>
          )}
          {resultado && <Button onClick={handleClose}>Fechar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
