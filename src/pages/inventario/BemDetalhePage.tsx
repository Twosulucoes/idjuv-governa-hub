/**
 * DETALHE DO BEM PATRIMONIAL
 * Visualização completa de um bem específico — layout modernizado com abas
 */

import { Link, useParams } from "react-router-dom";
import { 
  Package, ArrowLeft, Edit, MapPin, User, Calendar, 
  Hash, Tag, Wrench, FileText, Clock, Building2, 
  DollarSign, QrCode, Shield, ChevronRight, Truck,
  Info, History, Image as ImageIcon
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBemPatrimonial, useHistoricoPatrimonio } from "@/hooks/usePatrimonio";
import { motion } from "framer-motion";

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

function SituacaoBadge({ situacao }: { situacao: string | null }) {
  const label = situacao || "Cadastrado";
  const colorMap: Record<string, string> = {
    ativo: "bg-success/15 text-success border-success/30",
    em_uso: "bg-success/15 text-success border-success/30",
    disponivel: "bg-info/15 text-info border-info/30",
    manutencao: "bg-warning/15 text-warning border-warning/30",
    baixado: "bg-destructive/15 text-destructive border-destructive/30",
    inservivel: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const cls = colorMap[label.toLowerCase()] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`${cls} capitalize font-medium text-xs px-2.5 py-0.5`}>
      {label.replace(/_/g, " ")}
    </Badge>
  );
}

function ConservacaoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-muted-foreground">—</span>;
  const colorMap: Record<string, string> = {
    bom: "bg-success/15 text-success border-success/30",
    regular: "bg-warning/15 text-warning border-warning/30",
    ruim: "bg-destructive/15 text-destructive border-destructive/30",
    inservivel: "bg-destructive/15 text-destructive border-destructive/30",
    otimo: "bg-success/15 text-success border-success/30",
  };
  const cls = colorMap[estado.toLowerCase()] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`${cls} capitalize font-medium text-xs`}>
      {estado.replace(/_/g, " ")}
    </Badge>
  );
}

function InfoItem({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <motion.div {...fadeIn} className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
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
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-6">
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

function TimelineEvent({ evento, isLast }: { evento: any; isLast: boolean }) {
  const iconMap: Record<string, any> = {
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
          <Icon className="h-3.5 w-3.5 text-primary" />
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
            <MapPin className="h-3 w-3" />
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
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto border-dashed">
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Bem não encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">O item solicitado não existe ou foi removido.</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/inventario/bens">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar à listagem
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      <motion.div initial="initial" animate="animate" variants={stagger}>
        {/* Breadcrumb + Header */}
        <section className="border-b bg-card">
          <div className="container mx-auto px-4 md:px-6 py-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Link to="/inventario" className="hover:text-foreground transition-colors">Inventário</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/inventario/bens" className="hover:text-foreground transition-colors">Bens</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{bem.numero_patrimonio || "Detalhe"}</span>
            </nav>

            {/* Title row */}
            <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-tight truncate">
                    {bem.descricao}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-muted-foreground font-mono">
                      {bem.numero_patrimonio}
                    </span>
                    <SituacaoBadge situacao={bem.situacao} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/inventario/bens">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Voltar
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to={`/inventario/bens/${bem.id}/editar`}>
                    <Edit className="w-4 h-4 mr-1.5" />
                    Editar
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Summary cards */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <motion.div {...fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border shadow-none bg-card">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Valor Aquisição</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(bem.valor_aquisicao)}</p>
                </CardContent>
              </Card>
              <Card className="border shadow-none bg-card">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Data Aquisição</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{formatDate(bem.data_aquisicao)}</p>
                </CardContent>
              </Card>
              <Card className="border shadow-none bg-card">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Conservação</span>
                  </div>
                  <div className="mt-1">
                    <ConservacaoBadge estado={bem.estado_conservacao} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-none bg-card">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Categoria</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground capitalize mt-1">
                    {bem.categoria_bem?.replace(/_/g, " ") || "—"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="container mx-auto px-4 md:px-6 py-6">
          <Tabs defaultValue="geral" className="space-y-5">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="geral" className="text-xs sm:text-sm gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="localizacao" className="text-xs sm:text-sm gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Localização
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs sm:text-sm gap-1.5">
                <History className="h-3.5 w-3.5" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm gap-1.5">
                <FileText className="h-3.5 w-3.5" />
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
                      <InfoItem icon={Hash} label="Patrimônio Anterior">{bem.patrimonio_anterior}</InfoItem>
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
                      </div>
                    </div>
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
                    <div className="py-8 text-center">
                      <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <History className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhum evento registrado para este bem.</p>
                    </div>
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
                        <FileText className="h-5 w-5 text-primary shrink-0" />
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
                        <ImageIcon className="h-5 w-5 text-primary shrink-0" />
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
                        <QrCode className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">Foto Etiqueta QR</p>
                          <p className="text-xs text-muted-foreground">Imagem vinculada</p>
                        </div>
                      </a>
                    )}
                  </div>
                  {!bem.termo_responsabilidade_url && !bem.foto_bem_url && !bem.foto_etiqueta_qr_url && (
                    <div className="py-8 text-center">
                      <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhum documento vinculado a este bem.</p>
                    </div>
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
                  <Clock className="h-3 w-3" />
                  Criado em {formatDate(bem.created_at?.split("T")[0])}
                </span>
              )}
              {bem.updated_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
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
