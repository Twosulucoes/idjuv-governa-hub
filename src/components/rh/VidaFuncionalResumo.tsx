/**
 * Cards de Resumo Situacional do Servidor
 * Consolidado: lê vínculos ativos da tabela vinculos_servidor (fonte única)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2,
  Building2,
  ArrowLeftRight,
  UserCheck,
  Briefcase,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  useVinculosServidor,
  TIPO_VINCULO_LABELS,
  TIPO_DERIVADO_COLORS,
} from "@/hooks/useVinculosServidor";

interface VidaFuncionalResumoProps {
  servidorId: string;
}

interface ResumoCard {
  icon: React.ReactNode;
  titulo: string;
  subtitulo?: string;
  detalhe?: string;
  data?: string;
  ativo: boolean;
  cor: string;
}

export function VidaFuncionalResumo({ servidorId }: VidaFuncionalResumoProps) {
  const { data: vinculos = [], isLoading: loadingVinculos } = useVinculosServidor(servidorId);

  // Cessão ativa (cessões ficam em tabela própria ainda)
  const { data: cessaoAtiva, isLoading: loadingCes } = useQuery({
    queryKey: ["cessao-ativa-resumo", servidorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("cessoes")
        .select("id, tipo, orgao_origem, orgao_destino, data_inicio, data_fim")
        .eq("servidor_id", servidorId)
        .eq("ativa", true)
        .maybeSingle();
      return data;
    },
  });

  // Designação ativa
  const { data: designacaoAtiva, isLoading: loadingDes } = useQuery({
    queryKey: ["designacao-ativa-resumo", servidorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("designacoes")
        .select(`
          id, data_inicio, data_fim, status,
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .eq("status", "aprovada")
        .eq("ativo", true)
        .maybeSingle();
      return data;
    },
  });

  const isLoading = loadingVinculos || loadingCes || loadingDes;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const vinculosAtivos = vinculos.filter(v => v.ativo);
  
  // Vínculo principal (cargo): primeiro ativo com cargo
  const vinculoPrincipal = vinculosAtivos.find(v => v.cargo_id) || vinculosAtivos[0];
  
  // Lotação: derivada do vínculo principal
  const lotacao = vinculoPrincipal?.unidade;

  const cards: ResumoCard[] = [
    {
      icon: <Link2 className="h-5 w-5" />,
      titulo: "Vínculo",
      subtitulo: vinculoPrincipal
        ? TIPO_VINCULO_LABELS[vinculoPrincipal.tipo]
        : "Sem vínculo ativo",
      detalhe: vinculoPrincipal?.cargo
        ? (vinculoPrincipal.cargo.sigla || vinculoPrincipal.cargo.nome)
        : undefined,
      data: vinculoPrincipal?.data_inicio
        ? `Desde ${format(new Date(vinculoPrincipal.data_inicio + "T00:00:00"), "dd/MM/yyyy")}`
        : undefined,
      ativo: !!vinculoPrincipal,
      cor: vinculoPrincipal ? "border-success/40 bg-success/5" : "border-muted bg-muted/20",
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      titulo: "Lotação",
      subtitulo: lotacao
        ? (lotacao.sigla || lotacao.nome)
        : "Sem lotação ativa",
      detalhe: vinculoPrincipal?.cargo
        ? (vinculoPrincipal.cargo.sigla || vinculoPrincipal.cargo.nome)
        : undefined,
      data: vinculoPrincipal?.data_inicio
        ? `Desde ${format(new Date(vinculoPrincipal.data_inicio + "T00:00:00"), "dd/MM/yyyy")}`
        : undefined,
      ativo: !!lotacao,
      cor: lotacao ? "border-primary/40 bg-primary/5" : "border-muted bg-muted/20",
    },
    {
      icon: <ArrowLeftRight className="h-5 w-5" />,
      titulo: "Cessão",
      subtitulo: cessaoAtiva
        ? cessaoAtiva.tipo === "entrada"
          ? `De: ${cessaoAtiva.orgao_origem || "—"}`
          : `Para: ${cessaoAtiva.orgao_destino || "—"}`
        : "Sem cessão ativa",
      detalhe: cessaoAtiva
        ? cessaoAtiva.tipo === "entrada" ? "Cessão de Entrada" : "Cessão de Saída"
        : undefined,
      data: cessaoAtiva?.data_inicio
        ? `Desde ${format(new Date(cessaoAtiva.data_inicio), "dd/MM/yyyy")}`
        : undefined,
      ativo: !!cessaoAtiva,
      cor: cessaoAtiva ? "border-warning/40 bg-warning/5" : "border-muted bg-muted/20",
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      titulo: "Designação",
      subtitulo: designacaoAtiva
        ? (designacaoAtiva.unidade_destino as any)?.sigla || (designacaoAtiva.unidade_destino as any)?.nome || "Unidade designada"
        : "Sem designação ativa",
      data: designacaoAtiva?.data_inicio
        ? `Desde ${format(new Date(designacaoAtiva.data_inicio), "dd/MM/yyyy")}`
        : undefined,
      ativo: !!designacaoAtiva,
      cor: designacaoAtiva ? "border-info/40 bg-info/5" : "border-muted bg-muted/20",
    },
  ];

  // Se tem múltiplos vínculos ativos, mostrar badge
  const multiVinculos = vinculosAtivos.length > 1;

  return (
    <div className="space-y-2">
      {multiVinculos && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {vinculosAtivos.length} vínculos ativos
          </Badge>
          <span className="text-xs text-muted-foreground">
            {vinculosAtivos.map(v => TIPO_VINCULO_LABELS[v.tipo]).join(' + ')}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.titulo}
            className={`rounded-lg border-2 p-4 transition-colors ${card.cor}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={card.ativo ? "text-foreground" : "text-muted-foreground"}>
                {card.icon}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.titulo}
              </span>
              {card.ativo ? (
                <Badge variant="outline" className="ml-auto text-[10px] bg-success/10 text-success border-success/30">
                  Ativo
                </Badge>
              ) : (
                <AlertCircle className="h-3.5 w-3.5 ml-auto text-muted-foreground/50" />
              )}
            </div>
            <p className={`text-sm font-medium truncate ${card.ativo ? "text-foreground" : "text-muted-foreground"}`}>
              {card.subtitulo}
            </p>
            {card.detalhe && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Briefcase className="h-3 w-3" />
                {card.detalhe}
              </p>
            )}
            {card.data && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {card.data}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
