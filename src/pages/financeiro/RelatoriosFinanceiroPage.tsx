/**
 * GERADOR DE RELATÓRIOS (Financeiro → Relatórios)
 * O usuário monta o relatório: fonte, colunas, filtros, agrupamento, totais e ordem; vê a prévia na hora,
 * imprime em PDF (motor de documentos) ou baixa a planilha, e salva o modelo (só seu ou do setor).
 * Spec: docs/superpowers/specs/2026-10-30-gerador-relatorios-design.md
 */

import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Save, TableProperties } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { ListaModelos } from "@/components/relatorios-dinamicos/ListaModelos";
import { MontagemRelatorio } from "@/components/relatorios-dinamicos/MontagemRelatorio";
import { PreviaRelatorio } from "@/components/relatorios-dinamicos/PreviaRelatorio";
import { SalvarModeloDialog, type DadosSalvarModelo } from "@/components/relatorios-dinamicos/SalvarModeloDialog";
import { FONTES_RELATORIO, MODELOS_PRONTOS, fontePorId, type ModeloPronto } from "@/config/relatoriosDinamicos";
import { LimiteDeLinhasError, TETO_LINHAS } from "@/config/relatoriosDinamicos/carregar";
import { useAuth } from "@/contexts/AuthContext";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { useToast } from "@/hooks/use-toast";
import {
  useExcluirModeloRelatorio,
  useLinhasFonte,
  useModelosRelatorio,
  useSalvarModeloRelatorio,
  type ModeloRelatorio,
} from "@/hooks/useRelatoriosDinamicos";
import { baixarDocumento, emitirDocumento } from "@/lib/documentos";
import { exportarLinhasParaExcel } from "@/export/exportExcel";
import { configPadrao, montarRelatorio, orientacaoEfetiva, sanearConfig } from "@/lib/relatoriosDinamicos/montar";
import { descreverFiltros, estadoDosFiltros, filtrarLinhas, filtrosDaFonte } from "@/lib/relatoriosDinamicos/filtros";
import { nomeDoArquivo, paraPdf, paraPlanilha } from "@/lib/relatoriosDinamicos/exportar";
import type { ConfigRelatorio } from "@/lib/relatoriosDinamicos/tipos";

const MODULO = "financeiro";

/** Modelo aberto: pronto (do sistema) ou salvo no banco. */
type ModeloAberto = { tipo: "pronto"; id: string; nome: string } | { tipo: "salvo"; modelo: ModeloRelatorio } | null;

