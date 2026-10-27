/**
 * Ficha do contrato (entrega C1): abas Dados, Itens, Responsáveis (gestor e fiscais) e Histórico, e a ficha em PDF.
 * Editar exige contratos.editar; apagar só rascunho, também com editar (o banco confere as duas coisas).
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md
 */

import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Copy, FileDown, Pencil, Plane, Trash2 } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { ContratoFormDialog } from "@/components/contratos/ContratoFormDialog";
import { HistoricoContratoTab } from "@/components/contratos/HistoricoContratoTab";
import { ItensContratoTab } from "@/components/contratos/ItensContratoTab";
import { ResponsaveisContratoTab } from "@/components/contratos/ResponsaveisContratoTab";
import { SeloVigencia } from "@/components/contratos/SeloVigencia";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  useContrato,
  useExcluirContrato,
  useItensContrato,
  useProcessosContratacao,
  useResponsaveisContrato,
  useSalvarContrato,
} from "@/hooks/useContratos";
import { useToast } from "@/hooks/use-toast";
import { montarFichaContrato } from "@/lib/contratos/ficha";
import { emVigor } from "@/lib/contratos/lista";
import { situacaoVigencia, tomSituacaoContrato } from "@/lib/contratos/vigencia";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { nomeContratado, rotuloSituacaoContrato, rotuloTipoContrato, type ContratoFicha } from "@/types/contratos";

const ABAS = ["dados", "itens", "responsaveis", "historico"] as const;

function Campo({ rotulo, children, largo }: { rotulo: string; children: React.ReactNode; largo?: boolean }) {
  return (
    <div className={largo ? "space-y-1 sm:col-span-2 lg:col-span-3" : "space-y-1"}>
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="whitespace-pre-line text-sm">{children}</dd>
    </div>
  );
}

function Dados({ c, processoContratacao }: { c: ContratoFicha; processoContratacao?: string }) {
  const prorrogado = c.data_fim_atual && c.data_fim_atual !== c.data_fim;
  return (
    <Card>
      <CardContent className="pt-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Contratado">
            {c.fornecedor?.razao_social ?? "—"}
            {c.fornecedor?.cpf_cnpj && <span className="block text-muted-foreground">{c.fornecedor.cpf_cnpj}</span>}
          </Campo>
          <Campo rotulo="Tipo">{c.tipo_contrato ? rotuloTipoContrato(c.tipo_contrato) : "—"}</Campo>
          <Campo rotulo="Setor que pediu">{c.unidade ? [c.unidade.sigla, c.unidade.nome].filter(Boolean).join(" · ") : "—"}</Campo>
          <Campo rotulo="Objeto" largo>{c.objeto}</Campo>
          <Campo rotulo="Modalidade e fundamento">{c.fundamento_legal ?? "—"}</Campo>
          <Campo rotulo="Processo SEI">{c.processo_sei ?? "—"}</Campo>
          <Campo rotulo="Processo de contratação">{processoContratacao ?? (c.processo_licitatorio_id ? "ligado (sem acesso a Compras)" : "—")}</Campo>
          <Campo rotulo="Nº no PNCP">{c.numero_pncp ?? "—"}</Campo>
          <Campo rotulo="Valor inicial"><span className="tabular-nums">{formatCurrency(Number(c.valor_inicial))}</span></Campo>
          <Campo rotulo="Valor atual"><span className="tabular-nums">{formatCurrency(Number(c.valor_atual))}</span></Campo>
          <Campo rotulo="Assinatura">{formatDateBR(c.data_assinatura)}</Campo>
          <Campo rotulo="Vigência">
            {formatDateBR(c.data_inicio)} a {formatDateBR(c.data_fim)}
            {prorrogado && <span className="block text-muted-foreground">prorrogada até {formatDateBR(c.data_fim_atual)}</span>}
          </Campo>
          <Campo rotulo="Prorrogação">
            {c.prorrogavel ? `Pode ser prorrogado${c.prazo_maximo_meses ? `, até ${c.prazo_maximo_meses} meses no total` : ""}` : "Não prorrogável"}
          </Campo>
          <Campo rotulo="Natureza da despesa">{c.natureza_despesa ?? "—"}</Campo>
          <Campo rotulo="Dotação e fonte">{[c.dotacao_orcamentaria, c.fonte_recurso && `fonte ${c.fonte_recurso}`].filter(Boolean).join(" · ") || "—"}</Campo>
          <Campo rotulo="Publicação no DOE">
            {c.data_publicacao_doe ? `${formatDateBR(c.data_publicacao_doe)}${c.numero_doe ? ` (DOE nº ${c.numero_doe})` : ""}` : "ainda não registrada"}
          </Campo>
          <Campo rotulo="Garantia">
            {c.garantia_tipo
              ? [c.garantia_tipo, c.garantia_valor !== null ? formatCurrency(Number(c.garantia_valor)) : null, c.garantia_vencimento && `vence em ${formatDateBR(c.garantia_vencimento)}`].filter(Boolean).join(" · ")
              : "—"}
          </Campo>
          {c.observacoes && <Campo rotulo="Observações" largo>{c.observacoes}</Campo>}
        </dl>
      </CardContent>
    </Card>
  );
}

