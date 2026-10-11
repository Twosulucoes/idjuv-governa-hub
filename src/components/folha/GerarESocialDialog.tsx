import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Download, Copy, Code2, FileCode, Lock, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  validarTrabalhadorESocial,
  type DadosTrabalhador,
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
  ambienteESocial,
  AMBIENTE_ESOCIAL_LABELS,
  ESOCIAL_PROC_VERSION,
  type EventoS1200Xml,
  type EventoS1210Xml,
  type EventoS1299Xml,
  type DetVerbas,
} from "@/lib/esocialXmlGenerator";
import { useRegistrarEvento } from "@/hooks/useTrilhaAuditoria";
import { useAuth } from "@/contexts/AuthContext";
import { useConfigAutarquia, useEventosESocialFolha } from "@/hooks/useFolhaPagamento";
import {
  dataPagamentoNaCompetencia,
  faltaFichas,
  nomeArquivoEventoESocial,
  useDiaPagamentoFolha,
  useFichasESocial,
  useGravarEventosESocial,
  type EventoExistente,
} from "@/hooks/useArquivosFolha";

interface GerarESocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competencia: string;
  mes: number;
  ano: number;
  /** Eventos só são gerados com a folha fechada (o banco também recusa). */
  folhaFechada: boolean;
  /** `folhas_pagamento.quantidade_servidores`: a leitura das fichas tem de bater (senão os eventos sairiam incompletos). */
  quantidadeServidores: number | null;
}

/** gravado: novo; existente: já estava gravado (índice único), mostra o gravado; erro: não gravado, não sai da tela. */
type SituacaoEvento = "gravado" | "existente" | "erro";

interface EventoGerado {
  tipo: string;
  servidorId: string | null;
  servidorNome?: string;
  json: string;
  xml: string;
  idEvento: string;
  erros: string[];
  xmlValido: boolean;
  situacao?: SituacaoEvento;
  mensagemGravacao?: string;
}

const podeSair = (e: EventoGerado) => (e.situacao === "gravado" || e.situacao === "existente") && !!e.xml;

