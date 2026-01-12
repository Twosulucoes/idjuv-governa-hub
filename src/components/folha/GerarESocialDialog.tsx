import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, AlertTriangle, CheckCircle2, Download, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  gerarEventoS1200,
  gerarEventoS1210,
  gerarEventoS1299,
  eventoParaJSON,
  validarTrabalhadorESocial,
  type DadosEmpregador,
  type DadosTrabalhador,
  type ItemRemuneracao,
} from "@/lib/esocialGenerator";

interface GerarESocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competencia: string;
  mes: number;
  ano: number;
}

interface EventoGerado {
  tipo: string;
  servidorNome?: string;
  json: string;
  erros: string[];
}

export function GerarESocialDialog({
  open,
  onOpenChange,
  folhaId,
  competencia,
  mes,
  ano,
}: GerarESocialDialogProps) {
  const [gerando, setGerando] = useState(false);
  const [eventosGerados, setEventosGerados] = useState<EventoGerado[]>([]);
  const [tabAtiva, setTabAtiva] = useState("s1200");
  const queryClient = useQueryClient();

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

  // Buscar fichas financeiras com itens
  const { data: fichas } = useQuery({
    queryKey: ["fichas-esocial", folhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fichas_financeiras")
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, pis_pasep, matricula),
          itens:itens_ficha_financeira(*)
        `)
        .eq("folha_id", folhaId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleGerarEventos = async () => {
    if (!config || !fichas) {
      toast.error("Dados incompletos para geração");
      return;
    }

    setGerando(true);
    setEventosGerados([]);

    try {
      const competenciaFormatada = `${ano}-${mes.toString().padStart(2, "0")}`;
      const eventos: EventoGerado[] = [];

      const empregador: DadosEmpregador = {
        cnpj: config.cnpj,
        razaoSocial: config.razao_social,
        tpInsc: 1,
        nrInsc: config.cnpj.replace(/\D/g, "").substring(0, 8),
      };

      // Gerar S-1200 para cada servidor
      let sequencial = 1;
      for (const ficha of fichas) {
        if (!ficha.servidor) continue;

        const trabalhador: DadosTrabalhador = {
          cpf: ficha.servidor.cpf || "",
          pis: ficha.servidor.pis_pasep || "",
          nome: ficha.servidor.nome_completo || "",
          matricula: ficha.servidor.matricula || "",
          categoria: 101,
        };

        const erros = validarTrabalhadorESocial(trabalhador);

        const itens: ItemRemuneracao[] = (ficha.itens || []).map((item: any) => ({
          codigoRubrica: item.rubrica_id || "0001",
          descricao: item.descricao,
          tipo: item.tipo as "provento" | "desconto",
          valor: item.valor,
        }));

        // Adicionar vencimento base se não tiver itens
        if (itens.length === 0 && ficha.total_proventos > 0) {
          itens.push({
            codigoRubrica: "0001",
            descricao: "Vencimento Base",
            tipo: "provento",
            valor: ficha.total_proventos,
          });
        }

        if (ficha.valor_inss > 0) {
          itens.push({
            codigoRubrica: "9201",
            descricao: "INSS",
            tipo: "desconto",
            valor: ficha.valor_inss,
          });
        }

        if (ficha.valor_irrf > 0) {
          itens.push({
            codigoRubrica: "9301",
            descricao: "IRRF",
            tipo: "desconto",
            valor: ficha.valor_irrf,
          });
        }

        const eventoS1200 = gerarEventoS1200(
          empregador,
          trabalhador,
          itens,
          competenciaFormatada,
          sequencial++,
          config.esocial_ambiente === "producao" ? "producao" : "homologacao"
        );

        eventos.push({
          tipo: "S-1200",
          servidorNome: ficha.servidor.nome_completo,
          json: eventoParaJSON(eventoS1200),
          erros,
        });

        // Gerar S-1210 (Pagamento)
        const eventoS1210 = gerarEventoS1210(
          empregador,
          trabalhador.cpf,
          ficha.valor_liquido || 0,
          `${ano}-${mes.toString().padStart(2, "0")}-05`,
          competenciaFormatada,
          sequencial.toString().padStart(3, "0"),
          ficha.quantidade_dependentes ? ficha.quantidade_dependentes * 189.59 : undefined,
          config.esocial_ambiente === "producao" ? "producao" : "homologacao"
        );

        eventos.push({
          tipo: "S-1210",
          servidorNome: ficha.servidor.nome_completo,
          json: eventoParaJSON(eventoS1210),
          erros,
        });
      }

      // Gerar S-1299 (Fechamento)
      const eventoS1299 = gerarEventoS1299(
        empregador,
        competenciaFormatada,
        fichas.length > 0,
        fichas.length > 0,
        config.esocial_ambiente === "producao" ? "producao" : "homologacao"
      );

      eventos.push({
        tipo: "S-1299",
        json: eventoParaJSON(eventoS1299),
        erros: [],
      });

      setEventosGerados(eventos);

      // Salvar eventos no banco
      for (const evento of eventos) {
        await supabase.from("eventos_esocial").insert({
          tipo_evento: evento.tipo,
          folha_id: folhaId,
          competencia_mes: mes,
          competencia_ano: ano,
          payload: JSON.parse(evento.json),
          status: evento.erros.length > 0 ? "erro" : "pendente",
          mensagem_retorno: evento.erros.length > 0 ? evento.erros.join("; ") : null,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["eventos-esocial"] });
      toast.success(`${eventos.length} eventos gerados com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao gerar eventos:", error);
      toast.error("Erro ao gerar eventos eSocial");
    } finally {
      setGerando(false);
    }
  };

  const handleCopiar = (json: string) => {
    navigator.clipboard.writeText(json);
    toast.success("JSON copiado!");
  };

  const handleClose = () => {
    if (!gerando) {
      setEventosGerados([]);
      onOpenChange(false);
    }
  };

  const eventosS1200 = eventosGerados.filter((e) => e.tipo === "S-1200");
  const eventosS1210 = eventosGerados.filter((e) => e.tipo === "S-1210");
  const eventosS1299 = eventosGerados.filter((e) => e.tipo === "S-1299");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerar Eventos eSocial</DialogTitle>
          <DialogDescription>
            Competência: <strong>{competencia}</strong> | Ambiente:{" "}
            {config?.esocial_ambiente === "producao" ? "Produção" : "Homologação"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {!config?.cnpj && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuração Incompleta</AlertTitle>
              <AlertDescription>
                Configure os dados da autarquia antes de gerar eventos eSocial.
              </AlertDescription>
            </Alert>
          )}

          {eventosGerados.length === 0 && !gerando && (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Clique em "Gerar Eventos" para criar os eventos eSocial da
                competência.
              </p>
              <p className="text-sm text-muted-foreground">
                Serão gerados eventos S-1200 (Remuneração), S-1210 (Pagamentos) e
                S-1299 (Fechamento).
              </p>
            </div>
          )}

          {gerando && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Gerando eventos eSocial...</p>
            </div>
          )}

          {eventosGerados.length > 0 && (
            <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="s1200">
                  S-1200 ({eventosS1200.length})
                </TabsTrigger>
                <TabsTrigger value="s1210">
                  S-1210 ({eventosS1210.length})
                </TabsTrigger>
                <TabsTrigger value="s1299">
                  S-1299 ({eventosS1299.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="s1200" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {eventosS1200.map((evento, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{evento.servidorNome}</span>
                          <div className="flex items-center gap-2">
                            {evento.erros.length > 0 && (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {evento.erros.length} pendência(s)
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopiar(evento.json)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {evento.erros.length > 0 && (
                          <div className="text-sm text-orange-600 mb-2">
                            {evento.erros.join(", ")}
                          </div>
                        )}
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                          {evento.json}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="s1210" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {eventosS1210.map((evento, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{evento.servidorNome}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopiar(evento.json)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                          {evento.json}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="s1299" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {eventosS1299.map((evento, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Fechamento da Competência</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopiar(evento.json)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                          {evento.json}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={gerando}>
            Fechar
          </Button>
          {eventosGerados.length === 0 && (
            <Button onClick={handleGerarEventos} disabled={gerando || !config?.cnpj}>
              {gerando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Eventos
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
