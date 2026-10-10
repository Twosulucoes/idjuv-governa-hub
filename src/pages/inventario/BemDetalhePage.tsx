/**
 * DETALHE DO BEM PATRIMONIAL
 * Visualização completa de um bem específico — layout modernizado com abas
 * Padrões do design system: PageHeader, KpiCard, StatusBadge, EmptyState.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Package, ArrowLeft, Edit, MapPin, User, Calendar, 
  Hash, Tag, Wrench, FileText, Clock, Building2, 
  DollarSign, QrCode, Shield, Truck,
  Info, History, Image as ImageIcon, Printer
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, KpiCard, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { useBemPatrimonial, useHistoricoPatrimonio } from "@/hooks/usePatrimonio";
import { motion } from "framer-motion";
import { gerarQrDataUrl, imprimirEtiquetas } from "@/lib/etiquetasPatrimonio";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

function formatCurrency(value: number | null | undefined) {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  try {
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
  } catch {
    return date;
  }
}

// Situação do bem → rótulo e tom (status nunca só por cor: o selo tem ícone e texto)
const SITUACOES: Record<string, { label: string; tom: TomStatus }> = {
  cadastrado: { label: "Cadastrado", tom: "neutro" },
  tombado: { label: "Tombado", tom: "andamento" },
  alocado: { label: "Alocado", tom: "sucesso" },
  ativo: { label: "Ativo", tom: "sucesso" },
  em_uso: { label: "Em uso", tom: "sucesso" },
  disponivel: { label: "Disponível", tom: "andamento" },
  manutencao: { label: "Em manutenção", tom: "pendente" },
  em_manutencao: { label: "Em manutenção", tom: "pendente" },
  baixado: { label: "Baixado", tom: "erro" },
  extraviado: { label: "Extraviado", tom: "erro" },
  inservivel: { label: "Inservível", tom: "erro" },
};

const CONSERVACAO: Record<string, { label: string; tom: TomStatus }> = {
  otimo: { label: "Ótimo", tom: "sucesso" },
  bom: { label: "Bom", tom: "sucesso" },
  regular: { label: "Regular", tom: "pendente" },
  ruim: { label: "Ruim", tom: "erro" },
  inservivel: { label: "Inservível", tom: "erro" },
};

function rotuloLivre(valor: string) {
  const texto = valor.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function SituacaoBadge({ situacao }: { situacao: string | null }) {
  const valor = situacao || "cadastrado";
  const item = SITUACOES[valor.toLowerCase()];
  return <StatusBadge tom={item?.tom ?? "neutro"}>{item?.label ?? rotuloLivre(valor)}</StatusBadge>;
}

function ConservacaoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-muted-foreground">—</span>;
  const item = CONSERVACAO[estado.toLowerCase()];
  return <StatusBadge tom={item?.tom ?? "neutro"}>{item?.label ?? rotuloLivre(estado)}</StatusBadge>;
}

function InfoItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <motion.div {...fadeIn} className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-foreground">{children}</dd>
      </div>
    </motion.div>
  );
}

function DetailSkeleton() {
  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6" aria-busy="true" aria-label="Carregando dados do bem">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-80" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </ModuleLayout>
  );
}

interface BemParaEtiqueta {
  numero_patrimonio: string;
  descricao: string;
  codigo_qr?: string | null;
}

async function imprimirEtiquetaBem(bem: BemParaEtiqueta) {
  try {
    await imprimirEtiquetas([bem]);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Não foi possível imprimir a etiqueta.");
  }
}

/** QR Code do bem (conteúdo = codigo_qr ou número de tombamento) com botão de etiqueta. */
function EtiquetaQr({ bem }: { bem: BemParaEtiqueta }) {
  const conteudo = (bem.codigo_qr || bem.numero_patrimonio || "").trim();
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setQrUrl(null);
    if (!conteudo) return;
    gerarQrDataUrl(conteudo)
      .then((url) => {
        if (ativo) setQrUrl(url);
      })
      .catch((err: unknown) => console.error("Erro ao gerar QR Code:", err));
    return () => {
      ativo = false;
    };
  }, [conteudo]);

  if (!conteudo) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-3">
      {qrUrl ? (
        <img
          src={qrUrl}
          alt={`QR Code do bem ${bem.numero_patrimonio}`}
          className="h-36 w-36 rounded-md border bg-background p-1"
        />
      ) : (
        <Skeleton className="h-36 w-36" />
      )}
      <Button variant="outline" size="sm" onClick={() => imprimirEtiquetaBem(bem)}>
        <Printer className="w-4 h-4" aria-hidden="true" />
        Imprimir etiqueta
      </Button>
    </div>
  );
}