export default function ContratoFichaPage() {
  const { id } = useParams();
  const [busca] = useSearchParams();
  const aba = ABAS.find((a) => a === busca.get("aba")) ?? "dados";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission, hasAnyPermission, user } = useAuth();
  const podeEditar = hasPermission("contratos.editar");
  const vePassagens = hasAnyPermission(["contratos.passagens.visualizar", "contratos.passagens.editar", "contratos.passagens.financeiro"]);
  const podeGravarLigados = podeEditar || hasPermission("contratos.criar");
  const contrato = useContrato(id);
  const itens = useItensContrato(id);
  const responsaveis = useResponsaveisContrato(id);
  const c = contrato.data;
  const processos = useProcessosContratacao(!!c?.processo_licitatorio_id);
  const salvar = useSalvarContrato();
  const excluir = useExcluirContrato();
  const [editando, setEditando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const processo = processos.data?.find((p) => p.id === c?.processo_licitatorio_id);
  const processoContratacao = processo ? `${processo.numero_processo} · ${processo.objeto_resumido ?? processo.objeto}` : undefined;
  const vigencia = c ? situacaoVigencia(c) : null;

  const copiarSei = async () => {
    if (!c?.processo_sei) return;
    try {
      await navigator.clipboard.writeText(c.processo_sei);
      toast({ title: "Nº do processo SEI copiado" });
    } catch {
      toast({ title: "Não foi possível copiar", description: c.processo_sei, variant: "destructive" });
    }
  };

  const baixarFicha = async () => {
    if (!c) return;
    setGerandoPdf(true);
    try {
      const { baixarDocumento, emitirDocumento } = await import("@/lib/documentos");
      const quem = user?.fullName ?? user?.email ?? undefined;
      const dados = montarFichaContrato(c, itens.data ?? [], responsaveis.data ?? [], processoContratacao);
      baixarDocumento(await emitirDocumento("contratos-ficha-contrato", dados, { emitidoPor: quem }));
    } catch {
      toast({ title: "Não foi possível gerar o PDF", description: "Tente de novo em instantes.", variant: "destructive" });
    } finally {
      setGerandoPdf(false);
    }
  };

  let conteudo: React.ReactNode;
  if (contrato.isLoading) {
    conteudo = <Skeleton className="h-64" />;
  } else if (contrato.isError) {
    conteudo = <EmptyState titulo="Não foi possível carregar o contrato" acao={<Button variant="outline" onClick={() => contrato.refetch()}>Tentar novamente</Button>} />;
  } else if (!c) {
    conteudo = <EmptyState titulo="Contrato não encontrado" acao={<Button asChild variant="outline"><Link to="/contratos/lista">Voltar à lista</Link></Button>} />;
  } else {
    conteudo = (
      <div className="space-y-4">
        {c.controla_passagens && vePassagens && (
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Este contrato controla as passagens aéreas: pedidos, bilhetes, faturas e saldo ficam em Passagens.</p>
              <Button variant="outline" asChild>
                <Link to="/contratos/passagens/faturas">
                  <Plane className="h-4 w-4" aria-hidden="true" />
                  Passagens e saldo
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Tabs defaultValue={aba}>
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="responsaveis">Gestor e fiscais</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="mt-4">
            <Dados c={c} processoContratacao={processoContratacao} />
          </TabsContent>
          <TabsContent value="itens" className="mt-4">
            <ItensContratoTab contratoId={c.id} valorContrato={Number(c.valor_atual)} podeGravar={podeGravarLigados} podeApagar={podeEditar} />
          </TabsContent>
          <TabsContent value="responsaveis" className="mt-4">
            <ResponsaveisContratoTab contratoId={c.id} podeGravar={podeGravarLigados} avisarFalta={!!vigencia && emVigor(vigencia)} />
          </TabsContent>
          <TabsContent value="historico" className="mt-4">
            <HistoricoContratoTab contratoId={c.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        <PageHeader
          titulo={c ? `Contrato ${c.numero_contrato}/${c.ano}` : "Contrato"}
          descricao={c ? `${c.objeto_resumido || c.objeto} · ${nomeContratado(c.fornecedor)}` : undefined}
          migalhas={[
            { rotulo: "Contratos", href: "/contratos" },
            { rotulo: "Lista", href: "/contratos/lista" },
            { rotulo: c ? `${c.numero_contrato}/${c.ano}` : "Contrato" },
          ]}
          status={c && vigencia && (
            <span className="flex flex-wrap gap-2">
              <StatusBadge tom={tomSituacaoContrato(c.status)} icone={false}>{rotuloSituacaoContrato(c.status)}</StatusBadge>
              {vigencia.faixa !== "rascunho" && vigencia.faixa !== "encerrado" && <SeloVigencia situacao={vigencia} />}
            </span>
          )}
          acoes={
            c ? (
              <>
                {c.processo_sei && (
                  <Button variant="outline" onClick={copiarSei}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copiar nº SEI
                  </Button>
                )}
                <Button variant="outline" onClick={baixarFicha} disabled={gerandoPdf || itens.isLoading || responsaveis.isLoading}>
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  Ficha (PDF)
                </Button>
                {podeEditar && c.status === "rascunho" && (
                  <Button variant="outline" onClick={() => setApagando(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Apagar rascunho
                  </Button>
                )}
                {podeEditar && (
                  <Button onClick={() => setEditando(true)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Editar
                  </Button>
                )}
              </>
            ) : undefined
          }
        />
        {conteudo}
      </div>

      {c && (
        <>
          <ContratoFormDialog
            open={editando}
            onOpenChange={setEditando}
            contrato={c}
            salvando={salvar.isPending}
            onSalvar={(dados) => salvar.mutateAsync(dados)}
          />
          <AlertDialog open={apagando} onOpenChange={setApagando}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar o rascunho {c.numero_contrato}/{c.ano}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Some da lista com os itens e as designações. Só rascunho pode ser apagado; contrato assinado se encerra ou rescinde.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={excluir.isPending}
                  onClick={async () => {
                    try {
                      await excluir.mutateAsync(c.id);
                      navigate("/contratos/lista");
                    } catch {
                      // erro já exibido pelo toast da mutation
                    }
                  }}
                >
                  Apagar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </ModuleLayout>
  );
}
