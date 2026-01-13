import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, AlertTriangle, Download, Copy, Code2, FileCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  validarTrabalhadorESocial,
  type DadosTrabalhador,
  type ItemRemuneracao,
} from "@/lib/esocialGenerator";
import {
  gerarXmlS1200,
  gerarXmlS1210,
  gerarXmlS1299,
  gerarIdEventoOficial,
  formatarPeriodo,
  criarDetVerbas,
  downloadXml,
  validarXmlBasico,
  ESOCIAL_PROC_VERSION,
  type EventoS1200Xml,
  type EventoS1210Xml,
  type EventoS1299Xml,
  type DetVerbas,
} from "@/lib/esocialXmlGenerator";

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
  xml: string;
  idEvento: string;
  erros: string[];
  xmlValido: boolean;
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
  const [formatoVisualizacao, setFormatoVisualizacao] = useState<"json" | "xml">("xml");

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
      const competenciaFormatada = formatarPeriodo(ano, mes);
      const eventos: EventoGerado[] = [];
      const cnpjLimpo = config.cnpj.replace(/\D/g, "");
      const cnpjRaiz = cnpjLimpo.substring(0, 8);
      const ambiente = config.esocial_ambiente === "producao" ? 1 : 2;

      // Gerar S-1200 e S-1210 para cada servidor
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
        const cpfLimpo = trabalhador.cpf.replace(/\D/g, "");

        // Montar verbas detalhadas
        const detVerbas: DetVerbas[] = [];
        
        // Itens da ficha financeira
        for (const item of ficha.itens || []) {
          const verba = criarDetVerbas(
            item.rubrica_id || "",
            item.descricao || "",
            item.tipo || "provento",
            item.valor || 0
          );
          detVerbas.push(verba);
        }

        // Se não tiver itens, adicionar vencimento base
        if (detVerbas.length === 0 && ficha.total_proventos > 0) {
          detVerbas.push({
            codRubr: "VENC001",
            ideTabRubr: "01",
            vrRubr: ficha.total_proventos,
          });
        }

        // Adicionar INSS e IRRF se houver
        if (ficha.valor_inss > 0) {
          detVerbas.push({
            codRubr: "INSS001",
            ideTabRubr: "01",
            vrRubr: ficha.valor_inss,
          });
        }

        if (ficha.valor_irrf > 0) {
          detVerbas.push({
            codRubr: "IRRF001",
            ideTabRubr: "01",
            vrRubr: ficha.valor_irrf,
          });
        }

        // Gerar ID único para S-1200
        const idEventoS1200 = gerarIdEventoOficial(1, cnpjRaiz, sequencial);
        const idDemonstativo = sequencial.toString().padStart(3, "0");

        // Construir evento S-1200
        const eventoS1200: EventoS1200Xml = {
          ideEvento: {
            indRetif: 1,
            perApur: competenciaFormatada,
            tpAmb: ambiente as 1 | 2,
            procEmi: 1,
            verProc: ESOCIAL_PROC_VERSION,
          },
          ideEmpregador: {
            tpInsc: 1,
            nrInsc: cnpjRaiz,
          },
          ideTrabalhador: {
            cpfTrab: cpfLimpo,
          },
          dmDev: [
            {
              ideDmDev: idDemonstativo,
              codCateg: trabalhador.categoria || 101,
              infoPerApur: {
                ideEstabLot: [
                  {
                    tpInsc: 1,
                    nrInsc: cnpjLimpo,
                    codLotacao: "001",
                    detVerbas,
                  },
                ],
              },
            },
          ],
        };

        const xmlS1200 = gerarXmlS1200(eventoS1200, idEventoS1200);
        const validacaoS1200 = validarXmlBasico(xmlS1200);

        eventos.push({
          tipo: "S-1200",
          servidorNome: ficha.servidor.nome_completo,
          json: JSON.stringify(eventoS1200, null, 2),
          xml: xmlS1200,
          idEvento: idEventoS1200,
          erros: [...erros, ...validacaoS1200.erros],
          xmlValido: validacaoS1200.valido && erros.length === 0,
        });

        // Gerar S-1210 (Pagamento)
        sequencial++;
        const idEventoS1210 = gerarIdEventoOficial(1, cnpjRaiz, sequencial);

        const eventoS1210: EventoS1210Xml = {
          ideEvento: {
            indRetif: 1,
            perApur: competenciaFormatada,
            tpAmb: ambiente as 1 | 2,
            procEmi: 1,
            verProc: ESOCIAL_PROC_VERSION,
          },
          ideEmpregador: {
            tpInsc: 1,
            nrInsc: cnpjRaiz,
          },
          ideBenef: {
            cpfBenef: cpfLimpo,
            infoPgto: [
              {
                dtPgto: `${ano}-${mes.toString().padStart(2, "0")}-05`,
                tpPgto: 1,
                perRef: competenciaFormatada,
                ideDmDev: idDemonstativo,
                vrLiq: ficha.valor_liquido || 0,
              },
            ],
          },
        };

        const xmlS1210 = gerarXmlS1210(eventoS1210, idEventoS1210);
        const validacaoS1210 = validarXmlBasico(xmlS1210);

        eventos.push({
          tipo: "S-1210",
          servidorNome: ficha.servidor.nome_completo,
          json: JSON.stringify(eventoS1210, null, 2),
          xml: xmlS1210,
          idEvento: idEventoS1210,
          erros: validacaoS1210.erros,
          xmlValido: validacaoS1210.valido,
        });

        sequencial++;
      }

      // Gerar S-1299 (Fechamento)
      const idEventoS1299 = gerarIdEventoOficial(1, cnpjRaiz, sequencial);

      const eventoS1299: EventoS1299Xml = {
        ideEvento: {
          perApur: competenciaFormatada,
          tpAmb: ambiente as 1 | 2,
          procEmi: 1,
          verProc: ESOCIAL_PROC_VERSION,
        },
        ideEmpregador: {
          tpInsc: 1,
          nrInsc: cnpjRaiz,
        },
        infoFech: {
          evtRemun: fichas.length > 0 ? "S" : "N",
          evtPgtos: fichas.length > 0 ? "S" : "N",
          evtAqProd: "N",
          evtComProd: "N",
          evtContratAvNP: "N",
          evtInfoComplPer: "N",
        },
      };

      const xmlS1299 = gerarXmlS1299(eventoS1299, idEventoS1299);
      const validacaoS1299 = validarXmlBasico(xmlS1299);

      eventos.push({
        tipo: "S-1299",
        json: JSON.stringify(eventoS1299, null, 2),
        xml: xmlS1299,
        idEvento: idEventoS1299,
        erros: validacaoS1299.erros,
        xmlValido: validacaoS1299.valido,
      });

      setEventosGerados(eventos);

      // Salvar eventos no banco
      for (const evento of eventos) {
        await supabase.from("eventos_esocial").insert({
          tipo_evento: evento.tipo,
          folha_id: folhaId,
          competencia_mes: mes,
          competencia_ano: ano,
          id_evento: evento.idEvento,
          payload: JSON.parse(evento.json),
          payload_xml: evento.xml,
          status: evento.erros.length > 0 ? "erro" : "pendente",
          mensagem_retorno: evento.erros.length > 0 ? evento.erros.join("; ") : null,
        });
      }

      toast.success(`${eventos.length} eventos XML gerados com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao gerar eventos:", error);
      toast.error("Erro ao gerar eventos eSocial");
    } finally {
      setGerando(false);
    }
  };

  const handleCopiar = (conteudo: string, tipo: string) => {
    navigator.clipboard.writeText(conteudo);
    toast.success(`${tipo} copiado!`);
  };

  const handleDownloadXml = (evento: EventoGerado) => {
    const nomeArquivo = `${evento.tipo}_${evento.servidorNome?.replace(/\s+/g, "_") || "fechamento"}_${competencia}.xml`;
    downloadXml(evento.xml, nomeArquivo);
    toast.success("XML baixado!");
  };

  const handleDownloadTodosXml = () => {
    // Download individual de cada XML
    for (const evento of eventosGerados) {
      const nomeArquivo = `${evento.tipo}_${evento.servidorNome?.replace(/\s+/g, "_") || "fechamento"}_${competencia}.xml`;
      downloadXml(evento.xml, nomeArquivo);
    }
    toast.success(`${eventosGerados.length} arquivos XML baixados!`);
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

  const renderEvento = (evento: EventoGerado, idx: number) => (
    <div key={idx} className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{evento.servidorNome || "Fechamento da Competência"}</span>
          {evento.xmlValido ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              XML Válido
            </Badge>
          ) : (
            <Badge variant="destructive">Pendências</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {evento.erros.length > 0 && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mr-2">
              {evento.erros.length} pendência(s)
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopiar(formatoVisualizacao === "xml" ? evento.xml : evento.json, formatoVisualizacao.toUpperCase())}
            title="Copiar"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadXml(evento)}
            title="Baixar XML"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {evento.erros.length > 0 && (
        <div className="text-sm text-orange-600 mb-2 bg-orange-50 p-2 rounded">
          {evento.erros.join(", ")}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mb-1">
        ID: {evento.idEvento}
      </div>
      
      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48 whitespace-pre-wrap">
        {formatoVisualizacao === "xml" ? evento.xml : evento.json}
      </pre>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Gerar Eventos eSocial (XML v. S-1.3)
          </DialogTitle>
          <DialogDescription>
            Competência: <strong>{competencia}</strong> | Ambiente:{" "}
            <Badge variant={config?.esocial_ambiente === "producao" ? "default" : "secondary"}>
              {config?.esocial_ambiente === "producao" ? "Produção" : "Homologação"}
            </Badge>
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
              <FileCode className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Clique em "Gerar Eventos" para criar os arquivos XML eSocial da competência.
              </p>
              <p className="text-sm text-muted-foreground">
                Serão gerados eventos S-1200 (Remuneração), S-1210 (Pagamentos) e S-1299 (Fechamento) 
                em formato XML conforme especificação oficial v. S-1.3.
              </p>
            </div>
          )}

          {gerando && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Gerando eventos XML eSocial...</p>
            </div>
          )}

          {eventosGerados.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Formato:</span>
                  <ToggleGroup
                    type="single"
                    value={formatoVisualizacao}
                    onValueChange={(v) => v && setFormatoVisualizacao(v as "json" | "xml")}
                  >
                    <ToggleGroupItem value="xml" size="sm">
                      <FileCode className="h-4 w-4 mr-1" />
                      XML
                    </ToggleGroupItem>
                    <ToggleGroupItem value="json" size="sm">
                      <Code2 className="h-4 w-4 mr-1" />
                      JSON
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTodosXml}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Todos XML ({eventosGerados.length})
                </Button>
              </div>

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
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-4 pr-4">
                      {eventosS1200.map((evento, idx) => renderEvento(evento, idx))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="s1210" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-4 pr-4">
                      {eventosS1210.map((evento, idx) => renderEvento(evento, idx))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="s1299" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-4 pr-4">
                      {eventosS1299.map((evento, idx) => renderEvento(evento, idx))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
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
                  <FileCode className="mr-2 h-4 w-4" />
                  Gerar Eventos XML
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