export default function RelatoriosFinanceiroPage() {
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const fontes = useMemo(() => FONTES_RELATORIO.filter((f) => f.modulo === MODULO && (!f.permissao || hasPermission(f.permissao))), [hasPermission]);
  const [config, setConfig] = useState<ConfigRelatorio>(() => configPadrao(fontes[0] ?? FONTES_RELATORIO[0]));
  const [aberto, setAberto] = useState<ModeloAberto>(null);
  const [salvarAberto, setSalvarAberto] = useState(false);
  const [paraApagar, setParaApagar] = useState<ModeloRelatorio | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const fonte = fontePorId(config.fonte) ?? fontes[0];
  const linhasFonte = useLinhasFonte(fonte, exercicio);
  const modelos = useModelosRelatorio(MODULO);
  const salvarModelo = useSalvarModeloRelatorio();
  const excluirModelo = useExcluirModeloRelatorio();

  // Sem permissão para a fonte do modelo aberto (ou fonte que saiu do catálogo): volta para a primeira.
  useEffect(() => {
    if (fonte && !fontes.some((f) => f.id === fonte.id) && fontes[0]) setConfig(configPadrao(fontes[0]));
  }, [fonte, fontes]);

  const definicoes = useMemo(() => (fonte ? filtrosDaFonte(fonte) : []), [fonte]);
  const linhas = useMemo(() => linhasFonte.data ?? [], [linhasFonte.data]);
  const estadoFiltros = useMemo(() => estadoDosFiltros(definicoes, config.filtros), [definicoes, config.filtros]);
  const filtradas = useMemo(() => filtrarLinhas(linhas, definicoes, estadoFiltros), [linhas, definicoes, estadoFiltros]);
  const resultado = useMemo(() => (fonte ? montarRelatorio(fonte, config, filtradas) : null), [fonte, config, filtradas]);
  const descricaoFiltros = useMemo(() => descreverFiltros(definicoes, estadoFiltros), [definicoes, estadoFiltros]);

  if (!fonte) {
    return (
      <ModuleLayout module="financeiro">
        <EmptyState titulo="Nenhuma fonte disponível" descricao="Seu perfil não tem acesso a nenhuma lista do Financeiro que o gerador use." />
      </ModuleLayout>
    );
  }

  const trocarFonte = (id: string) => {
    const nova = fontePorId(id);
    if (!nova) return;
    setConfig(configPadrao(nova));
    setAberto(null);
  };

  const abrir = (bruta: unknown, fonteId: string, modelo: ModeloAberto) => {
    const alvo = fontes.find((f) => f.id === fonteId);
    if (!alvo) {
      toast({ title: "Sem acesso a esta fonte", description: "O modelo usa uma lista que o seu perfil não vê.", variant: "destructive" });
      return;
    }
    const { config: c, ignoradas } = sanearConfig(alvo, bruta);
    setConfig(c);
    setAberto(modelo);
    if (ignoradas.length > 0)
      toast({ title: "Modelo aberto com ajustes", description: `Saíram itens que não existem mais: ${ignoradas.join(", ")}.` });
  };
  const abrirPronto = (m: ModeloPronto) => abrir(m.config, m.config.fonte, { tipo: "pronto", id: m.id, nome: m.nome });
  const abrirSalvo = (m: ModeloRelatorio) => abrir(m.configuracao, m.fonte, { tipo: "salvo", modelo: m });

  const meuModeloAberto = aberto?.tipo === "salvo" && aberto.modelo.criado_por === user?.id ? aberto.modelo : null;

  const salvar = (d: DadosSalvarModelo) => {
    salvarModelo.mutate(
      {
        id: d.atualizar && meuModeloAberto ? meuModeloAberto.id : undefined,
        modulo: MODULO,
        nome: d.nome,
        descricao: d.descricao,
        compartilhado: d.compartilhado,
        config: { ...config, filtros: estadoFiltros },
      },
      {
        onSuccess: (m) => {
          setAberto({ tipo: "salvo", modelo: m });
          setSalvarAberto(false);
          toast({ title: "Modelo salvo", description: m.compartilhado ? "Compartilhado com o setor." : "Só você vê este modelo." });
        },
        onError: (e) => toast({ title: "Não deu para salvar o modelo", description: (e as Error).message, variant: "destructive" }),
      },
    );
  };

  const apagar = () => {
    if (!paraApagar) return;
    excluirModelo.mutate(paraApagar, {
      onSuccess: () => {
        if (aberto?.tipo === "salvo" && aberto.modelo.id === paraApagar.id) setAberto(null);
        toast({ title: "Modelo apagado" });
      },
      onError: (e) => toast({ title: "Não deu para apagar", description: (e as Error).message, variant: "destructive" }),
      onSettled: () => setParaApagar(null),
    });
  };

  const gerarPdf = async () => {
    if (!resultado) return;
    setGerandoPdf(true);
    try {
      const dados = paraPdf(fonte, config, resultado, descricaoFiltros);
      const tipo = orientacaoEfetiva(config) === "paisagem" ? "relatorios-gerador-paisagem" : "relatorios-gerador";
      baixarDocumento(await emitirDocumento(tipo, dados, { emitidoPor: user?.fullName ?? user?.email }));
    } catch (e) {
      toast({ title: "Não deu para gerar o PDF", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGerandoPdf(false);
    }
  };

  const baixarPlanilha = () => {
    if (!resultado) return;
    const p = paraPlanilha(fonte, config, resultado, descricaoFiltros);
    exportarLinhasParaExcel(p.linhas, nomeDoArquivo(config.titulo || fonte.rotulo, "xlsx"), {
      colunasMoeda: p.colunasMoeda,
      linhaCabecalho: p.linhaCabecalho,
    });
  };

  const selecionado = aberto?.tipo === "pronto" ? `pronto:${aberto.id}` : aberto?.tipo === "salvo" ? aberto.modelo.id : null;
  const nomeAberto = aberto?.tipo === "pronto" ? aberto.nome : aberto?.tipo === "salvo" ? aberto.modelo.nome : null;
  const semColunas = config.colunas.length === 0;
  const erro = linhasFonte.error as Error | null;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Relatórios" }]}
          titulo="Gerador de relatórios"
          descricao={`Monte o relatório do exercício ${exercicio}: escolha a fonte, as colunas, os filtros e os totais, veja a prévia e imprima ou baixe a planilha.`}
          acoes={<SeletorExercicio />}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3">Modelos</CardTitle>
              </CardHeader>
              <CardContent>
                <ListaModelos
                  prontos={MODELOS_PRONTOS.filter((m) => fontes.some((f) => f.id === m.config.fonte))}
                  salvos={(modelos.data ?? []).filter((m) => fontes.some((f) => f.id === m.fonte))}
                  carregando={modelos.isLoading}
                  usuarioId={user?.id}
                  podeApagarDeOutros={isSuperAdmin}
                  selecionado={selecionado}
                  aoAbrirPronto={abrirPronto}
                  aoAbrirSalvo={abrirSalvo}
                  aoApagar={setParaApagar}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3">{nomeAberto ? `Montar: ${nomeAberto}` : "Montar relatório"}</CardTitle>
              </CardHeader>
              <CardContent>
                <MontagemRelatorio
                  fontes={fontes}
                  fonte={fonte}
                  aoTrocarFonte={trocarFonte}
                  config={config}
                  aoMudar={setConfig}
                  definicoesFiltro={definicoes}
                  linhas={linhas}
                />
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="flex flex-col gap-3 space-y-0 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle className="text-h3">Prévia</CardTitle>
                  {resultado && !linhasFonte.isLoading && (
                    <p className="text-caption text-muted-foreground" aria-live="polite">
                      {resultado.quantidade.toLocaleString("pt-BR")} de {linhas.length.toLocaleString("pt-BR")} registros
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={gerarPdf} disabled={!resultado || semColunas || gerandoPdf || linhasFonte.isLoading}>
                    <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                    {gerandoPdf ? "Gerando…" : "Imprimir PDF"}
                  </Button>
                  <Button variant="outline" onClick={baixarPlanilha} disabled={!resultado || semColunas || linhasFonte.isLoading}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
                    Baixar Excel
                  </Button>
                  <Button variant="outline" onClick={() => setSalvarAberto(true)} disabled={semColunas}>
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    Salvar modelo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {linhasFonte.isLoading ? (
                  <div className="space-y-2" aria-label="Carregando os dados">
                    {Array.from({ length: 6 }, (_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : erro ? (
                  <EmptyState
                    titulo={erro instanceof LimiteDeLinhasError ? "Lista grande demais" : "Não deu para ler os dados"}
                    descricao={
                      erro instanceof LimiteDeLinhasError
                        ? `Esta fonte tem mais de ${TETO_LINHAS.toLocaleString("pt-BR")} linhas no exercício. Fale com o suporte para ampliar o limite.`
                        : erro.message
                    }
                    acao={
                      <Button variant="outline" onClick={() => linhasFonte.refetch()}>
                        Tentar de novo
                      </Button>
                    }
                  />
                ) : semColunas ? (
                  <EmptyState icone={TableProperties} titulo="Nenhuma coluna marcada" descricao="Marque as colunas no passo 2." />
                ) : linhas.length === 0 ? (
                  <EmptyState
                    icone={TableProperties}
                    titulo="Sem dados nesta fonte"
                    descricao={`Nada de ${fonte.rotulo} no exercício ${exercicio}. Confira se o relatório já foi importado em Financeiro → Atualizar dados.`}
                  />
                ) : resultado && resultado.quantidade === 0 ? (
                  <EmptyState icone={TableProperties} titulo="Nenhum registro com estes filtros" descricao="Tire ou mude algum filtro no passo 3." />
                ) : resultado ? (
                  <PreviaRelatorio resultado={resultado} />
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SalvarModeloDialog
        aberto={salvarAberto}
        aoFechar={() => setSalvarAberto(false)}
        inicial={{
          nome: meuModeloAberto?.nome ?? (config.titulo || fonte.rotulo),
          descricao: meuModeloAberto?.descricao ?? "",
          compartilhado: meuModeloAberto?.compartilhado ?? false,
        }}
        podeAtualizar={Boolean(meuModeloAberto)}
        salvando={salvarModelo.isPending}
        aoSalvar={salvar}
      />

      <AlertDialog open={Boolean(paraApagar)} onOpenChange={(v) => !v && setParaApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar o modelo “{paraApagar?.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {paraApagar?.compartilhado ? "Ele some também para o setor. " : ""}Os dados não são afetados; só a montagem é apagada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={apagar}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