export function GerarESocialDialog({
  open,
  onOpenChange,
  folhaId,
  competencia,
  mes,
  ano,
  folhaFechada,
  quantidadeServidores,
}: GerarESocialDialogProps) {
  const [gerando, setGerando] = useState(false);
  const [eventosGerados, setEventosGerados] = useState<EventoGerado[]>([]);
  const [errosGravacao, setErrosGravacao] = useState<string[]>([]);
  const [dataPagamento, setDataPagamento] = useState("");
  const [tabAtiva, setTabAtiva] = useState("s1200");
  const [formatoVisualizacao, setFormatoVisualizacao] = useState<"json" | "xml">("xml");
  const { registrarAntes } = useRegistrarEvento();
  // Gravar e ler eventos do eSocial exige financeiro.folha.processar no banco; a tela repete (UX)
  const { hasPermission } = useAuth();
  const podeProcessar = hasPermission("financeiro.folha.processar");

  // Trilha: todo XML/JSON que sai da tela (baixar ou copiar) é registrado antes; sem registro, não sai.
  const registrarSaidaESocial = (acao: "download" | "export", eventos: EventoGerado[], meio: string) =>
    registrarAntes({
      acao,
      entidade: "arquivo_esocial",
      entidadeId: folhaId,
      descricao: `eSocial ${competencia}: ${eventos.length} evento(s) ${meio}`,
      metadados: {
        folha_id: folhaId,
        competencia_mes: mes,
        competencia_ano: ano,
        meio,
        quantidade: eventos.length,
        tipos: [...new Set(eventos.map((e) => e.tipo))],
        ids_evento: eventos.slice(0, 20).map((e) => e.idEvento),
      },
    });

  const qConfig = useConfigAutarquia();
  const qFichas = useFichasESocial(folhaId, open);
  const config = qConfig.data;
  const fichas = qFichas.data;
  const carregando = qConfig.isLoading || qFichas.isLoading;
  const erroConsulta = qConfig.isError || qFichas.isError;
  const leituraIncompleta = fichas ? faltaFichas(fichas.length, quantidadeServidores) : null;
  const { data: diaPagamento } = useDiaPagamentoFolha(open);
  const { data: eventosExistentes } = useEventosESocialFolha(open ? folhaId : undefined);
  const gravarEventos = useGravarEventosESocial();

  // Ambiente lido da configuração (Configurações da Folha → eSocial); sem configuração, não gera.
  const ambiente = ambienteESocial(config?.esocial_ambiente);

  // Data de pagamento (dtPgto do S-1210): sugere o dia de pagamento da configuração de fechamento no mês da competência.
  const [dataSugerida, setDataSugerida] = useState(false);
  useEffect(() => {
    if (!open || dataSugerida || !diaPagamento) return;
    setDataPagamento(dataPagamentoNaCompetencia(ano, mes, diaPagamento));
    setDataSugerida(true);
  }, [open, dataSugerida, diaPagamento, ano, mes]);

  // O S-1299 gerado aqui é o da competência: pagamento fora do mês da competência pediria o S-1299 do mês do
  // pagamento (S-1210 é apurado pelo mês do pagamento), que esta tela ainda não gera. Bloqueia com explicação.
  const pagamentoForaDaCompetencia =
    /^\d{4}-\d{2}-\d{2}$/.test(dataPagamento) && dataPagamento.substring(0, 7) !== formatarPeriodo(ano, mes);

  const handleGerarEventos = async () => {
    if (!podeProcessar) {
      toast.error("Gerar eventos do eSocial exige a permissão de processar a folha.");
      return;
    }
    if (!folhaFechada) {
      toast.error("Feche a folha antes de gerar os eventos do eSocial.");
      return;
    }
    if (!config || !fichas) {
      toast.error("Dados incompletos para geração");
      return;
    }
    if (leituraIncompleta) {
      toast.error(leituraIncompleta);
      return;
    }
    if (!ambiente) {
      toast.error("Escolha o ambiente do eSocial em Configurações da Folha.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPagamento)) {
      toast.error("Informe a data de pagamento da folha.");
      return;
    }
    if (pagamentoForaDaCompetencia) {
      toast.error("A data de pagamento precisa estar no mês da competência.");
      return;
    }

    setGerando(true);
    setEventosGerados([]);
    setErrosGravacao([]);

    try {
      const competenciaFormatada = formatarPeriodo(ano, mes);
      // S-1210 é apurado pelo mês do pagamento (dtPgto dentro de perApur; conferir no leiaute S-1.3).
      const periodoPagamento = dataPagamento.substring(0, 7);
      const eventos: EventoGerado[] = [];
      const cnpjLimpo = config.cnpj.replace(/\D/g, "");
      const cnpjRaiz = cnpjLimpo.substring(0, 8);

      // Ordem estável (matrícula, depois id da ficha): gerar de novo produz a mesma sequência
      const fichasOrdenadas = [...fichas].sort(
        (a, b) =>
          (a.servidor?.matricula ?? "").localeCompare(b.servidor?.matricula ?? "", "pt-BR", { numeric: true }) ||
          a.id.localeCompare(b.id),
      );

      // Gerar S-1200 e S-1210 para cada servidor
      let sequencial = 1;
      for (const ficha of fichasOrdenadas) {
        if (!ficha.servidor) continue;

        const trabalhador: DadosTrabalhador = {
          cpf: ficha.servidor.cpf || "",
          pis: ficha.servidor.pis_pasep || "",
          nome: ficha.servidor.nome_completo || "",
          matricula: ficha.servidor.matricula || "",
          // Pendente (onda G): categoria fixa 101; estatutário e comissionado são 3xx (conferir), sem cadastro no vínculo.
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
        // ideDmDev estável (até 30 caracteres): derivado do id da ficha, liga o S-1200 ao S-1210 da mesma ficha
        const idDemonstativo = ficha.id.replace(/-/g, "").slice(0, 30);

        // Construir evento S-1200
        const eventoS1200: EventoS1200Xml = {
          ideEvento: {
            indRetif: 1,
            perApur: competenciaFormatada,
            tpAmb: ambiente,
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
                    codLotacao: "001", // Pendente (onda G): lotação tributária fixa, sem S-1020
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
          servidorId: ficha.servidor.id,
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
            perApur: periodoPagamento,
            tpAmb: ambiente,
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
                dtPgto: dataPagamento,
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
          servidorId: ficha.servidor.id,
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
          tpAmb: ambiente,
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
        servidorId: null,
        json: JSON.stringify(eventoS1299, null, 2),
        xml: xmlS1299,
        idEvento: idEventoS1299,
        erros: validacaoS1299.erros,
        xmlValido: validacaoS1299.valido,
      });

      // Gravar no banco (um a um, conferindo o erro). Já existente (índice único): mostra o gravado, sem duplicar.
      const resultados = await gravarEventos(folhaId, { ano, mes }, eventos);
      const finais: EventoGerado[] = eventos.map((ev, i) => {
        const r = resultados[i];
        if (r.situacao === "gravado") return { ...ev, situacao: "gravado" };
        if (r.situacao === "erro") return { ...ev, situacao: "erro", mensagemGravacao: r.mensagem };
        const existente: EventoExistente | null = r.existente;
        return {
          ...ev,
          situacao: "existente",
          idEvento: existente?.id_evento || ev.idEvento,
          xml: existente?.payload_xml ?? "",
          json: existente ? JSON.stringify(existente.payload, null, 2) : "",
          erros: [],
          xmlValido: !!existente?.payload_xml,
          mensagemGravacao: existente ? undefined : "Já existe na folha, mas não foi possível ler o gravado.",
        };
      });
      const falhas = [...new Set(finais.filter((e) => e.situacao === "erro").map((e) => e.mensagemGravacao ?? ""))];
      const novos = finais.filter((e) => e.situacao === "gravado").length;
      const existentes = finais.filter((e) => e.situacao === "existente").length;

      setErrosGravacao(falhas);
      // Nada gravado nem existente (ex.: o banco recusou a folha): só o erro na tela, sem eventos para baixar.
      setEventosGerados(novos + existentes > 0 ? finais : []);

      if (falhas.length > 0) toast.error(`Eventos não gravados: ${falhas[0]}`);
      if (novos + existentes > 0) {
        toast.success(
          `${novos} evento(s) gravado(s) como rascunho${existentes ? `; ${existentes} já existia(m) e não foram duplicados` : ""}.`,
        );
      }
    } catch (error: unknown) {
      console.error("Erro ao gerar eventos:", error);
      toast.error("Erro ao gerar eventos eSocial");
    } finally {
      setGerando(false);
    }
  };

  const handleCopiar = async (conteudo: string, tipo: string, evento: EventoGerado) => {
    if (!(await registrarSaidaESocial("export", [evento], `copiado (${tipo})`))) return;
    try {
      await navigator.clipboard.writeText(conteudo);
      toast.success(`${tipo} copiado!`);
    } catch (erro) {
      console.error("Erro ao copiar para a área de transferência:", erro);
      toast.error(`Não foi possível copiar o ${tipo}. Use o botão de baixar.`);
    }
  };

  const handleDownloadXml = async (evento: EventoGerado) => {
    if (!podeSair(evento)) return;
    if (!(await registrarSaidaESocial("download", [evento], "baixado (XML, rascunho)"))) return;
    downloadXml(evento.xml, nomeArquivoEventoESocial(evento.tipo, evento.idEvento, ano, mes));
    toast.success("XML (rascunho) baixado!");
  };

  const handleDownloadTodosXml = async () => {
    const disponiveis = eventosGerados.filter(podeSair);
    if (disponiveis.length === 0) return;
    if (!(await registrarSaidaESocial("download", disponiveis, "baixados (XML, todos, rascunho)"))) return;
    // Download individual de cada XML
    for (const evento of disponiveis) {
      downloadXml(evento.xml, nomeArquivoEventoESocial(evento.tipo, evento.idEvento, ano, mes));
    }
    toast.success(`${disponiveis.length} arquivos XML (rascunho) baixados!`);
  };

  const handleClose = () => {
    if (!gerando) {
      setEventosGerados([]);
      setErrosGravacao([]);
      setDataPagamento("");
      setDataSugerida(false);
      onOpenChange(false);
    }
  };

  const eventosS1200 = eventosGerados.filter((e) => e.tipo === "S-1200");
  const eventosS1210 = eventosGerados.filter((e) => e.tipo === "S-1210");
  const eventosS1299 = eventosGerados.filter((e) => e.tipo === "S-1299");

  const renderEvento = (evento: EventoGerado, idx: number) => (
    <div key={idx} className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{evento.servidorNome || "Fechamento da Competência"}</span>
          {evento.situacao === "existente" && (
            <Badge variant="secondary" title="Gerar de novo não duplica: este é o evento já gravado na folha">
              Já existia — mostrando o gravado
            </Badge>
          )}
          {evento.situacao === "erro" && <Badge variant="destructive">Não gravado</Badge>}
          {evento.situacao !== "erro" &&
            (evento.xmlValido ? (
              <Badge variant="outline" className="text-success border-success">
                XML com estrutura básica
              </Badge>
            ) : (
              <Badge variant="destructive">Pendências</Badge>
            ))}
        </div>
        <div className="flex items-center gap-1">
          {evento.erros.length > 0 && (
            <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded mr-2">
              {evento.erros.length} pendência(s)
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopiar(formatoVisualizacao === "xml" ? evento.xml : evento.json, formatoVisualizacao.toUpperCase(), evento)}
            title="Copiar"
            disabled={!podeSair(evento)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadXml(evento)}
            title={evento.situacao === "existente" ? "Baixar o evento já gravado (rascunho)" : "Baixar XML (rascunho)"}
            disabled={!podeSair(evento)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {evento.mensagemGravacao && (
        <div className="text-sm text-destructive mb-2 bg-destructive/10 p-2 rounded">{evento.mensagemGravacao}</div>
      )}

      {evento.erros.length > 0 && (
        <div className="text-sm text-warning mb-2 bg-warning/10 p-2 rounded">
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
            Gerar Eventos eSocial (XML v. S-1.3) — rascunho
          </DialogTitle>
          <DialogDescription>
            Competência: <strong>{competencia}</strong> | Ambiente:{" "}
            <Badge variant={ambiente === 1 ? "default" : "secondary"}>
              {ambiente ? AMBIENTE_ESOCIAL_LABELS[ambiente] : "não configurado"}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Rascunho, não transmitido</AlertTitle>
            <AlertDescription>
              Este sistema ainda não assina nem envia eventos ao eSocial. Os XML gerados aqui são rascunho para
              conferência: não valem como envio, saem com "RASCUNHO_NAO_TRANSMITIDO" no nome do arquivo e com o
              comentário "RASCUNHO NAO TRANSMITIDO" dentro do XML.
            </AlertDescription>
          </Alert>

          {!folhaFechada && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Folha não fechada</AlertTitle>
              <AlertDescription>
                Os eventos do eSocial só podem ser gerados com a folha fechada. Feche a folha e volte aqui.
              </AlertDescription>
            </Alert>
          )}

          {!podeProcessar && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Sem permissão</AlertTitle>
              <AlertDescription>
                Gerar e baixar eventos do eSocial exige a permissão de processar a folha (financeiro.folha.processar).
              </AlertDescription>
            </Alert>
          )}

          {erroConsulta && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar os dados</AlertTitle>
              <AlertDescription>
                Falhou a leitura da configuração ou das fichas da folha. Feche e abra de novo; se continuar, verifique
                seu acesso.
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

          {config?.cnpj && !ambiente && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ambiente do eSocial não configurado</AlertTitle>
              <AlertDescription>
                Escolha o ambiente (produção ou produção restrita) em Configurações da Folha antes de gerar.
              </AlertDescription>
            </Alert>
          )}

          {errosGravacao.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Eventos não gravados</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-0.5">
                  {errosGravacao.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
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
                em XML no leiaute v. S-1.3, como rascunho.
              </p>
              {(eventosExistentes?.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Esta folha já tem {eventosExistentes?.length} evento(s) gravado(s). Gerar de novo não duplica: os
                  que já existem aparecem como estão gravados, para baixar.
                </p>
              )}
              <div className="mx-auto mt-4 max-w-xs space-y-1 text-left">
                <Label htmlFor="esocial-data-pagamento">Data de pagamento (S-1210)</Label>
                <Input
                  id="esocial-data-pagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {diaPagamento
                    ? `Sugerida pelo dia de pagamento da configuração de fechamento (dia ${diaPagamento}).`
                    : "Sem dia de pagamento na configuração de fechamento: informe a data."}
                </p>
                {pagamentoForaDaCompetencia && (
                  <p className="text-xs text-destructive">
                    A data precisa estar no mês da competência ({competencia}). Pagamento em outro mês pediria o
                    fechamento (S-1299) do mês do pagamento, que esta tela ainda não gera.
                  </p>
                )}
              </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTodosXml}
                  disabled={!eventosGerados.some(podeSair)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Todos XML ({eventosGerados.filter(podeSair).length})
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
            <Button
              onClick={handleGerarEventos}
              disabled={
                gerando ||
                !podeProcessar ||
                carregando ||
                erroConsulta ||
                !!leituraIncompleta ||
                !folhaFechada ||
                !config?.cnpj ||
                !ambiente ||
                !dataPagamento ||
                pagamentoForaDaCompetencia
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