function TimelineEvent({ evento, isLast }: { evento: any; isLast: boolean }) {
  const iconMap: Record<string, LucideIcon> = {
    cadastro: Package,
    movimentacao: Truck,
    manutencao: Wrench,
    inventario: Shield,
  };
  const Icon = iconMap[evento.tipo_evento?.toLowerCase()] || Clock;

  return (
    <motion.div {...fadeIn} className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="pb-6 min-w-0 flex-1">
        <p className="text-sm font-medium">{evento.descricao || evento.tipo_evento || "Evento"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(evento.data_evento)}
          {evento.responsavel?.nome_completo && (
            <> · {evento.responsavel.nome_completo}</>
          )}
        </p>
        {evento.unidade_local?.nome_unidade && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {evento.unidade_local.nome_unidade}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function BemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: bem, isLoading, error } = useBemPatrimonial(id || "");
  const { data: historico, isLoading: loadingHistorico } = useHistoricoPatrimonio(id);

  if (isLoading) return <DetailSkeleton />;

  if (error || !bem) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="space-y-6">
          <PageHeader
            migalhas={[
              { rotulo: "Inventário", href: "/inventario" },
              { rotulo: "Bens", href: "/inventario/bens" },
              { rotulo: "Detalhe" },
            ]}
            titulo="Detalhe do bem"
          />
          <Card className="border-dashed">
            <EmptyState
              icone={Package}
              titulo="Bem não encontrado"
              descricao="O item solicitado não existe ou foi removido."
              acao={
                <Button asChild variant="outline">
                  <Link to="/inventario/bens">
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    Voltar à listagem
                  </Link>
                </Button>
              }
            />
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
        <PageHeader
          migalhas={[
            { rotulo: "Inventário", href: "/inventario" },
            { rotulo: "Bens", href: "/inventario/bens" },
            { rotulo: bem.numero_patrimonio || "Detalhe" },
          ]}
          midia={
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
          }
          titulo={bem.descricao}
          status={<SituacaoBadge situacao={bem.situacao} />}
          descricao={
            bem.numero_patrimonio ? (
              <span className="font-mono">
                Patrimônio {bem.numero_patrimonio}
                {bem.patrimonio_anterior && <> · Tombamento anterior {bem.patrimonio_anterior}</>}
              </span>
            ) : undefined
          }
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/inventario/bens">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {bem.numero_patrimonio && (
                <Button variant="outline" onClick={() => imprimirEtiquetaBem(bem)}>
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  Imprimir etiqueta
                </Button>
              )}
              <Button asChild>
                <Link to={`/inventario/bens/${bem.id}/editar`}>
                  <Edit className="w-4 h-4" aria-hidden="true" />
                  Editar
                </Link>
              </Button>
            </>
          }
        />

        {/* Resumo */}
        <section aria-label="Resumo do bem">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <li>
              <KpiCard rotulo="Valor de aquisição" icone={DollarSign} valor={formatCurrency(bem.valor_aquisicao)} className="h-full" />
            </li>
            <li>
              <KpiCard rotulo="Data de aquisição" icone={Calendar} valor={formatDate(bem.data_aquisicao)} className="h-full" />
            </li>
            <li>
              <KpiCard
                rotulo="Conservação"
                icone={Wrench}
                valor={<span className="block text-body"><ConservacaoBadge estado={bem.estado_conservacao} /></span>}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Categoria"
                icone={Tag}
                valor={<span className="block text-h3 capitalize">{bem.categoria_bem?.replace(/_/g, " ") || "—"}</span>}
                className="h-full"
              />
            </li>
          </ul>
        </section>

        {/* Tabs */}
        <section aria-label="Dados do bem">
          <Tabs defaultValue="geral" className="space-y-5">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="geral" className="text-xs sm:text-sm gap-1.5">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="localizacao" className="text-xs sm:text-sm gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Localização
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs sm:text-sm gap-1.5">
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm gap-1.5">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Documentos
              </TabsTrigger>
            </TabsList>

            {/* Tab: Geral */}
            <TabsContent value="geral" className="mt-0">
              <motion.div initial="initial" animate="animate" variants={stagger} className="grid md:grid-cols-2 gap-6">
                {/* Especificações Técnicas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Especificações Técnicas</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <InfoItem icon={Tag} label="Marca">{bem.marca || "—"}</InfoItem>
                    <InfoItem icon={Hash} label="Modelo">{bem.modelo || "—"}</InfoItem>
                    <InfoItem icon={Hash} label="Nº de Série">{bem.numero_serie || "—"}</InfoItem>
                    <InfoItem icon={Package} label="Especificação">{bem.especificacao || "—"}</InfoItem>
                    {bem.subcategoria && (
                      <InfoItem icon={Tag} label="Subcategoria">
                        <span className="capitalize">{bem.subcategoria.replace(/_/g, " ")}</span>
                      </InfoItem>
                    )}
                  </CardContent>
                </Card>

                {/* Informações Financeiras */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Informações Financeiras</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <InfoItem icon={DollarSign} label="Valor de Aquisição">{formatCurrency(bem.valor_aquisicao)}</InfoItem>
                    <InfoItem icon={DollarSign} label="Valor Líquido">{formatCurrency(bem.valor_liquido)}</InfoItem>
                    <InfoItem icon={DollarSign} label="Valor Residual">{formatCurrency(bem.valor_residual)}</InfoItem>
                    <InfoItem icon={DollarSign} label="Depreciação Acumulada">{formatCurrency(bem.depreciacao_acumulada)}</InfoItem>
                    <InfoItem icon={Calendar} label="Vida Útil">
                      {bem.vida_util_anos ? `${bem.vida_util_anos} anos` : "—"}
                    </InfoItem>
                  </CardContent>
                </Card>

                {/* Aquisição */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Dados de Aquisição</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <InfoItem icon={Calendar} label="Data de Aquisição">{formatDate(bem.data_aquisicao)}</InfoItem>
                    <InfoItem icon={Tag} label="Forma de Aquisição">
                      <span className="capitalize">{bem.forma_aquisicao?.replace(/_/g, " ") || "—"}</span>
                    </InfoItem>
                    <InfoItem icon={FileText} label="Nota Fiscal">{bem.nota_fiscal || "—"}</InfoItem>
                    <InfoItem icon={Calendar} label="Data Nota Fiscal">{formatDate(bem.data_nota_fiscal)}</InfoItem>
                    <InfoItem icon={Building2} label="Fornecedor">
                      {bem.fornecedor?.razao_social || bem.fornecedor_cnpj_cpf || "—"}
                    </InfoItem>
                    <InfoItem icon={Calendar} label="Garantia até">{formatDate(bem.garantia_ate)}</InfoItem>
                  </CardContent>
                </Card>

                {/* Responsabilidade */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Responsabilidade</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <InfoItem icon={User} label="Responsável">
                      {bem.responsavel?.nome_completo || "—"}
                    </InfoItem>
                    <InfoItem icon={Tag} label="Cargo Responsável">{bem.cargo_responsavel || "—"}</InfoItem>
                    <InfoItem icon={Calendar} label="Data Atribuição">{formatDate(bem.data_atribuicao_responsabilidade)}</InfoItem>
                    <InfoItem icon={FileText} label="Processo SEI">{bem.processo_sei || "—"}</InfoItem>
                    {bem.patrimonio_anterior && (
                      <InfoItem icon={Hash} label="Tombamento anterior">
                        <span className="font-mono">{bem.patrimonio_anterior}</span>
                      </InfoItem>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Observações */}
              {bem.observacao && (
                <motion.div {...fadeIn} className="mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{bem.observacao}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* Tab: Localização */}
            <TabsContent value="localizacao" className="mt-0">
              <motion.div initial="initial" animate="animate" variants={stagger}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Localização do Bem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-x-8 divide-y md:divide-y-0 divide-border">
                      <div className="divide-y divide-border">
                        <InfoItem icon={Building2} label="Unidade Local">
                          {bem.unidade_local?.nome_unidade || "—"}
                        </InfoItem>
                        <InfoItem icon={Hash} label="Código Unidade">
                          {bem.unidade_local?.codigo_unidade || "—"}
                        </InfoItem>
                        <InfoItem icon={MapPin} label="Município">
                          {bem.unidade_local?.municipio || "—"}
                        </InfoItem>
                        <InfoItem icon={Building2} label="Prédio">{bem.predio || "—"}</InfoItem>
                      </div>
                      <div className="divide-y divide-border">
                        <InfoItem icon={MapPin} label="Andar">{bem.andar || "—"}</InfoItem>
                        <InfoItem icon={MapPin} label="Sala">{bem.sala || "—"}</InfoItem>
                        <InfoItem icon={MapPin} label="Localização Específica">{bem.localizacao_especifica || "—"}</InfoItem>
                        <InfoItem icon={MapPin} label="Ponto Específico">{bem.ponto_especifico || "—"}</InfoItem>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code / Identificação */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Identificação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-x-8 divide-y md:divide-y-0 divide-border">
                      <div className="divide-y divide-border">
                        <InfoItem icon={QrCode} label="Código QR">{bem.codigo_qr || "—"}</InfoItem>
                      </div>
                      <div className="divide-y divide-border">
                        <InfoItem icon={Hash} label="Nº Patrimônio">
                          <span className="font-mono">{bem.numero_patrimonio}</span>
                        </InfoItem>
                        {bem.patrimonio_anterior && (
                          <InfoItem icon={Hash} label="Tombamento anterior">
                            <span className="font-mono">{bem.patrimonio_anterior}</span>
                          </InfoItem>
                        )}
                      </div>
                    </div>
                    <EtiquetaQr bem={bem} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Histórico de Eventos</CardTitle>
                  <CardDescription>Timeline de movimentações e alterações do bem</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistorico ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : historico && historico.length > 0 ? (
                    <motion.div initial="initial" animate="animate" variants={stagger}>
                      {historico.map((evento: any, index: number) => (
                        <TimelineEvent
                          key={evento.id}
                          evento={evento}
                          isLast={index === historico.length - 1}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <EmptyState icone={History} titulo="Nenhum evento registrado para este bem." className="py-8" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Documentos Associados</CardTitle>
                  <CardDescription>Termos, laudos e fotos vinculados ao bem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bem.termo_responsabilidade_url && (
                      <a
                        href={bem.termo_responsabilidade_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">Termo de Responsabilidade</p>
                          <p className="text-xs text-muted-foreground">Documento vinculado</p>
                        </div>
                      </a>
                    )}
                    {bem.foto_bem_url && (
                      <a
                        href={bem.foto_bem_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <ImageIcon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">Foto do Bem</p>
                          <p className="text-xs text-muted-foreground">Imagem vinculada</p>
                        </div>
                      </a>
                    )}
                    {bem.foto_etiqueta_qr_url && (
                      <a
                        href={bem.foto_etiqueta_qr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <QrCode className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">Foto Etiqueta QR</p>
                          <p className="text-xs text-muted-foreground">Imagem vinculada</p>
                        </div>
                      </a>
                    )}
                  </div>
                  {!bem.termo_responsabilidade_url && !bem.foto_bem_url && !bem.foto_etiqueta_qr_url && (
                    <EmptyState icone={FileText} titulo="Nenhum documento vinculado a este bem." className="py-8" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Auditoria footer */}
          <motion.div {...fadeIn} className="mt-8 pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {bem.created_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Criado em {formatDate(bem.created_at?.split("T")[0])}
                </span>
              )}
              {bem.updated_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Atualizado em {formatDate(bem.updated_at?.split("T")[0])}
                </span>
              )}
            </div>
          </motion.div>
        </section>
      </motion.div>
    </ModuleLayout>
  );
}
