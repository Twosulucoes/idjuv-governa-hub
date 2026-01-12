import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { gerarCNAB240, downloadCNAB, type DadosEmpresa, type DadosFavorecido } from "@/lib/cnabGenerator";

interface GerarRemessaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competencia: string;
}

export function GerarRemessaDialog({
  open,
  onOpenChange,
  folhaId,
  competencia,
}: GerarRemessaDialogProps) {
  const [contaSelecionada, setContaSelecionada] = useState<string>("");
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string; arquivo?: string } | null>(null);
  const queryClient = useQueryClient();

  // Buscar contas disponíveis
  const { data: contas, isLoading: loadingContas } = useQuery({
    queryKey: ["contas-autarquia-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_autarquia")
        .select(`*, banco:bancos_cnab(id, codigo_banco, nome)`)
        .eq("ativo", true)
        .order("descricao");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar config da autarquia
  const { data: config } = useQuery({
    queryKey: ["config-autarquia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_autarquia")
        .select("*")
        .eq("ativo", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar fichas financeiras da folha
  const { data: fichas } = useQuery({
    queryKey: ["fichas-para-remessa", folhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fichas_financeiras")
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf)
        `)
        .eq("folha_id", folhaId)
        .gt("valor_liquido", 0);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleGerar = async () => {
    if (!contaSelecionada || !config || !fichas) {
      toast.error("Selecione uma conta e verifique os dados");
      return;
    }

    const contaInfo = contas?.find((c) => c.id === contaSelecionada);
    if (!contaInfo) {
      toast.error("Conta não encontrada");
      return;
    }

    setGerando(true);
    setResultado(null);

    try {
      // Verificar servidores com dados bancários (usando dados da ficha)
      const fichasValidas = fichas.filter(
        (f) => f.banco_codigo && f.banco_agencia && f.banco_conta
      );

      if (fichasValidas.length === 0) {
        setResultado({
          sucesso: false,
          mensagem: "Nenhum servidor com dados bancários completos encontrado.",
        });
        return;
      }

      // Buscar próximo número de remessa
      const { data: numeroRemessa } = await supabase.rpc("get_proximo_numero_remessa", {
        p_conta_id: contaSelecionada,
        p_ano: new Date().getFullYear(),
      });

      // Preparar dados da empresa
      const empresa: DadosEmpresa = {
        cnpj: config.cnpj,
        razaoSocial: config.razao_social,
        banco: (contaInfo.banco as any)?.codigo_banco || "001",
        agencia: contaInfo.agencia,
        agenciaDigito: contaInfo.agencia_digito || "",
        conta: contaInfo.conta,
        contaDigito: contaInfo.conta_digito || "",
        convenio: contaInfo.convenio_pagamento || "",
      };

      // Preparar dados dos favorecidos
      const dataCredito = new Date();
      dataCredito.setDate(dataCredito.getDate() + 2); // D+2

      const favorecidos: DadosFavorecido[] = fichasValidas.map((f) => ({
        nome: f.servidor?.nome_completo || "",
        cpf: f.servidor?.cpf || "",
        banco: f.banco_codigo || "001",
        agencia: f.banco_agencia || "",
        agenciaDigito: "",
        conta: f.banco_conta || "",
        contaDigito: "",
        tipoConta: (f.banco_tipo_conta === "poupanca" ? "CP" : "CC") as "CC" | "CP",
        valor: f.valor_liquido || 0,
        dataCredito,
        identificador: f.id.substring(0, 20),
      }));

      // Gerar arquivo CNAB
      const conteudo = gerarCNAB240({
        empresa,
        favorecidos,
        numeroRemessa: numeroRemessa || 1,
        dataGeracao: new Date(),
      });

      // Calcular valor total
      const valorTotal = favorecidos.reduce((sum, f) => sum + f.valor, 0);

      // Nome do arquivo
      const nomeArquivo = `REMESSA_${competencia.replace("/", "_")}_${(numeroRemessa || 1).toString().padStart(3, "0")}.REM`;

      // Salvar registro no banco
      const { error: insertError } = await supabase.from("remessas_bancarias").insert({
        folha_id: folhaId,
        conta_autarquia_id: contaSelecionada,
        numero_remessa: numeroRemessa || 1,
        nome_arquivo: nomeArquivo,
        layout: "CNAB240",
        quantidade_registros: favorecidos.length,
        valor_total: valorTotal,
        status: "gerada",
      });

      if (insertError) throw insertError;

      // Download do arquivo
      downloadCNAB(conteudo, nomeArquivo);

      setResultado({
        sucesso: true,
        mensagem: `Remessa gerada com sucesso! ${favorecidos.length} pagamentos totalizando R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        arquivo: nomeArquivo,
      });

      queryClient.invalidateQueries({ queryKey: ["remessas-bancarias"] });
      toast.success("Arquivo CNAB gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar remessa:", error);
      setResultado({
        sucesso: false,
        mensagem: error.message || "Erro ao gerar arquivo de remessa.",
      });
      toast.error("Erro ao gerar remessa");
    } finally {
      setGerando(false);
    }
  };

  const handleClose = () => {
    if (!gerando) {
      setResultado(null);
      setContaSelecionada("");
      onOpenChange(false);
    }
  };

  // Verificar pré-requisitos
  const servidoresSemBanco = fichas?.filter(
    (f) => !f.banco_codigo || !f.banco_agencia || !f.banco_conta
  ).length || 0;

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
              {!config?.cnpj && (
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

              <div className="space-y-2">
                <Label>Conta para Débito</Label>
                <Select
                  value={contaSelecionada}
                  onValueChange={setContaSelecionada}
                  disabled={loadingContas}
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
                    pagamentos no arquivo.
                  </p>
                </div>
              )}
            </>
          )}

          {gerando && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Gerando arquivo CNAB240...</p>
            </div>
          )}

          {resultado && resultado.sucesso && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Remessa Gerada</AlertTitle>
              <AlertDescription className="text-green-700">
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
                disabled={gerando || !contaSelecionada || !config?.cnpj}
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
